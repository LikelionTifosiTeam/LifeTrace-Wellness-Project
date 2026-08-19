/**
 * AfterGlow Mock Dataset
 *
 * 주의: 시술명·시술일·방문 병원은 개인정보보호법상 민감정보에 해당한다.
 * 이 파일의 모든 데이터는 실제 고객 데이터가 아닌 임의 생성 더미이며,
 * 실명/실제 병원명과 무관하다.
 */

import {
  DailyCheckin,
  EnvironmentSnapshot,
  JourneyArchiveEntry,
  RecoveryAlert,
  RecoveryCorrelation,
  RecoveryJourney,
  SymptomKey,
  SymptomMeta,
  User,
  WearableSnapshot,
} from '@/types';
import { SYMPTOM_ORDER } from '@/lib/recovery';
import { addDays } from '@/lib/utils';
import { liftingProtocol, TOTAL_DAYS } from './protocols';

export * from './protocols';

// 데모 고정 기준일. 실제 서비스에서는 서버 시간을 사용한다.
export const DEMO_TODAY = '2026-08-19';
export const PROCEDURE_DATE = '2026-08-07'; // T+0 → 오늘은 D+12

// ---------------------------------------------------------------------------
// 증상 척도 정의 — 사진 없이 탭 5단계로만 입력하기 위한 문장 라벨
// ---------------------------------------------------------------------------

export const symptomMeta: SymptomMeta[] = [
  {
    key: 'swelling',
    label: '붓기',
    description: '얼굴 윤곽이 평소보다 부어 보이는 정도',
    scaleLabels: [
      '없음 — 평소와 같음',
      '거의 없음 — 나만 아는 정도',
      '보통 — 사진에서 티가 남',
      '심함 — 남이 알아봄',
      '매우 심함 — 눈뜨기 불편',
    ],
  },
  {
    key: 'redness',
    label: '붉은기',
    description: '시술 부위의 홍조·열감',
    scaleLabels: [
      '없음',
      '옅은 홍조 — 화장으로 가려짐',
      '보통 — 맨얼굴에서 뚜렷',
      '심함 — 화장으로도 안 가려짐',
      '매우 심함 — 열감 동반',
    ],
  },
  {
    key: 'pain',
    label: '통증',
    description: '누르거나 표정을 지을 때의 불편감',
    scaleLabels: [
      '없음',
      '누를 때만 살짝',
      '가만히 있어도 은근함',
      '일상에 방해됨',
      '진통제가 필요함',
    ],
  },
  {
    key: 'peeling',
    label: '각질',
    description: '피부가 일어나거나 벗겨지는 정도',
    scaleLabels: [
      '없음',
      '미세한 가루 각질',
      '부분적으로 일어남',
      '넓은 부위가 벗겨짐',
      '진물·딱지 동반',
    ],
  },
  {
    key: 'tightness',
    label: '당김',
    description: '피부가 조이거나 뻣뻣한 느낌',
    scaleLabels: [
      '없음',
      '세안 직후에만',
      '하루 종일 은근함',
      '표정 지을 때 불편',
      '움직이기 어려울 정도',
    ],
  },
];

export const symptomMetaMap = Object.fromEntries(
  symptomMeta.map((m) => [m.key, m])
) as Record<SymptomKey, SymptomMeta>;

// ---------------------------------------------------------------------------
// 케어 프로토콜 — 종이 리포트를 대체하는 규칙 집합
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 사용자
// ---------------------------------------------------------------------------

export const mockUser: User = {
  id: 'user-001',
  email: 'demo@afterglow.kr',
  name: '김서연',
  birthYear: 1994,
  gender: 'female',
  checkinReminderTime: '21:30',
  connectedWearable: 'apple-health',
  clinicSharingConsent: true,
  createdAt: '2026-08-07',
};

// ---------------------------------------------------------------------------
// 체크인 14일치 (D+0 ~ D+12). D+9는 의도적으로 비움 (미기록 상태 UI 확인용)
// ---------------------------------------------------------------------------

/** 실제 사람의 회복은 곡선을 정확히 따르지 않는다. 시나리오를 손으로 심어둔다. */
const checkinScenario: Record<number, Record<SymptomKey, number>> = {
  0: { swelling: 3, redness: 3, pain: 2, peeling: 0, tightness: 2 },
  1: { swelling: 4, redness: 3, pain: 2, peeling: 0, tightness: 3 },
  2: { swelling: 3, redness: 2, pain: 2, peeling: 0, tightness: 3 },
  3: { swelling: 2, redness: 2, pain: 1, peeling: 1, tightness: 3 },
  4: { swelling: 2, redness: 1, pain: 1, peeling: 1, tightness: 2 },
  5: { swelling: 1, redness: 1, pain: 1, peeling: 1, tightness: 2 },
  6: { swelling: 1, redness: 1, pain: 0, peeling: 1, tightness: 2 },
  7: { swelling: 1, redness: 1, pain: 0, peeling: 1, tightness: 2 },
  // D+8: 야근 3일 + 회식 → 붓기 재상승. 이탈 감지가 걸리는 지점
  8: { swelling: 3, redness: 2, pain: 1, peeling: 1, tightness: 2 },
  // D+9: 체크인 없음
  10: { swelling: 2, redness: 2, pain: 1, peeling: 0, tightness: 2 },
  11: { swelling: 1, redness: 1, pain: 0, peeling: 0, tightness: 1 },
  // D+12(오늘): 아직 기록 전 — 오늘 화면의 체크인 CTA가 노출되는 상태
};

export const mockCheckins: DailyCheckin[] = Object.entries(checkinScenario).map(
  ([dayStr, symptoms]) => {
    const day = Number(dayStr);
    const date = addDays(PROCEDURE_DATE, day);
    return {
      id: `checkin-${day}`,
      journeyId: 'journey-001',
      date,
      day,
      symptoms,
      moodNote:
        day === 8
          ? '이번 주 야근이 많았고 어제 회식까지 겹쳤어요. 아침에 얼굴이 다시 부었습니다.'
          : day === 11
          ? '이제 확실히 편해졌어요. 턱선이 조금 정리된 느낌.'
          : undefined,
      photoUrl: day % 7 === 0 ? `/mock/progress-d${day}.jpg` : undefined,
      followedRestrictions: day !== 8,
      durationSeconds: 22 + (day % 5) * 4,
      createdAt: `${date}T21:${30 + (day % 20)}:00+09:00`,
    };
  }
);

// ---------------------------------------------------------------------------
// 회복 여정
// ---------------------------------------------------------------------------

export const mockJourney: RecoveryJourney = {
  id: 'journey-001',
  userId: 'user-001',
  protocolId: liftingProtocol.id,
  procedureName: liftingProtocol.procedureName,
  category: '리프팅',
  clinicName: '웰니스하우스 강남 클리닉',
  practitionerName: '박지훈 원장',
  procedureDate: PROCEDURE_DATE,
  currentDay: 12,
  status: 'on-track',
  recoveryProgress: 0, // 엔진이 계산해 덮어쓴다
  deviationScore: 0,
  createdAt: `${PROCEDURE_DATE}T15:20:00+09:00`,
};

// ---------------------------------------------------------------------------
// 웨어러블 14일 — D+6~8에 수면 부족 구간을 심어 이탈과 인과가 이어지게 한다
// ---------------------------------------------------------------------------

const sleepSeries = [7.8, 6.9, 7.2, 7.5, 7.1, 6.4, 5.2, 4.9, 5.4, 6.8, 7.4, 7.9, 8.1];
const hrvSeries = [54, 51, 53, 55, 52, 47, 41, 38, 43, 49, 55, 58, 60];
const restingHrSeries = [61, 63, 62, 60, 62, 66, 71, 73, 69, 64, 61, 59, 58];
const stepsSeries = [6200, 5400, 7100, 8300, 6900, 4200, 3100, 2800, 5100, 7600, 8900, 9400, 7200];

export const mockWearables: WearableSnapshot[] = sleepSeries.map((sleep, i) => ({
  date: addDays(PROCEDURE_DATE, i),
  source: 'apple-health',
  sleepHours: sleep,
  sleepQuality: Math.round(Math.min(100, sleep * 11 + hrvSeries[i] * 0.3)),
  hrvMs: hrvSeries[i],
  restingHr: restingHrSeries[i],
  steps: stepsSeries[i],
}));

// ---------------------------------------------------------------------------
// 환경 14일
// ---------------------------------------------------------------------------

const uvSeries = [5, 6, 8, 7, 4, 3, 6, 9, 8, 5, 4, 7, 8];
const humiditySeries = [62, 58, 51, 47, 55, 68, 60, 44, 38, 42, 57, 49, 36];
const tempSeries = [29, 31, 33, 32, 28, 26, 30, 34, 33, 30, 28, 31, 32];

export const mockEnvironments: EnvironmentSnapshot[] = uvSeries.map((uv, i) => ({
  date: addDays(PROCEDURE_DATE, i),
  uvIndex: uv,
  humidity: humiditySeries[i],
  temperature: tempSeries[i],
  fineDust: (['좋음', '보통', '보통', '나쁨'] as const)[i % 4],
}));

// ---------------------------------------------------------------------------
// 이탈 알림 (D+8 사건)
// ---------------------------------------------------------------------------

export const mockAlerts: RecoveryAlert[] = [
  {
    id: 'alert-001',
    journeyId: 'journey-001',
    date: addDays(PROCEDURE_DATE, 8),
    day: 8,
    level: 'watch',
    title: '붓기가 예상보다 다시 올라왔어요',
    detail:
      'D+8 기준 붓기 기대 수준은 0.6인데 3으로 기록되었습니다. 직전 3일 평균 수면이 5.2시간, HRV가 41ms로 평소보다 낮아 회복 여력이 떨어진 상태입니다.',
    triggeredBy: [{ symptom: 'swelling', expected: 0.6, actual: 3 }],
    recommendedAction:
      '오늘은 냉찜질과 수분 섭취를 늘리고, 내일 체크인까지 지켜본 뒤에도 같으면 클리닉에 공유해 보세요.',
    sharedWithClinic: true,
    clinicResponse: {
      respondedAt: `${addDays(PROCEDURE_DATE, 9)}T10:12:00+09:00`,
      practitionerName: '박지훈 원장',
      message:
        '기록 확인했습니다. 통증 증가 없이 붓기만 올라온 패턴이라 수면 부족과 음주 영향으로 보입니다. 2~3일 내 가라앉지 않거나 한쪽만 부으면 내원해 주세요.',
      suggestedVisit: false,
    },
  },
];

// ---------------------------------------------------------------------------
// 상관 분석
// ---------------------------------------------------------------------------

export const mockCorrelations: RecoveryCorrelation[] = [
  {
    id: 'corr-001',
    signalLabel: '전날 수면 시간',
    symptomLabel: '다음날 붓기',
    coefficient: -0.72,
    sampleDays: 13,
    plainExplanation:
      '잠을 오래 잔 다음 날일수록 붓기 기록이 낮았습니다. 13일치 기록에서 가장 뚜렷하게 관찰된 관계입니다.',
    disclaimer: '통계적 경향이며 인과관계를 의미하지 않습니다.',
  },
  {
    id: 'corr-002',
    signalLabel: 'HRV (심박변이도)',
    symptomLabel: '회복 속도',
    coefficient: 0.64,
    sampleDays: 13,
    plainExplanation:
      'HRV가 평소보다 높았던 날 이후로 증상이 더 빨리 줄어드는 경향이 있었습니다.',
    disclaimer: '통계적 경향이며 인과관계를 의미하지 않습니다.',
  },
  {
    id: 'corr-003',
    signalLabel: '습도',
    symptomLabel: '당김 · 각질',
    coefficient: -0.51,
    sampleDays: 13,
    plainExplanation: '건조한 날일수록 당김을 더 높게 기록했습니다.',
    disclaimer: '통계적 경향이며 인과관계를 의미하지 않습니다.',
  },
];

// ---------------------------------------------------------------------------
// 지난 여정 아카이브 — 다음 시술의 개인화 입력이 된다
// ---------------------------------------------------------------------------

export const mockArchive: JourneyArchiveEntry[] = [
  {
    id: 'archive-001',
    journeyId: 'journey-000',
    procedureName: '레이저 토닝 5회차',
    clinicName: '웰니스하우스 강남 클리닉',
    procedureDate: '2026-04-18',
    completedDay: 90,
    finalStatus: 'completed',
    satisfactionScore: 4,
    beforePhotoUrl: '/mock/toning-before.jpg',
    afterPhotoUrl: '/mock/toning-after.jpg',
    learnedInsight:
      '수면이 6시간 아래로 떨어진 주에 색소 개선 속도가 눈에 띄게 느렸습니다. 다음 시술은 업무 성수기를 피해 잡는 것을 권장합니다.',
  },
  {
    id: 'archive-002',
    journeyId: 'journey-neg1',
    procedureName: '스킨부스터 3회차',
    clinicName: '웰니스하우스 성수 클리닉',
    procedureDate: '2026-01-22',
    completedDay: 90,
    finalStatus: 'completed',
    satisfactionScore: 5,
    beforePhotoUrl: '/mock/booster-before.jpg',
    afterPhotoUrl: '/mock/booster-after.jpg',
    learnedInsight:
      '겨울철 건조 구간에 보습 루틴을 늘렸더니 당김 기록이 절반으로 줄었습니다. 같은 루틴을 이번 회복에도 적용 중입니다.',
  },
];

export { SYMPTOM_ORDER };
