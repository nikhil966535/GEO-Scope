import React from 'react';
import { MapPin, Store, Navigation, Search, Sparkles, Crosshair } from 'lucide-react';
import { CITIES_DATA, CityConfig, CityWard, CityHotspot } from '../data/citiesData';
import { findNearestWard, formatDistance } from '../utils/geoUtils';

interface Props {
  activeCity: CityConfig;
  onCityChange: (city: CityConfig) => void;
  selectedWardId: string;
  onWardChange: (ward: CityWard) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  candidateCoords: { lat: number; lng: number };
  analysisRadius: number;
  onAnalyze: () => void;
  onSelectHotspot: (hotspot: CityHotspot) => void;
}

export const LocationSelector: React.FC<Props> = ({
  activeCity,
  onCityChange,
  selectedWardId,
  onWardChange,
  selectedCategory,
  onCategoryChange,
  candidateCoords,
  analysisRadius,
  onAnalyze,
  onSelectHotspot,
}) => {
  const currentWard =
    activeCity.wards.find((w) => w.id === selectedWardId) || activeCity.wards[0];

  const handleCitySelect = (cityId: string) => {
    const city = CITIES_DATA.find((c) => c.id === cityId);
    if (city) {
      onCityChange(city);
    }
  };

  const handleWardSelect = (wardId: string) => {
    const ward = activeCity.wards.find((w) => w.id === wardId);
    if (ward) {
      onWardChange(ward);
    }
  };

  const { ward: nearestWard, distanceMeters } = findNearestWard(
    candidateCoords.lat,
    candidateCoords.lng,
    activeCity.wards
  );

  const proximityText =
    distanceMeters < 80
      ? `Inside ${nearestWard.name.split(' ')[0]}`
      : `${formatDistance(distanceMeters)} from ${nearestWard.name.split(' ')[0]}`;

  const radiusLabel = analysisRadius >= 1000 ? `${analysisRadius / 1000} km` : `${analysisRadius} m`;

  return (
    <div className="control-card">
      <div className="control-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Navigation size={18} color="var(--accent-blue)" />
          <h3>Site Selection Parameters</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="placeholder-badge"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--status-green)',
              borderColor: 'rgba(16, 185, 129, 0.25)',
            }}
          >
            Active City: {activeCity.name} ({activeCity.state})
          </span>
        </div>
      </div>

      <div className="control-grid">
        {/* City selection - NOW ACTIVE & EXPANDABLE */}
        <div className="form-group">
          <label className="form-label">
            <MapPin size={14} /> Target City (India)
          </label>
          <select
            className="form-select"
            value={activeCity.id}
            onChange={(e) => handleCitySelect(e.target.value)}
          >
            {CITIES_DATA.map((city) => (
              <option key={city.id} value={city.id}>
                {city.fullName} {city.isDefault ? '(Default Baseline)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Micro-Location / Ward selection */}
        <div className="form-group">
          <label className="form-label">
            <Search size={14} /> {activeCity.name} Micro-Market / Ward
          </label>
          <select
            className="form-select"
            value={currentWard?.id || activeCity.wards[0].id}
            onChange={(e) => handleWardSelect(e.target.value)}
          >
            {activeCity.wards.map((ward) => (
              <option key={ward.id} value={ward.id}>
                {ward.name}
              </option>
            ))}
          </select>
        </div>

        {/* Business Category selection */}
        <div className="form-group">
          <label className="form-label">
            <Store size={14} /> Business Category
          </label>
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="Cafe & Specialty Coffee">Cafe & Specialty Coffee</option>
            <option value="Quick Service Restaurant (QSR)">Quick Service Restaurant (QSR)</option>
            <option value="Movie Theater & Entertainment Hub">Movie Theater & Entertainment Hub</option>
            <option value="Pharmacy & Healthcare Store">Pharmacy & Healthcare Retail</option>
            <option value="Boutique & Fashion Apparel">Boutique & Fashion Apparel</option>
            <option value="Supermarket & Daily Essentials">Supermarket & Daily Essentials</option>
            <option value="Gym & Wellness Studio">Gym & Wellness Studio</option>
            <option value="Fine Dining & Restobar">Fine Dining & Restobar</option>
            <option value="Bakery, Sweets & Dessert Parlour">Bakery, Sweets & Dessert Parlour</option>
            <option value="Electronics & Mobile Megastore">Electronics & Mobile Megastore</option>
          </select>
        </div>

        {/* Action Button */}
        <div className="form-group">
          <button className="btn-primary" onClick={onAnalyze}>
            <Sparkles size={18} />
            <span>Evaluate Location</span>
          </button>
        </div>
      </div>

      {/* Quick-Pin Hotspots for Current City */}
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>
          <Crosshair size={13} color="var(--accent-blue)" />
          <span>QUICK PIN POPULAR {activeCity.name.toUpperCase()} COMMERCIAL HOTSPOTS:</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {activeCity.hotspots.map((spot) => (
            <button
              key={spot.id}
              onClick={() => onSelectHotspot(spot)}
              className="hotspot-pill-btn"
              title={`Drop pin at ${spot.name} in ${activeCity.name}`}
            >
              <MapPin size={12} color="#ef4444" />
              <span>{spot.name}</span>
              <span className="hotspot-sub">{spot.category}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Area Context & Live Pin Readout */}
      <div className="area-context-bar">
        <div className="area-context-left">
          <span className="area-badge">
            {currentWard.category.replace('_', ' ').toUpperCase()}
          </span>
          <p className="area-desc">{currentWard.description}</p>
        </div>
        <div className="area-context-right">
          <div className="stat-item" style={{ borderColor: 'rgba(59, 130, 246, 0.4)' }}>
            <span className="stat-label">📍 Pinned Spot:</span>
            <span className="stat-val" style={{ color: '#93c5fd' }}>
              {candidateCoords.lat.toFixed(4)}° N, {candidateCoords.lng.toFixed(4)}° E
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              ({proximityText})
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Radius:</span>
            <span className="stat-val">{radiusLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
