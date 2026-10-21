import verifiedDataset, { SubdistrictRow } from '../../data/verifiedDataset';

export type VerifiedSector = 'retail' | 'health' | 'education';

export const VERIFIED_SECTORS: readonly VerifiedSector[] = ['retail', 'health', 'education'] as const;

export interface ScoreMetrics {
  population: number;
  area_km2: number;
  density: number;
  youth_15_34_pct: number;
  productive_15_64_pct: number;
  anchor_poi: number;
  sector_poi: number;
  sector_poi_per_10k: number;
}

export interface ScoreResult {
  competitorDensity: number;
  populationDensity: number;
  compositeScore: number;
  label: string;
  scores: {
    S1: number;
    S2: number;
    S3: number;
    S4: number;
    S5: number;
    S6: number;
  };
  metrics: ScoreMetrics;
}

// Weights documented and sum to 1.00:
// W1: 0.20 - Kepadatan Penduduk (konsentrasi pasar & potensi lalu lintas pejalan kaki)
// W2: 0.20 - Total Populasi (skala pasar absolut kecamatan)
// W3: 0.15 - Demografi Usia Muda 15-34 (adopsi tren & dinamika konsumsi)
// W4: 0.15 - Demografi Usia Produktif 15-64 (populasi berpenghasilan aktif)
// W5: 0.15 - Peluang Pasar / Kepadatan POI Rendah (1 - rasio POI/10k thdp max, celah pasar belum jenuh)
// W6: 0.15 - Anchor POI (magnet keramaian & simpul transit/mall)
// Sum: 0.20 + 0.20 + 0.15 + 0.15 + 0.15 + 0.15 = 1.00
export const SCORE_WEIGHTS = {
  W1: 0.20,
  W2: 0.20,
  W3: 0.15,
  W4: 0.15,
  W5: 0.15,
  W6: 0.15,
} as const;

// Data-derived normalizers from verified_dataset.json:
const datasetRows = Object.values(verifiedDataset.by_kecamatan);
export const normalizers = {
  density_max: verifiedDataset.normalizers.density_max,
  population_max: Math.max(...datasetRows.map((r) => r.population)),
  youth_max: Math.max(...datasetRows.map((r) => r.youth_15_34_pct)),
  productive_max: Math.max(...datasetRows.map((r) => r.productive_15_64_pct)),
  sector_per_10k_max: verifiedDataset.normalizers.sector_per_10k_max,
  anchor_max: verifiedDataset.normalizers.anchor_max,
};

/**
 * Single source of truth for score labels. `recommender.ts` reuses this so the
 * two never drift in the 5.0–5.4 band (the old Gate 0 defect).
 */
export function labelForScore(score: number): string {
  if (score < 3.0) return 'Sangat Rendah';
  if (score < 5.0) return 'Rendah';
  if (score < 6.5) return 'Cukup';
  if (score < 8.0) return 'Baik';
  return 'Sangat Baik';
}

/**
 * Calculates competitive prospect score (1-10) and status interpretation with Gate 3 6-metric formula.
 * @param subdistrict Subdistrict name or slug
 * @param sector Business sector key ('retail' | 'health' | 'education')
 * @returns Detailed score data
 */
export function calculateScore(subdistrict: string, sector: string): ScoreResult {
  const subKey = subdistrict.toLowerCase().trim().replace(/\s+/g, '_');
  const sectKey = sector.toLowerCase().trim() as VerifiedSector;

  if (!VERIFIED_SECTORS.includes(sectKey)) {
    throw new Error(`Sektor tidak valid atau belum terverifikasi: "${sector}". Sektor yang didukung: ${VERIFIED_SECTORS.join(', ')}`);
  }

  const row = verifiedDataset.by_kecamatan[subKey];
  if (!row) {
    throw new Error(`Kecamatan tidak ditemukan di dataset terverifikasi: "${subdistrict}" (${subKey})`);
  }

  // S1 (Kepadatan Penduduk): row.density / density_max
  const S1 = Math.max(0, Math.min(1.0, row.density / normalizers.density_max));

  // S2 (Total Populasi): row.population / population_max
  const S2 = Math.max(0, Math.min(1.0, row.population / normalizers.population_max));

  // S3 (Usia Muda 15-34 %): row.youth_15_34_pct / youth_max
  const S3 = Math.max(0, Math.min(1.0, row.youth_15_34_pct / normalizers.youth_max));

  // S4 (Usia Produktif 15-64 %): row.productive_15_64_pct / productive_max
  const S4 = Math.max(0, Math.min(1.0, row.productive_15_64_pct / normalizers.productive_max));

  // S5 (Peluang Pasar / Kepadatan POI Rendah): 1 - (sector_poi_per_10k / sector_per_10k_max)
  // Missing data must throw, never silently become 0 — a zero would read as "no competition"
  // and hand the kecamatan a false top rank (docs/PUBLICATION_PLAN.md Gate 2: missing != nol).
  const rawPoi = row.sector_poi?.[sectKey];
  const poiPer10k = row.sector_poi_per_10k?.[sectKey];
  const maxPoiPer10k = normalizers.sector_per_10k_max?.[sectKey];
  if (typeof rawPoi !== 'number' || typeof poiPer10k !== 'number') {
    throw new Error(`Data POI sektor "${sectKey}" tidak tersedia untuk ${subKey} — nilai hilang tidak boleh diperlakukan sebagai nol. Jalankan npm run data:build.`);
  }
  if (typeof maxPoiPer10k !== 'number' || maxPoiPer10k <= 0) {
    throw new Error(`Normalizer POI sektor "${sectKey}" tidak valid (${maxPoiPer10k}). Jalankan npm run data:build.`);
  }
  const S5 = Math.max(0, Math.min(1.0, 1 - (poiPer10k / maxPoiPer10k)));

  // S6 (Anchor POI): row.anchor_poi / anchor_max
  const S6 = Math.max(0, Math.min(1.0, row.anchor_poi / normalizers.anchor_max));

  // Composite calculation
  const composite = (
    SCORE_WEIGHTS.W1 * S1 +
    SCORE_WEIGHTS.W2 * S2 +
    SCORE_WEIGHTS.W3 * S3 +
    SCORE_WEIGHTS.W4 * S4 +
    SCORE_WEIGHTS.W5 * S5 +
    SCORE_WEIGHTS.W6 * S6
  ) * 10;

  // Round composite score to 1 decimal place, constrained between 1.0 and 10.0
  const finalScore = Math.max(1.0, Math.min(10.0, Math.round(composite * 10) / 10));

  const label = labelForScore(finalScore);

  return {
    competitorDensity: poiPer10k / maxPoiPer10k,
    populationDensity: S1,
    compositeScore: finalScore,
    label,
    scores: {
      S1,
      S2,
      S3,
      S4,
      S5,
      S6,
    },
    metrics: {
      population: row.population,
      area_km2: row.area_km2,
      density: row.density,
      youth_15_34_pct: row.youth_15_34_pct,
      productive_15_64_pct: row.productive_15_64_pct,
      anchor_poi: row.anchor_poi,
      sector_poi: rawPoi,
      sector_poi_per_10k: poiPer10k,
    },
  };
}

export default calculateScore;
