import React from 'react';
import { ScoreResult } from '../lib/engine/scoring';
import { RecommendationResult } from '../lib/engine/recommender';
import traffic from '../data/traffic.json';

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
          <span className="text-xs text-indigo-300 block">Interpretasi Kelayakan</span>
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
            <span className="font-semibold text-slate-500">Status Kelayakan:</span>
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
  const competitorCount = scoreData ? scoreData.metrics.competitorCount : '-';
  const population = scoreData ? scoreData.metrics.population.toLocaleString('id-ID') : '-';
  const density = scoreData ? scoreData.metrics.density.toLocaleString('id-ID') : '-';
  const trafficLevel = scoreData ? scoreData.metrics.trafficLevel : '-';
  const accessibilityScore = scoreData ? scoreData.metrics.accessibilityScore.toFixed(2) : '-';
  const trafficDetails = scoreData ? (traffic as any)[scoreData.metrics.trafficLevel.toLowerCase()]?.details || '-' : '-';

  // 5 new BI metrics
  const dayaBeli = scoreData ? `Rp ${scoreData.metrics.dayaBeli.toLocaleString('id-ID')}` : '-';
  const biayaSewa = scoreData ? `Rp ${scoreData.metrics.biayaSewa.toLocaleString('id-ID')}/m²` : '-';
  const youthPct = scoreData
    ? `${(scoreData.metrics.youth_15_34_pct * 100).toFixed(0)}% (${(
        scoreData.metrics.youth_15_34_pct * scoreData.metrics.population
      ).toLocaleString('id-ID', { maximumFractionDigits: 0 })} jiwa)`
    : '-';
  const growthRate = scoreData ? `${(scoreData.metrics.trenHistoris * 100).toFixed(1)}%` : '-';
  const anchorPoi = scoreData ? `${scoreData.metrics.anchorPoiCount} node` : '-';

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
        <h2 className="font-bold text-slate-800 text-base">Detail Metrik Wilayah</h2>
      </div>

      {/* Grid of basic metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 metric-card">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
            Kompetitor
          </span>
          <span id="competitor-count" className="text-lg font-bold text-slate-800 mt-1 block">
            {competitorCount}
          </span>
          <span className="text-[10px] text-slate-400">bisnis sejenis</span>
        </div>

        <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 metric-card">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
            Penduduk
          </span>
          <span id="population-count" className="text-lg font-bold text-slate-800 mt-1 block">
            {population}
          </span>
          <span className="text-[10px] text-slate-400">jiwa (BPS)</span>
        </div>

        <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 metric-card">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
            Kepadatan
          </span>
          <span id="population-density" className="text-lg font-bold text-slate-800 mt-1 block">
            {density}
          </span>
          <span className="text-[10px] text-slate-400">jiwa/km²</span>
        </div>

        <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 metric-card">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
            Traffic
          </span>
          <span id="traffic-level" className="text-lg font-bold text-slate-800 mt-1 block">
            {trafficLevel}
          </span>
          <span className="text-[10px] text-slate-400">volume jalan</span>
        </div>
      </div>

      {/* 5 New BI Metrics Section */}
      <div className="border-t border-slate-100 pt-4 space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Metrik Bisnis Intelijen Baru (v2.0)
        </h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50/40 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-400 font-medium block">Daya Beli</span>
            <span className="font-bold text-slate-800">{dayaBeli}</span>
          </div>
          <div className="bg-slate-50/40 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-400 font-medium block">Biaya Sewa</span>
            <span className="font-bold text-slate-800">{biayaSewa}</span>
          </div>
          <div className="bg-slate-50/40 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-400 font-medium block">Persentase Pemuda</span>
            <span className="font-bold text-slate-800">{youthPct}</span>
          </div>
          <div className="bg-slate-50/40 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-400 font-medium block">Tren Pertumbuhan</span>
            <span className="font-bold text-slate-800">{growthRate}</span>
          </div>
        </div>
        <div className="bg-slate-50/40 p-2.5 rounded-lg border border-slate-100 text-xs">
          <span className="text-slate-400 font-medium block">Anchor POI (Transit Nodes)</span>
          <span className="font-bold text-slate-800">{anchorPoi}</span>
        </div>
      </div>

      {/* Traffic accessibility score details */}
      <div className="bg-slate-50/40 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-slate-500">Skor Aksesibilitas:</span>
          <span
            id="accessibility-score"
            className="font-bold text-slate-800 bg-slate-200/80 px-2 py-0.5 rounded"
          >
            {accessibilityScore}
          </span>
        </div>
        <p id="traffic-details" className="text-slate-500 leading-relaxed text-[11px] mt-1 border-t border-slate-100/60 pt-1.5">
          {scoreData ? scoreData.metrics.trafficLevel === 'Tinggi' ? 'Lalu lintas sangat padat terutama pada jam kerja. Aksesibilitas luar biasa dengan jalan boulevard lebar, interkoneksi tol Jakarta-Serpong, serta stasiun KRL commuter line.' : scoreData.metrics.trafficLevel === 'Sedang' ? 'Tingkat kepadatan lalu lintas sedang hingga tinggi di koridor utama. Aksesibilitas memadai dengan jalan utama penghubung kawasan mandiri.' : 'Tingkat kepadatan lalu lintas relatif rendah. Akses jalan arteri utama terbatas dan jauh dari pintu tol utama.' : '-'}
        </p>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
