import type { MetadataRoute } from 'next';

/**
 * PWA 매니페스트.
 *
 * 회복 체크인은 매일 같은 시간에 한 손으로 하는 행동이라
 * 홈 화면 아이콘에서 바로 열리는 것이 중요하다.
 * start_url을 /today로 두어 앱을 열면 바로 오늘의 D+N이 보인다.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AfterGlow — 시술 후 90일 회복 동행',
    short_name: 'AfterGlow',
    description:
      '시술 다음 날부터 90일. 하루 30초 기록으로 회복 곡선을 따라가고, 매일 새로 쓰이는 케어 카드를 받아보세요.',
    start_url: '/today',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f8fafc',
    theme_color: '#0d9488',
    lang: 'ko',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
    shortcuts: [
      { name: '오늘 체크인', short_name: '체크인', url: '/checkin' },
      { name: '회복 곡선', short_name: '회복', url: '/recovery' },
    ],
  };
}
