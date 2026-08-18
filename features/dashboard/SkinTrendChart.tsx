'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export interface SkinTrendChartProps {
  data: {
    date: string;
    skinScore: number;
    acne: number;
    redness: number;
  }[];
}

export const SkinTrendChart: React.FC<SkinTrendChartProps> = ({ data }) => {
  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis domain={[30, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: '12px',
            }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Line
            type="monotone"
            dataKey="skinScore"
            name="피부 종합 점수"
            stroke="#0d9488"
            strokeWidth={3}
            dot={{ r: 4, fill: '#0d9488' }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="acne"
            name="여드름 지수"
            stroke="#0284c7"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="redness"
            name="붉은기 지수"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
