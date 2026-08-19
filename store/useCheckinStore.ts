'use client';

import { create } from 'zustand';
import { SymptomKey } from '@/types';
import { SYMPTOM_ORDER } from '@/lib/recovery';

const emptySymptoms = (): Record<SymptomKey, number> =>
  SYMPTOM_ORDER.reduce(
    (acc, k) => ({ ...acc, [k]: 0 }),
    {} as Record<SymptomKey, number>
  );

interface CheckinState {
  step: number;
  symptoms: Record<SymptomKey, number>;
  touched: Partial<Record<SymptomKey, boolean>>;
  moodNote: string;
  followedRestrictions: boolean;
  startedAt: number | null;

  begin: () => void;
  setSymptom: (key: SymptomKey, value: number) => void;
  setMoodNote: (note: string) => void;
  setFollowedRestrictions: (v: boolean) => void;
  next: () => void;
  prev: () => void;
  elapsedSeconds: () => number;
  reset: () => void;
}

/**
 * 체크인 입력 상태.
 * 30초 안에 끝내는 것이 이 화면의 목표라 시작 시각을 기록하고,
 * 실제 소요 시간을 서버로 함께 보낸다 (UX 지표로 추적).
 */
export const useCheckinStore = create<CheckinState>((set, get) => ({
  step: 0,
  symptoms: emptySymptoms(),
  touched: {},
  moodNote: '',
  followedRestrictions: true,
  startedAt: null,

  begin: () => set({ startedAt: Date.now(), step: 0 }),

  setSymptom: (key, value) =>
    set((s) => ({
      symptoms: { ...s.symptoms, [key]: value },
      touched: { ...s.touched, [key]: true },
    })),

  setMoodNote: (moodNote) => set({ moodNote }),
  setFollowedRestrictions: (followedRestrictions) => set({ followedRestrictions }),

  next: () => set((s) => ({ step: Math.min(s.step + 1, SYMPTOM_ORDER.length) })),
  prev: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),

  elapsedSeconds: () => {
    const started = get().startedAt;
    return started ? Math.round((Date.now() - started) / 1000) : 0;
  },

  reset: () =>
    set({
      step: 0,
      symptoms: emptySymptoms(),
      touched: {},
      moodNote: '',
      followedRestrictions: true,
      startedAt: null,
    }),
}));
