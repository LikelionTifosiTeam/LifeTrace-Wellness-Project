'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Building2,
  MapPin,
  Star,
  Clock,
  Map as MapIcon,
  ListFilter,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { MainShell } from '@/components/common/MainShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/states/Skeleton';
import { EmptyState } from '@/components/states/EmptyState';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';
import { Hospital, ConcernType } from '@/types';
import { hospitalService } from '@/services/hospital';

const FILTER_TAGS: (ConcernType | '전체')[] = [
  '전체', '여드름', '붉은기', '색소', '흉터', '피부결', '모공'
];

export default function HospitalSearchPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters State
  const [query, setQuery] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<ConcernType | '전체'>('전체');
  const [specialistOnly, setSpecialistOnly] = useState<boolean>(false);
  const [availableToday, setAvailableToday] = useState<boolean>(false);
  const [mobileShowMap, setMobileShowMap] = useState<boolean>(false);

  const fetchHospitals = async () => {
    setIsLoading(true);
    try {
      const res = await hospitalService.getHospitals({
        query,
        specialistOnly,
        specialty: selectedSpecialty,
        availableToday,
      });
      setHospitals(res);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, [selectedSpecialty, specialistOnly, availableToday]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHospitals();
  };

  return (
    <MainShell>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="brand">HOSPITAL DIRECTORY</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">내 주변 피부과 찾기</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              내 피부 고민 관련 진료를 제공하는 검증된 전문 의료기관을 탐색해보세요.
            </p>
          </div>

          {/* Mobile Map Toggle Button */}
          <div className="lg:hidden">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMobileShowMap(!mobileShowMap)}
              className="gap-2 font-bold text-xs bg-white"
            >
              <MapIcon className="w-4 h-4 text-brand-600" />
              <span>{mobileShowMap ? '목록으로 보기' : '지도 토글 보기'}</span>
            </Button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <Card className="p-4 bg-white border-slate-200 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <Input
                placeholder="지역명 또는 병원 이름 검색 (예: 강남구, 더마블라썸)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-5">
              검색
            </Button>
          </form>

          {/* Filter Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {FILTER_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedSpecialty(tag)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedSpecialty === tag
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-700 font-medium shrink-0">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={specialistOnly}
                  onChange={(e) => setSpecialistOnly(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span>피부과 전문의만</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={availableToday}
                  onChange={(e) => setAvailableToday(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span>오늘 예약 가능</span>
              </label>
            </div>
          </div>
        </Card>

        {/* Map + List Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Hospital List (Desktop 7 cols, Mobile depending on toggle) */}
          <div className={`space-y-4 ${mobileShowMap ? 'hidden lg:block lg:col-span-7' : 'lg:col-span-7'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">총 {hospitals.length}개의 의료기관 탐색</span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-36 w-full" />
              </div>
            ) : hospitals.length === 0 ? (
              <EmptyState title="조건에 일치하는 병원이 없습니다." message="검색어나 필터를 조정한 후 다시 시도해 보세요." />
            ) : (
              <div className="space-y-4">
                {hospitals.map((hosp) => (
                  <Card key={hosp.id} hoverEffect className="p-5 bg-white border-slate-200 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{hosp.name}</h3>
                          {hosp.isSpecialist && <Badge variant="brand">피부과 전문의</Badge>}
                          {hosp.availableToday && <Badge variant="success">오늘 가능</Badge>}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{hosp.address}</span>
                          <span className="font-semibold text-brand-600 ml-1">({hosp.distance})</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-800 justify-end">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>{hosp.rating}</span>
                          <span className="text-slate-400 font-normal">({hosp.reviewCount})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {hosp.specialties.map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600">
                          #{s}
                        </span>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{hosp.businessHours}</span>
                      </div>

                      <Link href={`/hospitals/${hosp.id}`}>
                        <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-1">
                          <span>상세 보기</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Map Section Mockup (Desktop 5 cols) */}
          <div className={`lg:sticky lg:top-24 ${!mobileShowMap ? 'hidden lg:block lg:col-span-5' : 'lg:col-span-5'}`}>
            <Card className="p-0 overflow-hidden bg-slate-100 border-slate-200 h-[520px] relative flex flex-col items-center justify-center text-center">
              {/* Map Canvas Visual Mockup */}
              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
              
              {/* Map Pins Mockup */}
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center mx-auto shadow-lg animate-bounce">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="bg-white/90 backdrop-blur-xs p-3 rounded-2xl border border-slate-200 shadow-md max-w-xs mx-auto">
                  <p className="text-xs font-bold text-slate-900">내 현재 위치 주변 병원</p>
                  <p className="text-[11px] text-slate-500">강남구 테헤란로 반경 5km 탐색 중</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <MedicalDisclaimer />
      </div>
    </MainShell>
  );
}
