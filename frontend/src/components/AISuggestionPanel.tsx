import React, { useState } from 'react';
import { AISiteRecommendation } from '../services/aiRecommendationService';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Users,
  Footprints,
  Store,
  TrendingUp,
  MapPin,
  Compass,
} from 'lucide-react';

interface Props {
  recommendation: AISiteRecommendation;
  cityName: string;
  category: string;
  wardName: string;
  onSelectAlternative: (lat: number, lng: number, name: string) => void;
}

export const AISuggestionPanel: React.FC<Props> = ({
  recommendation,
  cityName,
  category,
  wardName,
  onSelectAlternative,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'alternatives'>('overview');

  const getScoreColor = (score: number) => {
    if (score >= 90) return { stroke: '#10b981', text: '#34d399', bg: 'rgba(16, 185, 129, 0.12)' };
    if (score >= 80) return { stroke: '#3b82f6', text: '#60a5fa', bg: 'rgba(59, 130, 246, 0.12)' };
    return { stroke: '#f59e0b', text: '#fbbf24', bg: 'rgba(245, 158, 11, 0.12)' };
  };

  const scoreTheme = getScoreColor(recommendation.score);

  return (
    <div className="ai-card">
      {/* Top Banner */}
      <div className="ai-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="ai-icon-badge">
            <Sparkles size={16} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              AI Geospatial Site Evaluation
            </h4>
            <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', margin: 0 }}>
              Tailored for <strong>{category}</strong> in <strong>{wardName.split(' (')[0]}, {cityName}</strong>
            </p>
          </div>
        </div>

        {/* Score Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: scoreTheme.bg,
            border: `1px solid ${scoreTheme.stroke}`,
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: scoreTheme.text, lineHeight: 1 }}>
              {recommendation.score}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>/100</span>
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: scoreTheme.text, padding: '2px 4px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '3px' }}>
            {recommendation.grade}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="ai-tabs-row">
        <button
          onClick={() => setActiveTab('overview')}
          className={`ai-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <TrendingUp size={13} />
          <span>Strategic Analysis</span>
        </button>
        <button
          onClick={() => setActiveTab('alternatives')}
          className={`ai-tab-btn ${activeTab === 'alternatives' ? 'active' : ''}`}
        >
          <Compass size={13} />
          <span>Top {cityName} Alternatives ({recommendation.alternativeHotspots.length})</span>
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Verdict Banner */}
          <div className="ai-verdict-box">
            <span className="ai-verdict-tag">{recommendation.verdict}</span>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
              {recommendation.summary}
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="ai-metrics-mini-grid">
            <div className="ai-metric-mini">
              <span className="mini-label"><Users size={12} /> Target Audience</span>
              <strong className="mini-val">{recommendation.targetDemographic}</strong>
            </div>
            <div className="ai-metric-mini">
              <span className="mini-label"><Footprints size={12} /> Daily Footfall</span>
              <strong className="mini-val">{recommendation.footfallIndex}</strong>
            </div>
          </div>

          {/* Strengths */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--status-green)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Key Spatial Advantages
            </span>
            {recommendation.strengths.map((str, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={13} color="var(--status-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{str}</span>
              </div>
            ))}
          </div>

          {/* Risk & Recommendation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--status-yellow)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Strategic Consideration
            </span>
            {recommendation.challenges.map((chl, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                <AlertTriangle size={13} color="var(--status-yellow)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{chl}</span>
              </div>
            ))}
          </div>

          {/* Recommended Store Format */}
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem' }}>
            <Store size={14} color="var(--accent-teal)" style={{ flexShrink: 0 }} />
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Recommended Format: </span>
              <strong style={{ color: 'var(--text-main)' }}>{recommendation.recommendedFormat}</strong>
            </div>
          </div>
        </div>
      ) : (
        /* Top Alternatives Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            AI-ranked candidate alternatives in <strong>{cityName}</strong> for {category}:
          </p>
          {recommendation.alternativeHotspots.map((alt, i) => (
            <div
              key={i}
              onClick={() => onSelectAlternative(alt.lat, alt.lng, alt.name)}
              className="ai-alt-row"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="alt-rank">#{i + 1}</span>
                <div>
                  <strong style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'block' }}>
                    {alt.name}
                  </strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{alt.reason}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--status-green)' }}>
                  {alt.score}
                </span>
                <button
                  className="alt-pin-btn"
                  title="Fly and pin on map"
                >
                  <MapPin size={11} />
                  <span>Pin</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
