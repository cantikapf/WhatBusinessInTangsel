import demographics from '../../data/demographics.json';
import competitorsData from '../../data/competitors.json';
import traffic from '../../data/traffic.json';
import biMetrics from '../../data/biMetrics.json';

// Max competitors per sector (used for normalization)
export const maxCompetitors: Record<string, number> = {
  fnb: 320,
  fashion: 140,
  beauty: 95,
  education: 80,
  health: 75,
  retail: 250,
  automotive: 95,
  services: 140
};

export interface ScoreMetrics {
  competitorCount: number;
  population: number;
  trafficLevel: string;
  density: number;
  area: number;
  accessibilityScore: number;
  dayaBeli: number;
  biayaSewa: number;
  youth_15_34_pct: number;
  productive_pct: number;
  trenHistoris: number;
  anchorPoiCount: number;
}

export interface ScoreResult {
  competitorDensity: number;
  populationDensity: number;
  accessibilityScore: number;
  compositeScore: number;
  label: string;
  scores: {
    S1: number;
    S2: number;
    S3: number;
    S4: number;
    S5: number;
    S6: number;
    S7: number;
    S8: number;
  };
  metrics: ScoreMetrics;
}

/**
 * Calculates competitive score (1-10) and status interpretation with 8-metric formula.
 * @param subdistrict Subdistrict name
 * @param sector Business sector key
 * @returns Detailed score data
 */
export function calculateScore(subdistrict: string, sector: string): ScoreResult {
  const subKey = subdistrict.toLowerCase().trim().replace(/\s+/g, '_');
  const sectKey = sector.toLowerCase().trim();

  const demo = (demographics as Record<string, any>)[subKey];
  const compObj = (competitorsData.competitors as Record<string, any>)[subKey];
  const comp = compObj ? compObj[sectKey] : undefined;
  const tr = (traffic as Record<string, any>)[subKey];
  const bi = (biMetrics as Record<string, any>)[subKey];

  if (!demo || comp === undefined || !tr || !bi) {
    throw new Error(`Invalid arguments or data missing: subdistrict=${subdistrict} (${subKey}), sector=${sector} (${sectKey})`);
  }

  // S1 (Population Density): demo.density / 12725
  const S1 = Math.max(0, Math.min(1.0, demo.density / 12725));

  // S2 (Accessibility): tr.accessibilityScore
  const S2 = Math.max(0, Math.min(1.0, tr.accessibilityScore));

  // S3 (Low Competition): 1 - (comp / maxCompetitors[sector])
  const maxComp = maxCompetitors[sectKey] || 100;
  const S3 = Math.max(0, Math.min(1.0, 1 - (comp / maxComp)));

  // S4 (Purchasing Power): bi.dayaBeli / 4000000
  const S4 = Math.max(0, Math.min(1.0, bi.dayaBeli / 4000000));

  // S5 (Rental Affordability): 1 - (bi.biayaSewa / 500000)
  const S5 = Math.max(0, Math.min(1.0, 1 - (bi.biayaSewa / 500000)));

  // S6 (Age Demographics Match): Sector-specific match score based on biMetrics.json demographic groups.
  // - For fnb and fashion: use bi.demografiUmur.youth_15_34_pct / 0.40.
  // - For other sectors: use bi.demografiUmur.productive_pct / 0.70.
  // - Ensure normalized value is capped at 1.0.
  let S6_raw = 0;
  if (sectKey === 'fnb' || sectKey === 'fashion') {
    S6_raw = bi.demografiUmur.youth_15_34_pct / 0.40;
  } else {
    S6_raw = bi.demografiUmur.productive_pct / 0.70;
  }
  const S6 = Math.max(0, Math.min(1.0, S6_raw));

  // S7 (Historical Growth): bi.trenHistoris / 0.10
  const S7 = Math.max(0, Math.min(1.0, bi.trenHistoris / 0.10));

  // S8 (Anchor POI Count): bi.anchorPoiCount / 12
  const S8 = Math.max(0, Math.min(1.0, bi.anchorPoiCount / 12));

  // Formula:
  // compositeScore = (0.15 * S1 + 0.15 * S2 + 0.15 * S3 + 0.15 * S4 + 0.10 * S5 + 0.10 * S6 + 0.10 * S7 + 0.10 * S8) * 10
  const composite = (
    0.15 * S1 +
    0.15 * S2 +
    0.15 * S3 +
    0.15 * S4 +
    0.10 * S5 +
    0.10 * S6 +
    0.10 * S7 +
    0.10 * S8
  ) * 10;

  // Round composite score to 1 decimal place, constrained between 1.0 and 10.0.
  const finalScore = Math.max(1.0, Math.min(10.0, Math.round(composite * 10) / 10));

  // Output labels: Sangat Rendah (< 3.0), Rendah (< 5.0), Cukup (< 6.5), Baik (< 8.0), Sangat Baik (else).
  let label = 'Sangat Baik';
  if (finalScore < 3.0) {
    label = 'Sangat Rendah';
  } else if (finalScore < 5.0) {
    label = 'Rendah';
  } else if (finalScore < 6.5) {
    label = 'Cukup';
  } else if (finalScore < 8.0) {
    label = 'Baik';
  }

  return {
    competitorDensity: comp / maxComp,
    populationDensity: S1,
    accessibilityScore: S2,
    compositeScore: finalScore,
    label,
    scores: {
      S1,
      S2,
      S3,
      S4,
      S5,
      S6,
      S7,
      S8
    },
    metrics: {
      competitorCount: comp,
      population: demo.population,
      trafficLevel: tr.trafficLevel,
      density: demo.density,
      area: demo.area,
      accessibilityScore: tr.accessibilityScore,
      dayaBeli: bi.dayaBeli,
      biayaSewa: bi.biayaSewa,
      youth_15_34_pct: bi.demografiUmur.youth_15_34_pct,
      productive_pct: bi.demografiUmur.productive_pct,
      trenHistoris: bi.trenHistoris,
      anchorPoiCount: bi.anchorPoiCount
    }
  };
}

export default calculateScore;
