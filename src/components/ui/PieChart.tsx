"use client";
import { useMemo } from 'react';

interface PieChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  size?: number;
}

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
];

export function PieChart({ data, size = 200 }: PieChartProps) {
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
  
  const paths = useMemo(() => {
    let currentAngle = 0;
    return data.map((item, index) => {
      const percentage = item.value / total;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      const x1 = Math.cos((startAngle - 90) * Math.PI / 180);
      const y1 = Math.sin((startAngle - 90) * Math.PI / 180);
      const x2 = Math.cos((endAngle - 90) * Math.PI / 180);
      const y2 = Math.sin((endAngle - 90) * Math.PI / 180);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const pathData = [
        `M ${50 + x1 * 40} ${50 + y1 * 40}`,
        `A 40 40 0 ${largeArcFlag} 1 ${50 + x2 * 40} ${50 + y2 * 40}`,
        'L 50 50'
      ].join(' ');
      
      currentAngle += angle;
      
      return {
        path: pathData,
        color: item.color || COLORS[index % COLORS.length],
        percentage: percentage * 100,
        label: item.label
      };
    });
  }, [data, total]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <svg width={size} height={size} viewBox="0 0 100 100">
          {paths.map((path, index) => (
            <path
              key={index}
              d={path.path}
              fill={path.color}
              stroke="white"
              strokeWidth="0.5"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-semibold text-zinc-900">{total.toFixed(1)}</div>
            <div className="text-xs text-zinc-600">Total</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
        {paths.map((path, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: path.color }}
              />
              <span className="text-zinc-700 font-medium">{path.label}</span>
            </div>
            <span className="text-zinc-600">{path.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
