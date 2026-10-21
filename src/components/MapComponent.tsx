import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import data directly for static performance and robust bundling
import geojsonData from '../data/geojson/tangsel_subdistricts.json';
import verifiedDataset from '../data/verifiedDataset';

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
      case 'density':
        setLegendText('Kepadatan Penduduk (jiwa/km²)');
        break;
      case 'population':
        setLegendText('Total Penduduk (jiwa)');
        break;
      case 'competitors':
        setLegendText('Kepadatan POI Terpetakan (POI/10k jiwa)');
        break;
      case 'demografiUmur':
      case 'youth':
        setLegendText('Persentase Pemuda (15-34 tahun)');
        break;
      case 'productive':
        setLegendText('Persentase Usia Produktif (15-64 tahun)');
        break;
      case 'anchorPoi':
        setLegendText('Jumlah Anchor POI (Stasiun/Terminal/Mall)');
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

    // Tile Layer setup. CARTO basemaps now require an API key and answer
    // keyless requests with a "API KEY REQUIRED" placeholder, which rendered a
    // blank map. OSM's own tile server works keyless; usage policy allows this
    // low-volume portfolio traffic. ponytail: keep OSM tiles until a key exists.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
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

        const handlePolygonSelect = () => {
          onSelectSubdistrict(feature.properties.id);
        };

        // Click Handler
        layer.on('click', handlePolygonSelect);

        // Keyboard & ARIA accessibility
        layer.on('add', () => {
          try {
            if (typeof layer.getElement === 'function') {
              const el = layer.getElement();
              if (el) {
                el.setAttribute('tabindex', '0');
                el.setAttribute('role', 'button');
                el.setAttribute(
                  'aria-label',
                  `Kecamatan ${feature.properties.name} — tekan Enter untuk menganalisis`
                );
                el.addEventListener('keydown', (e: KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePolygonSelect();
                  }
                });
              }
            }
          } catch (e) {
            // Null guard: do not throw when getElement returns null
          }
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

      const row = verifiedDataset.by_kecamatan[subId];

      // Calculate styles based on overlays
      if (activeOverlay === 'density') {
        const density = row ? row.density : 0;
        tooltipExtra = `<br><span style="color:#cbd5e1;font-size:10px;">Kepadatan: ${density.toLocaleString('id-ID')} jiwa/km²</span>`;
        fillColor = density > 11000 ? '#4a148c' :
                    density > 10000 ? '#7b1fa2' :
                    density > 7500  ? '#ab47bc' :
                    density > 6500  ? '#d1c4e9' :
                                      '#f3e5f5';
        fillOpacity = 0.6;
      } else if (activeOverlay === 'population') {
        const pop = row ? row.population : 0;
        tooltipExtra = `<br><span style="color:#cbd5e1;font-size:10px;">Penduduk: ${pop.toLocaleString('id-ID')} jiwa</span>`;
        fillColor = pop > 300000 ? '#1e3a8a' :
                    pop > 200000 ? '#2563eb' :
                    pop > 150000 ? '#60a5fa' :
                                   '#bfdbfe';
        fillOpacity = 0.6;
      } else if (activeOverlay === 'competitors' && selectedSector) {
        const secKey = selectedSector.toLowerCase() as 'retail' | 'health' | 'education';
        const poiRate = row?.sector_poi_per_10k?.[secKey] ?? 0;
        const rawPoi = row?.sector_poi?.[secKey] ?? 0;
        tooltipExtra = `<br><span style="color:#cbd5e1;font-size:10px;">Kepadatan POI Terpetakan: ${poiRate} / 10k (${rawPoi} POI)</span>`;
        const maxRate = verifiedDataset.normalizers.sector_per_10k_max[secKey] || 5;
        const ratio = poiRate / maxRate;
        fillColor = ratio > 0.8 ? '#b71c1c' :
                    ratio > 0.5 ? '#e65100' :
                    ratio > 0.3 ? '#f57c00' :
                    ratio > 0.1 ? '#ffe082' :
                                  '#fff8e1';
        fillOpacity = 0.6;
      } else if (activeOverlay === 'demografiUmur' || activeOverlay === 'youth') {
        const youth = row ? row.youth_15_34_pct : 0;
        tooltipExtra = `<br><span style="color:#cbd5e1;font-size:10px;">Pemuda (15-34): ${(youth * 100).toFixed(1)}%</span>`;
        fillColor = youth > 0.328 ? '#311b92' :
                    youth > 0.320 ? '#512da8' :
                    youth > 0.310 ? '#7e57c2' :
                                    '#d1c4e9';
        fillOpacity = 0.6;
      } else if (activeOverlay === 'productive') {
        const prod = row ? row.productive_15_64_pct : 0;
        tooltipExtra = `<br><span style="color:#cbd5e1;font-size:10px;">Produktif (15-64): ${(prod * 100).toFixed(1)}%</span>`;
        fillColor = prod > 0.730 ? '#065f46' :
                    prod > 0.720 ? '#059669' :
                    prod > 0.714 ? '#34d399' :
                                   '#a7f3d0';
        fillOpacity = 0.6;
      } else if (activeOverlay === 'anchorPoi') {
        const poi = row ? row.anchor_poi : 0;
        tooltipExtra = `<br><span style="color:#cbd5e1;font-size:10px;">Anchor POI: ${poi} simpul</span>`;
        fillColor = poi > 6 ? '#e65100' :
                    poi > 4 ? '#f57c00' :
                    poi > 2 ? '#ffb74d' :
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
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 text-xs"
          >
            <option value="none">Tanpa Overlay</option>
            <option value="density">Kepadatan Penduduk</option>
            <option value="population">Total Penduduk</option>
            <option value="competitors">Kepadatan POI Terpetakan</option>
            <option value="demografiUmur">Demografi Pemuda (15-34)</option>
            <option value="productive">Demografi Produktif (15-64)</option>
            <option value="anchorPoi">Anchor POI (Transit/Mall)</option>
          </select>
        </div>
      </div>

      {/* Leaflet Map Container */}
      <div className="relative">
        <div
          id="map"
          ref={mapRef}
          role="application"
          aria-label="Peta choropleth 7 kecamatan Kota Tangerang Selatan"
          className="h-[420px] w-full z-0"
        ></div>

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
