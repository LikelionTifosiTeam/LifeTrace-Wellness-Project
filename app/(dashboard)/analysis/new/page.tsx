'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Camera,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Brain,
  Search,
  Check
} from 'lucide-react';
import { MainShell } from '@/components/common/MainShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';
import { ConcernType } from '@/types';
import { analysisService } from '@/services/analysis';

const SYMPTOMS: ConcernType[] = ['여드름', '붉은기', '색소', '모공', '건조함', '유분', '피부결', '기타'];

const ANALYSIS_STEPS = [
  '업로드한 피부 사진 확인',
  '최근 14일 간 피부 기록 확인',
  '피부 고민 및 증상 정량화',
  '최근 상태 변화 탐색',
  '수면/스트레스 관련 요인 분석',
  'AI Insight 및 가이드 생성'
];

export default function NewAnalysisPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);

  // Form State
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedConcerns, setSelectedConcerns] = useState<ConcernType[]>(['여드름']);
  const [severity, setSeverity] = useState<number>(6);
  const [duration, setDuration] = useState<string>('1주 이내');
  const [notes, setNotes] = useState<string>('');
  const [sleepHours, setSleepHours] = useState<string>('6.0');
  const [stressLevel, setStressLevel] = useState<string>('7');

  // AI Progress State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentProgressStep, setCurrentProgressStep] = useState<number>(0);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleConcern = (concern: ConcernType) => {
    if (selectedConcerns.includes(concern)) {
      if (selectedConcerns.length === 1) return;
      setSelectedConcerns(selectedConcerns.filter((c) => c !== concern));
    } else {
      setSelectedConcerns([...selectedConcerns, concern]);
    }
  };

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setCurrentProgressStep(0);

    // Simulate step progress animation
    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      setCurrentProgressStep(i);
      await new Promise((res) => setTimeout(res, 500));
    }

    try {
      const result = await analysisService.createSkinAnalysis({
        photoFile: previewImage || undefined,
        concerns: selectedConcerns,
        severity,
        duration,
        notes,
        sleepHours,
        stressLevel,
      });

      router.push(`/analysis/result?id=${result.id}`);
    } catch {
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    const progressPercent = Math.round(((currentProgressStep + 1) / ANALYSIS_STEPS.length) * 100);

    return (
      <MainShell>
        <div className="max-w-xl mx-auto py-12 px-4 space-y-8 text-center">
          <Card className="p-8 space-y-6 bg-white border border-brand-200 shadow-float rounded-3xl">
            <div className="w-16 h-16 rounded-3xl bg-brand-100 text-brand-600 flex items-center justify-center mx-auto animate-pulse">
              <Brain className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <Badge variant="brand">AI 피부 다차원 분석 중</Badge>
              <h2 className="text-2xl font-black text-slate-900">피부 상태와 패턴을 탐색하고 있습니다</h2>
              <p className="text-xs text-slate-500">사진 데이터와 생활 기록 간의 종합적 변화를 산출하고 있습니다.</p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>진행 상황</span>
                <span className="text-brand-600">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} />
            </div>

            <div className="space-y-2 text-left pt-4 border-t border-slate-100">
              {ANALYSIS_STEPS.map((stepText, idx) => {
                const isDone = idx < currentProgressStep;
                const isCurrent = idx === currentProgressStep;
                return (
                  <div
                    key={stepText}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                      isCurrent
                        ? 'bg-brand-50 text-brand-900 font-bold border border-brand-200'
                        : isDone
                        ? 'text-slate-500 line-through'
                        : 'text-slate-400 opacity-60'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : isCurrent ? (
                      <Sparkles className="w-4 h-4 text-brand-600 animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span className="text-xs">{stepText}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </MainShell>
    );
  }

  return (
    <MainShell>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="brand">NEW AI ANALYSIS</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">AI 피부 분석 생성</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            피부 사진과 현재 증상을 등록하면 AI가 상태 변화와 관련 요인을 다각도로 정리해 드립니다.
          </p>
        </div>

        {/* Wizard Card */}
        <Card className="p-6 sm:p-8 bg-white border-slate-200 space-y-8 shadow-soft rounded-3xl">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <span className="text-xs font-extrabold text-brand-600">STEP {step} / 3</span>
            <span className="text-xs text-slate-400 font-medium">
              {step === 1 ? '피부 사진 업로드' : step === 2 ? '증상 및 고민 입력' : '생활 변화 기록'}
            </span>
          </div>

          {/* Step 1: Photo Upload */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-lg font-bold text-slate-900">피부 사진을 올려주세요</h2>
                <p className="text-xs text-slate-500 mt-1">
                  밝은 곳에서 정면 얼굴 부위가 선명히 보이도록 촬영한 사진을 권장합니다.
                </p>
              </div>

              {previewImage ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900/5 aspect-video flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewImage} alt="피부 사진 미리보기" className="h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setPreviewImage(null)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-brand-50/20">
                  <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">사진 클릭하여 업로드 또는 드래그 & 드롭</p>
                  <p className="text-[11px] text-slate-400 mt-1">JPG, PNG (최대 10MB)</p>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                💡 <strong>촬영 팁:</strong> 직사광선을 피하고 실내 조명 아래서 얼굴 전체나 고민 부위를 30cm 거리를 두고 촬영해주세요.
              </div>
            </div>
          )}

          {/* Step 2: Symptoms */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-lg font-bold text-slate-900">현재 느껴지는 피부 고민을 알려주세요</h2>
                <p className="text-xs text-slate-500 mt-1">해당되는 고민 요인을 다중 선택할 수 있습니다.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SYMPTOMS.map((symptom) => {
                  const isSelected = selectedConcerns.includes(symptom);
                  return (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => toggleConcern(symptom)}
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50 text-brand-800 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span>{symptom}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-brand-600" />}
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  체감 증상 강도 (1 ~ 10점): <span className="text-brand-600 font-bold">{severity}점</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={severity}
                  onChange={(e) => setSeverity(parseInt(e.target.value, 10))}
                  className="w-full accent-brand-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">증상 지속 기간</label>
                <select
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="오늘">오늘 갑자기 발생</option>
                  <option value="1주 이내">1주 이내 지속</option>
                  <option value="1개월 이내">1개월 이내 지속</option>
                  <option value="1개월 이상">1개월 이상 장기 지속</option>
                </select>
              </div>

              <Textarea
                label="추가 증상 설명 (선택)"
                placeholder="예: 턱 부분에 큼직하게 솟아오른 염증이 붉게 아픕니다."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}

          {/* Step 3: Life Factors */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-lg font-bold text-slate-900">최근 생활 컨디션을 체크해주세요</h2>
                <p className="text-xs text-slate-500 mt-1">생활 요인은 피부 변화 상관관계 분석에 활용됩니다.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">최근 평균 수면시간 (시간)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">스트레스 지수 (1~10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={stressLevel}
                    onChange={(e) => setStressLevel(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-800">최근 기타 변화 체크:</span>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-brand-600" />
                    <span>화장품/스킨케어 제품 변경</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-brand-600" />
                    <span>야근 및 수면 패턴 불규칙</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="gap-1.5 text-xs">
                <ArrowLeft className="w-4 h-4" />
                <span>이전</span>
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button type="button" onClick={() => setStep(step + 1)} className="gap-1.5 font-bold bg-brand-600 text-white">
                <span>다음</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleStartAnalysis}
                className="gap-2 font-bold bg-brand-600 hover:bg-brand-700 text-white py-3 px-6"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI 피부 상태 분석하기</span>
              </Button>
            )}
          </div>
        </Card>

        <MedicalDisclaimer />
      </div>
    </MainShell>
  );
}
