import { User, SkinProfile } from '@/types';
import { mockUser, mockSkinProfile } from '@/mock/data';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  async getCurrentUser(): Promise<User> {
    await delay(300);
    return mockUser;
  },

  async login(email: string): Promise<User> {
    await delay(500);
    return {
      ...mockUser,
      email,
    };
  },

  async signup(data: Partial<User>): Promise<User> {
    await delay(600);
    return {
      id: `user-${Date.now()}`,
      email: data.email || 'user@example.com',
      name: data.name || '신규사용자',
      birthYear: data.birthYear || 2000,
      createdAt: new Date().toISOString().split('T')[0],
    };
  },

  async saveOnboardingProfile(profile: Partial<SkinProfile>): Promise<SkinProfile> {
    await delay(600);
    return {
      ...mockSkinProfile,
      ...profile,
    };
  }
};
