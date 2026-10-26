import React from 'react';
import { BackendHealthBadge } from './BackendHealthBadge';
import { HealthResponse } from '../services/api';
import { Layers, Globe } from 'lucide-react';

interface Props {
  health: HealthResponse | null;
  loading: boolean;
  error: string | null;
  onRefreshHealth: () => void;
  onOpenGoogleConfig?: () => void;
}

export const Header: React.FC<Props> = ({
  health,
  loading,
  error,
  onRefreshHealth,
  onOpenGoogleConfig,
}) => {
  const hasGoogleKey = Boolean(localStorage.getItem('GEOSCOPE_GOOGLE_MAPS_API_KEY'));

  return (
    <header className="top-header">
      <div className="header-title-block">
        <h2>Geoscope Dashboard</h2>
        <p>B.Tech Final Year Project — Spatial Intelligence & Decision Support</p>
      </div>

      <div className="header-actions">
        {/* Google Maps Platform Integration Status Button */}
        {onOpenGoogleConfig && (
          <button
            onClick={onOpenGoogleConfig}
            className="tool-btn"
            style={{
              borderColor: hasGoogleKey ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.3)',
              backgroundColor: hasGoogleKey ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.08)',
            }}
            title="Configure Google Maps Platform & Places API"
          >
            <Globe size={14} color={hasGoogleKey ? 'var(--status-green)' : 'var(--accent-blue)'} />
            <span>{hasGoogleKey ? 'Google Maps: Connected' : 'Google Maps Settings'}</span>
          </button>
        )}

        <BackendHealthBadge
          health={health}
          loading={loading}
          error={error}
          onRefresh={onRefreshHealth}
        />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <Layers size={14} color="var(--accent-teal)" />
          <span>Stage 2: Geospatial Engine</span>
        </div>
      </div>
    </header>
  );
};
