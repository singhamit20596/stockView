"use client";
import { useState, useEffect } from 'react';
import { getSectorColor, getSubsectorColor } from '@/lib/colors';

interface DonutData {
  label: string;
  value: number;
  color?: string;
  type: 'sector' | 'subsector';
}

interface DonutChartProps {
  data: DonutData[];
  title: string;
  size?: number;
  innerRadius?: number;
  outerRadius?: number;
  onSliceClick?: (data: DonutData) => void;
}

export function DonutChart({ 
  data, 
  title, 
  size = 300, 
  innerRadius = 60, 
  outerRadius = 120,
  onSliceClick 
}: DonutChartProps) {
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
  const [selectedSlice, setSelectedSlice] = useState<number | null>(null);
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const centerX = size / 2;
  const centerY = size / 2;
  
  let currentAngle = -Math.PI / 2; // Start from top
  
  const slices = data.map((item, index) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    
    // Calculate path for outer arc
    const x1 = centerX + outerRadius * Math.cos(startAngle);
    const y1 = centerY + outerRadius * Math.sin(startAngle);
    const x2 = centerX + outerRadius * Math.cos(endAngle);
    const y2 = centerY + outerRadius * Math.sin(endAngle);
    
    // Calculate path for inner arc
    const x3 = centerX + innerRadius * Math.cos(endAngle);
    const y3 = centerY + innerRadius * Math.sin(endAngle);
    const x4 = centerX + innerRadius * Math.cos(startAngle);
    const y4 = centerY + innerRadius * Math.sin(startAngle);
    
    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
    
    const pathData = [
      `M ${x1} ${y1}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ');
    
    // 3D effect - create shadow path
    const shadowOffset = 3;
    const shadowPathData = [
      `M ${x1 + shadowOffset} ${y1 + shadowOffset}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2 + shadowOffset} ${y2 + shadowOffset}`,
      `L ${x3 + shadowOffset} ${y3 + shadowOffset}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4 + shadowOffset} ${y4 + shadowOffset}`,
      'Z'
    ].join(' ');
    
    currentAngle += sliceAngle;
    
    const isHovered = hoveredSlice === index;
    const isSelected = selectedSlice === index;
    const color = item.color || (item.type === 'sector' ? getSectorColor(item.label) : getSubsectorColor(item.label));
    
    return {
      ...item,
      pathData,
      shadowPathData,
      color,
      percentage: (item.value / total) * 100,
      isHovered,
      isSelected,
      centerAngle: startAngle + sliceAngle / 2
    };
  });
  
  const handleSliceClick = (index: number) => {
    setSelectedSlice(selectedSlice === index ? null : index);
    if (onSliceClick) {
      onSliceClick(data[index]);
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      <h3 className="text-lg font-semibold text-zinc-900 mb-4">{title}</h3>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Shadow layer */}
          <g opacity="0.3">
            {slices.map((slice, index) => (
              <path
                key={`shadow-${index}`}
                d={slice.shadowPathData}
                fill="#000"
                opacity={slice.isHovered ? 0.5 : 0.3}
              />
            ))}
          </g>
          
          {/* Main slices */}
          {slices.map((slice, index) => (
            <path
              key={index}
              d={slice.pathData}
              fill={slice.color}
              opacity={slice.isHovered ? 0.9 : 0.8}
              stroke="#fff"
              strokeWidth="2"
              className="cursor-pointer transition-all duration-200"
              style={{
                transform: slice.isHovered ? 'scale(1.05)' : 'scale(1)',
                filter: slice.isSelected ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'none'
              }}
              onMouseEnter={() => setHoveredSlice(index)}
              onMouseLeave={() => setHoveredSlice(null)}
              onClick={() => handleSliceClick(index)}
            />
          ))}
          
          {/* Center text */}
          <text
            x={centerX}
            y={centerY - 5}
            textAnchor="middle"
            className="text-sm font-semibold fill-zinc-700"
            style={{ transform: 'rotate(90deg)', transformOrigin: `${centerX}px ${centerY}px` }}
          >
            {total.toLocaleString()}
          </text>
          <text
            x={centerX}
            y={centerY + 10}
            textAnchor="middle"
            className="text-xs fill-zinc-500"
            style={{ transform: 'rotate(90deg)', transformOrigin: `${centerX}px ${centerY}px` }}
          >
            Total
          </text>
        </svg>
        
        {/* Hover tooltip */}
        {hoveredSlice !== null && (
          <div
            className="absolute bg-white border border-zinc-200 rounded-lg shadow-lg px-3 py-2 text-sm pointer-events-none z-10"
            style={{
              left: centerX + (outerRadius + 20) * Math.cos(slices[hoveredSlice].centerAngle),
              top: centerY + (outerRadius + 20) * Math.sin(slices[hoveredSlice].centerAngle),
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="font-semibold">{slices[hoveredSlice].label}</div>
            <div className="text-zinc-600">{slices[hoveredSlice].value.toLocaleString()} ({slices[hoveredSlice].percentage.toFixed(1)}%)</div>
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2 max-w-xs">
        {slices.map((slice, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-xs cursor-pointer"
            onClick={() => handleSliceClick(index)}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className={`${slice.isSelected ? 'font-semibold' : ''}`}>
              {slice.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
