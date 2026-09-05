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
          <CartesianGrid strokeDasharray="3 3" stroke="#262B38" />
          <XAxis
            dataKey="topic"
            stroke="#A0A6B4"
            tick={{ fill: '#A0A6B4', fontSize: 11 }}
            interval={0}
            angle={-20}
            textAnchor="end"
          />
          <YAxis
            stroke="#A0A6B4"
            domain={[0, 100]}
            tick={{ fill: '#A0A6B4', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#14171F',
              borderColor: '#262B38',
              borderRadius: '8px',
              color: '#F5F6F8',
            }}
            formatter={(value: any) => [`${value}%`, 'Mastery']}
          />
          <Bar
            dataKey="mastery"
            fill="#3DD9A4"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
