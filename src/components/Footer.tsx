import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="text-center text-xs text-slate-400 py-8 border-t border-slate-100/60 mt-12 space-y-4">
      <div className="max-w-4xl mx-auto bg-slate-50/80 p-5 rounded-xl border border-slate-200 text-left space-y-3">
        <h4 className="font-bold text-slate-700 flex items-center gap-1.5 text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-info w-4 h-4 text-indigo-500"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          Tentang Angka di Halaman Ini
        </h4>
        <ul className="space-y-2 text-slate-500 leading-relaxed list-disc pl-5">
          <li>
            <strong>Penduduk dan usia</strong> diambil dari{' '}
            <a
              href="https://disdukcapil.tangerangselatankota.go.id/uploads/demografi/KESELURUHAN1764555784678.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 underline"
            >
              Data Konsolidasi Bersih Dukcapil semester I 2025
            </a>{' '}
            (Dinas Kependudukan dan Pencatatan Sipil) Kota Tangerang Selatan. Luas wilayah hanya
            diterbitkan di{' '}
            <a
              href="https://disdukcapil.tangerangselatankota.go.id/uploads/demografi/KESELURUHAN1706581708476.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 underline"
            >
              rilis semester II 2023
            </a>
            , jadi bagian itu lebih tua dari angka penduduknya.
          </li>
          <li>
            <strong>Kepadatan POI</strong> dihitung dari{' '}
            <a
              href="https://www.openstreetmap.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 underline"
            >
              OpenStreetMap
            </a>{' '}
            (lisensi{' '}
            <a
              href="https://opendatacommons.org/licenses/odbl/1-0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 underline"
            >
              ODbL 1.0
            </a>
            ) untuk tiga sektor: retail, kesehatan, dan pendidikan. OSM diisi sukarela, jadi
            angkanya menunjukkan seberapa rajin sebuah kawasan dipetakan, bukan berapa banyak usaha
            yang sebenarnya berdiri di sana.{' '}
            <a
              href="/dataset_penduduk_tangsel.csv"
              download
              className="text-indigo-600 hover:text-indigo-700 underline font-semibold transition-colors flex items-center inline-flex gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-download w-3 h-3"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" y2="3" />
              </svg>{' '}
              Unduh data penduduk dan luas (.csv)
            </a>
          </li>
          <li>
            <strong>Skor</strong> menggabungkan enam indikator dengan bobot yang saya tentukan
            sendiri. Bobot itu belum dikalibrasi terhadap usaha yang benar-benar berhasil atau
            gagal, karena datanya tidak tersedia. Yang sudah saya periksa adalah seberapa jauh
            peringkat bergeser kalau bobotnya diubah: juara bertahan selama perubahan di bawah
            sekitar sepuluh poin persen, tapi label kategorinya tidak sekuat itu.
          </li>
          <li>
            <strong>Yang belum masuk hitungan:</strong> modal, harga sewa, aturan zonasi, perilaku
            pesaing, dan permintaan yang benar-benar teramati. Kalau salah satu dari itu menentukan
            keputusanmu, angka di sini belum cukup.
          </li>
        </ul>
      </div>

      {/* Portfolio CTA Banner */}
      <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-50 to-slate-50 border border-indigo-100 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
        <div>
          <p className="font-bold text-slate-700 text-sm">Tertarik berkolaborasi?</p>
          <p className="text-slate-500 text-xs mt-0.5">
            Proyek ini dibuat oleh <strong className="text-slate-700">Cantikaputri Febrianti</strong>{' '}
            sebagai portofolio Business Analyst: latihan membangun alat bantu keputusan lokasi usaha
            dari data publik, lengkap dengan batas pemakaiannya.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://www.linkedin.com/in/cantikaputri-febrianti/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0A66C2] text-white hover:bg-[#004182] transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect width="4" height="12" x="2" y="9" />
              <circle cx="4" cy="4" r="2" />
            </svg>
            Connect di LinkedIn
          </a>
          <a
            href="https://github.com/cantikapf/WhatBusinessInTangsel"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
            Source Code
          </a>
        </div>
      </div>

      <p className="pt-2 font-medium">
        WhatBusinessInTangsel &copy; 2026 · Cantikaputri Febrianti. Peta dasar &copy; kontributor OpenStreetMap.
      </p>
    </footer>
  );
};

export default Footer;
