import { calculateScore, SCORE_WEIGHTS } from '../../lib/engine/scoring';

/** The six indicators, in the order S1..S6 the engine scores them. */
export const WEIGHTS = [
  SCORE_WEIGHTS.W1,
  SCORE_WEIGHTS.W2,
  SCORE_WEIGHTS.W3,
  SCORE_WEIGHTS.W4,
  SCORE_WEIGHTS.W5,
  SCORE_WEIGHTS.W6,
];

/** What each of the six stands for, in the same order as WEIGHTS. */
export const INDICATORS = [
  { code: 'S1', name: 'Kepadatan penduduk' },
  { code: 'S2', name: 'Jumlah penduduk' },
  { code: 'S3', name: 'Usia 15–34' },
  { code: 'S4', name: 'Usia 15–64' },
  { code: 'S5', name: 'Ruang pasar tersisa' },
  { code: 'S6', name: 'Titik ramai' },
] as const;

export const SECTORS = [
  { id: 'retail', name: 'Retail & minimarket' },
  { id: 'health', name: 'Kesehatan' },
  { id: 'education', name: 'Pendidikan' },
] as const;

/** Same ids the subdistrict <select> uses. */
export const KECAMATAN = [
  { id: 'setu', name: 'Setu' },
  { id: 'serpong', name: 'Serpong' },
  { id: 'pamulang', name: 'Pamulang' },
  { id: 'ciputat', name: 'Ciputat' },
  { id: 'ciputat_timur', name: 'Ciputat Timur' },
  { id: 'pondok_aren', name: 'Pondok Aren' },
  { id: 'serpong_utara', name: 'Serpong Utara' },
] as const;

export interface FigureState {
  /** Normalised value of S1..S6, straight from the engine. */
  values: number[];
  score: number;
  label: string;
  readout: string;
}

const comma = (value: number) => value.toFixed(1).replace('.', ',');

/**
 * Every combination the dashboard can show: 7 kecamatan x 3 sektor.
 * Nothing here is authored by hand — the heights the figure draws are the
 * engine's own S1..S6, so the drawing cannot drift from the score.
 */
export const STATES: FigureState[] = KECAMATAN.flatMap((kec) =>
  SECTORS.map((sector) => {
    const result = calculateScore(kec.id, sector.id);
    const values = [
      result.scores.S1,
      result.scores.S2,
      result.scores.S3,
      result.scores.S4,
      result.scores.S5,
      result.scores.S6,
    ];
    return {
      values,
      score: result.compositeScore,
      label: result.label,
      readout: `${kec.name} · ${sector.name} — ${comma(result.compositeScore)}`,
    };
  }),
);

export const SUSPECT = 'Tidak ada angka di gambar ini yang diketik manual.';
