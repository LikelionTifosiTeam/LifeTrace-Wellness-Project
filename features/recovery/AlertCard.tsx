'use client';

import React from 'react';
import { AlertTriangle, Info, Stethoscope, Share2, Check } from 'lucide-react';
import { RecoveryAlert } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SYMPTOM_LABELS } from '@/lib/recovery';
import { cn } from '@/lib/utils';

export interface AlertCardProps {
  alert: RecoveryAlert;
  onShare?: (alertId: string) => void;
  isSharing?: boolean;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onShare, isSharing }) => {
  const urgent = alert.level === 'urgent';

  return (
    <Card
      className={cn(
        'border-l-4',
        urgent ? 'border-l-red-500 bg-red-50/40' : 'border-l-amber-400 bg-amber-50/40'
      )}
    >
      <div className="flex items-start gap-3">
        {urgent ? (
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        ) : (
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900">{alert.title}</h3>
            <Badge variant="neutral">D+{alert.day}</Badge>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mt-1.5">{alert.detail}</p>

          <ul className="flex flex-wrap gap-1.5 mt-2.5">
            {alert.triggeredBy.map((t) => (
              <li
                key={t.symptom}
                className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600"
              >
                {SYMPTOM_LABELS[t.symptom]} 예상 {t.expected} → 기록 {t.actual}
              </li>
            ))}
          </ul>

          <p className="text-xs font-medium text-slate-800 mt-3">{alert.recommendedAction}</p>

          {alert.clinicResponse ? (
            <div className="mt-3 p-3 rounded-xl bg-white border border-brand-200">
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-brand-700 mb-1">
                <Stethoscope className="w-3.5 h-3.5" />
                {alert.clinicResponse.practitionerName} 답변
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">
                {alert.clinicResponse.message}
              </p>
            </div>
          ) : alert.sharedWithClinic ? (
            <p className="flex items-center gap-1.5 mt-3 text-xs text-brand-700 font-medium">
              <Check className="w-3.5 h-3.5" />
              클리닉에 공유됨 · 답변을 기다리는 중
            </p>
          ) : (
            onShare && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3 gap-1.5 bg-white"
                isLoading={isSharing}
                onClick={() => onShare(alert.id)}
              >
                <Share2 className="w-3.5 h-3.5" />
                이 기록을 클리닉에 공유
              </Button>
            )
          )}
        </div>
      </div>
    </Card>
  );
};
