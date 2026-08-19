import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 'YYYY-MM-DD' 두 날짜의 일수 차이 */
export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/** Date를 로컬 기준 'YYYY-MM-DD'로. toISOString()은 UTC로 바꿔 하루가 밀린다. */
export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

/** 'YYYY-MM-DD'에 n일을 더한 'YYYY-MM-DD' */
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toDateString(d);
}

export function formatDay(day: number): string {
  return `D+${day}`;
}

/** '2026-08-19' -> '8월 19일 (화)' */
export function formatKoreanDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${weekday})`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function round(value: number, digits = 1): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

/** 서울 기준 오늘 날짜 'YYYY-MM-DD'. 서버·클라이언트 시간대 차이를 없앤다. */
export function todayKST(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + (now.getTimezoneOffset() + 540) * 60000);
  return toDateString(kst);
}
