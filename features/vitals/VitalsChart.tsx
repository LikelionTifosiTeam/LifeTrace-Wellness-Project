'use client';

import React from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DailyCheckin, WearableSnapshot } from '@/types';
import { SymptomKey } from '@/types';

export interface VitalsChartProps {
  wearables: WearableSnapshot[];
  checkins: DailyCheckin[];
  symptom: SymptomKey;
  symptomLabel: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-float px-3 py-2 text-xs">
      <p className="font-bold text-slate-900 mb-1">D+{label}</p>
      <p className="text-accent-700">수면 {row.sleep}시간</p>
      <p className="text-slate-500">HRV {row.hrv}ms</p>
      {row.symptom !== null && (
        <p className="text-brand-700 font-semibold">
          {row.symptomLabel} {row.symptom}/4
        </p>
      )}
    </div>
  );
};

/** 수면(막대) 위에 증상(선)을 겹쳐 "생활 → 회복" 관계를 눈으로 보게 만든다. */
export const VitalsChart: React.FC<VitalsChartProps> = ({
  wearables,
  checkins,
  symptom,
  symptomLabel,
}) => {
  const byDay = new Map(checkins.map((c) => [c.day, c]));
  const data = wearables.map((w, day) => ({
    day,
    sleep: w.sleepHours,
    hrv: w.hrvMs,
    symptom: byDay.get(day)?.symptoms[symptom] ?? null,
    symptomLabel,
  }));

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickFormatter={(v) => `D+${v}`}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="left"
            domain={[0, 10]}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <YAxis yAxisId="right" orientation="right" domain={[0, 4]} hide />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            yAxisId="left"
            dataKey="sleep"
            fill="#bae6fd"
            radius={[4, 4, 0, 0]}
            name="수면"
            isAnimationActive={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="symptom"
            stroke="#0d9488"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#0d9488', strokeWidth: 0 }}
            connectNulls
            name={symptomLabel}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
