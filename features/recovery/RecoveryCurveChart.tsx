'use client';

import React from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { RecoveryCurveSeries } from '@/types';

export interface RecoveryCurveChartProps {
  series: RecoveryCurveSeries;
  height?: number;
}

const levelText = ['없음', '약함', '보통', '심함', '매우 심함'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const expected = payload.find((p: any) => p.dataKey === 'expected')?.value;
  const actual = payload.find((p: any) => p.dataKey === 'actual')?.value;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-float px-3 py-2 text-xs">
      <p className="font-bold text-slate-900 mb-1">D+{label}</p>
      <p className="text-slate-500">예상 {Number(expected).toFixed(1)}</p>
      {actual === null || actual === undefined ? (
        <p className="text-slate-400">기록 없음</p>
      ) : (
        <p className="text-brand-700 font-semibold">
          내 기록 {actual} · {levelText[actual] ?? ''}
        </p>
      )}
    </div>
  );
};

/**
 * 예상 회복 곡선(면적) 위에 실제 기록(선)을 겹쳐 그린다.
 * "지금 이 상태가 정상인지"를 한 눈에 답하는 것이 이 차트의 유일한 목적이다.
 */
export const RecoveryCurveChart: React.FC<RecoveryCurveChartProps> = ({
  series,
  height = 200,
}) => {
  const data = series.points.map((p) => ({
    day: p.day,
    expected: p.expected,
    actual: p.actual,
  }));

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
          <defs>
            <linearGradient id={`exp-${series.symptom}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickFormatter={(v) => `D+${v}`}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 4]}
            ticks={[0, 1, 2, 3, 4]}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="expected"
            stroke="#94a3b8"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill={`url(#exp-${series.symptom})`}
            name="예상"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#0d9488"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#0d9488', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
            name="내 기록"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
