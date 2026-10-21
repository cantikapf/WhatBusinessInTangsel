# PROJECT.md — WhatBusinessInTangsel

State tracker. Read in BOOTSTRAP, update in SYNC STATE.

## Status

**Phase**: Gate 4 QA lulus (2026-10-20) + uji sensitivitas bobot dijalankan (2026-10-20, `docs/gate3/SENSITIVITY.md`). Masih pre-publication: bobot **tidak dapat dikalibrasi** tanpa data hasil usaha, sensitivitas terhadap galat data POI belum diuji, lisensi Dukcapil belum dikonfirmasi, deploy belum diotorisasi.

Publication path and gate criteria: `docs/PUBLICATION_PLAN.md`.

Live: https://whatbusinessintangsel.netlify.app/ · Repo: `origin/master`

## Verification gate (current, all green 2026-10-20)

| Gate | Command | Result |
|---|---|---|
| Lint | `npx next lint` | ✔ no warnings or errors |
| Type check | `npx tsc --noEmit` | ✔ clean |
| Engine | `npx tsx test-engine.js` | 15 passed, 0 failed (incl. 21/21 matrix, missing-data throws, determinism) |
| UI | `npx tsx --test tests/ui.test.js` | 9 subtests pass |
| Build | `npm run build` | ✓ compiled, 4 static pages, `/` = 171 kB First Load JS |
| Data pipeline | `npm run data:build` | QC 11/11 lulus, `verified_dataset.json` ditulis |
| Data QC selftest | `npm run data:qc` | 5/5 — 4 mutasi terdeteksi gagal, kontrol sehat lulus |
| Browser QA | `node tests/browser/qa.js` (needs playwright + `next start -p 3111`) | 43/43 — desktop+mobile, keyboard, dark mode, map, chart, comparison, download, method figure, 0 console error |

`npm test` = engine + UI suites. `data:build` = rantai Gate 2 (derive -> sectors -> boundaries -> QC).
`data:qc` membuktikan QC benar-benar menggigit: ia merusak artefak dengan sengaja dan mengharapkan exit 1.

## Done

- [x] Migrated from Antigravity: no inherited instruction files were present; build hacks removed (see `HERMES.md` § 7).
- [x] Hermes governance files: `HERMES.md`, `IDEA.md`, `PROJECT.md`.
- [x] Baseline verification gate established and passing.
- [x] `npm run lint` made non-interactive — `.eslintrc.json` committed (`next/core-web-vitals`).
- [x] `tsx@4` added as devDependency so the two test suites run without `npx --yes` downloads.
- [x] UI test assertions realigned with actual rendered copy (2 failing subtests fixed).
- [x] `public/dataset_penduduk_tangsel.csv` restored — footer "Unduh File Dataset" was a 404 on the live site.
- [x] `copy-geojson.js` deleted; hardcoded `D:\PERSONAL PROJECT\...` path removed and `build`/`setup` scripts simplified.
- [x] README scoring formula + repo URL corrected.
- [x] GitHub links in `page.tsx` / `Footer.tsx` repointed to `WhatBusinessInTangsel` (old slug 301s).
- [x] `npm test` script added; `build`/`setup` no longer depend on the deleted copier.
- [x] Local runtime smoke test: `next start -p 3111` → `/` 200, `/dataset_penduduk_tangsel.csv` 200 serving the 7-row CSV in `public/` (rows rewritten in Gate 3 from the verified dataset).

## Known defects (found in publication audit, not yet fixed)

- [x] Silent error swallowing: `page.tsx` catches scoring failures with no user-visible feedback. Fixed in Gate 4 — `analysisError` state + `#analysis-error` with `role="alert"`.
- [x] Comparison error message has no `role="alert"`/`aria-live`; Leaflet polygons have no keyboard path or ARIA labels. Fixed in Gate 4 — both error boxes have `role="alert"`; all 7 polygons get `tabindex="0"`, `role="button"`, `aria-label`, Enter/Space handler; `#map` has `role="application"` + label. Verified in browser QA (31/31).
- [x] `layout.tsx:12` title and `package.json:2` name said "Tangsel Business Dashboard v2" / `tangsel_bisnis_v2`. Fixed in Gate 4 — title was already corrected in Gate 0; package name is now `whatbusinessintangsel` (lock file too).
- [x] `AnalyticsPanel.tsx:124` `trafficDetails` dead lookup + hardcoded per-level narratives. Resolved at Gate 3 by removing the traffic concept entirely; no `traffic` reference remains in `src/`.
- [x] `ComparisonPanel.tsx:33` caps comparison at 3 areas while docs claimed 4. README corrected in Gate 4 to state 3 as the implemented behaviour; code left at 3 deliberately.
- [x] Rent unit conflicts (`/m²` vs `/bln`). Resolved at Gate 3 — rent is not in the verified model; no rent figure is shown or claimed anywhere.
- [x] Concept-status copy ("Data konsep — belum terverifikasi") contradicted the Gate 1–3 sourced dataset. Rewritten in Gate 4 across header, `DataNotice`, `Footer`, `layout.tsx` metadata.
- [x] Label thresholds disagree: `scoring.ts` vs `recommender.ts` split differently in the 5.0–5.4 band. Aligned in Gate 3 (thresholds: 3.0, 5.0, 6.5, 8.0).
- [x] README.md / `page.tsx` / `Footer.tsx` provenance claims: rewritten in Gate 0, and Gate 3 replaced the underlying figures with sourced ones + archive of the concept data.

## Model behaviour observed (audited, reproducible)

Re-ran all 56 (kecamatan × sector) combinations: composite range **5.7–6.8**, spread 1.10, 12 distinct values. `S3 = 0` in 8 combinations because each sector's `maxCompetitors` equals that sector's dataset maximum. S6 collapses to 9 distinct values (0.750–0.886) and is near-constant for the 6 non-fnb/fashion sectors. `recommender` emits up to 9 strategies per case with overlapping items. This is a property of the current model, not a bug to be tuned away before Gate 3.

## In Progress

**Gate 4 — perbaikan produk & QA (SELESAI 2026-10-20, menunggu ACC pemilik).**
- Feedback error: `page.tsx` sekarang punya state `analysisError` dan merender `#analysis-error` dengan `role="alert"`; kegagalan skor tidak lagi lenyap di console.
- Copy status data dikoreksi di header, `DataNotice`, `Footer`, dan metadata `layout.tsx` — tidak lagi mengklaim "data konsep belum terverifikasi" padahal 6 indikator bersumber dengan SHA-256.
- Branding: `package.json` + `package-lock.json` → `whatbusinessintangsel`.
- Aksesibilitas: 7 poligon kecamatan dapat difokus keyboard (`tabindex=0`, `role=button`, `aria-label`, Enter/Space), `#map` diberi `role="application"` + label; kedua error box punya `role="alert"`.
- `MethodPanel.tsx` baru: sumber primer, bobot 6 indikator, basis normalisasi, freshness dataset, dan caveat metodologi — semua nilai dibaca dari `SCORE_WEIGHTS`/`normalizers`/dataset, tidak ditulis ulang sebagai prosa.
- Tes diperluas: engine 10 → 15 kasus (matriks 21/21, input invalid, kontrak missing-data yang harus melempar, determinisme), UI 6 → 8 subtest.
- `tests/browser/qa.js` ditambahkan: 31 pemeriksaan browser (desktop + mobile, keyboard, dark mode, peta, chart, comparison, unduh CSV, nol console error) — 31/31 lulus terhadap `next start -p 3111`.
- **Belum**: sensitivitas terhadap galat data (POI per kecamatan, luas 2023 dipinjam), lisensi Dukcapil, otorisasi deploy. Tidak ada commit/push/deploy.

**Gate 3 lanjutan — uji sensitivitas bobot (DIJALANKAN 2026-10-20).**
- Skrip `docs/gate3/sensitivity.js` + artefak `docs/gate3/sensitivity_results.json` + laporan `docs/gate3/SENSITIVITY.md`. Reproduksi: `npx tsx docs/gate3/sensitivity.js` (deterministik, dua run identik).
- Metode: `S1..S6` diambil dari `calculateScore()`; equivalence check **21/21** kombinasi mereproduksi `compositeScore` persis sebelum uji dijalankan, sehingga tidak ada rumus kedua.
- Temuan: revisi bobot ≤~10 poin persen tidak mengubah juara (100 % pada deviasi 4,2 pp; 86–99 % pada 13,4 pp). Monte Carlo seragam 20.000 vektor: P(top-1 sama) 69,3 % retail / 87,3 % health / 78,4 % education; hanya Pondok Aren, Pamulang, Ciputat (+Serpong Utara 2,3 % education) yang pernah jadi juara.
- Temuan: **W6 anchor POI satu-satunya indikator yang mengganti juara** (Pondok Aren → Pamulang bila dibuang). W3/W4 bisa dibuang tanpa mengubah urutan karena S3 rentang 0,9205–1,0000 dan S4 0,9556–1,0000 (nyaris konstan).
- Temuan: label rapuh — berubah pada 37,5–43,9 % sel-bobot; health punya 4/7 kecamatan berjarak ≤0,3 dari ambang.
- Temuan: arah S5 adalah asumsi desain — sebagai indikator tunggal, ρ hanya 0,04 (retail) / 0,46 (health) / 0,14 (education) terhadap baseline.
- Batasan yang wajib disebut: uji ini memetakan ketergantungan pada bobot, **bukan memvalidasi** bobot; bobot tidak bisa dikalibrasi tanpa data hasil usaha.

**Gate 0 — koreksi klaim & transparansi (hampir selesai, menunggu ACC deploy).**
- Sudah: `DataNotice.tsx` (banner prototipe di atas grid), badge header jadi "Data konsep — belum terverifikasi", narasi header tidak lagi menjanjikan "lokasi terbaik", footer menulis ulang status dataset + "bukan alat keputusan", `AnalyticsPanel` tidak lagi menempel label "BPS" pada angka, metadata `layout.tsx` + README (judul, tabel status per-indikator, tech stack, section Author, footer) dikoreksi.
- Belum (butuh keputusan/izin): deploy ulang Netlify agar live site ikut jujur — live site **masih versi lama** yang mengklaim data BPS/OSM. Commit juga belum dibuat.

**Gate 1 — kelayakan sumber & scope (SELESAI — scope diputuskan pemilik 2026-10-19).**
- Keputusan lengkap: `docs/gate1/DECISIONS.md`. 6 indikator bersumber, 3 sektor (retail/health/education), batas dari OSM ODbL, normalizer diturunkan dari data.
- Bukti bias OSM terukur (ground truth 298 kafe Google Maps vs 153 OSM → bias 1,25×–5,75× tak seragam) → POI OSM wajib dilabeli "kepadatan POI terpetakan", bukan "jumlah kompetitor".
- Sudah:
  - 3 PDF Disdukcapil Tangsel DKB (2023 S2, 2024 S1, 2025 S1) diunduh ke `docs/gate1/raw/`, `docs/gate1/source_manifest.json` mencatat URL, SHA-256, tanggal akses, dan tabel yang diekstrak.
  - Skrip ekstraksi `docs/gate1/derive_population.js` terverifikasi: populasi 2025 S1 (1.474.311 jiwa), luas 2023 S2 (164,86 km²), dan 77 kelompok umur (0 s.d. 76 LEBIH) terekonsiliasi aritmetika 100%. Catatan luas diperjelas (hanya ada di 2023 S2, dipinjam lintas periode dengan limitasi tercatat).
  - Audit POI kompetitor: query OSM cafe (153 POI) dan FnB gabungan (563 POI) membuktikan angka konsep (1.325 POI) tidak ter-reproduksi pada snapshot uji.
  - Audit klaim `ledger.md`: koreksi klaim unsupported (geometri 'benar', densitas seragam terlalu tinggi, mustahil kombinasi tag OSM, implikasi fabrikasi sepihak, dan klaim mandatory per-kapita).
- Keputusan pemilik (2026-10-19): 6 indikator, 3 sektor (retail/health/education), batas OSM ODbL, metrik per kapita sebagai utama.
- Artefak baru: `fetch_osm_sectors.js` (+`osm_sector_counts.json`, `raw_osm_sectors/`), `fetch_osm_boundaries.js` (+`osm_boundaries.geojson`, `osm_boundaries_meta.json`), `probe_sectors.js`, `DECISIONS.md`.
- Risiko terbuka (tidak menutup Gate 1, tapi wajib tercatat di UI): lisensi publikasi Dukcapil belum ada klausul terbuka; OSM bukan otoritas batas; data Google Maps tidak boleh didistribusikan ulang.
**Gate 2 — rantai data reproducible + QC (SELESAI 2026-10-20).**
- Entry point tunggal `docs/gate2/build.js` (`npm run data:build`): `derive_population.js` -> `fetch_osm_sectors.js` -> `fetch_osm_boundaries.js` -> 11 pemeriksaan QC -> `docs/gate2/verified_dataset.json`.
- Cache dipakai default (offline-aman); `--refresh` memaksa ambil ulang Overpass. `--qc-only` melewati fetch untuk audit ulang cepat.
- 11 QC: kelengkapan 7 kecamatan di 3 sumber, total populasi == jumlah bagian == TOTAL PDF, luas geometri vs Dukcapil (toleransi 2 %), kepadatan == populasi/luas, rasio usia wajar, sektor integer >= 0, penyebut > 0, SHA-256 PDF == manifest, snapshot OSM tercatat, tidak ada null/NaN.
- Gagal QC = exit 1 + daftar kegagalan. **Tidak ada nilai yang diisi 0 sebagai pengganti data hilang** (missing dilaporkan sebagai missing).
- `docs/gate2/qc_selftest.js` (`npm run data:qc`) merusak artefak dengan sengaja: populasi digeser +1 (QC-2), hash manifest dipalsukan (QC-9), kecamatan dihapus (QC-1), penyebut dinolkan (QC-8) — keempatnya tertangkap, kontrol sehat tetap lulus.
- `verified_dataset.json` memuat `normalizers` turunan data (density_max 11.797, anchor_max 8, retail 4,97 / health 1,39 / education 7,51 per 10k) dan `caveats` yang wajib ikut ke UI.
- Temuan saat QC: kepadatan terbitan Dukcapil **tidak konsisten dengan populasinya sendiri** di rilis 2025 S1 (Serpong terbit 5.837 tetapi 172.931/28,27 = 6.117; total terbit 8.581 vs 8.943). Kepadatan karena itu dihitung, bukan dikutip — `density_published` disimpan hanya sebagai jejak.

**Gate 3 — migrasi scoring engine & UI terikat ke dataset terverifikasi (SELESAI 2026-10-20).**
- 6 indikator inti: Kepadatan Penduduk (W1=0.20), Total Populasi (W2=0.20), Usia Muda 15–34 (W3=0.15), Usia Produktif 15–64 (W4=0.15), Peluang Pasar / Rasio POI Rendah (W5=0.15), Anchor POI (W6=0.15). Jumlah bobot = 1.00.
- Normalizer diturunkan dari data nyata `docs/gate2/verified_dataset.json`: density_max=11797, pop_max=339054, youth_max=0.3297, prod_max=0.7433, anchor_max=8, sector_per_10k_max (retail:4.97, health:1.39, education:7.51).
- 3 sektor terverifikasi: retail, health, education. Sektor tak terverifikasi (fnb, fashion, beauty, automotive, services) dibuang dari model runtime dan FilterForm.
- Seluruh import konsep lama (`demographics.json`, `competitors.json`, `traffic.json`, `biMetrics.json`) dihapus 100% dari runtime scoring dan komponen UI; dijembatani oleh `src/data/verifiedDataset.ts`.
- Label POI konsisten menggunakan "Kepadatan POI Terpetakan", bukan "jumlah kompetitor", disertai catatan pemetaan OSM sukarela.
- Threshold recommender diselaraskan dengan scoring label (3.0, 5.0, 6.5, 8.0).
- Suite `test-engine.js` (10/10 pass) dan `tests/ui.test.js` (6/6 pass) hijau. Lint, data build, data QC, dan Next.js production build lulus.
- Perbaikan yang ditambahkan saat review orchestrator (di luar hasil subagent):
  - `labelForScore()` dijadikan satu-satunya tabel ambang; `recommender.ts` mengimpor-nya. `test-engine.js` menguji 10 boundary + kesamaan label pada **21/21 kombinasi**. Sebelum perbaikan, recommender mengembalikan "Cukup Layak" saat scoring bilang "Cukup" — divergensi nyata yang tertangkap test.
  - Bahasa vonis dibuang: `Interpretasi Kelayakan` → `Interpretasi Indeks Relatif`, `Status Kelayakan` → `Interpretasi Indeks`, dan `suitability` memakai kosakata label yang sama.
  - `|| 0` pada POI dihapus — data POI/normalizer hilang sekarang **melempar error**, bukan diam-diam jadi 0 (nol akan terbaca "tidak ada kompetitor" dan memberi peringkat palsu).
  - Alias mati (`competitorCount`, `anchorPoiCount`, `productive_pct`, `area`) dihapus; `any` di `verifiedDataset.ts` diganti tipe eksplisit.
  - Data konsep lama **diarsipkan** ke `docs/gate1/concept_data_archive/` (bukan dihapus) lewat `git mv`, dan probe Gate 1 di-repoint ke sana agar bukti audit tetap dapat dijalankan.
  - `public/dataset_penduduk_tangsel.csv` ditulis ulang dari dataset terverifikasi — sebelumnya berisi angka konsep berlabel "BPS Kota Tangerang Selatan", yaitu klaim provenance palsu yang ikut terunduh pengunjung.

- [x] Gate 5 — paket portofolio: metode divisualisasikan sebagai figure timbangan isometrik (`src/components/method-figure/`), 21 plate (7 kecamatan × 3 sektor) dirender di build time; tiap balok = satu indikator setinggi `bobot × nilai`, pembaca geser di lengan berdiri di skor yang sama. Kit anatomy (`src/lib/iso/`) di-vendor sebagai salinan, bukan dependency.
- [x] Gate 5 — sumber data di UI punya direct link yang sudah dicek 200 sebelum dipasang: DKB semester I 2025, DKB semester II 2023 (Dukcapil), Overpass Turbo, lisensi ODbL 1.0, relasi OSM batas kecamatan.
- [x] Gate 5 — copy UI dibersihkan: hash SHA-256, path `docs/gate*`, `source_manifest.json`, dan nomor gate tidak lagi muncul di halaman.
- [x] Gate 5 — README pass: tabel fitur menyebut figure metode + direct link, tabel tautan sumber, baris perintah browser QA 43/43, `docs/dashboard-preview.jpg` diganti screenshot build terbaru.
- [x] Gate 5 — dark mode dirapikan: callout amber, pill header, link sumber, tile OSM (invert), kontrol Leaflet zoom/attribution. Ditemukan lewat `vision_analyze` pada `docs/screenshots/05-dark-mode.png`.
- [x] Gate 5 — fokus keyboard terlihat di semua permukaan: satu token `--focus-ring` (indigo `#4f46e5` di light, `#a5b4fc` di dark) dipakai `:focus-visible` untuk `select`, `button`, `a`, `[tabindex]`, dan `path` peta. `focus:outline-none focus:ring-1` dibuang dari `FilterForm`/`MapComponent` karena membuat fokus tak terlihat. Diverifikasi dengan menekan Tab: 24/24 stop benar di dua tema (sekarang cek permanen di `tests/browser/qa.js`).
- [x] Gate 5 — **deploy 2026-10-21**: `master` di-push (`72254b0`), Netlify rebuild dari push itu. Live: `root 200`, `dataset_penduduk_tangsel.csv` 200, teks "Badan Pusat" 0×, "Dukcapil" 6×, tanpa kebocoran `docs/gate*`/`source_manifest`/`SHA-256`. Smoke test browser QA di URL live: **43/43**.
- [x] Gate 5 — repo bisa membangun dirinya sendiri: clone bersih tanpa PDF (gitignored) lulus tsc, lint, engine 15/15, UI 8/8, `data:qc` LULUS, `npm run build` static. Sebelum ini 76 file kode+docs belum pernah di-commit sejak 24 Juli.
- [x] Gate 5 — `LICENSE` MIT untuk kode, **dengan seksi terpisah** yang menegaskan data tidak tercakup: DKB Dukcapil tanpa klausul lisensi terbuka, OSM/ODbL wajib atribusi + share-alike, indeks sendiri boleh dipakai tapi bukan nasihat tervalidasi. `package.json` `license: MIT`, README punya seksi Lisensi yang terbaca. Dikunci test (`License separates code from data`); diuji negatif — menghapus seksi itu memerahkan 2 assert.
- [x] Gate 5 — `tests/ui.test.js` tidak lagi memaku tanggal `2026-10-20`: assert memakai `dataset.generated_at.slice(0,10)` supaya `npm run data:build` ulang tidak memerahkan suite.

## Gotchas (Gate 5 — dark mode)

- Tailwind preflight menghapus outline bawaan, dan `focus:outline-none focus:ring-1` di form membuat fokus *tak terlihat sama sekali* (ring 1px di opacity rendah + outline transparan). Satu aturan `:focus-visible` per tag + token `--focus-ring` (indigo di light, `#a5b4fc` di dark) menggantikannya. Warna di-override lewat **variabel**, bukan `outline-color` di `html.dark-mode :focus-visible` — aturan per-id (`#overlay-mode-select:focus-visible`, `#map path...`) menang spesifisitas dan tetap indigo gelap.
- `outline` pada `<path>` Leaflet terpotong tepi poligon tetangga; pakai `outline-offset: -2px` + `stroke-width: 3` untuk poligon.
- Cek fokus harus lewat `keyboard.press('Tab')`, bukan `el.focus({focusVisible:true})` atau klik: klik membuat modalitas "pointer" sehingga `:focus-visible` tidak pernah aktif. Transisi `all` juga butuh ~450ms sebelum `outlineColor` final; mengukur terlalu cepat membaca warna antara (mis. `rgb(70,68,181)`).
- `.scroll-indicator::after` (fade putih 40px, `opacity:1` di ≤768px) adalah petunjuk scroll horizontal dari era tabel lebar. Setelah padding sel dikecilkan di ≤430px, tabel sudah pas 322/322 px, jadi overlay hanya membuat kolom "Hapus" tampak pudar. Sekarang overlay hanya muncul dengan `.is-scrollable`.
- `.bg-slate-50/80` dan gradient `from-indigo-50` di kartu footer tidak tercakup aturan dark mode yang ada (hanya `/60` dan `/40`) — dua kartu footer tetap putih. Setiap varian opacity baru butuh override sendiri.
- `method-figure/live.tsx` sempat memaku `data-theme="light"` di stage, sehingga palet iso selalu terang walau halaman sudah dark. Jangan paku tema dari JSX; biarkan CSS memilih lewat `html.dark-mode .iso`. QA sekarang mengunci ini dengan mengukur luminansi hasil `getComputedStyle`.
- Leaflet chrome (`.leaflet-control-zoom a`, `.leaflet-control-attribution`) punya background putih hardcoded dari CSS Leaflet, bukan Tailwind — override wajib `!important` di `globals.css`.
- Tile OSM raster hanya terang. Di dark mode di-invert lewat `filter: invert(1) hue-rotate(180deg)` di `.leaflet-tile-pane`, bukan dengan mengganti tile provider (akan butuh API key).
- `tests/ui.test.js` mengunci tanggal generation di beberapa assert. Setiap `npm run data:build` mengubah `generated_at`, jadi assert harus membaca dataset, bukan literal.

## Gotchas (sensitivity analysis)

- `docs/gate3/sensitivity.js` **must** take S1..S6 from `calculateScore()` and assert equivalence at baseline weights before running. Re-implementing the composite formula would create a second model — the exact Gate 0 defect.
- Its PRNG is a seeded LCG on purpose. A Monte Carlo that cannot be re-run byte-identically is not evidence. Do not swap in `Math.random()`.
- Uniform Dirichlet(1) draws over the weight simplex overstate fragility (much mass sits near vertices where one indicator dominates). Quote the local-perturbation numbers for "what if I revise the weights a bit" and the uniform numbers only for "what if weights were arbitrary".
- S3 (0.9205–1.0000) and S4 (0.9556–1.0000) are near-constant across the 7 kecamatan, so W3/W4 act as a shared constant rather than a discriminator. Adding more age indicators would not make the ranking sharper.

## Gotchas (Gate 5 — method figure)

- Tujuh URL sumber harus di-`curl` sebelum dipasang di UI. Dukcapil membalas **403 tanpa** User-Agent + referer, tapi 200 di browser biasa — jangan simpulkan link mati hanya dari curl polos.
- `figureSvg()` di `iso-kit` memancarkan root `<svg>` sendiri. Menyuntiknya ke dalam `<svg viewBox>` komponen menghasilkan SVG bersarang (21 `<svg>` di DOM, geometri teracak). Pakai `figureBody()` yang membuang root-nya.
- `setPointerCapture` di stage menelan klik tombol panah: `pointerup` di-retarget ke stage sehingga `click` tidak pernah jalan. `onPointerDown` harus `return` lebih dulu kalau `event.target.closest('button')`.
- Stack balok dibatasi `STACK_SCALE`: total `Σ w·S` maksimum di dataset 0,915, jadi skala 94 menaruh puncak tertinggi di z≈114 sementara bawah balok di z=123. Menaikkan skala tanpa mengecek `stackTop()` membuat balok menembus balok.
- Gantung pan harus 3 kawat ke tepi pan, bukan satu batang di tengah: batang menembus tumpukan balok dan terlihat seperti kesalahan gambar.
- `import '*.css'` dari komponen yang dirender `tsx --test` langsung meledak (`SyntaxError: Unexpected token '.'`) karena tidak ada loader CSS. Gaya iso harus ikut di `globals.css`, bukan diimpor dari komponen.
- `figure.tsx` butuh `import React` eksplisit: suite UI merender dengan `react-dom/server` di luar pipeline otomatis Next.

## Gotchas (Gate 4)

- Browser QA needs a controllable Chromium, not the user's Brave: Brave locks its profile while running and Hermes cannot copy it. Install playwright + chromium in a throwaway dir (`npm i -D playwright && npx playwright install chromium`), copy `tests/browser/qa.js` there, serve the build on `next start -p 3111`, then `node qa.js`. Playwright stays out of `package.json` on purpose.
- `tests/browser/qa.js` reads `QA_URL` so it can point at a preview deploy, but the download check needs the CSV route — keep the path `/dataset_penduduk_tangsel.csv` in sync with `public/`.
- `MethodPanel` must derive weights and normalizers from `SCORE_WEIGHTS`/`normalizers`, never retype them as prose. Its formula string was hardcoded on first authoring and would have lied the moment a weight changed.
- Asserting "no 'belum terverifikasi' anywhere in the DOM" is wrong: `verified_dataset.json` `sources.area.note` legitimately says the 2023 area is borrowed across periods "dengan batasan belum terverifikasi". Scope such assertions to the header/badge text, not `document.body.innerText`.

## Gotchas (Gate 3)

- `labelForScore()` adalah satu-satunya tabel ambang. Menambah blok `if (score >= ...)` kedua di `recommender.ts` akan mengulang cacat Gate 0; kontraknya diuji di `test-engine.js`.
- `calculateScore` **melempar** kalau POI atau normalizer hilang. Jangan menggantinya dengan `|| 0` — nol berarti "tidak ada kompetitor" dan menghasilkan peringkat palsu.
- `docs/gate2/verified_dataset.json` adalah artefak hasil build. Jangan edit manual; jalankan `npm run data:build`. Kalau normalizer berubah, `density_max` dan `S1..S6` ikut bergeser dan skor seluruh kecamatan berubah.
- `src/data/*.json` konsep sudah dipindah ke `docs/gate1/concept_data_archive/`. Probe Gate 1 membaca dari sana; jangan hapus selama ledger masih menjadi bukti.

- PDF mentah Dukcapil di `docs/gate1/raw/` di-gitignore; `.txt` hasil `pdftotext` tetap di-commit karena itu yang dibaca pipeline. `derive_population.js` menurunkan daftar dari `.txt` dan mencari PDF-nya kalau ada — hash jadi `null` saat PDF absen, **jangan** hash `.txt` sebagai pengganti (itu hash palsu untuk manifest).
- QC-9 wajib membedakan "hash salah" dari "file tidak ada". Menganggap file absen sebagai kegagalan membuat `data:qc` merah di setiap clone bersih. Sekarang sumber yang absen dilewati dan dilaporkan (`n/3 cocok (… tidak ada di disk)`), dan `qc_selftest.js` menandai kasus QC-9 `SKIP` alih-alih `FAIL`.

## Gotchas (Gate 2)

- Tabel `KEPADATAN PENDUDUK` di DKB 2025 S1 memuat kepadatan yang tidak cocok dengan populasi/luas-nya sendiri. Jangan pernah mengutip `density_published` sebagai angka utama; hitung dari populasi/luas dan simpan angka terbitan hanya sebagai jejak audit.
- `build.js` wajib dipanggil tanpa `--refresh` di CI/selftest; `--refresh` memukul Overpass 7 kecamatan × 2 endpoint dan bisa timeout 400 s+.
- `qc_selftest.js` menulis ulang artefak asli lalu memulihkannya di `finally`. Jangan pernah menambah `process.exit()` di dalam blok `try` — file asli tidak akan dipulihkan.
- Pemeriksaan cocok-string nama QC harus regex (`FAIL\s+QC-2`), bukan `includes('FAIL QC-2')` — output punya padding spasi sehingga `includes` selalu gagal.

## Backlog

Candidates, not committed work — pick one per turn only after user ACC.

1. **Gate 5 — paket portofolio** (`docs/PUBLICATION_PLAN.md` Gate 5): ~~studi kasus BA~~ **ditulis 2026-10-21 di `docs/CASE_STUDY.md`** (masalah, pengguna, scope, sumber, cleaning, metode, 3 temuan terhitung, trade-off, keterbatasan, tindak lanjut). Sisa: ACC pengguna, deploy, smoke test URL live + unduhan.
2. ~~**Weight sensitivity analysis**~~ — **dijalankan 2026-10-20** (`docs/gate3/SENSITIVITY.md`). Hasil: juara tahan terhadap revisi bobot ≤~10 poin persen, label rapuh (37,5–43,9 % berubah), W6 anchor satu-satunya yang mengganti juara, arah S5 terbukti asumsi. Bobot tetap tidak bisa dikalibrasi tanpa data hasil usaha.
3. ~~**Verify live site serves the CSV**~~ — **selesai 2026-10-21**. Akarnya bukan Netlify: `public/` seluruhnya untracked, jadi tak pernah ikut build. Setelah commit + push, CSV 200 di live. Sekalian diperbaiki: kolom `Status` CSV membocorkan path internal `docs/gate1/source_manifest.json` ke file yang diunduh pengunjung → sekarang `terverifikasi ke DKB Disdukcapil`.
4. **Netlify deploy reproducibility** — `@netlify/plugin-nextjs` tidak ada di `package.json`, tetapi deploy 2026-10-21 dari `master` berhasil tanpa itu (Netlify menyediakan runtime-nya di sisi mereka). Tidak perlu diubah; catat saja bahwa pipeline tak bisa direproduksi dari repo sendiri.
5. ~~**Overlay `<select>` + map focus styling**~~ — **selesai 2026-10-21**: fokus sebelumnya *tak terlihat* (Tailwind `focus:outline-none`), bukan cuma "belum custom". Satu token `--focus-ring` + aturan `:focus-visible`; 24/24 stop Tab benar di dua tema, dikunci di `tests/browser/qa.js` (43/43).
6. **Sector expansion** — requires extending `docs/gate2/build.js` and rerunning `data:build`; never hand-edit the dataset or add a sector with placeholder counts.

## Gotchas

- Node 24 rejects `import x from './x.json'` without `with { type: 'json' }` in plain ESM. That is why both suites run under `tsx`, never bare `node`.
- `calculateScore` throws (not returns null) on a missing subdistrict/sector key in **any** of the four data files. A partial data addition fails at render, not at build.
- `npm run lint` re-enters the interactive ESLint setup prompt if `.eslintrc.json` is ever deleted. Keep it committed.
- `renderToString` inserts `<!-- -->` between adjacent text nodes; tests asserting a long contiguous string across a `{' '}` boundary fail. Assert on fragments instead.
- `MapComponent` must stay behind `dynamic(..., { ssr: false })`; static import crashes SSR on `window`.
- The repo's tsconfig `paths` are not used in tests — `tests/ui.test.js` imports relative paths, so moving files breaks both suites.
- `next build` can fail once with `build worker exited with code: 3221226505` right after a previous build's `.next` is stale. `rm -rf .next` then rebuild; verified stable 3/3 in a row. Do not chase it as a code bug.
