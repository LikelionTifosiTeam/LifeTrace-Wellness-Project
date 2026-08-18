import { DashboardData, SkinProfile, SkinLog, SkinPattern } from '@/types';
import { mockDashboardData, mockSkinProfile, mock14DaySkinLogs, mockSkinPatterns } from '@/mock/data';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const skinService = {
  async getDashboard(): Promise<DashboardData> {
    await delay(400);
    return mockDashboardData;
  },

  async getSkinProfile(): Promise<SkinProfile> {
    await delay(300);
    return mockSkinProfile;
  },

  async getSkinLogs(): Promise<SkinLog[]> {
    await delay(300);
    return mock14DaySkinLogs;
  },

  async getSkinPatterns(): Promise<SkinPattern[]> {
    await delay(400);
    return mockSkinPatterns;
  },

  async addSkinLog(logData: Partial<SkinLog>): Promise<SkinLog> {
    await delay(500);
    const newLog: SkinLog = {
      id: `log-${Date.now()}`,
      userId: 'user-001',
      date: new Date().toISOString().slice(5, 10).replace('-', '/'),
      score: logData.score || 70,
      acneScore: logData.acneScore || 65,
      rednessScore: logData.rednessScore || 50,
      textureScore: logData.textureScore || 70,
      drynessScore: logData.drynessScore || 45,
      oilinessScore: logData.oilinessScore || 55,
      sleepHours: logData.sleepHours || 7,
      stressLevel: logData.stressLevel || 5,
      notes: logData.notes,
    };
    mock14DaySkinLogs.push(newLog);
    return newLog;
  }
};
