# Audit dan rencana publikasi portofolio

Status: **Gate 0–4 selesai dan lulus verifikasi (2026-10-20); Gate 5 berjalan.** Seluruh angka berasal dari `docs/gate2/verified_dataset.json` yang dibangun `npm run data:build`. Bukan alat kelayakan investasi. Dokumen ini menggantikan klaim kesiapan publikasi dalam dokumentasi migrasi sebelumnya.

## Temuan terverifikasi dari repo

- Klaim data nyata ada di README.md:3, page.tsx:154 dan Footer.tsx:28-44. Tidak ada bukti sumber per angka yang diperlihatkan oleh audit repo. Status yang tepat: belum terverifikasi, bukan otomatis sintetis atau palsu.
- AnalyticsPanel.tsx:124 mencari traffic dengan trafficLevel, bukan key kecamatan. Baris 242-244 justru memakai narasi hardcoded berdasarkan level. Lookup tidak dipakai dalam render.
- ComparisonPanel.tsx:33 membatasi 3 lokasi; README menjanjikan 4.
- AnalyticsPanel.tsx:128 menampilkan sewa /m²; recommender.ts:110-114 memakai /bln. Satuan sebenarnya belum diketahui; jangan memilih satuan baru tanpa sumber.
- scoring.ts:72-104 memakai batas normalisasi tanpa dasar terdokumentasi. Semua maksimum kompetitor cocok dengan maksimum dataset sekarang.
- Eksekusi ulang seluruh 56 kombinasi menghasilkan rentang skor 5.7–6.8, 8 kombinasi S3=0. Ini observasi, bukan alasan untuk mengubah distribusi agar terlihat menarik.
- scoring.ts:123-132 dan recommender.ts:26-31 berbeda threshold pada 5.0–5.4. Tidak terjadi pada dataset sekarang; tetap perlu boundary test.
- Validitas bentuk GeoJSON tidak membuktikan kebenaran batas, asal data, tahun, atau lisensinya.
- Test render dan formula tidak memverifikasi kebenaran statistik atau hasil bisnis.

## Jalur yang direkomendasikan

Publikasikan studi kasus eksplorasi lokasi berbasis bukti, bukan prediksi keberhasilan usaha. Mulai 7 kecamatan dengan satu sektor yang dapat didefinisikan jelas. Kafe dapat menjadi kandidat, bukan otomatis seluruh FnB. Tambah sektor hanya setelah data dan definisi lolos gate.

## Gate 0 — Koreksi status dan klaim

Output: koreksi HERMES.md, PROJECT.md, IDEA.md, README dan label UI; banner prototipe/data belum diverifikasi; inventaris klaim dan dataset.
Lulus: tidak ada jaminan sumber resmi atau kelayakan bisnis yang tidak didukung. Jika live site belum diperbarui, catat eksplisit. Pemilik memberi ACC scope sebelum pengembangan berikutnya.

## Gate 1 — Kelayakan sumber dan scope

Output: evidence ledger setiap indikator: definisi, satuan, geografi, periode, URL sumber, tabel/halaman, tanggal akses, lisensi, raw file, transformasi, status verified/proxy/assumption/unavailable.

- Cari publikasi/tabel BPS primer untuk penduduk dan luas; cocokkan tahun serta basis penduduk.
- Audit batas administrasi: sumber, versi, CRS, nama/key, lisensi, cakupan dan validasi spasial.
- Uji akuisisi POI untuk satu sektor: definisi tag, batas spasial, tanggal snapshot, deduplikasi node/way/relation, titik di perbatasan, dan inspeksi sampel manual.
- Jangan menyamakan jumlah POI OSM dengan sensus seluruh bisnis. Kelengkapan pemetaan harus menjadi limitasi.
- Uji apakah daya beli, usia, sewa, pertumbuhan dan aksesibilitas tersedia pada tingkat kecamatan. Jangan menyalin angka kota ke kecamatan seolah pengamatan lokal.

Lulus: setiap indikator yang akan digunakan mempunyai bukti dan definisi yang sesuai. Yang tidak tersedia dihapus dari model inti atau dipisahkan sebagai skenario pengguna. Tidak wajib mempertahankan delapan metrik.

## Gate 2 — Pipeline data yang dapat direproduksi (**SELESAI 2026-10-20**)

Output: `docs/gate2/build.js`, `verified_dataset.json`, `qc_report.json`, dan `qc_selftest.js`.

Perintah:

```bash
npm run data:build                  # derive + cache fetch + 11 QC + emit dataset
npm run data:qc                     # 4 mutasi rusak harus gagal; kontrol sehat harus lulus
node docs/gate2/build.js --qc-only  # audit QC tanpa jaringan
node docs/gate2/build.js --refresh  # paksa snapshot Overpass baru
```

Lulus: 7/7 kecamatan konsisten; populasi bagian == total PDF; luas geometri deviasi 0,61 % (toleransi 2 %); kepadatan dihitung dari populasi/luas; 21 hitungan sektor integer; missing, null, NaN, penyebut nol, hash PDF, dan snapshot OSM diuji. Dataset kanonik menulis sumber, normalizer, total, dan caveat. Tidak ada scraping runtime.

Temuan penting: kepadatan terbitan DKB 2025 S1 tidak konsisten dengan populasi/luas terbitannya sendiri (total terbit 8.581 vs hasil hitung 8.943). Pipeline memakai hasil hitung dan menyimpan angka terbitan hanya sebagai jejak audit.

## Gate 3 — Metodologi dan validasi model

Output: pertanyaan analitis, kamus metrik, alasan arah/bobot/normalizer, aturan missing, analisis sensitivitas dan contoh perhitungan tangan.

Bandingkan jumlah pesaing absolut dengan per kapita/per luas sebagai alternatif, bukan putuskan tanpa pertanyaan bisnis. Kepadatan pesaing dapat mengindikasikan permintaan sekaligus hambatan. Jumlah anchor bukan ukuran kedekatan tanpa jarak. Pengeluaran bukan pendapatan dan bukan otomatis daya beli lokal.

Lulus: perhitungan dapat direplikasi; ranking diperiksa terhadap variasi bobot dan pilihan normalisasi; perubahan ranking/ketidakpastian dilaporkan. Jangan melebarkan skor demi visual. Tanpa outcome bisnis teramati, gunakan istilah indeks eksploratif relatif, bukan probabilitas sukses atau putusan layak investasi.

## Gate 4 — Perbaikan produk dan QA

Output: traffic detail sesuai wilayah; limit comparison konsisten; unit bersumber; label/threshold tunggal; feedback error; metode/sumber/freshness terlihat; branding konsisten.
Lulus: lint, test dan build pass; runnable tests untuk 56 kombinasi bila 8 sektor dipertahankan, invalid input, threshold dan data missing; browser QA desktop/mobile, keyboard, dark mode, map, chart, comparison, download; tidak ada error console. HTTP 200 bukan browser QA.

## Gate 5 — Paket portofolio dan publikasi

Output: studi kasus BA berisi masalah, pengguna, scope, sumber, cleaning, metode, 2–3 temuan yang benar-benar dihitung, trade-off, keterbatasan dan tindak lanjut; README, screenshot, demo, kredit/lisensi, tanggal pembaruan.
Lulus: pengguna review klaim dan memberi ACC publikasi; deploy aktual lalu smoke test URL live dan unduhan. Tidak commit/push/deploy tanpa izin.

## Prioritas

P0: klaim dan provenance. P1: scope/data/metode. Gate 2 selesai; Gate 3 wajib memindahkan sumber angka UI dari `src/data/*.json` ke dataset terverifikasi dengan jejak transformasi. P2: bug dan QA produk. P3: kemasan portofolio/deploy. Delapan metrik dan delapan sektor bukan syarat kelulusan; bukti dan batas interpretasi adalah syarat.

## Batas audit

Audit ini memeriksa repo dan mengeksekusi matriks scoring, bukan verifikasi eksternal BPS/OSM, audit lisensi, validasi geografis, atau observasi keberhasilan usaha. Itu pekerjaan gate berikutnya. Gate 1–2 kini punya artefak sumber dan pipeline lokal. Lisensi Dukcapil, otoritas batas OSM, inspeksi titik POI, dan migrasi UI tetap terbuka.
