import { AIInsight, TreatmentRelationshipData } from '@/types';
import { mockAIInsights, mockTreatmentRelationship } from '@/mock/data';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const insightService = {
  async getSkinInsights(): Promise<AIInsight[]> {
    await delay(300);
    return mockAIInsights;
  },

  async getTreatmentRelationship(): Promise<TreatmentRelationshipData> {
    await delay(400);
    return mockTreatmentRelationship;
  }
};
