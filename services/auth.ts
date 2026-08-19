import { ProcedureCategory, RecoveryJourney, User } from '@/types';
import { mockUser } from '@/mock/data';
import { isSupabase } from '@/lib/env';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { toJourney, toUser } from '@/lib/supabase/mappers';
import type { ProfileRow, RecoveryJourneyRow } from '@/lib/supabase/database.types';
import { todayKST } from '@/lib/utils';
import { ApiError, request } from './client';
import { supabaseRepo } from './supabase-repo';
import { session } from './session';

export interface OnboardingInput {
  /** 회복 곡선과 금기 목록을 결정하는 키. 시술 종류마다 다르다. */
  protocolId: string;
  procedureName: string;
  category: ProcedureCategory;
  procedureDate: string; // YYYY-MM-DD
  clinicName: string;
  /** 클리닉 리콜을 위해 기록을 공유할지. 기본값은 항상 false. */
  clinicSharingConsent: boolean;
  checkinReminderTime: string;
  connectWearable: boolean;
}

function supabase() {
  const client = getSupabaseBrowserClient();
  if (!client) throw new ApiError('NO_CLIENT', 'Supabase 클라이언트를 사용할 수 없습니다.');
  return client;
}

export const authService = {
  async getCurrentUser(): Promise<User> {
    if (isSupabase) return supabaseRepo.getCurrentUser();
    return request({
      path: '/auth/me',
      latency: 300,
      mock: () => mockUser,
    });
  },

  async login(email: string, password?: string): Promise<User> {
    if (isSupabase) {
      const { data, error } = await supabase().auth.signInWithPassword({
        email,
        password: password ?? '',
      });
      if (error || !data.user) {
        throw new ApiError('INVALID_CREDENTIALS', '이메일 또는 비밀번호를 확인해 주세요.', 401);
      }
      return supabaseRepo.getCurrentUser();
    }

    return request({
      path: '/auth/login',
      method: 'POST',
      body: { email },
      latency: 600,
      mock: () => ({ ...mockUser, email }),
    });
  },

  async signup(data: {
    email: string;
    name: string;
    password?: string;
    birthYear?: number;
  }): Promise<User> {
    if (isSupabase) {
      const { data: result, error } = await supabase().auth.signUp({
        email: data.email,
        password: data.password ?? '',
        options: { data: { name: data.name } },
      });
      if (error || !result.user) {
        throw new ApiError('SIGNUP_FAILED', error?.message ?? '회원가입에 실패했습니다.');
      }
      // 프로필은 DB 트리거(handle_new_user)가 생성한다.
      const { data: profile } = await supabase()
        .from('profiles')
        .select('*')
        .eq('id', result.user.id)
        .single<ProfileRow>();
      return profile ? toUser(profile) : { ...mockUser, email: data.email, name: data.name };
    }

    return request({
      path: '/auth/signup',
      method: 'POST',
      body: data,
      latency: 700,
      mock: () => ({
        ...mockUser,
        id: `user-${data.email}`,
        email: data.email,
        name: data.name,
        birthYear: data.birthYear,
        connectedWearable: undefined,
        clinicSharingConsent: false,
      }),
    });
  },

  /** 설정 화면에서 바꾼 값 저장. 동의 항목은 여기서만 켜고 끌 수 있다. */
  async updateProfile(patch: {
    checkinReminderTime?: string;
    clinicSharingConsent?: boolean;
    connectedWearable?: User['connectedWearable'] | null;
  }): Promise<User> {
    if (isSupabase) {
      const { data: userData } = await supabase().auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new ApiError('UNAUTHORIZED', '로그인이 필요합니다.', 401);

      const row: Record<string, unknown> = {};
      if (patch.checkinReminderTime !== undefined)
        row.checkin_reminder_time = patch.checkinReminderTime;
      if (patch.clinicSharingConsent !== undefined)
        row.clinic_sharing_consent = patch.clinicSharingConsent;
      if (patch.connectedWearable !== undefined)
        row.connected_wearable = patch.connectedWearable;

      const { error } = await supabase().from('profiles').update(row).eq('id', userId);
      if (error) throw new ApiError('QUERY_FAILED', error.message);
      return supabaseRepo.getCurrentUser();
    }

    return request({
      path: '/auth/me',
      method: 'PATCH',
      body: patch,
      latency: 400,
      mock: () => {
        if (patch.checkinReminderTime !== undefined)
          mockUser.checkinReminderTime = patch.checkinReminderTime;
        if (patch.clinicSharingConsent !== undefined)
          mockUser.clinicSharingConsent = patch.clinicSharingConsent;
        if (patch.connectedWearable !== undefined)
          mockUser.connectedWearable = patch.connectedWearable ?? undefined;
        return { ...mockUser };
      },
    });
  },

  async logout(): Promise<void> {
    if (isSupabase) {
      await supabase().auth.signOut();
    }
  },

  /** 온보딩 = 시술 1건 등록 = 회복 여정 시작 */
  async startJourney(input: OnboardingInput): Promise<RecoveryJourney> {
    if (isSupabase) {
      const { data: userData } = await supabase().auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new ApiError('UNAUTHORIZED', '로그인이 필요합니다.', 401);

      // 동의 항목과 알림 시간은 프로필에 먼저 반영한다.
      await supabase()
        .from('profiles')
        .update({
          clinic_sharing_consent: input.clinicSharingConsent,
          checkin_reminder_time: input.checkinReminderTime,
          connected_wearable: input.connectWearable ? 'apple-health' : null,
        })
        .eq('id', userId);

      const { data, error } = await supabase()
        .from('recovery_journeys')
        .insert({
          user_id: userId,
          protocol_id: input.protocolId,
          procedure_name: input.procedureName,
          category: input.category,
          clinic_name: input.clinicName,
          practitioner_name: '',
          procedure_date: input.procedureDate,
        })
        .select('*')
        .single<RecoveryJourneyRow>();

      if (error || !data) {
        throw new ApiError('JOURNEY_CREATE_FAILED', error?.message ?? '여정 생성에 실패했습니다.');
      }
      return toJourney(data, todayKST());
    }

    return request({
      path: '/journeys',
      method: 'POST',
      body: input,
      latency: 900,
      mock: () =>
        session.startJourney({
          protocolId: input.protocolId,
          procedureName: input.procedureName,
          category: input.category,
          procedureDate: input.procedureDate,
          clinicName: input.clinicName,
        }),
    });
  },
};
