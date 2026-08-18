import { TreatmentRecord, ConcernType, TreatmentCategory } from '@/types';
import { mockTreatmentRecords } from '@/mock/data';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface TreatmentInput {
  visitDate: string;
  hospitalName: string;
  mainConcern: ConcernType;
  category: TreatmentCategory;
  procedureNames: string[];
  userNotes: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  satisfactionScore: number;
  outcomeFeedback: string;
}

export const treatmentService = {
  async getTreatmentHistory(): Promise<TreatmentRecord[]> {
    await delay(350);
    return mockTreatmentRecords;
  },

  async getTreatmentById(id: string): Promise<TreatmentRecord | undefined> {
    await delay(250);
    return mockTreatmentRecords.find((r) => r.id === id);
  },

  async createTreatmentRecord(input: TreatmentInput): Promise<TreatmentRecord> {
    await delay(600);
    const newRecord: TreatmentRecord = {
      id: `treat-${Date.now()}`,
      userId: 'user-001',
      visitDate: input.visitDate,
      hospitalName: input.hospitalName,
      mainConcern: input.mainConcern,
      category: input.category,
      procedureNames: input.procedureNames,
      userNotes: input.userNotes,
      beforePhotoUrl: input.beforePhotoUrl,
      afterPhotoUrl: input.afterPhotoUrl,
      satisfactionScore: input.satisfactionScore,
      outcomeFeedback: input.outcomeFeedback,
      createdAt: new Date().toISOString().split('T')[0],
    };

    mockTreatmentRecords.unshift(newRecord);
    return newRecord;
  }
};
