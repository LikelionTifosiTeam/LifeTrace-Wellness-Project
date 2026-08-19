'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Bell, Check, Download, Shield, Stethoscope, Trash2 } from 'lucide-react';
import { MainShell } from '@/components/common/MainShell';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/states/Skeleton';
import { ErrorState } from '@/components/states/ErrorState';
import { User } from '@/types';
import { authService } from '@/services/auth';
import { checkinService } from '@/services/checkin';
import { cn, todayKST } from '@/lib/utils';

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cn(
      'w-11 h-6 rounded-full transition-colors shrink-0 relative disabled:opacity-50',
      checked ? 'bg-brand-600' : 'bg-slate-200'
    )}
  >
    <span
      className={cn(
        'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
        checked ? 'translate-x-[22px]' : 'translate-x-0.5'
      )}
    />
  </button>
);

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const [reminderOn, setReminderOn] = useState(true);
  const [reminderTime, setReminderTime] = useState('21:30');

  const load = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const u = await authService.getCurrentUser();
      setUser(u);
      setReminderTime(u.checkinReminderTime);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (patch: Parameters<typeof authService.updateProfile>[0]) => {
    setIsSaving(true);
    try {
      setUser(await authService.updateProfile(patch));
      setSavedAt(Date.now());
    } catch {
      setIsError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    const [u, checkins] = await Promise.all([
      authService.getCurrentUser(),
      checkinService.getCheckins(),
    ]);
    const blob = new Blob([JSON.stringify({ user: u, checkins }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `afterglow-export-${todayKST()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainShell title="설정">
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-32" />
        </div>
      )}
      {!isLoading && isError && <ErrorState onRetry={load} />}

      {!isLoading && !isError && user && (
        <div className="space-y-4">
          <div className="flex items-center justify-end gap-2">
            {savedAt && !isSaving && (
              <span className="flex items-center gap-1 text-xs text-brand-700 font-semibold">
                <Check className="w-3.5 h-3.5" />
                저장됨
              </span>
            )}
          </div>

          <Card>
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-1">
              <Bell className="w-4 h-4 text-slate-400" />
              체크인 알림
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              회복 초기에는 매일, 4주 이후에는 주 2회로 자동으로 줄어듭니다. 알림은 강요가 아니라
              안심을 위한 것이므로 언제든 끌 수 있습니다.
            </p>

            <div className="flex items-center gap-3 py-2">
              <span className="text-sm text-slate-700 flex-1">알림 받기</span>
              <Toggle checked={reminderOn} onChange={setReminderOn} label="체크인 알림" />
            </div>

            {reminderOn && (
              <div className="flex items-center gap-3 py-2 border-t border-slate-100">
                <span className="text-sm text-slate-700 flex-1">알림 시간</span>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  onBlur={() => save({ checkinReminderTime: reminderTime })}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  aria-label="알림 시간"
                />
              </div>
            )}
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-1">
              <Stethoscope className="w-4 h-4 text-slate-400" />
              클리닉 기록 공유
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              시술명·시술일·병원 정보는 개인정보보호법상 민감정보입니다. 회복 곡선을 벗어난
              경우에만, 그리고 회원님이 켜둔 경우에만 시술받은 의료기관에 공유됩니다. 끄면 즉시
              공유가 중단됩니다.
            </p>
            <div className="flex items-center gap-3 py-2">
              <span className="text-sm text-slate-700 flex-1">이탈 감지 시 클리닉에 공유</span>
              <Toggle
                checked={user.clinicSharingConsent}
                disabled={isSaving}
                onChange={(v) => save({ clinicSharingConsent: v })}
                label="클리닉 공유"
              />
            </div>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-1">
              <Shield className="w-4 h-4 text-slate-400" />
              내 데이터
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              기록은 회원님의 것입니다. 언제든 내려받거나 완전히 삭제할 수 있습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="gap-2 flex-1" onClick={handleExport}>
                <Download className="w-4 h-4" />
                전체 기록 내려받기 (JSON)
              </Button>
              <Button variant="danger" className="gap-2 flex-1" onClick={() => setShowDelete(true)}>
                <Trash2 className="w-4 h-4" />
                계정 및 기록 삭제
              </Button>
            </div>
          </Card>

          <MedicalDisclaimer />
        </div>
      )}

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="정말 삭제할까요?">
        <p className="text-sm text-slate-600 leading-relaxed">
          체크인 기록, 회복 곡선, 클리닉에 공유된 내용까지 모두 삭제됩니다. 이 작업은 되돌릴 수
          없습니다.
        </p>
        <div className="flex gap-2 mt-6">
          <Button variant="outline" className="flex-1" onClick={() => setShowDelete(false)}>
            취소
          </Button>
          <Button variant="danger" className="flex-1" onClick={() => setShowDelete(false)}>
            삭제하기
          </Button>
        </div>
      </Modal>
    </MainShell>
  );
}
