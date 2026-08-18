'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Check, ArrowRight, ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ConcernType } from '@/types';
import { authService } from '@/services/auth';

const ALL_CONCERNS: ConcernType[] = [
  '여드름', '붉은기', '색소', '모공', '피부결', '건조함', '유분', '탄력', '주름', '기타'
];

const GOALS = [
  '피부 상태 관리', '피부과 탐색', '치료 이력 관리', '미용 관리', '전체 관리'
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [selectedConcerns, setSelectedConcerns] = useState<ConcernType[]>(['여드름', '붉은기']);
  const [primaryConcern, setPrimaryConcern] = useState<ConcernType>('여드름');
  const [hospitalExp, setHospitalExp] = useState<boolean>(true);
  const [recentVisit, setRecentVisit] = useState<string>('최근 1개월 이내');
  const [usageGoal, setUsageGoal] = useState<string>('전체 관리');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const toggleConcern = (concern: ConcernType) => {
    if (selectedConcerns.includes(concern)) {
      if (selectedConcerns.length === 1) return; // Keep at least one
      const updated = selectedConcerns.filter((c) => c !== concern);
      setSelectedConcerns(updated);
      if (primaryConcern === concern) {
        setPrimaryConcern(updated[0]);
      }
    } else {
      setSelectedConcerns([...selectedConcerns, concern]);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await authService.saveOnboardingProfile({
        concerns: selectedConcerns,
        primaryConcern,
        hospitalExperience: hospitalExp,
        recentVisitPeriod: recentVisit,
        usageGoal,
      });
      setIsCompleted(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1200);
    } catch {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-8 space-y-4 bg-white border border-brand-200 shadow-xl rounded-3xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto border-2 border-brand-200">
            <Check className="w-8 h-8" />
          </div>
          <Badge variant="brand">프로필 생성이 완료되었습니다</Badge>
          <h2 className="text-2xl font-black text-slate-900">나의 피부 프로필 완성!</h2>
          <p className="text-xs text-slate-500">
            맞춤 대시보드와 AI 인사이트 환경으로 이동합니다...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl bg-white border border-slate-200 p-8 space-y-8 shadow-float rounded-3xl">
        {/* Progress Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-brand-600 tracking-wider">
              STEP {step} / 4
            </span>
            <span className="text-xs font-semibold text-slate-400">피부 맞춤 설정</span>
          </div>
          <Progress value={(step / 4) * 100} />
        </div>

        {/* Step 1: Concerns (Multiple Selection) */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-xl font-bold text-slate-900">평소 어떤 피부 고민이 있으신가요?</h2>
              <p className="text-xs text-slate-500 mt-1">해당되는 고민을 모두 선택해 주세요. (다중 선택 가능)</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ALL_CONCERNS.map((concern) => {
                const isSelected = selectedConcerns.includes(concern);
                return (
                  <button
                    key={concern}
                    type="button"
                    onClick={() => toggleConcern(concern)}
                    className={`p-3.5 rounded-2xl border text-sm font-semibold flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/80 text-brand-800 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{concern}</span>
                    {isSelected && <Check className="w-4 h-4 text-brand-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Primary Concern */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-xl font-bold text-slate-900">현재 가장 집중 관리가 필요한 고민은 무엇인가요?</h2>
              <p className="text-xs text-slate-500 mt-1">선택하신 고민 중 단 하나의 핵심 고민을 지정해 주세요.</p>
            </div>

            <div className="space-y-2.5">
              {selectedConcerns.map((concern) => {
                const isSelected = primaryConcern === concern;
                return (
                  <button
                    key={concern}
                    type="button"
                    onClick={() => setPrimaryConcern(concern)}
                    className={`w-full p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/80 text-brand-800 shadow-xs ring-1 ring-brand-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{concern}</span>
                    {isSelected && <Badge variant="brand">주 고민</Badge>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Hospital Experience */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-xl font-bold text-slate-900">과거 피부과 방문 및 치료 경험이 있으신가요?</h2>
              <p className="text-xs text-slate-500 mt-1">이력 데이터를 통해 AI 분석의 정확도가 더 높아집니다.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setHospitalExp(true)}
                className={`p-5 rounded-2xl border text-center space-y-2 transition-all ${
                  hospitalExp
                    ? 'border-brand-500 bg-brand-50/80 text-brand-900 ring-1 ring-brand-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <Building2 className={`w-6 h-6 mx-auto ${hospitalExp ? 'text-brand-600' : 'text-slate-400'}`} />
                <div className="font-bold text-sm">있음</div>
                <div className="text-[11px] text-slate-500">피부과 진료/시술 경험 있음</div>
              </button>

              <button
                type="button"
                onClick={() => setHospitalExp(false)}
                className={`p-5 rounded-2xl border text-center space-y-2 transition-all ${
                  !hospitalExp
                    ? 'border-brand-500 bg-brand-50/80 text-brand-900 ring-1 ring-brand-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <Sparkles className={`w-6 h-6 mx-auto ${!hospitalExp ? 'text-brand-600' : 'text-slate-400'}`} />
                <div className="font-bold text-sm">없음</div>
                <div className="text-[11px] text-slate-500">피부과 방문 경험 없음</div>
              </button>
            </div>

            {hospitalExp && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="block text-xs font-semibold text-slate-700">최근 방문 시기</label>
                <select
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                  value={recentVisit}
                  onChange={(e) => setRecentVisit(e.target.value)}
                >
                  <option value="최근 1개월 이내">최근 1개월 이내</option>
                  <option value="최근 6개월 이내">최근 6개월 이내</option>
                  <option value="최근 1년 이내">최근 1년 이내</option>
                  <option value="1년 이상 전">1년 이상 전</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Usage Goal */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-xl font-bold text-slate-900">DermaTrace AI의 주요 사용 목적은 무엇인가요?</h2>
              <p className="text-xs text-slate-500 mt-1">목적에 맞게 맞춤형 홈 화면과 인사이트 탭을 구성해 드립니다.</p>
            </div>

            <div className="space-y-2.5">
              {GOALS.map((goal) => {
                const isSelected = usageGoal === goal;
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setUsageGoal(goal)}
                    className={`w-full p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/80 text-brand-800 shadow-xs ring-1 ring-brand-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{goal}</span>
                    {isSelected && <Check className="w-4 h-4 text-brand-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="gap-2 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>이전</span>
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button
              type="button"
              onClick={() => setStep(step + 1)}
              className="gap-2 font-bold bg-brand-600 hover:bg-brand-700 text-white"
            >
              <span>다음</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleFinish}
              isLoading={isSubmitting}
              className="gap-2 font-bold bg-brand-600 hover:bg-brand-700 text-white"
            >
              <span>완료 및 시작하기</span>
              <Check className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
