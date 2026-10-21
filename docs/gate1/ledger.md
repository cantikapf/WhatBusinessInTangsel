# Gate 1 — Evidence ledger

Status: **SELESAI — scope diputuskan pemilik 2026-10-19.** Keputusan final ada di
`docs/gate1/DECISIONS.md`; dokumen ini adalah bukti yang mendasarinya. Label "usulan keputusan"
di bawah dipertahankan sebagai jejak audit: itulah proposal yang diajukan sebelum ACC.

Aturan main: angka tanpa entri di tabel ini tidak boleh muncul di UI sebagai fakta.

## 0. Referensi wilayah (bounding facts)

| Fakta | Nilai resmi | Sumber | Status |
|---|---|---|---|
| Jumlah kecamatan | 7 | Pemkot Tangsel, halaman Demografi (`tangerangselatankota.go.id/profil-kota/demografi`), "7 Kecamatan", update 12 Mar 2024 | terverifikasi |
| Luas kota | 164,85 km² (16.485,47 Ha) | idem | terverifikasi |
| Populasi kota 2024 | 1.429.529 jiwa | idem, "Sumber Data: BPS Kota Tangsel" | terverifikasi (angkatan 2024) |
| Kepadatan kota | 8.672 jiwa/km² | idem | terverifikasi (turunan) |
| Laju pertumbuhan 2023–2024 | 1,05% | idem | terverifikasi |
| Nomor katalog publikasi | 1102001.3674 · Nomor Publikasi 36740.24001 · rilis 28 Feb 2024 | BPS Kota Tangsel, *Kota Tangerang Selatan Dalam Angka 2024* (`tangselkota.bps.go.id/id/publication/2024/02/28/a6e2261d008fac08b1cdf777/...`) | terverifikasi (metadata saja — tabel PDF belum diunduh) |

Catatan: halaman Pemkot menampilkan angka **2024**, sedangkan `src/data/*.json` dan README
mengklaim **2023**. Tidak ada periode 2023 yang tercatat di repo.

## 1. `demographics.json` — populasi, luas, kepadatan

Dataset sekarang (konsep): total 1.382.400 jiwa; luas 147,19 km²; kepadatan kota 9.392 jiwa/km².

Pembanding resmi (Disdukcapil DKB diunduh ke `docs/gate1/raw/`, lihat `source_manifest.json`):

| Sumber | Periode | Total populasi | Luas | Catatan |
|---|---|---|---|---|
| Pemkot 2024 (BPS) | 2024 | 1.429.529 | 164,85 km² | Angka kota pada portal pemkot |
| Dukcapil DKB Sem II 2023 | 2023 S2 | 1.414.619 | 164,86 km² | Tabel Kepadatan Penduduk memuat luas per kec (total 164,86 km²) |
| Dukcapil DKB Sem I 2024 | 2024 S1 | 1.429.529 | — | Tabel Jumlah Penduduk Kecamatan (terverifikasi konsisten dengan portal Pemkot 2024) |
| Dukcapil DKB Sem I 2025 | 2025 S1 | 1.474.311 | — | Tabel p1: 1.474.311 (2025 S1) & 1.463.607 (2024 S2) |

Temuan terukur:

1. **Diskrepansi luas & batas: retensi ketidakpastian (tidak ada simpulan sepihak geometri 'benar' vs area 'karangan').**
   - Luas total dataset konsep (147,19 km²) berselisih −10,7% terhadap angka resmi Pemkot/Dukcapil (164,85–164,86 km²). Asal-usul angka 147,19 km² tidak memiliki metadata rujukan (unverified), namun menyimpulkannya sebagai 'karangan' tanpa bukti metodologi adalah inferensi yang tidak berdasar.
   - Hasil hitung geometris 7 poligon GeoJSON saat ini menghasilkan **165,90 km²** (+0,6% dari luas resmi). Kedekatan angka hitung ini TIDAK membuktikan bahwa poligon GeoJSON "benar" secara kartografis: provenance, tanggal unduh, dan lisensi layer tidak diketahui, serta belum diaudit terhadap batas resmi BIG/Kemendagri (risiko pergeseran batas atau sliver).
   - Ketidakpastian (uncertainty) wajib dipertahankan pada kedua pihak: geometri poligon maupun nilai luas teks sama-sama berstatus *unverified*.
2. **Kepadatan tidak seragam lebih tinggi.**
   Penyimpangan kepadatan tidak uniformly skew high karena populasi dataset konsep juga lebih rendah dari realisasi resmi.
   Contoh: Setu (5.723 di dataset vs 5.529 DKB 2023 S2 terbitan resmi vs 5.786 hasil hitung komputasi populasi 2025 S1 ÷ luas 2023); Pamulang (11.652 di dataset vs 11.353 DKB 2023 S2 terbitan resmi vs 11.797 hasil hitung komputasi populasi 2025 S1 ÷ luas 2023).
   Perbedaan kepadatan timbul karena numerator (populasi) dan denominator (luas) berasal dari sumber/asumsi terpisah yang tidak terdokumentasi.
3. **Populasi total dataset 1.382.400 < 1.414.619 (Dukcapil 2023 S2) < 1.474.311 (Dukcapil 2025 S1).**
   Selisih 2,3% hingga 6,2% terhadap catatan resmi Dukcapil.
4. `density == population / area` konsisten secara aritmetika di dataset internal (7/7 kecamatan cocok), namun input luas dan populasinya tidak memiliki rujukan sumber primer.
5. Ekstraksi DKB 2025 S1 (`derive_population.js`) menghasilkan populasi 1.474.311, luas 164,86 km² (dari DKB 2023 S2), dan 77 kelompok usia (0 hingga 76 LEBIH) dengan rekonsiliasi aritmetika 100%. Catatan: tabel luas dan angka kepadatan terbitan resmi hanya ada di DKB 2023 S2; angka kepadatan 2025 adalah hasil hitung komputasi turunan menggunakan luas 2023 (populasi 2025 ÷ luas 2023), BUKAN angka kepadatan resmi yang diterbitkan oleh Dukcapil pada rilis 2025 S1. Jangan mengasumsikan luas tidak berubah antar periode tanpa catatan limitasi.

**DIPUTUSKAN**: ganti seluruh blok ini dengan tabel Dukcapil per kecamatan di `derived_population.json` lengkap dengan periode & batasan sumber. Lihat `DECISIONS.md` §1. Lisensi Dukcapil tetap terbuka (§8).

## 2. Batas administrasi

| Item | Temuan |
|---|---|
| Format | `FeatureCollection`, 7 `Polygon`, properti `id`, `name`, `kabupaten`, `area_km2` |
| Luas hasil hitung | 165,90 km² total; deviasi −27,3% … +0,0% terhadap `area_km2` (lihat `probe_geometry.js`) |
| Status validitas batas | **Ketidakpastian dipertahankan (retains uncertainty)** — kedekatan luas hitung (165,90 km² vs resmi 164,85 km²) bukan konfirmasi kebenaran batas; tidak boleh disimpulkan 'geometri benar' tanpa audit kartografis resmi terhadap peta BIG |
| Provenance | **tidak tercatat** — tidak ada URL, tanggal unduh, atau versi OSM/BIG di file maupun repo |
| Akurasi batas | tidak diaudit terhadap peta dasar resmi BIG/Kemendagri; simpul 777–1.854 per kecamatan |
| Lisensi | **tidak diketahui** |

**DIPUTUSKAN**: ganti dengan ekstraksi OSM `admin_level=6` (ODbL), skrip `fetch_osm_boundaries.js`, output `osm_boundaries.geojson` + `osm_boundaries_meta.json`. Deviasi luas +0,61 % vs Dukcapil. Simpan
metadata sumber & tanggal. `area_km2` di properti harus dihitung dari geometri resmi beratribusi, bukan angka terpisah tanpa rujukan.

## 3. `competitors.json` — jumlah POI

Klaim dashboard: "diektraksi via Overpass API, tag `amenity=cafe`, `shop=clothes`".
Tidak ada skrip, snapshot, atau definisi tag di repo. **Uji ulang dilakukan Gate 1:**

- Skrip: `docs/gate1/fetch_osm_cafe.sh` (amenity=cafe saja), `docs/gate1/fetch_osm_fnb.sh` (FnB
  gabungan sesuai label sektor dashboard), `docs/gate1/fetch_osm_cafe.sh` untuk pembanding.
- Hasil tersimpan di `docs/gate1/osm_cafe_counts.json` dan `docs/gate1/osm_fnb_counts.json`,
  lengkap dengan `osm_relation` dan `snapshot`.
- Catatan query: query dieksekusi per kecamatan pada 2026-10-19 dengan timestamp terpisah (OSM cafe: 06:10–06:14Z; OSM FnB: 06:20–06:24Z), bukan snapshot atomik tunggal.

Hasil terukur (snapshot teruji 2026-10-19, relasi dan timestamp dicatat di JSON):

| Kecamatan | OSM cafe | OSM FnB (longgar) | `competitors.json` fnb | dataset ÷ OSM-FnB | OSM FnB /10k jiwa (populasi konsep)* |
|---|---|---|---|---|---|
| Ciputat | 40 | 60 | 130 | 2,17 | 2,87 |
| Ciputat Timur | 4 | 17 | 150 | 8,82 | 0,98 |
| Pamulang | 34 | 142 | 210 | 1,48 | 4,54 |
| Pondok Aren | 29 | 110 | 290 | 2,64 | 3,61 |
| Serpong | 30 | 142 | 320 | 2,25 | 8,76 |
| Serpong Utara | 11 | 76 | 180 | 2,37 | 5,54 |
| Setu | 5 | 16 | 45 | 2,81 | 1,89 |
| **Total** | **153** | **563** | **1325** | **2,35** | — |

Definisi FnB longgar = `amenity ∈ {cafe, restaurant, fast_food, bar, pub}` ∪ `shop=bakery`.

\* *Catatan kolom 'OSM FnB /10k jiwa (populasi konsep)': Menggunakan penyebut populasi konsep saat ini dari `demographics.json` (total 1.382.400 jiwa) yang belum terverifikasi sumber primernya. Rasio per 10k ini bersifat eksploratif analitis, BUKAN metrik resmi terbitan pemerintah.*

**Kesimpulan 1 — angka konsep tidak ter-reproduksi pada parameter uji.** Total dataset konsep 1.325 vs 153 (OSM cafe) dan 563 (OSM FnB longgar) pada snapshot uji. Tag, relasi poligon batas, atau rentang waktu yang digunakan dalam dataset konsep belum diketahui atau direproduksi. Klaim dashboard bahwa angka berasal dari Overpass API dengan tag cafe/clothes tetap tidak terverifikasi.

**Kesimpulan 2 — peringkat berubah berdasarkan definisi metrik.**

| Dasar peringkat | Urutan |
|---|---|
| `competitors.json` (dataset) | Serpong > Pondok Aren > Pamulang > Serpong Utara > Ciputat Timur > Ciputat > Setu |
| OSM FnB absolut | Pamulang = Serpong (imbang 142) > Pondok Aren (110) > Serpong Utara (76) > Ciputat (60) > Ciputat Timur (17) > Setu (16) |
| OSM cafe absolut | Ciputat > Pamulang > Serpong > Pondok Aren > Serpong Utara > Setu > Ciputat Timur |
| OSM FnB per 10k jiwa (eksploratif) | Serpong > Serpong Utara > Pamulang > Pondok Aren > Ciputat > Setu > Ciputat Timur |
| dataset per 10k jiwa | Serpong > Serpong Utara > Pondok Aren > Ciputat Timur > Pamulang > Ciputat > Setu |

Ciputat Timur adalah kasus paling ekstrem: peringkat 5 di dataset konsep, tetapi **terendah** di OSM cafe (4 POI) maupun per kapita. Klaim "Ciputat Timur kompetitif" tidak didukung data hasil uji.

**Kesimpulan 3 — eksplorasi alternatif metrik (absolut vs per kapita/luas).** Serpong dan Pamulang sama-sama mencatat angka absolut tertinggi (imbang di 142 POI), namun karena populasi konsep Serpong relatif lebih kecil (162.100 vs 312.500 di Pamulang), rasio eksploratif per 10k jiwa Serpong menjadi yang tertinggi (8,76 vs 4,54/10k). Sesuai `PUBLICATION_PLAN.md` § Gate 3, alternatif metrik kompetitor absolut vs per kapita/luas perlu dibandingkan secara analitis sesuai kebutuhan pertanyaan bisnis, bukan diputuskan sepihak tanpa persetujuan pemilik.

### 3a. Bukti bias OSM (dasar label "bukan jumlah usaha sebenarnya")

Ground truth independen: 298 kafe hasil scrape Google Maps di proyek `Tangsel Coffeeshop Business`
(`data/processed/tangsel_coffee_master.json`, tiap baris punya `directLink` yang bisa dibuka).

| Kecamatan | Google Maps | OSM cafe | rasio bias |
|---|---|---|---|
| Ciputat Timur | 23 | 4 | **5,75×** |
| Serpong Utara | 42 | 11 | **3,82×** |
| Serpong | 67 | 30 | 2,23× |
| Pondok Aren | 55 | 29 | 1,90× |
| Pamulang | 59 | 34 | 1,74× |
| Ciputat | 50 | 40 | 1,25× |
| Setu | 2 | 5 | **0,40×** |
| **Total** | **298** | **153** | 1,95× |

Bias **tidak seragam** (1,25×–5,75×, satu kecamatan terbalik) → POI OSM mengukur kelengkapan
pemetaan sukarela, bukan populasi usaha. Karena itu metode absolut ditolak sebagai metrik utama
dan label UI dikunci.

**DIPUTUSKAN**: buang angka lama; pakai 3 sektor (`retail`/`health`/`education`) dari `osm_sector_counts.json`. Cafe dibuang (duplikat produk lain + bias terburuk). Wajib dilabeli "kepadatan POI terpetakan". Lihat `DECISIONS.md` §2–§3.

## 4. `traffic.json` — skor aksesibilitas

| Item | Temuan |
|---|---|
| Sumber | tidak ada |
| Metode | tidak ada — `accessibilityScore` 0,50–0,90 dan `trafficLevel` Rendah/Sedang/Tinggi tanpa rumus |
| Konsistensi | `details` berupa narasi; `AnalyticsPanel` tidak membacanya (defect tercatat di `PROJECT.md`) |

**DIPUTUSKAN: dibuang** dari model inti. Tidak ada data lalu lintas publik per kecamatan yang bisa
diklaim tanpa survei. Alternatif yang jujur: proxy jarak ke gerbang tol/stasiun dari geometri
(yang bisa dihitung dan diverifikasi), atau hapus metrik ini.

## 5. `biMetrics.json` — daya beli, sewa, demografi umur, tren, anchor

| Field | Status | Catatan |
|---|---|---|
| `dayaBeli` (Rp 2,5–3,8 jt) | **asumsi** | Tidak ada sumber; angka kota (PDRB/pengeluaran per kapita) tidak boleh ditempel ke kecamatan |
| `biayaSewa` (Rp 180–450 rb) | **asumsi** | Satuannya sendiri belum pasti (`/m²` vs `/bln`); tidak ada sumber properti komersial |
| `demografiUmur.youth_15_34_pct` | **asumsi** | Tersedia dari ekstraksi aktual DKB Dukcapil 2025 S1 (77 kelompok usia per kecamatan di `derived_population.json`, bukan sekadar data hipotesis BPS) |
| `demografiUmur.productive_pct` (0,60–0,62) | **asumsi** | Kota: 72,01% usia produktif (Pemkot 2024 / DKB 2024 S1) dan 72,20% (DKB 2025 S1). Nilai kecamatan 60–62% di dataset konsep tidak konsisten dengan angka agregat kota (deviasi ~10–12 pp tanpa rujukan sumber tercatat) |
| `trenHistoris` (4,5–7,5%/th) | **asumsi** | Kota 1,05%/th (2023–2024). Nilai kecamatan 4–7× lebih tinggi tanpa dasar |
| `anchorPoiCount` (3–11) | **asumsi** | Bisa dihitung dari OSM (stasiun, terminal, mall) — layak dijadikan indikator nyata |

**DIPUTUSKAN: dibuang** dari model inti (daya beli, sewa, tren). Yang diselamatkan dan dipakai:
`demografiUmur` (tersedia dari ekstraksi aktual DKB Dukcapil 2025 S1) dan `anchorPoiCount` (hitungan OSM dengan definisi tag).

## 6. Ringkasan lulus/tidak

| Indikator | Boleh dipakai publik sekarang? |
|---|---|
| Jumlah kecamatan & luas kota | ya — 7 kecamatan, luas resmi 164,85–164,86 km² (Pemkot / Dukcapil DKB) |
| Populasi per kecamatan | **ya** — DKB 2025 S1 (1.474.311 jiwa) terparsing & terekonsiliasi (`derive_population.js`), hash tercatat di `source_manifest.json`. Catatan lisensi Dukcapil tetap terbuka (§8) |
| Luas per kecamatan | **ya, dengan catatan** — luas per kecamatan dari DKB 2023 S2 (satu-satunya rilis yang memuatnya). Kepadatan 2025 = populasi 2025 ÷ luas 2023, dilabeli **turunan**, bukan angka terbitan |
| Batas administrasi | **ya** — layer baru dari OSM `admin_level=6` (`osm_boundaries.geojson`), relasi + snapshot + lisensi ODbL tercatat, luas total 165,86 km² (+0,61 % vs Dukcapil). Layer lama (dari KMZ, provenance kosong) **diganti**. Catatan: OSM bukan otoritas batas — lihat §8 |
| Jumlah POI kompetitor | **ya, 3 sektor** (retail/health/education) dari `osm_sector_counts.json`, tag terkunci, relasi + snapshot tercatat. **Wajib** dilabeli "kepadatan POI terpetakan", bukan "jumlah kompetitor" — bias OSM terukur 1,25×–5,75× |
| Skor aksesibilitas | **dibuang** dari model inti. Tidak ada sumber primer maupun metode |
| Daya beli / sewa / tren | **dibuang** dari model inti (keputusan pemilik 2026-10-19). Asumsi tanpa dasar rujukan |
| Demografi umur / anchor POI | **ya** — 77 kelompok usia dari DKB 2025 S1; anchor POI dari OSM (`railway=station`, `amenity=bus_station`, `shop=mall`), nilai 1–8 per kecamatan |


## 7. Keputusan final (ACC pemilik 2026-10-19)

Rincian lengkap: **`docs/gate1/DECISIONS.md`**. Ringkasnya:

1. **6 indikator inti** bersumber: kepadatan penduduk, populasi, usia 15–34 %, usia 15–64 %, POI kompetitor per 10k jiwa, anchor POI.
2. **Dibuang**: skor aksesibilitas, daya beli, biaya sewa, tren historis, `cafe_competitor_count`.
3. **3 sektor**: `retail`, `health`, `education` (tag terkunci di `DECISIONS.md` §3). Cafe dibuang — sudah jadi produk tersendiri dan punya bias OSM terburuk.
4. **Batas administrasi**: ganti ke OSM `admin_level=6`, lisensi ODbL, skrip `fetch_osm_boundaries.js`, deviasi luas +0,61 % terhadap Dukcapil. Layer lama terbukti berasal dari KMZ tanpa metadata.
5. **Metrik kompetitor**: per 10k jiwa sebagai utama; absolut hanya kolom pendamping. Peringkat berubah 7/7 (retail), 6/7 (health), 7/7 (education).
6. **Normalizer** diturunkan dari data (max nyata), bukan angka yang diasumsikan.

## 8. Risiko terbuka yang diterima pemilik

| Risiko | Status |
|---|---|
| Lisensi publikasi Dukcapil | PDF tidak memuat klausul lisensi terbuka. Dipakai dengan atribusi + catatan limitasi |
| OSM bukan otoritas batas | ODbL jelas, tapi deviasi luas +0,61 % bukan sertifikasi kartografis |
| Ground truth kafe (Google Maps) | dipakai **hanya sebagai bukti bias**, tidak masuk dashboard. Scrape Google Maps melanggar ToS bila didistribusikan ulang |
| `estimatedDailyRevenue` produk cafe | berasal dari `txPerHour()` hardcode 20/15/10/8 — cacat sejenis bila produk itu dipublish |
| Akurasi titik POI OSM | titik bisa berada di tengah gedung atau salah kecamatan dekat batas; tidak diaudit per titik |
