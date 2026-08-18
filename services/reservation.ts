import { Reservation } from '@/types';
import { mockReservations } from '@/mock/data';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ReservationInput {
  hospitalId: string;
  hospitalName: string;
  purpose: string;
  date: string;
  time: string;
  patientName: string;
  patientPhone: string;
}

export const reservationService = {
  async getReservations(): Promise<Reservation[]> {
    await delay(300);
    return mockReservations;
  },

  async createReservation(input: ReservationInput): Promise<Reservation> {
    await delay(700);
    const newReservation: Reservation = {
      id: `res-${Date.now()}`,
      userId: 'user-001',
      hospitalId: input.hospitalId,
      hospitalName: input.hospitalName,
      purpose: input.purpose,
      date: input.date,
      time: input.time,
      patientName: input.patientName,
      patientPhone: input.patientPhone,
      status: 'confirmed',
      createdAt: new Date().toISOString().split('T')[0],
    };

    mockReservations.unshift(newReservation);
    return newReservation;
  }
};
