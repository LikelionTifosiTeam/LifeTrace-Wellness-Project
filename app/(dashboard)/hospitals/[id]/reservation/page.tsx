'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Building2,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { MainShell } from '@/components/common/MainShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';
import { Hospital } from '@/types';
import { hospitalService } from '@/services/hospital';
import { reservationService } from '@/services/reservation';

const AVAILABLE_TIMES = ['10:00', '11:30', '14:00', '15:30', '17:00', '18:30'];
const PURPOSES = ['맞춤 여드름 스케일링 & 압출', '진정 쿨링 레이저', '피부 질환 전문의 상담', '색소 및 자국 개선 케어'];

export default function ReservationPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || 'hosp-01';

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [step, setStep] = useState<number>(1);

  // Form state
  const [selectedPurpose, setSelectedPurpose] = useState<string>(PURPOSES[0]);
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-22');
  const [selectedTime, setSelectedTime] = useState<string>('14:00');
  const [patientName, setPatientName] = useState<string>('김민수');
  const [patientPhone, setPatientPhone] = useState<string>('010-1234-5678');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  useEffect(() => {
    hospitalService.getHospitalById(id).then((res) => setHospital(res || null));
  }, [id]);

  const handleConfirmReservation = async () => {
    if (!hospital) return;
    setIsSubmitting(true);
    try {
      await reservationService.createReservation({
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        purpose: selectedPurpose,
        date: selectedDate,
        time: selectedTime,
        patientName,
        patientPhone,
      });
      setIsCompleted(true);
    } catch {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <MainShell>
        <div className="max-w-md mx-auto py-12">
          <Card className="p-8 space-y-6 text-center bg-white border border-emerald-200 shadow-xl rounded-3xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <Badge variant="success">예약 완료</Badge>
              <h2 className="text-2xl font-black text-slate-900">예약 정보가 저장되었습니다</h2>
              <p className="text-xs text-slate-500">
                선택하신 시간에 병원 방문 확정 안내 문자가 발송될 예정입니다.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div>
                <span className="text-slate-400">의료기관:</span>{' '}
                <span className="font-bold text-slate-900">{hospital?.name}</span>
              </div>
              <div>
                <span className="text-slate-400">일시:</span>{' '}
                <span className="font-bold text-brand-700">{selectedDate} {selectedTime}</span>
              </div>
              <div>
                <span className="text-slate-400">진료 목적:</span>{' '}
                <span className="font-semibold text-slate-800">{selectedPurpose}</span>
              </div>
              <div>
                <span className="text-slate-400">예약자:</span>{' '}
                <span className="font-semibold text-slate-800">{patientName} ({patientPhone})</span>
              </div>
            </div>

            <Button
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold"
              onClick={() => router.push('/dashboard')}
            >
              대시보드로 돌아가기
            </Button>
          </Card>
        </div>
      </MainShell>
    );
  }

  return (
    <MainShell>
      <div className="max-w-xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Badge variant="brand">HOSPITAL RESERVATION</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">의료기관 진료 예약</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {hospital?.name || '피부과'} 예약 정보 입력
          </p>
        </div>

        <Card className="p-6 sm:p-8 bg-white border-slate-200 space-y-6 shadow-soft rounded-3xl">
          {/* Progress Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-brand-600">STEP {step} / 5</span>
              <span className="text-slate-400">예약 진행단계</span>
            </div>
            <Progress value={(step / 5) * 100} />
          </div>

          {/* Step 1: Confirm Hospital */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-900">예약 병원 정보 확인</h2>
              <div className="p-4 rounded-2xl bg-brand-50/50 border border-brand-100 space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-brand-600" />
                  <h3 className="text-base font-bold text-slate-900">{hospital?.name}</h3>
                </div>
                <p className="text-xs text-slate-600">{hospital?.address}</p>
                <p className="text-xs text-slate-500">운영시간: {hospital?.businessHours}</p>
              </div>
            </div>
          )}

          {/* Step 2: Purpose */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-900">방문 및 진료 목적 선택</h2>
              <div className="space-y-2.5">
                {PURPOSES.map((purpose) => (
                  <button
                    key={purpose}
                    type="button"
                    onClick={() => setSelectedPurpose(purpose)}
                    className={`w-full p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all ${
                      selectedPurpose === purpose
                        ? 'border-brand-500 bg-brand-50 text-brand-900 ring-1 ring-brand-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{purpose}</span>
                    {selectedPurpose === purpose && <CheckCircle2 className="w-4 h-4 text-brand-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Date */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-900">방문 날짜 선택</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {['2026-08-20', '2026-08-21', '2026-08-22', '2026-08-24', '2026-08-25', '2026-08-26'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`p-3.5 rounded-2xl border text-xs font-bold text-center transition-all ${
                      selectedDate === d
                        ? 'border-brand-500 bg-brand-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Time */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-900">방문 시간 선택</h2>
              <div className="grid grid-cols-3 gap-3">
                {AVAILABLE_TIMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTime(t)}
                    className={`p-3.5 rounded-2xl border text-xs font-bold text-center transition-all ${
                      selectedTime === t
                        ? 'border-brand-500 bg-brand-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Patient Info */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-900">예약자 정보 입력 및 확인</h2>
              <Input label="예약자 성함" value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
              <Input label="연락처" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} required />
            </div>
          )}

          {/* Wizard Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="gap-1.5 text-xs">
                <ArrowLeft className="w-4 h-4" />
                <span>이전</span>
              </Button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <Button type="button" onClick={() => setStep(step + 1)} className="gap-1.5 font-bold bg-brand-600 text-white">
                <span>다음</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleConfirmReservation}
                isLoading={isSubmitting}
                className="gap-2 font-bold bg-brand-600 hover:bg-brand-700 text-white py-3 px-6"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>예약 완료하기</span>
              </Button>
            )}
          </div>
        </Card>

        <MedicalDisclaimer />
      </div>
    </MainShell>
  );
}
