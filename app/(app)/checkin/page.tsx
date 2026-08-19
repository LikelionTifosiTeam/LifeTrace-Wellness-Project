'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Check, PartyPopper, Timer, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/states/Skeleton';
import { ErrorState } from '@/components/states/ErrorState';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';
import { SymptomScale } from '@/features/checkin/SymptomScale';
import { AlertCard } from '@/features/recovery/AlertCard';
import { useCheckinStore } from '@/store/useCheckinStore';
import { checkinService, CheckinResult } from '@/services/checkin';
import { journeyService } from '@/services/journey';
import { storageService } from '@/services/storage';
import { SYMPTOM_LABELS, SYMPTOM_ORDER, applyModifier, computeRecoveryModifier } from '@/lib/recovery';
import { symptomMetaMap, mockWearables } from '@/mock/data';
import { TodayScreenData } from '@/types';

export default function CheckinPage() {
  const router = useRouter();
  const {
    step,
    symptoms,
    touched,
    moodNote,
    followedRestrictions,
    begin,
    setSymptom,
    setMoodNote,
    setFollowedRestrictions,
    next,
    prev,
    elapsedSeconds,
    reset,
  } = useCheckinStore();

  const [context, setContext] = useState<TodayScreenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CheckinResult | null>(null);

  // 사진은 언제나 선택 항목이다. 실패해도 체크인을 막지 않는다.
  const [photo, setPhoto] = useState<{ url: string; path: string } | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = async (file: File | undefined) => {
    if (!file || !context) return;
    setPhotoError('');
    setIsUploading(true);
    try {
      setPhoto(await storageService.uploadCheckinPhoto(file, context.journey.currentDay));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : '사진을 첨부하지 못했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      setContext(await journeyService.getToday());
      begin();
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [begin]);

  useEffect(() => {
    load();
    return () => reset();
  }, [load, reset]);

  const totalSteps = SYMPTOM_ORDER.length + 1; // 증상 5 + 마무리 1
  const isLastSymptomStep = step === SYMPTOM_ORDER.length - 1;
  const isSummaryStep = step === SYMPTOM_ORDER.length;
  const currentKey = SYMPTOM_ORDER[step];

  const modifier = computeRecoveryModifier(mockWearables);
  const expectedToday =
    context && currentKey
      ? applyModifier(
          context.protocol.expectedCurves[currentKey][context.journey.currentDay] ?? 0,
          modifier
        )
      : undefined;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await checkinService.submitCheckin({
        symptoms,
        moodNote: moodNote.trim() || undefined,
        photoUrl: photo?.path,
        followedRestrictions,
        durationSeconds: elapsedSeconds(),
      });
      setResult(res);
    } catch {
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------------------------------------- 이미 마친 여정이면 입력 차단
  if (!isLoading && context && context.journey.status === 'completed') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
          이미 마친 회복 여정이에요
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-sm leading-relaxed">
          기록은 그대로 보관되어 있습니다. 새 시술을 받으셨다면 여정을 새로 시작해 주세요.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mt-6">
          <Link href="/journal">
            <Button variant="outline">기록 보기</Button>
          </Link>
          <Link href="/onboarding">
            <Button>새 시술 등록</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- 완료 화면
  if (result) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="flex-1 w-full max-w-md mx-auto px-4 py-8 space-y-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto mb-4">
              <PartyPopper className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              D+{result.checkin.day} 기록 완료
            </h1>
            <p className="flex items-center justify-center gap-1.5 text-sm text-slate-500 mt-2">
              <Timer className="w-4 h-4" />
              {result.checkin.durationSeconds}초 걸렸어요
            </p>
          </motion.div>

          {result.improved.length > 0 && (
            <Card className="bg-emerald-50/70 border-emerald-200">
              <p className="text-sm font-bold text-emerald-900">어제보다 좋아졌어요</p>
              <p className="text-xs text-emerald-800 mt-1">
                {result.improved
                  .map((k) => SYMPTOM_LABELS[k as keyof typeof SYMPTOM_LABELS] ?? k)
                  .join(', ')}
                가 한 단계씩 내려갔습니다.
              </p>
            </Card>
          )}

          {result.newAlert ? (
            <AlertCard alert={result.newAlert} />
          ) : (
            <Card>
              <p className="text-sm font-bold text-slate-900">회복 곡선 안에 있어요</p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                오늘 기록은 같은 시술의 예상 회복 범위 안에 있습니다. 지금처럼만 하면 됩니다.
              </p>
            </Card>
          )}

          <div className="space-y-2 pt-2">
            <Link href="/recovery" className="block">
              <Button size="lg" className="w-full">
                회복 곡선에서 확인하기
              </Button>
            </Link>
            <Link href="/today" className="block">
              <Button size="lg" variant="outline" className="w-full">
                오늘 화면으로
              </Button>
            </Link>
          </div>

          <MedicalDisclaimer compact />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- 입력 화면
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 진행 표시 */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200/80">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-3">
          <button
            type="button"
            onClick={() => (step === 0 ? router.push('/today') : prev())}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100"
            aria-label={step === 0 ? '닫기' : '이전'}
          >
            {step === 0 ? <X className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          </button>
          <div className="flex-1 flex gap-1" role="progressbar" aria-valuenow={step + 1} aria-valuemax={totalSteps}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-brand-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-slate-400 tabular-nums shrink-0">
            {step + 1}/{totalSteps}
          </span>
        </div>
      </header>

      <div className="flex-1 w-full max-w-md mx-auto px-4 py-6 pb-32">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-64 mt-6" />
          </div>
        )}
        {!isLoading && isError && <ErrorState onRetry={load} />}

        {!isLoading && !isError && context && (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18 }}
          >
              {!isSummaryStep && (
                <SymptomScale
                  meta={symptomMetaMap[currentKey]}
                  value={touched[currentKey] ? symptoms[currentKey] : undefined}
                  onChange={(v) => {
                    setSymptom(currentKey, v);
                    // 탭 한 번에 자동 진행 — 30초 목표를 지키는 핵심 인터랙션
                    if (!isLastSymptomStep) setTimeout(next, 180);
                    else setTimeout(next, 180);
                  }}
                  expected={expectedToday}
                />
              )}

              {isSummaryStep && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                      거의 끝났어요
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      D+{context.journey.currentDay} 기록을 확인해 주세요.
                    </p>
                  </div>

                  <Card className="p-4">
                    <ul className="space-y-2">
                      {SYMPTOM_ORDER.map((k) => (
                        <li key={k} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{SYMPTOM_LABELS[k]}</span>
                          <span className="font-bold text-slate-900 tabular-nums">
                            {symptoms[k]}/4
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <button
                    type="button"
                    onClick={() => setFollowedRestrictions(!followedRestrictions)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all min-h-[56px] ${
                      followedRestrictions
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                        followedRestrictions ? 'bg-brand-600 text-white' : 'bg-slate-200'
                      }`}
                    >
                      {followedRestrictions && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <span className="text-sm text-slate-700">
                      오늘 안내받은 금기 사항을 지켰어요
                    </span>
                  </button>

                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-1.5">사진 (선택)</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="sr-only"
                      onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
                    />
                    {photo ? (
                      <div className="flex items-center gap-3 p-3 rounded-2xl border border-brand-200 bg-brand-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt="첨부한 체크인 사진 미리보기"
                          className="w-14 h-14 rounded-xl object-cover"
                        />
                        <p className="text-xs text-slate-600 flex-1">
                          주 1회 같은 각도로 찍으면 변화가 보입니다.
                        </p>
                        <button
                          type="button"
                          onClick={() => setPhoto(null)}
                          className="p-2 rounded-lg text-slate-400 hover:bg-white"
                          aria-label="사진 제거"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        isLoading={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="w-4 h-4" />
                        사진 첨부하기
                      </Button>
                    )}
                    {photoError && (
                      <p className="text-xs text-red-500 font-medium mt-1.5" role="alert">
                        {photoError}
                      </p>
                    )}
                  </div>

                  <Textarea
                    label="한 줄 메모 (선택)"
                    placeholder="예: 어제 회식이 있었어요"
                    value={moodNote}
                    onChange={(e) => setMoodNote(e.target.value)}
                    className="min-h-[80px]"
                  />

                  <MedicalDisclaimer compact />
                </div>
              )}
          </motion.div>
        )}
      </div>

      {/* 하단 고정 액션 — 요약 단계에서만 노출 (증상 단계는 탭으로 자동 진행) */}
      {isSummaryStep && !isLoading && !isError && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-md mx-auto">
            <Button size="lg" className="w-full" isLoading={isSubmitting} onClick={handleSubmit}>
              기록 저장하기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
