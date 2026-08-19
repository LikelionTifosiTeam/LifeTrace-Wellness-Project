/**
 * 시술별 케어 프로토콜.
 *
 * 회복 곡선의 모양, 금기 기간, 결과가 보이는 시점은 시술마다 완전히 다르다.
 * (레이저 토닝은 다운타임 1일에 각질이 주인공이고, 필러는 붓기와 멍이 5일 간다.)
 * 온보딩에서 고른 시술이 곧바로 다른 곡선과 다른 금기 목록으로 이어져야 한다.
 *
 * 이 데이터는 사용자별 정보가 아니라 마스터 데이터라 앱 번들에 포함한다.
 * 운영 중 프로토콜이 늘어나면 care_protocols 테이블에서 받아 registry를 덮어쓴다.
 */

import {
  CareProtocol,
  ProcedureCategory,
  RecoveryPhase,
  RecommendationRule,
  RestrictionRule,
  SymptomKey,
} from '@/types';
import { buildExpectedCurve } from '@/lib/recovery';

export const TOTAL_DAYS = 91; // D+0 ~ D+90

type CurveParams = { peak: number; onsetDay: number; halfLife: number };

interface ProtocolSpec {
  id: string;
  procedureName: string;
  category: ProcedureCategory;
  downtimeDays: number;
  resultVisibleFromDay: number;
  clinicNote: string;
  /** 단계 경계일. [급성기 끝, 안정기 끝, 재생기 끝] */
  phaseBounds: [number, number, number];
  phaseCopy: {
    acute: { summary: string; keyRisk: string };
    stabilizing: { summary: string; keyRisk: string };
    improving: { summary: string; keyRisk: string };
    settling: { summary: string; keyRisk: string };
  };
  curves: Record<SymptomKey, CurveParams>;
  restrictions: RestrictionRule[];
  recommendations: RecommendationRule[];
}

const PHASE_LABELS = {
  acute: '급성 반응기',
  stabilizing: '안정기',
  improving: '재생 진행기',
  settling: '정착기',
} as const;

function buildPhases(spec: ProtocolSpec): RecoveryPhase[] {
  const [a, b, c] = spec.phaseBounds;
  return [
    { key: 'acute', label: PHASE_LABELS.acute, startDay: 0, endDay: a, ...spec.phaseCopy.acute },
    {
      key: 'stabilizing',
      label: PHASE_LABELS.stabilizing,
      startDay: a + 1,
      endDay: b,
      ...spec.phaseCopy.stabilizing,
    },
    {
      key: 'improving',
      label: PHASE_LABELS.improving,
      startDay: b + 1,
      endDay: c,
      ...spec.phaseCopy.improving,
    },
    {
      key: 'settling',
      label: PHASE_LABELS.settling,
      startDay: c + 1,
      endDay: TOTAL_DAYS - 1,
      ...spec.phaseCopy.settling,
    },
  ];
}

function buildProtocol(spec: ProtocolSpec): CareProtocol {
  return {
    id: spec.id,
    procedureName: spec.procedureName,
    category: spec.category,
    totalRecoveryDays: TOTAL_DAYS,
    downtimeDays: spec.downtimeDays,
    resultVisibleFromDay: spec.resultVisibleFromDay,
    clinicNote: spec.clinicNote,
    phases: buildPhases(spec),
    expectedCurves: {
      swelling: buildExpectedCurve(spec.curves.swelling, TOTAL_DAYS),
      redness: buildExpectedCurve(spec.curves.redness, TOTAL_DAYS),
      pain: buildExpectedCurve(spec.curves.pain, TOTAL_DAYS),
      peeling: buildExpectedCurve(spec.curves.peeling, TOTAL_DAYS),
      tightness: buildExpectedCurve(spec.curves.tightness, TOTAL_DAYS),
    },
    restrictions: spec.restrictions,
    recommendations: spec.recommendations,
  };
}

// ---------------------------------------------------------------------------
// 공통 규칙 조각 — 기간만 시술별로 바꿔 재사용한다
// ---------------------------------------------------------------------------

const sauna = (until: number): RestrictionRule => ({
  id: 'r-sauna',
  label: '사우나 · 찜질방 · 반신욕',
  icon: 'Flame',
  activeFromDay: 0,
  activeUntilDay: until,
  severity: 'critical',
  reason: '시술 부위에 남은 열이 빠지기 전에 고온에 노출되면 붓기와 홍조가 길어집니다.',
});

const alcohol = (until: number): RestrictionRule => ({
  id: 'r-alcohol',
  label: '음주',
  icon: 'Wine',
  activeFromDay: 0,
  activeUntilDay: until,
  severity: 'critical',
  reason: '혈관이 확장되어 붓기와 멍이 다시 올라올 수 있습니다.',
});

const workout = (until: number): RestrictionRule => ({
  id: 'r-workout',
  label: '고강도 운동 · 웨이트',
  icon: 'Dumbbell',
  activeFromDay: 0,
  activeUntilDay: until,
  severity: 'caution',
  reason: '체온 상승과 혈류 증가가 회복 초기 붓기를 유지시킵니다. 가벼운 걷기는 괜찮습니다.',
});

const retinol = (until: number): RestrictionRule => ({
  id: 'r-retinol',
  label: '레티놀 · 고농도 각질 제거',
  icon: 'FlaskConical',
  activeFromDay: 0,
  activeUntilDay: until,
  severity: 'caution',
  reason: '장벽이 회복되는 중이라 자극 성분이 홍조와 각질을 악화시킬 수 있습니다.',
});

const uv = (until: number): RestrictionRule => ({
  id: 'r-uv',
  label: '자외선 차단 없는 야외 활동',
  icon: 'Sun',
  activeFromDay: 0,
  activeUntilDay: until,
  severity: 'caution',
  reason: '재생 중인 피부는 색소 침착에 더 민감합니다.',
});

const massage = (until: number, reason: string): RestrictionRule => ({
  id: 'r-massage',
  label: '얼굴 마사지 · 괄사',
  icon: 'Hand',
  activeFromDay: 0,
  activeUntilDay: until,
  severity: 'caution',
  reason,
});

const cooling = (until: number): RecommendationRule => ({
  id: 'c-cooling',
  label: '냉찜질 (10분 이내, 하루 3회)',
  icon: 'Snowflake',
  activeFromDay: 0,
  activeUntilDay: until,
  reason: '초기 붓기와 열감을 빠르게 낮춥니다.',
});

const highPillow = (until: number): RecommendationRule => ({
  id: 'c-sleep',
  label: '베개 높여 자기',
  icon: 'BedDouble',
  activeFromDay: 0,
  activeUntilDay: until,
  reason: '머리를 심장보다 높이면 아침 붓기가 줄어듭니다.',
});

const protein = (until: number): RecommendationRule => ({
  id: 'c-protein',
  label: '단백질 · 수분 충분히',
  icon: 'Beef',
  activeFromDay: 0,
  activeUntilDay: until,
  reason: '콜라겐 합성에 필요한 재료를 채웁니다.',
});

const barrier = (until: number): RecommendationRule => ({
  id: 'c-barrier',
  label: '저자극 보습제로 장벽 케어',
  icon: 'Droplets',
  activeFromDay: 1,
  activeUntilDay: until,
  reason: '장벽이 빨리 회복될수록 당김과 각질이 줄어듭니다.',
});

const weeklyPhoto = (from: number): RecommendationRule => ({
  id: 'c-photo',
  label: '같은 각도로 주 1회 사진 기록',
  icon: 'Camera',
  activeFromDay: from,
  activeUntilDay: 90,
  reason: '변화는 하루 단위로는 안 보이고 주 단위로만 보입니다.',
});

// ---------------------------------------------------------------------------
// 시술별 프로토콜
// ---------------------------------------------------------------------------

export const liftingProtocol = buildProtocol({
  id: 'protocol-lifting-001',
  procedureName: '고강도 집속 초음파 리프팅 (300샷)',
  category: '리프팅',
  downtimeDays: 3,
  resultVisibleFromDay: 28,
  clinicNote:
    '시술 부위 열자극이 남아 있는 초기 2주간 고온 노출을 피하시고, 콜라겐 재생이 진행되는 4~12주 사이에 윤곽 변화가 나타납니다. 붓기보다 통증이 갑자기 늘어나는 경우에만 내원해 주세요.',
  phaseBounds: [2, 13, 55],
  phaseCopy: {
    acute: {
      summary: '열에너지가 전달된 진피층이 반응하며 붓기와 열감이 가장 강한 구간입니다.',
      keyRisk: '이 시기의 사우나·음주·격한 운동은 붓기를 크게 늘립니다.',
    },
    stabilizing: {
      summary: '붓기가 빠지고 일상 복귀가 가능해집니다. 겉으로는 조용하지만 안에서는 재생이 시작됩니다.',
      keyRisk: '괜찮아 보여서 관리를 놓치기 가장 쉬운 구간입니다.',
    },
    improving: {
      summary: '콜라겐이 새로 만들어지며 탄력 변화가 시작됩니다. 결과가 눈에 보이기 시작합니다.',
      keyRisk: '자외선 노출은 이 시기 색소 침착 위험을 높입니다.',
    },
    settling: {
      summary: '변화가 자리를 잡습니다. 다음 시술 시점을 판단하는 데이터가 쌓이는 구간입니다.',
      keyRisk: '기록을 멈추면 다음 시술 계획의 근거가 사라집니다.',
    },
  },
  curves: {
    swelling: { peak: 3.4, onsetDay: 1, halfLife: 2.4 },
    redness: { peak: 2.8, onsetDay: 0, halfLife: 2.0 },
    pain: { peak: 2.2, onsetDay: 1, halfLife: 2.8 },
    peeling: { peak: 1.2, onsetDay: 4, halfLife: 3.5 },
    tightness: { peak: 2.6, onsetDay: 2, halfLife: 5.5 },
  },
  restrictions: [
    sauna(14),
    alcohol(6),
    workout(6),
    retinol(20),
    uv(45),
    massage(27, '새로 만들어지는 콜라겐 구조에 물리적 압력이 가해질 수 있습니다.'),
  ],
  recommendations: [cooling(3), highPillow(5), protein(30), barrier(30), weeklyPhoto(14)],
});

export const laserProtocol = buildProtocol({
  id: 'protocol-laser-001',
  procedureName: '레이저 토닝',
  category: '레이저',
  downtimeDays: 1,
  resultVisibleFromDay: 14,
  clinicNote:
    '색소가 부서져 표면으로 올라오면서 3~7일 사이 미세 각질과 일시적으로 색소가 진해 보이는 시기가 옵니다. 정상 과정이니 억지로 벗겨내지 마세요. 자외선 차단이 결과의 절반입니다.',
  phaseBounds: [1, 7, 29],
  phaseCopy: {
    acute: {
      summary: '표피에 열이 전달되어 홍조와 따끔함이 나타나는 구간입니다. 붓기는 거의 없습니다.',
      keyRisk: '이 시기 각질 제거나 스크럽은 색소 침착을 만듭니다.',
    },
    stabilizing: {
      summary: '부서진 색소가 표면으로 올라오며 미세 각질이 생깁니다. 색이 일시적으로 진해 보일 수 있습니다.',
      keyRisk: '각질을 손으로 뜯으면 그 자리에 색소가 남습니다.',
    },
    improving: {
      summary: '각질이 자연스럽게 떨어지며 톤이 밝아지기 시작합니다.',
      keyRisk: '자외선 노출은 이번 시술의 효과를 그대로 되돌립니다.',
    },
    settling: {
      summary: '톤이 자리를 잡습니다. 보통 3~4주 간격 반복 시술로 누적 효과를 만듭니다.',
      keyRisk: '다음 회차 시점을 기록 없이 정하면 과·소 시술이 됩니다.',
    },
  },
  curves: {
    swelling: { peak: 0.8, onsetDay: 0, halfLife: 1.2 },
    redness: { peak: 2.6, onsetDay: 0, halfLife: 1.4 },
    pain: { peak: 1.4, onsetDay: 0, halfLife: 1.2 },
    peeling: { peak: 2.4, onsetDay: 3, halfLife: 2.6 },
    tightness: { peak: 1.8, onsetDay: 1, halfLife: 3.0 },
  },
  restrictions: [
    sauna(7),
    workout(2),
    retinol(10),
    uv(60),
    {
      id: 'r-scrub',
      label: '스크럽 · 각질 뜯기',
      icon: 'Hand',
      activeFromDay: 0,
      activeUntilDay: 14,
      severity: 'critical',
      reason: '올라오는 각질을 억지로 벗기면 그 자리에 색소가 남습니다. 자연히 떨어지게 두세요.',
    },
  ],
  recommendations: [
    barrier(21),
    protein(21),
    {
      id: 'c-spf',
      label: '자외선 차단제 아침·오후 2회',
      icon: 'Sun',
      activeFromDay: 0,
      activeUntilDay: 60,
      reason: '색소 시술의 결과는 자외선 관리로 결정됩니다.',
    },
    weeklyPhoto(7),
  ],
});

export const boosterProtocol = buildProtocol({
  id: 'protocol-booster-001',
  procedureName: '스킨부스터',
  category: '스킨부스터',
  downtimeDays: 2,
  resultVisibleFromDay: 21,
  clinicNote:
    '주입 자국(구진)이 1~3일간 남을 수 있습니다. 만지지 않으면 대부분 자연히 흡수됩니다. 피부 속 수분감은 3주차부터 체감됩니다.',
  phaseBounds: [2, 9, 41],
  phaseCopy: {
    acute: {
      summary: '주입 부위에 미세한 부기와 자국이 남는 구간입니다.',
      keyRisk: '자국을 만지거나 화장으로 덮으면 염증 위험이 올라갑니다.',
    },
    stabilizing: {
      summary: '자국이 흡수되고 피부결이 정돈되기 시작합니다.',
      keyRisk: '건조한 환경에서는 효과 체감이 늦어집니다.',
    },
    improving: {
      summary: '수분감과 결 개선이 뚜렷해지는 구간입니다.',
      keyRisk: '이 시기에 강한 각질 제거를 하면 개선분을 깎아먹습니다.',
    },
    settling: {
      summary: '효과가 유지되는 구간입니다. 보통 3~4주 간격으로 회차를 이어갑니다.',
      keyRisk: '기록이 없으면 다음 회차 필요 여부를 감으로 정하게 됩니다.',
    },
  },
  curves: {
    swelling: { peak: 1.8, onsetDay: 0, halfLife: 1.6 },
    redness: { peak: 1.6, onsetDay: 0, halfLife: 1.8 },
    pain: { peak: 1.2, onsetDay: 0, halfLife: 1.5 },
    peeling: { peak: 0.6, onsetDay: 3, halfLife: 2.5 },
    tightness: { peak: 1.4, onsetDay: 1, halfLife: 3.5 },
  },
  restrictions: [
    sauna(5),
    alcohol(2),
    workout(2),
    retinol(7),
    uv(30),
    {
      id: 'r-makeup',
      label: '주입 부위 메이크업',
      icon: 'Hand',
      activeFromDay: 0,
      activeUntilDay: 1,
      severity: 'critical',
      reason: '주입 자국이 닫히기 전에 화장품이 들어가면 염증이 생길 수 있습니다.',
    },
  ],
  recommendations: [barrier(30), protein(30), highPillow(2), weeklyPhoto(7)],
});

export const fillerProtocol = buildProtocol({
  id: 'protocol-filler-001',
  procedureName: '필러',
  category: '필러',
  downtimeDays: 5,
  resultVisibleFromDay: 14,
  clinicNote:
    '주입 직후 부피가 과해 보이는 것은 붓기 때문이며 2주에 걸쳐 자리를 잡습니다. 다만 한쪽만 심하게 붓거나 색이 하얗게/보라색으로 변하면 즉시 연락 주세요.',
  phaseBounds: [3, 13, 41],
  phaseCopy: {
    acute: {
      summary: '주입 부위 붓기와 멍이 가장 심한 구간입니다. 모양 판단은 아직 이릅니다.',
      keyRisk: '이 시기에 모양을 판단해 추가 시술을 결정하면 과교정이 됩니다.',
    },
    stabilizing: {
      summary: '붓기가 빠지며 실제 모양이 드러나기 시작합니다.',
      keyRisk: '압박·마사지는 필러를 이동시킬 수 있습니다.',
    },
    improving: {
      summary: '필러가 조직에 자리를 잡고 최종 모양이 완성됩니다.',
      keyRisk: '이 시점의 비대칭은 기록으로 남겨 다음 상담에 가져가세요.',
    },
    settling: {
      summary: '유지 기간에 들어갑니다. 흡수 속도는 사람마다 다릅니다.',
      keyRisk: '기록이 없으면 재시술 시점을 판단할 근거가 없습니다.',
    },
  },
  curves: {
    swelling: { peak: 3.6, onsetDay: 1, halfLife: 3.2 },
    redness: { peak: 2.0, onsetDay: 0, halfLife: 2.4 },
    pain: { peak: 2.0, onsetDay: 1, halfLife: 2.6 },
    peeling: { peak: 0.3, onsetDay: 3, halfLife: 2.0 },
    tightness: { peak: 2.2, onsetDay: 2, halfLife: 6.0 },
  },
  restrictions: [
    sauna(14),
    alcohol(7),
    workout(7),
    massage(21, '주입된 필러가 자리를 잡기 전에 압력을 주면 모양이 틀어질 수 있습니다.'),
    {
      id: 'r-dental',
      label: '치과 치료 · 장시간 입 벌리기',
      icon: 'Hand',
      activeFromDay: 0,
      activeUntilDay: 14,
      severity: 'caution',
      reason: '얼굴 근육의 강한 움직임이 필러 위치에 영향을 줄 수 있습니다.',
    },
  ],
  recommendations: [cooling(3), highPillow(7), protein(21), weeklyPhoto(7)],
});

export const botoxProtocol = buildProtocol({
  id: 'protocol-botox-001',
  procedureName: '보툴리눔 톡신',
  category: '주사',
  downtimeDays: 1,
  resultVisibleFromDay: 10,
  clinicNote:
    '효과는 3~7일부터 나타나 2주차에 완성됩니다. 시술 후 4시간은 눕지 마시고, 시술 부위를 문지르지 마세요. 눈꺼풀 처짐이나 좌우 비대칭이 느껴지면 2주차 상담에서 조정합니다.',
  phaseBounds: [1, 6, 27],
  phaseCopy: {
    acute: {
      summary: '주사 자국과 미세한 부기가 있는 구간입니다. 효과는 아직 나타나지 않습니다.',
      keyRisk: '시술 후 4시간 내 눕거나 문지르면 약물이 의도치 않은 근육으로 퍼질 수 있습니다.',
    },
    stabilizing: {
      summary: '근육 이완이 시작되며 표정 주름이 옅어지기 시작합니다.',
      keyRisk: '이 시기의 좌우 차이는 아직 진행 중이라 판단하기 이릅니다.',
    },
    improving: {
      summary: '효과가 완성되는 구간입니다. 최종 결과를 판단할 수 있습니다.',
      keyRisk: '비대칭이 남으면 이 시점에 기록해 상담에 가져가세요.',
    },
    settling: {
      summary: '효과가 유지되다 서서히 돌아옵니다. 보통 3~4개월 주기입니다.',
      keyRisk: '완전히 풀린 뒤 재시술하면 주름이 다시 깊어집니다.',
    },
  },
  curves: {
    swelling: { peak: 1.2, onsetDay: 0, halfLife: 1.0 },
    redness: { peak: 1.4, onsetDay: 0, halfLife: 1.0 },
    pain: { peak: 1.0, onsetDay: 0, halfLife: 1.2 },
    peeling: { peak: 0.2, onsetDay: 2, halfLife: 2.0 },
    tightness: { peak: 1.6, onsetDay: 2, halfLife: 5.0 },
  },
  restrictions: [
    sauna(3),
    alcohol(1),
    workout(1),
    massage(3, '주사 부위를 문지르면 약물이 주변 근육으로 퍼질 수 있습니다.'),
    {
      id: 'r-lie-down',
      label: '눕기 · 엎드리기',
      icon: 'BedDouble',
      activeFromDay: 0,
      activeUntilDay: 0,
      severity: 'critical',
      reason: '시술 후 4시간은 상체를 세워 주세요. 약물이 의도한 자리에 자리 잡는 시간입니다.',
    },
  ],
  recommendations: [
    protein(14),
    barrier(14),
    {
      id: 'c-expression',
      label: '시술 부위 표정 자주 짓기',
      icon: 'Camera',
      activeFromDay: 0,
      activeUntilDay: 2,
      reason: '초기에 해당 근육을 움직이면 약물 흡수에 도움이 된다고 알려져 있습니다.',
    },
    weeklyPhoto(7),
  ],
});

export const peelingProtocol = buildProtocol({
  id: 'protocol-peeling-001',
  procedureName: '화학적 필링',
  category: '필링',
  downtimeDays: 4,
  resultVisibleFromDay: 10,
  clinicNote:
    '3~6일차에 각질이 넓게 일어나는 것이 이 시술의 정상 경과입니다. 뜯지 말고 보습만 충분히 해 주세요. 진물이나 통증을 동반한 벗겨짐은 정상이 아니니 연락 주세요.',
  phaseBounds: [2, 9, 34],
  phaseCopy: {
    acute: {
      summary: '표피가 반응해 홍조와 따끔함, 당김이 강한 구간입니다.',
      keyRisk: '이 시기의 자극 성분은 화상 유사 반응으로 이어질 수 있습니다.',
    },
    stabilizing: {
      summary: '각질이 넓게 일어나는 구간입니다. 이 시술의 정상 경과입니다.',
      keyRisk: '각질을 뜯으면 흉과 색소가 남습니다.',
    },
    improving: {
      summary: '새 표피가 드러나며 결과 톤이 정돈됩니다.',
      keyRisk: '새 피부는 자외선에 특히 약합니다.',
    },
    settling: {
      summary: '피부결이 자리를 잡습니다. 보통 2~4주 간격 회차로 이어갑니다.',
      keyRisk: '회복 기록 없이 다음 회차를 당기면 장벽이 무너집니다.',
    },
  },
  curves: {
    swelling: { peak: 1.0, onsetDay: 0, halfLife: 1.4 },
    redness: { peak: 3.0, onsetDay: 0, halfLife: 2.2 },
    pain: { peak: 1.6, onsetDay: 0, halfLife: 1.6 },
    peeling: { peak: 3.4, onsetDay: 4, halfLife: 2.4 },
    tightness: { peak: 3.0, onsetDay: 1, halfLife: 3.2 },
  },
  restrictions: [
    sauna(10),
    workout(3),
    retinol(21),
    uv(60),
    {
      id: 'r-scrub',
      label: '각질 뜯기 · 스크럽 · 필링패드',
      icon: 'Hand',
      activeFromDay: 0,
      activeUntilDay: 21,
      severity: 'critical',
      reason: '일어나는 각질을 억지로 제거하면 흉과 색소가 남습니다.',
    },
  ],
  recommendations: [
    barrier(30),
    protein(21),
    {
      id: 'c-spf',
      label: '자외선 차단제 아침·오후 2회',
      icon: 'Sun',
      activeFromDay: 0,
      activeUntilDay: 60,
      reason: '새로 드러난 표피는 색소 침착에 특히 취약합니다.',
    },
    weeklyPhoto(7),
  ],
});

// ---------------------------------------------------------------------------
// 레지스트리
// ---------------------------------------------------------------------------

export const protocolRegistry: Record<string, CareProtocol> = {
  [liftingProtocol.id]: liftingProtocol,
  [laserProtocol.id]: laserProtocol,
  [boosterProtocol.id]: boosterProtocol,
  [fillerProtocol.id]: fillerProtocol,
  [botoxProtocol.id]: botoxProtocol,
  [peelingProtocol.id]: peelingProtocol,
};

export function getProtocol(protocolId: string): CareProtocol {
  return protocolRegistry[protocolId] ?? liftingProtocol;
}

/** 온보딩 시술 선택지. protocolId가 곧 회복 곡선을 결정한다. */
export const procedureOptions = Object.values(protocolRegistry).map((p) => ({
  id: p.id,
  protocolId: p.id,
  name: p.procedureName,
  category: p.category,
  downtime: p.downtimeDays,
  resultVisibleFromDay: p.resultVisibleFromDay,
}));
