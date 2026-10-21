import React, { useEffect, useRef } from 'react';
import {
  Chart,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Legend,
  Tooltip,
  BarController,
  RadarController,
  DoughnutController
} from 'chart.js';

// Register necessary Chart.js components
Chart.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Legend,
  Tooltip,
  BarController,
  RadarController,
  DoughnutController
);

import verifiedDataset from '../data/verifiedDataset';
import { calculateScore } from '../lib/engine/scoring';

interface RadarComparisonChartProps {
  comparedSubdistricts: string[];
  selectedSector: string;
}

export const RadarComparisonChart: React.FC<RadarComparisonChartProps> = ({
  comparedSubdistricts,
  selectedSector,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    const ctx = canvasRef.current;
    if (!ctx) return;

    // Destroy existing instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    if (!comparedSubdistricts || comparedSubdistricts.length === 0 || !selectedSector) {
      return;
    }

    const colors = [
      { fill: 'rgba(79, 70, 229, 0.2)', border: 'rgb(79, 70, 229)' }, // Indigo
      { fill: 'rgba(234, 88, 12, 0.2)', border: 'rgb(234, 88, 12)' }, // Orange
      { fill: 'rgba(16, 185, 129, 0.2)', border: 'rgb(16, 185, 129)' }, // Emerald
    ];

    const datasets = comparedSubdistricts.map((sub, index) => {
      const subRow = verifiedDataset.by_kecamatan[sub];
      const colorScheme = colors[index % colors.length];

      try {
        const scoreData = calculateScore(sub, selectedSector);
        return {
          label: subRow?.name || sub,
          data: [
            scoreData.scores.S1, // Population Density
            scoreData.scores.S2, // Total Population
            scoreData.scores.S3, // Youth 15-34
            scoreData.scores.S4, // Productive 15-64
            scoreData.scores.S5, // Low Competition Gap
            scoreData.scores.S6, // Anchor POI
          ],
          backgroundColor: colorScheme.fill,
          borderColor: colorScheme.border,
          borderWidth: 2,
          pointBackgroundColor: colorScheme.border,
        };
      } catch (e) {
        console.error('Error calculating score for radar chart:', e);
        return {
          label: subRow?.name || sub,
          data: [0, 0, 0, 0, 0, 0],
          backgroundColor: colorScheme.fill,
          borderColor: colorScheme.border,
          borderWidth: 2,
          pointBackgroundColor: colorScheme.border,
        };
      }
    });

    chartInstanceRef.current = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: [
          'Kepadatan Penduduk',
          'Total Populasi',
          'Usia Muda (15–34)',
          'Usia Produktif (15–64)',
          'Peluang Pasar (Rasio POI Rendah)',
          'Anchor POI',
        ],
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 1.2,
            ticks: {
              stepSize: 0.2,
              display: false,
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            angleLines: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            pointLabels: {
              font: {
                family: 'Plus Jakarta Sans',
                size: 9,
                weight: 'bold',
              },
            },
          },
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                family: 'Plus Jakarta Sans',
                weight: 'normal',
              },
            },
          },
        },
        animation: {
          duration: 800,
          easing: 'easeOutQuart',
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [comparedSubdistricts, selectedSector]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 dashboard-card card-entry-animate h-full">
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
          className="lucide lucide-pie-chart w-5 h-5 text-indigo-600"
        >
          <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
          <path d="M22 12A10 10 0 0 0 12 2v10z" />
        </svg>
        <h2 className="font-bold text-slate-800 text-base">Radar Grafik Perbandingan</h2>
      </div>

      <div className="h-[280px] w-full flex items-center justify-center relative">
        <canvas id="radar-chart" ref={canvasRef}></canvas>
      </div>
    </div>
  );
};

interface CompetitorsBarChartProps {
  selectedSector: string;
}

export const CompetitorsBarChart: React.FC<CompetitorsBarChartProps> = ({ selectedSector }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    const ctx = canvasRef.current;
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    if (!selectedSector) return;

    const subdistrictKeys = Object.keys(verifiedDataset.by_kecamatan);
    const labels = subdistrictKeys.map((k) => verifiedDataset.by_kecamatan[k].name);
    const secKey = selectedSector.toLowerCase() as 'retail' | 'health' | 'education';
    const data = subdistrictKeys.map((k) => {
      const row = verifiedDataset.by_kecamatan[k];
      return row?.sector_poi_per_10k?.[secKey] ?? 0;
    });

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: `Kepadatan POI Terpetakan per 10k (${selectedSector.toUpperCase()})`,
            data: data,
            backgroundColor: 'rgba(79, 70, 229, 0.7)',
            borderColor: 'rgb(79, 70, 229)',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
        animation: {
          duration: 800,
          easing: 'easeOutQuart',
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [selectedSector]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 dashboard-card card-entry-animate h-full">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 section-header">
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
            className="lucide lucide-bar-chart-3 w-5 h-5 text-indigo-600"
          >
            <path d="M3 3v18h18" />
            <path d="M18 17V9" />
            <path d="M12 17V5" />
            <path d="M6 17v-4" />
          </svg>
          <h2 className="font-bold text-slate-800 text-base">Perbandingan Kepadatan POI Terpetakan per Kecamatan</h2>
        </div>
      </div>
      <div className="h-[260px] w-full relative">
        <canvas id="competitors-bar-chart" ref={canvasRef}></canvas>
      </div>
    </div>
  );
};

interface SectorPieChartProps {
  selectedSubdistrict: string;
}

export const SectorPieChart: React.FC<SectorPieChartProps> = ({ selectedSubdistrict }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    const ctx = canvasRef.current;
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    if (!selectedSubdistrict) return;

  const subData = verifiedDataset.by_kecamatan[selectedSubdistrict];
  if (!subData) return;

  const labels = ['Retail & Minimarket', 'Kesehatan (Apotek/Klinik)', 'Pendidikan'];
  const data = [
    subData.sector_poi.retail || 0,
    subData.sector_poi.health || 0,
    subData.sector_poi.education || 0,
  ];

  const colors = [
    '#3b82f6', // retail
    '#10b981', // health
    '#f59e0b', // education
  ];

    chartInstanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              font: {
                family: 'Plus Jakarta Sans',
                size: 10,
              },
            },
          },
        },
        cutout: '60%',
        animation: {
          duration: 800,
          easing: 'easeOutQuart',
          animateScale: true,
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [selectedSubdistrict]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 dashboard-card card-entry-animate h-full">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 section-header">
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
            className="lucide lucide-pie-chart w-5 h-5 text-indigo-600"
          >
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
            <path d="M22 12A10 10 0 0 0 12 2v10z" />
          </svg>
          <h2 className="font-bold text-slate-800 text-base">Distribusi Sektor Terpetakan di Kecamatan Terpilih</h2>
        </div>
      </div>
      <div className="h-[260px] w-full relative">
        <canvas id="demographics-pie-chart" ref={canvasRef}></canvas>
      </div>
    </div>
  );
};
