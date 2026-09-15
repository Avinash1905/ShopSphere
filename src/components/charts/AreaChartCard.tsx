import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { cn } from '../../utils/cn';

export interface AreaChartCardProps {
  title: string;
  subtitle?: string;
  data: any[];
  xKey?: string;
  yKey?: string;
  dataKey?: string;
  yKey2?: string;
  color?: string;
  color2?: string;
  yFormatter?: (value: number) => string;
  height?: number;
  className?: string;
  actionElement?: React.ReactNode;
}

export const AreaChartCard: React.FC<AreaChartCardProps> = ({
  title,
  subtitle,
  data,
  xKey = 'name',
  yKey,
  dataKey = 'value',
  yKey2,
  color = '#4f46e5',
  color2 = '#10B981',
  yFormatter = (val) => val.toString(),
  height = 280,
  className,
  actionElement,
}) => {
  const actualYKey = yKey || dataKey || 'value';

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
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`colorGrad-${actualYKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
              {yKey2 && (
                <linearGradient id={`colorGrad-${yKey2}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color2} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color2} stopOpacity={0.0} />
                </linearGradient>
              )}
            </defs>
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
            <Area
              type="monotone"
              dataKey={actualYKey}
              stroke={color}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#colorGrad-${actualYKey})`}
            />
            {yKey2 && (
              <Area
                type="monotone"
                dataKey={yKey2}
                stroke={color2}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#colorGrad-${yKey2})`}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
