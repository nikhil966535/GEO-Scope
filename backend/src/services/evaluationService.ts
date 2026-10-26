import mongoose from 'mongoose';
import { EvaluationModel } from '../models/Evaluation';
import { getDatabaseStatus } from '../db/connection';

export interface EvaluationData {
  id?: string;
  _id?: string;
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

// In-Memory storage fallback when MongoDB is not connected
const IN_MEMORY_EVALUATIONS: EvaluationData[] = [
  {
    id: 'eval-seed-pune-koregaon',
    siteName: 'Koregaon Park Boutique Cafe',
    cityName: 'Pune',
    wardName: 'Koregaon Park (North Main Road)',
    category: 'Cafe & Specialty Coffee',
    candidateCoords: { lat: 18.5362, lng: 73.894 },
    analysisRadius: 1000,
    overallScore: 92,
    ratingGrade: 'A+',
    verdict: 'Prime Commercial Corridors',
    summary: 'Exceptional pedestrian footfall corridor with dense lifestyle dining and student demographics.',
    componentScores: {
      footfallDraw: 28,
      sectorSynergy: 24,
      competitionHealth: 16,
      transitConnectivity: 14,
      commercialDensity: 10,
    },
    sectorBreakdown: {
      food: 14,
      retail: 8,
      transit: 3,
      commercial: 4,
      hospitality: 3,
      education: 2,
    },
    totalAnchors: 34,
    keyDrivers: [
      'High evening and weekend footfall draw from cosmopolitan residents.',
      'Symbiosis & IT campus proximity creates sustained daily impulse coffee orders.',
    ],
    riskFactors: [
      'High real estate lease rental overhead on North Main Road.',
    ],
    recommendedFormat: 'Cozy 40-60 seater with specialty coffee bar & work-friendly WiFi',
    provider: 'Verified Local Registry',
    notes: 'Primary benchmark candidate for Pune west expansion.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'eval-seed-noida-sec18',
    siteName: 'Noida Sector 18 Entertainment Hub',
    cityName: 'Delhi NCR',
    wardName: 'Noida Sector 18 (Atta Market)',
    category: 'Movie Theater & Entertainment Hub',
    candidateCoords: { lat: 28.5708, lng: 77.3261 },
    analysisRadius: 1000,
    overallScore: 86,
    ratingGrade: 'A+',
    verdict: 'High-Density Commercial Hotspot',
    summary: 'Major transit and shopping interchange with DLF Mall of India, Wave Mall, and Metro Station.',
    componentScores: {
      footfallDraw: 29,
      sectorSynergy: 22,
      competitionHealth: 11,
      transitConnectivity: 15,
      commercialDensity: 9,
    },
    sectorBreakdown: {
      retail: 7,
      food: 5,
      transit: 2,
      commercial: 2,
      hospitality: 1,
      healthcare: 1,
    },
    totalAnchors: 18,
    keyDrivers: [
      'Immediate access to Blue Line Metro Station (Noida Sector 18).',
      'Massive weekend impulse crowd from Atta Market and DLF Mall of India.',
    ],
    riskFactors: [
      'High competitor presence: 2 established cinema venues within 1000m.',
    ],
    recommendedFormat: 'Multiplex / boutique 3-5 screen cinema format with gourmet concession lounge',
    provider: 'Verified Local Registry',
    notes: 'Candidate site evaluated in Delhi NCR commercial corridor.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export async function listEvaluations(cityName?: string): Promise<{ evaluations: EvaluationData[]; source: string }> {
  const dbStatus = getDatabaseStatus();

  if (dbStatus.connected) {
    try {
      const query = cityName ? { cityName } : {};
      const docs = await EvaluationModel.find(query).sort({ createdAt: -1 }).limit(50).lean();
      const mapped: EvaluationData[] = docs.map((doc: any) => ({
        id: String(doc._id),
        siteName: doc.siteName,
        cityName: doc.cityName,
        wardName: doc.wardName,
        category: doc.category,
        candidateCoords: doc.candidateCoords,
        analysisRadius: doc.analysisRadius,
        overallScore: doc.overallScore,
        ratingGrade: doc.ratingGrade,
        verdict: doc.verdict,
        summary: doc.summary,
        componentScores: doc.componentScores,
        sectorBreakdown: doc.sectorBreakdown,
        totalAnchors: doc.totalAnchors,
        keyDrivers: doc.keyDrivers,
        riskFactors: doc.riskFactors,
        recommendedFormat: doc.recommendedFormat,
        provider: doc.provider,
        notes: doc.notes,
        createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
      }));

      return {
        evaluations: mapped,
        source: 'MongoDB Database',
      };
    } catch (err: any) {
      console.warn('[EvaluationService] MongoDB query failed, using in-memory store:', err.message);
    }
  }

  // In-Memory Fallback
  const filtered = cityName
    ? IN_MEMORY_EVALUATIONS.filter((e) => e.cityName.toLowerCase() === cityName.toLowerCase())
    : IN_MEMORY_EVALUATIONS;

  return {
    evaluations: [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    source: 'In-Memory Fallback Store',
  };
}

export async function saveEvaluation(data: Partial<EvaluationData>): Promise<{ evaluation: EvaluationData; source: string }> {
  const dbStatus = getDatabaseStatus();

  const recordData = {
    siteName: data.siteName || `${data.category || 'Retail'} Site - ${data.cityName || 'City'}`,
    cityName: data.cityName || 'Unknown City',
    wardName: data.wardName || 'General Ward',
    category: data.category || 'Retail Store',
    candidateCoords: data.candidateCoords || { lat: 18.5204, lng: 73.8567 },
    analysisRadius: data.analysisRadius || 500,
    overallScore: data.overallScore ?? 75,
    ratingGrade: data.ratingGrade || 'B',
    verdict: data.verdict || 'Moderate Commercial Zone',
    summary: data.summary || '',
    componentScores: data.componentScores || {
      footfallDraw: 20,
      sectorSynergy: 18,
      competitionHealth: 15,
      transitConnectivity: 12,
      commercialDensity: 7,
    },
    sectorBreakdown: data.sectorBreakdown || {},
    totalAnchors: data.totalAnchors || 0,
    keyDrivers: data.keyDrivers || [],
    riskFactors: data.riskFactors || [],
    recommendedFormat: data.recommendedFormat || '',
    provider: data.provider || 'Verified Local Registry',
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
  };

  if (dbStatus.connected) {
    try {
      const doc = new EvaluationModel(recordData);
      const saved = await doc.save();
      return {
        evaluation: {
          ...recordData,
          id: String(saved._id),
          createdAt: saved.createdAt.toISOString(),
        },
        source: 'MongoDB Database',
      };
    } catch (err: any) {
      console.warn('[EvaluationService] Failed to save in MongoDB, saving in memory:', err.message);
    }
  }

  // Fallback to in-memory array
  const inMemoryRecord: EvaluationData = {
    ...recordData,
    id: `eval-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };

  IN_MEMORY_EVALUATIONS.unshift(inMemoryRecord);

  return {
    evaluation: inMemoryRecord,
    source: 'In-Memory Fallback Store',
  };
}

export async function deleteEvaluation(id: string): Promise<{ success: boolean; id: string; source: string }> {
  const dbStatus = getDatabaseStatus();

  if (dbStatus.connected && mongoose.Types.ObjectId.isValid(id)) {
    try {
      await EvaluationModel.findByIdAndDelete(id);
      return { success: true, id, source: 'MongoDB Database' };
    } catch (err: any) {
      console.warn('[EvaluationService] Failed to delete in MongoDB:', err.message);
    }
  }

  const idx = IN_MEMORY_EVALUATIONS.findIndex((e) => e.id === id);
  if (idx !== -1) {
    IN_MEMORY_EVALUATIONS.splice(idx, 1);
    return { success: true, id, source: 'In-Memory Fallback Store' };
  }

  return { success: false, id, source: 'Not Found' };
}
