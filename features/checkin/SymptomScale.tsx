'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SymptomMeta } from '@/types';
import { cn } from '@/lib/utils';

export interface SymptomScaleProps {
  meta: SymptomMeta;
  value: number | undefined;
  onChange: (value: number) => void;
  /** 기대 곡선상 오늘 이 증상의 예상 수준. 사용자에게 기준선을 준다. */
  expected?: number;
}

const levelTone = [
  'bg-emerald-500',
  'bg-teal-500',
  'bg-amber-400',
  'bg-orange-500',
  'bg-red-500',
];

/**
 * 사진 대신 5단계 탭 입력.
 * 숫자만 보여주면 사람마다 기준이 달라지므로 각 단계에 상황 문장을 붙인다.
 */
export const SymptomScale: React.FC<SymptomScaleProps> = ({
  meta,
  value,
  onChange,
  expected,
}) => {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">{meta.label}</h2>
        {typeof expected === 'number' && (
          <span className="text-xs text-slate-500 shrink-0">
            오늘 예상 수준 {expected.toFixed(1)}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-500 mb-5">{meta.description}</p>

      <div
        className="space-y-2"
        role="radiogroup"
        aria-label={`${meta.label} 정도 선택`}
      >
        {meta.scaleLabels.map((label, level) => {
          const selected = value === level;
          return (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(level)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all min-h-[56px]',
                selected
                  ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 active:scale-[0.99]'
              )}
            >
              <span
                className={cn(
                  'w-2.5 h-2.5 rounded-full shrink-0 transition-transform',
                  levelTone[level],
                  selected && 'scale-150'
                )}
              />
              <span
                className={cn(
                  'text-sm',
                  selected ? 'font-semibold text-slate-900' : 'text-slate-600'
                )}
              >
                {label}
              </span>
              {selected && (
                <motion.span
                  layoutId={`scale-check-${meta.key}`}
                  className="ml-auto text-xs font-bold text-brand-700"
                >
                  선택됨
                </motion.span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
