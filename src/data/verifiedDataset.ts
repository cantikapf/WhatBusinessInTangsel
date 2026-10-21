import rawDataset from '../../docs/gate2/verified_dataset.json';

export interface SubdistrictRow {
  id: string;
  name: string;
  osm_relation: number;
  population: number;
  area_km2: number;
  area_geom_km2: number;
  density: number;
  density_basis: string;
  youth_15_34_pct: number;
  productive_15_64_pct: number;
  anchor_poi: number;
  sector_poi: {
    retail: number;
    health: number;
    education: number;
  };
  sector_poi_per_10k: {
    retail: number;
    health: number;
    education: number;
  };
}

export interface VerifiedDataset {
  generated_by: string;
  generated_at: string;
  note: string;
  normalizers: {
    density_max: number;
    anchor_max: number;
    sector_per_10k_max: {
      retail: number;
      health: number;
      education: number;
    };
    basis: string;
  };
  sources: {
    population: {
      agency: string;
      dataset: string;
      file: string;
      sha256: string;
      table: string;
      retrieved: string;
    };
    area: {
      agency: string;
      dataset: string;
      file: string;
      sha256: string;
      table: string;
      note?: string;
      retrieved: string;
    };
    age: { file: string; table: string };
    poi: { source: string; license: string; snapshot_range: string };
    boundaries: { source: string; license: string; admin_level: number };
  };
  caveats: string[];
  by_kecamatan: Record<string, SubdistrictRow>;
  totals: {
    population: number;
    area_km2: number;
    area_geom_km2: number;
    sector_poi: {
      retail: number;
      health: number;
      education: number;
    };
  };
}

const verifiedDataset: VerifiedDataset = rawDataset as unknown as VerifiedDataset;

export default verifiedDataset;
