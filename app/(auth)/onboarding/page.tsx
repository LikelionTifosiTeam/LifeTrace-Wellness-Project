'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Info, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';
import { authService } from '@/services/auth';
import { procedureOptions } from '@/mock/protocols';
import { ProcedureCategory } from '@/types';
import { cn, daysBetween, todayKST } from '@/lib/utils';

const STEPS = ['시술', '날짜', '클리닉', '동의'] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [procedure, setProcedure] = useState<(typeof procedureOptions)[number] | null>(null);
  const [procedureDate, setProcedureDate] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [reminderTime, setReminderTime] = useState('21:30');
  const [clinicSharing, setClinicSharing] = useState(false);

  const elapsed = procedureDate ? daysBetween(procedureDate, todayKST()) : null;

  const canNext =
    (step === 0 && procedure) ||
    (step === 1 && procedureDate && elapsed !== null && elapsed >= 0) ||
    (step === 2 && clinicName.trim().length > 0) ||
    step === 3;

  const handleSubmit = async () => {
    if (!procedure || !procedureDate) return;
    setIsSubmitting(true);
    try {
      await authService.startJourney({
        protocolId: procedure.protocolId,
        procedureName: procedure.name,
        category: procedure.category as ProcedureCategory,
        procedureDate,
        clinicName,
        clinicSharingConsent: clinicSharing,
        checkinReminderTime: reminderTime,
      });
      router.push('/today');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200/80">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-3">
          <button
            type="button"
            onClick={() => (step === 0 ? router.push('/') : setStep((s) => s - 1))}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100"
            aria-label="이전"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex gap-1">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  i <= step ? 'bg-brand-600' : 'bg-slate-200'
                )}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-slate-400 shrink-0">
            {step + 1}/{STEPS.length}
          </span>
        </div>
      </header>

      <div className="flex-1 w-full max-w-md mx-auto px-4 py-6 pb-32">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18 }}
        >
            {step === 0 && (
              <>
                <h1 className="text-2xl font-extrabold tracking-tight">어떤 시술을 받으셨나요?</h1>
                <p className="text-sm text-slate-500 mt-1.5 mb-6">
                  시술 종류에 따라 회복 곡선과 금기 기간이 달라집니다.
                </p>
                <div className="space-y-2">
                  {procedureOptions.map((p) => {
                    const selected = procedure?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setProcedure(p);
                          setTimeout(() => setStep(1), 180);
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all min-h-[56px]',
                          selected
                            ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            다운타임 약 {p.downtime}일 · 결과 체감 D+{p.resultVisibleFromDay}부터
                          </p>
                        </div>
                        {selected && <Check className="w-4 h-4 text-brand-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h1 className="text-2xl font-extrabold tracking-tight">언제 받으셨나요?</h1>
                <p className="text-sm text-slate-500 mt-1.5 mb-6">
                  이 날짜가 D+0 기준이 됩니다.
                </p>
                <Input
                  type="date"
                  label="시술 날짜"
                  max={todayKST()}
                  value={procedureDate}
                  onChange={(e) => setProcedureDate(e.target.value)}
                />
                {elapsed !== null && elapsed >= 0 && (
                  <Card className="mt-4 bg-brand-50/70 border-brand-200">
                    <p className="text-sm font-bold text-brand-900">오늘은 D+{elapsed}입니다</p>
                    <p className="text-xs text-brand-800 mt-1">
                      지난 {elapsed}일치는 기억나는 만큼만 나중에 채워 넣어도 됩니다.
                    </p>
                  </Card>
                )}
                {elapsed !== null && elapsed < 0 && (
                  <p className="text-xs text-red-500 font-medium mt-2">
                    시술 날짜는 오늘보다 이후일 수 없습니다.
                  </p>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="text-2xl font-extrabold tracking-tight">어디에서 받으셨나요?</h1>
                <p className="text-sm text-slate-500 mt-1.5 mb-6">
                  회복이 예상 범위를 벗어났을 때 상담을 연결할 곳입니다.
                </p>
                <Input
                  label="클리닉 이름"
                  placeholder="예: 웰니스하우스 강남 클리닉"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                />
                <Input
                  type="time"
                  label="매일 체크인 알림 시간"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="mt-4"
                />
                <p className="flex items-start gap-2 text-xs text-slate-500 leading-relaxed mt-3">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  회복 초기에는 매일, 4주 이후에는 주 2회로 알림이 자동으로 줄어듭니다.
                </p>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="text-2xl font-extrabold tracking-tight">
                  기록을 어떻게 쓸지 정해주세요
                </h1>
                <p className="text-sm text-slate-500 mt-1.5 mb-6">
                  꺼둔 채로 시작해도 됩니다. 설정에서 언제든 바꿀 수 있습니다.
                </p>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setClinicSharing((v) => !v)}
                    className={cn(
                      'w-full flex items-start gap-3 p-4 rounded-2xl border text-left transition-all',
                      clinicSharing ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white'
                    )}
                  >
                    <span
                      className={cn(
                        'w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5',
                        clinicSharing ? 'bg-brand-600 text-white' : 'bg-slate-200'
                      )}
                    >
                      {clinicSharing && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        이탈 감지 시 클리닉에 기록 공유
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">
                        회복이 예상 범위를 벗어난 날의 기록만 전달됩니다. 평상시 기록은 공유되지
                        않습니다.
                      </p>
                    </div>
                  </button>

                </div>

                <div className="flex items-start gap-2 p-4 rounded-xl bg-slate-100/70 border border-slate-200 mt-4 text-xs text-slate-600 leading-relaxed">
                  <Shield className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                  <span>
                    시술명·시술일·클리닉 정보는 개인정보보호법상 민감정보입니다. 회원님의 명시적
                    동의 없이는 어떤 제3자에게도 제공되지 않으며, 설정에서 언제든 전체 삭제할 수
                    있습니다.
                  </span>
                </div>

                <MedicalDisclaimer className="mt-4" compact />
              </>
            )}
        </motion.div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-md mx-auto">
          {step < STEPS.length - 1 ? (
            <Button
              size="lg"
              className="w-full"
              disabled={!canNext}
              onClick={() => setStep((s) => s + 1)}
            >
              다음
            </Button>
          ) : (
            <Button size="lg" className="w-full" isLoading={isSubmitting} onClick={handleSubmit}>
              회복 여정 시작하기
            </Button>
          )}
          {step === 0 && (
            <p className="text-center text-xs text-slate-400 mt-2">
              이미 계정이 있나요?{' '}
              <Link href="/login" className="font-semibold text-brand-700">
                로그인
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
