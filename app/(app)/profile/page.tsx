'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Flag, Settings, Stethoscope } from 'lucide-react';
import { MainShell } from '@/components/common/MainShell';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/states/Skeleton';
import { ErrorState } from '@/components/states/ErrorState';
import { CompleteJourneyModal } from '@/features/recovery/CompleteJourneyModal';
import { CheckinStreak, RecoveryJourney, User } from '@/types';
import { authService } from '@/services/auth';
import { journeyService } from '@/services/journey';
import { archiveService } from '@/services/archive';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [journey, setJourney] = useState<RecoveryJourney | null>(null);
  const [streak, setStreak] = useState<CheckinStreak | null>(null);
  const [totalDays, setTotalDays] = useState(91);
  const [showComplete, setShowComplete] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const [u, t] = await Promise.all([authService.getCurrentUser(), journeyService.getToday()]);
      setUser(u);
      setJourney(t.journey);
      setStreak(t.streak);
      setTotalDays(t.protocol.totalRecoveryDays);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <MainShell title="프로필">
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
        </div>
      )}
      {!isLoading && isError && <ErrorState onRetry={load} />}

      {!isLoading && !isError && user && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center text-white text-xl font-black shrink-0">
                {user.name.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <p className="text-base font-extrabold text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          </Card>

          {journey && (
            <Card>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                진행 중인 회복 여정
              </h2>
              <p className="text-sm font-bold text-slate-900">{journey.procedureName}</p>
              <p className="text-xs text-slate-500 mt-1">
                {journey.clinicName} · {journey.practitionerName}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="brand">D+{journey.currentDay}</Badge>
                <Badge variant="neutral">{journey.procedureDate} 시술</Badge>
              </div>

              {streak && (
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-center">
                  <div>
                    <p className="text-lg font-extrabold text-slate-900 leading-none">
                      {streak.current}
                      <span className="text-xs font-medium text-slate-400 ml-0.5">일</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">연속 기록</p>
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-slate-900 leading-none">
                      {streak.totalCheckins}
                      <span className="text-xs font-medium text-slate-400 ml-0.5">회</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">총 체크인</p>
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-slate-900 leading-none">
                      {streak.completionRate}
                      <span className="text-xs font-medium text-slate-400 ml-0.5">%</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">기록률</p>
                  </div>
                </div>
              )}
            </Card>
          )}

          {journey && (
            <Card>
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-1">
                <Flag className="w-4 h-4 text-slate-400" />
                여정 마무리
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                기록을 아카이브로 옮기고, 이번 회복에서 발견된 패턴을 다음 시술의 참고 자료로
                남깁니다. 마친 뒤에도 기록은 그대로 보관됩니다.
              </p>
              <Button variant="outline" className="w-full" onClick={() => setShowComplete(true)}>
                이 회복 여정 마치기
              </Button>
            </Card>
          )}

          <Card className="p-0 overflow-hidden divide-y divide-slate-100">
            <div className="flex items-center gap-3 p-4">
              <Stethoscope className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-sm text-slate-700 flex-1">클리닉 기록 공유</span>
              <Badge variant={user.clinicSharingConsent ? 'success' : 'neutral'}>
                {user.clinicSharingConsent ? '동의함' : '동의 안 함'}
              </Badge>
            </div>
            <Link href="/settings" className="flex items-center gap-3 p-4 hover:bg-slate-50">
              <Settings className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-sm text-slate-700 flex-1">설정</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </Link>
          </Card>

          <MedicalDisclaimer compact />
        </div>
      )}

      {journey && (
        <CompleteJourneyModal
          isOpen={showComplete}
          onClose={() => setShowComplete(false)}
          procedureName={journey.procedureName}
          currentDay={journey.currentDay}
          totalDays={totalDays}
          onSubmit={async (satisfactionScore, note) => {
            await archiveService.completeJourney({ satisfactionScore, note });
            router.push('/journal');
          }}
        />
      )}
    </MainShell>
  );
}
