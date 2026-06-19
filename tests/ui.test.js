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
import test from 'node:test';
import assert from 'node:assert';
import { renderToString } from 'react-dom/server';

import Home from '../src/app/page';
import { AnalyticsPanel, MetricsPanel } from '../src/components/AnalyticsPanel';
import FilterForm from '../src/components/FilterForm';
import ComparisonPanel from '../src/components/ComparisonPanel';
import Footer from '../src/components/Footer';

import { calculateScore } from '../src/lib/engine/scoring';
import { generateRecommendation } from '../src/lib/engine/recommender';

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
    assert.ok(html.includes('BPS Tangerang Selatan'), 'Footer should reference BPS Tangerang Selatan');
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
    assert.ok(html.includes('FnB (Kafe/Restoran/Warteg/Bakery)'), 'Should contain FnB option');
    assert.ok(html.includes('Setu'), 'Should contain Setu option');
    assert.ok(html.includes('Serpong'), 'Should contain Serpong option');
  });

  await t.test('ComparisonPanel displays list correctly', () => {
    const html = renderToString(React.createElement(ComparisonPanel, {
      selectedSubdistrict: 'serpong',
      selectedSector: 'fnb',
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
    assert.ok(html.includes('Tangsel Business Prospect Analytics'), 'Should contain app title');
    assert.ok(!consoleErrorCalled, 'Home render should not produce console errors');
  });

  await t.test('AnalyticsPanel and MetricsPanel render BI metrics and respond to data updates reactively', () => {
    // Sector: fnb, Subdistrict: serpong
    const scoreData1 = calculateScore('serpong', 'fnb');
    const recData1 = generateRecommendation('serpong', 'fnb', scoreData1);

    assert.ok(scoreData1, 'Score data 1 should be calculated');
    assert.ok(recData1, 'Recommendation data 1 should be generated');

    const html1 = renderToString(
      React.createElement(AnalyticsPanel, { scoreData: scoreData1, recommendationData: recData1 })
    ) + renderToString(
      React.createElement(MetricsPanel, { scoreData: scoreData1 })
    );

    // Verify key BI metrics exist in the rendered output
    assert.ok(html1.includes('Daya Beli'), 'Metrics panel must render Daya Beli metric');
    assert.ok(html1.includes('Biaya Sewa'), 'Metrics panel must render Biaya Sewa metric');
    assert.ok(html1.includes('Pemuda') || html1.includes('Youth') || html1.includes('15-34'), 'Metrics panel must render youth percentage');
    assert.ok(html1.includes('Anchor POI'), 'Metrics panel must render Anchor POI');
    assert.ok(html1.includes('Tren Pertumbuhan') || html1.includes('growth') || html1.includes('Pertumbuhan'), 'Metrics panel must render growth rate');

    // Verify correct score and label values are displayed
    const expectedScoreText1 = scoreData1.compositeScore.toFixed(1);
    assert.ok(html1.includes(expectedScoreText1), `Should render correct composite score: ${expectedScoreText1}`);
    assert.ok(html1.includes(scoreData1.label), `Should render correct rating label: ${scoreData1.label}`);
    
    // Verify strategies are rendered
    assert.ok(recData1.strategies.length > 0, 'Should have strategies generated');
    recData1.strategies.forEach((strat) => {
      // Check first few characters or full string to avoid formatting mismatches
      const fragment = strat.substring(0, 15);
      assert.ok(html1.includes(fragment), `Should render strategy fragment: "${fragment}"`);
    });

    // Reactive update simulation: change to Setu - Retail
    const scoreData2 = calculateScore('setu', 'retail');
    const recData2 = generateRecommendation('setu', 'retail', scoreData2);

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
});
