import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import data directly for static performance and robust bundling
import geojsonData from '../data/geojson/tangsel_subdistricts.json';
import demographics from '../data/demographics.json';
import { competitors } from '../data/competitors.json';
import traffic from '../data/traffic.json';
import biMetrics from '../data/biMetrics.json';

import { maxCompetitors } from '../lib/engine/scoring';

interface MapComponentProps {
  selectedSubdistrict: string;
  selectedSector: string;
  activeOverlay: string;
  onSelectSubdistrict: (subdistrict: string) => void;
  onActiveOverlayChange: (overlay: string) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  selectedSubdistrict,
  selectedSector,
  activeOverlay,
  onSelectSubdistrict,
  onActiveOverlayChange,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const [legendText, setLegendText] = useState('Tanpa Overlay');

  // Handle overlay selection and update text representation
  const handleOverlayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = e.target.value;
    onActiveOverlayChange(mode);
  };

  useEffect(() => {
    switch (activeOverlay) {
      case 'none':
        setLegendText('Tanpa Overlay');
        break;
      case 'population':
        setLegendText('Kepadatan Penduduk (jiwa/km²)');
        break;
      case 'competitors':
        setLegendText('Kepadatan Kompetitor (bisnis sejenis)');
        break;
      case 'traffic':
        setLegendText('Tingkat Lalu Lintas (Tinggi, Sedang, Rendah)');
        break;
      case 'dayaBeli':
        setLegendText('Daya Beli Masyarakat (Rp)');
        break;
      case 'biayaSewa':
        setLegendText('Biaya Sewa Rata-rata (Rp/m²)');
        break;
      case 'demografiUmur':
        setLegendText('Persentase Pemuda (15-34 tahun)');
        break;
      case 'trenHistoris':
        setLegendText('Tren Pertumbuhan Historis (%)');
        break;
      case 'anchorPoi':
        setLegendText('Jumlah Anchor POI (Transit/Node)');
        break;
      default:
        setLegendText('Tanpa Overlay');
    }
  }, [activeOverlay]);

  // Initial map setup
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map instance
    const map = L.map(mapRef.current).setView([-6.30, 106.72], 12);
    mapInstanceRef.current = map;

    // Tile Layer setup
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Create GeoJSON Layer
    const geojsonLayer = L.geoJSON(geojsonData as any, {
      style: () => ({
        color: '#3388ff',
        weight: 1,
        fillColor: '#3388ff',
        fillOpacity: 0.15
      }),
      onEachFeature: (feature, layer: any) => {
        layer.data = feature;

        // Tooltip
        layer.bindTooltip(`<strong>Kecamatan ${feature.properties.name}</strong>`, {
          permanent: false,
          direction: 'center',
          className: 'map-tooltip'
        });

        // Click Handler
        layer.on('click', () => {
          onSelectSubdistrict(feature.properties.id);
        });
      }
    }).addTo(map);

    geojsonLayerRef.current = geojsonLayer;

    // Attach to window L for testing/debugging references
    if (typeof window !== 'undefined') {
      (window as any).L = L;
      (window as any).L.lastGeoJSON = geojsonLayer;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onSelectSubdistrict]);

  // Update styles whenever inputs change
  useEffect(() => {
    const geojsonLayer = geojsonLayerRef.current;
    if (!geojsonLayer) return;

    geojsonLayer.eachLayer((layer: any) => {
      const feature = layer.feature || layer.data;
      if (!feature || !feature.properties) return;

      const subId = feature.properties.id;
      let fillColor = '#3388ff';
      let fillOpacity = 0.15;
      let color = '#3388ff';
      let weight = 1;
      let className = '';
      let tooltipExtra = '';

      // Calculate styles based on overlays
      if (activeOverlay === 'population') {
        const demo = (demographics as Record<string, any>)[subId];
        const density = demo ? demo.density : 0;
        tooltipExtra = `<br><span style="color:#cbd5e1;font-size:10px;">Kepadatan: ${density.toLocaleString('id-ID')} jiwa/km²</span>`;
        fillColor = density > 11000 ? '#4a148c' :
                    density > 10000 ? '#7b1fa2' :
                    density > 7500  ? '#ab47bc' :
                    density > 6500  ? '#d1c4e9' :
                                      '#f3e5f5';
        fillOpacity = 0.6;
      } else if (activeOverlay === 'competitors' && selectedSector) {
        const sectComp = (competitors as Record<string, any>)[subId];
        const comp = sectComp ? sectComp[selectedSector] : 0;
        const maxC = maxCompetitors[selectedSector] || 100;
        tooltipExtra = `<br><span style="color:#cbd5e1;font-size:10px;">Kompetitor: ${comp} bisnis</span>`;
        const ratio = comp / maxC;
        fillColor = ratio > 0.8 ? '#b71c1c' :
                    ratio > 0.5 ? '#e65100' :
                    ratio > 0.3 ? '#f57c00' :
                    ratio > 0.1 ? '#ffe082' :
                                  '#fff8e1';
        fillOpacity = 0.6;
      } else if (activeOverlay === 'traffic') {
        const tr = (traffic as Record<string, any>)[subId];
        const accessibility = tr ? tr.accessibilityScore : 0.5;
        tooltipExtra = `<br><span style="color:#cbd5e1;font-size:10px;">Aksesibilitas: ${(accessibility * 10).toFixed(1)}/10</span>`;
        fillColor = accessibility >= 0.85 ? '#1b5e20' :
                    accessibility >= 0.75 ? '#4caf50' :
                    accessibility >= 0.65 ? '#81c784' :
                                            '#c8e6c9';
        fillOpacity = 0.6;
      } else if (activeOverlay === 'dayaBeli') {
        const bi = (biMetrics as Record<string, any>)[subId];
        const db = bi ? bi.dayaBeli : 0;
        tooltipExtra = `<br><span style="color:#cbd5e1;font-size:10px;">Daya Beli: Rp ${db.toLocaleString('id-ID')}</span>`;
        fillColor = db > 3500000 ? '#0d47a1' :
                    db > 3000000 ? '#1976d2' :
                    db > 2600000 ? '#42a5f5' :
                                   '#bbdefb';
        fillOpacity = 0.6;
      } else if (activeOverlay === 'biayaSewa') {
        const bi = (biMetrics as Record<string, any>)[subId];
        const bs = bi ? bi.biayaSewa : 0;
        tooltipExtra = `<br><span style="color:#cbd5e1;font-size:10px;">Biaya Sewa: Rp ${bs.toLocaleString('id-ID')}/bln</span>`;
        fillColor = bs > 400000 ? '#b71c1c' :
                    bs > 300000 ? '#e65100' :
                    bs > 200000 ? '#f57c00' :
                                  '#ffe082';
        fillOpacity = 0.6;
      } else if (activeOverlay === 'demografiUmur') {
        const bi = (biMetrics as Record<string, any>)[subId];
        const youth = bi ? bi.demografiUmur.youth_15_34_pct : 0;
        tooltipExtra = `<br><span style="color:#cbd5e1;font-size:10px;">Pemuda (15-34): ${(youth * 100).toFixed(0)}%</span>`;
        fillColor = youth > 0.34 ? '#311b92' :
                    youth > 0.32 ? '#512da8' :
                    youth > 0.30 ? '#7e57c2' :
                                   '#d1c4e9';
        fillOpacity = 0.6;
      } else if (activeOverlay === 'trenHistoris') {
        const bi = (biMetrics as Record<string, any>)[subId];
        const growth = bi ? bi.trenHistoris : 0;
        tooltipExtra = `<br><span style="color:#cbd5e1;font-size:10px;">Pertumbuhan: ${(growth * 100).toFixed(1)}%</span>`;
        fillColor = growth > 0.07 ? '#004d40' :
                    growth > 0.06 ? '#00796b' :
                    growth > 0.05 ? '#26a69a' :
                                    '#b2dfdb';
        fillOpacity = 0.6;
      } else if (activeOverlay === 'anchorPoi') {
        const bi = (biMetrics as Record<string, any>)[subId];
        const poi = bi ? bi.anchorPoiCount : 0;
        tooltipExtra = `<br><span style="color:#cbd5e1;font-size:10px;">Anchor POI: ${poi} node</span>`;
        fillColor = poi > 9 ? '#e65100' :
                    poi > 7 ? '#f57c00' :
                    poi > 5 ? '#ffb74d' :
                              '#ffe082';
        fillOpacity = 0.6;
      }

      // Highlight selected subdistrict
      if (subId === selectedSubdistrict) {
        color = '#ff7800';
        weight = 5;
        className = 'active-highlight';
      }

      // Apply style to Leaflet layer
      layer.setStyle({
        color,
        weight,
        fillColor,
        fillOpacity
      });

      // Update layer properties for test framework assertions
      layer.options = layer.options || {};
      layer.options.className = className;

      // Update Tooltip content
      const tooltip = layer.getTooltip();
      if (tooltip) {
        tooltip.setContent(`<strong>Kecamatan ${feature.properties.name}</strong>${tooltipExtra}`);
      }
    });
  }, [selectedSubdistrict, activeOverlay, selectedSector]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 dashboard-card card-entry-animate">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3 section-header">
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
            className="lucide lucide-map-pin w-5 h-5 text-indigo-600"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <h2 className="font-bold text-slate-800 text-base">Peta Interaktif Tangerang Selatan</h2>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="overlay-mode-select" className="text-xs font-semibold text-slate-400 uppercase">
            Overlay:
          </label>
          <select
            id="overlay-mode-select"
            value={activeOverlay}
            onChange={handleOverlayChange}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="none">Tanpa Overlay</option>
            <option value="population">Kepadatan Penduduk</option>
            <option value="competitors">Kepadatan Kompetitor</option>
            <option value="traffic">Aksesibilitas & Traffic</option>
            <option value="dayaBeli">Daya Beli (Purchasing Power)</option>
            <option value="biayaSewa">Biaya Sewa (Rent)</option>
            <option value="demografiUmur">Demografi Umur (Youth Ratio)</option>
            <option value="trenHistoris">Tren Historis (Growth Rate)</option>
            <option value="anchorPoi">Anchor POI (Transit Nodes)</option>
          </select>
        </div>
      </div>

      {/* Leaflet Map Container */}
      <div className="relative">
        <div id="map" ref={mapRef} className="h-[420px] w-full z-0"></div>

        {/* Map Legend Panel */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-lg z-[1000] text-xs max-w-[260px] pointer-events-auto">
          <div className="font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
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
              className="lucide lucide-info w-3.5 h-3.5 text-indigo-500"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            Keterangan Peta
          </div>
          <div id="map-legend" className="text-slate-500 font-medium leading-normal">
            {legendText}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
