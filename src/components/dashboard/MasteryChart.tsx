import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface MasteryChartProps {
  data: Array<{
    topic: string;
    mastery: number;
  }>;
}

export const MasteryChart: React.FC<MasteryChartProps> = ({ data }) => {
  return (
    <div className="w-full h-64 font-mono text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <defs>
            <linearGradient id="masteryBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent-primary)" stopOpacity={1} />
              <stop offset="60%" stopColor="var(--color-accent-secondary)" stopOpacity={0.7} />
              <stop offset="100%" stopColor="var(--color-accent-secondary)" stopOpacity={0.15} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="topic"
            stroke="var(--color-text-secondary)"
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
            interval={0}
            angle={-18}
            textAnchor="end"
          />
          <YAxis
            stroke="var(--color-text-secondary)"
            domain={[0, 100]}
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border)',
              borderRadius: '12px',
              color: 'var(--color-text-primary)',
              boxShadow: 'var(--shadow-md)',
            }}
            formatter={(value: any) => [`${value}%`, 'Mastery']}
          />
          <Bar
            dataKey="mastery"
            fill="url(#masteryBarGradient)"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
