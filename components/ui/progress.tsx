import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ProgressProps {
  value: number; // 0 ~ 100
  className?: string;
  barClassName?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, className, barClassName }) => {
  const percentage = Math.min(Math.max(value, 0), 100);
  return (
    <div className={twMerge(clsx('w-full bg-slate-100 rounded-full h-2.5 overflow-hidden', className))}>
      <div
        className={twMerge(
          clsx('bg-brand-600 h-full transition-all duration-300 ease-out rounded-full', barClassName)
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
