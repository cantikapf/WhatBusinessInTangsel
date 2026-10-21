// Gate 1 probe: does the committed GeoJSON geometry actually match the area
// claimed in demographics.json / geojson properties?
// Approximate equal-area check on WGS84 using an equirectangular projection at
// the latitude of Tangsel (~-6.28). Good to ~0.1% at this scale, far tighter
// than the discrepancy we are testing for.
const g = require('./concept_data_archive/geojson/tangsel_subdistricts.json');
const d = require('./concept_data_archive/demographics.json');

const R = 6371.0088; // km
const lat0 = (-6.28 * Math.PI) / 180;

function ringAreaKm2(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [lon1, lat1] = ring[i];
    const [lon2, lat2] = ring[i + 1];
    const x1 = ((lon1 * Math.PI) / 180) * Math.cos(lat0) * R;
    const y1 = ((lat1 * Math.PI) / 180) * R;
    const x2 = ((lon2 * Math.PI) / 180) * Math.cos(lat0) * R;
    const y2 = ((lat2 * Math.PI) / 180) * R;
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum / 2);
}

function geomAreaKm2(geom) {
  if (geom.type === 'Polygon') return ringAreaKm2(geom.coordinates[0]);
  if (geom.type === 'MultiPolygon') {
    return geom.coordinates.reduce((s, poly) => s + ringAreaKm2(poly[0]), 0);
  }
  throw new Error('unexpected geometry type ' + geom.type);
}

let sumGeom = 0,
  sumClaim = 0,
  sumData = 0;
const rows = [];

for (const f of g.features) {
  const geomKm2 = geomAreaKm2(f.geometry);
  const claim = f.properties.area_km2;
  const dataArea = d[f.properties.id] ? d[f.properties.id].area : null;
  const dev = ((geomKm2 - claim) / claim) * 100;
  sumGeom += geomKm2;
  sumClaim += claim;
  sumData += dataArea || 0;
  rows.push({
    id: f.properties.id,
    geomType: f.geometry.type,
    vertices: f.geometry.type === 'Polygon' ? f.geometry.coordinates[0].length : null,
    geom_km2: +geomKm2.toFixed(2),
    props_km2: claim,
    data_km2: dataArea,
    dev_pct: +dev.toFixed(1),
  });
}
console.table(rows);
console.log('SUM geometry  =', sumGeom.toFixed(2), 'km2');
console.log('SUM props     =', sumClaim.toFixed(2), 'km2');
console.log('SUM demographics =', sumData.toFixed(2), 'km2');
console.log('Official (pemkot) area = 164.85 km2 (16.485,47 Ha)');
console.log('Deviation geometry vs official =', (((sumGeom - 164.8547) / 164.8547) * 100).toFixed(1) + '%');
