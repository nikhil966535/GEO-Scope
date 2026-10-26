import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createCandidateIcon, createWardCenterIcon, createRetailPoiIcon } from '../utils/leafletIcons';
import { CityConfig, CITIES_DATA } from '../data/citiesData';
import { RetailShopPOI } from '../services/poiService';
import { findNearestWard, formatDistance, getDistanceMeters } from '../utils/geoUtils';
import { searchLocationOSM, GeocodingResult } from '../services/geocoding';
import {
  Compass,
  MapPin,
  Layers,
  RotateCcw,
  Copy,
  Check,
  MousePointerClick,
  CheckCircle2,
  Search,
  Crosshair,
  Loader2,
  Maximize2,
  Minimize2,
  ShoppingBag,
  Satellite,
} from 'lucide-react';

export interface FlyToRequest {
  lat: number;
  lng: number;
  zoom: number;
  id: string; // unique ID to detect changes
  shopId?: string;
  openCandidatePopup?: boolean;
}

interface MapViewProps {
  initialCenter: [number, number];
  initialZoom: number;
  flyToRequest: FlyToRequest | null;
  candidateLocation: { lat: number; lng: number; label?: string };
  analysisRadius: number;
  activeCity: CityConfig;
  onCityChange: (city: CityConfig) => void;
  onLocationSelect: (lat: number, lng: number) => void;
  onRadiusChange: (radius: number) => void;
  selectedAreaName?: string;
  businessCategory?: string;
  shops?: RetailShopPOI[];
  showRetailStores?: boolean;
  onToggleRetailStores?: () => void;
}

// Available base tile layer styles including high-resolution Satellite View!
const MAP_LAYERS = {
  standard: {
    name: 'OSM Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  satellite: {
    name: '🛰️ Google Satellite',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Satellite Imagery',
  },
  esriSat: {
    name: '🛰️ Esri Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery',
  },
  voyager: {
    name: 'Voyager Retail',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap, &copy; CARTO',
  },
  dark: {
    name: 'Dark Analytics',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap, &copy; CARTO',
  },
};

export const MapView: React.FC<MapViewProps> = ({
  initialCenter,
  initialZoom,
  flyToRequest,
  candidateLocation,
  analysisRadius,
  activeCity,
  onCityChange,
  onLocationSelect,
  onRadiusChange,
  selectedAreaName = 'Candidate Site',
  businessCategory = 'Commercial Site',
  shops = [],
  showRetailStores: propShowRetailStores,
  onToggleRetailStores,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const landmarksGroupRef = useRef<L.LayerGroup | null>(null);
  const retailGroupRef = useRef<L.LayerGroup | null>(null);
  const shopMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());

  // Fresh ref for location callback
  const onLocationSelectRef = useRef(onLocationSelect);
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  const [copiedCoords, setCopiedCoords] = useState(false);
  const [showWardMarkers, setShowWardMarkers] = useState(true);
  const [internalShowRetailStores, setInternalShowRetailStores] = useState(true);
  const isRetailStoresVisible = propShowRetailStores !== undefined ? propShowRetailStores : internalShowRetailStores;

  const handleToggleRetailStores = () => {
    if (onToggleRetailStores) {
      onToggleRetailStores();
    } else {
      setInternalShowRetailStores(!internalShowRetailStores);
    }
  };

  const [justPinnedNotice, setJustPinnedNotice] = useState<string | null>(null);
  const [activeLayerKey, setActiveLayerKey] = useState<keyof typeof MAP_LAYERS>('standard');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const formatCoord = (val: number) => val.toFixed(5);

  // Function to build popup HTML
  const buildPopupHTML = (
    lat: number,
    lng: number,
    radius: number,
    areaName: string,
    category: string,
    city: CityConfig
  ) => {
    const { ward: nearest, distanceMeters } = findNearestWard(lat, lng, city.wards);
    const radiusLabel = radius >= 1000 ? `${radius / 1000} km` : `${radius} m`;
    const proximity =
      distanceMeters < 80
        ? `Inside ${nearest.name.split(' ')[0]}`
        : `${formatDistance(distanceMeters)} from ${nearest.name.split(' ')[0]}`;

    return `
      <div class="leaflet-candidate-popup">
        <div class="popup-title">
          <span>📍 Candidate Business Site</span>
        </div>
        <div class="popup-sub">${areaName} (${city.name})</div>
        <div class="popup-proximity">${proximity}</div>
        <div class="popup-category">Target Category: <strong>${category}</strong></div>
        <div class="popup-coords">
          <code>${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E</code>
        </div>
        <div class="popup-radius">
          Spatial Catchment Radius: <strong>${radiusLabel}</strong>
        </div>
        <div class="popup-hint">
          Click any spot on map to move this pin.
        </div>
      </div>
    `;
  };

  // Build Retail POI popup HTML
  const buildRetailPopupHTML = (
    poi: RetailShopPOI,
    candidateLat: number,
    candidateLng: number,
    exactDist?: number
  ) => {
    const distMeters =
      exactDist !== undefined
        ? exactDist
        : getDistanceMeters(candidateLat, candidateLng, poi.lat, poi.lng);

    return `
      <div class="leaflet-retail-popup">
        <div class="retail-popup-header">
          <span class="retail-category-pill ${poi.category}">${poi.categoryLabel}</span>
          ${poi.rating ? `<span class="retail-rating">★ ${poi.rating}</span>` : ''}
        </div>
        <strong class="retail-popup-name">${poi.name}</strong>
        <p class="retail-popup-addr">${poi.address || 'Commercial Corridor'}</p>
        <div class="retail-popup-distance">
          <span>Distance to Candidate Site: </span>
          <strong>${formatDistance(distMeters)}</strong>
        </div>
        <div class="retail-popup-source">Provider: ${poi.source}</div>
        ${poi.googleMapsUri ? `<div style="margin-top:6px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.1);"><a href="${poi.googleMapsUri}" target="_blank" rel="noopener noreferrer" style="color:#38bdf8;font-size:0.7rem;text-decoration:none;font-weight:600;display:inline-flex;align-items:center;gap:3px;">View on Google Maps ↗</a></div>` : ''}
      </div>
    `;
  };

  // 1. Initialize Map (React 18 StrictMode resilient)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const container = mapContainerRef.current;
    if ((container as unknown as { _leaflet_id?: number })._leaflet_id) {
      delete (container as unknown as { _leaflet_id?: number })._leaflet_id;
    }

    // Create Map
    const map = L.map(container, {
      center: [initialCenter[0], initialCenter[1]],
      zoom: initialZoom,
      minZoom: 4,
      maxZoom: 19,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Add Base Tile Layer
    const layerConfig = MAP_LAYERS[activeLayerKey];
    const tileLayer = L.tileLayer(layerConfig.url, {
      maxZoom: 19,
      attribution: layerConfig.attribution,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Create Landmark LayerGroup
    const landmarksGroup = L.layerGroup().addTo(map);
    landmarksGroupRef.current = landmarksGroup;

    // Create Retail POI LayerGroup
    const retailGroup = L.layerGroup().addTo(map);
    retailGroupRef.current = retailGroup;

    // Create initial Candidate Pin
    const initialMarker = L.marker([candidateLocation.lat, candidateLocation.lng], {
      icon: createCandidateIcon(candidateLocation.label),
      draggable: true,
      autoPan: true,
      zIndexOffset: 1000,
    }).addTo(map);

    initialMarker.bindPopup(
      buildPopupHTML(
        candidateLocation.lat,
        candidateLocation.lng,
        analysisRadius,
        selectedAreaName,
        businessCategory,
        activeCity
      ),
      { offset: [0, -42], className: 'custom-leaflet-popup-container' }
    );

    initialMarker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      onLocationSelectRef.current(pos.lat, pos.lng);
    });

    markerRef.current = initialMarker;

    // Create initial Radius Circle
    const initialCircle = L.circle([candidateLocation.lat, candidateLocation.lng], {
      radius: analysisRadius,
      color: '#2563eb',
      weight: 2,
      dashArray: '6, 8',
      fillColor: '#3b82f6',
      fillOpacity: 0.14,
      interactive: false,
    }).addTo(map);

    circleRef.current = initialCircle;

    // MAP CLICK HANDLER: Direct pin placement anywhere on map!
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      console.log(`[Geoscope Map] Clicked: lat=${lat}, lng=${lng}`);

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        markerRef.current.setPopupContent(
          buildPopupHTML(lat, lng, analysisRadius, selectedAreaName, businessCategory, activeCity)
        );
        markerRef.current.openPopup();
      }

      if (circleRef.current) {
        circleRef.current.setLatLng([lat, lng]);
      }

      map.panTo([lat, lng], { animate: true, duration: 0.35 });
      onLocationSelectRef.current(lat, lng);

      setJustPinnedNotice(`${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`);
      setTimeout(() => setJustPinnedNotice(null), 3000);
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    mapInstanceRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (initialMarker) initialMarker.remove();
      if (initialCircle) initialCircle.remove();
      if (landmarksGroup) landmarksGroup.clearLayers();
      if (retailGroup) retailGroup.clearLayers();
      map.remove();
      markerRef.current = null;
      circleRef.current = null;
      landmarksGroupRef.current = null;
      retailGroupRef.current = null;
      mapInstanceRef.current = null;
    };
  }, []); // Run once on mount

  // 2. Switch Base Tile Layer Style (including Satellite!)
  const handleLayerSwitch = (key: keyof typeof MAP_LAYERS) => {
    setActiveLayerKey(key);
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const newConfig = MAP_LAYERS[key];
    const newLayer = L.tileLayer(newConfig.url, {
      maxZoom: 19,
      attribution: newConfig.attribution,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;
  };

  // 3. Render Retail & Shops POIs around the candidate pin
  useEffect(() => {
    if (!retailGroupRef.current || !mapInstanceRef.current) return;
    const group = retailGroupRef.current;
    group.clearLayers();
    shopMarkersMapRef.current.clear();

    if (!isRetailStoresVisible) return;

    shops.forEach((poi) => {
      // Calculate real-time geodesic distance from the current candidate location
      const liveDist = getDistanceMeters(candidateLocation.lat, candidateLocation.lng, poi.lat, poi.lng);

      // STRICT CATCHMENT FILTER: Never render pins outside the active radius (300m, 500m, etc.)
      if (liveDist > analysisRadius) return;

      const poiMarker = L.marker([poi.lat, poi.lng], {
        icon: createRetailPoiIcon(poi.sector || poi.category, poi.name),
        interactive: true,
        zIndexOffset: 450,
      });

      poiMarker.bindPopup(
        buildRetailPopupHTML(poi, candidateLocation.lat, candidateLocation.lng, liveDist),
        { offset: [0, -28], className: 'custom-leaflet-retail-popup' }
      );

      poiMarker.bindTooltip(`${poi.name} (${formatDistance(liveDist)})`, {
        direction: 'top',
        offset: [0, -28],
        className: 'leaflet-shop-tooltip',
      });

      group.addLayer(poiMarker);
      shopMarkersMapRef.current.set(poi.id, poiMarker);
    });
  }, [shops, isRetailStoresVisible, candidateLocation, analysisRadius]);

  // 4. Sync landmarks when activeCity changes
  useEffect(() => {
    if (!landmarksGroupRef.current || !mapInstanceRef.current) return;
    const group = landmarksGroupRef.current;
    group.clearLayers();

    activeCity.wards.forEach((ward) => {
      const landmarkMarker = L.marker([ward.lat, ward.lng], {
        icon: createWardCenterIcon(ward.name.split(' ')[0]),
        interactive: true,
      });

      landmarkMarker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onLocationSelectRef.current(ward.lat, ward.lng);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([ward.lat, ward.lng], 16, { duration: 1.0 });
        }
      });

      group.addLayer(landmarkMarker);
    });
  }, [activeCity]);

  // 5. Sync Candidate Pin position & Radius when props change
  useEffect(() => {
    const { lat, lng } = candidateLocation;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setPopupContent(
        buildPopupHTML(lat, lng, analysisRadius, selectedAreaName, businessCategory, activeCity)
      );
    }

    if (circleRef.current) {
      circleRef.current.setLatLng([lat, lng]);
      circleRef.current.setRadius(analysisRadius);
    }
  }, [candidateLocation, analysisRadius, selectedAreaName, businessCategory, activeCity]);

  // 6. Handle Explicit FlyTo Requests
  useEffect(() => {
    if (!flyToRequest || !mapInstanceRef.current) return;

    mapInstanceRef.current.flyTo([flyToRequest.lat, flyToRequest.lng], flyToRequest.zoom, {
      duration: 1.1,
      easeLinearity: 0.25,
    });

    if (flyToRequest.shopId) {
      const shopMarker = shopMarkersMapRef.current.get(flyToRequest.shopId);
      if (shopMarker) {
        setTimeout(() => shopMarker.openPopup(), 350);
      }
    } else if (flyToRequest.openCandidatePopup !== false && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [flyToRequest]);

  // 7. Sync Ward Landmark visibility toggle
  useEffect(() => {
    if (!mapInstanceRef.current || !landmarksGroupRef.current) return;
    if (showWardMarkers) {
      if (!mapInstanceRef.current.hasLayer(landmarksGroupRef.current)) {
        landmarksGroupRef.current.addTo(mapInstanceRef.current);
      }
    } else {
      if (mapInstanceRef.current.hasLayer(landmarksGroupRef.current)) {
        landmarksGroupRef.current.remove();
      }
    }
  }, [showWardMarkers]);

  // Handle Search Input & OSM Query
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (val.trim().length >= 3) {
      setIsSearching(true);
      setShowDropdown(true);
      const results = await searchLocationOSM(`${val} ${activeCity.name}`);
      setSearchResults(results.length > 0 ? results : await searchLocationOSM(val));
      setIsSearching(false);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const handleSelectSearchResult = (result: GeocodingResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    setSearchQuery(result.display_name.split(',')[0]);
    setShowDropdown(false);

    onLocationSelectRef.current(lat, lng);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.2 });
    }
  };

  // Handle GPS "Locate Me" Button
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onLocationSelectRef.current(latitude, longitude);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 16, { duration: 1.2 });
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('Could not determine your GPS location. Please allow location permissions in your browser.');
      },
      { timeout: 8000 }
    );
  };

  // Handle Copy Coordinates
  const handleCopyCoords = () => {
    const coordString = `${candidateLocation.lat.toFixed(6)}, ${candidateLocation.lng.toFixed(6)}`;
    navigator.clipboard.writeText(coordString).then(() => {
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    });
  };

  // Handle Reset to City Center
  const handleResetToCenter = () => {
    onLocationSelectRef.current(activeCity.lat, activeCity.lng);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([activeCity.lat, activeCity.lng], activeCity.defaultZoom, {
        duration: 1.0,
      });
    }
  };

  // Toggle Fullscreen Viewport
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);
  };

  return (
    <div className={`map-wrapper-card ${isFullscreen ? 'fullscreen-map' : ''}`}>
      {/* Top Map Toolbar */}
      <div className="map-toolbar">
        <div className="map-toolbar-left">
          <div className="map-title-badge">
            <Compass size={16} color="var(--accent-blue)" />
            <span>Interactive OSM & Satellite Canvas</span>
          </div>

          {/* Quick City Jump Bar */}
          <div className="city-quick-pills">
            {CITIES_DATA.slice(0, 5).map((city) => (
              <button
                key={city.id}
                onClick={() => onCityChange(city)}
                className={`city-pill-btn ${activeCity.id === city.id ? 'active' : ''}`}
                title={`Jump map to ${city.fullName}`}
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>

        <div className="map-toolbar-right">
          {/* Active coordinates chip */}
          <div className="coords-chip" title="Click to copy coordinates">
            <MapPin size={13} color="#ef4444" />
            <code>
              {formatCoord(candidateLocation.lat)}° N, {formatCoord(candidateLocation.lng)}° E
            </code>
            <button
              onClick={handleCopyCoords}
              className="copy-btn"
              title="Copy latitude, longitude to clipboard"
            >
              {copiedCoords ? <Check size={13} color="var(--status-green)" /> : <Copy size={13} />}
            </button>
          </div>

          {/* GPS Locate Me Button */}
          <button
            onClick={handleLocateMe}
            className="tool-btn"
            title="Locate my GPS position anywhere in India"
          >
            <Crosshair size={14} color="var(--accent-teal)" />
            <span>Locate Me</span>
          </button>

          {/* Toggle Retail Stores Layer */}
          <button
            onClick={handleToggleRetailStores}
            className={`tool-toggle-btn ${isRetailStoresVisible ? 'active' : ''}`}
            title={isRetailStoresVisible ? 'Hide Retail Stores on Map' : 'Show Retail Stores on Map'}
          >
            <ShoppingBag size={14} />
            <span>Shops ({shops.length}) {isRetailStoresVisible ? 'ON' : 'OFF'}</span>
          </button>

          {/* Toggle Landmarks */}
          <button
            onClick={() => setShowWardMarkers(!showWardMarkers)}
            className={`tool-toggle-btn ${showWardMarkers ? 'active' : ''}`}
            title="Toggle Ward Landmark labels"
          >
            <Layers size={14} />
            <span>{showWardMarkers ? 'Wards On' : 'Wards Off'}</span>
          </button>

          {/* Reset View */}
          <button
            onClick={handleResetToCenter}
            className="tool-btn"
            title={`Reset view to central ${activeCity.name}`}
          >
            <RotateCcw size={14} />
            <span>Center</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="tool-btn"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand to Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Address Search & Map Layer Toolbar */}
      <div className="map-subtoolbar">
        {/* OpenStreetMap Address Search Input */}
        <div className="search-bar-wrap">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={`Search any shop, mall, road, or street in ${activeCity.name} or India...`}
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery.length >= 3 && setShowDropdown(true)}
          />
          {isSearching && <Loader2 size={14} className="spin-icon" />}

          {/* Autocomplete Search Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="search-results-dropdown">
              {searchResults.map((res) => (
                <div
                  key={res.place_id}
                  className="search-result-row"
                  onClick={() => handleSelectSearchResult(res)}
                >
                  <MapPin size={14} color="#ef4444" style={{ flexShrink: 0 }} />
                  <div className="search-result-text">
                    <strong>{res.display_name.split(',')[0]}</strong>
                    <p>{res.display_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map Tile Layer Selector (Including Satellite View!) */}
        <div className="layer-picker-group">
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.04em' }}>
            VIEW:
          </span>
          {(['standard', 'satellite', 'voyager', 'dark'] as Array<keyof typeof MAP_LAYERS>).map((layerKey) => (
            <button
              key={layerKey}
              onClick={() => handleLayerSwitch(layerKey)}
              className={`layer-btn ${activeLayerKey === layerKey ? 'active' : ''}`}
            >
              {layerKey === 'satellite' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Satellite size={12} />
                  <span>Satellite</span>
                </span>
              ) : (
                MAP_LAYERS[layerKey].name.split(' ')[0]
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="map-viewport-container">
        <div ref={mapContainerRef} className="leaflet-actual-map" />

        {/* Live Pin Flash Confirmation Toast */}
        {justPinnedNotice && (
          <div className="pin-flash-toast">
            <CheckCircle2 size={16} color="var(--status-green)" />
            <span>Pinned Site at <strong>{justPinnedNotice}</strong></span>
          </div>
        )}

        {/* Floating Hint Overlay */}
        <div className="map-floating-hint">
          <MousePointerClick size={14} color="var(--accent-blue)" />
          <span>
            <strong>Click any spot on the map</strong> to drop your pin across {activeCity.name} (or switch to Satellite view)
          </span>
        </div>
      </div>

      {/* Bottom Map Bar: Radius & Legend */}
      <div className="map-bottom-bar">
        <div className="radius-selector-group">
          <span className="radius-label">Catchment Radius:</span>
          <div className="radius-pills">
            {[300, 500, 1000, 2000, 3000].map((radius) => (
              <button
                key={radius}
                className={`radius-pill ${analysisRadius === radius ? 'active' : ''}`}
                onClick={() => onRadiusChange(radius)}
              >
                {radius >= 1000 ? `${radius / 1000} km` : `${radius} m`}
              </button>
            ))}
          </div>
        </div>

        <div className="map-legend">
          <div className="legend-item">
            <span className="legend-dot candidate" style={{ backgroundColor: '#ef4444' }} />
            <span>Candidate Site</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#f59e0b' }} />
            <span>Nearby Retail & Shops</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot landmark" />
            <span>Commercial Wards</span>
          </div>
        </div>
      </div>
    </div>
  );
};
