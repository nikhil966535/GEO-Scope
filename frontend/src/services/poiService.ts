import { getDistanceMeters } from '../utils/geoUtils';
import { VERIFIED_LOCAL_PLACES } from '../data/verifiedLocalPlaces';
import { getApiBaseUrl } from './api';

export type PlaceSector =
  | 'education'    // Schools, Colleges, Coaching, Libraries
  | 'hospitality'  // Hotels, Lodging, Resorts, Guest Houses
  | 'healthcare'   // Hospitals, Clinics, Pharmacies, Diagnostics
  | 'retail'       // Supermarkets, Malls, Apparel, Electronics, Groceries
  | 'food'         // Restaurants, Cafes, Bakeries, Food Courts
  | 'transit'      // Bus Stations, Railway Station, Auto Stands
  | 'banking'      // Banks, ATMs, Co-operatives
  | 'commercial';  // Offices, IT Parks, Complexes

export interface RetailShopPOI {
  id: string;
  name: string;
  sector: PlaceSector;
  category: string;
  categoryLabel: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  rating: number;
  reviewsCount: number;
  address: string;
  source: 'Google Places Live' | 'OpenStreetMap Live' | 'Verified Local Registry';
  isOpenNow: boolean;
  googleMapsUri?: string;
  placeTypes?: string[];
  footfallWeight?: number;
}

export interface SiteScorecard {
  overallScore: number;           // 0 - 100
  ratingGrade: 'A+' | 'A' | 'B' | 'C';
  verdict: string;
  summary: string;
  componentScores: {
    footfallDraw: number;          // max 30
    sectorSynergy: number;         // max 25
    competitionHealth: number;     // max 20
    transitConnectivity: number;   // max 15
    commercialDensity: number;     // max 10
  };
  sectorBreakdown: Record<PlaceSector, number>;
  totalAnchors: number;
  retailCount: number;
  institutionalCount: number;
  nearestAnchor?: {
    name: string;
    distanceMeters: number;
    categoryLabel: string;
    sector: PlaceSector;
  };
  keyDrivers: string[];
  riskFactors: string[];
}

export interface NearbyPlacesResponse {
  provider: 'Google Places Live' | 'OpenStreetMap Live' | 'Verified Local Registry';
  totalFound: number;
  center?: { lat: number; lng: number };
  radius?: number;
  sectorBreakdown: Record<PlaceSector, number>;
  scorecard: SiteScorecard;
  places: RetailShopPOI[];
}

// Client-side verified local places fallback with all 8 sectors from unified registry
const CLIENT_FALLBACK_PLACES: Omit<RetailShopPOI, 'distanceMeters'>[] = VERIFIED_LOCAL_PLACES.map((p) => ({
  id: p.id,
  name: p.name,
  sector: p.sector,
  category: p.category,
  categoryLabel: p.categoryLabel,
  lat: p.lat,
  lng: p.lng,
  rating: p.rating,
  reviewsCount: p.reviewsCount,
  address: p.address,
  source: 'Verified Local Registry' as const,
  isOpenNow: p.isOpenNow,
  googleMapsUri: "https://www.google.com/maps/search/?api=1&query=" + p.lat + "," + p.lng,
  footfallWeight: p.footfallWeight,
}));

/**
 * Client-side Spatial Scoring Engine fallback (if backend is offline)
 */
function computeClientScorecard(places: RetailShopPOI[], businessCategory: string, radiusMeters: number): SiteScorecard {
  const breakdown: Record<PlaceSector, number> = {
    education: 0,
    hospitality: 0,
    healthcare: 0,
    retail: 0,
    food: 0,
    transit: 0,
    banking: 0,
    commercial: 0,
  };

  places.forEach((p) => {
    if (breakdown[p.sector] !== undefined) {
      breakdown[p.sector]++;
    }
  });

  const total = places.length;
  const catLower = businessCategory.toLowerCase();

  const retailCount = breakdown.retail + breakdown.food + breakdown.banking + breakdown.commercial;
  const institutionalCount = breakdown.education + breakdown.healthcare + breakdown.transit + breakdown.hospitality;

  // Nearest anchor to pin point
  const sortedByDist = [...places].sort((a, b) => a.distanceMeters - b.distanceMeters);
  const nearestAnchor = sortedByDist.length > 0 ? {
    name: sortedByDist[0].name,
    distanceMeters: sortedByDist[0].distanceMeters,
    categoryLabel: sortedByDist[0].categoryLabel,
    sector: sortedByDist[0].sector,
  } : undefined;

  // Category Detection
  const isCafe = catLower.includes('cafe') || catLower.includes('coffee');
  const isQSR = catLower.includes('qsr') || catLower.includes('quick service') || catLower.includes('fast food');
  const isTheater = catLower.includes('theater') || catLower.includes('cinema') || catLower.includes('entertainment') || catLower.includes('multiplex');
  const isPharmacy = catLower.includes('pharmacy') || catLower.includes('health') || catLower.includes('clinic');
  const isFashion = catLower.includes('fashion') || catLower.includes('apparel') || catLower.includes('boutique');
  const isSupermarket = catLower.includes('supermarket') || catLower.includes('grocery') || catLower.includes('essentials');
  const isGym = catLower.includes('gym') || catLower.includes('fitness') || catLower.includes('wellness');
  const isFineDining = catLower.includes('fine dining') || catLower.includes('restobar') || catLower.includes('lounge');
  const isBakery = catLower.includes('bakery') || catLower.includes('sweets') || catLower.includes('dessert') || catLower.includes('patisserie');
  const isElectronics = catLower.includes('electronics') || catLower.includes('mobile') || catLower.includes('gadget');

  // 1. Distance-decay weighted footfall
  let weightedFootfall = 0;
  places.forEach((p) => {
    const w = p.footfallWeight || 3;
    const decayFactor = isTheater || isFineDining ? 1.4 : isQSR || isCafe ? 1.05 : 1.15;
    const proximity = Math.max(0.35, 1 - (p.distanceMeters / (radiusMeters * decayFactor)));
    weightedFootfall += w * proximity;
  });
  const footfallDraw = total > 0 ? Math.min(30, Math.max(6, Math.round(weightedFootfall * 1.35))) : 0;

  // 2. Sector Synergy Score (Max 25 pts)
  let sectorSynergy = 0;
  if (total > 0) {
    if (isCafe) {
      sectorSynergy = 10 + (breakdown.retail >= 1 ? 6 : 0) + (breakdown.education >= 1 ? 5 : 0) + (breakdown.transit >= 1 ? 4 : 0) + (breakdown.commercial >= 1 ? 3 : 0);
    } else if (isQSR) {
      sectorSynergy = 11 + (breakdown.transit >= 1 ? 6 : 0) + (breakdown.retail >= 1 ? 5 : 0) + (breakdown.education >= 1 ? 4 : 0) + (breakdown.commercial >= 1 ? 3 : 0);
    } else if (isTheater) {
      sectorSynergy = 8 + (breakdown.retail >= 1 ? 7 : 0) + (breakdown.food >= 2 ? 6 : 0) + (breakdown.transit >= 1 ? 5 : 0) + (breakdown.hospitality >= 1 ? 3 : 0);
    } else if (isPharmacy) {
      sectorSynergy = 10 + (breakdown.healthcare >= 1 ? 8 : 0) + (breakdown.transit >= 1 ? 5 : 0) + (breakdown.retail >= 1 ? 3 : 0) + (breakdown.banking >= 1 ? 2 : 0);
    } else if (isFashion) {
      sectorSynergy = 9 + (breakdown.retail >= 2 ? 8 : 0) + (breakdown.food >= 1 ? 4 : 0) + (breakdown.hospitality >= 1 ? 4 : 0) + (breakdown.banking >= 1 ? 2 : 0);
    } else if (isSupermarket) {
      sectorSynergy = 10 + (breakdown.transit >= 1 ? 6 : 0) + (breakdown.banking >= 1 ? 5 : 0) + (breakdown.healthcare >= 1 ? 4 : 0) + (breakdown.retail >= 1 ? 3 : 0);
    } else if (isGym) {
      sectorSynergy = 9 + (breakdown.commercial >= 1 ? 7 : 0) + (breakdown.healthcare >= 1 ? 5 : 0) + (breakdown.food >= 1 ? 4 : 0);
    } else if (isFineDining) {
      sectorSynergy = 8 + (breakdown.hospitality >= 1 ? 8 : 0) + (breakdown.commercial >= 1 ? 5 : 0) + (breakdown.retail >= 1 ? 4 : 0);
    } else if (isBakery) {
      sectorSynergy = 10 + (breakdown.food >= 1 ? 6 : 0) + (breakdown.retail >= 1 ? 5 : 0) + (breakdown.transit >= 1 ? 4 : 0);
    } else if (isElectronics) {
      sectorSynergy = 9 + (breakdown.retail >= 2 ? 8 : 0) + (breakdown.banking >= 1 ? 4 : 0) + (breakdown.transit >= 1 ? 4 : 0);
    } else {
      sectorSynergy = 10 + Math.min(15, Math.round(retailCount * 2));
    }
    sectorSynergy = Math.min(25, sectorSynergy);
  }

  // 3. Competition Health & Agglomeration (Max 20 pts)
  let sameCatCompetitors = 0;
  if (isCafe) {
    sameCatCompetitors = places.filter((p) => p.category === 'cafe' || p.categoryLabel.toLowerCase().includes('coffee')).length;
  } else if (isQSR) {
    sameCatCompetitors = places.filter((p) => p.categoryLabel.toLowerCase().includes('qsr') || p.name.toLowerCase().includes('subway') || p.name.toLowerCase().includes('burger') || p.name.toLowerCase().includes('mcdonald')).length;
  } else if (isTheater) {
    sameCatCompetitors = places.filter((p) => p.category === 'theater' || p.categoryLabel.toLowerCase().includes('cinema') || p.categoryLabel.toLowerCase().includes('multiplex')).length;
  } else if (isPharmacy) {
    sameCatCompetitors = places.filter((p) => p.category === 'pharmacy').length;
  } else if (isFashion) {
    sameCatCompetitors = places.filter((p) => p.category === 'apparel' || p.categoryLabel.toLowerCase().includes('fashion')).length;
  } else if (isSupermarket) {
    sameCatCompetitors = places.filter((p) => p.category === 'supermarket' || p.categoryLabel.toLowerCase().includes('grocery')).length;
  } else if (isGym) {
    sameCatCompetitors = places.filter((p) => p.category === 'gym' || p.categoryLabel.toLowerCase().includes('fitness') || p.name.toLowerCase().includes('fitness') || p.name.toLowerCase().includes('gym')).length;
  } else if (isFineDining) {
    sameCatCompetitors = places.filter((p) => p.category === 'restaurant' && !p.categoryLabel.toLowerCase().includes('qsr')).length;
  } else if (isBakery) {
    sameCatCompetitors = places.filter((p) => p.category === 'bakery' || p.categoryLabel.toLowerCase().includes('bakery')).length;
  } else if (isElectronics) {
    sameCatCompetitors = places.filter((p) => p.category === 'electronics').length;
  } else {
    sameCatCompetitors = places.filter((p) => p.category === 'retail').length;
  }

  let competitionHealth = 15;
  if (total === 0) {
    competitionHealth = 5;
  } else if (isTheater) {
    if (sameCatCompetitors >= 2) competitionHealth = 10;
    else if (sameCatCompetitors === 1) competitionHealth = 15;
    else competitionHealth = 20;
  } else if (isGym) {
    if (sameCatCompetitors >= 2) competitionHealth = 12;
    else if (sameCatCompetitors === 1) competitionHealth = 17;
    else competitionHealth = 20;
  } else if (sameCatCompetitors >= 1 && sameCatCompetitors <= 2) {
    competitionHealth = 20; // Proven demand cluster
  } else if (sameCatCompetitors === 0 && total >= 3) {
    competitionHealth = 18; // Opportunity gap
  } else if (sameCatCompetitors >= 3 && sameCatCompetitors <= 4) {
    competitionHealth = 14; // Competitive cluster
  } else if (sameCatCompetitors > 4) {
    competitionHealth = 9; // High saturation
  }

  // 4. Transit & Commuter Connectivity (Max 15 pts)
  let transitConnectivity = 0;
  const closestTransit = places.find((p) => p.sector === 'transit');
  if (closestTransit) {
    if (closestTransit.distanceMeters <= 150) transitConnectivity = 15;
    else if (closestTransit.distanceMeters <= 350) transitConnectivity = 13;
    else if (closestTransit.distanceMeters <= 600) transitConnectivity = 11;
    else transitConnectivity = 9;
  } else if (retailCount >= 4) {
    transitConnectivity = 8;
  } else if (total > 0) {
    transitConnectivity = 5;
  } else {
    transitConnectivity = 2;
  }

  // 5. Commercial Density & Vitality (Max 10 pts)
  let commercialDensity = 0;
  if (total >= 10) commercialDensity = 10;
  else if (total >= 7) commercialDensity = 9;
  else if (total >= 4) commercialDensity = 7;
  else if (total >= 2) commercialDensity = 5;
  else if (total === 1) commercialDensity = 3;

  const categoryZeroBase: Record<string, number> = {
    theater: 8,
    gym: 11,
    finedining: 10,
    fashion: 12,
    cafe: 14,
    qsr: 15,
    supermarket: 16,
    pharmacy: 18,
    bakery: 14,
    electronics: 12,
  };
  const activeKey = isTheater ? 'theater' : isGym ? 'gym' : isFineDining ? 'finedining' : isFashion ? 'fashion' : isPharmacy ? 'pharmacy' : isSupermarket ? 'supermarket' : isQSR ? 'qsr' : 'cafe';
  const overallScore = total === 0
    ? (categoryZeroBase[activeKey] || 14)
    : Math.min(98, Math.max(22, footfallDraw + sectorSynergy + competitionHealth + transitConnectivity + commercialDensity));

  let ratingGrade: SiteScorecard['ratingGrade'] = 'B';
  let verdict = 'Moderate Commercial Potential';
  let summary = `This site scores ${overallScore}/100 for ${businessCategory} based on ${total} verified commercial shops and anchors within ${radiusMeters}m of the pin point.`;

  if (total === 0) {
    ratingGrade = 'C';
    verdict = 'Low Commercial Density Pocket';
    summary = `No active commercial venues or retail anchors detected within ${radiusMeters}m of this exact pin point for ${businessCategory}. Try expanding radius to 1km or selecting a main high-street corridor.`;
  } else if (overallScore >= 85) {
    ratingGrade = 'A+';
    verdict = 'Prime Flagship Commercial Site';
    summary = `Top-tier commercial site for ${businessCategory} with high footfall draw from ${retailCount} active retail & dining establishments and ${institutionalCount} institutional anchors.`;
  } else if (overallScore >= 72) {
    ratingGrade = 'A';
    verdict = 'High-Viability Retail Location';
    summary = `Strong commercial positioning for ${businessCategory} with healthy consumer traffic and proven retail density around this pin point.`;
  } else if (overallScore < 55) {
    ratingGrade = 'C';
    verdict = 'Developing / Low Footfall Zone';
    summary = `Limited retail establishment density for ${businessCategory}. Best suited for neighborhood convenience or consider expanding catchment radius.`;
  }

  const keyDrivers: string[] = [];
  if (nearestAnchor) {
    keyDrivers.push(`📍 Nearest Anchor: "${nearestAnchor.name}" located just ${nearestAnchor.distanceMeters}m from the pin point`);
  }
  if (breakdown.retail > 0) keyDrivers.push(`🛍️ ${breakdown.retail} Commercial Retail & Store(s) driving active customer cross-shopping`);
  if (breakdown.food > 0) keyDrivers.push(`🍽️ ${breakdown.food} Dining & Food Establishments drawing daily footfall`);
  if (breakdown.education > 0) keyDrivers.push(`🎓 ${breakdown.education} Educational Institution(s) bringing high student foot traffic`);
  if (breakdown.transit > 0) keyDrivers.push(`🚉 ${breakdown.transit} Transit & Mobility Node(s) providing continuous commuter flow`);
  if (breakdown.hospitality > 0) keyDrivers.push(`🏨 ${breakdown.hospitality} Hotel & Lodging Establishment(s) attracting travelers & diners`);
  if (breakdown.healthcare > 0) keyDrivers.push(`🏥 ${breakdown.healthcare} Healthcare & Pharmacy Anchor(s) active day & night`);
  if (breakdown.banking > 0) keyDrivers.push(`🏛️ ${breakdown.banking} Bank & ATM Branch(es) ensuring daily financial footfall`);

  if (keyDrivers.length === 0) keyDrivers.push(`Quiet local pocket with low initial rental overhead.`);

  const riskFactors: string[] = [];
  if (isTheater && sameCatCompetitors >= 2) {
    riskFactors.push(`High entertainment saturation: ${sameCatCompetitors} established cinema/multiplex venues operate within ${radiusMeters}m.`);
  } else if (sameCatCompetitors >= 4) {
    riskFactors.push(`High category saturation (${sameCatCompetitors} competing venues within ${radiusMeters}m).`);
  }
  if (breakdown.transit === 0) riskFactors.push(`Nearest public transit station is beyond ${radiusMeters}m.`);
  if (total <= 2) riskFactors.push(`Low commercial establishment count; consider expanding catchment radius to 500m or 1km.`);

  return {
    overallScore,
    ratingGrade,
    verdict,
    summary,
    componentScores: {
      footfallDraw,
      sectorSynergy,
      competitionHealth,
      transitConnectivity,
      commercialDensity,
    },
    sectorBreakdown: breakdown,
    totalAnchors: total,
    retailCount,
    institutionalCount,
    nearestAnchor,
    keyDrivers,
    riskFactors,
  };
}

/**
 * Fetches real multi-sector POIs (Schools, Hotels, Retail, Food, Transit, Healthcare)
 * and calculates the Spatial Site Suitability Scorecard.
 */
export async function fetchNearbyShops(
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
  _cityName: string,
  _wardName: string,
  businessCategory: string = 'Cafe & Specialty Coffee'
): Promise<NearbyPlacesResponse> {
  const apiKey = localStorage.getItem('GEOSCOPE_GOOGLE_MAPS_API_KEY') || '';

  // 1. Query Backend /api/places/nearby endpoint
  try {
    const params = new URLSearchParams({
      lat: String(centerLat),
      lng: String(centerLng),
      radius: String(radiusMeters),
      category: businessCategory,
    });
    if (apiKey.trim()) {
      params.append('apiKey', apiKey.trim());
    }

    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/places/nearby?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.places)) {
        return {
          provider: data.provider || (apiKey ? 'Google Places Live' : 'OpenStreetMap Live'),
          totalFound: data.totalFound ?? data.places.length,
          center: data.center,
          radius: data.radius,
          sectorBreakdown: data.sectorBreakdown || {
            education: 0, hospitality: 0, healthcare: 0, retail: 0, food: 0, transit: 0, banking: 0, commercial: 0,
          },
          scorecard: data.scorecard || computeClientScorecard(data.places, businessCategory, radiusMeters),
          places: data.places,
        };
      }
    }
  } catch (err) {
    console.warn('[Geoscope] Backend places endpoint unreachable, using client verified places registry:', err);
  }

  // 2. Client-side verified local registry fallback
  const filtered: RetailShopPOI[] = [];
  for (const p of CLIENT_FALLBACK_PLACES) {
    const dist = getDistanceMeters(centerLat, centerLng, p.lat, p.lng);
    if (dist <= radiusMeters) {
      filtered.push({
        ...p,
        distanceMeters: dist,
        googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`,
      });
    }
  }

  const sortedPlaces = filtered.sort((a, b) => a.distanceMeters - b.distanceMeters);
  const scorecard = computeClientScorecard(sortedPlaces, businessCategory, radiusMeters);

  return {
    provider: 'Verified Local Registry',
    totalFound: sortedPlaces.length,
    sectorBreakdown: scorecard.sectorBreakdown,
    scorecard,
    places: sortedPlaces,
  };
}
