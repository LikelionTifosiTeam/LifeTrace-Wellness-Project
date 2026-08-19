'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Check,
  Info,
  LogOut,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/states/Skeleton';
import { ErrorState } from '@/components/states/ErrorState';
import { EmptyState } from '@/components/states/EmptyState';
import { ClinicCase, ClinicScreenData } from '@/types';
import { clinicService } from '@/services/clinic';
import { authService } from '@/services/auth';
import { SYMPTOM_LABELS, SYMPTOM_ORDER } from '@/lib/recovery';
import { cn, formatKoreanDate } from '@/lib/utils';

const levelTone = ['bg-emerald-400', 'bg-teal-400', 'bg-amber-400', 'bg-orange-400', 'bg-red-400'];

function CaseCard({ item, onReplied }: { item: ClinicCase; onReplied: () => void }) {
  const [message, setMessage] = useState('');
  const [suggestVisit, setSuggestVisit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const urgent = item.level === 'urgent';

  const handleSubmit = async () => {
    setError('');
    setIsSaving(true);
    try {
      await clinicService.respond({
        alertId: item.alertId,
        message,
        suggestedVisit: suggestVisit,
      });
      setMessage('');
      onReplied();
    } catch (err) {
      setError(err instanceof Error ? err.message : '답변을 저장하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card
      className={cn(
        'border-l-4',
        item.response
          ? 'border-l-slate-300'
          : urgent
          ? 'border-l-red-500 bg-red-50/30'
          : 'border-l-amber-400 bg-amber-50/30'
      )}
    >
      <div className="flex items-start gap-3">
        {urgent ? (
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        ) : (
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
            <Badge variant={urgent ? 'danger' : 'warning'}>
              {urgent ? '확인 필요' : '지켜보는 중'}
            </Badge>
            {item.response ? (
              <Badge variant="neutral">답변 완료</Badge>
            ) : (
              <Badge variant="brand">미답변</Badge>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-1">
            {item.procedureName} · {item.procedureDate} 시술 · D+{item.day}
            {item.sharedAt && ` · ${formatKoreanDate(item.sharedAt.slice(0, 10))} 공유`}
          </p>

          <p className="text-xs text-slate-600 leading-relaxed mt-2.5">{item.detail}</p>

          <ul className="flex flex-wrap gap-1.5 mt-2.5">
            {item.triggeredBy.map((t) => (
              <li
                key={t.symptom}
                className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600"
              >
                {SYMPTOM_LABELS[t.symptom]} 예상 {t.expected} → 기록 {t.actual}
              </li>
            ))}
          </ul>

          {/* 공유 범위: 알림 전후 3일 체크인만. RLS가 같은 범위를 강제한다. */}
          <div className="mt-4 p-3 rounded-xl bg-white border border-slate-200">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              공유받은 기록 (알림 전후 3일)
            </p>
            {item.recentCheckins.length === 0 ? (
              <p className="text-xs text-slate-400">해당 구간에 기록이 없습니다.</p>
            ) : (
              <div className="overflow-x-auto -mx-1 px-1">
                {/* 좁은 화면에서 헤더가 세로로 쪼개지지 않게 한다.
                    넘치면 표만 가로로 스크롤된다. */}
                <table className="w-full text-xs whitespace-nowrap">
                  <thead>
                    <tr className="text-slate-400">
                      <th className="text-left font-medium py-1 pr-2">경과</th>
                      <th className="text-left font-medium py-1 pr-3">금기</th>
                      {SYMPTOM_ORDER.map((k) => (
                        <th key={k} className="text-center font-medium py-1 px-1.5">
                          {SYMPTOM_LABELS[k]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {item.recentCheckins.map((c) => (
                      <tr key={c.id} className="border-t border-slate-100">
                        <td className="py-1.5 pr-2 font-bold text-slate-700">D+{c.day}</td>
                        <td className="py-1.5 pr-3">
                          {c.followedRestrictions ? (
                            <span className="text-slate-400">준수</span>
                          ) : (
                            <span className="text-amber-600 font-bold">미준수</span>
                          )}
                        </td>
                        {SYMPTOM_ORDER.map((k) => (
                          <td key={k} className="text-center py-1.5 px-1.5">
                            <span
                              className={cn(
                                'inline-flex items-center justify-center w-6 h-6 rounded-md text-white font-bold',
                                levelTone[c.symptoms[k]]
                              )}
                            >
                              {c.symptoms[k]}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {item.recentCheckins.some((c) => c.moodNote) && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                {item.recentCheckins
                  .filter((c) => c.moodNote)
                  .map((c) => (
                    <p key={c.id} className="text-xs text-slate-600 leading-relaxed">
                      <span className="font-bold text-slate-500">D+{c.day}</span> “{c.moodNote}”
                    </p>
                  ))}
              </div>
            )}
          </div>

          {item.response ? (
            <div className="mt-3 p-3 rounded-xl bg-brand-50 border border-brand-200">
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-brand-700 mb-1">
                <Stethoscope className="w-3.5 h-3.5" />
                {item.response.practitionerName} 답변
                {item.response.suggestedVisit && ' · 내원 권고'}
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">{item.response.message}</p>
            </div>
          ) : (
            <div className="mt-3">
              <Textarea
                label="답변 보내기"
                placeholder="환자에게 전달할 안내를 작성하세요."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[80px]"
              />
              <button
                type="button"
                onClick={() => setSuggestVisit((v) => !v)}
                aria-pressed={suggestVisit}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-left transition-all mt-2 min-h-[48px]',
                  suggestVisit ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'
                )}
              >
                <span
                  className={cn(
                    'w-5 h-5 rounded-md flex items-center justify-center shrink-0',
                    suggestVisit ? 'bg-red-600 text-white' : 'bg-slate-200'
                  )}
                >
                  {suggestVisit && <Check className="w-3.5 h-3.5" />}
                </span>
                <span className="text-sm text-slate-700">내원을 권고합니다</span>
              </button>

              {error && (
                <p role="alert" className="text-xs text-red-600 font-medium mt-2">
                  {error}
                </p>
              )}

              <Button
                className="w-full mt-2"
                disabled={!message.trim()}
                isLoading={isSaving}
                onClick={handleSubmit}
              >
                답변 전송
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function ClinicPage() {
  const router = useRouter();
  const [data, setData] = useState<ClinicScreenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      setData(await clinicService.getDashboard());
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = data?.cases.filter((c) => !c.response).length ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-extrabold tracking-tight text-slate-900 truncate">
              {data ? data.member.clinicName : 'AfterGlow 클리닉'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {data ? `${data.member.displayName} · 회복 리콜 대시보드` : '회복 리콜 대시보드'}
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await authService.logout();
              router.push('/');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 min-h-[40px]"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-5 pb-16 space-y-4">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-64" />
          </div>
        )}
        {!isLoading && isError && (
          <ErrorState
            title="대시보드를 불러오지 못했습니다"
            message="클리닉 계정으로 로그인되어 있는지 확인해 주세요."
            onRetry={load}
          />
        )}

        {!isLoading && !isError && data && (
          <>
            <Card className="bg-slate-900 border-slate-900 text-white">
              <p className="text-xs font-semibold text-white/70">확인이 필요한 환자</p>
              <p className="text-4xl font-black tracking-tighter mt-1">
                {pending}
                <span className="text-base font-medium text-white/60 ml-2">명 미답변</span>
              </p>
              <p className="text-[11px] text-white/60 mt-3 leading-relaxed">
                회복 곡선을 벗어난 기록 중, 환자가 공유에 동의한 건만 표시됩니다. 평상시 기록과
                환자 개인정보는 열람되지 않습니다.
              </p>
            </Card>

            {data.cases.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="공유된 기록이 없습니다"
                message="환자의 회복이 예상 범위 안에서 진행되고 있거나, 아직 공유에 동의한 기록이 없습니다."
              />
            ) : (
              data.cases.map((item) => (
                <CaseCard key={item.alertId} item={item} onReplied={load} />
              ))
            )}

            <p className="text-[11px] text-slate-400 leading-relaxed pt-2">
              본 화면의 데이터는 시연을 위해 임의로 생성된 더미입니다. 실제 운영 시 시술명·시술일
              정보는 개인정보보호법상 민감정보로 분류되어 환자 동의와 접근 통제 아래 처리됩니다.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
