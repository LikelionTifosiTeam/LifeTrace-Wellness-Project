'use client';

import React from 'react';
import { CareProtocol, RecoveryJourney, RecoveryPhase } from '@/types';
import { cn } from '@/lib/utils';

export interface PhaseProgressProps {
  protocol: CareProtocol;
  journey: RecoveryJourney;
  currentPhase: RecoveryPhase;
}

/** D+N을 화면에서 가장 큰 글자로. 시술 후 사용자가 가장 먼저 확인하는 숫자다. */
export const PhaseProgress: React.FC<PhaseProgressProps> = ({
  protocol,
  journey,
  currentPhase,
}) => {
  const total = protocol.totalRecoveryDays - 1;

  return (
    <div>
      <div className="flex items-end gap-3">
        <span className="text-5xl font-black tracking-tighter text-slate-900 leading-none">
          D+{journey.currentDay}
        </span>
        <div className="pb-1 min-w-0">
          <p className="text-sm font-bold text-brand-700">{currentPhase.label}</p>
          <p className="text-xs text-slate-500 truncate">{journey.procedureName}</p>
        </div>
      </div>

      <p className="text-[13px] text-slate-600 leading-relaxed mt-3">{currentPhase.summary}</p>

      <div className="mt-4">
        <div className="flex h-2 rounded-full overflow-hidden bg-slate-100" role="presentation">
          {protocol.phases.map((p) => {
            const width = ((p.endDay - p.startDay + 1) / (total + 1)) * 100;
            const passed = journey.currentDay > p.endDay;
            const active = p.key === currentPhase.key;
            return (
              <div
                key={p.key}
                style={{ width: `${width}%` }}
                className={cn(
                  'h-full border-r border-white last:border-r-0 transition-colors',
                  passed ? 'bg-brand-500' : active ? 'bg-brand-300' : 'bg-slate-200'
                )}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
          {protocol.phases.map((p) => (
            <span
              key={p.key}
              className={cn(p.key === currentPhase.key && 'text-brand-700 font-bold')}
            >
              {p.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
