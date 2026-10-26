import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LocationSelector } from './components/LocationSelector';
import { CityRegionsExplorer } from './components/CityRegionsExplorer';
import { AISuggestionPanel } from './components/AISuggestionPanel';
import { NearbyShopsList } from './components/NearbyShopsList';
import { SiteScorecardPanel } from './components/SiteScorecardPanel';
import { MapView, FlyToRequest } from './components/MapView';
import { GoogleMapsConfigModal } from './components/GoogleMapsConfigModal';
import { PlaceholderCard } from './components/PlaceholderCard';
import { Stage3PoiModelView } from './components/Stage3PoiModelView';
import { Stage4ScoringModelView } from './components/Stage4ScoringModelView';
import { Stage5RecommendationsModelView } from './components/Stage5RecommendationsModelView';
import { SettingsModelView } from './components/SettingsModelView';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { SavedEvaluationsModal } from './components/SavedEvaluationsModal';
import { checkBackendHealth, HealthResponse, SavedEvaluationRecord } from './services/api';
import { generateAISuggestion } from './services/aiRecommendationService';
import { fetchNearbyShops, RetailShopPOI, SiteScorecard } from './services/poiService';
import {
  CITIES_DATA,
  CityConfig,
  CityWard,
  CityHotspot,
  findNearestConfiguredCity,
} from './data/citiesData';
import { findNearestWard, formatDistance, getDistanceMeters } from './utils/geoUtils';
import {
  Layers,
  BarChart,
  Lightbulb,
  Server,
  Code2,
  Sparkles,
  MapPin,
  Compass,
  FileText,
  Database,
  BarChart3,
  Settings,
} from 'lucide-react';

export const App: React.FC = () => {
  // Navigation active tab (map, poi-data, scoring, recommendations, settings)
  const [activeTab, setActiveTab] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'map';
  });

  // Backend health status
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Multi-City & Location States (Kolhapur is default)
  const [activeCity, setActiveCity] = useState<CityConfig>(CITIES_DATA[0]);
  const [selectedWard, setSelectedWard] = useState<CityWard>(CITIES_DATA[0].wards[0]);
  const [candidateCoords, setCandidateCoords] = useState<{ lat: number; lng: number }>({
    lat: CITIES_DATA[0].wards[0].lat,
    lng: CITIES_DATA[0].wards[0].lng,
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('Cafe & Specialty Coffee');
  const [analysisRadius, setAnalysisRadius] = useState<number>(500); // 500m default
  const [flyToRequest, setFlyToRequest] = useState<FlyToRequest | null>(null);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState<boolean>(false);

  // Nearby Retail & Shops POIs State
  const [nearbyShops, setNearbyShops] = useState<RetailShopPOI[]>([]);
  const [scorecard, setScorecard] = useState<SiteScorecard | null>(null);
  const [loadingShops, setLoadingShops] = useState<boolean>(false);
  const [showRetailStores, setShowRetailStores] = useState<boolean>(true);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [placesProvider, setPlacesProvider] = useState<string>('Verified Local Registry');
  const [apiKeyTrigger, setApiKeyTrigger] = useState<number>(0);

  // Evaluation confirmation feedback
  const [evaluationFeedback, setEvaluationFeedback] = useState<string | null>(null);

  // Hash-based navigation synchronization
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigateTab = (tab: string) => {
    setActiveTab(tab);
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch live Google Places or verified real physical venues whenever candidate location, radius, or city changes
  useEffect(() => {
    let isCancelled = false;
    setLoadingShops(true);

    fetchNearbyShops(
      candidateCoords.lat,
      candidateCoords.lng,
      analysisRadius,
      activeCity.name,
      selectedWard.name,
      selectedCategory
    )
      .then((res) => {
        if (!isCancelled) {
          setNearbyShops(res.places);
          setPlacesProvider(res.provider);
          if (res.scorecard) {
            setScorecard(res.scorecard);
          }
          setLoadingShops(false);
        }
      })
      .catch((err) => {
        console.warn('Error loading nearby shops:', err);
        if (!isCancelled) setLoadingShops(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [candidateCoords.lat, candidateCoords.lng, analysisRadius, activeCity.name, selectedWard.name, selectedCategory, apiKeyTrigger]);

  // Handle Shop selection from NearbyShopsList (Fly & Focus)
  const handleSelectShop = (shop: RetailShopPOI) => {
    setSelectedShopId(shop.id);
    setShowRetailStores(true); // Ensure markers are visible

    setFlyToRequest({
      lat: shop.lat,
      lng: shop.lng,
      zoom: 17,
      id: `shop-${shop.id}-${Date.now()}`,
      shopId: shop.id,
      openCandidatePopup: false,
    });
  };

  // Fetch backend health
  const fetchHealth = useCallback(async () => {
    setLoadingHealth(true);
    setHealthError(null);
    try {
      const data = await checkBackendHealth();
      setHealth(data);
    } catch (err: any) {
      setHealthError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Handle City Change: center on city's first ward and fly map
  const handleCityChange = (city: CityConfig) => {
    setActiveCity(city);
    const defaultWard = city.wards[0];
    setSelectedWard(defaultWard);
    setCandidateCoords({ lat: defaultWard.lat, lng: defaultWard.lng });
    setEvaluationFeedback(null);

    setFlyToRequest({
      lat: defaultWard.lat,
      lng: defaultWard.lng,
      zoom: city.defaultZoom,
      id: String(Date.now()),
    });
  };

  // Handle Ward Selection within active city
  const handleWardChange = (wardOrId: CityWard | string) => {
    const ward = typeof wardOrId === 'string' ? activeCity.wards.find((w) => w.id === wardOrId) : wardOrId;
    if (!ward) return;

    setSelectedWard(ward);
    setCandidateCoords({ lat: ward.lat, lng: ward.lng });
    setEvaluationFeedback(null);

    setFlyToRequest({
      lat: ward.lat,
      lng: ward.lng,
      zoom: 15,
      id: String(Date.now()),
    });
  };

  // Handle Hotspot Shortcut Click
  const handleSelectHotspot = (hotspot: CityHotspot) => {
    setCandidateCoords({ lat: hotspot.lat, lng: hotspot.lng });
    setEvaluationFeedback(null);

    const { ward: matchingWard } = findNearestWard(hotspot.lat, hotspot.lng, activeCity.wards);
    setSelectedWard(matchingWard);

    setFlyToRequest({
      lat: hotspot.lat,
      lng: hotspot.lng,
      zoom: 16,
      id: String(Date.now()),
    });
  };

  // Handle AI Alternative Selection
  const handleSelectAIAlternative = (
    latOrAlt: number | { name: string; lat: number; lng: number; radius?: number },
    lng?: number,
    _name?: string
  ) => {
    let targetLat: number;
    let targetLng: number;
    if (typeof latOrAlt === 'object') {
      targetLat = latOrAlt.lat;
      targetLng = latOrAlt.lng;
      if (latOrAlt.radius) setAnalysisRadius(latOrAlt.radius);
    } else {
      targetLat = latOrAlt;
      targetLng = lng!;
    }

    setCandidateCoords({ lat: targetLat, lng: targetLng });
    setEvaluationFeedback(null);

    const { ward: matchingWard } = findNearestWard(targetLat, targetLng, activeCity.wards);
    setSelectedWard(matchingWard);

    setFlyToRequest({
      lat: targetLat,
      lng: targetLng,
      zoom: 16,
      id: String(Date.now()),
    });
  };

  // Load a saved evaluation from MongoDB onto the map
  const handleLoadEvaluation = (evalRecord: SavedEvaluationRecord) => {
    const city =
      CITIES_DATA.find((c) => c.name.toLowerCase() === evalRecord.cityName.toLowerCase()) || activeCity;
    setActiveCity(city);
    const ward =
      city.wards.find(
        (w) =>
          w.name.toLowerCase().includes(evalRecord.wardName.toLowerCase()) ||
          evalRecord.wardName.toLowerCase().includes(w.name.toLowerCase())
      ) || city.wards[0];
    setSelectedWard(ward);
    setCandidateCoords(evalRecord.candidateCoords);
    setAnalysisRadius(evalRecord.analysisRadius);
    setSelectedCategory(evalRecord.category);
    handleNavigateTab('map');
    setFlyToRequest({
      lat: evalRecord.candidateCoords.lat,
      lng: evalRecord.candidateCoords.lng,
      zoom: 16,
      id: `eval-load-${Date.now()}`,
    });
  };

  // Handle Map Click: Pin anywhere across India!
  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setCandidateCoords({ lat, lng });

    // Instantly filter existing shops to the new coordinates so stale faraway markers don't appear inside the new circle!
    setNearbyShops((prev) =>
      prev
        .map((p) => ({
          ...p,
          distanceMeters: getDistanceMeters(lat, lng, p.lat, p.lng),
        }))
        .filter((p) => p.distanceMeters <= analysisRadius)
    );

    const { city: nearestCity, distanceKm } = findNearestConfiguredCity(lat, lng);
    if (distanceKm < 45 && nearestCity.id !== activeCity.id) {
      setActiveCity(nearestCity);
      const { ward: nearest } = findNearestWard(lat, lng, nearestCity.wards);
      setSelectedWard(nearest);
    } else {
      const { ward: nearest } = findNearestWard(lat, lng, activeCity.wards);
      setSelectedWard(nearest);
    }

    setEvaluationFeedback(null);
  }, [activeCity, analysisRadius]);

  // Handle Evaluate button click
  const handleEvaluate = () => {
    const radiusStr = analysisRadius >= 1000 ? `${analysisRadius / 1000} km` : `${analysisRadius} m`;
    setEvaluationFeedback(
      `Candidate site evaluated at ${candidateCoords.lat.toFixed(5)}° N, ${candidateCoords.lng.toFixed(5)}° E in ${activeCity.name} (${selectedWard.name.split(' ')[0]}) for ${selectedCategory} with a ${radiusStr} buffer. Ready for Stage 3 Overpass POI extraction!`
    );
  };

  // Compute live AI Recommendation for active parameters (grounded in live scorecard & POIs)
  const aiRecommendation = useMemo(() => {
    return generateAISuggestion(activeCity, selectedWard, selectedCategory, analysisRadius, scorecard, nearbyShops);
  }, [activeCity, selectedWard, selectedCategory, analysisRadius, scorecard, nearbyShops]);

  const { ward: nearestWard, distanceMeters } = findNearestWard(
    candidateCoords.lat,
    candidateCoords.lng,
    activeCity.wards
  );

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabSelect={handleNavigateTab}
        activeCityName={activeCity.name}
      />

      {/* Main Workspace */}
      <div className="main-wrapper">
        <Header
          health={health}
          loading={loadingHealth}
          error={healthError}
          onRefreshHealth={fetchHealth}
          onOpenGoogleConfig={() => setIsGoogleModalOpen(true)}
        />

        <main className="dashboard-content">
          {/* Stage Navigation Tab Ribbon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              overflowX: 'auto',
            }}
          >
            {[
              { id: 'map', label: 'Interactive Map Canvas', stage: 'Stage 2', icon: MapPin },
              { id: 'poi-data', label: 'OSM / Overpass POIs', stage: 'Stage 3', icon: Database },
              { id: 'scoring', label: 'Spatial Scoring Engine', stage: 'Stage 4', icon: BarChart3 },
              { id: 'recommendations', label: 'AI Recommendations', stage: 'Stage 5', icon: Lightbulb },
              { id: 'settings', label: 'System Configuration', stage: 'Settings', icon: Settings },
            ].map((tab) => {
              const active = activeTab === tab.id || (tab.id === 'map' && activeTab === 'dashboard');
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleNavigateTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: active ? '1px solid var(--accent-blue)' : '1px solid transparent',
                    backgroundColor: active ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={15} color={active ? 'var(--accent-blue)' : 'var(--text-dim)'} />
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: active ? 'rgba(59, 130, 246, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                      color: active ? '#bfdbfe' : 'var(--text-dim)',
                    }}
                  >
                    {tab.stage}
                  </span>
                </button>
              );
            })}

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setIsSavedModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#6ee7b7',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Database size={14} color="#10b981" />
                <span>Saved Sites (MongoDB)</span>
              </button>
            </div>
          </div>

          {/* Compact Status Ribbon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={16} color="var(--accent-blue)" />
              <span>
                Active City: <strong style={{ color: '#93c5fd' }}>{activeCity.fullName}</strong>
                {activeCity.isDefault && ' (Primary Baseline)'}
              </span>
              <span style={{ color: 'var(--text-dim)' }}>•</span>
              <span>
                Target Ward: <strong>{selectedWard.name.split(' (')[0]}</strong>
              </span>
              <span style={{ color: 'var(--text-dim)' }}>•</span>
              <span>
                Category: <strong>{selectedCategory}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {activeCity.wards.length} Zones Available
              </span>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--status-green)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                Stages 1–5 Operational
              </div>
            </div>
          </div>

          {/* Evaluation Banner if Triggered */}
          {evaluationFeedback && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                borderRadius: 'var(--radius-md)',
                color: '#bfdbfe',
                fontSize: '0.825rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Sparkles size={16} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
              <div>
                <strong>Site Parameter Confirmed:</strong> {evaluationFeedback}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB-BASED CONDITIONAL VIEW ROUTING                        */}
          {/* ========================================================= */}

          {activeTab === 'poi-data' && (
            <Stage3PoiModelView
              activeCity={activeCity}
              selectedWard={selectedWard}
              candidateCoords={candidateCoords}
              analysisRadius={analysisRadius}
              onRadiusChange={setAnalysisRadius}
              shops={nearbyShops}
              scorecard={scorecard}
              provider={placesProvider}
              loading={loadingShops}
              onNavigateTab={handleNavigateTab}
              onSelectShop={(shop) => {
                handleSelectShop(shop);
                handleNavigateTab('map');
              }}
            />
          )}

          {activeTab === 'scoring' && (
            <Stage4ScoringModelView
              activeCity={activeCity}
              selectedWard={selectedWard}
              candidateCoords={candidateCoords}
              analysisRadius={analysisRadius}
              onRadiusChange={setAnalysisRadius}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              scorecard={scorecard}
              shops={nearbyShops}
              provider={placesProvider}
              onNavigateTab={handleNavigateTab}
              onOpenReport={() => setIsReportModalOpen(true)}
            />
          )}

          {activeTab === 'recommendations' && (
            <Stage5RecommendationsModelView
              activeCity={activeCity}
              selectedWard={selectedWard}
              candidateCoords={candidateCoords}
              analysisRadius={analysisRadius}
              selectedCategory={selectedCategory}
              aiRecommendation={aiRecommendation}
              scorecard={scorecard}
              shops={nearbyShops}
              provider={placesProvider}
              onNavigateTab={handleNavigateTab}
              onOpenReportModal={() => setIsReportModalOpen(true)}
              onSelectAlternative={(alt) => {
                handleSelectAIAlternative(alt);
                handleNavigateTab('map');
              }}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsModelView
              activeCity={activeCity}
              onCityChange={handleCityChange}
              analysisRadius={analysisRadius}
              onRadiusChange={setAnalysisRadius}
              health={health}
              loadingHealth={loadingHealth}
              healthError={healthError}
              onRefreshHealth={fetchHealth}
              onApiKeySaved={() => setApiKeyTrigger(Date.now())}
              onOpenSavedEvaluations={() => setIsSavedModalOpen(true)}
            />
          )}

          {(activeTab === 'map' || activeTab === 'dashboard' || (!['poi-data', 'scoring', 'recommendations', 'settings'].includes(activeTab))) && (
            <>
              {/* 2-COLUMN SPLIT WORKSPACE: CONTROLS & AI (LEFT) + MAP (RIGHT) */}
              <div className="workspace-grid">
                {/* LEFT COLUMN: Controls, AI Intelligence & Live Regions */}
                <div className="left-control-panel">
                  {/* Site Selection Parameters */}
                  <LocationSelector
                    activeCity={activeCity}
                    onCityChange={handleCityChange}
                    selectedWardId={selectedWard.id}
                    onWardChange={handleWardChange}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    candidateCoords={candidateCoords}
                    analysisRadius={analysisRadius}
                    onAnalyze={handleEvaluate}
                    onSelectHotspot={handleSelectHotspot}
                  />

                  {/* AI Geospatial Suggestion Card */}
                  <AISuggestionPanel
                    recommendation={aiRecommendation}
                    cityName={activeCity.name}
                    category={selectedCategory}
                    wardName={selectedWard.name}
                    onSelectAlternative={handleSelectAIAlternative}
                  />

                  {/* Live Region & Micro-Markets Explorer for Active City */}
                  <CityRegionsExplorer
                    activeCity={activeCity}
                    selectedWardId={selectedWard.id}
                    onSelectRegion={handleWardChange}
                  />
                </div>

                {/* RIGHT COLUMN: Interactive Leaflet Geospatial Canvas */}
                <div className="right-map-panel">
                  {/* Candidate Site Pinned Pill */}
                  <div
                    style={{
                      padding: '10px 16px',
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} color="#ef4444" />
                      <span>
                        <strong>Candidate Site:</strong>{' '}
                        <code style={{ color: '#93c5fd' }}>
                          {candidateCoords.lat.toFixed(5)}° N, {candidateCoords.lng.toFixed(5)}° E
                        </code>{' '}
                        in <strong>{activeCity.name}</strong> (
                        {distanceMeters < 50
                          ? `Center of ${nearestWard.name.split(' ')[0]}`
                          : `${formatDistance(distanceMeters)} from ${nearestWard.name.split(' ')[0]}`}
                        )
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Radius: <strong>{analysisRadius >= 1000 ? `${analysisRadius / 1000} km` : `${analysisRadius} m`}</strong>
                    </span>
                  </div>

                  {/* Interactive Map Component */}
                  <MapView
                    initialCenter={[activeCity.lat, activeCity.lng]}
                    initialZoom={activeCity.defaultZoom}
                    flyToRequest={flyToRequest}
                    candidateLocation={candidateCoords}
                    analysisRadius={analysisRadius}
                    activeCity={activeCity}
                    onCityChange={handleCityChange}
                    onLocationSelect={handleLocationSelect}
                    onRadiusChange={setAnalysisRadius}
                    selectedAreaName={selectedWard.name}
                    businessCategory={selectedCategory}
                    shops={nearbyShops}
                    showRetailStores={showRetailStores}
                    onToggleRetailStores={() => setShowRetailStores(!showRetailStores)}
                  />

                  {/* Stage 3 & 4 Location Suitability Scorecard (Multi-Sector MCDA Engine) */}
                  <SiteScorecardPanel
                    scorecard={scorecard}
                    category={selectedCategory}
                    cityName={activeCity.name}
                    wardName={selectedWard.name}
                    radiusMeters={analysisRadius}
                    onOpenReport={() => setIsReportModalOpen(true)}
                  />

                  {/* Nearby Commercial Shops & Retail POIs Explorer */}
                  <NearbyShopsList
                    shops={nearbyShops}
                    loading={loadingShops}
                    analysisRadius={analysisRadius}
                    cityName={activeCity.name}
                    wardName={selectedWard.name}
                    provider={placesProvider}
                    onSelectShop={handleSelectShop}
                    selectedShopId={selectedShopId}
                    onOpenGoogleConfig={() => setIsGoogleModalOpen(true)}
                    onExpandRadius={setAnalysisRadius}
                  />
                </div>
              </div>

              {/* SYSTEM DIAGNOSTICS & ROADMAP (LOWER SECTION) */}
              <div className="control-card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Server size={15} color="var(--accent-teal)" />
                    Backend Connection Diagnostics (GET /api/health)
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Target: <code>http://localhost:5002/api/health</code>
                  </span>
                </div>

                {loadingHealth ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Querying backend health endpoint...
                  </div>
                ) : healthError ? (
                  <div
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--status-red-bg)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#fca5a5',
                      fontSize: '0.8rem',
                    }}
                  >
                    <strong>Connection Error:</strong> {healthError}. Ensure the Node.js backend is running on port 5002.
                  </div>
                ) : health ? (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '10px',
                      backgroundColor: 'rgba(11, 17, 32, 0.5)',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Status:</span>{' '}
                      <strong style={{ color: 'var(--status-green)' }}>{health.status.toUpperCase()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Default Baseline:</span>{' '}
                      <strong>{health.defaultCity}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Active City:</span>{' '}
                      <strong style={{ color: '#93c5fd' }}>{activeCity.fullName}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>API Version:</span>{' '}
                      <code>{health.version}</code>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Module Cards: Stages 3 to 5 */}
              <div className="section-title-row">
                <h3 className="section-title" style={{ fontSize: '1rem' }}>Active Analysis Pipeline & Models</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  All Stages Operational (Stages 2–5)
                </span>
              </div>

              <div className="cards-grid">
                <PlaceholderCard
                  icon={Layers}
                  title="Stage 3: Multi-Sector POI Extraction"
                  stageBadge="Stage 3 — Operational"
                  isLive={true}
                  statusBadgeText="Live Model • Click to Open Studio"
                  description="Real-time extraction of authentic commercial venues, retail stores, transit hubs, and institutional footfall anchors strictly within the selected buffer."
                  upcomingFeatures={[
                    'Strict Geodesic Haversine Radius Filtering (300m, 500m, 1km, 2km, 3km)',
                    '8 Multi-Sector Anchors (Retail, Dining, Transit, Education, Health, etc.)',
                    'Verified Local Registry Baseline + OpenStreetMap Overpass',
                    'Google Places API (New & Legacy Nearby Search Integration)',
                  ]}
                  actionButton={{
                    label: 'Open Stage 3 POI Explorer',
                    onClick: () => handleNavigateTab('poi-data'),
                    icon: Database,
                  }}
                />

                <PlaceholderCard
                  icon={BarChart}
                  title="Stage 4: Spatial Scoring Engine"
                  stageBadge="Stage 4 — Operational"
                  isLive={true}
                  statusBadgeText="Live Model • Multi-Criteria Decision Analysis"
                  description="Spatial suitability algorithm factoring distance decay, sector synergy, competitor clustering, and transit connectivity from the exact pin point."
                  upcomingFeatures={[
                    'Distance-Decayed Retail Footfall Draw (Max 30 pts)',
                    'Category Market & Dwell Synergy (Max 25 pts)',
                    'Hotelling Competition Health & Agglomeration (Max 20 pts)',
                    'Transit Connectivity & Commercial Density (Max 25 pts)',
                  ]}
                  actionButton={{
                    label: 'Open Stage 4 Scoring Studio',
                    onClick: () => handleNavigateTab('scoring'),
                    icon: BarChart3,
                  }}
                />

                <PlaceholderCard
                  icon={Lightbulb}
                  title="Stage 5: Explainable Recommendations & Reports"
                  stageBadge="Stage 5 — Operational"
                  isLive={true}
                  statusBadgeText="Live Model • Feasibility Dossier & PDF Export"
                  description="Transparent AI recommendations explaining why a location was scored high or low, with spatial SWOT, store format advice, and print/PDF export."
                  upcomingFeatures={[
                    'Explainable AI rationale & location strength cards',
                    'Strategic risks & operational mitigation guidelines',
                    'Alternative micro-market comparisons across Pune, Kolhapur, etc.',
                    'One-click print/PDF dossier export & JSON audit trail',
                  ]}
                  actionButton={{
                    label: 'Open Stage 5 AI Recommendations',
                    onClick: () => handleNavigateTab('recommendations'),
                    icon: FileText,
                  }}
                />
              </div>
            </>
          )}

          {/* Engineering Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 4px',
              color: 'var(--text-dim)',
              fontSize: '0.72rem',
              borderTop: '1px solid var(--border-subtle)',
              marginTop: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Code2 size={13} />
              <span>Geoscope Engine • Leaflet + OpenStreetMap • Multi-City Indian Grid</span>
            </div>
            <div>
              Coordinates: {candidateCoords.lat.toFixed(5)}° N, {candidateCoords.lng.toFixed(5)}° E ({activeCity.name})
            </div>
          </div>
        </main>
      </div>

      {/* Google Maps Platform & Places API Settings Modal */}
      <GoogleMapsConfigModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onKeySaved={() => setApiKeyTrigger(Date.now())}
      />

      {/* Stage 5: Executive Feasibility Report Modal */}
      <ExecutiveReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        scorecard={scorecard}
        category={selectedCategory}
        cityName={activeCity.name}
        wardName={selectedWard.name}
        candidateCoords={candidateCoords}
        radiusMeters={analysisRadius}
        shops={nearbyShops}
        provider={placesProvider}
      />

      {/* MongoDB Saved Evaluations Modal */}
      <SavedEvaluationsModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        activeCity={activeCity}
        selectedWard={selectedWard}
        candidateCoords={candidateCoords}
        analysisRadius={analysisRadius}
        selectedCategory={selectedCategory}
        scorecard={scorecard}
        dbStatus={health?.database}
        onLoadEvaluation={handleLoadEvaluation}
      />
    </div>
  );
};

export default App;
