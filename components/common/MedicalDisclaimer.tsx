import React from 'react';
import { ShieldAlert } from 'lucide-react';

export interface MedicalDisclaimerProps {
  className?: string;
  compact?: boolean;
}

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({ className = '', compact = false }) => {
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed ${className}`}
      role="note"
      aria-label="의료적 안내 및 진단 제외 방침"
    >
      <ShieldAlert className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold text-slate-800 mr-1">의료적 안내:</span>
        {compact ? (
          '본 서비스의 AI 분석 결과는 의료적 진단을 대신하지 않으며, 입력된 기록 기반 참고 정보입니다.'
        ) : (
          'DermaTrace AI의 분석 결과는 의료적 진단이나 치료를 대신하지 않습니다. 입력된 정보와 기록을 바탕으로 한 참고 정보이며, 지속적이거나 심각한 증상이 있는 경우 전문 의료기관의 상담을 권장합니다.'
        )}
      </div>
    </div>
  );
};
