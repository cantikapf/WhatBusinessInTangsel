import React, { useState } from 'react';
import demographics from '../data/demographics.json';
import { calculateScore } from '../lib/engine/scoring';

interface ComparisonPanelProps {
  selectedSubdistrict: string;
  selectedSector: string;
  comparedList: string[];
  onAdd: (subdistrict: string) => void;
  onRemove: (subdistrict: string) => void;
  onClear: () => void;
}

export const ComparisonPanel: React.FC<ComparisonPanelProps> = ({
  selectedSubdistrict,
  selectedSector,
  comparedList,
  onAdd,
  onRemove,
  onClear,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddClick = () => {
    if (!selectedSector || !selectedSubdistrict) {
      setErrorMsg('Sektor dan Lokasi harus dipilih');
      return;
    }
    if (comparedList.includes(selectedSubdistrict)) {
      setErrorMsg('Lokasi sudah ada dalam perbandingan');
      return;
    }
    if (comparedList.length >= 3) {
      setErrorMsg('Maksimal perbandingan adalah 3 lokasi');
      return;
    }
    setErrorMsg(null);
    onAdd(selectedSubdistrict);
  };

  const handleClearClick = () => {
    setErrorMsg(null);
    onClear();
  };

  const handleRemoveItem = (sub: string) => {
    setErrorMsg(null);
    onRemove(sub);
  };

  return (
    <section className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 dashboard-card card-entry-animate">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-3 section-header">
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
            className="lucide lucide-git-compare w-5 h-5 text-indigo-600"
          >
            <circle cx="18" cy="18" r="3" />
            <circle cx="6" cy="6" r="3" />
            <path d="M13 6h3a2 2 0 0 1 2 2v7" />
            <path d="M11 18H8a2 2 0 0 1-2-2V9" />
          </svg>
          <h2 className="font-bold text-slate-800 text-base">Perbandingan Lokasi Berdampingan</h2>
        </div>
        <div className="flex gap-2">
          <button
            id="add-to-comparison"
            onClick={handleAddClick}
            className="bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-600 border border-indigo-100 font-semibold text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-plus-circle w-3.5 h-3.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8" />
              <path d="M12 8v8" />
            </svg>
            Bandingkan
          </button>
          <button
            id="clear-comparison"
            onClick={handleClearClick}
            className="bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-600 border border-slate-200 font-semibold text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-trash-2 w-3.5 h-3.5"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" x2="10" y1="11" y2="17" />
              <line x1="14" x2="14" y1="11" y2="17" />
            </svg>
            Hapus Semua
          </button>
        </div>
      </div>

      {/* Comparison Error Div */}
      {errorMsg && (
        <div
          id="comparison-error"
          className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-3 font-medium block"
        >
          {errorMsg}
        </div>
      )}

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-150 scroll-indicator">
        <table id="comparison-table" className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr class="bg-slate-50 text-left text-slate-500 font-semibold uppercase tracking-wider text-xs">
              <th className="px-4 py-3.5">Kecamatan</th>
              <th className="px-4 py-3.5">Sektor</th>
              <th className="px-4 py-3.5">Skor Komposit</th>
              <th className="px-4 py-3.5">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
            {comparedList.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400 font-medium">
                  Belum ada lokasi untuk dibandingkan
                </td>
              </tr>
            ) : (
              comparedList.map((sub) => {
                const demo = (demographics as Record<string, any>)[sub];
                let scoreText = '-';
                if (selectedSector) {
                  try {
                    const scoreData = calculateScore(sub, selectedSector);
                    scoreText = scoreData.compositeScore.toFixed(1);
                  } catch (e) {
                    console.error(e);
                  }
                }

                return (
                  <tr key={sub} id={`compare-row-${sub}`} className="comparison-row-enter">
                    <td className="px-4 py-3.5">{demo ? demo.name : sub}</td>
                    <td className="px-4 py-3.5">{selectedSector || '-'}</td>
                    <td className="px-4 py-3.5">{scoreText}</td>
                    <td className="px-4 py-3.5">
                      <button
                        className="remove-comparison-btn"
                        data-subdistrict={sub}
                        onClick={() => handleRemoveItem(sub)}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ComparisonPanel;
