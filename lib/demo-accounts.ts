/**
 * 심사·시연용 계정.
 *
 * 해커톤 제출물에 함께 제공하는 공개 데모 계정이라 소스에 포함한다.
 * 두 계정 모두 임의 생성 더미 데이터만 보유하며 실제 개인정보가 없다.
 * 운영 전환 시 이 파일과 해당 계정을 삭제한다.
 */
export const DEMO_ACCOUNTS = {
  user: {
    email: 'demo@afterglow.kr',
    password: 'AfterGlow2026!',
    label: '사용자 (회복 중인 김서연 · D+12)',
  },
  clinic: {
    email: 'clinic@afterglow.kr',
    password: 'Clinic2026!',
    label: '클리닉 관리자 (박지훈 원장)',
  },
} as const;
