/**
 * 목데이터 모드의 세션 상태.
 *
 * 데모는 D+12 시점의 시나리오(D+8 이탈 사건 포함)로 시작한다.
 * 하지만 사용자가 온보딩에서 자기 시술을 등록하면 그 순간부터는
 * 데모 시드가 아니라 "방금 시작한 빈 여정"이 되어야 한다.
 * 그래야 D+0 사용자가 보는 화면(빈 곡선, 첫 체크인 유도)이 실제로 확인된다.
 *
 * Supabase 모드에서는 이 파일이 쓰이지 않는다 (DB가 같은 역할을 한다).
 *
 * 상태는 브라우저 탭 안에서만 유지된다(새로고침하면 데모 시드로 돌아간다).
 * 실제 사용자별 영속 저장은 Supabase가 담당하므로, 이 모듈은 데모 전용이다.
 */

import { RecoveryJourney } from '@/types';
import { DEMO_TODAY, mockJourney } from '@/mock/data';
import { daysBetween, todayKST } from '@/lib/utils';

interface SessionState {
  journey: RecoveryJourney;
  /** 사용자가 여정을 마쳤는지. 마친 뒤에는 체크인을 더 받지 않는다. */
  completed: boolean;
  /** 데모 시드(체크인 11건, 이탈 알림, 웨어러블 14일)를 쓸지 여부 */
  isDemoSeed: boolean;
  /** 화면의 '오늘'. 데모는 시나리오 재현을 위해 고정일을 쓴다. */
  today: string;
}

const state: SessionState = {
  journey: { ...mockJourney },
  completed: false,
  isDemoSeed: true,
  today: DEMO_TODAY,
};

/**
 * 시드 세대 번호.
 *
 * 스토어가 리스너를 '미리 등록'해 두는 방식은 모듈 로드 순서에 의존한다
 * (온보딩 화면은 checkin/vitals 모듈을 import하지 않으므로 리스너가 없다).
 * 대신 각 스토어가 읽는 시점에 이 번호를 비교해 스스로 다시 초기화한다.
 */
let seedVersion = 0;

export const session = {
  get seedVersion(): number {
    return seedVersion;
  },

  get journey(): RecoveryJourney {
    const currentDay = Math.max(0, daysBetween(state.journey.procedureDate, state.today));
    return {
      ...state.journey,
      currentDay,
      status: state.completed ? 'completed' : state.journey.status,
    };
  },

  get isCompleted(): boolean {
    return state.completed;
  },

  /** 여정 마무리 — 이후 체크인 CTA는 사라지고 새 시술 등록을 안내한다. */
  completeCurrentJourney() {
    state.completed = true;
  },

  get isDemoSeed(): boolean {
    return state.isDemoSeed;
  },

  get today(): string {
    return state.today;
  },

  /** 온보딩 완료 — 데모 시드를 버리고 사용자의 실제 여정으로 교체한다. */
  startJourney(input: {
    protocolId: string;
    procedureName: string;
    category: RecoveryJourney['category'];
    procedureDate: string;
    clinicName: string;
  }): RecoveryJourney {
    state.today = todayKST();
    state.isDemoSeed = false;
    state.completed = false;
    state.journey = {
      ...mockJourney,
      id: 'journey-user',
      protocolId: input.protocolId,
      procedureName: input.procedureName,
      category: input.category,
      procedureDate: input.procedureDate,
      clinicName: input.clinicName,
      practitionerName: '담당 의료진',
      status: 'on-track',
      recoveryProgress: 0,
      deviationScore: 0,
      createdAt: `${state.today}T00:00:00+09:00`,
    };
    seedVersion++;
    return session.journey;
  },

  /** 데모 시드로 되돌린다 (랜딩의 '데모 둘러보기' 진입 시). */
  resetToDemo() {
    state.journey = { ...mockJourney };
    state.isDemoSeed = true;
    state.completed = false;
    state.today = DEMO_TODAY;
    seedVersion++;
  },
};
