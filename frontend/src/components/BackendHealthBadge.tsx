import React from 'react';
import { HealthResponse } from '../services/api';
import { RefreshCw, Server, AlertTriangle } from 'lucide-react';

interface Props {
  health: HealthResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const BackendHealthBadge: React.FC<Props> = ({
  health,
  loading,
  error,
  onRefresh,
}) => {
  if (loading) {
    return (
      <div className="status-pill loading">
        <span className="pulse-dot"></span>
        <span>Connecting to Backend...</span>
      </div>
    );
  }

  if (error || !health) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="status-pill error" title={error || 'Unable to connect to backend'}>
          <AlertTriangle size={14} />
          <span>Backend Offline</span>
        </div>
        <button
          onClick={onRefresh}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
          }}
          title="Retry backend connection"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div className="status-pill healthy" title={`Backend alive at ${health.timestamp}`}>
        <span className="pulse-dot"></span>
        <Server size={14} />
        <span>Backend API Online ({health.version})</span>
      </div>
      <button
        onClick={onRefresh}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '4px',
        }}
        title="Check health again"
      >
        <RefreshCw size={14} />
      </button>
    </div>
  );
};
