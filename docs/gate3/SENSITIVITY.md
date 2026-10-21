# Gate 3 lanjutan — Uji sensitivitas bobot

Status: **dijalankan 2026-10-20.** Skrip: `docs/gate3/sensitivity.js`. Artefak: `docs/gate3/sensitivity_results.json`.
Reproduksi: `npx tsx docs/gate3/sensitivity.js` (deterministik — dua run menghasilkan output identik; PRNG LCG ber-seed).

## Pertanyaan

Bobot `0,20/0,20/0,15/0,15/0,15/0,15` di `SCORE_WEIGHTS` adalah **penilaian perancang, bukan hasil kalibrasi**. Tanpa data hasil usaha (outcome), bobot tidak bisa diestimasi — yang bisa dijawab hanya: *seberapa jauh kesimpulan bergantung pada pilihan bobot itu?*

## Metode

1. `S1..S6` diambil dari `calculateScore()` — skor indikator tidak bergantung pada bobot, jadi tidak ada rumus kedua yang ditulis ulang. **Equivalence check lebih dulu: 21/21 kombinasi mereproduksi `compositeScore` persis; kalau tidak, skrip abort.**
2. Rekombinasi dengan vektor bobot alternatif memakai aturan produksi yang sama (×10, bulat 1 desimal, clamp 1,0–10,0).
3. Empat keluarga uji: skenario bernama, leave-one-indicator-out, Monte Carlo seragam pada simpleks, dan perturbasi lokal di sekitar baseline.
4. Stabilitas diukur dengan Spearman terhadap peringkat baseline, P(juara #1 sama), dan P(himpunan top-3 sama).

Batas metode: uji ini mengukur sensitivitas **terhadap bobot saja**. Ia tidak mengukur galat pengukuran POI OSM (bias 1,25×–5,75× yang belum terkuantifikasi per kecamatan) maupun galat populasi/luas. Sensitivitas gabungan akan lebih lebar dari angka di bawah.

## Hasil

### A. Revisi kecil bobot tidak menggoyang juara

Perturbasi lokal `Dirichlet(w × konsentrasi)`, 5.000 draw per tingkat:

| Deviasi maks rata-rata | retail top-1 | health top-1 | education top-1 | ρ rata-rata |
|---|---|---|---|---|
| 4,2 poin persen | 100,0 % | 100,0 % | 100,0 % | 0,972–0,990 |
| 8,5 poin persen | 96,7 % | 99,8 % | 98,6 % | 0,957–0,981 |
| 13,4 poin persen | 86,0 % | 96,2 % | 91,0 % | 0,934–0,958 |

Kesimpulan praktis: **selama revisi bobot tetap di bawah ~10 poin persen, peringkat juara tidak berubah.** Setu paling sering di dasar (median peringkat 7 dari 7) tetapi tidak selalu: ia bisa naik sampai peringkat 2 (retail) di bawah bobot ekstrem, karena populasinya kecil namun kepadatan POI-nya sangat rendah.

### B. Perubahan besar mengubah juara, tetapi tidak acak

Monte Carlo 20.000 vektor seragam pada simpleks (ini sengaja ekstrem — separuh massa menempatkan satu indikator mendominasi):

| Sektor | P(top-1 sama) | P(top-3 sama) | ρ rata-rata | ρ terburuk |
|---|---|---|---|---|
| retail | 69,3 % | 71,6 % | 0,873 | −0,071 |
| health | 87,3 % | 73,5 % | 0,870 | 0,393 |
| education | 78,4 % | 56,0 % | 0,881 | 0,357 |

Hanya 3 kecamatan yang pernah menempati #1 di seluruh 20.000 draw: **Pondok Aren (69–87 %), Pamulang (12–21 %), Ciputat (≤10 %)**, dan Serpong Utara 2,3 % (education). Peringkat 4–7 praktis tidak pernah naik ke puncak. Jadi garis besar "utara-tengah lebih baik dari selatan" bukan artefak bobot; identitas juara pertama saja yang bisa bertukar antara Pondok Aren dan Pamulang.

### C. Yang paling menentukan hasil adalah anchor POI dan populasi

Leave-one-indicator-out (bobot sisanya dinormalisasi ulang):

| Dibuang | retail ρ | health ρ | education ρ | Juara berubah? |
|---|---|---|---|---|
| W1 kepadatan | 1,00 | 0,93 | 0,93 | tidak |
| W2 total populasi | 0,93 | 0,93 | 0,86 | tidak |
| W3 usia 15–34 | 1,00 | 0,96 | 1,00 | tidak |
| W4 usia 15–64 | 1,00 | 0,96 | 1,00 | tidak |
| W5 peluang pasar | 0,96 | 1,00 | 1,00 | tidak |
| W6 anchor POI | 0,89 | 0,79 | 0,93 | **ya → Pamulang** |

W3 dan W4 bisa dibuang tanpa mengubah urutan sama sekali. Sebabnya terukur: dalam dataset ini **S3 hanya menempati rentang 0,9205–1,0000** dan **S4 0,9556–1,0000** (6 dan 7 nilai berbeda dari 7 kecamatan). Keduanya nyaris konstan, jadi bobot 0,15 untuk masing-masing efektif hanya menambah ~0,28 dan ~0,29 sebagai konstanta ke setiap skor — menaikkan semua kecamatan bersama-sama tanpa mengubah urutan. W6 satu-satunya yang menghilangkan juara Pondok Aren — masuk akal, Pondok Aren punya 8 anchor (maksimum dataset).

Uji indikator tunggal memperkuat ini: "peluang pasar saja" memberi ρ=0,04 (retail) sampai 0,14 (education) terhadap baseline — praktis peringkat terbalik, karena metrik itu menghukum kecamatan padat-POI yang justru skor-tertinggi. Bahkan untuk health, yang ρ-nya paling tinggi, angkanya hanya 0,46. Ini bukti kuantitatif bahwa arah S5 (POI padat = peluang rendah) adalah asumsi, bukan temuan.

### D. Label lebih rapuh daripada peringkat

Di bawah bobot acak, label interpretasi berubah pada **37,5 % (retail), 43,9 % (health), 40,5 % (education)** sel-bobot. Penyebabnya jarak skor ke ambang: health punya **4 dari 7** kecamatan berjarak ≤0,3 dari ambang 3,0/5,0/6,5/8,0; education 2 dari 7; retail 1 dari 7.

Artinya: menyebut satu kecamatan "Baik" sedangkan yang lain "Cukup" tidak tahan terhadap revisi bobot, walaupun urutan juaranya tahan.

## Yang harus dikatakan di UI/README

1. Peringkat juara tahan terhadap revisi kecil bobot; identitas juara **tidak** tahan terhadap perubahan besar (Pondok Aren ↔ Pamulang).
2. Label kategoris rapuh — jangan dikutip sebagai sifat wilayah.
3. **W3/W4 nyaris tidak berfungsi sebagai pembeda dalam dataset ini** (S3 rentang 0,92–1,00; S4 0,956–1,00) — bobot 0,15 untuk keduanya secara efektif hanya menambah konstanta yang sama ke semua kecamatan.
4. Arah S5 (kepadatan POI tinggi = skor rendah) adalah **asumsi desain** yang, jika dibalik, membalik peringkat. Ini harus tertulis sebagai pilihan, bukan hasil analisis.

## Batas

- Bobot tidak bisa **dikalibrasi** tanpa data hasil usaha. Uji ini hanya memetakan ketergantungan, bukan memvalidasi.
- Sensitivitas terhadap galat data (POI bias per kecamatan, luas 2023 dipinjam untuk 2025) belum diuji dan akan memperlebar rentang.
- Angka di sini adalah properti model saat ini, bukan alasan menala bobot agar terlihat lebih baik.
