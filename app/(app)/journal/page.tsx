'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BookMarked, Camera, CalendarPlus, Lightbulb, Star } from 'lucide-react';
import { MainShell } from '@/components/common/MainShell';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/states/Skeleton';
import { ErrorState } from '@/components/states/ErrorState';
import { EmptyState } from '@/components/states/EmptyState';
import { BackfillModal } from '@/features/checkin/BackfillModal';
import { DailyCheckin, JourneyArchiveEntry, SymptomKey } from '@/types';
import { archiveService } from '@/services/archive';
import { journeyService } from '@/services/journey';
import { checkinService } from '@/services/checkin';
import { SYMPTOM_LABELS, SYMPTOM_ORDER } from '@/lib/recovery';
import { formatKoreanDate, cn } from '@/lib/utils';

const levelTone = ['bg-emerald-400', 'bg-teal-400', 'bg-amber-400', 'bg-orange-400', 'bg-red-400'];

export default function JournalPage() {
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [archive, setArchive] = useState<JourneyArchiveEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [tab, setTab] = useState<'current' | 'past'>('current');
  const [currentDay, setCurrentDay] = useState(0);
  const [showBackfill, setShowBackfill] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const [c, a, today] = await Promise.all([
        checkinService.getCheckins(),
        archiveService.getArchive(),
        journeyService.getToday(),
      ]);
      setCheckins([...c].reverse());
      setArchive(a);
      setCurrentDay(today.journey.currentDay);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const recordedDays = new Set(checkins.map((c) => c.day));
  const missingDays = Array.from({ length: currentDay + 1 }, (_, i) => i).filter(
    (d) => !recordedDays.has(d)
  );

  const handleBackfill = async (day: number, symptoms: Record<SymptomKey, number>) => {
    await checkinService.backfillCheckin(day, symptoms);
    await load();
  };

  return (
    <MainShell title="기록" subtitle="지금 회복과 지난 여정">
      <div className="flex gap-1.5 mb-4">
        {(
          [
            ['current', '이번 회복'],
            ['past', '지난 여정'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold border transition-colors min-h-[40px]',
              tab === key
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      )}
      {!isLoading && isError && <ErrorState onRetry={load} />}

      {!isLoading && !isError && (
        <div className="space-y-3">
          {tab === 'current' && missingDays.length > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-dashed border-slate-300">
              <CalendarPlus className="w-5 h-5 text-slate-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">
                  기록이 빈 날이 {missingDays.length}일 있어요
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  기억나는 만큼만 채워도 곡선이 이어집니다.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowBackfill(true)}>
                채우기
              </Button>
            </div>
          )}

          {tab === 'current' &&
            (checkins.length === 0 ? (
              <EmptyState
                icon={BookMarked}
                title="아직 기록이 없어요"
                message="오늘 화면에서 30초 체크인을 시작해 보세요."
              />
            ) : (
              checkins.map((c) => (
                <Card key={c.id}>
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="text-sm font-extrabold text-slate-900">D+{c.day}</span>
                    <span className="text-xs text-slate-500">{formatKoreanDate(c.date)}</span>
                    {c.photoUrl && (
                      <Badge variant="accent" className="gap-1">
                        <Camera className="w-3 h-3" />
                        사진
                      </Badge>
                    )}
                    {!c.followedRestrictions && <Badge variant="warning">금기 미준수</Badge>}
                    <span className="ml-auto text-[11px] text-slate-400">
                      {c.durationSeconds}초 기록
                    </span>
                  </div>

                  <ul className="space-y-1.5">
                    {SYMPTOM_ORDER.map((k) => (
                      <li key={k} className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 w-12 shrink-0">
                          {SYMPTOM_LABELS[k]}
                        </span>
                        <span className="flex gap-1 flex-1">
                          {[0, 1, 2, 3, 4].map((lv) => (
                            <span
                              key={lv}
                              className={cn(
                                'h-1.5 flex-1 rounded-full',
                                lv <= c.symptoms[k] ? levelTone[c.symptoms[k]] : 'bg-slate-100'
                              )}
                            />
                          ))}
                        </span>
                        <span className="text-xs font-bold text-slate-700 tabular-nums w-6 text-right">
                          {c.symptoms[k]}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {c.moodNote && (
                    <p className="text-xs text-slate-600 leading-relaxed mt-3 pt-3 border-t border-slate-100">
                      “{c.moodNote}”
                    </p>
                  )}
                </Card>
              ))
            ))}

          {tab === 'past' &&
            (archive.length === 0 ? (
              <EmptyState title="완료된 여정이 없어요" message="첫 회복 여정을 끝내면 여기에 쌓입니다." />
            ) : (
              archive.map((a) => (
                <Card key={a.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {a.procedureName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {a.clinicName} · {a.procedureDate}
                      </p>
                    </div>
                    {a.satisfactionScore && (
                      <span className="flex items-center gap-0.5 shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'w-3.5 h-3.5',
                              i < a.satisfactionScore!
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-200 fill-slate-200'
                            )}
                          />
                        ))}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {(
                      [
                        ['시술 전', a.beforePhotoUrl],
                        [`D+${a.completedDay}`, a.afterPhotoUrl],
                      ] as const
                    ).map(([label, url]) => (
                      <div
                        key={label}
                        className="aspect-[4/5] rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400"
                      >
                        <Camera className="w-5 h-5 mb-1" />
                        <span className="text-[11px] font-medium">{label}</span>
                        {!url && <span className="text-[10px] mt-0.5">사진 없음</span>}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-start gap-2 mt-3 p-3 rounded-xl bg-brand-50/70 border border-brand-100">
                    <Lightbulb className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-brand-800 mb-0.5">
                        이 여정에서 배운 것
                      </p>
                      <p className="text-xs text-slate-700 leading-relaxed">{a.learnedInsight}</p>
                    </div>
                  </div>
                </Card>
              ))
            ))}

          <MedicalDisclaimer compact />
        </div>
      )}

      <BackfillModal
        isOpen={showBackfill}
        onClose={() => setShowBackfill(false)}
        missingDays={missingDays}
        onSubmit={handleBackfill}
      />
    </MainShell>
  );
}
