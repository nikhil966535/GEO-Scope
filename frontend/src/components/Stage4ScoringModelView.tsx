import React from 'react';
import {
  Sliders,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Bus,
  UtensilsCrossed,
  ShoppingBag,
  GraduationCap,
  Hotel,
  HeartPulse,
  Landmark,
  Layers,
  Sparkles,
  FileText,
  Activity,
  LucideIcon,
} from 'lucide-react';
import { SiteScorecard, RetailShopPOI } from '../services/poiService';
import { CityConfig, CityWard } from '../data/citiesData';

interface Props {
  activeCity: CityConfig;
  selectedWard: CityWard;
  candidateCoords: { lat: number; lng: number };
  analysisRadius: number;
  onRadiusChange: (radius: number) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  scorecard: SiteScorecard | null;
  shops: RetailShopPOI[];
  provider: string;
  onNavigateTab: (tab: string) => void;
  onOpenReport: () => void;
}

const BUSINESS_CATEGORIES = [
  'Cafe & Specialty Coffee',
  'Quick Service Restaurant (QSR)',
  'Grocery & Supermarket',
  'Pharmacy & Healthcare Store',
  'Fashion & Apparel Boutique',
  'Bakery & Patisserie',
  'Gym & Wellness Studio',
  'Electronics & Mobile Store',
  'Bookstore & Stationery Cafe',
  'Movie Theater & Entertainment Hub',
];

interface CriterionItem {
  name: string;
  weight: string;
  score: number;
  maxScore: number;
  icon: LucideIcon;
  color: string;
  formula: string;
  description: string;
}

export const Stage4ScoringModelView: React.FC<Props> = ({
  activeCity,
  selectedWard,
  candidateCoords,
  analysisRadius,
  onRadiusChange,
  selectedCategory,
  onCategoryChange,
  scorecard,
  shops,
  provider,
  onNavigateTab,
  onOpenReport,
}) => {
  const score = scorecard?.overallScore ?? 12;
  const grade = scorecard?.ratingGrade ?? 'C';
  const label = scorecard?.verdict ?? 'Undeveloped Zone';

  const getGradeTheme = (g: string) => {
    switch (g) {
      case 'A+':
      case 'A':
        return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.35)' };
      case 'B':
        return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.35)' };
      case 'C':
        return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.35)' };
      default:
        return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.35)' };
    }
  };

  const theme = getGradeTheme(grade);

  const criteria: CriterionItem[] = [
    {
      name: 'Distance-Decayed Anchor Footfall Attraction',
      weight: '30%',
      score: scorecard?.componentScores?.footfallDraw ?? 0,
      maxScore: 30,
      icon: TrendingUp,
      color: '#3b82f6',
      formula: 'Σ [W_sector × e^(-d / λ)] for all schools, colleges, hotels, and transit hubs',
      description: 'Quantifies impulse and destination pedestrian traffic drawn by primary non-retail anchors within the buffer.',
    },
    {
      name: 'Category Market & Dwell Synergy',
      weight: '25%',
      score: scorecard?.componentScores?.sectorSynergy ?? 0,
      maxScore: 25,
      icon: Layers,
      color: '#10b981',
      formula: 'Sector affinity matrix specific to selected category (e.g. Offices + Colleges for Cafes)',
      description: 'Measures high-affinity complementary establishments that lengthen customer dwell times and basket sizes.',
    },
    {
      name: 'Hotelling Competition Health & Agglomeration',
      weight: '20%',
      score: scorecard?.componentScores?.competitionHealth ?? 0,
      maxScore: 20,
      icon: Activity,
      color: '#f59e0b',
      formula: 'Optimum cluster density [1-4 direct peers] vs. saturation penalty [>5 direct peers]',
      description: 'Balances the footfall advantage of commercial aggregation against cannibalization risks from direct rivals.',
    },
    {
      name: 'Transit & Micro-Mobility Connectivity',
      weight: '15%',
      score: scorecard?.componentScores?.transitConnectivity ?? 0,
      maxScore: 15,
      icon: Bus,
      color: '#a855f7',
      formula: 'Decayed proximity to bus stops, metro stations, auto stands, and arterial corridors',
      description: 'Determines convenience of arrival for patrons traveling outside immediate walking distance.',
    },
    {
      name: 'Commercial Agglomeration Density',
      weight: '10%',
      score: scorecard?.componentScores?.commercialDensity ?? 0,
      maxScore: 10,
      icon: Building2,
      color: '#06b6d4',
      formula: 'Count of total active storefronts normalized by circular catchment area (POI / km²)',
      description: 'General high-street or retail cluster intensity validating the viability of modern retail operations.',
    },
  ];

  const breakdown = scorecard?.sectorBreakdown || {
    education: 0,
    hospitality: 0,
    healthcare: 0,
    retail: 0,
    food: 0,
    transit: 0,
    banking: 0,
    commercial: 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="control-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                className="placeholder-badge"
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  color: '#93c5fd',
                  borderColor: 'rgba(59, 130, 246, 0.35)',
                }}
              >
                STAGE 4 MODEL • SPATIAL MCDA ENGINE
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                Provider: <strong>{provider}</strong> • Multi-Criteria Decision Analysis (0–100 Scale)
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>
              Spatial Site Suitability Scoring Studio
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Algorithmic site evaluation using distance-decayed attraction kernels, cross-sector dwell affinity, and Hotelling competition balance.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigateTab('poi-data')}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Layers size={14} />
              View Underlying POIs ({shops.length})
            </button>
            <button
              onClick={onOpenReport}
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FileText size={14} />
              Export Dossier (Stage 5)
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Evaluation Parameter Controls */}
      <div className="control-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={16} color="var(--accent-blue)" />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
              Evaluation Parameters for Exact Pin Point
            </h3>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Pinned Coordinates:{' '}
            <code style={{ color: '#93c5fd' }}>
              {candidateCoords.lat.toFixed(5)}° N, {candidateCoords.lng.toFixed(5)}° E
            </code>{' '}
            in <strong>{activeCity.name}</strong> ({selectedWard.name.split(' (')[0]})
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Category Switcher */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Target Retail / Business Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="form-control"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              {BUSINESS_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Catchment Radius Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Catchment Buffer Radius
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[300, 500, 1000, 2000, 3000].map((r) => {
                const labelStr = r >= 1000 ? `${r / 1000} km` : `${r} m`;
                const active = analysisRadius === r;
                return (
                  <button
                    key={r}
                    onClick={() => onRadiusChange(r)}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: 'var(--radius-sm)',
                      border: active ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                      backgroundColor: active ? 'rgba(59, 130, 246, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                      color: active ? '#ffffff' : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {labelStr}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Scorecard Display */}
      <div
        className="control-card"
        style={{
          padding: '24px',
          background: `radial-gradient(ellipse at top right, ${theme.bg}, transparent 70%), var(--bg-card)`,
          border: `1px solid ${theme.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '16px',
                backgroundColor: theme.bg,
                border: `2px solid ${theme.color}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 24px ${theme.bg}`,
              }}
            >
              <span style={{ fontSize: '1.9rem', fontWeight: 900, color: theme.color, lineHeight: 1 }}>
                {score}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>
                out of 100
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '6px',
                    backgroundColor: theme.bg,
                    color: theme.color,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  GRADE {grade} • {label}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {scorecard?.totalAnchors ?? shops.length} Venues Factored
                </span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>
                Suitability for {selectedCategory}
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0, maxWidth: '650px' }}>
                {scorecard?.summary ||
                  `Evaluated across ${shops.length} verified commercial anchors strictly within ${analysisRadius >= 1000 ? `${analysisRadius / 1000} km` : `${analysisRadius} m`} of candidate coordinates.`}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('recommendations')}
            className="btn btn-primary"
            style={{
              padding: '10px 18px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Sparkles size={16} />
            View AI Recommendations
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 5-Criteria Deep Breakdown */}
      <div className="control-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
              Multi-Criteria Mathematical Score Breakdown
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>
              Normalized weights summing to 100 points, calculated using spatial kernels
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
            MCDA Weights: 30% / 25% / 20% / 15% / 10%
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {criteria.map((c, i) => {
            const pct = Math.round((c.score / c.maxScore) * 100);
            const Icon = c.icon;
            return (
              <div
                key={i}
                style={{
                  padding: '14px 16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: `${c.color}20`,
                        border: `1px solid ${c.color}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={16} color={c.color} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                        {c.name}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginLeft: '8px' }}>
                        (Weight: {c.weight})
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: c.color }}>
                      {c.score} <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>/ {c.maxScore} pts</span>
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: `${c.color}15`,
                        color: c.color,
                      }}
                    >
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    height: '6px',
                    width: '100%',
                    backgroundColor: 'rgba(30, 41, 59, 0.8)',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                    marginBottom: '8px',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      backgroundColor: c.color,
                      borderRadius: '9999px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>{c.description}</span>
                  <code style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{c.formula}</code>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footfall Anchors & Spatial SWOT Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Footfall Sector Breakdown */}
        <div className="control-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Layers size={16} color="var(--accent-teal)" />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
              Sectors Present in Catchment Area ({shops.length} Total)
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Retail & Stores', count: breakdown.retail, icon: ShoppingBag, color: '#10b981' },
              { label: 'Dining & Cafes', count: breakdown.food, icon: UtensilsCrossed, color: '#ef4444' },
              { label: 'Transit & Mobility', count: breakdown.transit, icon: Bus, color: '#a855f7' },
              { label: 'Offices & IT Parks', count: breakdown.commercial, icon: Building2, color: '#6366f1' },
              { label: 'Schools & Colleges', count: breakdown.education, icon: GraduationCap, color: '#3b82f6' },
              { label: 'Hotels & Lodging', count: breakdown.hospitality, icon: Hotel, color: '#f59e0b' },
              { label: 'Healthcare & Pharma', count: breakdown.healthcare, icon: HeartPulse, color: '#f43f5e' },
              { label: 'Banks & ATMs', count: breakdown.banking, icon: Landmark, color: '#0d9488' },
            ].map((s, idx) => {
              const Icon = s.icon;
              return (
                <div
                  key={idx}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={15} color={s.color} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.label}</span>
                  </div>
                  <strong style={{ fontSize: '0.85rem', color: s.count > 0 ? '#ffffff' : 'var(--text-dim)' }}>
                    {s.count}
                  </strong>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spatial SWOT Analysis */}
        <div className="control-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <ShieldCheck size={16} color="var(--accent-blue)" />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
              Spatial SWOT & Critical Considerations
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {scorecard?.keyDrivers && scorecard.keyDrivers.length > 0 ? (
              scorecard.keyDrivers.map((driver: string, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    fontSize: '0.78rem',
                    color: '#d1fae5',
                  }}
                >
                  <ShieldCheck size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{driver}</span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                No significant spatial advantages detected at this pin point.
              </div>
            )}

            {scorecard?.riskFactors && scorecard.riskFactors.length > 0 ? (
              scorecard.riskFactors.map((risk: string, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    fontSize: '0.78rem',
                    color: '#fef3c7',
                  }}
                >
                  <ShieldAlert size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{risk}</span>
                </div>
              ))
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
