import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hoverEffect = false, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-white border border-slate-200/80 rounded-2xl p-5 shadow-soft transition-all duration-200',
          hoverEffect && 'hover:shadow-float hover:-translate-y-0.5 hover:border-brand-200',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
