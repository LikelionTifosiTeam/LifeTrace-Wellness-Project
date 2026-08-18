import { SkinAnalysis, ConcernType } from '@/types';
import { mockAnalyses } from '@/mock/data';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface AnalysisInput {
  photoFile?: File | string;
  concerns: ConcernType[];
  severity: number;
  duration: string;
  notes?: string;
  sleepHours?: string;
  stressLevel?: string;
}

export const analysisService = {
  async getLatestAnalysis(): Promise<SkinAnalysis> {
    await delay(300);
    return mockAnalyses[0];
  },

  async getAnalysisById(id: string): Promise<SkinAnalysis | undefined> {
    await delay(300);
    return mockAnalyses.find((a) => a.id === id) || mockAnalyses[0];
  },

  async getAllAnalyses(): Promise<SkinAnalysis[]> {
    await delay(400);
    return mockAnalyses;
  },

  async createSkinAnalysis(input: AnalysisInput): Promise<SkinAnalysis> {
    await delay(1200); // Simulate AI calculation
    const mainConcern = input.concerns[0] || '여드름';
    const newAnalysis: SkinAnalysis = {
      id: `analysis-${Date.now()}`,
      userId: 'user-001',
      date: new Date().toISOString().split('T')[0],
      photoUrl: typeof input.photoFile === 'string' ? input.photoFile : '/mock/skin_photo_recent.jpg',
      mainConcern,
      mainConcernScore: Math.min(60 + input.severity * 3, 92),
      detectedConcerns: [
        {
          id: 'dc1',
          name: mainConcern,
          score: Math.min(60 + input.severity * 3, 92),
          changePercentage: 12,
          description: `입력된 ${input.duration} 증상 기준 유분 및 염증 반응 관찰`,
        },
        {
          id: 'dc2',
          name: '붉은기',
          score: 54,
          changePercentage: -4,
          description: '볼 자극부 진정 양상',
        },
      ],
      changeDetection: {
        period: '최근 14일',
        acneChange: 12,
        sleepChange: input.sleepHours ? -15 : 0,
        stressChange: input.stressLevel ? 10 : 0,
      },
      topFactors: [
        {
          id: 'f1',
          name: '수면 및 생활 지수',
          relevance: '높음',
          description: `작성된 ${input.notes || '생활 데이터'} 기반 컨디션 요인 연관`,
        },
        {
          id: 'f2',
          name: '스트레스 파동',
          relevance: '중간',
          description: '자율 신경 및 분비선 영향 요인',
        },
      ],
      recommendationGuide: '현재 입력 정보를 바탕으로 전문 의료진과의 상담을 우선 고려해볼 수 있습니다.',
      disclaimer: '본 결과는 의료적 진단이 아닌 입력된 사진과 기록을 기반으로 한 참고 정보입니다.',
    };

    mockAnalyses.unshift(newAnalysis);
    return newAnalysis;
  }
};
