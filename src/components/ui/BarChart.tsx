"use client";
import { useMemo } from 'react';

interface BarChartProps {
  data: Array<{
    key: string;
    value: number;
  }>;
  title: string;
  height?: number;
}

export function BarChart({ data, title, height = 300 }: BarChartProps) {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value)), [data]);
  
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      <div className="space-y-3" style={{ height }}>
        {data.map((item, index) => (
          <div key={item.key} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-700 font-medium truncate">{item.key}</span>
              <span className="text-sm text-zinc-600 font-medium">{item.value.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(item.value / maxValue) * 100}%`,
                  animationDelay: `${index * 100}ms`
                }}
              />
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <div className="text-sm text-zinc-500 text-center py-8">No data available</div>
        )}
      </div>
    </div>
  );
}
