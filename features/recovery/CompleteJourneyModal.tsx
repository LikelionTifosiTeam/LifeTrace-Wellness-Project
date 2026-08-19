'use client';

import React, { useState } from 'react';
import { Flag, Star } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface CompleteJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  procedureName: string;
  currentDay: number;
  totalDays: number;
  onSubmit: (satisfactionScore: number, note?: string) => Promise<void>;
}

/**
 * 여정 마무리.
 *
 * 90일을 다 채우지 않아도 사용자가 원할 때 끝낼 수 있어야 한다.
 * 다만 결과가 보이기 시작하는 시점 전에 끝내면 그 사실을 알려준다 —
 * 이 서비스의 가치가 후반부에 있기 때문이다.
 */
export const CompleteJourneyModal: React.FC<CompleteJourneyModalProps> = ({
  isOpen,
  onClose,
  procedureName,
  currentDay,
  totalDays,
  onSubmit,
}) => {
  const [score, setScore] = useState(4);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isEarly = currentDay < totalDays - 1;

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await onSubmit(score, note.trim() || undefined);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="이 회복 여정을 마칠까요?">
      <p className="text-sm text-slate-700 font-medium">{procedureName}</p>
      <p className="text-xs text-slate-500 mt-1">
        D+{currentDay}까지 기록했습니다.
      </p>

      {isEarly && (
        <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
          아직 D+{totalDays - 1}까지 {totalDays - 1 - currentDay}일 남았습니다. 지금 마치면 이후
          변화는 기록되지 않습니다. 마친 뒤에도 기록은 그대로 보관됩니다.
        </div>
      )}

      <div className="mt-5">
        <p className="text-xs font-semibold text-slate-700 mb-2">이번 시술 결과에 만족하시나요?</p>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setScore(n)}
              aria-label={`${n}점`}
              aria-pressed={score === n}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Star
                className={cn(
                  'w-6 h-6',
                  n <= score ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <Textarea
        label="남기고 싶은 메모 (선택)"
        placeholder="다음 시술 때 기억하고 싶은 것"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="mt-4 min-h-[80px]"
      />

      <p className="text-[11px] text-slate-400 leading-relaxed mt-3">
        기록에서 뽑아낸 회복 패턴이 자동으로 함께 저장되어, 다음 시술의 개인화 입력이 됩니다.
      </p>

      <div className="flex gap-2 mt-6">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          취소
        </Button>
        <Button className="flex-1 gap-2" isLoading={isSaving} onClick={handleSubmit}>
          <Flag className="w-4 h-4" />
          여정 마치기
        </Button>
      </div>
    </Modal>
  );
};
