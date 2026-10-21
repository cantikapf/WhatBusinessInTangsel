#!/usr/bin/env node
/**
 * Gate 1: ambil batas administrasi resmi-berlisensi dari OSM (admin_level=6, ODbL)
 * sebagai pengganti `src/data/geojson/tangsel_subdistricts.json` yang provenance-nya
 * tidak tercatat (berasal dari KMZ tanpa metadata sumber/lisensi).
 *
 * Output:
 *   docs/gate1/osm_boundaries.geojson  — FeatureCollection, 7 Polygon/MultiPolygon
 *   docs/gate1/osm_boundaries_meta.json — relasi, snapshot, lisensi, luas hitung
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

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
const NAME = {
  ciputat: 'Ciputat',
  ciputat_timur: 'Ciputat Timur',
  pamulang: 'Pamulang',
  pondok_aren: 'Pondok Aren',
  serpong: 'Serpong',
  serpong_utara: 'Serpong Utara',
  setu: 'Setu',
};

const CACHE = path.join(__dirname, 'raw_osm_boundaries');
const R = 6371.0088;
const rad = Math.PI / 180;

// Luas spherical sederhana (equirectangular, akurasi ~0,1% pada skala kabupaten)
function ringAreaKm2(ring) {
  let s = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    s += (x2 - x1) * rad * (2 + Math.sin(y1 * rad) + Math.sin(y2 * rad));
  }
  return Math.abs((s * R * R) / 2);
}

function geomAreaKm2(geom) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  let t = 0;
  for (const poly of polys) {
    // ring[0] = outer, sisanya hole
    t += ringAreaKm2(poly[0]);
    for (let i = 1; i < poly.length; i++) t -= ringAreaKm2(poly[i]);
  }
  return t;
}

// Gabungkan way bertanda 'outer'/'inner' menjadi ring tertutup.
function assemble(rel) {
  const ways = rel.members.filter((m) => m.type === 'way' && m.geometry);
  const outers = ways.filter((m) => m.role !== 'inner').map((m) => m.geometry.map((p) => [p.lon, p.lat]));
  const inners = ways.filter((m) => m.role === 'inner').map((m) => m.geometry.map((p) => [p.lon, p.lat]));

  const stitch = (segments) => {
    const rings = [];
    const pool = segments.map((s) => s.slice());
    while (pool.length) {
      let cur = pool.shift();
      let changed = true;
      while (changed) {
        changed = false;
        const tail = cur[cur.length - 1];
        for (let i = 0; i < pool.length; i++) {
          const seg = pool[i];
          const a = seg[0];
          const b = seg[seg.length - 1];
          const same = (p, q) => p[0] === q[0] && p[1] === q[1];
          if (same(tail, a)) {
            cur = cur.concat(seg.slice(1));
            pool.splice(i, 1);
            changed = true;
            break;
          }
          if (same(tail, b)) {
            cur = cur.concat(seg.slice().reverse().slice(1));
            pool.splice(i, 1);
            changed = true;
            break;
          }
        }
      }
      if (cur.length > 3 && cur[0][0] === cur[cur.length - 1][0] && cur[0][1] === cur[cur.length - 1][1]) {
        rings.push(cur);
      }
    }
    return rings;
  };

  return { outers: stitch(outers), inners: stitch(inners) };
}

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

(async () => {
  fs.mkdirSync(CACHE, { recursive: true });
  const features = [];
  const meta = {
    source: 'OpenStreetMap, Overpass API',
    license: 'ODbL 1.0 (Open Database License) — © OpenStreetMap contributors',
    admin_level: 6,
    retrieved: new Date().toISOString().slice(0, 10),
    query_endpoint: 'https://overpass-api.de/api/interpreter',
    by_kecamatan: {},
  };
  let areaTotal = 0;

  for (const [kec, id] of Object.entries(REL)) {
    const q = `[out:json][timeout:180];rel(${id});out geom;`;
    const cachePath = path.join(CACHE, `${kec}.json`);
    let res = null;
    if (fs.existsSync(cachePath)) {
      res = { status: 200, body: fs.readFileSync(cachePath, 'utf8') };
    }
    for (let attempt = 1; res === null && attempt <= 4; attempt++) {
      try {
        res = await post(q);
        if (res.status === 200 && res.body.trim().startsWith('{')) break;
        console.error(`  ${kec}: attempt ${attempt} http=${res.status}, retry`);
      } catch (e) {
        console.error(`  ${kec}: attempt ${attempt} ${e.message}, retry`);
      }
      res = null;
      await new Promise((r) => setTimeout(r, attempt * 20000));
    }
    if (!res) throw new Error(`${kec}: fetch gagal`);

    const j = JSON.parse(res.body);
    if (!fs.existsSync(cachePath)) fs.writeFileSync(cachePath, res.body);
    const rel = (j.elements || [])[0];
    if (!rel) throw new Error(`${kec}: relasi ${id} kosong`);

    const { outers, inners } = assemble(rel);
    if (!outers.length) throw new Error(`${kec}: tidak ada ring tertutup`);

    const geom =
      outers.length === 1
        ? { type: 'Polygon', coordinates: [outers[0], ...inners] }
        : { type: 'MultiPolygon', coordinates: outers.map((o) => [o, ...inners]) };

    const area = +geomAreaKm2(geom).toFixed(2);
    areaTotal += area;

    features.push({
      type: 'Feature',
      properties: { id: kec, name: NAME[kec], kabupaten: 'Kota Tangerang Selatan', osm_relation: id, area_km2: area },
      geometry: geom,
    });

    meta.by_kecamatan[kec] = {
      osm_relation: id,
      snapshot: j.osm3s ? j.osm3s.timestamp_osm_base : null,
      area_km2: area,
      rings: outers.length,
    };
    console.log(`  ${kec}: rel=${id} rings=${outers.length} area=${area} km2 snapshot=${meta.by_kecamatan[kec].snapshot}`);
  }

  meta.area_km2_total = +areaTotal.toFixed(2);
  fs.writeFileSync(
    path.join(__dirname, 'osm_boundaries.geojson'),
    JSON.stringify({ type: 'FeatureCollection', features }, null, 0) + '\n'
  );
  fs.writeFileSync(path.join(__dirname, 'osm_boundaries_meta.json'), JSON.stringify(meta, null, 2) + '\n');
  console.log(`\ntotal luas ${meta.area_km2_total} km2 (resmi Dukcapil 164,86 — deviasi ${(((meta.area_km2_total - 164.86) / 164.86) * 100).toFixed(2)}%)`);
})();
