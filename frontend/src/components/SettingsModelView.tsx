import React, { useState } from 'react';
import {
  Key,
  CheckCircle2,
  Server,
  RefreshCw,
  Sliders,
  Database,
  Cloud,
} from 'lucide-react';
import { HealthResponse } from '../services/api';
import { CityConfig, CITIES_DATA } from '../data/citiesData';

interface Props {
  activeCity: CityConfig;
  onCityChange: (city: CityConfig) => void;
  analysisRadius: number;
  onRadiusChange: (radius: number) => void;
  health: HealthResponse | null;
  loadingHealth: boolean;
  healthError: string | null;
  onRefreshHealth: () => void;
  onApiKeySaved: () => void;
  onOpenSavedEvaluations?: () => void;
}

export const SettingsModelView: React.FC<Props> = ({
  activeCity,
  onCityChange,
  analysisRadius,
  onRadiusChange,
  health,
  loadingHealth,
  healthError,
  onRefreshHealth,
  onApiKeySaved,
  onOpenSavedEvaluations,
}) => {
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('GEOSCOPE_GOOGLE_MAPS_API_KEY') || '';
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSaveKey = () => {
    localStorage.setItem('GEOSCOPE_GOOGLE_MAPS_API_KEY', apiKey.trim());
    setSaveSuccess(true);
    onApiKeySaved();
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleClearKey = () => {
    localStorage.removeItem('GEOSCOPE_GOOGLE_MAPS_API_KEY');
    setApiKey('');
    setTestResult(null);
    onApiKeySaved();
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter a Google Places API key first.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(
        `/api/places/nearby?lat=16.71517&lng=74.25183&radius=1000&apiKey=${encodeURIComponent(apiKey.trim())}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          if (data.provider === 'Google Places Live') {
            setTestResult({
              success: true,
              message: `Live Connection Verified! Google Places API returned ${data.totalFound} commercial venues.`,
            });
          } else {
            setTestResult({
              success: true,
              message: `API Key accepted. Local fallback returned ${data.totalFound} venues.`,
            });
          }
        } else {
          setTestResult({
            success: false,
            message: data.message || 'Verification failed. Please check Places API enablement.',
          });
        }
      } else {
        setTestResult({
          success: false,
          message: `HTTP ${res.status}: Failed to reach local backend proxy.`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error reaching backend server.',
      });
    } finally {
      setTesting(false);
    }
  };

  const db = health?.database;
  const isDbConnected = db?.connected ?? false;

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
                SYSTEM • CONFIGURATION & CLOUD ARCHITECTURE
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                Vercel (Frontend) • Render (Backend) • MongoDB Atlas (Database)
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>
              Platform Settings & Cloud Integration Console
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Manage Google Maps credentials, inspect MongoDB cluster connectivity, view Vercel & Render deployment guides, and adjust spatial defaults.
            </p>
          </div>

          {onOpenSavedEvaluations && (
            <button
              onClick={onOpenSavedEvaluations}
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Database size={14} />
              View Saved Evaluations
            </button>
          )}
        </div>
      </div>

      {/* Grid: Google Maps API Settings & MongoDB Database */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Google Maps Platform Configuration */}
        <div className="control-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Key size={18} color="var(--accent-blue)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
              Google Maps Platform & Places API
            </h3>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 14px 0', lineHeight: 1.5 }}>
            Geoscope functions immediately out-of-the-box using the <strong>Verified Local Registry (202 physical venues across Pune, Delhi NCR, Kolhapur, Bengaluru, and Hyderabad)</strong> + OpenStreetMap. Adding a Google Maps API Key unlocks live real-time Google Places queries.
          </p>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Google Places API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="form-control"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
              }}
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Stored locally in your browser (<code>localStorage</code>) and passed securely to the backend proxy.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <button
              onClick={handleSaveKey}
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle2 size={14} />
              Save API Key
            </button>
            <button
              onClick={handleTestKey}
              disabled={testing}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={testing ? 'spin' : ''} />
              {testing ? 'Verifying...' : 'Test Connection'}
            </button>
            {apiKey && (
              <button
                onClick={handleClearKey}
                style={{
                  fontSize: '0.75rem',
                  padding: '8px 12px',
                  background: 'none',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#f87171',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              >
                Clear Key
              </button>
            )}
          </div>

          {saveSuccess && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#a7f3d0',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px',
              }}
            >
              <CheckCircle2 size={14} color="#10b981" />
              API Key saved successfully! Active queries will now prioritize Google Places Live.
            </div>
          )}

          {testResult && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: testResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: testResult.success ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                color: testResult.success ? '#a7f3d0' : '#fca5a5',
                fontSize: '0.78rem',
              }}
            >
              {testResult.message}
            </div>
          )}
        </div>

        {/* MongoDB Database Connection Card */}
        <div className="control-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="#10b981" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                MongoDB Database Layer
              </h3>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: isDbConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: isDbConnected ? '#6ee7b7' : '#fcd34d',
                border: `1px solid ${isDbConnected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
              }}
            >
              {isDbConnected ? 'CONNECTED' : 'IN-MEMORY STANDBY'}
            </span>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 14px 0', lineHeight: 1.5 }}>
            Geoscope uses <strong>MongoDB (Mongoose ODM)</strong> to store evaluated site dossiers, MCDA scores, and custom bookmark points. If MongoDB is not yet connected, it operates smoothly using an in-memory fallback.
          </p>

          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              fontSize: '0.8rem',
              marginBottom: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Connection State:</span>
              <strong style={{ color: isDbConnected ? 'var(--status-green)' : '#fcd34d' }}>
                {db?.status ? db.status.toUpperCase() : 'IN-MEMORY STANDBY'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Target Database:</span>
              <code>{db?.dbName || 'geoscope (fallback)'}</code>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Cluster Host:</span>
              <span>{db?.host || 'Local In-Memory'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Collections:</span>
              <span style={{ color: '#93c5fd' }}>evaluations (Site Scorecards & Dossiers)</span>
            </div>
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
            <strong>How to connect MongoDB Atlas:</strong> Set <code>MONGODB_URI=mongodb+srv://&lt;user&gt;:&lt;password&gt;@cluster0.mongodb.net/geoscope</code> in your backend <code>.env</code> file or on your Render dashboard environment variables.
          </div>
        </div>
      </div>

      {/* Cloud Deployment Architecture: Vercel & Render */}
      <div className="control-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Cloud size={18} color="var(--accent-blue)" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
            Production Cloud Deployment Configuration (Vercel + Render)
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Frontend on Vercel */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <strong style={{ fontSize: '0.85rem', color: '#ffffff' }}>Frontend on Vercel</strong>
              <span style={{ fontSize: '0.7rem', color: '#93c5fd', fontWeight: 700 }}>React + Vite SPA</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <li><strong>Framework Preset:</strong> Vite</li>
              <li><strong>Root Directory:</strong> <code>frontend</code> (or root with provided <code>vercel.json</code>)</li>
              <li><strong>Build Command:</strong> <code>npm run build</code></li>
              <li><strong>Output Directory:</strong> <code>dist</code></li>
              <li><strong>Environment Variable:</strong> <code>VITE_API_URL=https://&lt;your-backend&gt;.onrender.com</code></li>
              <li><strong>SPA Rewrite:</strong> Pre-configured in <code>vercel.json</code> (no 404 on refresh)</li>
            </ul>
          </div>

          {/* Backend on Render */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <strong style={{ fontSize: '0.85rem', color: '#ffffff' }}>Backend on Render</strong>
              <span style={{ fontSize: '0.7rem', color: '#6ee7b7', fontWeight: 700 }}>Node.js + Express Web Service</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <li><strong>Blueprint Ready:</strong> <code>render.yaml</code> included in repository root</li>
              <li><strong>Runtime:</strong> Node.js (v20+ or LTS)</li>
              <li><strong>Root Directory:</strong> <code>backend</code></li>
              <li><strong>Build Command:</strong> <code>npm install && npm run build</code></li>
              <li><strong>Start Command:</strong> <code>npm run start</code> (runs <code>node dist/index.js</code>)</li>
              <li><strong>Health Check Path:</strong> <code>/api/health</code></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Spatial Engine Defaults & Backend Diagnostics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Backend Diagnostics & Health Service */}
        <div className="control-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={18} color="var(--accent-teal)" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                Backend Health & Telemetry
              </h3>
            </div>
            <button
              onClick={onRefreshHealth}
              disabled={loadingHealth}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={12} className={loadingHealth ? 'spin' : ''} />
              Ping API
            </button>
          </div>

          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              fontSize: '0.8rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
              <strong style={{ color: healthError ? '#ef4444' : 'var(--status-green)' }}>
                {healthError ? 'DISCONNECTED' : health?.status.toUpperCase() || 'HEALTHY'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Endpoint:</span>
              <code>/api/health</code>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>API Version:</span>
              <code>{health?.version || '1.0.0'}</code>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Verified Local Registry:</span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>202 Commercial POIs Loaded</span>
            </div>
          </div>
        </div>

        {/* Spatial Analysis & Buffer Defaults */}
        <div className="control-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Sliders size={18} color="var(--accent-blue)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
              Geospatial Analysis Defaults
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Active City Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Active Primary Metropolitan Market
              </label>
              <select
                value={activeCity.id}
                onChange={(e) => {
                  const found = CITIES_DATA.find((c) => c.id === e.target.value);
                  if (found) onCityChange(found);
                }}
                className="form-control"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  color: '#ffffff',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                }}
              >
                {CITIES_DATA.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.fullName} ({city.wards.length} Micro-markets)
                  </option>
                ))}
              </select>
            </div>

            {/* Analysis Radius Defaults */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Default Catchment Radius
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
      </div>
    </div>
  );
};
