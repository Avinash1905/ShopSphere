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
  xKey: string;
  yKey: string;
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
  xKey,
  yKey,
  yKey2,
  color = '#0270C7',
  color2 = '#10B981',
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
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`colorGrad-${yKey}`} x1="0" y1="0" x2="0" y2="1">
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
            <Area
              type="monotone"
              dataKey={yKey}
              stroke={color}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#colorGrad-${yKey})`}
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
