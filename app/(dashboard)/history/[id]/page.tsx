'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Calendar,
  Building2,
  Star,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { MainShell } from '@/components/common/MainShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/states/Skeleton';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';
import { TreatmentRecord } from '@/types';
import { treatmentService } from '@/services/treatment';

export default function TreatmentDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || 'treat-006';

  const [record, setRecord] = useState<TreatmentRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    treatmentService.getTreatmentById(id).then((res) => {
      setRecord(res || null);
      setIsLoading(false);
    });
  }, [id]);

  if (isLoading || !record) {
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
        <Link href="/history" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          <span>전체 이력 목록으로 돌아가기</span>
        </Link>

        {/* Header Card */}
        <Card className="p-6 sm:p-8 bg-white border-slate-200 space-y-4 rounded-3xl shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="brand">{record.category}</Badge>
                <span className="text-xs text-slate-400 font-medium">방문일: {record.visitDate}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">{record.hospitalName}</h1>
            </div>

            <div className="flex items-center gap-1 text-sm font-bold text-amber-500 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>사용자 만족도 {record.satisfactionScore} / 5점</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-semibold text-slate-700">
              주요 피부 고민: <span className="text-brand-600 font-bold">{record.mainConcern}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {record.procedureNames.map((p) => (
                <span key={p} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/* Before / After Photo Comparison View */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-brand-600" />
            <span>치료 전/후 경과 사진 (Before & After)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4 bg-white border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Before (치료 전)</span>
                <span className="text-[10px] text-slate-400">{record.visitDate} 당일</span>
              </div>
              <div className="h-48 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-400 font-medium overflow-hidden">
                {record.beforePhotoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={record.beforePhotoUrl} alt="Before" className="w-full h-full object-cover" />
                ) : (
                  <span>Before 사진 기록 없음</span>
                )}
              </div>
            </Card>

            <Card className="p-4 bg-white border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-700">After (치료 3일 후)</span>
                <span className="text-[10px] text-brand-600 font-semibold">진정 경과 관찰</span>
              </div>
              <div className="h-48 rounded-2xl bg-brand-50/50 border border-brand-200 flex items-center justify-center text-xs text-slate-400 font-medium overflow-hidden">
                {record.afterPhotoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={record.afterPhotoUrl} alt="After" className="w-full h-full object-cover" />
                ) : (
                  <span>After 사진 기록 없음</span>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Notes & Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-white border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-brand-600" />
              <span>사용자 직접 작성 메모</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {record.userNotes || '작성된 메모가 없습니다.'}
            </p>
          </Card>

          <Card className="p-6 bg-white border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>치료 이후 피부 변화 경과</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {record.outcomeFeedback || '등록된 경과 정보가 없습니다.'}
            </p>
          </Card>
        </div>

        <MedicalDisclaimer />
      </div>
    </MainShell>
  );
}
