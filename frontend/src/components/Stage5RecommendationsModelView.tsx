import React from 'react';
import {
  Printer,
  Download,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Store,
  Target,
} from 'lucide-react';
import { AISiteRecommendation } from '../services/aiRecommendationService';
import { SiteScorecard, RetailShopPOI } from '../services/poiService';
import { CityConfig, CityWard } from '../data/citiesData';

interface Props {
  activeCity: CityConfig;
  selectedWard: CityWard;
  candidateCoords: { lat: number; lng: number };
  analysisRadius: number;
  selectedCategory: string;
  aiRecommendation: AISiteRecommendation;
  scorecard: SiteScorecard | null;
  shops: RetailShopPOI[];
  provider: string;
  onNavigateTab: (tab: string) => void;
  onOpenReportModal: () => void;
  onSelectAlternative: (alt: { name: string; lat: number; lng: number; radius: number }) => void;
}

export const Stage5RecommendationsModelView: React.FC<Props> = ({
  activeCity,
  selectedWard,
  candidateCoords,
  analysisRadius,
  selectedCategory,
  aiRecommendation,
  scorecard,
  shops,
  provider,
  onOpenReportModal,
  onSelectAlternative,
}) => {
  const score = scorecard?.overallScore ?? aiRecommendation.score;
  const grade = scorecard?.ratingGrade ?? aiRecommendation.grade;
  const radiusKm = analysisRadius >= 1000 ? `${analysisRadius / 1000} km` : `${analysisRadius} m`;

  const handleDownloadJson = () => {
    const data = {
      project: 'Geoscope - Intelligent Business Site Selection',
      stage: 'Stage 5: Operational AI Recommendation Dossier',
      timestamp: new Date().toISOString(),
      city: activeCity.fullName,
      ward: selectedWard.name,
      category: selectedCategory,
      coordinates: candidateCoords,
      analysisRadiusMeters: analysisRadius,
      provider,
      scorecard: scorecard || {
        overallScore: score,
        ratingGrade: grade,
      },
      aiRecommendation,
      underlyingPOIsCount: shops.length,
      sampleVenues: shops.slice(0, 15).map((s) => ({
        name: s.name,
        sector: s.sector,
        distanceMeters: s.distanceMeters,
        address: s.address,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Geoscope_Dossier_${activeCity.name}_${selectedCategory.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
                  backgroundColor: 'rgba(168, 85, 247, 0.15)',
                  color: '#c084fc',
                  borderColor: 'rgba(168, 85, 247, 0.35)',
                }}
              >
                STAGE 5 MODEL • EXPLAINABLE RECOMMENDATIONS & DOSSIER
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                Decision Intelligence Pipeline
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>
              Site Selection & Retail Feasibility Studio
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Synthesizing spatial POI telemetry, demographic drivers, and MCDA scoring into an actionable executive investment proposal.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleDownloadJson}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={14} />
              JSON Audit Trail
            </button>
            <button
              onClick={onOpenReportModal}
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={14} />
              Print Executive PDF
            </button>
          </div>
        </div>
      </div>

      {/* Hero Viability Index Card */}
      <div
        className="control-card"
        style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Target Location
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
              {selectedWard.name.split(' (')[0]}, {activeCity.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#93c5fd', marginTop: '2px' }}>
              <code>{candidateCoords.lat.toFixed(5)}° N, {candidateCoords.lng.toFixed(5)}° E</code> ({radiusKm})
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Category Evaluation
            </span>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>
              {selectedCategory}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {shops.length} Commercial Anchors Factored
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Geospatial Viability Score
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: score >= 75 ? '#10b981' : score >= 50 ? '#3b82f6' : '#f59e0b' }}>
                {score}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>/ 100</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  color: '#93c5fd',
                  marginLeft: '4px',
                }}
              >
                Grade {grade}
              </span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Target Demographics & Footfall
            </span>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>
              {aiRecommendation.targetDemographic}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '2px' }}>
              Footfall: <strong>{aiRecommendation.footfallIndex}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Store Format & Operations Blueprint */}
      <div className="control-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Store size={18} color="var(--accent-teal)" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
            Recommended Store Format & Physical Blueprint
          </h3>
        </div>

        <div
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Strategic Format Suggestion
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
              {aiRecommendation.recommendedFormat}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '600px' }}>
              Optimized for high-throughput pedestrian turnover, compact square footage lease rental efficiency, and rapid inventory replenishment.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ color: 'var(--text-dim)' }}>Competition Density</div>
              <strong style={{ color: '#93c5fd' }}>{aiRecommendation.competitionSaturation}</strong>
            </div>
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ color: 'var(--text-dim)' }}>Growth Potential</div>
              <strong style={{ color: '#10b981' }}>{aiRecommendation.growthPotential}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Spatial Drivers & Strategic Considerations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Key Spatial Advantages */}
        <div className="control-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <ShieldCheck size={16} color="#10b981" />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              Key Spatial Advantages
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {aiRecommendation.strengths.map((strength: string, idx: number) => (
              <div
                key={idx}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontSize: '0.8rem',
                  color: '#d1fae5',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    marginTop: '6px',
                    flexShrink: 0,
                  }}
                />
                <span>{strength}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Considerations */}
        <div className="control-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <ShieldAlert size={16} color="#f59e0b" />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              Strategic Considerations & Risk Mitigations
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {aiRecommendation.challenges.map((challenge: string, idx: number) => (
              <div
                key={idx}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  fontSize: '0.8rem',
                  color: '#fef3c7',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#f59e0b',
                    marginTop: '6px',
                    flexShrink: 0,
                  }}
                />
                <span>{challenge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* High-Potential Micro-Market Alternatives in Active City */}
      <div className="control-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={16} color="var(--accent-blue)" />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
              Comparative Micro-Market Ranking for {activeCity.name}
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Click any alternative zone to immediately inspect on interactive map
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          {aiRecommendation.alternativeHotspots.map((alt, idx: number) => (
            <div
              key={idx}
              onClick={() => onSelectAlternative({ name: alt.name, lat: alt.lat, lng: alt.lng, radius: 1000 })}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-blue)';
                e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.7)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <strong style={{ fontSize: '0.85rem', color: '#ffffff' }}>{alt.name}</strong>
                <ArrowRight size={14} color="var(--accent-blue)" />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                {alt.reason}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                <span>Score: <strong style={{ color: '#10b981' }}>{alt.score}/100</strong></span>
                <span style={{ color: '#93c5fd' }}>Fly to Zone →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
