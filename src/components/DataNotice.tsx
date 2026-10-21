import React from 'react';

/**
 * Disclaimer banner. Every claim here must stay true to
 * docs/gate2/verified_dataset.json and docs/gate3/SENSITIVITY.md, but internal
 * file paths, hashes, and gate numbers must not leak into user-facing copy.
 */
export const DataNotice: React.FC = () => {
  return (
    <div
      role="note"
      className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-left flex items-start gap-3"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-amber-600 shrink-0 mt-0.5"
        aria-hidden="true"
      >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
      <div className="space-y-1">
        <p className="text-sm font-bold text-amber-900">Skor ini indeks relatif, bukan putusan layak-tidaknya</p>
        <p className="text-xs text-amber-800 leading-relaxed">
          Angka penduduk dan usia berasal dari DKB Disdukcapil Tangsel. Angka POI berasal dari
          OpenStreetMap, yang mencatat seberapa lengkap sebuah kawasan terpetakan, bukan berapa
          banyak usaha yang benar-benar ada. Bobot enam indikator saya tentukan sendiri dan belum
          dikalibrasi terhadap data hasil usaha; saya sudah menguji seberapa jauh kesimpulannya
          bergeser kalau bobot itu diubah. Lisensi publikasi Dukcapil belum jelas, jadi angka ini
          sebaiknya tidak dikutip ulang sebagai statistik resmi.
        </p>
      </div>
    </div>
  );
};

export default DataNotice;
