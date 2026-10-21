#!/usr/bin/env bash
# Gate 1: broader "FnB" POI count per kecamatan, matching the dashboard's own
# sector label "FnB (Kafe/Restoran/Warteg/Bakery)": amenity in
# cafe|restaurant|fast_food|bar|pub, plus shop=bakery.
# Use THIS when comparing against competitors.json fnb, not the cafe-only file.
set -u
OUT="docs/gate1/osm_fnb_counts.json"
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

read_count() {
  node -e "
let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
  try{const j=JSON.parse(s);const c=j.elements&&j.elements.find(e=>e.type==='count');
    if(c&&c.tags&&c.tags.total!==undefined){process.stdout.write(String(c.tags.total)+' '+j.osm3s.timestamp_osm_base)}
    else process.stdout.write('ERR')}catch(e){process.stdout.write('ERR')}});"
}


echo "{" > "$OUT"
first=1
for key in "${!REL[@]}"; do
  id=${REL[$key]}
  area=$((3600000000 + id))
  q="[out:json][timeout:120];(nwr[\"amenity\"~\"^(cafe|restaurant|fast_food|bar|pub)\$\"](area:$area);nwr[\"shop\"=\"bakery\"](area:$area););out count;"
  got=ERR
  ts=""
  for attempt in 1 2 3 4; do
    resp=$(curl -s --max-time 180 -H "Accept: application/json" -H "User-Agent: $UA" \
      --data-urlencode "data=$q" "$API")
    read -r got ts <<< "$(printf '%s' "$resp" | read_count)"
    if [ "$got" != "ERR" ] && [ -n "$got" ]; then break; fi
    echo "  $key: attempt $attempt failed, retrying..."
    sleep $((attempt * 20))
    got=ERR
    ts=""
  done
  echo "  $key: fnb_poi=$got snapshot=$ts"
  if [ $first -eq 1 ]; then first=0; else echo "," >> "$OUT"; fi
  printf '  "%s": {"osm_relation": %s, "fnb_poi": %s, "snapshot": "%s"}' \
    "$key" "$id" "$got" "$ts" >> "$OUT"
done
printf '\n}\n' >> "$OUT"
echo "wrote $OUT"
