import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { cn } from '../../utils/cn';

export interface BarChartCardProps {
  title: string;
  subtitle?: string;
  data: any[];
  xKey: string;
  yKey: string;
  color?: string;
  yFormatter?: (value: number) => string;
  height?: number;
  className?: string;
  actionElement?: React.ReactNode;
}

export const BarChartCard: React.FC<BarChartCardProps> = ({
  title,
  subtitle,
  data,
  xKey,
  yKey,
  color = '#38A9F6',
  yFormatter = (val) => val.toString(),
  height = 280,
  className,
  actionElement,
}) => {
  return (
    <div className={cn('rounded-2xl border border-surface-200 bg-white p-6 shadow-2xs', className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-base font-bold text-surface-900">{title}</h4>
          {subtitle && <p className="text-xs text-surface-500 mt-0.5">{subtitle}</p>}
        </div>
        {actionElement}
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey={xKey}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickFormatter={yFormatter}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                fontSize: '12px',
              }}
              formatter={(val: any) => [yFormatter(Number(val)), yKey]}
            />
            <Bar dataKey={yKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
