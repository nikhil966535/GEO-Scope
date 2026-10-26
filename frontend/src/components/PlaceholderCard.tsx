import React from 'react';
import { LucideIcon, Lock, CheckCircle2, ArrowRight } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  stageBadge: string;
  description: string;
  upcomingFeatures: string[];
  isLive?: boolean;
  statusBadgeText?: string;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
}

export const PlaceholderCard: React.FC<Props> = ({
  icon: Icon,
  title,
  stageBadge,
  description,
  upcomingFeatures,
  isLive = false,
  statusBadgeText,
  actionButton,
}) => {
  return (
    <div
      className="placeholder-card"
      style={{
        borderStyle: isLive ? 'solid' : 'dashed',
        borderColor: isLive ? 'rgba(59, 130, 246, 0.4)' : undefined,
        background: isLive
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.75), rgba(15, 23, 42, 0.85))'
          : undefined,
      }}
    >
      <div className="placeholder-card-header">
        <div
          className="card-icon-wrap"
          style={{
            backgroundColor: isLive ? 'rgba(59, 130, 246, 0.18)' : undefined,
            color: isLive ? '#60a5fa' : undefined,
          }}
        >
          <Icon size={20} />
        </div>
        <span
          className="placeholder-badge"
          style={{
            backgroundColor: isLive ? 'var(--status-green-bg)' : undefined,
            color: isLive ? 'var(--status-green)' : undefined,
            borderColor: isLive ? 'rgba(16, 185, 129, 0.35)' : undefined,
          }}
        >
          {stageBadge}
        </span>
      </div>

      <h4 style={{ color: isLive ? '#ffffff' : 'var(--text-main)' }}>{title}</h4>
      <p>{description}</p>

      <div
        className="mock-content-box"
        style={{
          borderColor: isLive ? 'rgba(16, 185, 129, 0.25)' : undefined,
          backgroundColor: isLive ? 'rgba(11, 17, 32, 0.65)' : undefined,
        }}
      >
        <div className="mock-notice" style={{ fontStyle: isLive ? 'normal' : 'italic' }}>
          {isLive ? (
            <>
              <CheckCircle2 size={13} color="var(--status-green)" />
              <span style={{ color: '#34d399', fontWeight: 600 }}>
                {statusBadgeText || 'Live Engine Operational & Connected to Map'}
              </span>
            </>
          ) : (
            <>
              <Lock size={12} />
              <span>Placeholder Module — Not yet connected to live analysis</span>
            </>
          )}
        </div>

        <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {upcomingFeatures.map((item, idx) => (
            <div
              key={idx}
              style={{
                fontSize: '0.78rem',
                color: isLive ? 'var(--text-main)' : 'var(--text-dim)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isLive ? (
                <CheckCircle2 size={13} color="#10b981" style={{ flexShrink: 0 }} />
              ) : (
                <div
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-blue)',
                    flexShrink: 0,
                  }}
                />
              )}
              <span>{item}</span>
            </div>
          ))}
        </div>

        {actionButton && (
          <button
            onClick={actionButton.onClick}
            style={{
              marginTop: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
            }}
          >
            {actionButton.icon ? (
              <actionButton.icon size={15} />
            ) : (
              <ArrowRight size={15} />
            )}
            <span>{actionButton.label}</span>
          </button>
        )}
      </div>
    </div>
  );
};
