# Studi Kasus: Di Mana Sektor Usaha Masih Longgar di Tangerang Selatan?

*Cantikaputri Febrianti · Business Analyst · pembaruan terakhir 21 Oktober 2026*

---

## Masalah

Orang yang mau buka usaha di Tangerang Selatan menghadapi pertanyaan yang kelihatannya
sederhana: **di kecamatan mana sektor yang saya pilih belum padat?** Jawaban yang beredar
biasanya berupa kesan ("katanya Pamulang sudah penuh"), bukan angka. Sementara data resmi
yang ada — jumlah penduduk, struktur usia, luas wilayah — tidak langsung menjawabnya, dan
data jumlah usaha per kecamatan tidak dipublikasikan rutin.

Yang bisa dijawab dengan data publik bukan "usaha ini akan untung", melainkan pertanyaan
yang lebih sempit dan jujur: **di antara 7 kecamatan, bagaimana posisi relatif sebuah sektor
usaha kalau dilihat dari ukuran pasar dan kepadatan usaha sejenis yang sudah terpetakan?**

## Pengguna

Calon pemilik usaha skala kecil (retail/minimarket, klinik, bimbingan belajar) yang sedang
memilih lokasi, biasanya dengan modal terbatas dan tanpa akses ke riset pasar berbayar.
Kebutuhan mereka bukan laporan 40 halaman, melainkan satu perbandingan yang bisa dipakai
sebelum survei lokasi.

## Scope

**Masuk:** 7 kecamatan Kota Tangerang Selatan; 3 sektor (retail & minimarket, kesehatan,
pendidikan); 6 indikator yang punya sumber publik; satu skor relatif antar kecamatan.

**Keluar (sengaja):** sewa, daya beli, lalu lintas pejalan kaki, legalitas zonasi, prediksi
omzet, dan putusan layak/tidak layak. Semua itu tidak tersedia per kecamatan dari sumber
publik yang bisa dipertanggungjawabkan — memasukkannya berarti mengarang.

## Sumber data

| Indikator | Sumber | Periode |
|---|---|---|
| Jumlah penduduk (S2) | Data Konsolidasi Bersih (DKB) Dinas Kependudukan dan Pencatatan Sipil Kota Tangsel | Semester I 2025 |
| Struktur usia 15–34 (S3), 15–64 (S4) | DKB, tabel yang sama | Semester I 2025 |
| Luas wilayah → kepadatan (S1) | DKB | Semester II 2023 |
| Kepadatan POI usaha (S5) & anchor (S6) | OpenStreetMap via Overpass API, lisensi ODbL 1.0 | snapshot 19 Okt 2026 |

Semua tautan sumber dipasang langsung di dashboard dan sudah diuji merespons 200.
Setiap PDF sumber dipin dengan hash SHA-256 supaya perubahan di hulu terdeteksi, bukan
diasumsikan tidak ada.

## Pembersihan data

Pipeline `npm run data:build` melakukan 11 pemeriksaan sebelum dataset dianggap sah:

- **Populasi per kecamatan harus menjumlah ke total PDF.** Selisih sekecil apa pun menggagalkan build.
- **Luas dari geometri OSM dibandingkan dengan luas terbitan** — deviasi 0,61 %, di bawah toleransi 2 %.
- **Kepadatan dihitung ulang dari populasi/luas**, bukan dikutip dari tabel DKB. Alasannya konkret: tabel kepadatan terbitan DKB 2025 S1 tidak konsisten dengan populasi dan luasnya sendiri (total terbit 8.581 jiwa/km², hitungan 8.943). Angka terbitan tetap disimpan sebagai jejak audit, tapi tidak dipakai.
- **Hitungan POI harus bilangan bulat dan bukan nol** untuk 21 kombinasi kecamatan × sektor.
- **Nilai hilang, null, NaN, dan penyebut nol digagalkan**, bukan diisi 0. Nol pada S5 akan terbaca sebagai "tidak ada pesaing" dan memberi peringkat palsu.
- `npm run data:qc` menjalankan 4 mutasi dataset yang sengaja dirusak; keempatnya harus gagal, dan satu dataset sehat harus lulus.

## Metode

Skor = (0,20·S1 + 0,20·S2 + 0,15·S3 + 0,15·S4 + 0,15·S5 + 0,15·S6) × 10, dibulatkan
1 desimal dan dijepit di rentang 1,0–10,0.

S1 kepadatan penduduk · S2 jumlah penduduk · S3 porsi usia 15–34 · S4 porsi usia 15–64 ·
S5 ruang pasar tersisa (1 − kepadatan POI sejenis terhadap maksimum) · S6 anchor POI
(pusat belanja, kampus, simpul transportasi).

Normalisasi memakai **nilai maksimum nyata antar kecamatan di dataset**, bukan angka yang
diasumsikan. Bobot diambil dari pertimbangan desain, dan bahwa itu pertimbangan — bukan
hasil kalibrasi — dinyatakan terbuka di dashboard.

## Temuan yang dihitung

### 1. Tiga kecamatan selalu di puncak, tiga sektor sekaligus

Pondok Aren, Pamulang, dan Ciputat menempati tiga posisi teratas di retail, kesehatan, dan
pendidikan. Rentang skor seluruh kombinasi hanya 5,6–9,2.

Artinya perbedaan antar sektor kecil dibanding perbedaan antar kecamatan. Ini masuk akal
secara metode: 70 % bobot (S1–S4) berasal dari data kependudukan yang sama untuk semua
sektor, jadi porsi yang membedakan sektor hanya 30 %. Pembaca yang mencari "sektor apa yang
bagus di kecamatan X" perlu tahu bahwa alat ini sebenarnya lebih tajam menjawab "kecamatan
mana", bukan "sektor apa".

### 2. Sektor paling berbeda justru di Ciputat Timur (selisih 1,2 poin)

Ciputat Timur retail 7,1 · kesehatan 6,2 · pendidikan 5,9. Ini satu-satunya kecamatan dengan
selisih antar sektor di atas 1 poin, dan penyebabnya terlihat di komponennya: kepadatan POI
pendidikan di sana 7,51 per 10 ribu penduduk, tertinggi di kota dan tepat di batas atas
normalisasi, sehingga S5 nya 0,00. Ruang pasar pendidikan di Ciputat Timur habis menurut
data yang terpetakan, sementara retail masih menyisakan ruang.

### 3. Serpong adalah kasus kebalikan, dan itu terlihat dari S5

Serpong punya 86 POI retail terpetakan — terbanyak di kota — tapi populasi 172.931 jiwa di
area 28,27 km². Kepadatan POI retail 4,97 per 10 ribu penduduk, tepat di maksimum, jadi
S5 = 0,00 dan skornya tertahan di 6,2 meski S6 (anchor) 0,75. Kalau hanya melihat jumlah
usaha mentah, Serpong terlihat paling padat; setelah dinormalisasi per penduduk, Serpong
sebenarnya sama padatnya dengan kecamatan lain, bukan 3× lebih padat.

## Trade-off yang diambil

| Keputusan | Alternatif yang ditolak | Alasan |
|---|---|---|
| Skor relatif antar kecamatan | Ambang absolut "layak/tidak layak" | Tidak ada data hasil usaha untuk menetapkan ambang; ambang absolut akan terlihat otoritatif tanpa dasar |
| POI OSM sebagai proksi kepadatan usaha | Sensus usaha resmi | Sensus tidak tersedia publik per kecamatan. Bias OSM terukur 1,25×–5,75× dan dinyatakan sebagai limitasi, bukan disembunyikan |
| Normalisasi ke maksimum dataset | Skala 0–100 dengan target tetap | Target tetap butuh asumsi yang tak bisa diuji; maksimum dataset setidaknya bisa ditelusuri |
| Luas 2023 dipakai untuk kepadatan 2025 | Mengosongkan S1 | Batas kecamatan praktis tidak berubah dalam dua tahun; ini asumsi yang dicatat, bukan fakta yang diklaim |
| Bobot dari pertimbangan desain | Bobot dari regresi hasil usaha | Tidak ada data hasil usaha per kecamatan untuk meregresi |

## Keterbatasan

- **Bukan putusan kelayakan.** Skor 9,0 berarti "paling tinggi di antara 7 kecamatan menurut
  6 indikator ini", bukan "usaha ini akan berhasil".
- **POI OSM ≠ jumlah usaha.** Biasnya terukur dan tidak seragam; di Setu arah biasnya bahkan
  terbalik. Angka ini dipakai sebagai *kepadatan POI terpetakan*.
- **Bobot belum dikalibrasi.** Sudah diuji sensitivitasnya: juara bertahan terhadap revisi
  bobot sampai sekitar 10 poin persen, tapi label kategoris rapuh — 37,5–43,9 % sel bobot
  mengubah label. Jadi baca peringkatnya, jangan baca labelnya.
- **S3 dan S4 nyaris konstan** (0,9205–1,0000 dan 0,9556–1,0000). Keduanya bekerja sebagai
  konstanta bersama, bukan pembeda. Menambah indikator usia tidak akan menajamkan peringkat.
- **Lisensi Dukcapil belum jelas.** Data dipakai dengan atribusi penuh, tapi belum ada
  konfirmasi klausul terbuka untuk publikasi ulang.
- **Batas kecamatan dari OSM**, bukan dari BIG atau Kemendagri.

## Tindak lanjut

1. Kalibrasi bobot terhadap data hasil usaha (survival rate per sektor per kecamatan) —
   ini satu-satunya cara mengubah bobot dari pertimbangan menjadi terukur.
2. Tambah sektor hanya kalau definisi tag OSM-nya bisa dipertanggungjawabkan (mis. kafe
   sebagai definisi sempit, bukan seluruh FnB).
3. Uji lapangan kecil: 5–10 titik di kecamatan skor rendah untuk memeriksa apakah "longgar"
   di data memang longgar di jalan.
4. Ganti proksi POI dengan data perizinan usaha kalau Pemkot membukanya.

## Cara memeriksa angka di dokumen ini

```bash
npm run data:build   # bangun ulang dataset dari sumber + 11 QC
npm run data:qc      # 4 mutasi harus gagal, kontrol sehat harus lulus
npm test             # engine 15 kasus + UI render 8 subtest
```

Semua angka di atas berasal dari `docs/gate2/verified_dataset.json` hasil build, dibaca
lewat `calculateScore()` — bukan dihitung ulang dengan cara lain di dokumen ini.
