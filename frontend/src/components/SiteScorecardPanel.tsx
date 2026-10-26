import React from 'react';
import { SiteScorecard, PlaceSector } from '../services/poiService';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Hotel,
  Bus,
  ShoppingBag,
  UtensilsCrossed,
  HeartPulse,
  Landmark,
  Building2,
  ShieldCheck,
  ChevronRight,
  LucideIcon,
  FileText,
} from 'lucide-react';

interface SiteScorecardPanelProps {
  scorecard: SiteScorecard | null;
  category: string;
  cityName: string;
  wardName: string;
  radiusMeters: number;
  onOpenReport?: () => void;
}

const SECTOR_META: Record<PlaceSector, { label: string; icon: LucideIcon; color: string }> = {
  education: { label: 'Schools & Colleges', icon: GraduationCap, color: '#3b82f6' },
  hospitality: { label: 'Hotels & Lodging', icon: Hotel, color: '#f59e0b' },
  transit: { label: 'Transit Hubs', icon: Bus, color: '#a855f7' },
  retail: { label: 'Retail & Commerce', icon: ShoppingBag, color: '#10b981' },
  food: { label: 'Dining & Food', icon: UtensilsCrossed, color: '#ef4444' },
  healthcare: { label: 'Healthcare & Pharma', icon: HeartPulse, color: '#f43f5e' },
  banking: { label: 'Banking & ATMs', icon: Landmark, color: '#0d9488' },
  commercial: { label: 'Offices & Business', icon: Building2, color: '#6366f1' },
};

export const SiteScorecardPanel: React.FC<SiteScorecardPanelProps> = ({
  scorecard,
  category,
  cityName,
  wardName,
  radiusMeters,
  onOpenReport,
}) => {
  if (!scorecard) return null;

  const {
    overallScore,
    ratingGrade,
    verdict,
    summary,
    componentScores,
    sectorBreakdown,
    totalAnchors,
    retailCount = (scorecard.sectorBreakdown.retail || 0) + (scorecard.sectorBreakdown.food || 0) + (scorecard.sectorBreakdown.banking || 0) + (scorecard.sectorBreakdown.commercial || 0),
    institutionalCount = (scorecard.sectorBreakdown.education || 0) + (scorecard.sectorBreakdown.healthcare || 0) + (scorecard.sectorBreakdown.transit || 0) + (scorecard.sectorBreakdown.hospitality || 0),
    nearestAnchor,
    keyDrivers,
    riskFactors,
  } = scorecard;

  // Grade color
  let gradeColor = '#10b981'; // Green
  let gradeBg = 'rgba(16, 185, 129, 0.15)';
  if (ratingGrade === 'A') {
    gradeColor = '#3b82f6';
    gradeBg = 'rgba(59, 130, 246, 0.15)';
  } else if (ratingGrade === 'B') {
    gradeColor = '#f59e0b';
    gradeBg = 'rgba(245, 158, 11, 0.15)';
  } else if (ratingGrade === 'C') {
    gradeColor = '#ef4444';
    gradeBg = 'rgba(239, 68, 68, 0.15)';
  }

  return (
    <div className="site-scorecard-card">
      {/* Header */}
      <div className="scorecard-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="scorecard-icon-box">
            <Award size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 className="scorecard-title">Stage 3 & 4 Location Suitability Scorecard</h3>
              <span className="stage-badge-pill">MCDA Spatial Engine</span>
            </div>
            <p className="scorecard-subtitle">
              Evaluating <strong>{category}</strong> from exact pin point within {radiusMeters >= 1000 ? `${radiusMeters / 1000} km` : `${radiusMeters}m`} in {wardName.split(' (')[0]}, {cityName}
            </p>
          </div>
        </div>

        {onOpenReport && (
          <button
            onClick={onOpenReport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
              transition: 'all 0.2s ease',
            }}
          >
            <FileText size={14} />
            <span>Executive Report (Stage 5)</span>
          </button>
        )}
      </div>

      {/* Main Score Hero Banner */}
      <div className="scorecard-hero-banner">
        {/* Score Ring */}
        <div className="score-hero-circle" style={{ borderColor: gradeColor, boxShadow: `0 0 20px ${gradeColor}30` }}>
          <span className="score-hero-number" style={{ color: gradeColor }}>
            {overallScore}
          </span>
          <span className="score-hero-denom">/ 100</span>
        </div>

        {/* Verdict & Narrative */}
        <div className="score-hero-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span
              className="grade-tag"
              style={{ color: gradeColor, backgroundColor: gradeBg, borderColor: `${gradeColor}50` }}
            >
              Grade {ratingGrade}
            </span>
            <h4 className="verdict-title">{verdict}</h4>
          </div>
          <p className="verdict-summary">{summary}</p>
          <div className="anchors-detected-row" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ShieldCheck size={14} color="var(--accent-teal)" />
              <span>
                <strong>All {totalAnchors} Venues Factored</strong> within {radiusMeters >= 1000 ? `${radiusMeters / 1000}km` : `${radiusMeters}m`}
              </span>
            </div>
            <span style={{ color: 'var(--text-dim)' }}>•</span>
            <span style={{ color: '#93c5fd' }}>
              🛍️ <strong>{retailCount} Retail & Stores</strong>
            </span>
            <span style={{ color: 'var(--text-dim)' }}>•</span>
            <span style={{ color: '#c084fc' }}>
              🏛️ <strong>{institutionalCount} Anchors</strong>
            </span>
            {nearestAnchor && (
              <>
                <span style={{ color: 'var(--text-dim)' }}>•</span>
                <span style={{ color: '#34d399' }}>
                  📍 Nearest: <strong>{nearestAnchor.name}</strong> ({nearestAnchor.distanceMeters}m)
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Component Breakdown Bars */}
      <div className="scorecard-components-section">
        <h5 className="section-mini-heading">Multi-Criteria Score Breakdown</h5>
        <div className="components-grid">
          {/* Footfall Draw */}
          <div className="component-bar-item">
            <div className="component-bar-header">
              <span className="component-name">🚶 Anchor Footfall Attraction</span>
              <strong className="component-points">{componentScores.footfallDraw} / 30 pts</strong>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${(componentScores.footfallDraw / 30) * 100}%`,
                  backgroundColor: '#3b82f6',
                }}
              />
            </div>
            <span className="component-desc">Schools, colleges, hotels & transit drawing visitors</span>
          </div>

          {/* Sector Synergy */}
          <div className="component-bar-item">
            <div className="component-bar-header">
              <span className="component-name">🎯 Category Market Synergy</span>
              <strong className="component-points">{componentScores.sectorSynergy} / 25 pts</strong>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${(componentScores.sectorSynergy / 25) * 100}%`,
                  backgroundColor: '#10b981',
                }}
              />
            </div>
            <span className="component-desc">Complementary fit with neighborhood commercial sectors</span>
          </div>

          {/* Competition Health */}
          <div className="component-bar-item">
            <div className="component-bar-header">
              <span className="component-name">⚖️ Competition & Clustering</span>
              <strong className="component-points">{componentScores.competitionHealth} / 20 pts</strong>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${(componentScores.competitionHealth / 20) * 100}%`,
                  backgroundColor: '#f59e0b',
                }}
              />
            </div>
            <span className="component-desc">Healthy customer-pull cluster vs. oversaturation</span>
          </div>

          {/* Transit Connectivity */}
          <div className="component-bar-item">
            <div className="component-bar-header">
              <span className="component-name">🚉 Transit & Mobility Access</span>
              <strong className="component-points">{componentScores.transitConnectivity} / 15 pts</strong>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${(componentScores.transitConnectivity / 15) * 100}%`,
                  backgroundColor: '#a855f7',
                }}
              />
            </div>
            <span className="component-desc">Bus stops, railway station & primary road junction access</span>
          </div>
        </div>
      </div>

      {/* Sector Footfall Anchors Distribution Strip */}
      <div className="sector-distribution-section">
        <h5 className="section-mini-heading">Footfall Sectors in Catchment Buffer</h5>
        <div className="sectors-chips-row">
          {(Object.keys(SECTOR_META) as PlaceSector[]).map((sectorKey) => {
            const count = sectorBreakdown[sectorKey] || 0;
            const meta = SECTOR_META[sectorKey];
            const Icon = meta.icon;

            return (
              <div
                key={sectorKey}
                className={`sector-chip ${count > 0 ? 'active' : 'zero'}`}
                style={{
                  borderColor: count > 0 ? `${meta.color}50` : 'var(--border-subtle)',
                  backgroundColor: count > 0 ? `${meta.color}15` : 'transparent',
                }}
              >
                <Icon size={14} color={count > 0 ? meta.color : 'var(--text-dim)'} />
                <span className="sector-chip-label" style={{ color: count > 0 ? 'var(--text-main)' : 'var(--text-dim)' }}>
                  {meta.label}
                </span>
                <span className="sector-chip-count" style={{ backgroundColor: count > 0 ? meta.color : 'rgba(255,255,255,0.08)' }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drivers & Risks Dual Column */}
      <div className="drivers-risks-grid">
        {/* Key Drivers */}
        <div className="drivers-column">
          <h6 className="column-title" style={{ color: '#6ee7b7' }}>
            <CheckCircle2 size={14} color="#10b981" />
            <span>Key Location Strengths</span>
          </h6>
          <ul className="insights-list">
            {keyDrivers.map((item, idx) => (
              <li key={idx} className="insight-item green">
                <ChevronRight size={13} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Risk Factors */}
        <div className="risks-column">
          <h6 className="column-title" style={{ color: '#fcd34d' }}>
            <AlertTriangle size={14} color="#f59e0b" />
            <span>Strategic Considerations</span>
          </h6>
          <ul className="insights-list">
            {riskFactors.length > 0 ? (
              riskFactors.map((item, idx) => (
                <li key={idx} className="insight-item yellow">
                  <ChevronRight size={13} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="insight-item green">
                <CheckCircle2 size={13} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>No major spatial drawbacks detected for this location.</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
