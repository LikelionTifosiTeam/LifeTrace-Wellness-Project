/**
 * AfterGlow - 시술 후 90일 회복 동행 서비스
 * 도메인 타입 정의
 */

// ---------------------------------------------------------------------------
// 시술 (Procedure)
// ---------------------------------------------------------------------------

/** 시술 대분류. 회복 곡선의 형태를 결정하는 1차 키 */
export type ProcedureCategory =
  | '레이저'
  | '리프팅'
  | '주사'
  | '필러'
  | '스킨부스터'
  | '필링'
  | '재생관리';

/** 회복 단계. T+0 기준 경과일로 구간이 나뉜다. */
export type RecoveryPhaseKey = 'acute' | 'stabilizing' | 'improving' | 'settling';

export interface RecoveryPhase {
  key: RecoveryPhaseKey;
  label: string;          // '급성 반응기'
  startDay: number;       // 포함
  endDay: number;         // 포함
  summary: string;        // 이 구간에 몸에서 일어나는 일
  keyRisk: string;        // 이 구간에서 가장 흔한 실수
}

/** 증상 축. 체크인과 회복 곡선이 공유하는 좌표계 */
export type SymptomKey = 'swelling' | 'redness' | 'pain' | 'peeling' | 'tightness';

export interface SymptomMeta {
  key: SymptomKey;
  label: string;          // '붓기'
  description: string;
  /** 0(없음) ~ 4(심함) 각 단계의 문장. 사진 없이 탭만으로 입력하기 위한 라벨 */
  scaleLabels: [string, string, string, string, string];
}

/**
 * 시술별 회복 프로토콜.
 * 기존 "시술 리포트(조회용 PDF)"를 대체하는, 앱이 매일 참조하는 살아있는 규칙 집합.
 */
export interface CareProtocol {
  id: string;
  procedureName: string;         // '울쎄라 300샷'
  category: ProcedureCategory;
  totalRecoveryDays: number;     // 관찰 기간 (기본 90)
  downtimeDays: number;          // 일상 복귀까지 예상 일수
  phases: RecoveryPhase[];
  /** 증상별 기대 곡선. index = 경과일(0-based), 값 = 기대 강도 0~4 */
  expectedCurves: Record<SymptomKey, number[]>;
  /** 금기 규칙. 경과일 구간별로 활성화된다. */
  restrictions: RestrictionRule[];
  /** 권장 케어 규칙 */
  recommendations: RecommendationRule[];
  /** 이 시술의 효과가 눈에 보이기 시작하는 시점 */
  resultVisibleFromDay: number;
  clinicNote: string;            // 시술 담당 의료진이 남긴 메모
}

export type RestrictionSeverity = 'critical' | 'caution' | 'ok-soon';

export interface RestrictionRule {
  id: string;
  label: string;                 // '사우나 · 찜질방'
  icon: string;                  // lucide 아이콘 이름
  activeFromDay: number;
  activeUntilDay: number;
  severity: RestrictionSeverity;
  reason: string;                // 왜 안 되는지 (사용자 언어로)
}

export interface RecommendationRule {
  id: string;
  label: string;
  icon: string;
  activeFromDay: number;
  activeUntilDay: number;
  reason: string;
}

// ---------------------------------------------------------------------------
// 회복 여정 (Recovery Journey)
// ---------------------------------------------------------------------------

export type JourneyStatus = 'on-track' | 'watch' | 'off-track' | 'completed';

/** 사용자가 실제로 받은 시술 1건 = 회복 여정 1개 */
export interface RecoveryJourney {
  id: string;
  userId: string;
  protocolId: string;
  procedureName: string;
  category: ProcedureCategory;
  clinicName: string;
  practitionerName: string;
  procedureDate: string;         // YYYY-MM-DD (T+0)
  currentDay: number;            // 오늘의 D+N
  status: JourneyStatus;
  /** 0~100. 기대 회복 곡선 대비 진행률 */
  recoveryProgress: number;
  /** 기대 대비 편차 요약. 양수 = 예상보다 빠름 */
  deviationScore: number;
  createdAt: string;
}

/** 회복 곡선 1점. 예상과 실측을 같은 좌표에 올린다. */
export interface RecoveryCurvePoint {
  day: number;
  label: string;                 // 'D+3'
  expected: number;              // 0~4
  actual: number | null;         // 체크인 없으면 null
  phase: RecoveryPhaseKey;
}

export interface RecoveryCurveSeries {
  symptom: SymptomKey;
  label: string;
  points: RecoveryCurvePoint[];
  /** 최근 7일 기준 실측-기대 평균 편차 */
  recentDeviation: number;
}

// ---------------------------------------------------------------------------
// 데일리 체크인 (30초, 사진 없이 탭만으로)
// ---------------------------------------------------------------------------

export interface DailyCheckin {
  id: string;
  journeyId: string;
  date: string;                  // YYYY-MM-DD
  day: number;                   // D+N
  symptoms: Record<SymptomKey, number>; // 0~4
  /** 선택 입력. 없어도 체크인은 완결된다. */
  photoUrl?: string;
  moodNote?: string;
  /** 규칙 준수 자가 보고 */
  followedRestrictions: boolean;
  durationSeconds: number;       // 실제 입력에 걸린 시간 (UX 지표)
  createdAt: string;
}

export interface CheckinStreak {
  current: number;
  longest: number;
  totalCheckins: number;
  /** 여정 시작 이후 체크인한 날의 비율 0~100 */
  completionRate: number;
}

// ---------------------------------------------------------------------------
// 생성형 AI 데일리 카드
// ---------------------------------------------------------------------------

export interface CardActionItem {
  id: string;
  label: string;
  icon: string;
  reason: string;
  severity?: RestrictionSeverity;
}

/**
 * 매일 새로 생성되는 오늘의 케어 카드.
 * 입력: 프로토콜 + 경과일 + 어제 체크인 + 웨어러블 + 환경(자외선/습도)
 * 출력: 오늘 하지 말 것 / 오늘 하면 좋은 것 / 한 줄 이유
 */
export interface DailyCareCard {
  id: string;
  journeyId: string;
  date: string;
  day: number;
  /** LLM이 생성한 오늘의 한 문장 */
  headline: string;
  /** 왜 오늘 이 문장인지. 근거 데이터를 사용자 언어로 */
  rationale: string;
  avoid: CardActionItem[];
  recommend: CardActionItem[];
  /** 카드 생성에 실제로 쓰인 신호들. 투명성 확보용 */
  signalsUsed: CareSignal[];
  /**
   * 문장을 무엇이 썼는지.
   * 'rule'  — 규칙 엔진의 결정론적 문장 (LLM 키 없이도 항상 동작)
   * 'llm'   — Claude API가 생성하고 서버 안전 검증을 통과한 문장
   * 사용자에게 그대로 표기한다. 어느 쪽인지 숨기지 않는다.
   */
  generatedBy: 'rule' | 'llm';
  generatedAt: string;
}

export interface CareSignal {
  key: string;                   // 'sleep' | 'uv' | 'checkin-swelling' ...
  label: string;                 // '어젯밤 수면 5.2시간'
  impact: '긍정' | '주의' | '중립';
}

// ---------------------------------------------------------------------------
// 데일리 컨디션 / 환경
// ---------------------------------------------------------------------------

/**
 * 하루 컨디션. 사용자가 웹에서 직접 입력한다.
 *
 * 웨어러블 연동을 쓰지 않는 이유: 웹만으로 동작해야 하고, 기기가 없는 사용자를
 * 배제하지 않아야 한다. 수면·스트레스·음주 세 가지면 회복 속도 보정에 충분하다.
 */
export interface DailyVitals {
  date: string;
  sleepHours: number;
  /** 0(없음) ~ 10(매우 높음) 자가 보고 */
  stressLevel: number;
  alcohol: boolean;
}

export interface EnvironmentSnapshot {
  date: string;
  uvIndex: number;               // 0~11
  humidity: number;              // %
  temperature: number;           // ℃
  fineDust: '좋음' | '보통' | '나쁨' | '매우나쁨';
}

/** 회복 속도와 생활 신호의 상관. 피부-건강-일상을 잇는 지점 */
export interface RecoveryCorrelation {
  id: string;
  signalLabel: string;           // '수면 7시간 이상'
  symptomLabel: string;          // '붓기 감소 속도'
  /** -1 ~ 1 */
  coefficient: number;
  sampleDays: number;
  plainExplanation: string;
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// 이탈 감지 & 클리닉 리콜
// ---------------------------------------------------------------------------

export type AlertLevel = 'info' | 'watch' | 'urgent';

export interface RecoveryAlert {
  id: string;
  journeyId: string;
  date: string;
  day: number;
  level: AlertLevel;
  title: string;
  detail: string;
  /** 어떤 증상이 기대 곡선을 얼마나 벗어났는지 */
  triggeredBy: { symptom: SymptomKey; expected: number; actual: number }[];
  recommendedAction: string;
  /** 클리닉에 공유되었는지 여부. 사용자가 항상 통제한다. */
  sharedWithClinic: boolean;
  clinicResponse?: ClinicResponse;
}

export interface ClinicResponse {
  respondedAt: string;
  practitionerName: string;
  message: string;
  suggestedVisit: boolean;
}

// ---------------------------------------------------------------------------
// 아카이브 / 기록
// ---------------------------------------------------------------------------

export interface JourneyArchiveEntry {
  id: string;
  journeyId: string;
  procedureName: string;
  clinicName: string;
  procedureDate: string;
  completedDay: number;
  finalStatus: JourneyStatus;
  satisfactionScore?: number;    // 1~5
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  /** 이 여정에서 배운 것. 다음 시술의 개인화 입력이 된다. */
  learnedInsight: string;
}

// ---------------------------------------------------------------------------
// 사용자
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  name: string;
  birthYear?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  /** 알림을 받고 싶은 시간대. 강요가 아니라 안심이 되도록 */
  checkinReminderTime: string;   // 'HH:mm'
  clinicSharingConsent: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// 화면 조합 DTO
// ---------------------------------------------------------------------------

/** /today 화면 한 번에 필요한 것 */
export interface TodayScreenData {
  user: User;
  journey: RecoveryJourney;
  protocol: CareProtocol;
  currentPhase: RecoveryPhase;
  careCard: DailyCareCard;
  todayCheckin: DailyCheckin | null;
  streak: CheckinStreak;
  activeAlert: RecoveryAlert | null;
  vitals: DailyVitals | null;
  environment: EnvironmentSnapshot;
}

/** /recovery 화면 */
export interface RecoveryScreenData {
  journey: RecoveryJourney;
  protocol: CareProtocol;
  series: RecoveryCurveSeries[];
  checkins: DailyCheckin[];
  alerts: RecoveryAlert[];
}

/** /vitals 화면 */
export interface VitalsScreenData {
  vitals: DailyVitals[];
  environments: EnvironmentSnapshot[];
  correlations: RecoveryCorrelation[];
  /** 오늘 컨디션을 이미 입력했는지 */
  hasToday: boolean;
}

// ---------------------------------------------------------------------------
// 클리닉(의료진) 화면
// ---------------------------------------------------------------------------

export interface ClinicMember {
  userId: string;
  clinicId: string;
  clinicName: string;
  displayName: string;
  role: 'practitioner' | 'admin';
}

/** 공유받은 알림 1건. 환자 식별 정보는 최소한만 포함한다. */
export interface ClinicCase {
  alertId: string;
  journeyId: string;
  /** 환자 실명 대신 여정 기준 표시명 (예: '리프팅 · D+8') */
  procedureName: string;
  procedureDate: string;
  day: number;
  level: AlertLevel;
  title: string;
  detail: string;
  triggeredBy: { symptom: SymptomKey; expected: number; actual: number }[];
  recommendedAction: string;
  sharedAt: string | null;
  /** 공유 범위: 알림 전후 3일 체크인만 */
  recentCheckins: DailyCheckin[];
  response: ClinicResponse | null;
}

export interface ClinicScreenData {
  member: ClinicMember;
  cases: ClinicCase[];
}
