/**
 * 회복 엔진.
 *
 * 이 파일이 AfterGlow의 핵심이다. "AI 인사이트"라는 이름의 고정 문구가 아니라,
 * 시술 프로토콜 + 실제 체크인 + 웨어러블 신호를 넣으면 결정론적으로 계산되는 로직.
 * 백엔드가 붙어도 동일한 규칙을 서버에서 재현할 수 있도록 순수 함수로만 작성한다.
 */

import {
  CareProtocol,
  DailyCheckin,
  RecoveryAlert,
  RecoveryCurvePoint,
  RecoveryCurveSeries,
  RecoveryPhase,
  RecoveryPhaseKey,
  RestrictionRule,
  RecommendationRule,
  SymptomKey,
  DailyVitals,
  AlertLevel,
  JourneyStatus,
} from '@/types';
import { clamp, round } from './utils';

export const SYMPTOM_LABELS: Record<SymptomKey, string> = {
  swelling: '붓기',
  redness: '붉은기',
  pain: '통증',
  peeling: '각질',
  tightness: '당김',
};

export const SYMPTOM_ORDER: SymptomKey[] = [
  'swelling',
  'redness',
  'pain',
  'peeling',
  'tightness',
];

// ---------------------------------------------------------------------------
// 1. 기대 회복 곡선 생성
// ---------------------------------------------------------------------------

/**
 * 증상별 기대 곡선을 생성한다.
 *
 * 모델: peak(초기 강도) -> onsetDay에서 최대 -> halfLife 지수감쇠.
 * 각질처럼 며칠 뒤에 올라왔다 빠지는 증상은 onsetDay를 뒤로 밀어 표현한다.
 */
export function buildExpectedCurve(
  params: { peak: number; onsetDay: number; halfLife: number },
  totalDays: number
): number[] {
  const { peak, onsetDay, halfLife } = params;
  const curve: number[] = [];

  for (let day = 0; day < totalDays; day++) {
    let value: number;
    if (day < onsetDay) {
      // 상승 구간: 선형으로 peak까지
      value = peak * ((day + 1) / (onsetDay + 1));
    } else {
      // 감쇠 구간: 반감기 기반 지수 감소
      value = peak * Math.pow(0.5, (day - onsetDay) / halfLife);
    }
    curve.push(round(clamp(value, 0, 4), 2));
  }

  return curve;
}

// ---------------------------------------------------------------------------
// 2. 단계 판정
// ---------------------------------------------------------------------------

export function getPhase(protocol: CareProtocol, day: number): RecoveryPhase {
  const found = protocol.phases.find((p) => day >= p.startDay && day <= p.endDay);
  return found ?? protocol.phases[protocol.phases.length - 1];
}

export function getPhaseKey(protocol: CareProtocol, day: number): RecoveryPhaseKey {
  return getPhase(protocol, day).key;
}

// ---------------------------------------------------------------------------
// 3. 웨어러블 보정 — 피부 × 건강 × 일상을 잇는 지점
// ---------------------------------------------------------------------------

export interface RecoveryModifier {
  /** 1.0 = 표준 속도. 0.85 = 예상보다 15% 느린 회복을 기대해야 함 */
  factor: number;
  reasons: string[];
}

/**
 * 수면 · 스트레스 · 음주로 회복 속도 기대치를 보정한다.
 *
 * 웨어러블 없이 웹에서 사용자가 직접 입력한 세 값만 쓴다. 기기가 없다는 이유로
 * 개인화에서 제외되는 사용자가 없어야 하기 때문이다.
 *
 * 근거 방향(문헌상 알려진 경향):
 *  - 수면 부족은 창상 치유와 염증 해소를 지연시킨다
 *  - 만성 스트레스는 염증 반응을 길게 유지시킨다
 *  - 음주는 혈관 확장으로 부종을 악화시킨다
 * 개별 가중치는 의학적 확정값이 아니라 서비스 내부 기준이며, UI에 항상 그렇게 표기한다.
 */
export function computeRecoveryModifier(vitals: DailyVitals[]): RecoveryModifier {
  if (vitals.length === 0) {
    return { factor: 1, reasons: ['컨디션 기록 없음 — 표준 회복 속도로 계산 중'] };
  }

  const recent = vitals.slice(-3);
  const avgSleep = recent.reduce((s, v) => s + v.sleepHours, 0) / recent.length;
  const avgStress = recent.reduce((s, v) => s + v.stressLevel, 0) / recent.length;
  const drinkDays = recent.filter((v) => v.alcohol).length;

  let factor = 1;
  const reasons: string[] = [];

  if (avgSleep < 6) {
    factor -= 0.15;
    reasons.push(`최근 3일 평균 수면 ${round(avgSleep)}시간 — 회복이 느려질 수 있음`);
  } else if (avgSleep >= 7.5) {
    factor += 0.08;
    reasons.push(`최근 3일 평균 수면 ${round(avgSleep)}시간 — 회복에 유리한 조건`);
  }

  if (avgStress >= 7) {
    factor -= 0.1;
    reasons.push(`최근 3일 평균 스트레스 ${round(avgStress)}/10 — 염증이 오래갈 수 있음`);
  } else if (avgStress <= 3) {
    factor += 0.05;
    reasons.push(`최근 3일 평균 스트레스 ${round(avgStress)}/10 — 안정적`);
  }

  if (drinkDays > 0) {
    factor -= 0.07 * drinkDays;
    reasons.push(`최근 3일 중 음주 ${drinkDays}일 — 붓기가 다시 올라올 수 있음`);
  }

  if (reasons.length === 0) {
    reasons.push('수면·스트레스 모두 평소 범위 — 표준 회복 속도');
  }

  return { factor: round(clamp(factor, 0.7, 1.2), 2), reasons };
}

/** 보정된 기대값. factor가 낮으면 증상이 더 천천히 빠지는 것을 "정상"으로 본다. */
export function applyModifier(expected: number, modifier: RecoveryModifier): number {
  if (modifier.factor >= 1) {
    return round(expected * (2 - modifier.factor), 2);
  }
  return round(clamp(expected / modifier.factor, 0, 4), 2);
}

// ---------------------------------------------------------------------------
// 4. 곡선 시리즈 조립 (예상 vs 실측)
// ---------------------------------------------------------------------------

export function buildCurveSeries(
  protocol: CareProtocol,
  checkins: DailyCheckin[],
  currentDay: number,
  modifier: RecoveryModifier = { factor: 1, reasons: [] }
): RecoveryCurveSeries[] {
  const byDay = new Map<number, DailyCheckin>();
  checkins.forEach((c) => byDay.set(c.day, c));

  const lastDay = Math.min(currentDay, protocol.totalRecoveryDays - 1);

  return SYMPTOM_ORDER.map((symptom) => {
    const expectedCurve = protocol.expectedCurves[symptom];
    const points: RecoveryCurvePoint[] = [];

    for (let day = 0; day <= lastDay; day++) {
      const checkin = byDay.get(day);
      points.push({
        day,
        label: `D+${day}`,
        expected: applyModifier(expectedCurve[day] ?? 0, modifier),
        actual: checkin ? checkin.symptoms[symptom] : null,
        phase: getPhaseKey(protocol, day),
      });
    }

    const recentPoints = points.slice(-7).filter((p) => p.actual !== null);
    const recentDeviation =
      recentPoints.length === 0
        ? 0
        : round(
            recentPoints.reduce((s, p) => s + ((p.actual as number) - p.expected), 0) /
              recentPoints.length,
            2
          );

    return {
      symptom,
      label: SYMPTOM_LABELS[symptom],
      points,
      recentDeviation,
    };
  });
}

// ---------------------------------------------------------------------------
// 5. 진행률 & 상태 판정
// ---------------------------------------------------------------------------

/**
 * 회복 진행률 0~100.
 * "며칠 지났나"가 아니라 "증상이 얼마나 빠졌나"로 계산한다.
 */
export function computeRecoveryProgress(
  protocol: CareProtocol,
  latestCheckin: DailyCheckin | null,
  currentDay: number
): number {
  if (!latestCheckin) {
    // 체크인이 없으면 프로토콜 기대치만으로 근사
    const peakTotal = SYMPTOM_ORDER.reduce(
      (s, k) => s + Math.max(...protocol.expectedCurves[k]),
      0
    );
    const nowTotal = SYMPTOM_ORDER.reduce(
      (s, k) => s + (protocol.expectedCurves[k][currentDay] ?? 0),
      0
    );
    return Math.round(clamp((1 - nowTotal / peakTotal) * 100, 0, 100));
  }

  const peakTotal = SYMPTOM_ORDER.reduce(
    (s, k) => s + Math.max(...protocol.expectedCurves[k]),
    0
  );
  const nowTotal = SYMPTOM_ORDER.reduce((s, k) => s + latestCheckin.symptoms[k], 0);
  return Math.round(clamp((1 - nowTotal / peakTotal) * 100, 0, 100));
}

export function computeDeviationScore(series: RecoveryCurveSeries[]): number {
  if (series.length === 0) return 0;
  // 음수 편차 = 기대보다 증상이 적음 = 회복이 빠름 -> 양수 점수로 뒤집는다
  const avg = series.reduce((s, x) => s + x.recentDeviation, 0) / series.length;
  return round(-avg, 2);
}

export function judgeStatus(
  deviationScore: number,
  currentDay: number,
  totalDays: number
): JourneyStatus {
  if (currentDay >= totalDays - 1) return 'completed';
  if (deviationScore <= -1.0) return 'off-track';
  if (deviationScore <= -0.4) return 'watch';
  return 'on-track';
}

// ---------------------------------------------------------------------------
// 6. 이탈 감지 — 클리닉 리콜의 트리거
// ---------------------------------------------------------------------------

export interface AlertDraft {
  level: AlertLevel;
  title: string;
  detail: string;
  triggeredBy: { symptom: SymptomKey; expected: number; actual: number }[];
  recommendedAction: string;
}

/**
 * 최신 체크인이 기대 곡선을 얼마나 벗어났는지 판정한다.
 * 임계값은 서비스 내부 기준이며, 진단이 아니라 "상담 고려" 신호로만 쓴다.
 */
export function detectDeviation(
  protocol: CareProtocol,
  checkin: DailyCheckin,
  modifier: RecoveryModifier = { factor: 1, reasons: [] }
): AlertDraft | null {
  const triggeredBy: AlertDraft['triggeredBy'] = [];

  SYMPTOM_ORDER.forEach((symptom) => {
    const expected = applyModifier(protocol.expectedCurves[symptom][checkin.day] ?? 0, modifier);
    const actual = checkin.symptoms[symptom];
    if (actual - expected >= 1.2) {
      triggeredBy.push({ symptom, expected, actual });
    }
  });

  if (triggeredBy.length === 0) return null;

  const worst = triggeredBy.reduce((a, b) => (b.actual - b.expected > a.actual - a.expected ? b : a));
  const gap = worst.actual - worst.expected;
  const painTriggered = triggeredBy.some((t) => t.symptom === 'pain' && t.actual >= 3);

  const level: AlertLevel = painTriggered || gap >= 2 ? 'urgent' : 'watch';
  const names = triggeredBy.map((t) => SYMPTOM_LABELS[t.symptom]).join(' · ');

  return {
    level,
    title:
      level === 'urgent'
        ? `${names}이(가) 예상 회복 범위를 크게 벗어났어요`
        : `${names}이(가) 예상보다 오래 남아 있어요`,
    detail: `D+${checkin.day} 기준 ${SYMPTOM_LABELS[worst.symptom]} 기대 수준은 ${worst.expected}인데 ${worst.actual}로 기록되었습니다. 같은 시술을 받은 회복 곡선과 비교했을 때 확인이 필요한 구간입니다.`,
    triggeredBy,
    recommendedAction:
      level === 'urgent'
        ? '시술받은 클리닉에 오늘 기록을 공유하고 상담을 고려해 보세요.'
        : '내일 체크인까지 지켜본 뒤에도 같은 패턴이면 클리닉에 공유해 보세요.',
  };
}

// ---------------------------------------------------------------------------
// 7. 오늘 활성화된 규칙
// ---------------------------------------------------------------------------

export function getActiveRestrictions(protocol: CareProtocol, day: number): RestrictionRule[] {
  return protocol.restrictions.filter((r) => day >= r.activeFromDay && day <= r.activeUntilDay);
}

export function getActiveRecommendations(protocol: CareProtocol, day: number): RecommendationRule[] {
  return protocol.recommendations.filter((r) => day >= r.activeFromDay && day <= r.activeUntilDay);
}

/** 오늘 막 풀린 금기. "이제 해도 돼요"는 사용자가 가장 기다리는 정보다. */
export function getJustLiftedRestrictions(
  protocol: CareProtocol,
  day: number
): RestrictionRule[] {
  return protocol.restrictions.filter((r) => r.activeUntilDay === day - 1);
}

// ---------------------------------------------------------------------------
// 8. 상관 분석 (피어슨) — 생활 신호와 회복 속도
// ---------------------------------------------------------------------------

export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return 0;
  const x = xs.slice(0, n);
  const y = ys.slice(0, n);
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx;
    const b = y[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  if (dx === 0 || dy === 0) return 0;
  return round(num / Math.sqrt(dx * dy), 2);
}
