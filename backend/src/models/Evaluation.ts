import mongoose, { Schema, Document } from 'mongoose';

export interface IEvaluation extends Document {
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
  sectorBreakdown: {
    retail?: number;
    food?: number;
    transit?: number;
    commercial?: number;
    education?: number;
    hospitality?: number;
    healthcare?: number;
    banking?: number;
  };
  totalAnchors: number;
  keyDrivers: string[];
  riskFactors: string[];
  recommendedFormat?: string;
  provider: string;
  notes?: string;
  createdAt: Date;
}

const EvaluationSchema = new Schema<IEvaluation>(
  {
    siteName: {
      type: String,
      required: true,
      trim: true,
    },
    cityName: {
      type: String,
      required: true,
      trim: true,
    },
    wardName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    candidateCoords: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    analysisRadius: {
      type: Number,
      required: true,
      default: 500,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    ratingGrade: {
      type: String,
      required: true,
      enum: ['A+', 'A', 'B', 'C'],
    },
    verdict: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      default: '',
    },
    componentScores: {
      footfallDraw: { type: Number, default: 0 },
      sectorSynergy: { type: Number, default: 0 },
      competitionHealth: { type: Number, default: 0 },
      transitConnectivity: { type: Number, default: 0 },
      commercialDensity: { type: Number, default: 0 },
    },
    sectorBreakdown: {
      retail: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      transit: { type: Number, default: 0 },
      commercial: { type: Number, default: 0 },
      education: { type: Number, default: 0 },
      hospitality: { type: Number, default: 0 },
      healthcare: { type: Number, default: 0 },
      banking: { type: Number, default: 0 },
    },
    totalAnchors: {
      type: Number,
      default: 0,
    },
    keyDrivers: {
      type: [String],
      default: [],
    },
    riskFactors: {
      type: [String],
      default: [],
    },
    recommendedFormat: {
      type: String,
      default: '',
    },
    provider: {
      type: String,
      default: 'Verified Local Registry',
    },
    notes: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for rapid queries by city and recency
EvaluationSchema.index({ cityName: 1, createdAt: -1 });
EvaluationSchema.index({ overallScore: -1 });

export const EvaluationModel = mongoose.model<IEvaluation>('Evaluation', EvaluationSchema);
