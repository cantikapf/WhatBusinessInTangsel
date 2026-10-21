// tangsel_bisnis_v2/tests/ui.test.js

// 1. Setup global mocks and module interceptors BEFORE importing React/Next components
import Module from 'module';
import React from 'react';

// Setup Mock DOM globals
global.window = global;
global.document = {
  documentElement: {
    classList: {
      add: () => {},
      remove: () => {},
    },
  },
  createElement: () => ({
    getContext: () => ({}),
  }),
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

// Module loader interceptor to mock Leaflet, Chart.js, react-leaflet, and CSS imports
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request.endsWith('.css')) {
    return {};
  }
  if (request === 'next/dynamic') {
    return function dynamic(loader) {
      return function DummyDynamic(props) {
        return React.createElement('div', { id: 'mock-dynamic-component' }, props.children);
      };
    };
  }
  if (request === 'leaflet') {
    const mockMap = {
      setView: function() { return this; },
      remove: function() {},
      addTo: function() { return this; },
      on: function() {},
      off: function() {},
      eachLayer: function() {},
    };
    const mockGeoJSON = {
      addTo: function() { return this; },
      eachLayer: function() {},
    };
    return {
      map: () => mockMap,
      tileLayer: () => ({ addTo: () => {} }),
      geoJSON: () => mockGeoJSON,
    };
  }
  if (request === 'chart.js') {
    class DummyChart {
      static register() {}
      destroy() {}
    }
    return {
      Chart: DummyChart,
      RadialLinearScale: {},
      PointElement: {},
      LineElement: {},
      Filler: {},
      CategoryScale: {},
      LinearScale: {},
      BarElement: {},
      ArcElement: {},
      Legend: {},
      Tooltip: {},
    };
  }
  if (request === 'lucide-react') {
    return new Proxy({}, {
      get: (target, name) => {
        return function DummyIcon(props) {
          return React.createElement('svg', { 'data-testid': `lucide-${name}`, ...props });
        };
      }
    });
  }
  return originalLoad.apply(this, arguments);
};

// 2. Import test dependencies and components
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert';
import { renderToString } from 'react-dom/server';

import Home from '../src/app/page';
import { AnalyticsPanel, MetricsPanel } from '../src/components/AnalyticsPanel';
import FilterForm from '../src/components/FilterForm';
import ComparisonPanel from '../src/components/ComparisonPanel';
import Footer from '../src/components/Footer';
import MethodPanel from '../src/components/MethodPanel';

import { calculateScore } from '../src/lib/engine/scoring';
import { generateRecommendation } from '../src/lib/engine/recommender';
import dataset from '../docs/gate2/verified_dataset.json';

// Mock Console to detect errors
let consoleErrorCalled = false;
const originalConsoleError = console.error;
console.error = (...args) => {
  consoleErrorCalled = true;
  originalConsoleError(...args);
};

test('UI Components Render Suite', async (t) => {
  
  await t.test('Footer renders correctly without errors', () => {
    const html = renderToString(React.createElement(Footer));
    assert.ok(html.includes('OpenStreetMap'), 'Footer should reference OpenStreetMap');
    // Regression guard: the real source is Dukcapil DKB, not BPS. An earlier
    // version claimed BPS here and this test locked the false claim in.
    assert.ok(html.includes('Data Konsolidasi Bersih'), 'Footer should name the DKB publication');
    assert.ok(
      html.includes('Kependudukan dan Pencatatan Sipil'),
      'Footer should name the issuing office',
    );
    assert.ok(
      html.includes('https://disdukcapil.tangerangselatankota.go.id/uploads/demografi/'),
      'Footer should link the Dukcapil documents directly, not just name them',
    );
    assert.ok(
      html.includes('opendatacommons.org/licenses/odbl'),
      'Footer should link the ODbL licence',
    );
    assert.ok(!html.includes('Badan Pusat'), 'Footer must not claim BPS as the source');
    assert.ok(html.includes('Kota Tangerang Selatan'), 'Footer should reference Kota Tangerang Selatan');
  });

  await t.test('FilterForm renders correct options', () => {
    const html = renderToString(React.createElement(FilterForm, {
      selectedSector: '',
      selectedSubdistrict: '',
      onSectorChange: () => {},
      onSubdistrictChange: () => {},
      onSubmit: () => {},
    }));
    assert.ok(html.includes('id="sector-select"'), 'Should contain sector select element');
    assert.ok(html.includes('id="subdistrict-select"'), 'Should contain subdistrict select element');
    assert.ok(html.includes('Retail') && html.includes('Minimarket'), 'Should contain Retail option');
    assert.ok(html.includes('Kesehatan'), 'Should contain Health option');
    assert.ok(html.includes('Pendidikan'), 'Should contain Education option');
    assert.ok(!html.includes('FnB'), 'Should NOT contain removed FnB option');
    assert.ok(html.includes('Setu'), 'Should contain Setu option');
    assert.ok(html.includes('Serpong'), 'Should contain Serpong option');
  });

  await t.test('ComparisonPanel displays list correctly', () => {
    const html = renderToString(React.createElement(ComparisonPanel, {
      selectedSubdistrict: 'serpong',
      selectedSector: 'retail',
      comparedList: ['serpong', 'setu'],
      onAdd: () => {},
      onRemove: () => {},
      onClear: () => {},
    }));
    assert.ok(html.includes('Perbandingan Lokasi Berdampingan'), 'Should show panel heading');
    assert.ok(html.includes('Serpong'), 'Should contain Serpong in compared list');
    assert.ok(html.includes('Setu'), 'Should contain Setu in compared list');
  });

  await t.test('Home page component renders without throwing errors', () => {
    consoleErrorCalled = false;
    const html = renderToString(React.createElement(Home));
    assert.ok(html.includes('WhatBusinessInTangsel'), 'Should contain app title');
    assert.ok(!consoleErrorCalled, 'Home render should not produce console errors');
  });

  await t.test('AnalyticsPanel and MetricsPanel render BI metrics and respond to data updates reactively', () => {
    // Sector: retail, Subdistrict: serpong
    const scoreData1 = calculateScore('serpong', 'retail');
    const recData1 = generateRecommendation('serpong', 'retail', scoreData1);

    assert.ok(scoreData1, 'Score data 1 should be calculated');
    assert.ok(recData1, 'Recommendation data 1 should be generated');

    const html1 = renderToString(
      React.createElement(AnalyticsPanel, { scoreData: scoreData1, recommendationData: recData1 })
    ) + renderToString(
      React.createElement(MetricsPanel, { scoreData: scoreData1 })
    );

    // Verify verified metrics exist in the rendered output
    assert.ok(html1.toLowerCase().includes('kepadatan poi terpetakan'), 'Metrics panel must render kepadatan POI terpetakan');
    assert.ok(!html1.toLowerCase().includes('jumlah kompetitor'), 'Metrics panel must NOT use unverified jumlah kompetitor label');
    assert.ok(html1.includes('Penduduk'), 'Metrics panel must render Penduduk metric');
    assert.ok(html1.includes('Kepadatan'), 'Metrics panel must render Kepadatan metric');
    assert.ok(html1.includes('Pemuda') || html1.includes('15–34') || html1.includes('15-34'), 'Metrics panel must render youth percentage');
    assert.ok(html1.includes('Produktif') || html1.includes('15–64') || html1.includes('15-64'), 'Metrics panel must render productive percentage');
    assert.ok(html1.includes('Anchor POI'), 'Metrics panel must render Anchor POI');

    // Verify unverified concept metrics are removed
    assert.ok(!html1.includes('Daya Beli'), 'Metrics panel must NOT render unverified Daya Beli');
    assert.ok(!html1.includes('Biaya Sewa'), 'Metrics panel must NOT render unverified Biaya Sewa');
    assert.ok(!html1.includes('Tren Pertumbuhan'), 'Metrics panel must NOT render unverified Tren Pertumbuhan');

    // Verify correct score and label values are displayed
    const expectedScoreText1 = scoreData1.compositeScore.toFixed(1);
    assert.ok(html1.includes(expectedScoreText1), `Should render correct composite score: ${expectedScoreText1}`);
    assert.ok(html1.includes(scoreData1.label), `Should render correct rating label: ${scoreData1.label}`);
    
    // Verify strategies are rendered
    assert.ok(recData1.strategies.length > 0, 'Should have strategies generated');
    recData1.strategies.forEach((strat) => {
      const fragment = strat.substring(0, 15);
      assert.ok(html1.includes(fragment), `Should render strategy fragment: "${fragment}"`);
    });

    // Reactive update simulation: change to Setu - Education
    const scoreData2 = calculateScore('setu', 'education');
    const recData2 = generateRecommendation('setu', 'education', scoreData2);

    assert.ok(scoreData2, 'Score data 2 should be calculated');
    assert.ok(recData2, 'Recommendation data 2 should be generated');

    const html2 = renderToString(
      React.createElement(AnalyticsPanel, { scoreData: scoreData2, recommendationData: recData2 })
    ) + renderToString(
      React.createElement(MetricsPanel, { scoreData: scoreData2 })
    );

    const expectedScoreText2 = scoreData2.compositeScore.toFixed(1);
    
    // Assert composite score and label updated reactively to new subdistrict/sector values
    assert.ok(html2.includes(expectedScoreText2), `Should render updated composite score: ${expectedScoreText2}`);
    assert.ok(html2.includes(scoreData2.label), `Should render updated rating label: ${scoreData2.label}`);
    
    // Verify strategies are updated to new ones
    assert.ok(recData2.strategies.length > 0, 'Should have strategies generated for second case');
    recData2.strategies.forEach((strat) => {
      const fragment = strat.substring(0, 15);
      assert.ok(html2.includes(fragment), `Should render updated strategy fragment: "${fragment}"`);
    });

    // Check that score 1 and score 2 are actually different
    assert.notStrictEqual(scoreData1.compositeScore, scoreData2.compositeScore, 'Scoring output should be different across different subdistricts and sectors');
    
    assert.ok(!consoleErrorCalled, 'React UI rendering and state transition simulation should not produce console errors');
  });

  await t.test('MethodPanel renders sources, weights, caveats, and freshness metadata', () => {
    const html = renderToString(React.createElement(MethodPanel));

    // Section title & UI headings
    assert.ok(html.includes('Metodologi, Bobot &amp; Sumber Data') || html.includes('Metodologi, Bobot & Sumber Data'), 'MethodPanel should render main heading');
    assert.ok(html.includes('Komposisi Bobot Indikator'), 'MethodPanel should render weights section');
    assert.ok(html.includes('Sumber Primer Terverifikasi'), 'MethodPanel should render sources section');

    // Indicator codes S1 through S6 present, one table row each
    for (const code of ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']) {
      assert.ok(html.includes(`>${code}<`), `Should contain ${code} indicator code`);
    }
    assert.ok(html.includes('20%'), 'Should contain 20% weight representation');
    assert.ok(html.includes('15%'), 'Should contain 15% weight representation');

    // Sourced data provenance, with the documents linked
    assert.ok(html.includes('Dukcapil'), 'Should reference Dukcapil agency');
    assert.ok(html.includes('OpenStreetMap'), 'Should reference OpenStreetMap source');
    assert.ok(html.includes('ODbL'), 'Should reference ODbL license');
    assert.ok(
      html.includes('https://disdukcapil.tangerangselatankota.go.id/uploads/demografi/KESELURUHAN1764555784678.pdf'),
      'Should link the DKB semester I 2025 PDF directly',
    );
    assert.ok(
      html.includes('https://disdukcapil.tangerangselatankota.go.id/uploads/demografi/KESELURUHAN1706581708476.pdf'),
      'Should link the DKB semester II 2023 PDF directly',
    );
    assert.ok(html.includes('overpass-turbo.eu'), 'Should link the Overpass tool used for POI counts');
    assert.ok(html.includes('openstreetmap.org/relation/'), 'Should link an OSM boundary relation');

    // The method figure ships as finished SVG, six indicator blocks included
    assert.ok(html.includes('method-figure'), 'Should render the method figure');
    assert.ok(html.includes('data-part="S6"'), 'Figure should carry a block per indicator');

    // Freshness & caveats
    assert.ok(html.includes('Pembaruan Dataset (Freshness)'), 'Should render freshness title');
    assert.ok(html.includes(dataset.generated_at.slice(0, 10)), 'Should contain the dataset generation date, not a hardcoded one');
    assert.ok(html.includes('Yang perlu kamu tahu'), 'Should render methodological caveats');
    assert.ok(html.includes('indeks eksploratif relatif'), 'Should declare exploratory index nature');
  });

  await t.test('Static contract: conditional error containers defined in component sources (not interaction QA)', () => {
    // Error boxes conditionally render only after interaction in browser; SSR does not trigger error state.
    // Static contract verifies the container structure and constraints in source files.
    const filterFormSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/FilterForm.tsx'), 'utf8');
    assert.ok(filterFormSrc.includes('validationError &&'), 'FilterForm must conditionally render error container');
    assert.ok(filterFormSrc.includes('id="validation-error"'), 'FilterForm must specify id="validation-error"');
    assert.ok(filterFormSrc.includes('Sektor bisnis harus dipilih'), 'FilterForm must validate sector input');
    assert.ok(filterFormSrc.includes('Lokasi harus dipilih'), 'FilterForm must validate subdistrict input');

    const comparisonPanelSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ComparisonPanel.tsx'), 'utf8');
    assert.ok(comparisonPanelSrc.includes('errorMsg &&'), 'ComparisonPanel must conditionally render error container');
    assert.ok(comparisonPanelSrc.includes('id="comparison-error"'), 'ComparisonPanel must specify id="comparison-error"');
    assert.ok(comparisonPanelSrc.includes('Maksimal perbandingan adalah 3 lokasi'), 'ComparisonPanel must guard max 3 locations limit');
  });

  await t.test('License separates code from data', () => {
    // The MIT grant covers the code. Data carries its own terms, and Dukcapil's
    // PDFs grant no open license at all — the file has to say so explicitly or
    // MIT reads as a relicense of someone else's figures.
    const license = fs.readFileSync(path.resolve(process.cwd(), 'LICENSE'), 'utf8');
    assert.ok(license.startsWith('MIT License'), 'LICENSE must begin with the MIT grant');
    assert.ok(license.includes('DATA IS NOT COVERED BY THIS LICENSE'), 'LICENSE must separate data from the code grant');
    assert.ok(license.includes('Dinas Kependudukan dan Pencatatan Sipil'), 'LICENSE must name the Dukcapil source');
    assert.ok(license.includes('no open-license clause'), 'LICENSE must state the Dukcapil license gap');
    assert.ok(license.includes('ODbL'), 'LICENSE must state the ODbL obligation for OSM layers');

    const pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'));
    assert.strictEqual(pkg.license, 'MIT', 'package.json must declare the same license as LICENSE');

    const readme = fs.readFileSync(path.resolve(process.cwd(), 'README.md'), 'utf8');
    assert.ok(readme.includes('## Lisensi'), 'README must have a license section readers will actually find');
  });
});
