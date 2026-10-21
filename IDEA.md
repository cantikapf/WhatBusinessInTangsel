# IDEA.md — WhatBusinessInTangsel

## Overview

A static Next.js dashboard answering one question for Kota Tangerang Selatan:
**for sector X in kecamatan Y, how good is this location, and why?**

It is a portfolio artifact for a Business Analyst role — the point is not the UI, it is that every ranking is derived through a documented, auditable formula.

**Data status: verified (Gate 3).** Every figure now comes from `docs/gate2/verified_dataset.json`, built by `npm run data:build` from Dukcapil DKB PDFs (hash-pinned) and an OpenStreetMap Overpass snapshot (ODbL). The output is still a **relative exploratory index**, not a feasibility ruling — weights are designer judgement, not calibrated.

## Core question

`(kecamatan, sector) → prospect score 1.0–10.0 + label + risk + target segment + strategies`

The score is intentionally multi-factor so the trade-off is visible: dense but crowded (Pamulang) versus sparse but cheap (Setu). A single-factor "population density" ranking would be useless for site selection.

## Data flow

```
docs/gate1/raw/*.pdf ─┐
OSM Overpass API     ─┼─→ docs/gate2/build.js (11 QC) ─→ verified_dataset.json
OSM boundaries       ─┘                                        │
                                                                ↓
                                              verifiedDataset.ts (typed bridge)
                                                                │
                                    scoring.ts (S1..S6, 6 weights, clamp) ─→ compositeScore + label
                                                                │              (labelForScore = only threshold table)
                                                                ├─→ recommender.ts → strategies
                                                                └─→ AnalyticsPanel / MetricsPanel / ChartsPanel
geojson/tangsel_subdistricts.json ─→ MapComponent (Leaflet, client-only) → choropleth + 7 overlay modes
```

Comparison mode reuses `calculateScore` per subdistrict, feeding `RadarComparisonChart`.

## Metric map (what S1..S6 actually are)

| | Metric | Weight | Normalizer (data-derived max) |
|---|---|---|---|
| S1 | Population density | 0.20 | `/ 11,797` (Pamulang) |
| S2 | Total population | 0.20 | `/ 339,054` (Pamulang) |
| S3 | Youth 15–34 share | 0.15 | `/ 0.3297` (Serpong Utara) |
| S4 | Productive 15–64 share | 0.15 | `/ 0.7433` (Serpong Utara) |
| S5 | Low mapped-POI density | 0.15 | `1 - per10k / max` (retail 4.97, health 1.39, education 7.51) |
| S6 | Anchor POI | 0.15 | `/ 8` (Pondok Aren) |

Weights sum to exactly 1.00. All S values clamped to [0,1]; composite `= Σ wᵢSᵢ × 10`, clamped
1.0–10.0. A missing POI count or normalizer **throws** instead of defaulting to 0.

## Scope boundary

7 kecamatan × 3 verified sectors = 21 cells, all backed by `verified_dataset.json`. No live API calls at runtime — the dataset is committed and rebuilt by an offline-cacheable pipeline (`npm run data:build`). The dashboard never fetches.

POI counts are **mapped-POI density**, not a business census: measured bias against a 298-cafe Google Maps ground truth ranges 1.25×–5.75× and inverts at Setu (0.40×).

## Pointers

- Working rules and verification commands: `HERMES.md`
- Current state, defects, backlog, known pitfalls: `PROJECT.md`
- Publication path and gate criteria: `docs/PUBLICATION_PLAN.md`
- Public-facing description: `README.md`
