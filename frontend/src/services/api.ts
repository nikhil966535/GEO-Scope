export interface DatabaseStatus {
  connected: boolean;
  status: 'connected' | 'connecting' | 'disconnected' | 'disabled';
  dbName: string | null;
  host: string | null;
  message: string;
}

export interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
  uptime: number;
  version: string;
  defaultCity: string;
  database?: DatabaseStatus;
  features: {
    mapReady: boolean;
    osmOverpassReady: boolean;
    googlePlacesReady?: boolean;
    mongoDbReady?: boolean;
    mlEngineReady: boolean;
  };
}

export interface SavedEvaluationRecord {
  id: string;
  siteName: string;
  cityName: string;
  wardName: string;
  category: string;
  candidateCoords: {
    lat: number;
    lng: number;
  };
  analysisRadius: number;
  overallScore: number;
  ratingGrade: 'A+' | 'A' | 'B' | 'C';
  verdict: string;
  summary: string;
  componentScores: {
    footfallDraw: number;
    sectorSynergy: number;
    competitionHealth: number;
    transitConnectivity: number;
    commercialDensity: number;
  };
  sectorBreakdown: Record<string, number>;
  totalAnchors: number;
  keyDrivers: string[];
  riskFactors: string[];
  recommendedFormat?: string;
  provider: string;
  notes?: string;
  createdAt: string;
}

/**
 * Returns the base API URL (e.g. Render backend URL in production, or '' for local relative proxy)
 */
export function getApiBaseUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string') {
    return envUrl.replace(/\/$/, '');
  }
  return '';
}

/**
 * Checks backend service health and database connection state
 */
export async function checkBackendHealth(): Promise<HealthResponse> {
  const baseUrl = getApiBaseUrl();

  try {
    const response = await fetch(`${baseUrl}/api/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (primaryError) {
    // If running in development and VITE_API_URL wasn't set, try localhost:5002 directly
    if (!baseUrl) {
      try {
        const fallbackResponse = await fetch('http://localhost:5002/api/health');
        if (fallbackResponse.ok) {
          return await fallbackResponse.json();
        }
      } catch {
        // Ignore fallback error and throw primary
      }
    }
    throw primaryError;
  }
}

/**
 * Retrieves saved evaluations from MongoDB (or in-memory store)
 */
export async function fetchSavedEvaluations(city?: string): Promise<{
  evaluations: SavedEvaluationRecord[];
  source: string;
}> {
  const baseUrl = getApiBaseUrl();
  const url = city ? `${baseUrl}/api/evaluations?city=${encodeURIComponent(city)}` : `${baseUrl}/api/evaluations`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch evaluations: HTTP ${res.status}`);
  }
  const data = await res.json();
  return {
    evaluations: data.evaluations || [],
    source: data.source || 'Database',
  };
}

/**
 * Saves a candidate site evaluation record into MongoDB
 */
export async function saveEvaluationToDb(record: Partial<SavedEvaluationRecord>): Promise<{
  evaluation: SavedEvaluationRecord;
  source: string;
}> {
  const baseUrl = getApiBaseUrl();

  const res = await fetch(`${baseUrl}/api/evaluations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(record),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to save evaluation: HTTP ${res.status}`);
  }

  const data = await res.json();
  return {
    evaluation: data.evaluation,
    source: data.source || 'Database',
  };
}

/**
 * Deletes a saved evaluation by ID
 */
export async function deleteSavedEvaluation(id: string): Promise<boolean> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/evaluations/${id}`, {
    method: 'DELETE',
  });
  return res.ok;
}
