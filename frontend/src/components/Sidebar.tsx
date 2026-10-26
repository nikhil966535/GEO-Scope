import React from 'react';
import {
  Compass,
  MapPin,
  Database,
  BarChart3,
  Lightbulb,
  Settings,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  activeTab?: string;
  onTabSelect?: (tab: string) => void;
  activeCityName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab = 'map',
  onTabSelect,
  activeCityName = 'Kolhapur',
}) => {
  const handleNavClick = (e: React.MouseEvent, tab: string) => {
    e.preventDefault();
    if (onTabSelect) {
      onTabSelect(tab);
    }
    window.location.hash = tab;
  };

  const isTabActive = (tab: string) => {
    if (tab === 'map') {
      return activeTab === 'map' || activeTab === 'dashboard' || !activeTab;
    }
    return activeTab === tab;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-badge">
          <Compass size={22} strokeWidth={2.2} />
        </div>
        <div className="logo-text">
          <h1>Geoscope</h1>
          <p>Intelligent Site Selection</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Navigation & Models</div>

        <a
          href="#map"
          onClick={(e) => handleNavClick(e, 'map')}
          className={`nav-item ${isTabActive('map') ? 'active' : ''}`}
        >
          <MapPin size={18} />
          <span>Interactive Map</span>
          <span
            className="tag"
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              color: '#93c5fd',
            }}
          >
            Stage 2
          </span>
        </a>

        <a
          href="#poi-data"
          onClick={(e) => handleNavClick(e, 'poi-data')}
          className={`nav-item ${isTabActive('poi-data') ? 'active' : ''}`}
        >
          <Database size={18} />
          <span>OSM / Overpass POIs</span>
          <span
            className="tag"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              color: '#6ee7b7',
            }}
          >
            Stage 3
          </span>
        </a>

        <a
          href="#scoring"
          onClick={(e) => handleNavClick(e, 'scoring')}
          className={`nav-item ${isTabActive('scoring') ? 'active' : ''}`}
        >
          <BarChart3 size={18} />
          <span>Spatial Scoring Engine</span>
          <span
            className="tag"
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              color: '#93c5fd',
            }}
          >
            Stage 4
          </span>
        </a>

        <a
          href="#recommendations"
          onClick={(e) => handleNavClick(e, 'recommendations')}
          className={`nav-item ${isTabActive('recommendations') ? 'active' : ''}`}
        >
          <Lightbulb size={18} />
          <span>AI Recommendations</span>
          <span
            className="tag"
            style={{
              backgroundColor: 'rgba(168, 85, 247, 0.2)',
              color: '#d8b4fe',
            }}
          >
            Stage 5
          </span>
        </a>

        <div className="nav-section-title" style={{ marginTop: '16px' }}>
          System
        </div>

        <a
          href="#settings"
          onClick={(e) => handleNavClick(e, 'settings')}
          className={`nav-item ${isTabActive('settings') ? 'active' : ''}`}
        >
          <Settings size={18} />
          <span>Configuration</span>
        </a>
      </nav>

      <div className="sidebar-footer">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          <ShieldCheck size={16} color="var(--accent-blue)" />
          <span>
            System: <strong>Stages 1–5 Live</strong>
          </span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
          Active City: <strong>{activeCityName}</strong>
        </div>
      </div>
    </aside>
  );
};
