import biMetrics from '../../data/biMetrics.json';

export interface RecommendationResult {
  suitability: string;
  mainRisk: string;
  targetSegment: string;
  strategies: string[];
}

/**
 * Generates sector-specific strategy recommendations leveraging the 5 new BI metrics.
 * @param subdistrict Subdistrict name
 * @param sector Business sector key
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

  let suitability = 'Cukup';
  if (score >= 8.0) suitability = 'Sangat Layak';
  else if (score >= 6.5) suitability = 'Layak';
  else if (score >= 5.5) suitability = 'Cukup Layak';
  else if (score >= 3.0) suitability = 'Kurang Layak';
  else suitability = 'Tidak Layak';

  const baseTemplates: Record<string, { mainRisk: string; targetSegment: string; strategies: string[] }> = {
    fnb: {
      mainRisk: 'Tingkat persaingan kafe/restoran sangat tinggi.',
      targetSegment: 'Keluarga muda, pekerja kantor, mahasiswa.',
      strategies: [
        'Diferensiasi menu unik, aktifkan delivery online.',
        'Fokus pada layanan delivery cepat.',
        'Diferensiasi menu/produk organik.'
      ]
    },
    fashion: {
      mainRisk: 'Perubahan tren cepat dan persaingan butik retail.',
      targetSegment: 'Remaja dan dewasa muda.',
      strategies: [
        'Promosi kreatif di media sosial.'
      ]
    },
    beauty: {
      mainRisk: 'Sensitivitas harga pelanggan lokal.',
      targetSegment: 'Wanita pekerja dan ibu rumah tangga.',
      strategies: [
        'Tawarkan program loyalitas, sediakan reservasi online.'
      ]
    },
    education: {
      mainRisk: 'Kredibilitas pengajar dan kurikulum lokal.',
      targetSegment: 'Anak usia sekolah dan orang tua murid.',
      strategies: [
        'Tawarkan kelas uji coba gratis.',
        'Rekrut pengajar berpengalaman.'
      ]
    },
    health: {
      mainRisk: 'Regulasi ketat obat-obatan.',
      targetSegment: 'Masyarakat umum dan lansia.',
      strategies: [
        'Layanan konsultasi apoteker ramah.'
      ]
    },
    automotive: {
      mainRisk: 'Ketersediaan suku cadang asli.',
      targetSegment: 'Pemilik kendaraan pribadi.',
      strategies: [
        'Garansi hasil servis, ruang tunggu nyaman dengan Wi-Fi gratis.'
      ]
    },
    retail: {
      mainRisk: 'Margin tipis dan dominasi jaringan ritel nasional.',
      targetSegment: 'Masyarakat umum.',
      strategies: [
        'Lakukan survei pasar lokal.',
        'Optimalkan visibilitas media sosial.'
      ]
    },
    services: {
      mainRisk: 'Risiko pasar operasional umum.',
      targetSegment: 'Masyarakat umum.',
      strategies: [
        'Lakukan survei pasar lokal.',
        'Optimalkan visibilitas media sosial.'
      ]
    }
  };

  const template = baseTemplates[sectKey] || {
    mainRisk: 'Risiko pasar operasional umum.',
    targetSegment: 'Masyarakat umum.',
    strategies: ['Lakukan survei pasar lokal.', 'Optimalkan visibilitas media sosial.']
  };

  const bi = (biMetrics as Record<string, any>)[subKey];
  const strategies = [...template.strategies];

  if (bi) {
    // 1. High Rent Mitigation
    if (bi.biayaSewa > 300000) {
      if (sectKey === 'fnb') {
        strategies.push(`Gunakan model cloud kitchen atau kurangi area dine-in untuk menekan tingginya biaya sewa (Rp ${bi.biayaSewa.toLocaleString()}/bln).`);
      } else if (sectKey === 'fashion' || sectKey === 'retail' || sectKey === 'beauty') {
        strategies.push(`Optimalkan penjualan online (e-commerce) atau gunakan konsep pop-up store untuk memitigasi biaya sewa yang tinggi (Rp ${bi.biayaSewa.toLocaleString()}/bln).`);
      } else {
        strategies.push(`Pilih lokasi di jalan sekunder atau optimalkan tata ruang/workplace sharing untuk menekan pengeluaran sewa (Rp ${bi.biayaSewa.toLocaleString()}/bln).`);
      }
    }

    // 2. Demographic Targeting
    if (bi.demografiUmur.youth_15_34_pct > 0.30) {
      strategies.push(`Targetkan pasar Gen-Z & Milenial dengan kampanye media sosial aktif karena proporsi pemuda tinggi (${(bi.demografiUmur.youth_15_34_pct * 100).toFixed(0)}%).`);
    }
    if (bi.demografiUmur.productive_pct > 0.60) {
      strategies.push(`Sediakan layanan/produk yang praktis dan efisien untuk menyasar populasi produktif (${(bi.demografiUmur.productive_pct * 100).toFixed(0)}%).`);
    }

    // 3. Anchor POI Marketing
    if (bi.anchorPoiCount >= 5) {
      strategies.push(`Manfaatkan kedekatan dengan ${bi.anchorPoiCount} Anchor POI terdekat melalui promosi lokal (geofencing) dan kemitraan strategis.`);
    }

    // 4. Purchasing Power Tailoring
    if (bi.dayaBeli > 3500000) {
      strategies.push(`Tawarkan produk/layanan bernilai tambah tinggi atau segmen premium karena daya beli masyarakat tinggi (Rp ${bi.dayaBeli.toLocaleString()}).`);
    } else if (bi.dayaBeli < 2800000) {
      strategies.push(`Terapkan strategi harga terjangkau, paket bundling, atau promo diskon berkala untuk menyiasati daya beli yang moderat (Rp ${bi.dayaBeli.toLocaleString()}).`);
    }

    // 5. Growth Trend Leveraging
    if (bi.trenHistoris > 0.06) {
      strategies.push(`Manfaatkan momentum pertumbuhan ekonomi subdistrik yang kuat (${(bi.trenHistoris * 100).toFixed(1)}%) dengan ekspansi atau promosi agresif.`);
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
