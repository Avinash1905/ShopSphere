import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { cn } from '../../utils/cn';

export interface DonutChartDataItem {
  name: string;
  value: number;
  color: string;
}

export interface DonutChartCardProps {
  title: string;
  subtitle?: string;
  data: DonutChartDataItem[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  className?: string;
}

export const DonutChartCard: React.FC<DonutChartCardProps> = ({
  title,
  subtitle,
  data,
  height = 280,
  innerRadius = 60,
  outerRadius = 90,
  className,
}) => {
  return (
    <div className={cn('rounded-2xl border border-surface-200 bg-white p-6 shadow-2xs', className)}>
      <div className="mb-4">
        <h4 className="text-base font-bold text-surface-900">{title}</h4>
        {subtitle && <p className="text-xs text-surface-500 mt-0.5">{subtitle}</p>}
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                fontSize: '12px',
              }}
            />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-xs font-medium text-surface-700">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
