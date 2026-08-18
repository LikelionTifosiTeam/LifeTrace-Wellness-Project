'use client';

import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Download,
  Trash2,
  Lock,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { MainShell } from '@/components/common/MainShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';

export default function ProfilePage() {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <MainShell>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="space-y-2">
          <Badge variant="brand">USER PROFILE</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">프로필 및 데이터 관리</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            내 개인정보 및 저장된 피부 기록 데이터 관리 방침을 설정합니다.
          </p>
        </div>

        {/* Profile Info Card */}
        <Card className="p-6 sm:p-8 bg-white border-slate-200 space-y-6 rounded-3xl shadow-soft">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
            <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-700 font-black text-lg flex items-center justify-center border-2 border-brand-200">
              민수
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">김민수 님</h2>
              <p className="text-xs text-slate-500">2002년생 (만 24세) • 남성 • 가입일: 2026.05.10</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-semibold">등록된 피부 고민</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge variant="brand">여드름</Badge>
                <Badge variant="warning">붉은기</Badge>
                <Badge variant="success">피부결</Badge>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-semibold">피부 타입</span>
              <p className="font-bold text-slate-800 pt-1">지복합성 (T존 유분 / 턱 트러블 민감)</p>
            </div>
          </div>
        </Card>

        {/* Data Ownership & Privacy Stats */}
        <Card className="p-6 bg-white border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">보안 및 저장 데이터 현황</h3>
            </div>
            <span className="text-xs text-emerald-600 font-bold">암호화 저장 중</span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-semibold text-slate-500">피부 사진</span>
              <div className="text-lg font-black text-slate-900 mt-1">12 장</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-semibold text-slate-500">피부 기록</span>
              <div className="text-lg font-black text-slate-900 mt-1">28 회</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-semibold text-slate-500">치료 이력</span>
              <div className="text-lg font-black text-slate-900 mt-1">6 건</div>
            </div>
          </div>
        </Card>

        {/* Data Management Actions */}
        <Card className="p-6 bg-white border-slate-200 space-y-4">
          <h3 className="text-base font-bold text-slate-900">내 데이터 소유권 및 내보내기</h3>
          <p className="text-xs text-slate-500">
            DermaTrace AI는 사용자의 데이터를 절대 제3자에게 임의로 제공하지 않으며, 언제든 다운로드하거나 완전히 삭제할 수 있습니다.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsDownloadModalOpen(true)}
              className="gap-2 font-bold text-xs bg-white"
            >
              <Download className="w-4 h-4 text-brand-600" />
              <span>[내 데이터 다운로드]</span>
            </Button>

            <Button
              variant="danger"
              onClick={() => setIsDeleteModalOpen(true)}
              className="gap-2 font-bold text-xs"
            >
              <Trash2 className="w-4 h-4" />
              <span>[내 데이터 삭제]</span>
            </Button>
          </div>
        </Card>

        <MedicalDisclaimer />

        {/* Download Modal */}
        <Modal isOpen={isDownloadModalOpen} onClose={() => setIsDownloadModalOpen(false)} title="내 데이터 다운로드">
          <div className="space-y-4 text-xs">
            <p className="text-slate-700">
              사용자의 피부 기록, 치료 이력, AI 분석 결과가 표준 JSON 형식으로 안전하게 백업 파일로 준비됩니다.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
              파일명: <code>dermatrace_backup_minsu_kim.json</code>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setIsDownloadModalOpen(false)}>
                취소
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  alert('데이터 다운로드가 시작되었습니다.');
                  setIsDownloadModalOpen(false);
                }}
                className="bg-brand-600 text-white font-bold"
              >
                다운로드 실행
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Modal */}
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="내 데이터 전체 삭제">
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl font-bold">
              ⚠️ 주의: 모든 피부 상태 기록, 분석 이력 및 예약 정보가 영구적으로 삭제되며 복구할 수 없습니다.
            </div>
            <p className="text-slate-600">정말로 모든 데이터를 삭제하시겠습니까?</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                취소
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  alert('데이터 삭제가 요청되었습니다.');
                  setIsDeleteModalOpen(false);
                }}
                className="font-bold"
              >
                영구 삭제 실행
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </MainShell>
  );
}
