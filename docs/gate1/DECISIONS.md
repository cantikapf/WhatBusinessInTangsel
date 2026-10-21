# Gate 1 — Keputusan scope yang disetujui pemilik

Status: **diputuskan** (owner ACC 2026-10-19: "sesuai rekomendasi kamu saja").
Ringkasan bukti ada di `docs/gate1/ledger.md`. Dokumen ini mencatat **keputusan**, bukan usulan.

## 1. Indikator inti — 6, semuanya bersumber

| # | Indikator | Sumber | Status data |
|---|---|---|---|
| 1 | Kepadatan penduduk | Dukcapil DKB 2025 S1 (pop) ÷ luas 2023 S2 | primer + hash |
| 2 | Populasi total per kecamatan | Dukcapil DKB 2025 S1 | primer + hash |
| 3 | Usia 15–34 % | Dukcapil DKB 2025 S1, tabel usia 77 bin | primer + hash |
| 4 | Usia 15–64 % | idem | primer + hash |
| 5 | POI kompetitor per 10k jiwa | OSM (3 sektor, tag terkunci) ÷ populasi DKB | primer, berlisensi ODbL |
| 6 | Anchor POI | OSM (`railway=station`, `amenity=bus_station`, `shop=mall`) | primer, ODbL |

### Dibuang dari model inti

| Indikator | Alasan |
|---|---|
| `accessibilityScore` / `trafficLevel` | Tidak ada sumber, tidak ada metode. 0,50–0,90 tanpa rumus |
| `dayaBeli` | Rp 2,5–3,8 jt tanpa rujukan. Angka kota tidak boleh ditempel ke kecamatan |
| `biayaSewa` | Satuannya pun belum pasti (`/m²` vs `/bln`); tidak ada sumber properti komersial |
| `trenHistoris` | Kota 1,05%/th (2023–2024); kecamatan diklaim 4,5–7,5% = 4–7× kota tanpa dasar |
| `cafe_competitor_count` | Duplikat produk lain + OSM terbukti bias tak seragam (lihat §2) |

## 2. Bukti bias OSM — dasar wajib label "bukan jumlah usaha sebenarnya"

Ground truth: `D:\PERSONAL PROJECT\Tangsel Coffeeshop Business\data\processed\tangsel_coffee_master.json`
(298 kafe hasil scrape Google Maps, tiap baris punya `directLink` yang bisa dibuka).

| Kecamatan | Google Maps | OSM | rasio bias |
|---|---|---|---|
| Ciputat Timur | 23 | 4 | **5,75×** |
| Serpong Utara | 42 | 11 | **3,82×** |
| Serpong | 67 | 30 | 2,23× |
| Pondok Aren | 55 | 29 | 1,90× |
| Pamulang | 59 | 34 | 1,74× |
| Ciputat | 50 | 40 | 1,25× |
| Setu | 2 | 5 | **0,40×** |
| **Total** | **298** | **153** | **1,95×** |

Bias **tidak seragam** (1,25×–5,75×, satu kecamatan terbalik). Karena itu:

- Hitungan POI OSM **tidak boleh** dilabeli "jumlah kompetitor".
- Label wajib: *"Kepadatan POI terpetakan (OSM, snapshot 2026-10-19) — indikator kelengkapan pemetaan sukarela, bukan jumlah usaha sebenarnya."*
- Angka absolut tidak dipakai sebagai metrik utama; rasio per 10k jiwa dipakai karena distribusinya masih informatif dan penyebutnya terverifikasi.

## 3. Sektor — 3, tag terkunci

Cafe dibuang: sudah jadi produk tersendiri (`Tangsel Coffeeshop Business`) **dan** punya bias OSM terburuk yang terdokumentasi.

| Sektor | Tag |
|---|---|
| `retail` | `shop ∈ {supermarket, convenience, minimarket, grocery, greengrocer}` |
| `health` | `amenity ∈ {pharmacy, clinic, dentist, doctors}` |
| `education` | `amenity ∈ {school, university, college, language_school, kindergarten}` |
| `anchor` | `railway=station` ∪ `amenity=bus_station` ∪ `shop=mall` |

Skrip: `docs/gate1/fetch_osm_sectors.js` → `osm_sector_counts.json` + raw per kecamatan di `raw_osm_sectors/`.

| Kecamatan | Retail | Health | Education | Anchor |
|---|---|---|---|---|
| Serpong | 86 | 24 | 74 | 6 |
| Serpong Utara | 28 | 11 | 19 | 7 |
| Pondok Aren | 53 | 15 | 56 | 8 |
| Ciputat | 22 | 11 | 60 | 5 |
| Ciputat Timur | 18 | 19 | 132 | 2 |
| Pamulang | 55 | 23 | 70 | 3 |
| Setu | 12 | 5 | 16 | 1 |

## 4. Batas administrasi — ganti ke OSM (ODbL)

**Provenance lama terjawab.** `data/geo/tangsel_kecamatan.geojson` di `Tangsel Coffeeshop Business` punya jumlah verteks identik dengan `src/data/geojson/tangsel_subdistricts.json` (777 / 921 / 1156 / 1255 / 1508 / 1809 / 1854). Jadi layer lama berasal dari KMZ — dan KMZ itu sendiri tanpa metadata pembuat maupun lisensi.

Keputusan: **ganti** dengan ekstraksi OSM `admin_level=6`. Skrip `fetch_osm_boundaries.js`,
output `osm_boundaries.geojson` + `osm_boundaries_meta.json`.

| Kecamatan | Relasi OSM | Luas hitung (km²) | Luas Dukcapil (km²) | deviasi |
|---|---|---|---|---|
| Ciputat | 10989408 | 21,16 | 21,11 | +0,24% |
| Ciputat Timur | 10989407 | 18,06 | 17,82 | +1,35% |
| Pamulang | 10989409 | 28,75 | 28,74 | +0,03% |
| Pondok Aren | 4448807 | 29,89 | 29,80 | +0,30% |
| Serpong | 10989422 | 28,49 | 28,27 | +0,78% |
| Serpong Utara | 10989417 | 22,71 | 22,36 | +1,57% |
| Setu | 10989433 | 16,80 | 16,76 | +0,24% |
| **Total** | — | **165,86** | **164,86** | **+0,61%** |

Deviasi total +0,61% — lebih baik dari layer lama (yang properti `area_km2`-nya meleset −10,7%). Lisensi jelas (ODbL), relasi tercatat, bisa diulang.

## 5. Normalizer — diturunkan dari data, bukan diasumsikan

| Normalizer | Nilai lama (tanpa dasar) | Nilai baru | Asal |
|---|---|---|---|
| Kepadatan max | `12725` | 11.797 | max nyata DKB |
| Retail max per 10k | — | 4,97 | max nyata |
| Health max per 10k | — | 1,39 | max nyata |
| Education max per 10k | — | 7,51 | max nyata |
| Anchor max | `12` | 8 | max nyata |
| Daya beli max | `4_000_000` | dibuang | — |
| Sewa max | `500_000` | dibuang | — |
| Tren max | `0,10` | dibuang | — |

`maxCompetitors` hardcode (`fnb:320, fashion:140, …`) dihapus seluruhnya.

## 6. Dampak ke kesimpulan (bukan detail teknis)

Peringkat absolut vs per kapita berbeda di hampir semua posisi:

| Sektor | Posisi berubah |
|---|---|
| retail | **7/7** |
| health | **6/7** |
| education | **7/7** |

Contoh `education`: absolut menempatkan Ciputat Timur #1 (132 POI), tetapi per kapita Ciputat Timur **#7** (7,51/10k = tertinggi, jadi skor kompetisi terendah). Metrik yang dipilih menentukan jawaban dashboard.

## 7. Yang dibawa ke gate berikutnya

- **Gate 2** — pipeline reproducible: `derive_population.js` + `fetch_osm_sectors.js` + `fetch_osm_boundaries.js` jadi satu rantai; raw snapshot tersimpan; QC (total = jumlah bagian, missing ≠ nol).
- **Gate 3** — rombak `scoring.ts`: 8 indikator → 6; `ScoreMetrics` kehilangan `trafficLevel`, `accessibilityScore`, `dayaBeli`, `biayaSewa`, `trenHistoris`; `test-engine.js` + `tests/ui.test.js` ikut berubah. Bobot wajib punya alasan tertulis + uji sensitivitas.
- **Gate 4** — copy UI: hapus klaim aksesibilitas/daya beli/sewa/tren; tambah label bias OSM; tampilkan 3 sektor.
- **Gate 5** — deploy.

## 8. Sisa risiko yang tidak bisa saya tutup

| Risiko | Status |
|---|---|
| Lisensi publikasi Dukcapil | belum dikonfirmasi — PDF tidak memuat klausul lisensi terbuka. Dipakai dengan atribusi + catatan |
| Akurasi batas OSM | ODbL jelas, tapi OSM bukan otoritas batas. Deviasi +0,61% luas bukan sertifikasi kartografis |
| Ground truth cafe (Google Maps) | dipakai hanya sebagai **bukti bias**, bukan data dashboard. Scrape Google Maps melanggar ToS bila didistribusikan ulang |
| `estimatedDailyRevenue` di produk cafe | berasal dari `txPerHour()` hardcode 20/15/10/8 — cacat yang sama jenisnya bila produk itu dipublish |
