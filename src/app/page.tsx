'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { LineChart, Moon, Sun, Linkedin, Github } from 'lucide-react';

import FilterForm from '../components/FilterForm';
import { AnalyticsPanel, MetricsPanel } from '../components/AnalyticsPanel';
import { RadarComparisonChart, CompetitorsBarChart, SectorPieChart } from '../components/ChartsPanel';
import ComparisonPanel from '../components/ComparisonPanel';
import Footer from '../components/Footer';

import { calculateScore, ScoreResult } from '../lib/engine/scoring';
import { generateRecommendation, RecommendationResult } from '../lib/engine/recommender';

// Dynamic import of MapComponent to prevent window undefined SSR crashes
const MapComponent = dynamic(() => import('../components/MapComponent'), { ssr: false });

export default function Home() {
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedSubdistrict, setSelectedSubdistrict] = useState<string>('');
  const [activeOverlay, setActiveOverlay] = useState<string>('none');
  const [comparedList, setComparedList] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  const [scoreData, setScoreData] = useState<ScoreResult | null>(null);
  const [recommendationData, setRecommendationData] = useState<RecommendationResult | null>(null);

  // Sync state on load
  useEffect(() => {
    try {
      const savedComparison = localStorage.getItem('tangsel_dashboard_comparison');
      if (savedComparison) {
        const parsed = JSON.parse(savedComparison);
        if (Array.isArray(parsed)) {
          setComparedList(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading comparison list from localStorage', e);
    }

    try {
      const savedDark = localStorage.getItem('tangsel_dark_mode');
      if (savedDark === 'true') {
        setDarkMode(true);
        document.documentElement.classList.add('dark-mode');
      }
    } catch (e) {
      console.error('Error loading dark mode state', e);
    }
  }, []);

  const handleSectorChange = (sector: string) => {
    setSelectedSector(sector);
    setScoreData(null);
    setRecommendationData(null);
    // Clearing comparison when sector changes to maintain comparison integrity of same sector
    setComparedList([]);
    localStorage.removeItem('tangsel_dashboard_comparison');
  };

  const handleSubdistrictChange = (subdistrict: string) => {
    setSelectedSubdistrict(subdistrict);
    setScoreData(null);
    setRecommendationData(null);
  };

  // Main Analisis Prospek button click handler
  const handleFormSubmit = (sector: string, subdistrict: string) => {
    setSelectedSector(sector);
    setSelectedSubdistrict(subdistrict);
    
    try {
      const score = calculateScore(subdistrict, sector);
      const rec = generateRecommendation(subdistrict, sector, score);
      setScoreData(score);
      setRecommendationData(rec);
    } catch (err) {
      console.error('Scoring calculation failed', err);
      setScoreData(null);
      setRecommendationData(null);
    }
  };

  // Subdistrict selection from Map click
  const handleSelectSubdistrictFromMap = (subdistrictId: string) => {
    setSelectedSubdistrict(subdistrictId);
    
    if (selectedSector) {
      try {
        const score = calculateScore(subdistrictId, selectedSector);
        const rec = generateRecommendation(subdistrictId, selectedSector, score);
        setScoreData(score);
        setRecommendationData(rec);
      } catch (err) {
        console.error('Scoring calculation failed from map selection', err);
        setScoreData(null);
        setRecommendationData(null);
      }
    }
  };

  // Comparison Handlers
  const handleAddToComparison = (subdistrictId: string) => {
    const newList = [...comparedList, subdistrictId];
    setComparedList(newList);
    localStorage.setItem('tangsel_dashboard_comparison', JSON.stringify(newList));
  };

  const handleRemoveFromComparison = (subdistrictId: string) => {
    const newList = comparedList.filter((id) => id !== subdistrictId);
    setComparedList(newList);
    localStorage.setItem('tangsel_dashboard_comparison', JSON.stringify(newList));
  };

  const handleClearComparison = () => {
    setComparedList([]);
    localStorage.removeItem('tangsel_dashboard_comparison');
  };

  // Dark Mode toggle handler
  const handleToggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem('tangsel_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark-mode');
      localStorage.setItem('tangsel_dark_mode', 'false');
    }
  };

  return (
    <main className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header Area */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm dashboard-card card-entry-animate">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <LineChart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
                WhatBusinessInTangsel
              </h1>
              <p className="text-xs text-indigo-500 font-semibold tracking-wide uppercase mt-0.5">
                Business Prospect Analytics · Kota Tangerang Selatan
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-2 max-w-lg">
            Membantu calon pengusaha mengidentifikasi lokasi terbaik di 7 kecamatan Tangsel — meminimalisir risiko berbasis data BPS & OpenStreetMap.
          </p>
          {/* Author CTA */}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-slate-400">Dibuat oleh</span>
            <a
              href="https://www.linkedin.com/in/cantikaputri-febrianti/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0A66C2] text-white hover:bg-[#004182] transition-colors shadow-sm"
              aria-label="Cantikaputri Febrianti LinkedIn"
            >
              <Linkedin className="w-3.5 h-3.5" />
              Cantikaputri Febrianti
            </a>
            <a
              href="https://github.com/cantikapf/tangsel-bisnis-v2"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors shadow-sm"
              aria-label="Source Code GitHub"
            >
              <Github className="w-3.5 h-3.5" />
              View Source
            </a>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="dark-mode-toggle"
            onClick={handleToggleDarkMode}
            className="dark-mode-toggle"
            aria-label="Toggle dark mode"
            title="Toggle dark/light mode"
          >
            {darkMode ? <Sun className="w-4 h-4 light-icon" /> : <Moon className="w-4 h-4 dark-icon" />}
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Data BPS 2023
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            OSM POI Counts
          </span>
        </div>
      </header>

      {/* Section Divider */}
      <div className="section-divider"></div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMN 1: CONTROL PANEL & DETAIL METRICS (4 cols) */}
        <section className="lg:col-span-4 space-y-6">
          <FilterForm
            selectedSector={selectedSector}
            selectedSubdistrict={selectedSubdistrict}
            onSectorChange={handleSectorChange}
            onSubdistrictChange={handleSubdistrictChange}
            onSubmit={handleFormSubmit}
          />
          <MetricsPanel scoreData={scoreData} />
        </section>

        {/* COLUMN 2: INTERACTIVE MAP & RECOMMENDATION ENGINE (8 cols) */}
        <section className="lg:col-span-8 space-y-6">
          <MapComponent
            selectedSubdistrict={selectedSubdistrict}
            selectedSector={selectedSector}
            activeOverlay={activeOverlay}
            onSelectSubdistrict={handleSelectSubdistrictFromMap}
            onActiveOverlayChange={setActiveOverlay}
          />
          <AnalyticsPanel scoreData={scoreData} recommendationData={recommendationData} />
        </section>
      </div>

      {/* Section Divider */}
      <div className="section-divider"></div>

      {/* Bottom Layout: Side-by-Side Comparison & Charts Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <ComparisonPanel
          selectedSubdistrict={selectedSubdistrict}
          selectedSector={selectedSector}
          comparedList={comparedList}
          onAdd={handleAddToComparison}
          onRemove={handleRemoveFromComparison}
          onClear={handleClearComparison}
        />
        <section className="lg:col-span-5">
          <RadarComparisonChart
            comparedSubdistricts={comparedList}
            selectedSector={selectedSector}
          />
        </section>
      </div>

      {/* Section Divider */}
      <div className="section-divider"></div>

      {/* Extra Row for Additional Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CompetitorsBarChart selectedSector={selectedSector} />
        <SectorPieChart selectedSubdistrict={selectedSubdistrict} />
      </div>

      {/* Footer Credit */}
      <Footer />
    </main>
  );
}
