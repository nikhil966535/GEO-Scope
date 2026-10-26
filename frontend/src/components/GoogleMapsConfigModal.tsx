import React, { useState } from 'react';
import {
  X,
  Key,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: (apiKey: string) => void;
}

export const GoogleMapsConfigModal: React.FC<Props> = ({ isOpen, onClose, onKeySaved }) => {
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('GEOSCOPE_GOOGLE_MAPS_API_KEY') || '';
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter an API key first.' });
      return;
    }
    setTestingConnection(true);
    setTestResult(null);

    try {
      const res = await fetch(`/api/places/nearby?lat=16.71517&lng=74.25183&radius=1000&apiKey=${encodeURIComponent(apiKey.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          if (data.provider === 'Google Places Live') {
            setTestResult({
              success: true,
              message: `Success! Connected to Google Places API (Found ${data.totalFound} live venues in Kolhapur).`,
            });
          } else {
            setTestResult({
              success: true,
              message: `API Key accepted. Currently receiving ${data.provider} fallback.`,
            });
          }
        } else {
          setTestResult({ success: false, message: data.message || 'Could not verify API Key.' });
        }
      } else {
        setTestResult({ success: false, message: `Server returned HTTP ${res.status}.` });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setTestResult({ success: false, message });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (trimmed) {
      localStorage.setItem('GEOSCOPE_GOOGLE_MAPS_API_KEY', trimmed);
    } else {
      localStorage.removeItem('GEOSCOPE_GOOGLE_MAPS_API_KEY');
    }
    if (onKeySaved) {
      onKeySaved(trimmed);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    localStorage.removeItem('GEOSCOPE_GOOGLE_MAPS_API_KEY');
    setApiKey('');
    setTestResult(null);
    if (onKeySaved) {
      onKeySaved('');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="google-icon-box">
              <Layers size={18} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Google Maps Platform & Places API Integration
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Enterprise geospatial data provider settings
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '16px 0' }}>
          {/* Status Box */}
          <div style={{
            backgroundColor: apiKey ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
            border: `1px solid ${apiKey ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color={apiKey ? 'var(--status-green)' : 'var(--accent-blue)'} />
              <div>
                <strong style={{ fontSize: '0.825rem', color: apiKey ? 'var(--status-green)' : '#93c5fd' }}>
                  {apiKey ? 'Google Maps Platform Key Configured' : 'OpenStreetMap Baseline Active (Free)'}
                </strong>
                <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', margin: 0 }}>
                  {apiKey
                    ? 'Google Places API & High-Res Google Satellite enabled.'
                    : 'Currently using OpenStreetMap Overpass & CartoDB Satellite (zero API keys required).'}
                </p>
              </div>
            </div>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: apiKey ? 'var(--status-green-bg)' : 'rgba(59, 130, 246, 0.2)',
              color: apiKey ? 'var(--status-green)' : '#93c5fd',
            }}>
              {apiKey ? 'ACTIVE' : 'DEFAULT'}
            </span>
          </div>

          {/* Form Group */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={14} /> Google Maps API Key
              </span>
              <a
                href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_git_agentskills_v1"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--accent-teal)',
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>⚡ Get Free Maps Demo Key (Zero Billing) ↗</span>
              </a>
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="password"
                placeholder="AIzaSy..."
                className="form-input"
                style={{ flex: 1 }}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestResult(null);
                }}
              />
              <button
                type="button"
                onClick={handleTestKey}
                disabled={testingConnection || !apiKey.trim()}
                className="tool-btn"
                style={{
                  padding: '0 12px',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  borderColor: 'var(--accent-blue)',
                  color: '#93c5fd',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              >
                {testingConnection ? 'Testing...' : 'Test Key'}
              </button>
            </div>

            {testResult && (
              <div style={{
                marginTop: '6px',
                padding: '6px 10px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                backgroundColor: testResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: testResult.success ? '#6ee7b7' : '#fca5a5',
                border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}>
                {testResult.message}
              </div>
            )}

            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
              Your key is saved locally in your browser storage and is never checked into git or public source code.
            </span>
          </div>

          {/* Quickstart Guide Box */}
          <div style={{
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}>
            <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
              How to get a Free Google Maps Demo Key in 30 Seconds:
            </strong>
            <ol style={{ margin: '0 0 0 16px', padding: 0 }}>
              <li>Open <a href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_git_agentskills_v1" target="_blank" rel="noopener noreferrer" style={{ color: '#93c5fd' }}>mapsplatform.google.com/maps-demo-key</a></li>
              <li>Sign in with your personal Google account (no credit card or billing project required).</li>
              <li>Accept the Maps Demo terms and click <strong>Reveal Demo Key</strong>.</li>
              <li>Paste the key into the input above and click <strong>Save Configuration</strong>.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {apiKey && (
            <button onClick={handleClear} className="tool-btn" style={{ color: 'var(--status-red)' }}>
              Clear Key
            </button>
          )}
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button onClick={onClose} className="tool-btn">
              Cancel
            </button>
            <button onClick={handleSave} className="btn-primary" style={{ height: '36px', padding: '0 16px' }}>
              {savedSuccess ? (
                <>
                  <CheckCircle2 size={14} color="#ffffff" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
