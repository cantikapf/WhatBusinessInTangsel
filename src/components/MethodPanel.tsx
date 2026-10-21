import React, { useState } from 'react';
import verifiedDataset from '../data/verifiedDataset';
import { SCORE_WEIGHTS } from '../lib/engine/scoring';
import { MethodFigure } from './method-figure/figure';

const WEIGHTS = [
  {
    code: 'S1',
    label: 'Kepadatan penduduk',
    weight: SCORE_WEIGHTS.W1,
    why: 'Makin padat, makin banyak orang lewat di depan pintu usaha.',
  },
  {
    code: 'S2',
    label: 'Jumlah penduduk',
    weight: SCORE_WEIGHTS.W2,
    why: 'Ukuran pasar paling dasar: berapa banyak orang tinggal di kecamatan itu.',
  },
  {
    code: 'S3',
    label: 'Penduduk usia 15–34',
    weight: SCORE_WEIGHTS.W3,
    why: 'Kelompok yang paling cepat mencoba tempat atau produk baru.',
  },
  {
    code: 'S4',
    label: 'Penduduk usia 15–64',
    weight: SCORE_WEIGHTS.W4,
    why: 'Kelompok yang punya penghasilan sendiri.',
  },
  {
    code: 'S5',
    label: 'Ruang pasar yang tersisa',
    weight: SCORE_WEIGHTS.W5,
    why: 'Makin sedikit usaha sejenis yang sudah terpetakan, makin longgar pasar di sana.',
  },
  {
    code: 'S6',
    label: 'Titik ramai',
    weight: SCORE_WEIGHTS.W6,
    why: 'Pusat perbelanjaan, kampus, dan simpul transportasi yang menarik orang datang.',
  },
];

const LINKS = {
  dkb2025:
    'https://disdukcapil.tangerangselatankota.go.id/uploads/demografi/KESELURUHAN1764555784678.pdf',
  dkb2023:
    'https://disdukcapil.tangerangselatankota.go.id/uploads/demografi/KESELURUHAN1706581708476.pdf',
  overpass: 'https://overpass-turbo.eu/',
  odbl: 'https://opendatacommons.org/licenses/odbl/1-0/',
  boundary: 'https://www.openstreetmap.org/relation/10989408',
};

function OutLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-600 underline decoration-indigo-200 underline-offset-2 hover:text-indigo-800 hover:decoration-indigo-500 font-medium break-words"
    >
      {children}
    </a>
  );
}

export const MethodPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  const built = new Date(verifiedDataset.generated_at);
  const builtLabel = built.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <section
      id="method-panel"
      aria-labelledby="method-panel-title"
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 dashboard-card"
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-scale w-5 h-5 text-indigo-600"
            aria-hidden="true"
          >
            <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
            <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
            <path d="M7 21h10" />
            <path d="M12 3v18" />
            <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
          </svg>
          <h2 id="method-panel-title" className="font-bold text-slate-800 text-base">
            Metodologi, Bobot &amp; Sumber Data
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="method-panel-content"
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer self-start sm:self-auto"
        >
          {isOpen ? 'Sembunyikan rincian' : 'Tampilkan rincian'}
        </button>
      </div>

      <div id="method-panel-content" className={`space-y-6 ${isOpen ? 'block' : 'hidden'}`}>
        {/* The method, drawn */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Cara skornya dihitung</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Bayangkan sebuah timbangan. Enam indikator jadi enam anak timbangan: makin tinggi
            nilainya di suatu kecamatan, makin berat beban yang ditanggungnya. Skornya adalah
            tinggi total tumpukan itu, dan pembaca geser di lengannya berdiri di angka yang sama.
          </p>
          <MethodFigure />
        </div>

        {/* Weights */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Komposisi Bobot Indikator</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-left">
                <tr>
                  <th className="px-3 py-2.5">Kode</th>
                  <th className="px-3 py-2.5">Indikator</th>
                  <th className="px-3 py-2.5">Bobot</th>
                  <th className="px-3 py-2.5">Kenapa dipakai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {WEIGHTS.map((item) => (
                  <tr key={item.code} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 font-mono font-bold text-indigo-600">{item.code}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-900">{item.label}</td>
                    <td className="px-3 py-2.5 font-semibold text-slate-800">
                      {`${Math.round(item.weight * 100)}%`}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{item.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {`Skor = (${Object.values(SCORE_WEIGHTS)
              .map((w, i) => `${w.toFixed(2).replace('.', ',')}×S${i + 1}`)
              .join(' + ')}) × 10, dibulatkan ke satu desimal dalam rentang 1,0–10,0. Total bobot ${Object.values(
              SCORE_WEIGHTS,
            )
              .reduce((a, b) => a + b, 0)
              .toFixed(2)
              .replace('.', ',')}.`}
          </p>
          <p className="text-[11px] text-slate-500">
            Tiap indikator dibagi dulu dengan nilai tertinggi antar kecamatan, jadi semuanya
            berskala 0–1 sebelum dibobot. Tidak ada angka yang dipatok manual.
          </p>
        </div>

        {/* Sources, with the documents themselves */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Sumber Primer Terverifikasi</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Semua angka di halaman ini berasal dari berkas terbuka di bawah. Klik untuk membuka
            dokumen aslinya.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-slate-800">1. Penduduk &amp; struktur usia</span>
                <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium whitespace-nowrap">
                  Dukcapil Tangsel
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Data Konsolidasi Bersih Semester I 2025. Tabel jumlah penduduk per kecamatan dan
                tabel penduduk menurut usia.
              </p>
              <p>
                <OutLink href={LINKS.dkb2025}>Buka DKB Semester I 2025 (PDF)</OutLink>
              </p>
              <p className="text-[11px] text-slate-500">
                {verifiedDataset.sources.population.agency}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-slate-800">2. Luas wilayah</span>
                <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium whitespace-nowrap">
                  DKB Semester II 2023
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Dukcapil hanya menerbitkan tabel luas wilayah di rilis ini, jadi luasnya dipinjam
                dari 2023 sementara penduduknya tetap 2025. Kepadatan dihitung dari keduanya.
              </p>
              <p>
                <OutLink href={LINKS.dkb2023}>Buka DKB Semester II 2023 (PDF)</OutLink>
              </p>
              <p className="text-[11px] text-slate-500">
                Batas: perubahan luas wilayah setelah 2023 belum tercakup.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-slate-800">3. Sebaran usaha terpetakan</span>
                <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium whitespace-nowrap">
                  OpenStreetMap
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Jumlah titik retail, kesehatan, dan pendidikan per kecamatan, diambil lewat Overpass
                API. Ini titik yang terpetakan di OSM, bukan jumlah usaha sebenarnya di lapangan.
              </p>
              <p>
                <OutLink href={LINKS.overpass}>Overpass Turbo</OutLink>
                <span className="text-slate-400"> · </span>
                <OutLink href={LINKS.odbl}>Lisensi ODbL 1.0</OutLink>
              </p>
              <p className="text-[11px] text-slate-500">
                Bias terukur 1,25×–5,75× terhadap Google Maps, dan arah biasnya berbalik di Setu.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-slate-800">4. Batas kecamatan</span>
                <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium whitespace-nowrap">
                  OSM batas admin
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Poligon 7 kecamatan Kota Tangerang Selatan, dipakai untuk memotong dan menghitung
                titik usaha di dalam tiap wilayah.
              </p>
              <p>
                <OutLink href={LINKS.boundary}>Contoh: relasi Ciputat</OutLink>
                <span className="text-slate-400"> · </span>
                <OutLink href={LINKS.odbl}>ODbL 1.0</OutLink>
              </p>
              <p className="text-[11px] text-slate-500">
                Bukan batas resmi dari BIG atau Kemendagri, jadi bisa berbeda tipis di tepi wilayah.
              </p>
            </div>
          </div>
        </div>

        {/* Boundaries of the method */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2 text-xs">
          <h4 className="font-bold text-amber-900">Yang perlu kamu tahu sebelum memakai angka ini</h4>
          <ul className="list-disc pl-5 text-amber-800 space-y-1 leading-relaxed">
            {verifiedDataset.caveats.map((caveat, idx) => (
              <li key={idx}>{caveat}</li>
            ))}
            <li>
              Bobotnya pilihan desain, belum dikalibrasi terhadap data usaha nyata. Uji sensitivitas
              menunjukkan peringkat teratas cukup tahan, tapi label kategorinya mudah bergeser.
            </li>
            <li>
              Skor ini indeks eksploratif relatif antar kecamatan, bukan penilaian kelayakan usaha,
              probabilitas sukses, atau rekomendasi investasi.
            </li>
          </ul>
        </div>

        {/* Build info, kept plain */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium">Pembaruan Dataset (Freshness)</span>
            <p className="font-semibold text-slate-800">
              <time dateTime={verifiedDataset.generated_at}>{builtLabel}</time>
            </p>
            <p className="text-slate-500 text-[11px]">Data diambil ulang tiap kali angka berubah.</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium">Basis normalisasi</span>
            <p className="font-semibold text-slate-800">Nilai tertinggi antar kecamatan</p>
            <p className="text-slate-500 text-[11px]">
              Bukan target nasional atau ambang industri.
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium">Cakupan</span>
            <p className="font-semibold text-slate-800">7 kecamatan · 3 sektor</p>
            <p className="text-slate-500 text-[11px]">Retail, kesehatan, pendidikan.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MethodPanel;
