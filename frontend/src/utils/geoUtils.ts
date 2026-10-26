import { CityWard, CITIES_DATA } from '../data/citiesData';

/**
 * Calculates distance in meters between two lat/lng points using the Haversine formula.
 */
export function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
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
 * Finds the closest ward within a given city's wards list.
 */
export function findNearestWard(
  lat: number,
  lng: number,
  wards: CityWard[]
): { ward: CityWard; distanceMeters: number } {
  if (!wards || wards.length === 0) {
    return {
      ward: CITIES_DATA[0].wards[0],
      distanceMeters: 0,
    };
  }

  let closestWard = wards[0];
  let minDistance = Infinity;

  for (const ward of wards) {
    const dist = getDistanceMeters(lat, lng, ward.lat, ward.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestWard = ward;
    }
  }

  return { ward: closestWard, distanceMeters: minDistance };
}

/**
 * Formats distance in a human-readable string (meters or km).
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}
