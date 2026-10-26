export interface GeocodingResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  importance: number;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

/**
 * Searches OpenStreetMap Nominatim for locations across India.
 */
export async function searchLocationOSM(query: string): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const encodedQuery = encodeURIComponent(query.trim());
    // countrycodes=in restricts search to India for maximum accuracy
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&countrycodes=in&addressdetails=1&limit=5`;

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Geocoding HTTP error: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('[Geoscope Nominatim] Search failed:', err);
    return [];
  }
}
