/**
 * 참조 데이터.
 *
 * 사용자 데이터는 전부 Supabase에 있다. 이 파일은 사용자와 무관한 고정 자산만 담는다.
 *  - 증상 5단계 문장 라벨 (사진 없이 탭만으로 입력하기 위한 기준)
 *  - 상관 분석 문구 템플릿 (계수와 표본 수는 항상 실제 기록으로 계산된다)
 *  - 환경 데이터 폴백 (외부 기상 API 미연동 구간의 안전값)
 */

import { EnvironmentSnapshot, RecoveryCorrelation, SymptomKey, SymptomMeta } from '@/types';

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

const CORRELATION_DISCLAIMER = '통계적 경향이며 인과관계를 의미하지 않습니다.';

/** 계수와 표본 수는 런타임에 실제 기록으로 덮어쓴다. */
export const correlationTemplates: Record<'sleep' | 'stress' | 'humidity', RecoveryCorrelation> = {
  sleep: {
    id: 'corr-sleep',
    signalLabel: '전날 수면 시간',
    symptomLabel: '다음날 붓기',
    coefficient: 0,
    sampleDays: 0,
    plainExplanation: '잠을 오래 잔 다음 날일수록 붓기 기록이 낮게 나타나는지 확인합니다.',
    disclaimer: CORRELATION_DISCLAIMER,
  },
  stress: {
    id: 'corr-stress',
    signalLabel: '전날 스트레스',
    symptomLabel: '다음날 붉은기',
    coefficient: 0,
    sampleDays: 0,
    plainExplanation: '스트레스를 높게 기록한 다음 날 붉은기가 더 오래 남는지 확인합니다.',
    disclaimer: CORRELATION_DISCLAIMER,
  },
  humidity: {
    id: 'corr-humidity',
    signalLabel: '그날 습도',
    symptomLabel: '당김',
    coefficient: 0,
    sampleDays: 0,
    plainExplanation: '건조한 날일수록 당김을 높게 기록하는지 확인합니다.',
    disclaimer: CORRELATION_DISCLAIMER,
  },
};

/** 환경 데이터가 없는 날의 안전한 기본값 (서울 평균 수준) */
export function fallbackEnvironment(date: string): EnvironmentSnapshot {
  return { date, uvIndex: 5, humidity: 55, temperature: 22, fineDust: '보통' };
}
