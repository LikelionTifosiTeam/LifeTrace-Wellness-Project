export type ConcernType = 
  | '여드름' 
  | '붉은기' 
  | '색소' 
  | '모공' 
  | '피부결' 
  | '건조함' 
  | '유분' 
  | '탄력' 
  | '주름' 
  | '흉터'
  | '미용 시술'
  | '피부 질환 상담'
  | '기타';

export interface User {
  id: string;
  email: string;
  name: string;
  birthYear?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  skinProfileId?: string;
  createdAt: string;
}

export interface SkinProfile {
  id: string;
  userId: string;
  concerns: ConcernType[];
  primaryConcern: ConcernType;
  hospitalExperience: boolean;
  recentVisitPeriod?: string;
  primaryTreatments?: string[];
  procedureExperience?: string[];
  usageGoal: string;
  createdAt: string;
}

export interface SkinLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  score: number; // 0~100
  acneScore: number;
  rednessScore: number;
  textureScore: number;
  drynessScore: number;
  oilinessScore: number;
  sleepHours?: number;
  stressLevel?: number; // 1~10
  notes?: string;
  images?: string[];
}

export interface SkinConcernItem {
  id: string;
  name: ConcernType;
  score: number; // 0~100 severity or level
  changePercentage: number; // e.g. +18, -5
  description: string;
}

export interface AIFactor {
  id: string;
  name: string;
  relevance: '높음' | '중간' | '낮음';
  description: string;
}

export interface SkinAnalysis {
  id: string;
  userId: string;
  date: string;
  photoUrl?: string;
  mainConcern: ConcernType;
  mainConcernScore: number;
  detectedConcerns: SkinConcernItem[];
  changeDetection: {
    period: string; // e.g. '최근 14일'
    acneChange: number;
    sleepChange: number;
    stressChange: number;
  };
  topFactors: AIFactor[];
  recommendationGuide: string;
  disclaimer: string;
}

export interface AIInsight {
  id: string;
  userId: string;
  date: string;
  title: string;
  summary: string;
  factorList: string[];
  recommendedAction: string;
  actionRoute?: string;
}

export interface ProcedureInfo {
  id: string;
  name: string;
  purpose: string;
  features: string;
  recoveryInfo: string;
}

export interface Hospital {
  id: string;
  name: string;
  isSpecialist: boolean; // 피부과 전문의 여부
  rating: number; // e.g. 4.8
  reviewCount: number;
  distance: string; // e.g. '450m'
  address: string;
  phone: string;
  businessHours: string;
  specialties: ConcernType[];
  procedures: ProcedureInfo[];
  imageUrl: string;
  availableToday: boolean;
}

export interface Reservation {
  id: string;
  userId: string;
  hospitalId: string;
  hospitalName: string;
  purpose: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  patientName: string;
  patientPhone: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  createdAt: string;
}

export type TreatmentCategory = '진료' | '치료' | '시술' | '피부 분석';

export interface TreatmentRecord {
  id: string;
  userId: string;
  visitDate: string; // YYYY-MM-DD
  hospitalName: string;
  mainConcern: ConcernType;
  category: TreatmentCategory;
  procedureNames: string[];
  userNotes: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  satisfactionScore: number; // 1~5
  outcomeFeedback: string;
  createdAt: string;
}

export interface SkinPattern {
  id: string;
  title: string;
  correlationDescription: string;
  factor1: string;
  factor2: string;
  impactLevel: '높음' | '중간' | '낮음';
  disclaimer: string;
}

export interface RelationshipNode {
  id: string;
  label: string;
  type: 'concern' | 'treatment' | 'outcome';
  date?: string;
}

export interface RelationshipEdge {
  from: string;
  to: string;
  relationText: string;
}

export interface TreatmentRelationshipData {
  nodes: RelationshipNode[];
  edges: RelationshipEdge[];
  summaryExplanation: string;
  disclaimer: string;
}

export interface DashboardData {
  user: User;
  todaySkinStatus: {
    score: number;
    statusText: string; // e.g. '최근 기록 기준 안정적'
    trendPercentage: number; // e.g. +8
  };
  aiInsight: {
    title: string;
    summary: string;
    actionText: string;
  };
  todayGuide: {
    actionText: string;
    badgeText: string;
  };
  recentSkinTrend: {
    date: string;
    skinScore: number;
    acne: number;
    redness: number;
  }[];
  skinJourneyPreview: {
    id: string;
    date: string;
    title: string;
    concern: string;
    category: string;
  }[];
  recommendedHospitals: Hospital[];
}
