'use client';

import { ClinicMember, ProcedureCategory, RecoveryJourney, User } from '@/types';
import { toJourney, toUser } from '@/lib/supabase/mappers';
import type {
  ClinicMemberRow,
  ProfileRow,
  RecoveryJourneyRow,
} from '@/lib/supabase/database.types';
import { todayKST } from '@/lib/utils';
import { DEMO_ACCOUNTS } from '@/lib/demo-accounts';
import { ApiError, db, requireUserId } from './supabase';

/** 심사용 시연 계정인지 */
function isDemoAccount(email: string): boolean {
  return email === DEMO_ACCOUNTS.user.email || email === DEMO_ACCOUNTS.clinic.email;
}

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
}

export const authService = {
  async getCurrentUser(): Promise<User> {
    const userId = await requireUserId();
    const { data, error } = await db()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single<ProfileRow>();
    if (error || !data) throw new ApiError('PROFILE_NOT_FOUND', '프로필을 찾을 수 없습니다.', 404);
    return toUser(data);
  },

  /**
   * 이 계정이 클리닉(의료진) 계정인지 확인한다.
   * 의료진이면 환자 화면 대신 리콜 대시보드로 보낸다.
   */
  async getClinicMembership(): Promise<ClinicMember | null> {
    const { data: userData } = await db().auth.getUser();
    if (!userData.user) return null;

    const { data, error } = await db()
      .from('clinic_members')
      .select('*, clinics(name)')
      .eq('user_id', userData.user.id)
      .maybeSingle<ClinicMemberRow & { clinics: { name: string } | null }>();

    if (error || !data) return null;
    return {
      userId: data.user_id,
      clinicId: data.clinic_id,
      clinicName: data.clinics?.name ?? '클리닉',
      displayName: data.display_name,
      role: data.role,
    };
  },

  async login(email: string, password: string): Promise<{ isClinic: boolean }> {
    const { error } = await db().auth.signInWithPassword({ email, password });
    if (error) {
      throw new ApiError('INVALID_CREDENTIALS', '이메일 또는 비밀번호를 확인해 주세요.', 401);
    }
    const membership = await authService.getClinicMembership();
    return { isClinic: Boolean(membership) };
  },

  /**
   * 회원가입.
   *
   * 프로젝트에 이메일 확인이 켜져 있으면 signUp이 세션을 주지 않는다.
   * 그 경우 앱으로 밀어 넣으면 사용자가 이유도 모른 채 막히므로,
   * 세션 발급 여부를 그대로 돌려주고 화면이 안내하게 한다.
   */
  async signup(input: {
    email: string;
    name: string;
    password: string;
  }): Promise<{ needsEmailConfirmation: boolean }> {
    const { data, error } = await db().auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { name: input.name } },
    });
    if (error || !data.user) {
      throw new ApiError('SIGNUP_FAILED', error?.message ?? '회원가입에 실패했습니다.');
    }

    if (!data.session) {
      return { needsEmailConfirmation: true };
    }

    // 프로필은 DB 트리거(handle_new_user)가 만든다. 이름만 확실히 반영한다.
    await db().from('profiles').update({ name: input.name }).eq('id', data.user.id);
    return { needsEmailConfirmation: false };
  },

  async logout(): Promise<void> {
    await db().auth.signOut();
  },

  /**
   * 내 기록 전체 삭제.
   *
   * RLS가 본인 행만 통과시키므로 클라이언트에서 안전하게 지울 수 있다.
   * 외래키가 cascade로 걸려 있어 여정을 지우면 체크인·알림·아카이브가 함께 사라지지만,
   * 남는 것이 없도록 테이블별로 명시해 지운다.
   *
   * 심사·시연 계정은 다음 사람이 같은 시나리오를 봐야 하므로 삭제를 막는다.
   */
  async deleteAllData(): Promise<void> {
    const userId = await requireUserId();
    const user = await authService.getCurrentUser();

    if (isDemoAccount(user.email)) {
      throw new ApiError(
        'DEMO_ACCOUNT_PROTECTED',
        '시연용 계정은 삭제할 수 없습니다. 다음 참가자도 같은 화면을 봐야 하기 때문입니다.',
        403
      );
    }

    // 자식 → 부모 순서로 지운다.
    await db().from('journey_archives').delete().eq('user_id', userId);
    await db().from('recovery_alerts').delete().eq('user_id', userId);
    await db().from('care_cards').delete().eq('user_id', userId);
    await db().from('daily_checkins').delete().eq('user_id', userId);
    await db().from('daily_vitals').delete().eq('user_id', userId);
    await db().from('recovery_journeys').delete().eq('user_id', userId);

    await db().auth.signOut();
  },

  /** 설정 화면에서 바꾼 값 저장. 동의 항목은 여기서만 켜고 끌 수 있다. */
  async updateProfile(patch: {
    checkinReminderTime?: string;
    clinicSharingConsent?: boolean;
  }): Promise<User> {
    const userId = await requireUserId();
    const row: Record<string, unknown> = {};
    if (patch.checkinReminderTime !== undefined) {
      row.checkin_reminder_time = patch.checkinReminderTime;
    }
    if (patch.clinicSharingConsent !== undefined) {
      row.clinic_sharing_consent = patch.clinicSharingConsent;
    }

    const { error } = await db().from('profiles').update(row).eq('id', userId);
    if (error) throw new ApiError('QUERY_FAILED', '설정을 저장하지 못했습니다.');
    return authService.getCurrentUser();
  },

  /** 온보딩 = 시술 1건 등록 = 회복 여정 시작 */
  async startJourney(input: OnboardingInput): Promise<RecoveryJourney> {
    const userId = await requireUserId();

    await db()
      .from('profiles')
      .update({
        clinic_sharing_consent: input.clinicSharingConsent,
        checkin_reminder_time: input.checkinReminderTime,
      })
      .eq('id', userId);

    // 등록한 클리닉 이름이 이미 있으면 연결한다 (리콜 대상이 된다).
    const { data: clinic } = await db()
      .from('clinics')
      .select('id')
      .eq('name', input.clinicName.trim())
      .maybeSingle<{ id: string }>();

    const { data, error } = await db()
      .from('recovery_journeys')
      .insert({
        user_id: userId,
        protocol_id: input.protocolId,
        procedure_name: input.procedureName,
        category: input.category,
        clinic_id: clinic?.id ?? null,
        clinic_name: input.clinicName,
        practitioner_name: '담당 의료진',
        procedure_date: input.procedureDate,
      })
      .select('*')
      .single<RecoveryJourneyRow>();

    if (error || !data) {
      throw new ApiError('JOURNEY_CREATE_FAILED', error?.message ?? '여정 생성에 실패했습니다.');
    }
    return toJourney(data, todayKST());
  },
};
