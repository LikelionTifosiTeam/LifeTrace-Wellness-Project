'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  PlusCircle,
  Building2,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Filter
} from 'lucide-react';
import { MainShell } from '@/components/common/MainShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/states/Skeleton';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';
import { TreatmentRecord, TreatmentCategory, ConcernType } from '@/types';
import { treatmentService } from '@/services/treatment';

const CATEGORIES: (TreatmentCategory | '전체')[] = ['전체', '진료', '치료', '시술', '피부 분석'];

export default function TreatmentHistoryPage() {
  const [records, setRecords] = useState<TreatmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<TreatmentCategory | '전체'>('전체');

  // Add Record Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [hospitalName, setHospitalName] = useState<string>('더마블라썸 피부과의원 강남점');
  const [visitDate, setVisitDate] = useState<string>('2026-08-18');
  const [mainConcern, setMainConcern] = useState<ConcernType>('여드름');
  const [category, setCategory] = useState<TreatmentCategory>('치료');
  const [procedures, setProcedures] = useState<string>('여드름 스케일링, LED 쿨링 레이저');
  const [notes, setNotes] = useState<string>('');
  const [satisfaction, setSatisfaction] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await treatmentService.getTreatmentHistory();
      setRecords(res);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await treatmentService.createTreatmentRecord({
        visitDate,
        hospitalName,
        mainConcern,
        category,
        procedureNames: procedures.split(',').map((p) => p.trim()),
        userNotes: notes,
        satisfactionScore: satisfaction,
        outcomeFeedback: feedback,
      });
      setIsModalOpen(false);
      fetchRecords();
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRecords = selectedCategory === '전체'
    ? records
    : records.filter((r) => r.category === selectedCategory);

  return (
    <MainShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="brand">MY SKIN JOURNEY</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">치료 및 피부과 방문 이력</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              과거 피부과 진료, 치료, 시술 이력을 타임라인 형태로 체계적으로 관리하세요.
            </p>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold gap-2 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ 치료 기록 추가</span>
          </Button>
        </div>

        {/* 6-Month Summary Card */}
        <Card className="p-6 bg-gradient-to-r from-slate-900 via-brand-900 to-navy-900 text-white rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-200">최근 6개월 케어 통계 요약</span>
            <span className="text-xs text-slate-300 font-medium">총 {records.length}건 등록됨</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-1">
              <span className="text-[11px] text-brand-100 font-semibold">여드름 관련 케어</span>
              <div className="text-xl sm:text-2xl font-black">45%</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-1">
              <span className="text-[11px] text-brand-100 font-semibold">붉은 자국 케어</span>
              <div className="text-xl sm:text-2xl font-black">25%</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-1">
              <span className="text-[11px] text-brand-100 font-semibold">피부결 스케일링</span>
              <div className="text-xl sm:text-2xl font-black">20%</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-1">
              <span className="text-[11px] text-brand-100 font-semibold">기타 진료</span>
              <div className="text-xl sm:text-2xl font-black">10%</div>
            </div>
          </div>
        </Card>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> 필터:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Timeline List */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : (
          <div className="relative border-l-2 border-brand-200 ml-4 pl-6 space-y-6">
            {filteredRecords.map((record) => (
              <div key={record.id} className="relative group">
                {/* Node Bullet */}
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-brand-600 shadow-xs" />

                <Card hoverEffect className="p-5 bg-white border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg">
                        {record.visitDate}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{record.hospitalName}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="brand">{record.category}</Badge>
                      <span className="text-xs text-amber-500 font-bold">★ {record.satisfactionScore}점</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-slate-700">
                      주요 고민: <span className="text-brand-600">{record.mainConcern}</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {record.procedureNames.map((proc) => (
                        <span key={proc} className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600">
                          {proc}
                        </span>
                      ))}
                    </div>
                    {record.userNotes && (
                      <p className="text-xs text-slate-500 italic mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        &quot;{record.userNotes}&quot;
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Link href={`/history/${record.id}`}>
                      <Button size="sm" variant="ghost" className="text-xs font-bold text-brand-600 gap-1 p-0">
                        <span>상세 이력 보기</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}

        <MedicalDisclaimer />
      </div>

      {/* Add Treatment Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="신규 치료/시술 기록 추가">
        <form onSubmit={handleAddRecord} className="space-y-4">
          <Input label="방문 의료기관 이름" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} required />
          <Input label="방문 날짜" type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} required />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">주요 피부 고민</label>
              <select
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                value={mainConcern}
                onChange={(e) => setMainConcern(e.target.value as ConcernType)}
              >
                <option value="여드름">여드름</option>
                <option value="붉은기">붉은기</option>
                <option value="색소">색소</option>
                <option value="피부결">피부결</option>
                <option value="모공">모공</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">구분 카테고리</label>
              <select
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                value={category}
                onChange={(e) => setCategory(e.target.value as TreatmentCategory)}
              >
                <option value="진료">진료</option>
                <option value="치료">치료</option>
                <option value="시술">시술</option>
                <option value="피부 분석">피부 분석</option>
              </select>
            </div>
          </div>

          <Input
            label="진료/시술명 (쉼표 구분)"
            placeholder="여드름 압출, 스케일링, LED 레이저"
            value={procedures}
            onChange={(e) => setProcedures(e.target.value)}
            required
          />

          <Textarea
            label="사용자 메모"
            placeholder="시술 시 느낀점이나 주의사항 기록"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <Textarea
            label="치료 후 피부 상태 변화 평가"
            placeholder="치료 3일 후 염증 반응 감소 등"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              취소
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-brand-600 text-white font-bold">
              이력 추가하기
            </Button>
          </div>
        </form>
      </Modal>
    </MainShell>
  );
}
