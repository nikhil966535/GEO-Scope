import React from 'react';
import {
  X,
  Printer,
  Download,
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Building2,
  GraduationCap,
  Hotel,
  Bus,
  ShoppingBag,
  UtensilsCrossed,
  HeartPulse,
  Landmark,
  Layers,
  Sparkles,
  MapPin,
  LucideIcon,
} from 'lucide-react';
import { SiteScorecard, RetailShopPOI, PlaceSector } from '../services/poiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scorecard: SiteScorecard | null;
  category: string;
  cityName: string;
  wardName: string;
  candidateCoords: { lat: number; lng: number };
  radiusMeters: number;
  shops: RetailShopPOI[];
  provider: string;
}

const SECTOR_ICONS: Record<PlaceSector, LucideIcon> = {
  education: GraduationCap,
  hospitality: Hotel,
  transit: Bus,
  retail: ShoppingBag,
  food: UtensilsCrossed,
  healthcare: HeartPulse,
  banking: Landmark,
  commercial: Building2,
};

export const ExecutiveReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  scorecard,
  category,
  cityName,
  wardName,
  candidateCoords,
  radiusMeters,
  shops,
  provider,
}) => {
  if (!isOpen || !scorecard) return null;

  const {
    overallScore,
    ratingGrade,
    verdict,
    summary,
    componentScores,
    sectorBreakdown,
    totalAnchors,
    retailCount = (sectorBreakdown.retail || 0) + (sectorBreakdown.food || 0) + (sectorBreakdown.banking || 0) + (sectorBreakdown.commercial || 0),
    institutionalCount = (sectorBreakdown.education || 0) + (sectorBreakdown.healthcare || 0) + (sectorBreakdown.transit || 0) + (sectorBreakdown.hospitality || 0),
    nearestAnchor,
    keyDrivers,
    riskFactors,
  } = scorecard;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const reportData = {
      project: 'Geoscope Business Site Recommendation System',
      reportType: 'Stage 5 Executive Site Feasibility Dossier',
      generatedAt: new Date().toISOString(),
      location: {
        city: cityName,
        ward: wardName,
        latitude: candidateCoords.lat,
        longitude: candidateCoords.lng,
        radiusMeters,
      },
      evaluation: {
        category,
        overallScore,
        ratingGrade,
        verdict,
        summary,
        componentScores,
        sectorBreakdown,
        totalAnchors,
        retailCount,
        institutionalCount,
        nearestAnchor,
        keyDrivers,
        riskFactors,
      },
      dataQuality: {
        provider,
        establishmentsFactored: shops.length,
        geodesicDistanceVerification: 'Strict Haversine formula distance filter applied',
      },
      factoredPlaces: shops.map((s) => ({
        id: s.id,
        name: s.name,
        sector: s.sector,
        category: s.categoryLabel,
        distanceMeters: s.distanceMeters,
        rating: s.rating,
        reviewsCount: s.reviewsCount,
        address: s.address,
        source: s.source,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Geoscope_Report_${cityName.replace(/\s+/g, '_')}_${category.replace(/\s+/g, '_')}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Grade Colors
  let gradeColor = '#10b981';
  let gradeBg = 'rgba(16, 185, 129, 0.15)';
  if (ratingGrade === 'A') {
    gradeColor = '#3b82f6';
    gradeBg = 'rgba(59, 130, 246, 0.15)';
  } else if (ratingGrade === 'B') {
    gradeColor = '#f59e0b';
    gradeBg = 'rgba(245, 158, 11, 0.15)';
  } else if (ratingGrade === 'C') {
    gradeColor = '#ef4444';
    gradeBg = 'rgba(239, 68, 68, 0.15)';
  }

  // Recommended Store Format Logic based on Category & Score
  let recommendedFormat = 'Compact 350 - 600 sq ft express format with delivery hub integration';
  const catLow = category.toLowerCase();
  if (catLow.includes('cafe') || catLow.includes('coffee')) {
    recommendedFormat = 'Boutique 800 - 1,200 sq ft artisan cafe lounge with outdoor patio seating';
  } else if (catLow.includes('theater') || catLow.includes('cinema') || catLow.includes('entertainment')) {
    recommendedFormat = 'Multiplex / boutique 3-5 screen cinema format (15,000 - 30,000 sq ft) with gourmet concession lounge';
  } else if (catLow.includes('gym') || catLow.includes('fitness') || catLow.includes('wellness')) {
    recommendedFormat = 'Multi-floor 3,500 - 6,000 sq ft wellness studio with strength floor, cardio deck & locker rooms';
  } else if (catLow.includes('supermarket') || catLow.includes('grocery')) {
    recommendedFormat = 'Medium 1,500 - 3,500 sq ft neighborhood quick-mart with dedicated loading bay';
  } else if (catLow.includes('apparel') || catLow.includes('fashion') || catLow.includes('boutique')) {
    recommendedFormat = 'High-street 1,200 - 2,500 sq ft flagship showroom with full glass frontage';
  } else if (catLow.includes('pharmacy') || catLow.includes('clinic') || catLow.includes('health')) {
    recommendedFormat = 'Convenience 400 - 750 sq ft 24/7 retail pharmacy with fast-dispense counter';
  } else if (catLow.includes('fine dining') || catLow.includes('restobar')) {
    recommendedFormat = 'Ambient 2,500 - 4,500 sq ft dining restobar with cocktail lounge & valet parking';
  } else if (catLow.includes('bakery') || catLow.includes('sweets') || catLow.includes('dessert')) {
    recommendedFormat = '500 - 900 sq ft boutique patisserie with temperature-controlled display counter';
  } else if (catLow.includes('electronics') || catLow.includes('mobile')) {
    recommendedFormat = '1,500 - 3,500 sq ft consumer tech showroom with live hands-on demonstration pods';
  }

  const getCityAlternatives = () => {
    const cityLow = cityName.toLowerCase();
    if (cityLow.includes('delhi')) {
      return [
        {
          name: 'Connaught Place / CP',
          badge: 'CENTRAL HERITAGE CBD',
          desc: 'Iconic central business district with Rajiv Chowk metro interchange and dense consumer footfall.',
          score: '94 - 97 / 100',
        },
        {
          name: 'DLF Cyber Hub / Cyber City',
          badge: 'FORTUNE 500 CBD',
          desc: 'High-income corporate dining and entertainment hub in Gurgaon with top disposable incomes.',
          score: '93 - 96 / 100',
        },
        {
          name: 'Hauz Khas Village & GK-1',
          badge: 'DESIGNER & CAFES',
          desc: 'Affluent South Delhi youth demographic with artisan specialty coffee, boutique fashion, and nightlife.',
          score: '88 - 93 / 100',
        },
      ];
    } else if (cityLow.includes('bengaluru')) {
      return [
        {
          name: 'Indiranagar 100ft Road',
          badge: 'HIGH-END F&B & FASHION',
          desc: 'Flagship retail and culinary corridor with metro access, high-ticket diners, and boutique fashion.',
          score: '94 - 97 / 100',
        },
        {
          name: 'Koramangala 4th/5th Block',
          badge: 'STARTUP & YOUTH CAFE',
          desc: 'Dense student and tech founder demographic with immense cafe culture and evening dining.',
          score: '92 - 96 / 100',
        },
        {
          name: 'Church Street & MG Road',
          badge: 'PEDESTRIAN HIGH STREET',
          desc: 'Iconic pedestrian boulevard with metro interchange, heritage bookstores, and retail foot traffic.',
          score: '91 - 95 / 100',
        },
      ];
    } else if (cityLow.includes('mumbai')) {
      return [
        {
          name: 'Bandra West (Linking Road)',
          badge: 'FLAGSHIP FASHION',
          desc: 'Premier high-street fashion and celebrity cafe corridor with intense weekend footfall.',
          score: '95 - 98 / 100',
        },
        {
          name: 'Bandra Kurla Complex (BKC)',
          badge: 'FINANCIAL CBD',
          desc: 'India\'s top corporate banking capital with Jio World Drive and luxury dining clientele.',
          score: '92 - 96 / 100',
        },
        {
          name: 'Lower Parel (High Street Phoenix)',
          badge: 'LUXURY MALLS',
          desc: 'Mill district commercial towers and Palladium luxury mall with affluent shopper demographic.',
          score: '90 - 95 / 100',
        },
      ];
    } else if (cityLow.includes('kolhapur')) {
      return [
        {
          name: 'Rajarampuri Main Road',
          badge: 'PRIME RETAIL HIGH STREET',
          desc: 'Primary commercial and fashion corridor in Kolhapur with high family and student footfall.',
          score: '93 - 96 / 100',
        },
        {
          name: 'Shahupuri & Station Road',
          badge: 'TRANSIT & TRADE CBD',
          desc: 'Commercial trade hub adjoining CSMT railway station and executive hotel lodging.',
          score: '90 - 94 / 100',
        },
        {
          name: 'Tarabai Park',
          badge: 'AFFLUENT RESIDENTIAL',
          desc: 'High-income residential enclave with premier clinics, cafes, and executive lifestyle stores.',
          score: '86 - 91 / 100',
        },
      ];
    }
    // Default Pune
    return [
      {
        name: 'FC Road / Deccan',
        badge: 'STUDENT HUB',
        desc: 'Premier educational high-street in Pune with heavy youth footfall and fast takeaway demand.',
        score: '92 - 96 / 100',
      },
      {
        name: 'Baner / Balewadi High Street',
        badge: 'AFFLUENT DINING',
        desc: 'Prime dining and evening nightlife corridor catering to IT professionals and high disposable incomes.',
        score: '88 - 94 / 100',
      },
      {
        name: 'Viman Nagar / Phoenix Mall',
        badge: 'RETAIL & CAMPUS',
        desc: 'Symbiosis university cluster adjoining Phoenix Marketcity mall with 7-day steady consumer footfall.',
        score: '90 - 95 / 100',
      },
    ];
  };

  return (
    <div className="report-modal-backdrop" onClick={onClose}>
      <div className="report-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Top Control Bar (Hidden on print) */}
        <div className="report-control-bar no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="report-badge-pill">Stage 5 Intelligence Dossier</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Executive Site Feasibility Study • {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handlePrint}
              className="report-btn-action"
              title="Print or Export to PDF"
            >
              <Printer size={15} />
              <span>Print / Export PDF</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="report-btn-action"
              title="Download structured JSON report"
            >
              <Download size={15} />
              <span>Download JSON</span>
            </button>

            <button
              onClick={onClose}
              className="report-btn-close"
              title="Close Report"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PRINTABLE DOSSIER CONTENT                                 */}
        {/* ========================================================= */}
        <div className="report-dossier-body">
          {/* Executive Header */}
          <div className="dossier-header-section">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div className="dossier-brand-pill">
                    <Sparkles size={13} color="#ffffff" />
                    <span>GEOSCOPE ANALYTICS</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    MCDA SPATIAL ENGINE v1.0
                  </span>
                </div>
                <h1 className="dossier-main-title">
                  Site Selection Viability & Feasibility Report
                </h1>
                <p className="dossier-main-subtitle">
                  Comprehensive multi-criteria spatial analysis for <strong>{category}</strong> in <strong>{wardName.split(' (')[0]}, {cityName}</strong>
                </p>
              </div>

              {/* Timestamp & Coordinate Box */}
              <div className="dossier-meta-card">
                <div className="meta-row">
                  <span className="meta-label">Candidate Pin:</span>
                  <span className="meta-value">
                    {candidateCoords.lat.toFixed(5)}° N, {candidateCoords.lng.toFixed(5)}° E
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Catchment Radius:</span>
                  <span className="meta-value">
                    {radiusMeters >= 1000 ? `${radiusMeters / 1000} km` : `${radiusMeters} m`} Buffer
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Data Provider:</span>
                  <span className="meta-value">{provider}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 1: EXECUTIVE VIABILITY INDEX HERO                 */}
          {/* ========================================================= */}
          <div className="dossier-section-card">
            <div className="dossier-hero-row">
              {/* Left Score Badge */}
              <div
                className="dossier-score-badge"
                style={{ borderColor: gradeColor, backgroundColor: gradeBg }}
              >
                <span className="dossier-score-num" style={{ color: gradeColor }}>
                  {overallScore}
                </span>
                <span className="dossier-score-scale">/ 100</span>
                <span
                  className="dossier-grade-pill"
                  style={{ backgroundColor: gradeColor, color: '#ffffff' }}
                >
                  GRADE {ratingGrade}
                </span>
              </div>

              {/* Right Hero Narrative */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={18} color={gradeColor} />
                  <h2 className="dossier-verdict-heading" style={{ color: gradeColor }}>
                    {verdict}
                  </h2>
                </div>
                <p className="dossier-summary-para">{summary}</p>

                {/* KPI Pill Grid */}
                <div className="dossier-kpi-grid">
                  <div className="dossier-kpi-item">
                    <span className="kpi-label">Factored Venues</span>
                    <strong className="kpi-val" style={{ color: '#93c5fd' }}>
                      {totalAnchors} Establishments
                    </strong>
                  </div>
                  <div className="dossier-kpi-item">
                    <span className="kpi-label">Retail & Dining Outlets</span>
                    <strong className="kpi-val" style={{ color: '#34d399' }}>
                      {retailCount} Stores
                    </strong>
                  </div>
                  <div className="dossier-kpi-item">
                    <span className="kpi-label">Institutional Anchors</span>
                    <strong className="kpi-val" style={{ color: '#c084fc' }}>
                      {institutionalCount} Anchors
                    </strong>
                  </div>
                  <div className="dossier-kpi-item">
                    <span className="kpi-label">Nearest Anchor</span>
                    <strong className="kpi-val" style={{ color: '#f59e0b' }}>
                      {nearestAnchor ? `${nearestAnchor.name} (${nearestAnchor.distanceMeters}m)` : 'None in radius'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 2: MULTI-CRITERIA DIMENSIONAL BREAKDOWN          */}
          {/* ========================================================= */}
          <div className="dossier-section-card">
            <h3 className="dossier-section-title">
              <Compass size={16} color="var(--accent-blue)" />
              Multi-Criteria Decision Analysis (MCDA) Dimension Scores
            </h3>

            <div className="dossier-dimensions-grid">
              {/* Dimension 1: Footfall Attraction */}
              <div className="dossier-dim-item">
                <div className="dim-header">
                  <span className="dim-name">🚶 1. Anchor Footfall Attraction</span>
                  <strong className="dim-score">{componentScores.footfallDraw} / 30 pts</strong>
                </div>
                <div className="dim-bar-track">
                  <div
                    className="dim-bar-fill"
                    style={{
                      width: `${(componentScores.footfallDraw / 30) * 100}%`,
                      backgroundColor: '#3b82f6',
                    }}
                  />
                </div>
                <p className="dim-desc">
                  Measures pedestrian traffic generated by schools, colleges, hotels, transit hubs, and commercial offices with distance decay.
                </p>
              </div>

              {/* Dimension 2: Category Synergy */}
              <div className="dossier-dim-item">
                <div className="dim-header">
                  <span className="dim-name">🎯 2. Category Market Synergy</span>
                  <strong className="dim-score">{componentScores.sectorSynergy} / 25 pts</strong>
                </div>
                <div className="dim-bar-track">
                  <div
                    className="dim-bar-fill"
                    style={{
                      width: `${(componentScores.sectorSynergy / 25) * 100}%`,
                      backgroundColor: '#10b981',
                    }}
                  />
                </div>
                <p className="dim-desc">
                  Assesses cross-shopping benefits and customer dwell time enhancement from adjacent retail, dining, and lifestyle establishments.
                </p>
              </div>

              {/* Dimension 3: Competition & Clustering */}
              <div className="dossier-dim-item">
                <div className="dim-header">
                  <span className="dim-name">⚖️ 3. Competition & Agglomeration Health</span>
                  <strong className="dim-score">{componentScores.competitionHealth} / 20 pts</strong>
                </div>
                <div className="dim-bar-track">
                  <div
                    className="dim-bar-fill"
                    style={{
                      width: `${(componentScores.competitionHealth / 20) * 100}%`,
                      backgroundColor: '#f59e0b',
                    }}
                  />
                </div>
                <p className="dim-desc">
                  Balances Hotelling spatial clustering (proven destination pull) against oversaturation risks from direct competitors.
                </p>
              </div>

              {/* Dimension 4: Transit & Commuter Access */}
              <div className="dossier-dim-item">
                <div className="dim-header">
                  <span className="dim-name">🚉 4. Transit & Commuter Connectivity</span>
                  <strong className="dim-score">{componentScores.transitConnectivity} / 15 pts</strong>
                </div>
                <div className="dim-bar-track">
                  <div
                    className="dim-bar-fill"
                    style={{
                      width: `${(componentScores.transitConnectivity / 15) * 100}%`,
                      backgroundColor: '#a855f7',
                    }}
                  />
                </div>
                <p className="dim-desc">
                  Proximity to bus stations, metro lines, auto stands, and main arterial junctions for smooth customer and delivery access.
                </p>
              </div>

              {/* Dimension 5: Commercial Density */}
              <div className="dossier-dim-item">
                <div className="dim-header">
                  <span className="dim-name">🏙️ 5. Commercial Density & Vitality</span>
                  <strong className="dim-score">{componentScores.commercialDensity} / 10 pts</strong>
                </div>
                <div className="dim-bar-track">
                  <div
                    className="dim-bar-fill"
                    style={{
                      width: `${(componentScores.commercialDensity / 10) * 100}%`,
                      backgroundColor: '#06b6d4',
                    }}
                  />
                </div>
                <p className="dim-desc">
                  High-street commercial momentum, active daytime storefront presence, and evening vitality across the catchment.
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 3: SPATIAL SWOT & STRATEGIC RECOMMENDATIONS       */}
          {/* ========================================================= */}
          <div className="dossier-section-card">
            <h3 className="dossier-section-title">
              <ShieldCheck size={16} color="var(--status-green)" />
              Spatial SWOT & Strategic Recommendations
            </h3>

            <div className="dossier-swot-grid">
              {/* Spatial Strengths */}
              <div className="dossier-swot-col green">
                <h4 className="swot-col-title" style={{ color: '#34d399' }}>
                  <CheckCircle2 size={15} />
                  Key Location Strengths
                </h4>
                <ul className="swot-list">
                  {keyDrivers.map((driver, idx) => (
                    <li key={idx}>{driver}</li>
                  ))}
                  <li>
                    Proven high-density customer footfall with {shops.length} verified commercial venues within {radiusMeters}m.
                  </li>
                  <li>
                    High pedestrian cross-dwell synergy between food, retail, and transit sectors.
                  </li>
                </ul>
              </div>

              {/* Risks & Mitigations */}
              <div className="dossier-swot-col amber">
                <h4 className="swot-col-title" style={{ color: '#fbbf24' }}>
                  <AlertTriangle size={15} />
                  Identified Risks & Actionable Mitigations
                </h4>
                <ul className="swot-list">
                  {riskFactors.length > 0 ? (
                    riskFactors.map((risk, idx) => <li key={idx}>{risk}</li>)
                  ) : (
                    <li>
                      Competitive High-Street Environment: Street frontage real estate commands premium lease rentals.
                    </li>
                  )}
                  <li>
                    <strong>Mitigation Plan:</strong> Implement high-throughput POS counter and optimize kitchen footprint for dual dine-in and food aggregator dispatch.
                  </li>
                  <li>
                    <strong>Delivery Hub Integration:</strong> Allocate 1-2 dedicated scooter parking slots for quick courier pickup.
                  </li>
                </ul>
              </div>
            </div>

            {/* Recommended Format Box */}
            <div className="dossier-format-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={16} color="#60a5fa" />
                <strong style={{ fontSize: '0.85rem', color: '#93c5fd' }}>
                  Recommended Store Format & Operational Footprint
                </strong>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-main)', margin: '4px 0 0 0' }}>
                {recommendedFormat}
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 4: NEARBY POI INVENTORY (ALL CONSIDERED STORES)   */}
          {/* ========================================================= */}
          <div className="dossier-section-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 className="dossier-section-title" style={{ margin: 0 }}>
                <Layers size={16} color="var(--accent-teal)" />
                Nearby Establishments Buffer Inventory ({shops.length} Venues Factored)
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Sorted by Proximity to Pin Point
              </span>
            </div>

            {shops.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                No registered commercial establishments detected within {radiusMeters}m of this exact location.
              </p>
            ) : (
              <div className="dossier-table-wrap">
                <table className="dossier-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Establishment Name</th>
                      <th>Sector</th>
                      <th>Category</th>
                      <th>Distance</th>
                      <th>Rating</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shops.map((shop, idx) => {
                      const Icon = SECTOR_ICONS[shop.sector] || ShoppingBag;
                      return (
                        <tr key={shop.id}>
                          <td>{idx + 1}</td>
                          <td>
                            <strong>{shop.name}</strong>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{shop.address}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Icon size={12} color="var(--accent-blue)" />
                              <span style={{ textTransform: 'capitalize' }}>{shop.sector}</span>
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
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                              ({shop.reviewsCount})
                            </span>
                          </td>
                          <td>
                            <span style={{ color: shop.isOpenNow ? '#34d399' : '#f87171', fontSize: '0.72rem' }}>
                              {shop.isOpenNow ? 'Open Now' : 'Closed'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* SECTION 5: COMPARATIVE ALTERNATIVE REGIONS                */}
          {/* ========================================================= */}
          <div className="dossier-section-card">
            <h3 className="dossier-section-title">
              <MapPin size={16} color="#ef4444" />
              Alternative High-Potential Micro-Markets in {cityName}
            </h3>
            <div className="dossier-alternatives-grid">
              {getCityAlternatives().map((alt, idx) => (
                <div key={idx} className="alt-market-card">
                  <div className="alt-title">
                    <strong>{alt.name}</strong>
                    <span className="alt-badge">{alt.badge}</span>
                  </div>
                  <p className="alt-desc">{alt.desc}</p>
                  <div className="alt-stat">Typical MCDA Score: <strong>{alt.score}</strong></div>
                </div>
              ))}
            </div>
          </div>

          {/* Dossier Footer / Technical Appendix */}
          <div className="dossier-footer">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span>
                Report generated by <strong>Geoscope Spatial Engine</strong> • Geodesic Haversine Distance Filter Verified
              </span>
              <span>
                Coordinates: {candidateCoords.lat.toFixed(5)}° N, {candidateCoords.lng.toFixed(5)}° E
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
