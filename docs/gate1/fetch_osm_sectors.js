#!/usr/bin/env node
/**
 * Gate 1: hitung POI per kecamatan untuk 3 sektor terpilih + anchor POI.
 * Satu query per kecamatan (bukan per sektor) lalu klasifikasi lokal, supaya
 * snapshot antar-sektor identik dan beban Overpass kecil.
 *
 * Definisi tag (dikunci di docs/gate1/ledger.md):
 *   retail    : shop in supermarket|convenience|minimarket|grocery|greengrocer
 *   health    : amenity in pharmacy|clinic|dentist|doctors
 *   education : amenity in school|university|college|language_school|kindergarten
 *   anchor    : railway=station | amenity=bus_station | shop=mall
 *
 * Output: docs/gate1/osm_sector_counts.json (+ raw per kecamatan di raw_osm_sectors/)
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT = path.join(__dirname, 'osm_sector_counts.json');
const RAWDIR = path.join(__dirname, 'raw_osm_sectors');
const UA = 'WhatBusinessInTangsel-portfolio-audit/1.0';
const REL = {
  ciputat: 10989408,
  ciputat_timur: 10989407,
  pamulang: 10989409,
  pondok_aren: 4448807,
  serpong: 10989422,
  serpong_utara: 10989417,
  setu: 10989433,
};

const SECTORS = {
  retail: { shop: /^(supermarket|convenience|minimarket|grocery|greengrocer)$/ },
  health: { amenity: /^(pharmacy|clinic|dentist|doctors)$/ },
  education: { amenity: /^(school|university|college|language_school|kindergarten)$/ },
  anchor: { any: true },
};

const Q = (area) => `[out:json][timeout:180];
(
  nwr["shop"~"^(supermarket|convenience|minimarket|grocery|greengrocer)$"](area:${area});
  nwr["amenity"~"^(pharmacy|clinic|dentist|doctors)$"](area:${area});
  nwr["amenity"~"^(school|university|college|language_school|kindergarten)$"](area:${area});
  nwr["railway"="station"](area:${area});
  nwr["amenity"="bus_station"](area:${area});
  nwr["shop"="mall"](area:${area});
);
out tags;`;

function post(body) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      'https://overpass-api.de/api/interpreter',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          'User-Agent': UA,
        },
      },
      (res) => {
        let s = '';
        res.on('data', (d) => (s += d));
        res.on('end', () => resolve({ status: res.statusCode, body: s }));
      }
    );
    req.on('error', reject);
    req.setTimeout(200000, () => req.destroy(new Error('timeout')));
    req.write('data=' + encodeURIComponent(body));
    req.end();
  });
}

const isAnchor = (t) => t.railway === 'station' || t.amenity === 'bus_station' || t.shop === 'mall';

function classify(tags) {
  const hit = [];
  for (const [name, def] of Object.entries(SECTORS)) {
    if (name === 'anchor') continue;
    if (def.shop && def.shop.test(tags.shop || '')) hit.push(name);
    if (def.amenity && def.amenity.test(tags.amenity || '')) hit.push(name);
  }
  if (isAnchor(tags)) hit.push('anchor');
  return hit;
}

(async () => {
  fs.mkdirSync(RAWDIR, { recursive: true });
  const out = {};
  for (const [kec, id] of Object.entries(REL)) {
    const area = 3600000000 + id;
    const cachePath = path.join(RAWDIR, `${kec}.json`);
    let res = null;
    if (fs.existsSync(cachePath)) {
      res = { status: 200, body: fs.readFileSync(cachePath, 'utf8') };
      console.log(`  ${kec}: pakai cache ${path.basename(cachePath)}`);
    }
    for (let attempt = 1; res === null && attempt <= 4; attempt++) {
      try {
        res = await post(Q(area));
        if (res.status === 200 && res.body.trim().startsWith('{')) break;
        console.error(`  ${kec}: attempt ${attempt} http=${res.status}, retry`);
      } catch (e) {
        console.error(`  ${kec}: attempt ${attempt} ${e.message}, retry`);
      }
      res = null;
      await new Promise((r) => setTimeout(r, attempt * 20000));
    }
    if (!res) {
      console.error(`  ${kec}: GAGAL, dilewati`);
      out[kec] = { osm_relation: id, error: 'fetch failed' };
      continue;
    }
    const j = JSON.parse(res.body);
    fs.writeFileSync(path.join(RAWDIR, `${kec}.json`), res.body);
    const count = { retail: 0, health: 0, education: 0, anchor: 0 };
    for (const el of j.elements || []) {
      for (const s of classify(el.tags || {})) count[s] += 1;
    }
    out[kec] = {
      osm_relation: id,
      snapshot: j.osm3s ? j.osm3s.timestamp_osm_base : null,
      elements_scanned: (j.elements || []).length,
      ...count,
    };
    console.log(
      `  ${kec}: retail=${count.retail} health=${count.health} education=${count.education} anchor=${count.anchor} (scanned ${out[kec].elements_scanned}, snapshot ${out[kec].snapshot})`
    );
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  console.log('wrote', OUT);
})();
