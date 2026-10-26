import React, { useState } from 'react';
import {
  Database,
  Search,
  ExternalLink,
  ShoppingBag,
  UtensilsCrossed,
  Bus,
  GraduationCap,
  Hotel,
  HeartPulse,
  Landmark,
  Building2,
  Sliders,
  ArrowRight,
  Compass,
  LucideIcon,
} from 'lucide-react';
import { RetailShopPOI, PlaceSector, SiteScorecard } from '../services/poiService';
import { CityConfig, CityWard } from '../data/citiesData';

interface Props {
  activeCity: CityConfig;
  selectedWard: CityWard;
  candidateCoords: { lat: number; lng: number };
  analysisRadius: number;
  onRadiusChange: (radius: number) => void;
  shops: RetailShopPOI[];
  scorecard: SiteScorecard | null;
  provider: string;
  loading: boolean;
  onNavigateTab: (tab: string) => void;
  onSelectShop?: (shop: RetailShopPOI) => void;
}

const SECTOR_META: Record<PlaceSector, { label: string; icon: LucideIcon; color: string }> = {
  education: { label: 'Education & Campus', icon: GraduationCap, color: '#3b82f6' },
  hospitality: { label: 'Hotels & Lodging', icon: Hotel, color: '#f59e0b' },
  transit: { label: 'Transit & Mobility', icon: Bus, color: '#a855f7' },
  retail: { label: 'Retail & Commerce', icon: ShoppingBag, color: '#10b981' },
  food: { label: 'Dining & Cafes', icon: UtensilsCrossed, color: '#ef4444' },
  healthcare: { label: 'Healthcare & Pharma', icon: HeartPulse, color: '#f43f5e' },
  banking: { label: 'Banking & Finance', icon: Landmark, color: '#0d9488' },
  commercial: { label: 'Offices & IT Parks', icon: Building2, color: '#6366f1' },
};

export const Stage3PoiModelView: React.FC<Props> = ({
  activeCity,
  selectedWard,
  candidateCoords,
  analysisRadius,
  onRadiusChange,
  shops,
  scorecard,
  provider,
  loading,
  onNavigateTab,
  onSelectShop,
}) => {
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredShops = shops.filter((shop) => {
    const matchesSector = sectorFilter === 'all' || shop.sector === sectorFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSector && matchesSearch;
  });

  const sectorCounts = scorecard?.sectorBreakdown || {
    education: 0,
    hospitality: 0,
    healthcare: 0,
    retail: 0,
    food: 0,
    transit: 0,
    banking: 0,
    commercial: 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="control-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="placeholder-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--status-green)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                STAGE 3 MODEL • LIVE OPERATIONAL
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                Provider: <strong>{provider}</strong>
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>
              Multi-Sector POI & Overpass Data Explorer
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Physical establishment extraction across 8 core urban sectors within strict geodesic radius around{' '}
              <code style={{ color: '#93c5fd' }}>{candidateCoords.lat.toFixed(5)}° N, {candidateCoords.lng.toFixed(5)}° E</code> in{' '}
              <strong>{selectedWard.name.split(' (')[0]}, {activeCity.name}</strong>.
            </p>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => onNavigateTab('map')}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Compass size={14} />
              <span>View On Map Canvas</span>
            </button>
            <button
              onClick={() => onNavigateTab('scoring')}
              className="btn-primary"
              style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Run Stage 4 Scoring</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Catchment Radius Bar */}
        <div style={{
          marginTop: '16px',
          paddingTop: '14px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={15} color="var(--accent-blue)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              CATCHMENT BUFFER RADIUS:
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[300, 500, 1000, 2000, 3000].map((r) => (
              <button
                key={r}
                onClick={() => onRadiusChange(r)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid',
                  cursor: 'pointer',
                  backgroundColor: analysisRadius === r ? 'rgba(59, 130, 246, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                  borderColor: analysisRadius === r ? 'var(--accent-blue)' : 'var(--border-color)',
                  color: analysisRadius === r ? '#93c5fd' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                {r >= 1000 ? `${r / 1000} km` : `${r} m`}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Captured: <strong style={{ color: '#34d399' }}>{shops.length} Venues</strong> strictly within {analysisRadius >= 1000 ? `${analysisRadius / 1000} km` : `${analysisRadius} m`}
          </div>
        </div>
      </div>

      {/* Sector Distribution Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '10px'
      }}>
        {(Object.keys(SECTOR_META) as PlaceSector[]).map((sector) => {
          const meta = SECTOR_META[sector];
          const Icon = meta.icon;
          const count = sectorCounts[sector] || 0;
          const pct = shops.length > 0 ? Math.round((count / shops.length) * 100) : 0;
          const isActive = sectorFilter === sector;

          return (
            <div
              key={sector}
              onClick={() => setSectorFilter(sectorFilter === sector ? 'all' : sector)}
              style={{
                backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                border: `1px solid ${isActive ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '4px', backgroundColor: `${meta.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={15} color={meta.color} />
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: count > 0 ? '#ffffff' : 'var(--text-dim)' }}>
                  {count}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                {meta.label.split(' & ')[0]}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                {pct}% of buffer
              </div>
            </div>
          );
        })}
      </div>

      {/* POI Search & Table Card */}
      <div className="control-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} color="var(--accent-teal)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
              Physical POI Registry ({filteredShops.length} of {shops.length} Venues)
            </h3>
            {sectorFilter !== 'all' && (
              <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>
                Filter: {sectorFilter}
              </span>
            )}
          </div>

          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search establishments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="shops-search-input"
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            Loading multi-sector establishments within {analysisRadius}m...
          </div>
        ) : filteredShops.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No establishments matched your query within {analysisRadius}m of this pin point.
          </div>
        ) : (
          <div style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <table className="dossier-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Establishment Name</th>
                  <th>Sector</th>
                  <th>Category</th>
                  <th>Geodesic Distance</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredShops.map((shop, idx) => {
                  const meta = SECTOR_META[shop.sector] || { icon: ShoppingBag, color: '#10b981' };
                  const Icon = meta.icon;

                  return (
                    <tr key={shop.id} style={{ cursor: 'pointer' }} onClick={() => onSelectShop?.(shop)}>
                      <td>{idx + 1}</td>
                      <td>
                        <strong style={{ color: 'var(--text-main)' }}>{shop.name}</strong>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{shop.address}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Icon size={13} color={meta.color} />
                          <span style={{ textTransform: 'capitalize', fontSize: '0.72rem' }}>{shop.sector}</span>
                        </div>
                      </td>
                      <td>{shop.categoryLabel}</td>
                      <td>
                        <strong style={{ color: shop.distanceMeters <= 200 ? '#34d399' : '#93c5fd' }}>
                          {shop.distanceMeters} m
                        </strong>
                      </td>
                      <td>
                        ★ {shop.rating.toFixed(1)}{' '}
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>({shop.reviewsCount})</span>
                      </td>
                      <td>
                        <span style={{ color: shop.isOpenNow ? '#34d399' : '#f87171', fontSize: '0.72rem' }}>
                          {shop.isOpenNow ? 'Open Now' : 'Closed'}
                        </span>
                      </td>
                      <td>
                        {shop.googleMapsUri && (
                          <a
                            href={shop.googleMapsUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-blue)', fontSize: '0.72rem' }}
                          >
                            <span>Maps</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
