const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'src', 'data', 'geojson');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Target file path
const destPath = path.join(targetDir, 'tangsel_subdistricts.json');

// Source file candidate paths
const paths = [
  // If next.js project is at D:\PERSONAL PROJECT\tangsel_bisnis_v2
  path.join(__dirname, '..', 'tangsel_bisnis_dashboard', 'src', 'js', 'data', 'geojson', 'tangsel_subdistricts.json'),
  // If next.js project is inside D:\PERSONAL PROJECT\tangsel_bisnis_dashboard\tangsel_bisnis_v2
  path.join(__dirname, '..', 'src', 'js', 'data', 'geojson', 'tangsel_subdistricts.json'),
  // Absolute fallback path
  'D:\\PERSONAL PROJECT\\tangsel_bisnis_dashboard\\src\\js\\data\\geojson\\tangsel_subdistricts.json'
];

if (fs.existsSync(destPath)) {
  console.log('GeoJSON already exists at destination, skipping copy.');
  process.exit(0);
}

let copied = false;
for (const src of paths) {
  if (fs.existsSync(src)) {
    try {
      fs.copyFileSync(src, destPath);
      console.log(`Successfully copied GeoJSON from ${src} to ${destPath}`);
      copied = true;
      break;
    } catch (err) {
      console.error(`Failed to copy from ${src}:`, err.message);
    }
  }
}

if (!copied) {
  console.error('ERROR: Could not locate source GeoJSON subdistrict boundary file.');
  process.exit(1);
}
