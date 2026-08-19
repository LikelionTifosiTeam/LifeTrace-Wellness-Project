'use client';

import React, { useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { SymptomKey } from '@/types';
import { SYMPTOM_LABELS, SYMPTOM_ORDER } from '@/lib/recovery';
import { symptomMetaMap } from '@/mock/data';
import { cn } from '@/lib/utils';

export interface BackfillModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 아직 기록이 없는 D+N 목록 */
  missingDays: number[];
  onSubmit: (day: number, symptoms: Record<SymptomKey, number>) => Promise<void>;
}

const emptySymptoms = (): Record<SymptomKey, number> =>
  SYMPTOM_ORDER.reduce((acc, k) => ({ ...acc, [k]: 0 }), {} as Record<SymptomKey, number>);

/**
 * 지난 날짜 채워넣기.
 *
 * 시술 후 며칠 지나 앱을 알게 된 사용자는 D+0부터의 곡선이 비어 있다.
 * 기억나는 만큼만 소급 입력할 수 있게 해서 곡선이 끊기지 않도록 한다.
 * 소요 시간은 0으로 저장해 '30초 체크인' 지표를 오염시키지 않는다.
 */
export const BackfillModal: React.FC<BackfillModalProps> = ({
  isOpen,
  onClose,
  missingDays,
  onSubmit,
}) => {
  const [day, setDay] = useState<number | null>(missingDays[0] ?? null);
  const [symptoms, setSymptoms] = useState<Record<SymptomKey, number>>(emptySymptoms());
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (day === null) return;
    setIsSaving(true);
    try {
      await onSubmit(day, symptoms);
      setSymptoms(emptySymptoms());
      setDay(null);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="지난 날 채워넣기">
      <p className="text-xs text-slate-500 leading-relaxed mb-4">
        기억나는 만큼만 입력하세요. 정확하지 않아도 곡선의 흐름을 잇는 데 도움이 됩니다.
      </p>

      <div className="mb-5">
        <p className="text-xs font-semibold text-slate-700 mb-2">어느 날인가요?</p>
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
          {missingDays.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDay(d)}
              aria-pressed={day === d}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                day === d
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200'
              )}
            >
              D+{d}
            </button>
          ))}
        </div>
      </div>

      {day !== null && (
        <div className="space-y-4">
          {SYMPTOM_ORDER.map((key) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-slate-800">{SYMPTOM_LABELS[key]}</span>
                <span className="text-xs text-slate-500">
                  {symptomMetaMap[key].scaleLabels[symptoms[key]]}
                </span>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSymptoms((s) => ({ ...s, [key]: level }))}
                    aria-label={`${SYMPTOM_LABELS[key]} ${level}단계`}
                    aria-pressed={symptoms[key] === level}
                    className={cn(
                      'flex-1 h-9 rounded-lg text-xs font-bold border transition-colors',
                      symptoms[key] === level
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-slate-500 border-slate-200'
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-6">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          취소
        </Button>
        <Button
          className="flex-1 gap-2"
          disabled={day === null}
          isLoading={isSaving}
          onClick={handleSave}
        >
          <CalendarPlus className="w-4 h-4" />
          저장
        </Button>
      </div>
    </Modal>
  );
};
