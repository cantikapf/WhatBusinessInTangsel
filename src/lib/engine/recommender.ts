import verifiedDataset from '../../data/verifiedDataset';
import { labelForScore } from './scoring';

export interface RecommendationResult {
  suitability: string;
  mainRisk: string;
  targetSegment: string;
  strategies: string[];
}

/**
 * Generates sector-specific strategy recommendations leveraging verified Gate 2 data.
 * @param subdistrict Subdistrict name or slug
 * @param sector Business sector key ('retail' | 'health' | 'education')
 * @param scoreData Scored results containing compositeScore
 * @returns Suitability, main risks, target segments, and strategies
 */
export function generateRecommendation(
  subdistrict: string,
  sector: string,
  scoreData: { compositeScore: number }
): RecommendationResult {
  const score = scoreData.compositeScore;
  const subKey = subdistrict.toLowerCase().trim().replace(/\s+/g, '_');
  const sectKey = sector.toLowerCase().trim();

  // Single label vocabulary: reuse scoring's labelForScore so the two cannot drift.
  // Deliberately index language ("Cukup"/"Baik"), not verdict language ("Layak") — the
  // dashboard measures a relative exploratory index, not business feasibility.
  const suitability = labelForScore(score);

  const baseTemplates: Record<string, { mainRisk: string; targetSegment: string; strategies: string[] }> = {
    retail: {
      mainRisk: 'Margin tipis dan dominasi jaringan ritel minimarket modern terorganisasi.',
      targetSegment: 'Keluarga residensial lokal dan konsumen kebutuhan pokok harian.',
      strategies: [
        'Lakukan kurasi produk cepat putar (fast-moving) sesuai selera warga lingkungan sekitar.',
        'Sediakan program belanja berkala atau pesan-antar komunitas di radius perumahan.'
      ]
    },
    health: {
      mainRisk: 'Kepatuhan regulasi izin farmasi/klinik dan persaingan fasilitas kesehatan primer.',
      targetSegment: 'Keluarga, anak-anak, dan populasi lansia di lingkungan terdekat.',
      strategies: [
        'Sediakan layanan konsultasi kesehatan dasar yang ramah dan ketersediaan obat esensial.',
        'Bangun kemitraan strategis dengan komunitas perumahan dan kader kesehatan warga.'
      ]
    },
    education: {
      mainRisk: 'Reputasi pengajar, kurikulum pembelajaran, dan kompetisi lembaga bimbingan lokal.',
      targetSegment: 'Anak usia sekolah (SD hingga SMA) serta orang tua yang mementingkan mutu belajar.',
      strategies: [
        'Tawarkan sesi kelas uji coba gratis (trial class) untuk membangun kepercayaan orang tua.',
        'Sesuaikan jadwal dan materi bimbingan dengan agenda ujian sekolah di wilayah sekitar.'
      ]
    }
  };

  const template = baseTemplates[sectKey] || {
    mainRisk: 'Risiko pasar operasional umum dan adaptasi regulasi lokal.',
    targetSegment: 'Masyarakat umum di lingkungan sekitar.',
    strategies: ['Lakukan survei pasar lokal.', 'Optimalkan visibilitas di lingkungan sekitar.']
  };

  const row = verifiedDataset.by_kecamatan[subKey];
  const strategies = [...template.strategies];

  if (row) {
    // 1. Demographic Targeting - Youth
    if (row.youth_15_34_pct >= 0.32) {
      strategies.push(`Targetkan pasar pemuda & keluarga muda yang mencapai ${(row.youth_15_34_pct * 100).toFixed(1)}% populasi dengan komunikasi digital dan promosi modern.`);
    }

    // 2. Demographic Targeting - Productive Age
    if (row.productive_15_64_pct >= 0.72) {
      strategies.push(`Sediakan layanan praktis dan jam operasional fleksibel untuk menyasar populasi produktif (${(row.productive_15_64_pct * 100).toFixed(1)}% populasi).`);
    }

    // 3. Anchor POI Transit / Hub Advantage
    if (row.anchor_poi >= 5) {
      strategies.push(`Manfaatkan tarikan ${row.anchor_poi} simpul Anchor POI (stasiun/terminal/mall) untuk menangkap lalu lintas komuter dan pengunjung transit.`);
    }

    // 4. Mapped POI Density Strategy
    const poiPer10k = row.sector_poi_per_10k ? (row.sector_poi_per_10k as Record<string, number>)[sectKey] : undefined;
    if (typeof poiPer10k === 'number') {
      if (poiPer10k < 1.5) {
        strategies.push(`Kepadatan POI terpetakan relatif rendah (${poiPer10k} per 10k jiwa), memberi peluang penetrasi awal di kantong permukiman yang belum padat pemetaan.`);
      } else {
        strategies.push(`Kepadatan POI terpetakan tercatat ${poiPer10k} per 10k jiwa; diferensiasi kualitas layanan menjadi kunci untuk bersaing.`);
      }
    }
  }

  // Deduplicate strategies
  const uniqueStrategies = Array.from(new Set(strategies));

  return {
    suitability,
    mainRisk: template.mainRisk,
    targetSegment: template.targetSegment,
    strategies: uniqueStrategies
  };
}

export default generateRecommendation;
