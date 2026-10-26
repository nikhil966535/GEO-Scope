import { VERIFIED_LOCAL_PLACES, PlaceSector, LocalVerifiedPlace } from '../data/verifiedLocalPlaces';

export interface PlaceItem {
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
  footfallWeight: number;
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
  center: { lat: number; lng: number };
  radius: number;
  sectorBreakdown: Record<PlaceSector, number>;
  scorecard: SiteScorecard;
  places: PlaceItem[];
}

/**
 * Calculates geodesic distance in meters (Haversine formula)
 */
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Maps Google Places API types to Geoscope multi-sector taxonomy
 */
function mapGoogleTypeToCategory(types: string[] = []): {
  sector: PlaceSector;
  category: string;
  label: string;
  footfallWeight: number;
} {
  const t = types.map((s) => s.toLowerCase());

  // 1. Education Sector (Schools, Colleges, Universities, Libraries)
  if (t.some((x) => ['school', 'secondary_school', 'primary_school', 'university', 'college', 'preschool', 'library'].includes(x))) {
    return { sector: 'education', category: 'school', label: 'School & Education', footfallWeight: 5 };
  }
  // 2. Hospitality Sector (Hotels, Lodging, Resorts)
  if (t.some((x) => ['lodging', 'hotel', 'motel', 'resort_hotel', 'bed_and_breakfast', 'guest_house'].includes(x))) {
    return { sector: 'hospitality', category: 'hotel', label: 'Hotel & Hospitality', footfallWeight: 4 };
  }
  // 3. Healthcare Sector (Hospitals, Clinics, Pharmacies)
  if (t.some((x) => ['hospital', 'doctor', 'medical_clinic', 'physiotherapist'].includes(x))) {
    return { sector: 'healthcare', category: 'hospital', label: 'Hospital & Healthcare', footfallWeight: 5 };
  }
  if (t.some((x) => ['pharmacy', 'drugstore'].includes(x))) {
    return { sector: 'healthcare', category: 'pharmacy', label: 'Pharmacy & Wellness', footfallWeight: 3 };
  }
  // 4. Transit & Mobility Sector
  if (t.some((x) => ['transit_station', 'bus_station', 'train_station', 'subway_station', 'light_rail_station', 'taxi_stand'].includes(x))) {
    return { sector: 'transit', category: 'transit', label: 'Transit Terminal & Hub', footfallWeight: 5 };
  }
  // 5. Food & Dining Sector
  if (t.some((x) => ['cafe', 'coffee_shop', 'tea_house'].includes(x))) {
    return { sector: 'food', category: 'cafe', label: 'Cafe & Coffee Bar', footfallWeight: 4 };
  }
  if (t.some((x) => ['restaurant', 'food', 'fast_food_restaurant', 'meal_takeaway', 'meal_delivery', 'bakery'].includes(x))) {
    return { sector: 'food', category: 'restaurant', label: 'Dining & Restaurant', footfallWeight: 4 };
  }
  // 6. Banking & Financial Sector
  if (t.some((x) => ['bank', 'atm', 'finance', 'accounting'].includes(x))) {
    return { sector: 'banking', category: 'bank', label: 'Banking & Financial', footfallWeight: 3 };
  }
  // 7. Commercial & Offices
  if (t.some((x) => ['corporate_office', 'coworking_space', 'business_park'].includes(x))) {
    return { sector: 'commercial', category: 'office', label: 'Corporate & Offices', footfallWeight: 4 };
  }
  // 8. Retail & Commerce
  if (t.some((x) => ['shopping_mall', 'department_store'].includes(x))) {
    return { sector: 'retail', category: 'mall', label: 'Shopping Mall', footfallWeight: 5 };
  }
  if (t.some((x) => ['supermarket', 'grocery_store', 'convenience_store'].includes(x))) {
    return { sector: 'retail', category: 'supermarket', label: 'Supermarket & FMCG', footfallWeight: 4 };
  }
  if (t.some((x) => ['clothing_store', 'shoe_store', 'jewelry_store'].includes(x))) {
    return { sector: 'retail', category: 'apparel', label: 'Fashion & Apparel', footfallWeight: 3 };
  }
  if (t.some((x) => ['electronics_store', 'cell_phone_store'].includes(x))) {
    return { sector: 'retail', category: 'electronics', label: 'Tech & Electronics', footfallWeight: 3 };
  }

  return { sector: 'retail', category: 'retail', label: 'Commercial Retail', footfallWeight: 2 };
}

/**
 * Computes Multi-Criteria Spatial Suitability Scorecard (0-100)
 * factoring in EVERY shop, retail establishment, and commercial anchor within the selected radius from the pinpoint.
 */
export function computeSiteSuitabilityScore(
  places: PlaceItem[],
  businessCategory: string = 'Cafe & Specialty Coffee',
  radiusMeters: number = 500
): SiteScorecard {
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

  // Nearest anchor to the pin point
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

  // 1. Distance-Decay Footfall Draw (Max 30 pts)
  // Distance decay varies based on whether category is destination-oriented (theaters/malls) vs impulse (cafes/QSR)
  let weightedFootfall = 0;
  places.forEach((p) => {
    const weight = p.footfallWeight || 3;
    const decayFactor = isTheater || isFineDining ? 1.4 : isQSR || isCafe ? 1.05 : 1.15;
    const proximity = Math.max(0.35, 1 - (p.distanceMeters / (radiusMeters * decayFactor)));
    weightedFootfall += weight * proximity;
  });
  let footfallDraw = total > 0 ? Math.min(30, Math.max(6, Math.round(weightedFootfall * 1.35))) : 0;

  // 2. Sector Synergy Score (Max 25 pts)
  // Evaluates complementary commercial fit between target category and surrounding multi-sector anchors
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
    // Theater saturation is severe if >=2 multiplexes already occupy the catchment
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

  // Zero-Anchor Baseline varies by category rather than a flat magic number
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
  if (breakdown.retail > 0) {
    keyDrivers.push(`🛍️ ${breakdown.retail} Commercial Retail & Store(s) driving active customer cross-shopping`);
  }
  if (breakdown.food > 0) {
    keyDrivers.push(`🍽️ ${breakdown.food} Dining & Food Outlet(s) generating continuous shopper foot traffic`);
  }
  if (breakdown.education > 0) {
    keyDrivers.push(`🎓 ${breakdown.education} Educational Institution(s) bringing high student pedestrian volume`);
  }
  if (breakdown.transit > 0) {
    keyDrivers.push(`🚉 ${breakdown.transit} Transit & Mobility Hub(s) supplying steady commuter flow`);
  }
  if (breakdown.hospitality > 0) {
    keyDrivers.push(`🏨 ${breakdown.hospitality} Hotel & Lodging Establishment(s) attracting travelers & diners`);
  }
  if (breakdown.healthcare > 0) {
    keyDrivers.push(`🏥 ${breakdown.healthcare} Healthcare & Pharmacy Anchor(s) active day & night`);
  }
  if (breakdown.banking > 0) {
    keyDrivers.push(`🏛️ ${breakdown.banking} Bank & ATM Branch(es) ensuring daily financial footfall`);
  }
  if (keyDrivers.length === 0) {
    keyDrivers.push(`Quiet local pocket with minimal baseline rental overhead.`);
  }

  const riskFactors: string[] = [];
  if (isTheater && sameCatCompetitors >= 2) {
    riskFactors.push(`High entertainment saturation: ${sameCatCompetitors} established cinema/multiplex venues operate within ${radiusMeters}m.`);
  } else if (sameCatCompetitors >= 4) {
    riskFactors.push(`High category saturation (${sameCatCompetitors} competing venues within ${radiusMeters}m).`);
  }
  if (breakdown.transit === 0) {
    riskFactors.push(`Nearest public transit hub is beyond ${radiusMeters}m.`);
  }
  if (total <= 2) {
    riskFactors.push(`Low commercial establishment count; consider expanding catchment radius to 500m or 1km.`);
  }

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
 * Queries Google Places API (New) https://places.googleapis.com/v1/places:searchNearby
 * covering Education, Hotels, Transit, Healthcare, Food, Retail, and Banking
 */
export async function fetchGooglePlaces(
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
  apiKey: string
): Promise<PlaceItem[]> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) return [];

  // 1. Google Places API (New)
  try {
    const newApiUrl = 'https://places.googleapis.com/v1/places:searchNearby';
    const bodyPayload = {
      includedTypes: [
        'school', 'secondary_school', 'primary_school', 'university', 'library',
        'lodging', 'hotel', 'motel', 'resort_hotel',
        'hospital', 'medical_clinic', 'pharmacy',
        'restaurant', 'cafe', 'coffee_shop', 'bakery', 'fast_food_restaurant',
        'supermarket', 'grocery_store', 'shopping_mall', 'clothing_store', 'electronics_store',
        'transit_station', 'bus_station', 'train_station',
        'bank', 'atm',
        'corporate_office',
      ],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude: centerLat,
            longitude: centerLng,
          },
          radius: Math.min(50000, Math.max(100, radiusMeters)),
        },
      },
    };

    const res = await fetch(newApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': cleanKey,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.regularOpeningHours,places.googleMapsUri',
      },
      body: JSON.stringify(bodyPayload),
    });

    if (res.ok) {
      const data: any = await res.json();
      if (data && data.places && Array.isArray(data.places) && data.places.length > 0) {
        return data.places.map((p: any) => {
          const lat = p.location?.latitude || centerLat;
          const lng = p.location?.longitude || centerLng;
          const dist = getDistanceMeters(centerLat, centerLng, lat, lng);
          const { sector, category, label, footfallWeight } = mapGoogleTypeToCategory(p.types || []);

          return {
            id: `google-${p.id}`,
            name: p.displayName?.text || 'Local Venue',
            sector,
            category,
            categoryLabel: label,
            lat,
            lng,
            distanceMeters: dist,
            rating: typeof p.rating === 'number' ? p.rating : 4.2,
            reviewsCount: typeof p.userRatingCount === 'number' ? p.userRatingCount : 50,
            address: p.formattedAddress || 'Commercial Corridor',
            source: 'Google Places Live' as const,
            isOpenNow: p.regularOpeningHours?.openNow !== false,
            googleMapsUri: p.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${p.id}`,
            placeTypes: p.types,
            footfallWeight,
          };
        })
        .filter((p: PlaceItem) => p.distanceMeters <= radiusMeters)
        .sort((a: PlaceItem, b: PlaceItem) => a.distanceMeters - b.distanceMeters);
      }
    }
  } catch (err) {
    console.warn('[Geoscope Backend] Google Places API (New) call error, falling back to legacy search:', err);
  }

  // 2. Fallback to Google Places API (Legacy Nearby Search)
  try {
    const legacyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${centerLat},${centerLng}&radius=${radiusMeters}&key=${cleanKey}`;
    const res = await fetch(legacyUrl);
    if (res.ok) {
      const data: any = await res.json();
      if (data && data.status === 'OK' && data.results && Array.isArray(data.results)) {
        return data.results.map((p: any) => {
          const lat = p.geometry?.location?.lat || centerLat;
          const lng = p.geometry?.location?.lng || centerLng;
          const dist = getDistanceMeters(centerLat, centerLng, lat, lng);
          const { sector, category, label, footfallWeight } = mapGoogleTypeToCategory(p.types || []);

          return {
            id: `google-legacy-${p.place_id}`,
            name: p.name || 'Commercial Establishment',
            sector,
            category,
            categoryLabel: label,
            lat,
            lng,
            distanceMeters: dist,
            rating: typeof p.rating === 'number' ? p.rating : 4.1,
            reviewsCount: typeof p.user_ratings_total === 'number' ? p.user_ratings_total : 35,
            address: p.vicinity || 'Commercial Corridor',
            source: 'Google Places Live' as const,
            isOpenNow: p.opening_hours?.open_now !== false,
            googleMapsUri: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
            placeTypes: p.types,
            footfallWeight,
          };
        })
        .filter((p: PlaceItem) => p.distanceMeters <= radiusMeters)
        .sort((a: PlaceItem, b: PlaceItem) => a.distanceMeters - b.distanceMeters);
      }
    }
  } catch (err) {
    console.warn('[Geoscope Backend] Legacy Places search error:', err);
  }

  return [];
}

/**
 * Queries OpenStreetMap Nominatim live POI search for real multi-sector venues
 */
export async function fetchOsmNominatimPlaces(
  centerLat: number,
  centerLng: number,
  radiusMeters: number
): Promise<PlaceItem[]> {
  try {
    const latDelta = radiusMeters / 111320;
    const lngDelta = radiusMeters / (111320 * Math.cos((centerLat * Math.PI) / 180));
    const viewbox = `${centerLng - lngDelta},${centerLat + latDelta},${centerLng + lngDelta},${centerLat - latDelta}`;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=school+OR+hotel+OR+hospital+OR+bus+OR+restaurant+OR+shop&viewbox=${viewbox}&bounded=1&limit=25`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2-second timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Geoscope-GIS-Research/1.0 (contact: geoscope@example.com)',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data: any = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          const dist = getDistanceMeters(centerLat, centerLng, lat, lng);
          const rawName = item.display_name.split(',')[0];
          const type = (item.type || '').toLowerCase();

          let sector: PlaceSector = 'retail';
          let cat = 'retail';
          let label = 'Commercial Outlet';
          let weight = 3;

          if (type.includes('school') || type.includes('college')) {
            sector = 'education';
            cat = 'school';
            label = 'School & Education';
            weight = 5;
          } else if (type.includes('hotel') || type.includes('lodging')) {
            sector = 'hospitality';
            cat = 'hotel';
            label = 'Hotel & Stay';
            weight = 4;
          } else if (type.includes('hospital') || type.includes('clinic')) {
            sector = 'healthcare';
            cat = 'hospital';
            label = 'Healthcare Clinic';
            weight = 5;
          } else if (type.includes('bus') || type.includes('station')) {
            sector = 'transit';
            cat = 'transit';
            label = 'Transit Terminal';
            weight = 5;
          } else if (type.includes('restaurant') || type.includes('cafe')) {
            sector = 'food';
            cat = 'restaurant';
            label = 'Dining Venue';
            weight = 4;
          }

          return {
            id: `osm-${item.place_id}`,
            name: rawName || 'Local Institution',
            sector,
            category: cat,
            categoryLabel: label,
            lat,
            lng,
            distanceMeters: dist,
            rating: 4.2,
            reviewsCount: 45,
            address: item.display_name,
            source: 'OpenStreetMap Live' as const,
            isOpenNow: true,
            googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
            footfallWeight: weight,
          };
        }).filter((item) => item.distanceMeters <= radiusMeters)
          .sort((a, b) => a.distanceMeters - b.distanceMeters);
      }
    }
  } catch (err) {
    console.warn('[Geoscope Backend] OSM Nominatim query failed:', err);
  }

  return [];
}

/**
 * Returns genuine, verified real local places from the authentic registry,
 * strictly filtered by geodesic distance within the active catchment radius.
 */
export function fetchVerifiedLocalPlaces(
  centerLat: number,
  centerLng: number,
  radiusMeters: number
): PlaceItem[] {
  const matches: PlaceItem[] = [];

  for (const place of VERIFIED_LOCAL_PLACES) {
    const dist = getDistanceMeters(centerLat, centerLng, place.lat, place.lng);
    if (dist <= radiusMeters) {
      matches.push({
        id: place.id,
        name: place.name,
        sector: place.sector,
        category: place.category,
        categoryLabel: place.categoryLabel,
        lat: place.lat,
        lng: place.lng,
        distanceMeters: dist,
        rating: place.rating,
        reviewsCount: place.reviewsCount,
        address: place.address,
        source: 'Verified Local Registry',
        isOpenNow: place.isOpenNow,
        googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`,
        footfallWeight: place.footfallWeight || 3,
      });
    }
  }

  return matches.sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/**
 * Main Orchestrator:
 * Returns places across all sectors + spatial suitability scorecard.
 */
export async function getNearbyPlaces(params: {
  lat: number;
  lng: number;
  radius: number;
  apiKey?: string;
  businessCategory?: string;
}): Promise<NearbyPlacesResponse> {
  const { lat, lng, radius, apiKey, businessCategory = 'Cafe & Specialty Coffee' } = params;
  const effectiveKey = apiKey || process.env.GOOGLE_MAPS_API_KEY || '';

  let provider: NearbyPlacesResponse['provider'] = 'Verified Local Registry';
  let places: PlaceItem[] = [];

  // 1. Google Places API (Live)
  if (effectiveKey.trim()) {
    const googleResults = await fetchGooglePlaces(lat, lng, radius, effectiveKey);
    if (googleResults.length > 0) {
      provider = 'Google Places Live';
      places = googleResults;
    }
  }

  // 2. OpenStreetMap Live Nominatim (if Google not available or returned 0)
  if (places.length === 0) {
    const osmResults = await fetchOsmNominatimPlaces(lat, lng, radius);
    if (osmResults.length > 0) {
      provider = 'OpenStreetMap Live';
      places = osmResults;
    }
  }

  // 3. Authentic Verified Local Places Registry (distance filtered)
  if (places.length === 0) {
    provider = 'Verified Local Registry';
    places = fetchVerifiedLocalPlaces(lat, lng, radius);
  }

  // Compute Spatial Site Suitability Scorecard
  const scorecard = computeSiteSuitabilityScore(places, businessCategory, radius);

  return {
    provider,
    totalFound: places.length,
    center: { lat, lng },
    radius,
    sectorBreakdown: scorecard.sectorBreakdown,
    scorecard,
    places,
  };
}
