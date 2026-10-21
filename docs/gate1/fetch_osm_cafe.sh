#!/usr/bin/env bash
# Gate 1: real POI counts for amenity=cafe per Tangsel kecamatan, straight from
# Overpass. Relation ids resolved in docs/gate1/ledger.md (admin_level=6, bbox
# query around Tangsel). Counts here are the *current* OSM snapshot, which is
# what the dashboard should be compared against.
set -u
OUT="docs/gate1/osm_cafe_counts.json"
UA="WhatBusinessInTangsel-portfolio-audit/1.0"
API="https://overpass-api.de/api/interpreter"

declare -A REL=(
  [ciputat]=10989408
  [ciputat_timur]=10989407
  [pamulang]=10989409
  [pondok_aren]=4448807
  [serpong]=10989422
  [serpong_utara]=10989417
  [setu]=10989433
)

echo "{" > "$OUT"
first=1
for key in "${!REL[@]}"; do
  id=${REL[$key]}
  area=$((3600000000 + id))
  q="[out:json][timeout:120];nwr[\"amenity\"=\"cafe\"](area:$area);out count;"
  resp=$(curl -s --max-time 150 -H "Accept: application/json" -H "User-Agent: $UA" \
    --data-urlencode "data=$q" "$API")
  total=$(printf '%s' "$resp" | node -e "
let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
  try{const j=JSON.parse(s);
    const c=j.elements && j.elements.find(e=>e.type==='count');
    process.stdout.write(c?String(c.tags.total):'ERR');
  }catch(e){process.stdout.write('ERR')}
});")
  ts=$(printf '%s' "$resp" | node -e "
let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
  try{process.stdout.write(JSON.parse(s).osm3s.timestamp_osm_base)}catch(e){process.stdout.write('')}
});")
  echo "  $key: osm_relation=$id cafe_count=$total snapshot=$ts"
  if [ $first -eq 1 ]; then first=0; else echo "," >> "$OUT"; fi
  printf '  "%s": {"osm_relation": %s, "amenity_cafe": %s, "snapshot": "%s"}' \
    "$key" "$id" "$total" "$ts" >> "$OUT"
done
printf '\n}\n' >> "$OUT"
echo "wrote $OUT"
