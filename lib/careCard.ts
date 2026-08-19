/**
 * 데일리 케어 카드 생성기.
 *
 * 실제 운영에서는 buildCareCardPrompt()로 만든 프롬프트를 서버가 Claude API에 보내
 * headline/rationale 문장을 생성하고, avoid/recommend 목록은 프로토콜 규칙 엔진이
 * 결정론적으로 만든다. (LLM이 금기 목록을 창작하면 의료 안전성이 깨지므로 분리한다.)
 *
 * 프론트 MVP에서는 동일한 입력으로 로컬 생성기가 문장을 조립해 데모가 항상 동작한다.
 */

import {
  CareProtocol,
  CareSignal,
  CardActionItem,
  DailyCareCard,
  DailyCheckin,
  EnvironmentSnapshot,
  RecoveryPhase,
  DailyVitals,
} from '@/types';
import {
  SYMPTOM_LABELS,
  SYMPTOM_ORDER,
  getActiveRecommendations,
  getActiveRestrictions,
  getJustLiftedRestrictions,
  computeRecoveryModifier,
} from './recovery';
import { round } from './utils';

export interface CareCardInput {
  journeyId: string;
  date: string;
  day: number;
  protocol: CareProtocol;
  phase: RecoveryPhase;
  yesterdayCheckin: DailyCheckin | null;
  vitals: DailyVitals[];
  environment: EnvironmentSnapshot;
}

// ---------------------------------------------------------------------------
// 신호 추출 — 카드가 무엇을 보고 쓰였는지 사용자에게 그대로 보여준다
// ---------------------------------------------------------------------------

export function extractSignals(input: CareCardInput): CareSignal[] {
  const signals: CareSignal[] = [];
  const latest = input.vitals[input.vitals.length - 1];

  if (latest) {
    signals.push({
      key: 'sleep',
      label: `어젯밤 수면 ${round(latest.sleepHours)}시간`,
      impact: latest.sleepHours < 6 ? '주의' : latest.sleepHours >= 7.5 ? '긍정' : '중립',
    });
    signals.push({
      key: 'stress',
      label: `스트레스 ${latest.stressLevel}/10`,
      impact: latest.stressLevel >= 7 ? '주의' : latest.stressLevel <= 3 ? '긍정' : '중립',
    });
    if (latest.alcohol) {
      signals.push({ key: 'alcohol', label: '어제 음주 있음', impact: '주의' });
    }
  } else {
    signals.push({ key: 'vitals-missing', label: '어제 컨디션 기록 없음', impact: '중립' });
  }

  signals.push({
    key: 'uv',
    label: `오늘 자외선 지수 ${input.environment.uvIndex}`,
    impact: input.environment.uvIndex >= 7 ? '주의' : input.environment.uvIndex <= 3 ? '긍정' : '중립',
  });

  signals.push({
    key: 'humidity',
    label: `습도 ${input.environment.humidity}%`,
    impact: input.environment.humidity < 40 ? '주의' : '중립',
  });

  if (input.yesterdayCheckin) {
    const worst = SYMPTOM_ORDER.reduce((a, b) =>
      input.yesterdayCheckin!.symptoms[b] > input.yesterdayCheckin!.symptoms[a] ? b : a
    );
    signals.push({
      key: `checkin-${worst}`,
      label: `어제 ${SYMPTOM_LABELS[worst]} ${input.yesterdayCheckin.symptoms[worst]}/4`,
      impact: input.yesterdayCheckin.symptoms[worst] >= 3 ? '주의' : '중립',
    });
  } else {
    signals.push({ key: 'checkin-missing', label: '어제 체크인 없음', impact: '중립' });
  }

  return signals;
}

// ---------------------------------------------------------------------------
// LLM 프롬프트 — 백엔드가 그대로 가져다 쓰는 계약
// ---------------------------------------------------------------------------

export function buildCareCardPrompt(input: CareCardInput, signals: CareSignal[]): string {
  const symptomLine = input.yesterdayCheckin
    ? SYMPTOM_ORDER.map(
        (k) => `${SYMPTOM_LABELS[k]} ${input.yesterdayCheckin!.symptoms[k]}/4`
      ).join(', ')
    : '어제 기록 없음';

  return [
    '당신은 미용 시술 후 회복을 돕는 케어 코치입니다. 의사가 아니며 진단하지 않습니다.',
    '아래 데이터를 바탕으로 오늘의 안내 문장 2개를 작성하세요.',
    '',
    `[시술] ${input.protocol.procedureName} (${input.protocol.category})`,
    `[경과] D+${input.day} · ${input.phase.label}`,
    `[이 단계에서 일어나는 일] ${input.phase.summary}`,
    `[이 단계의 주요 위험] ${input.phase.keyRisk}`,
    `[어제 증상] ${symptomLine}`,
    `[생활 신호] ${signals.map((s) => `${s.label}(${s.impact})`).join(', ')}`,
    '',
    '출력 형식(JSON):',
    '{ "headline": "40자 이내 오늘의 한 문장", "rationale": "왜 오늘 이 안내인지 80자 이내" }',
    '',
    '규칙:',
    '- 진단·질병명·치료 확정 표현 금지. "가능성", "참고", "상담 고려"로 표현할 것',
    '- 금기/권장 항목 목록은 절대 만들어내지 말 것 (규칙 엔진이 별도 제공)',
    '- 불안을 키우지 말고 오늘 할 수 있는 것에 초점을 둘 것',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// 로컬 생성기 — API 키 없이도 데모가 동작하도록
// ---------------------------------------------------------------------------

function composeHeadline(input: CareCardInput, signals: CareSignal[]): string {
  const lifted = getJustLiftedRestrictions(input.protocol, input.day);
  if (lifted.length > 0) {
    return `오늘부터 ${lifted[0].label}, 다시 괜찮아요`;
  }

  const sleep = signals.find((s) => s.key === 'sleep');
  if (sleep?.impact === '주의') {
    return '어젯밤 잠이 짧았어요. 오늘은 회복 속도를 낮춰 잡아둘게요';
  }

  const uv = signals.find((s) => s.key === 'uv');
  if (uv?.impact === '주의' && input.day <= 21) {
    return '자외선이 강한 날이에요. 오늘은 색소 침착을 막는 게 1순위';
  }

  if (input.day === input.protocol.resultVisibleFromDay) {
    return '오늘부터 변화가 눈에 보이기 시작하는 구간이에요';
  }

  if (input.yesterdayCheckin) {
    const worst = SYMPTOM_ORDER.reduce((a, b) =>
      input.yesterdayCheckin!.symptoms[b] > input.yesterdayCheckin!.symptoms[a] ? b : a
    );
    if (input.yesterdayCheckin.symptoms[worst] >= 3) {
      return `${SYMPTOM_LABELS[worst]}가 아직 남아 있어요. 오늘은 자극을 줄이는 날`;
    }
  }

  return `${input.phase.label} 순항 중이에요. 오늘도 30초만 기록해 주세요`;
}

function composeRationale(input: CareCardInput, signals: CareSignal[]): string {
  const modifier = computeRecoveryModifier(input.vitals);
  const bodyKeys = ['sleep', 'stress', 'alcohol'];
  const bodyAttention = signals
    .filter((s) => s.impact === '주의' && bodyKeys.includes(s.key))
    .map((s) => s.label);
  const envAttention = signals
    .filter((s) => s.impact === '주의' && !bodyKeys.includes(s.key))
    .map((s) => s.label);

  const parts: string[] = [];

  if (bodyAttention.length > 0) {
    parts.push(
      `${bodyAttention.join(', ')} 신호가 있어 회복 속도 기대치를 표준 대비 ${Math.round(
        modifier.factor * 100
      )}%로 다시 계산했습니다.`
    );
  } else if (modifier.factor > 1) {
    parts.push(
      `수면과 스트레스가 양호해 회복 속도 기대치를 표준 대비 ${Math.round(
        modifier.factor * 100
      )}%로 잡았습니다.`
    );
  }

  if (envAttention.length > 0) {
    parts.push(`${envAttention.join(', ')} 조건이라 오늘 권장 항목을 추가했습니다.`);
  }

  if (parts.length === 0) {
    parts.push(
      `${input.protocol.procedureName} D+${input.day} 기준 회복 곡선과 어제 기록이 모두 예상 범위 안에 있어, 표준 회복 속도로 안내드립니다.`
    );
  }

  parts.push('모두 기록 기반 참고 정보입니다.');
  return parts.join(' ');
}

function toActionItems(
  rules: { id: string; label: string; icon: string; reason: string; severity?: string }[]
): CardActionItem[] {
  return rules.map((r) => ({
    id: r.id,
    label: r.label,
    icon: r.icon,
    reason: r.reason,
    severity: r.severity as CardActionItem['severity'],
  }));
}

export function generateCareCard(input: CareCardInput): DailyCareCard {
  const signals = extractSignals(input);
  const restrictions = getActiveRestrictions(input.protocol, input.day);
  const recommendations = getActiveRecommendations(input.protocol, input.day);

  // 환경 신호로 권장 항목을 하나 더 붙인다 (규칙 엔진 소관)
  const dynamicRecommend: CardActionItem[] = [];
  if (input.environment.uvIndex >= 6 && input.day <= 30) {
    dynamicRecommend.push({
      id: 'dyn-uv',
      label: '자외선 차단 재도포 (4시간 간격)',
      icon: 'Sun',
      reason: `오늘 자외선 지수 ${input.environment.uvIndex}. 회복 중 피부는 색소 침착에 더 민감합니다.`,
    });
  }
  if (input.environment.humidity < 40) {
    dynamicRecommend.push({
      id: 'dyn-humidity',
      label: '실내 가습 · 보습제 추가 도포',
      icon: 'Droplets',
      reason: `습도 ${input.environment.humidity}%로 건조합니다. 당김과 각질이 심해질 수 있어요.`,
    });
  }

  return {
    id: `card-${input.journeyId}-${input.day}`,
    journeyId: input.journeyId,
    date: input.date,
    day: input.day,
    headline: composeHeadline(input, signals),
    rationale: composeRationale(input, signals),
    avoid: toActionItems(restrictions),
    recommend: [...toActionItems(recommendations), ...dynamicRecommend],
    signalsUsed: signals,
    generatedAt: `${input.date}T06:00:00+09:00`,
  };
}
