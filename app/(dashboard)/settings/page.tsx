'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Lock,
  Globe,
  Sparkles,
  Database,
  LogOut,
  Check
} from 'lucide-react';
import { MainShell } from '@/components/common/MainShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';

export default function SettingsPage() {
  const [notifyApp, setNotifyApp] = useState(true);
  const [notifyMarketing, setNotifyMarketing] = useState(false);
  const [aiConsent, setAiConsent] = useState(true);
  const [language, setLanguage] = useState('ko');

  return (
    <MainShell>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="space-y-2">
          <Badge variant="brand">SETTINGS</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">환경 설정</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            앱 알림, AI 분석 동의 및 서비스 개인화 설정을 관리합니다.
          </p>
        </div>

        {/* Notification Settings */}
        <Card className="p-6 bg-white border-slate-200 space-y-4 rounded-3xl shadow-soft">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Bell className="w-4 h-4 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900">알림 설정</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-800">일일 피부 기록 및 주간 리포트 알림</p>
                <p className="text-slate-400">매일 저녁 피부 기록 작성 알림을 발송합니다.</p>
              </div>
              <input
                type="checkbox"
                checked={notifyApp}
                onChange={(e) => setNotifyApp(e.target.checked)}
                className="w-5 h-5 accent-brand-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              <div>
                <p className="font-bold text-slate-800">피부과 진료 및 예약 알림</p>
                <p className="text-slate-400">예약 일시 전 리마인드 알림 수신</p>
              </div>
              <input
                type="checkbox"
                checked={notifyMarketing}
                onChange={(e) => setNotifyMarketing(e.target.checked)}
                className="w-5 h-5 accent-brand-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </Card>

        {/* AI & Privacy Consent */}
        <Card className="p-6 bg-white border-slate-200 space-y-4 rounded-3xl shadow-soft">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900">AI 분석 및 개인정보 동의</h3>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-slate-800">AI 상관성 분석 데이터 활용 동의</p>
              <p className="text-slate-400">피부 사진 및 수면/스트레스 지수를 기반으로 AI 인사이트를 생성합니다.</p>
            </div>
            <input
              type="checkbox"
              checked={aiConsent}
              onChange={(e) => setAiConsent(e.target.checked)}
              className="w-5 h-5 accent-brand-600 rounded cursor-pointer"
            />
          </div>
        </Card>

        {/* Language & Account */}
        <Card className="p-6 bg-white border-slate-200 space-y-4 rounded-3xl shadow-soft">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Globe className="w-4 h-4 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900">언어 및 계정 관리</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">서비스 언어</label>
              <select
                className="w-full sm:w-64 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="ko">한국어 (Korean)</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <Link href="/login">
                <Button variant="danger" size="sm" className="gap-2 font-bold">
                  <LogOut className="w-4 h-4" />
                  <span>계정 로그아웃</span>
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <MedicalDisclaimer />
      </div>
    </MainShell>
  );
}
