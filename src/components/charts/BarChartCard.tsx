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
  xKey?: string;
  yKey?: string;
  dataKey?: string;
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
  xKey = 'name',
  yKey,
  dataKey = 'value',
  color = '#6366f1',
  yFormatter = (val) => val.toString(),
  height = 280,
  className,
  actionElement,
}) => {
  const actualYKey = yKey || dataKey || 'count';

  return (
    <div className={cn('rounded-2xl border border-surface-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs', className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-base font-bold text-surface-900 dark:text-white">{title}</h4>
          {subtitle && <p className="text-xs text-surface-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {actionElement}
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
            <XAxis
              dataKey={xKey}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={yFormatter}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderRadius: '12px',
                border: '1px solid #1e293b',
                color: '#ffffff',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
                fontSize: '12px',
              }}
              formatter={(val: any) => [yFormatter(Number(val)), actualYKey]}
            />
            <Bar
              dataKey={actualYKey}
              fill={color}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
