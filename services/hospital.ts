import { Hospital, ConcernType } from '@/types';
import { mockHospitals } from '@/mock/data';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface HospitalFilterParams {
  query?: string;
  specialistOnly?: boolean;
  specialty?: ConcernType | string;
  availableToday?: boolean;
}

export const hospitalService = {
  async getHospitals(params?: HospitalFilterParams): Promise<Hospital[]> {
    await delay(350);
    let list = [...mockHospitals];

    if (params?.query) {
      const q = params.query.toLowerCase();
      list = list.filter((h) => h.name.toLowerCase().includes(q) || h.address.toLowerCase().includes(q));
    }
    if (params?.specialistOnly) {
      list = list.filter((h) => h.isSpecialist);
    }
    if (params?.availableToday) {
      list = list.filter((h) => h.availableToday);
    }
    if (params?.specialty && params.specialty !== '전체') {
      list = list.filter((h) => h.specialties.includes(params.specialty as ConcernType));
    }

    return list;
  },

  async getHospitalById(id: string): Promise<Hospital | undefined> {
    await delay(250);
    return mockHospitals.find((h) => h.id === id);
  }
};
