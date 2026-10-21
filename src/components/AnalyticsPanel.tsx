import React from 'react';
import { ScoreResult } from '../lib/engine/scoring';
import { RecommendationResult } from '../lib/engine/recommender';

interface AnalyticsPanelProps {
  scoreData: ScoreResult | null;
  recommendationData: RecommendationResult | null;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  scoreData,
  recommendationData,
}) => {
  const compositeScoreText = scoreData ? scoreData.compositeScore.toFixed(1) : '-';
  const labelText = scoreData ? scoreData.label : '-';
  const suitabilityText = recommendationData ? recommendationData.suitability : '-';
  const mainRiskText = recommendationData ? recommendationData.mainRisk : '-';
  const targetSegmentText = recommendationData ? recommendationData.targetSegment : '-';
  const strategies = recommendationData ? recommendationData.strategies : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Composite Score Display (5 cols) */}
      <div className="md:col-span-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between card-entry-animate">
        <div className="space-y-1">
          <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider block">
            Skor Prospek Lokasi
          </span>
          <h3
            className="text-[52px] font-extrabold tracking-tight leading-none text-white my-1 score-glow"
            id="composite-score"
          >
            {compositeScoreText}
          </h3>
        </div>
        <div className="border-t border-indigo-800/40 pt-4 mt-6">
          <span className="text-xs text-indigo-300 block">Interpretasi Indeks Relatif</span>
          <span
            id="score-label"
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-500/20 mt-1.5"
          >
            {labelText}
          </span>
        </div>
      </div>

      {/* Strategy recommendations text (7 cols) */}
      <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 dashboard-card card-entry-animate">
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
            className="lucide lucide-lightbulb w-5 h-5 text-indigo-600"
          >
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
            <path d="M9 18h6" />
            <path d="M10 22h4" />
          </svg>
          <h2 className="font-bold text-slate-800 text-base">Rekomendasi Strategis</h2>
        </div>

        <div className="space-y-3.5 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Interpretasi Indeks:</span>
            <span
              id="recommendation-suitability"
              className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs"
            >
              {suitabilityText}
            </span>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-slate-500 block">Risiko Utama:</span>
            <p id="recommendation-risk" className="text-slate-600 text-xs leading-relaxed">
              {mainRiskText}
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-slate-500 block">Target Segmen Pasar:</span>
            <p id="recommendation-target" className="text-slate-600 text-xs leading-relaxed">
              {targetSegmentText}
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="font-semibold text-slate-500 block">Langkah Strategis:</span>
            <ul
              id="recommendation-strategies"
              className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed"
            >
              {strategies.length > 0 ? (
                strategies.map((strat, idx) => <li key={idx}>{strat}</li>)
              ) : (
                <li>-</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MetricsPanelProps {
  scoreData: ScoreResult | null;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ scoreData }) => {
  const competitorPoiRate = scoreData ? `${scoreData.metrics.sector_poi_per_10k} / 10k` : '-';
  const rawPoiCount = scoreData ? `${scoreData.metrics.sector_poi} POI` : '';
  const population = scoreData ? scoreData.metrics.population.toLocaleString('id-ID') : '-';
  const density = scoreData ? scoreData.metrics.density.toLocaleString('id-ID') : '-';
  const area = scoreData ? `${scoreData.metrics.area_km2.toLocaleString('id-ID')} km²` : '-';
  const youthPct = scoreData
    ? `${(scoreData.metrics.youth_15_34_pct * 100).toFixed(1)}% (${(
        scoreData.metrics.youth_15_34_pct * scoreData.metrics.population
      ).toLocaleString('id-ID', { maximumFractionDigits: 0 })} jiwa)`
    : '-';
  const productivePct = scoreData
    ? `${(scoreData.metrics.productive_15_64_pct * 100).toFixed(1)}% (${(
        scoreData.metrics.productive_15_64_pct * scoreData.metrics.population
      ).toLocaleString('id-ID', { maximumFractionDigits: 0 })} jiwa)`
    : '-';
  const anchorPoi = scoreData ? `${scoreData.metrics.anchor_poi} simpul` : '-';

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 dashboard-card card-entry-animate">
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
          className="lucide lucide-bar-chart-2 w-5 h-5 text-indigo-600"
        >
          <line x1="18" x2="18" y1="20" y2="10" />
          <line x1="12" x2="12" y1="20" y2="4" />
          <line x1="6" x2="6" y1="20" y2="14" />
        </svg>
        <h2 className="font-bold text-slate-800 text-base">Kondisi Wilayah</h2>
      </div>

      {/* Grid of 6 core verified metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 metric-card">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
            Kepadatan POI Terpetakan
          </span>
          <span id="competitor-count" className="text-lg font-bold text-slate-800 mt-1 block">
            {competitorPoiRate}
          </span>
          <span className="text-[11px] text-slate-400">
            {rawPoiCount ? `${rawPoiCount} terpetakan (OSM)` : 'rasio per 10k jiwa'}
          </span>
        </div>

        <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 metric-card">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
            Penduduk
          </span>
          <span id="population-count" className="text-lg font-bold text-slate-800 mt-1 block">
            {population}
          </span>
          <span className="text-[11px] text-slate-400">jiwa (Dukcapil 2025 S1)</span>
        </div>

        <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 metric-card">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
            Kepadatan
          </span>
          <span id="population-density" className="text-lg font-bold text-slate-800 mt-1 block">
            {density}
          </span>
          <span className="text-[11px] text-slate-400">jiwa/km² (turunan)</span>
        </div>

        <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 metric-card">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
            Luas Wilayah
          </span>
          <span id="area-size" className="text-lg font-bold text-slate-800 mt-1 block">
            {area}
          </span>
          <span className="text-[11px] text-slate-400">DKB 2023 S2</span>
        </div>
      </div>

      {/* Demographic & Infrastructure section */}
      <div className="border-t border-slate-100 pt-4 space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Struktur Usia &amp; Simpul Wilayah
        </h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50/40 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-400 font-medium block">Pemuda (15–34 tahun)</span>
            <span className="font-bold text-slate-800">{youthPct}</span>
          </div>
          <div className="bg-slate-50/40 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-400 font-medium block">Usia Produktif (15–64 tahun)</span>
            <span className="font-bold text-slate-800">{productivePct}</span>
          </div>
        </div>
        <div className="bg-slate-50/40 p-2.5 rounded-lg border border-slate-100 text-xs">
          <span className="text-slate-400 font-medium block">Anchor POI (Stasiun / Terminal / Mall)</span>
          <span className="font-bold text-slate-800">{anchorPoi}</span>
        </div>
      </div>

      {/* Caveat Notice */}
      <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 text-[11px] text-amber-800 leading-relaxed">
        <strong>Catatan Metrik:</strong> Kepadatan POI terpetakan dihitung dari data sukarela OpenStreetMap (OSM) berlisensi ODbL. Indikator ini mencerminkan kelengkapan pemetaan, bukan sensus resmi seluruh pelaku usaha.
      </div>
    </div>
  );
};

export default AnalyticsPanel;
