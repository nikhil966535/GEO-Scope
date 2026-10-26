import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Trash2,
  MapPin,
  Calendar,
  ArrowRight,
  RefreshCw,
  Search,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import {
  fetchSavedEvaluations,
  deleteSavedEvaluation,
  saveEvaluationToDb,
  SavedEvaluationRecord,
  DatabaseStatus,
} from '../services/api';
import { SiteScorecard } from '../services/poiService';
import { CityConfig, CityWard } from '../data/citiesData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeCity: CityConfig;
  selectedWard: CityWard;
  candidateCoords: { lat: number; lng: number };
  analysisRadius: number;
  selectedCategory: string;
  scorecard: SiteScorecard | null;
  dbStatus?: DatabaseStatus;
  onLoadEvaluation: (evalRecord: SavedEvaluationRecord) => void;
}

export const SavedEvaluationsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  activeCity,
  selectedWard,
  candidateCoords,
  analysisRadius,
  selectedCategory,
  scorecard,
  dbStatus,
  onLoadEvaluation,
}) => {
  const [evaluations, setEvaluations] = useState<SavedEvaluationRecord[]>([]);
  const [source, setSource] = useState<string>('Database');
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [savingCurrent, setSavingCurrent] = useState<boolean>(false);

  const loadEvaluations = async () => {
    setLoading(true);
    try {
      const res = await fetchSavedEvaluations();
      setEvaluations(res.evaluations);
      setSource(res.source);
    } catch (err) {
      console.warn('Error fetching evaluations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadEvaluations();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCurrentSite = async () => {
    setSavingCurrent(true);
    setSaveSuccessMsg(null);
    try {
      const siteName = `${selectedWard.name.split(' (')[0]} ${selectedCategory}`;
      const payload: Partial<SavedEvaluationRecord> = {
        siteName,
        cityName: activeCity.name,
        wardName: selectedWard.name,
        category: selectedCategory,
        candidateCoords,
        analysisRadius,
        overallScore: scorecard?.overallScore ?? 75,
        ratingGrade: scorecard?.ratingGrade ?? 'B',
        verdict: scorecard?.verdict ?? 'Evaluated Commercial Zone',
        summary: scorecard?.summary ?? 'Candidate site evaluated in active workspace.',
        componentScores: scorecard?.componentScores ?? {
          footfallDraw: 20,
          sectorSynergy: 18,
          competitionHealth: 15,
          transitConnectivity: 12,
          commercialDensity: 7,
        },
        sectorBreakdown: scorecard?.sectorBreakdown ?? {},
        totalAnchors: scorecard?.totalAnchors ?? 0,
        keyDrivers: scorecard?.keyDrivers ?? [],
        riskFactors: scorecard?.riskFactors ?? [],
        recommendedFormat: 'Standard commercial retail store format',
        provider: 'Geoscope Engine',
      };

      const result = await saveEvaluationToDb(payload);
      setSaveSuccessMsg(`Saved "${result.evaluation.siteName}" to ${result.source}!`);
      await loadEvaluations();
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSavingCurrent(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this saved evaluation?')) {
      const ok = await deleteSavedEvaluation(id);
      if (ok) {
        setEvaluations((prev) => prev.filter((item) => item.id !== id));
      }
    }
  };

  const filtered = evaluations.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.siteName.toLowerCase().includes(q) ||
      item.cityName.toLowerCase().includes(q) ||
      item.wardName.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Database size={20} color="#10b981" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                  MongoDB Saved Evaluations
                </h3>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: dbStatus?.connected
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(245, 158, 11, 0.2)',
                    color: dbStatus?.connected ? '#6ee7b7' : '#fcd34d',
                    border: `1px solid ${dbStatus?.connected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                  }}
                >
                  {dbStatus?.connected ? `MongoDB Atlas: ${dbStatus.dbName || 'geoscope'}` : 'In-Memory Fallback'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Persistent site suitability evaluations, MCDA scorecards, and retail feasibility dossiers.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Action Bar */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search
              size={14}
              color="var(--text-dim)"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved sites by city, ward, or category..."
              style={{
                width: '100%',
                padding: '7px 10px 7px 32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid var(--border-color)',
                color: '#ffffff',
                fontSize: '0.8rem',
              }}
            />
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handleSaveCurrentSite}
              disabled={savingCurrent}
              className="btn btn-primary"
              style={{ fontSize: '0.78rem', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} />
              {savingCurrent ? 'Saving...' : 'Bookmark Current Site'}
            </button>

            <button
              onClick={loadEvaluations}
              disabled={loading}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '7px 10px' }}
              title="Refresh evaluations list"
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>

        {saveSuccessMsg && (
          <div
            style={{
              padding: '10px 20px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#6ee7b7',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={15} color="#10b981" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Evaluations List Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 10px auto', display: 'block' }} />
              Connecting to database and retrieving saved evaluations...
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(15, 23, 42, 0.4)',
                border: '1px dashed var(--border-color)',
              }}
            >
              <Database size={32} color="var(--text-dim)" style={{ margin: '0 auto 10px auto', display: 'block' }} />
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem' }}>No Evaluations Found</h4>
              <p style={{ margin: '0 0 14px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Click "Bookmark Current Site" above to persist your active site analysis into MongoDB.
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const score = item.overallScore;
              const themeColor = score >= 85 ? '#10b981' : score >= 70 ? '#3b82f6' : '#f59e0b';

              return (
                <div
                  key={item.id}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-blue)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  {/* Left: Score Badge & Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        backgroundColor: `${themeColor}15`,
                        border: `1.5px solid ${themeColor}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: '1.25rem', fontWeight: 900, color: themeColor, lineHeight: 1 }}>
                        {item.overallScore}
                      </span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontWeight: 700, marginTop: '2px' }}>
                        GRADE {item.ratingGrade}
                      </span>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
                          {item.siteName}
                        </h4>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            color: '#93c5fd',
                          }}
                        >
                          {item.category}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color="#ef4444" />
                          {item.wardName}, {item.cityName} ({item.analysisRadius}m)
                        </span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {item.summary && (
                        <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '500px' }}>
                          {item.summary}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => {
                        onLoadEvaluation(item);
                        onClose();
                      }}
                      className="btn btn-primary"
                      style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>Load on Map</span>
                      <ArrowRight size={13} />
                    </button>

                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      style={{
                        padding: '6px 8px',
                        background: 'none',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#f87171',
                        cursor: 'pointer',
                      }}
                      title="Delete record from MongoDB"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: 'rgba(11, 17, 32, 0.7)',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.72rem',
            color: 'var(--text-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            Data Source: <strong style={{ color: '#93c5fd' }}>{source}</strong> ({evaluations.length} total records)
          </div>
          <div>
            Database: <code>{dbStatus?.message || 'Ready'}</code>
          </div>
        </div>
      </div>
    </div>
  );
};
