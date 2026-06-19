import React, { useState, useEffect } from 'react';

interface FilterFormProps {
  selectedSector: string;
  selectedSubdistrict: string;
  onSectorChange: (sector: string) => void;
  onSubdistrictChange: (subdistrict: string) => void;
  onSubmit: (sector: string, subdistrict: string) => void;
}

export const FilterForm: React.FC<FilterFormProps> = ({
  selectedSector,
  selectedSubdistrict,
  onSectorChange,
  onSubdistrictChange,
  onSubmit,
}) => {
  const [localSector, setLocalSector] = useState(selectedSector);
  const [localSubdistrict, setLocalSubdistrict] = useState(selectedSubdistrict);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Keep local state in sync when parent state updates (e.g. on click map or reset)
  useEffect(() => {
    setLocalSector(selectedSector);
  }, [selectedSector]);

  useEffect(() => {
    setLocalSubdistrict(selectedSubdistrict);
  }, [selectedSubdistrict]);

  const handleSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setLocalSector(value);
    onSectorChange(value);
    setValidationError(null);
  };

  const handleSubdistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setLocalSubdistrict(value);
    onSubdistrictChange(value);
    setValidationError(null);
  };

  const handleFormSubmit = () => {
    if (!localSector) {
      setValidationError('Sektor bisnis harus dipilih');
      return;
    }
    if (!localSubdistrict) {
      setValidationError('Lokasi harus dipilih');
      return;
    }
    setValidationError(null);
    onSubmit(localSector, localSubdistrict);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 dashboard-card card-entry-animate">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 section-header">
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
          className="lucide lucide-sliders w-5 h-5 text-indigo-600"
        >
          <line x1="4" x2="4" y1="21" y2="14" />
          <line x1="4" x2="4" y1="10" y2="3" />
          <line x1="12" x2="12" y1="21" y2="12" />
          <line x1="12" x2="12" y1="8" y2="3" />
          <line x1="20" x2="20" y1="21" y2="16" />
          <line x1="20" x2="20" y1="12" y2="3" />
          <line x1="2" x2="6" y1="14" y2="14" />
          <line x1="10" x2="14" y1="8" y2="8" />
          <line x1="18" x2="22" y1="16" y2="16" />
        </svg>
        <h2 className="font-bold text-slate-800 text-base">Parameter Bisnis</h2>
      </div>

      {/* Business Sector Input */}
      <div className="space-y-2">
        <label htmlFor="sector-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          Sektor Bisnis
        </label>
        <select
          id="sector-select"
          value={localSector}
          onChange={handleSectorChange}
          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        >
          <option value="">-- Pilih Sektor --</option>
          <option value="fnb">FnB (Kafe/Restoran/Warteg/Bakery)</option>
          <option value="fashion">Fashion & Clothing</option>
          <option value="beauty">Salon & Kecantikan</option>
          <option value="education">Pendidikan (Bimbel/Kursus)</option>
          <option value="health">Kesehatan (Apotek/Klinik)</option>
          <option value="retail">Retail & Minimarket</option>
          <option value="automotive">Otomotif (Bengkel/Cuci Motor-Mobil)</option>
          <option value="services">Jasa (Laundry/Percetakan/dll)</option>
        </select>
      </div>

      {/* Subdistrict Input */}
      <div className="space-y-2">
        <label htmlFor="subdistrict-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          Kecamatan Lokasi
        </label>
        <select
          id="subdistrict-select"
          value={localSubdistrict}
          onChange={handleSubdistrictChange}
          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        >
          <option value="">-- Pilih Kecamatan --</option>
          <option value="setu">Setu</option>
          <option value="serpong">Serpong</option>
          <option value="pamulang">Pamulang</option>
          <option value="ciputat">Ciputat</option>
          <option value="ciputat_timur">Ciputat Timur</option>
          <option value="pondok_aren">Pondok Aren</option>
          <option value="serpong_utara">Serpong Utara</option>
        </select>
      </div>

      {/* Action Button */}
      <button
        id="submit-btn"
        onClick={handleFormSubmit}
        className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-xl py-3 shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all duration-200 flex items-center justify-center gap-2"
      >
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
          className="lucide lucide-play-circle w-4 h-4"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="10 8 16 12 10 16 10 8" />
        </svg>
        Analisis Prospek
      </button>

      {/* Validation Error Message */}
      {validationError && (
        <div
          id="validation-error"
          className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-3 font-medium block animate-fade-in"
        >
          {validationError}
        </div>
      )}
    </div>
  );
};

export default FilterForm;
