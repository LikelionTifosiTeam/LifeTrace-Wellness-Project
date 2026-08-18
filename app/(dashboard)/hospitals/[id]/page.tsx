'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  MapPin,
  Phone,
  Clock,
  Star,
  Building2,
  CalendarCheck,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import { MainShell } from '@/components/common/MainShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/states/Skeleton';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';
import { Hospital } from '@/types';
import { hospitalService } from '@/services/hospital';

export default function HospitalDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || 'hosp-01';

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    hospitalService.getHospitalById(id).then((res) => {
      setHospital(res || null);
      setIsLoading(false);
    });
  }, [id]);

  if (isLoading || !hospital) {
    return (
      <MainShell>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </MainShell>
    );
  }

  return (
    <MainShell>
      <div className="space-y-8">
        {/* Hospital Header Banner */}
        <Card className="bg-white border-slate-200 p-6 sm:p-8 space-y-6 rounded-3xl shadow-soft">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {hospital.isSpecialist && <Badge variant="brand">피부과 전문의</Badge>}
                {hospital.availableToday && <Badge variant="success">오늘 진료 가능</Badge>}
                <span className="text-xs text-slate-400 font-medium">거리 {hospital.distance}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900">{hospital.name}</h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-1 text-slate-900 font-bold">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{hospital.rating}</span>
                  <span className="text-slate-400 font-normal">({hospital.reviewCount} 리뷰)</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{hospital.address}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{hospital.phone}</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col gap-2">
              <Link href={`/hospitals/${hospital.id}/reservation`}>
                <Button size="lg" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold gap-2 shadow-md">
                  <CalendarCheck className="w-5 h-5" />
                  <span>진료 / 시술 예약하기</span>
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Why Recommended Section */}
        <Card className="p-5 bg-gradient-to-r from-brand-50 to-white border-brand-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-800">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>AI 추천 연관성</span>
          </div>
          <p className="text-xs font-semibold text-slate-800 leading-relaxed">
            &quot;현재 피부 고민(여드름, 붉은기)과 관련된 전문 진료 및 케어 정보를 제공하는 의료기관입니다.&quot;
          </p>
        </Card>

        {/* Specialties & Operating Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-white border-slate-200 space-y-3">
            <h3 className="text-base font-bold text-slate-900">주요 진료 분야</h3>
            <div className="flex flex-wrap gap-2">
              {hospital.specialties.map((s) => (
                <span key={s} className="px-3 py-1 rounded-xl bg-brand-50 text-brand-800 border border-brand-100 text-xs font-bold">
                  {s}
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-white border-slate-200 space-y-3">
            <h3 className="text-base font-bold text-slate-900">진료 및 영업 시간</h3>
            <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{hospital.businessHours}</span>
            </div>
          </Card>
        </div>

        {/* Procedure Cards (Non-prescriptive information) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">제공 시술 및 케어 정보</h2>
            <span className="text-xs text-slate-400">의료진 상담 참고용 정보입니다</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {hospital.procedures.map((proc) => (
              <Card key={proc.id} className="p-6 bg-white border-slate-200 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <Badge variant="accent">케어 정보</Badge>
                  <h4 className="text-base font-bold text-slate-900">{proc.name}</h4>
                  <p className="text-xs font-semibold text-brand-700">목적: {proc.purpose}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{proc.features}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <div className="font-semibold text-slate-700">회복 및 다운타임:</div>
                  <div>{proc.recoveryInfo}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Location & Map */}
        <Card className="p-6 bg-white border-slate-200 space-y-4">
          <h3 className="text-base font-bold text-slate-900">오시는 길 및 상세 위치</h3>
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 h-48 flex items-center justify-center text-xs text-slate-500 font-medium">
            <div className="text-center space-y-1">
              <MapPin className="w-6 h-6 text-brand-600 mx-auto" />
              <p className="font-bold text-slate-800">{hospital.address}</p>
              <p className="text-[11px] text-slate-400">인근 지하철역 도보 5분 거리</p>
            </div>
          </div>
        </Card>

        <MedicalDisclaimer />
      </div>
    </MainShell>
  );
}
