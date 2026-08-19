import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MedicalDisclaimerProps {
  className?: string;
  compact?: boolean;
}

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({
  className,
  compact = false,
}) => {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl bg-slate-100/70 border border-slate-200/80 text-xs text-slate-600 leading-relaxed',
        className
      )}
      role="note"
      aria-label="의료적 안내"
    >
      <ShieldAlert className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold text-slate-800 mr-1">의료적 안내:</span>
        {compact
          ? 'AfterGlow는 진단하지 않습니다. 회복 안내는 기록 기반 참고 정보입니다.'
          : 'AfterGlow는 시술 후 회복 과정을 기록하고 안내하는 서비스로, 의료적 진단이나 치료를 대신하지 않습니다. 표시되는 회복 곡선과 안내는 입력된 기록과 시술 프로토콜을 바탕으로 계산된 참고 정보이며, 통증이 갑자기 심해지거나 한쪽만 붓는 등 평소와 다른 변화가 있으면 시술받은 의료기관에 상담을 요청하세요.'}
      </div>
    </div>
  );
};
