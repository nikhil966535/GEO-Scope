import React, { useState, useMemo } from 'react';
import { RetailShopPOI } from '../services/poiService';
import {
  ShoppingBag,
  Coffee,
  UtensilsCrossed,
  ShoppingCart,
  Shirt,
  Pill,
  Smartphone,
  Landmark,
  Star,
  MapPin,
  Search,
  ExternalLink,
  Navigation,
  CheckCircle2,
  AlertCircle,
  LucideIcon,
  GraduationCap,
  Hotel,
  Bus,
  HeartPulse,
} from 'lucide-react';

interface NearbyShopsListProps {
  shops: RetailShopPOI[];
  loading?: boolean;
  analysisRadius: number;
  cityName: string;
  wardName: string;
  provider?: string;
  onSelectShop: (shop: RetailShopPOI) => void;
  selectedShopId?: string | null;
  onOpenGoogleConfig?: () => void;
  onExpandRadius?: (newRadius: number) => void;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  education: { label: 'Schools & Colleges', icon: GraduationCap, color: '#2563eb' },
  hospitality: { label: 'Hotels & Lodging', icon: Hotel, color: '#d97706' },
  transit: { label: 'Transit Hubs', icon: Bus, color: '#7c3aed' },
  healthcare: { label: 'Hospitals & Medical', icon: HeartPulse, color: '#e11d48' },
  pharmacy: { label: 'Healthcare & Pharma', icon: Pill, color: '#06b6d4' },
  cafe: { label: 'Cafes', icon: Coffee, color: '#f59e0b' },
  restaurant: { label: 'Dining', icon: UtensilsCrossed, color: '#ef4444' },
  supermarket: { label: 'Groceries', icon: ShoppingCart, color: '#10b981' },
  apparel: { label: 'Fashion', icon: Shirt, color: '#a855f7' },
  electronics: { label: 'Tech & Gadgets', icon: Smartphone, color: '#6366f1' },
  bank: { label: 'Banking', icon: Landmark, color: '#0d9488' },
  retail: { label: 'Retail Stores', icon: ShoppingBag, color: '#f97316' },
};

export const NearbyShopsList: React.FC<NearbyShopsListProps> = ({
  shops,
  loading = false,
  analysisRadius,
  cityName,
  wardName,
  provider = 'Verified Local Registry',
  onSelectShop,
  selectedShopId,
  onOpenGoogleConfig,
  onExpandRadius,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [filterQuery, setFilterQuery] = useState<string>('');

  // Strict radius-filtered shops (never display shops beyond active radius like 300m, 500m)
  const inRadiusShops = useMemo(() => {
    return shops.filter((s) => s.distanceMeters <= analysisRadius);
  }, [shops, analysisRadius]);

  // Category & Sector counts based strictly on in-radius shops
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: inRadiusShops.length };
    inRadiusShops.forEach((s) => {
      counts[s.category] = (counts[s.category] || 0) + 1;
      if (s.sector) {
        counts[s.sector] = (counts[s.sector] || 0) + 1;
      }
    });
    return counts;
  }, [inRadiusShops]);

  // Filtered shops
  const filteredShops = useMemo(() => {
    return inRadiusShops.filter((s) => {
      const matchesCat =
        activeCategory === 'all' ||
        s.category === activeCategory ||
        s.sector === activeCategory;
      const matchesSearch =
        !filterQuery.trim() ||
        s.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        s.categoryLabel.toLowerCase().includes(filterQuery.toLowerCase()) ||
        s.address.toLowerCase().includes(filterQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [inRadiusShops, activeCategory, filterQuery]);

  const nearestShop = inRadiusShops[0] || null;
  const avgDistance = inRadiusShops.length
    ? Math.round(inRadiusShops.reduce((acc, s) => acc + s.distanceMeters, 0) / inRadiusShops.length)
    : 0;

  return (
    <div className="nearby-shops-card">
      {/* Header */}
      <div className="nearby-shops-header">
        <div className="nearby-shops-title-group">
          <div className="nearby-shops-icon-box">
            <ShoppingBag size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 className="nearby-shops-title">Nearby Commercial Shops & Retail POIs</h3>
              <span className="shops-count-badge">
                {inRadiusShops.length} Venues in {analysisRadius >= 1000 ? `${analysisRadius / 1000}km` : `${analysisRadius}m`}
              </span>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: provider === 'Google Places Live' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                color: provider === 'Google Places Live' ? '#6ee7b7' : '#93c5fd',
                border: `1px solid ${provider === 'Google Places Live' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
              }}>
                {provider === 'Google Places Live' ? '🟢 Google Places Live' : '⚡ ' + provider}
              </span>
              {provider !== 'Google Places Live' && onOpenGoogleConfig && (
                <button
                  onClick={onOpenGoogleConfig}
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: '#fcd34d',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    cursor: 'pointer',
                  }}
                  title="Connect Google Places API for 100% live Google Maps results"
                >
                  ⚡ Connect Google Places API
                </button>
              )}
            </div>
            <p className="nearby-shops-subtitle">
              Live retail landscape within {analysisRadius >= 1000 ? `${analysisRadius / 1000} km` : `${analysisRadius}m`} radius in {wardName.split(' (')[0]}, {cityName}
            </p>
          </div>
        </div>

        {/* Quick Search inside list */}
        <div className="shops-search-wrap">
          <Search size={14} className="shops-search-icon" />
          <input
            type="text"
            className="shops-search-input"
            placeholder="Filter shops by brand, name..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Spatial Metrics Strip */}
      <div className="shops-metrics-strip">
        <div className="shop-metric-item">
          <span className="metric-label">Analyzed Radius</span>
          <strong className="metric-value">
            {analysisRadius >= 1000 ? `${analysisRadius / 1000} km` : `${analysisRadius}m`}
          </strong>
        </div>
        <div className="shop-metric-item">
          <span className="metric-label">Nearest Commercial Anchor</span>
          <strong className="metric-value" style={{ color: '#6ee7b7' }}>
            {nearestShop ? `${nearestShop.distanceMeters}m (${nearestShop.name.split(' ')[0]})` : 'None'}
          </strong>
        </div>
        <div className="shop-metric-item">
          <span className="metric-label">Average Distance</span>
          <strong className="metric-value">{avgDistance}m</strong>
        </div>
        <div className="shop-metric-item">
          <span className="metric-label">Retail Footfall Density</span>
          <strong className="metric-value" style={{ color: '#93c5fd' }}>
            {shops.length >= 15 ? 'Very High (Cluster)' : 'Moderate'}
          </strong>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="shops-category-pills">
        <button
          className={`shop-category-btn ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          <span>All Categories</span>
          <span className="cat-badge">{categoryCounts.all || 0}</span>
        </button>

        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const count = categoryCounts[key] || 0;
          if (count === 0 && activeCategory !== key) return null;
          const Icon = config.icon;
          return (
            <button
              key={key}
              className={`shop-category-btn ${activeCategory === key ? 'active' : ''}`}
              onClick={() => setActiveCategory(key)}
            >
              <Icon size={13} color={config.color} />
              <span>{config.label}</span>
              <span className="cat-badge">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Shop Cards Grid */}
      {loading ? (
        <div className="shops-loading-state">
          <p>Scanning live Google Places and local geographic registries for commercial hubs...</p>
        </div>
      ) : filteredShops.length === 0 ? (
        <div className="shops-empty-state">
          <AlertCircle size={24} color="var(--accent-orange)" />
          {filterQuery ? (
            <>
              <p>No retail shops found matching &ldquo;{filterQuery}&rdquo;.</p>
              <button className="clear-filter-btn" onClick={() => { setActiveCategory('all'); setFilterQuery(''); }}>
                Reset Filters
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <p style={{ fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                No commercial venues registered within {analysisRadius >= 1000 ? `${analysisRadius / 1000} km` : `${analysisRadius}m`} of this exact pin.
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, maxWidth: '440px' }}>
                This spot in {wardName.split(' (')[0]}, {cityName} may be a residential neighborhood or non-commercial zone. Try expanding your search radius or moving your pin closer to a primary commercial road.
              </p>
              {onExpandRadius && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  {analysisRadius < 1000 && (
                    <button className="clear-filter-btn" onClick={() => onExpandRadius(1000)}>
                      Expand to 1 km
                    </button>
                  )}
                  {analysisRadius < 2000 && (
                    <button className="clear-filter-btn" onClick={() => onExpandRadius(2000)}>
                      Expand to 2 km
                    </button>
                  )}
                  {analysisRadius < 3000 && (
                    <button className="clear-filter-btn" onClick={() => onExpandRadius(3000)}>
                      Expand to 3 km
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="shops-grid">
          {filteredShops.map((shop) => {
            const config = CATEGORY_CONFIG[shop.category] || {
              label: shop.categoryLabel,
              icon: ShoppingBag,
              color: '#3b82f6',
            };
            const Icon = config.icon;
            const isSelected = selectedShopId === shop.id;

            // Approximate walking time (80 meters / minute)
            const walkMin = Math.max(1, Math.round(shop.distanceMeters / 80));

            return (
              <div
                key={shop.id}
                className={`shop-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectShop(shop)}
              >
                <div className="shop-card-top">
                  <div className="shop-category-avatar" style={{ backgroundColor: `${config.color}20`, borderColor: `${config.color}50` }}>
                    <Icon size={16} color={config.color} />
                  </div>
                  <div className="shop-card-titles">
                    <h4 className="shop-name">{shop.name}</h4>
                    <div className="shop-meta-row">
                      <span className="shop-category-tag" style={{ color: config.color }}>
                        {shop.categoryLabel}
                      </span>
                      <span className="shop-dot">•</span>
                      <span className="shop-source-tag">{shop.source}</span>
                    </div>
                  </div>
                </div>

                <p className="shop-address">
                  <MapPin size={12} color="var(--text-dim)" style={{ flexShrink: 0 }} />
                  <span>{shop.address}</span>
                </p>

                <div className="shop-card-footer">
                  <div className="shop-rating-box">
                    <Star size={13} fill="#f59e0b" color="#f59e0b" />
                    <strong>{shop.rating}</strong>
                    <span className="review-count">({shop.reviewsCount})</span>
                  </div>

                  <div className="shop-distance-pill">
                    <Navigation size={11} color="var(--accent-blue)" />
                    <span>{shop.distanceMeters}m</span>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>({walkMin} min walk)</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {shop.googleMapsUri && (
                      <a
                        href={shop.googleMapsUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="google-maps-link"
                        onClick={(e) => e.stopPropagation()}
                        title="Open this location directly on Google Maps"
                        style={{
                          fontSize: '0.68rem',
                          color: 'var(--accent-teal)',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        <span>Google Maps</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                    <button
                      className="focus-shop-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectShop(shop);
                      }}
                      title="Pan and zoom Leaflet map to this store"
                    >
                      <span>View Pin</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="nearby-shops-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={13} color="var(--status-green)" />
          <span>
            Showing <strong>{filteredShops.length} of {inRadiusShops.length}</strong> venues strictly within {analysisRadius >= 1000 ? `${analysisRadius / 1000}km` : `${analysisRadius}m`}.
          </span>
        </div>
        <span style={{ color: 'var(--text-dim)' }}>
          Click any store card or &ldquo;View Pin&rdquo; to fly to it on the interactive map.
        </span>
      </div>
    </div>
  );
};
