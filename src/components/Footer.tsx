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
          Catatan Metodologi & Sumber Data
        </h4>
        <ul className="space-y-2 text-slate-500 leading-relaxed list-disc pl-5">
          <li>
            <strong>Jumlah Usaha (Kompetitor):</strong> Diekstraksi melalui metode agregasi spasial{' '}
            <em>Point of Interest</em> (POI) menggunakan{' '}
            <a
              href="https://overpass-turbo.eu/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 underline font-semibold transition-colors"
            >
              Overpass API OpenStreetMap
            </a>
            . Pengumpulan data menggunakan <em>tag</em> khusus (seperti <code>amenity=cafe</code>,{' '}
            <code>shop=clothes</code>) di area pembatas kecamatan.
          </li>
          <li>
            <strong>Demografi & Populasi:</strong> Bersumber dari rilis dataset resmi Badan Pusat
            Statistik (BPS) Kota Tangerang Selatan.{' '}
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
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>{' '}
              Unduh File Dataset (.csv)
            </a>
          </li>
          <li>
            <strong>Skor Prospek & Aksesibilitas:</strong> Merupakan kalkulasi algoritma{' '}
            <em>weighted scoring</em> yang menyeimbangkan peluang dari kepadatan penduduk, hambatan
            dari rasio kompetitor eksisting, serta estimasi volume lalu lintas (
            <em>traffic level</em>), yang kini ditingkatkan pada versi 2.0 dengan menambahkan 5
            metrik bisnis intelijen baru (daya beli, biaya sewa, demografi umur pemuda, pertumbuhan
            historis, dan kedekatan transit node).
          </li>
        </ul>
      </div>
      <p className="pt-2 font-medium">
        Tangerang Selatan Business Prospect Analytics &copy; 2026. Made with Lucide, Leaflet, and Chart.js.
      </p>
    </footer>
  );
};

export default Footer;
