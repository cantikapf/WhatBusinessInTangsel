// Gate 4 browser QA — docs/PUBLICATION_PLAN.md § Gate 4 pass criteria.
// Checks: desktop + mobile, keyboard, dark mode, map, chart, comparison, download, zero console errors.
//
// Needs playwright + a chromium build. It is deliberately NOT a devDependency:
//   mkdir -p ../qa && cd ../qa && npm i -D playwright && npx playwright install chromium
//   cp ../tests/browser/qa.js . && node qa.js
// Then serve the built app first:  npm run build && npx next start -p 3111
const { chromium } = require('playwright');

const URL = process.env.QA_URL || 'http://localhost:3111/';
const results = [];
const ok = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

(async () => {
  const browser = await chromium.launch();

  // ---------- DESKTOP ----------
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));

  await page.goto(URL, { waitUntil: 'networkidle' });

  ok('title benar', (await page.title()).includes('WhatBusinessInTangsel'), await page.title());
  ok('MethodPanel tampil', await page.locator('#method-panel').isVisible());
  ok('MethodPanel memuat sumber ODbL', (await page.locator('#method-panel').innerText()).includes('ODbL'));
  const bodyText = await page.locator('body').innerText();
  ok('badge header tidak lagi klaim "Data konsep — belum terverifikasi"', !bodyText.includes('Data konsep'));
  ok(
    'header menyatakan ini indeks relatif, bukan putusan layak',
    (await page.locator('header').innerText()).includes('Indeks relatif'),
  );
  ok(
    'halaman tidak membocorkan istilah internal (hash, gate, manifest)',
    !/SHA-256|docs\/gate|source_manifest/i.test(bodyText),
  );

  // Map + keyboard a11y. Leaflet draws the polygons after the tiles resolve, so
  // wait for them instead of racing the network-idle signal.
  await page
    .waitForFunction(() => document.querySelectorAll('#map path.leaflet-interactive').length === 7, null, {
      timeout: 15000,
    })
    .catch(() => {});
  const mapInfo = await page.evaluate(() => {
    const m = document.querySelector('#map');
    const paths = [...document.querySelectorAll('#map path.leaflet-interactive')];
    return {
      role: m && m.getAttribute('role'),
      label: m && m.getAttribute('aria-label'),
      paths: paths.length,
      tabbable: paths.filter((p) => p.getAttribute('tabindex') === '0').length,
      labelled: paths.filter((p) => (p.getAttribute('aria-label') || '').includes('Kecamatan')).length,
    };
  });
  ok('peta punya role/label', mapInfo.role === 'application' && !!mapInfo.label, JSON.stringify({ role: mapInfo.role }));
  ok('7 poligon kecamatan tergambar', mapInfo.paths === 7, `paths=${mapInfo.paths}`);
  ok('semua poligon punya tabindex=0', mapInfo.tabbable === 7, `tabbable=${mapInfo.tabbable}`);
  ok('semua poligon punya aria-label Kecamatan', mapInfo.labelled === 7, `labelled=${mapInfo.labelled}`);

  // Method figure: one plate visible, blocks per indicator, arrows step the case
  const figBefore = await page.locator('.method-figure-buttons span').innerText();
  const figInfo = await page.evaluate(() => {
    const fig = document.querySelector('.method-figure');
    const plates = [...fig.querySelectorAll('.iso-svg > g')];
    return {
      // All 21 plates are in the DOM; count the distinct indicator codes instead.
      blocks: new Set([...fig.querySelectorAll('[data-part]')].map((g) => g.dataset.part)).size,
      plates: plates.length,
      visible: plates.filter((g) => g.style.display !== 'none').length,
      label: fig.querySelector('.method-figure-readout')?.textContent || '',
    };
  });
  ok('figure metode punya 21 plate (7 kecamatan x 3 sektor)', figInfo.plates === 21, `plates=${figInfo.plates}`);
  ok('figure hanya menampilkan satu plate', figInfo.visible === 1, `visible=${figInfo.visible}`);
  ok('figure memuat satu blok per indikator', figInfo.blocks === 6, `blocks=${figInfo.blocks}`);
  await page.locator('.method-figure-buttons button').nth(1).click();
  await page.waitForTimeout(200);
  const figAfter = await page.locator('.method-figure-buttons span').innerText();
  ok('tombol panah mengganti kasus figure', figBefore !== figAfter, `${figBefore} -> ${figAfter}`);

  // Keyboard path: focus a polygon, press Enter, expect analysis to run
  const firstPath = page.locator('#map path.leaflet-interactive').first();
  await firstPath.focus();
  const focusedIsPath = await page.evaluate(
    () => document.activeElement && document.activeElement.tagName.toLowerCase() === 'path'
  );
  ok('poligon bisa difokus keyboard', focusedIsPath);

  // Select sector + kecamatan via the real form, then submit
  await page.selectOption('#sector-select', 'retail');
  await page.selectOption('#subdistrict-select', 'serpong');
  await page.click('#submit-btn');
  await page.waitForFunction(
    () => (document.querySelector('#composite-score') || {}).textContent !== '-'
  );
  const score = (await page.locator('#composite-score').innerText()).trim();
  const label = (await page.locator('#score-label').innerText()).trim();
  ok('skor komposit terhitung', /^\d+\.\d$/.test(score), `score=${score} label=${label}`);
  ok('label memakai kosakata indeks, bukan vonis',
    ['Sangat Rendah', 'Rendah', 'Cukup', 'Baik', 'Sangat Baik'].includes(label), label);
  ok('tidak ada error box saat input valid', (await page.locator('#analysis-error').count()) === 0);
  ok('tidak ada teks vonis "Tidak Layak"', !(await page.locator('body').innerText()).includes('Tidak Layak'));

  // Charts render
  const charts = await page.evaluate(() => {
    const ids = ['competitors-bar-chart', 'demographics-pie-chart'];
    return ids.map((id) => {
      const c = document.getElementById(id);
      if (!c) return { id, present: false };
      return { id, present: true, w: c.width, h: c.height };
    });
  });
  ok('bar chart + doughnut chart tergambar',
    charts.every((c) => c.present && c.w > 0 && c.h > 0), JSON.stringify(charts));

  // Comparison: 3 allowed, 4th rejected with role=alert
  const list = ['serpong', 'setu', 'pamulang'];
  for (let i = 0; i < list.length; i++) {
    await page.selectOption('#subdistrict-select', list[i]);
    await page.click('#submit-btn');
    await page.click('#add-to-comparison');
    await page.waitForTimeout(120);
  }
  const rows = await page.locator('#comparison-table tbody tr').count();
  ok('3 kecamatan masuk tabel perbandingan', rows === 3, `rows=${rows}`);
  await page.locator('#radar-canvas, canvas').first().waitFor({ state: 'attached' }).catch(() => {});

  await page.selectOption('#subdistrict-select', 'ciputat');
  await page.click('#submit-btn');
  await page.click('#add-to-comparison');
  const alertBox = page.locator('#comparison-error');
  const alertVisible = await alertBox.isVisible();
  const alertRole = await alertBox.getAttribute('role');
  ok('kecamatan ke-4 ditolak', alertVisible, await alertBox.innerText().catch(() => ''));
  ok('error box punya role="alert"', alertRole === 'alert', `role=${alertRole}`);

  // Clear
  await page.click('#clear-comparison');
  ok('Hapus Semua mengosongkan tabel',
    (await page.locator('#comparison-table tbody').innerText()).includes('Belum ada lokasi'));

  // Validation error path (role=alert on FilterForm)
  await page.reload({ waitUntil: 'networkidle' });
  await page.click('#submit-btn');
  const vErr = page.locator('#validation-error');
  ok('validasi sektor kosong muncul', await vErr.isVisible());
  ok('validasi punya role="alert"', (await vErr.getAttribute('role')) === 'alert');

  // Dark mode
  const wasDark = await page.evaluate(() => document.documentElement.classList.contains('dark-mode'));
  await page.click('#dark-mode-toggle');
  const nowDark = await page.evaluate(() => document.documentElement.classList.contains('dark-mode'));
  ok('dark mode toggle mengubah root class', wasDark !== nowDark, `${wasDark} -> ${nowDark}`);
  await page.reload({ waitUntil: 'networkidle' });
  ok('dark mode persist setelah reload',
    (await page.evaluate(() => document.documentElement.classList.contains('dark-mode'))) === nowDark);

  // Dark mode must actually repaint surfaces, not just set a class
  const darkSurfaces = await page.evaluate(() => {
    const stage = document.querySelector('.method-figure-stage');
    const fill = document.querySelector('.method-figure .iso-fill');
    const notice = document.querySelector('[class*="amber-50"]');
    const zoom = document.querySelector('#map .leaflet-control-zoom a');
    return {
      stage: stage ? getComputedStyle(stage).backgroundImage : '',
      figureFill: fill ? getComputedStyle(fill).fill : '',
      notice: notice ? getComputedStyle(notice).backgroundColor : '',
      zoom: zoom ? getComputedStyle(zoom).backgroundColor : '',
    };
  });
  const luminance = (rgb) => {
    const v = (rgb.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    return v.length === 3 ? (0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]) / 255 : 1;
  };
  ok('figure tidak putih di dark mode', luminance(darkSurfaces.figureFill) < 0.35, darkSurfaces.figureFill);
  ok('callout amber tidak krem di dark mode', luminance(darkSurfaces.notice) < 0.4, darkSurfaces.notice);
  ok('kontrol zoom Leaflet tidak putih di dark mode', luminance(darkSurfaces.zoom) < 0.35, darkSurfaces.zoom);

  await page.click('#dark-mode-toggle'); // restore light

  // Download link
  const dl = page.locator('a[href="/dataset_penduduk_tangsel.csv"]');
  ok('link unduh CSV ada', (await dl.count()) === 1);
  const [download] = await Promise.all([page.waitForEvent('download'), dl.click()]);
  const dlPath = await download.path();
  const fs = require('fs');
  const csv = fs.readFileSync(dlPath, 'utf8');
  ok('CSV terunduh & berisi 7 kecamatan', csv.split(/\r?\n/).filter(Boolean).length === 8,
    `${csv.split(/\r?\n/).filter(Boolean).length} baris`);

  ok('tanpa console error (desktop)', errs.length === 0, errs.slice(0, 3).join(' | '));

  // Basemap tiles must be real imagery. CARTO started answering keyless requests
  // with an "API KEY REQUIRED" placeholder, which silently blanked the map.
  const failedTiles = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('#map img.leaflet-tile')];
    return {
      total: imgs.length,
      broken: imgs.filter((i) => !i.complete || i.naturalWidth === 0).length,
      host: imgs[0] ? new URL(imgs[0].src).host : null,
    };
  });
  ok('tile basemap termuat', failedTiles.total > 0 && failedTiles.broken === 0, JSON.stringify(failedTiles));
  ok('tile basemap bukan placeholder ber-key', failedTiles.host === 'tile.openstreetmap.org', `host=${failedTiles.host}`);

  // ---------- MOBILE ----------
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mpage = await mctx.newPage();
  const merrs = [];
  mpage.on('console', (m) => { if (m.type() === 'error') merrs.push(m.text()); });
  mpage.on('pageerror', (e) => merrs.push('pageerror: ' + e.message));
  await mpage.goto(URL, { waitUntil: 'networkidle' });
  const overflow = await mpage.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  ok('mobile tanpa overflow horizontal', overflow <= 1, `overflow=${overflow}px`);
  ok('mobile: filter form terlihat', await mpage.locator('#sector-select').isVisible());
  ok('mobile: peta terlihat', await mpage.locator('#map').isVisible());
  await mpage.selectOption('#sector-select', 'health');
  await mpage.selectOption('#subdistrict-select', 'ciputat_timur');
  await mpage.click('#submit-btn');
  await mpage.waitForFunction(() => (document.querySelector('#composite-score') || {}).textContent !== '-');
  ok('mobile: alur analisis berfungsi',
    /^\d+\.\d$/.test((await mpage.locator('#composite-score').innerText()).trim()));
  ok('tanpa console error (mobile)', merrs.length === 0, merrs.slice(0, 3).join(' | '));

  // Keyboard focus ring: Tailwind preflight strips the UA outline, so every
  // interactive surface needs an explicit one. Tabbing is the only honest test.
  const ringFor = async (page, expected) => {
    // start from the top of the tab order, not wherever a previous click left focus
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    const stops = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(420); // transition:all must settle first
      stops.push(
        await page.evaluate(() => {
          const el = document.activeElement;
          const c = getComputedStyle(el);
          return {
            el: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}`,
            ring: `${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor}`,
          };
        })
      );
    }
    // Tab can round-trip through browser chrome and land back on <body>; that is
    // not an app surface, so it has no ring by design.
    const wrong = stops.filter(
      (s) => !['body', 'html'].includes(s.el) && s.ring !== `solid 2px ${expected}`
    );
    return { total: stops.length, wrong };
  };

  const lightRings = await ringFor(page, 'rgb(79, 70, 229)');
  ok('focus ring indigo di semua stop (light)', lightRings.wrong.length === 0,
    lightRings.wrong.map((w) => `${w.el}=${w.ring}`).join(' | '));

  // mpage is a separate light page; put the desktop page back into dark for the
  // dark ring, then restore light so nothing downstream inherits the theme.
  const beforeDark = await page.evaluate(() => document.documentElement.classList.contains('dark-mode'));
  if (!beforeDark) { await page.click('#dark-mode-toggle'); await page.waitForTimeout(400); }
  const darkRings = await ringFor(page, 'rgb(165, 180, 252)');
  ok('focus ring lavender di semua stop (dark)', darkRings.wrong.length === 0,
    darkRings.wrong.map((w) => `${w.el}=${w.ring}`).join(' | '));
  if (!beforeDark) { await page.click('#dark-mode-toggle'); await page.waitForTimeout(300); }

  await browser.close();

  const failed = results.filter((r) => !r.pass);
  console.log(`\n=== QA RESULT: ${results.length - failed.length}/${results.length} checks passed ===`);
  if (failed.length) {
    console.log('FAILED:');
    failed.forEach((f) => console.log(` - ${f.name}${f.detail ? ' :: ' + f.detail : ''}`));
    process.exit(1);
  }
  console.log('ALL BROWSER QA CHECKS PASSED');
})().catch((e) => {
  console.error('QA SCRIPT ERROR:', e.message);
  process.exit(2);
});
