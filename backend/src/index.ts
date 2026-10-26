import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getNearbyPlaces } from './services/placesService';
import { connectDatabase, getDatabaseStatus } from './db/connection';
import {
  listEvaluations,
  saveEvaluation,
  deleteEvaluation,
} from './services/evaluationService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// Connect to MongoDB gracefully (falls back to in-memory store if MONGODB_URI not set)
connectDatabase();

// Enable CORS for frontend requests (allowing Vercel, localhost, Render)
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());

// Request logging middleware
app.use((req, _res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Root information endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Geoscope API',
    title: 'Intelligent Business Site Selection and Recommendation System',
    version: '1.0.0',
    description: 'Backend services for geospatial analysis and business location evaluation.',
    healthCheck: '/api/health',
    defaultCity: 'Kolhapur, Maharashtra, India',
    database: getDatabaseStatus(),
    endpoints: [
      'GET /api/health',
      'GET /api/places/nearby',
      'GET /api/evaluations',
      'POST /api/evaluations',
      'DELETE /api/evaluations/:id',
      'GET /api/database/status',
    ],
  });
});

// Health check endpoint required by Stage 1 & Render Health Check Path
app.get('/api/health', (_req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();

  res.status(200).json({
    status: 'healthy',
    message: 'Geoscope backend service is running successfully',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: '1.0.0',
    defaultCity: 'Kolhapur, Maharashtra',
    database: dbStatus,
    features: {
      mapReady: true,
      osmOverpassReady: true,
      googlePlacesReady: !!process.env.GOOGLE_MAPS_API_KEY,
      mongoDbReady: dbStatus.connected,
      mlEngineReady: true,
    },
  });
});

// Database status endpoint
app.get('/api/database/status', (_req: Request, res: Response) => {
  res.json({
    status: 'success',
    database: getDatabaseStatus(),
    timestamp: new Date().toISOString(),
  });
});

// Live Commercial Places & Multi-Sector POIs Endpoint (Stage 3 Extraction & Spatial Scoring)
app.get('/api/places/nearby', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string) || 500;
    const businessCategory = (req.query.category as string) || 'Cafe & Specialty Coffee';
    const apiKey = (req.query.apiKey as string) || (req.headers['x-google-api-key'] as string) || '';

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Valid latitude (lat) and longitude (lng) query parameters are required.',
      });
    }

    const result = await getNearbyPlaces({
      lat,
      lng,
      radius,
      apiKey,
      businessCategory,
    });

    res.json({
      status: 'success',
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error fetching places';
    console.error('[Geoscope Backend] /api/places/nearby error:', message);
    res.status(500).json({
      error: 'Internal Server Error',
      message,
    });
  }
});

// =========================================================================
// MONGODB EVALUATIONS API (SAVED SITES & DOSSIERS)
// =========================================================================

// List all saved site evaluations (MongoDB with In-Memory Fallback)
app.get('/api/evaluations', async (req: Request, res: Response) => {
  try {
    const city = req.query.city as string | undefined;
    const result = await listEvaluations(city);
    res.json({
      status: 'success',
      count: result.evaluations.length,
      source: result.source,
      evaluations: result.evaluations,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to retrieve evaluations',
      message: err.message,
    });
  }
});

// Save a new site evaluation to MongoDB (or In-Memory Fallback)
app.post('/api/evaluations', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body || !body.cityName || !body.category) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'cityName and category are required to save an evaluation.',
      });
    }

    const result = await saveEvaluation(body);
    res.status(201).json({
      status: 'success',
      message: 'Site evaluation saved successfully',
      source: result.source,
      evaluation: result.evaluation,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to save evaluation',
      message: err.message,
    });
  }
});

// Delete a saved evaluation by ID
app.delete('/api/evaluations/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const result = await deleteEvaluation(id);
    if (!result.success) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Evaluation with id "${id}" was not found.`,
      });
    }
    res.json({
      status: 'success',
      message: `Evaluation ${id} deleted successfully.`,
      source: result.source,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to delete evaluation',
      message: err.message,
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl,
    message: 'The requested Geoscope API endpoint does not exist.',
  });
});

// Start listening
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Geoscope Backend running on: http://localhost:${PORT}`);
  console.log(`🩺 Health check endpoint:       http://localhost:${PORT}/api/health`);
  console.log(`📦 MongoDB Status:              ${getDatabaseStatus().message}`);
  console.log(`📍 Default City:                Kolhapur, Maharashtra`);
  console.log(`=======================================================`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[Backend] Port ${PORT} busy, retrying in 1.5s...`);
    setTimeout(() => {
      try {
        server.close();
      } catch (_) {}
      server.listen(PORT);
    }, 1500);
  } else {
    console.error('[Backend] Server listen error:', err);
  }
});

export default app;
