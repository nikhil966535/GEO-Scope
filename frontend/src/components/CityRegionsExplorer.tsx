import React, { useState } from 'react';
import { CityConfig, CityWard } from '../data/citiesData';
import {
  Sparkles,
  MapPin,
  TrendingUp,
  ShoppingBag,
  Coffee,
  Building2,
  GraduationCap,
  Home,
  Compass,
  Search,
} from 'lucide-react';

interface Props {
  activeCity: CityConfig;
  selectedWardId: string;
  onSelectRegion: (ward: CityWard) => void;
}

export const CityRegionsExplorer: React.FC<Props> = ({
  activeCity,
  selectedWardId,
  onSelectRegion,
}) => {
  const [activeTag, setActiveTag] = useState<string>('all');
  const [filterQuery, setFilterQuery] = useState<string>('');

  // Filter wards by category tag and text search
  const filteredWards = activeCity.wards.filter((ward) => {
    const matchesTag = activeTag === 'all' || ward.tag === activeTag;
    const matchesQuery =
      filterQuery.trim() === '' ||
      ward.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      ward.description.toLowerCase().includes(filterQuery.toLowerCase());

    return matchesTag && matchesQuery;
  });

  const getTagIcon = (tag: string) => {
    switch (tag) {
      case 'retail':
        return <ShoppingBag size={12} />;
      case 'food':
        return <Coffee size={12} />;
      case 'corporate':
        return <Building2 size={12} />;
      case 'student':
        return <GraduationCap size={12} />;
      case 'residential':
        return <Home size={12} />;
      case 'tourism':
        return <Compass size={12} />;
      default:
        return <MapPin size={12} />;
    }
  };

  const getFootfallBadgeColor = (intensity: string) => {
    switch (intensity) {
      case 'Very High':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#fca5a5', border: 'rgba(239, 68, 68, 0.3)' };
      case 'High':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fcd34d', border: 'rgba(245, 158, 11, 0.3)' };
      case 'Growing':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#86efac', border: 'rgba(16, 185, 129, 0.3)' };
      default:
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#93c5fd', border: 'rgba(59, 130, 246, 0.3)' };
    }
  };

  return (
    <div className="control-card" style={{ padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--accent-blue)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
            Live Region & Micro-Market Suggestions for {activeCity.name}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            ({filteredWards.length} high-potential zones)
          </span>
        </div>

        {/* Live Filter Search within City */}
        <div style={{ position: 'relative', width: '220px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder={`Filter ${activeCity.name} zones...`}
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px 6px 30px',
              color: 'var(--text-main)',
              fontSize: '0.78rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Category Pills Bar */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '14px' }}>
        {[
          { key: 'all', label: 'All Regions' },
          { key: 'retail', label: 'Retail & Shopping' },
          { key: 'food', label: 'Food & Cafes' },
          { key: 'corporate', label: 'Corporate & IT' },
          { key: 'student', label: 'Student Demographics' },
          { key: 'residential', label: 'Prime Residential' },
          { key: 'tourism', label: 'Tourism & Footfall' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTag(tab.key)}
            className={`region-tab-btn ${activeTag === tab.key ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid of Dynamic Regions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '12px',
        maxHeight: '340px',
        overflowY: 'auto',
        paddingRight: '4px',
      }}>
        {filteredWards.map((ward) => {
          const isSelected = ward.id === selectedWardId;
          const badgeStyle = getFootfallBadgeColor(ward.footfallIntensity);

          return (
            <div
              key={ward.id}
              onClick={() => onSelectRegion(ward)}
              className={`region-card ${isSelected ? 'active' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <strong style={{ fontSize: '0.85rem', color: isSelected ? '#93c5fd' : 'var(--text-main)' }}>
                  {ward.name.split(' (')[0]}
                </strong>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: badgeStyle.bg,
                    color: badgeStyle.text,
                    border: `1px solid ${badgeStyle.border}`,
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <TrendingUp size={10} />
                  {ward.footfallIntensity} Footfall
                </span>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.35', margin: '4px 0 6px' }}>
                {ward.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-dim)' }}>
                  {getTagIcon(ward.tag)}
                  <span>{ward.category.replace('_', ' ').toUpperCase()}</span>
                </span>
                <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
                  📍 Rec. Radius: {ward.recommendedRadius >= 1000 ? `${ward.recommendedRadius / 1000} km` : `${ward.recommendedRadius} m`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
