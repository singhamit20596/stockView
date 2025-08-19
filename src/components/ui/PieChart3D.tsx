"use client";
import { useState } from 'react';

interface PieData {
  label: string;
  value: number;
  color?: string;
}

interface PieChart3DProps {
  data: PieData[];
  title: string;
  size?: number;
  onSliceClick?: (data: PieData) => void;
}

export function PieChart3D({ 
  data, 
  title, 
  size = 300, 
  onSliceClick 
}: PieChart3DProps) {
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
  const [selectedSlice, setSelectedSlice] = useState<number | null>(null);
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 20;
  
  let currentAngle = -Math.PI / 2; // Start from top
  
  const slices = data.map((item, index) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    
    // Calculate path coordinates
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    
    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    // 3D effect - create shadow path
    const shadowOffset = 4;
    const shadowPathData = [
      `M ${centerX + shadowOffset} ${centerY + shadowOffset}`,
      `L ${x1 + shadowOffset} ${y1 + shadowOffset}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2 + shadowOffset} ${y2 + shadowOffset}`,
      'Z'
    ].join(' ');
    
    // 3D effect - create side path
    const sidePathData = [
      `M ${x1} ${y1}`,
      `L ${x1 + shadowOffset} ${y1 + shadowOffset}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2 + shadowOffset} ${y2 + shadowOffset}`,
      `L ${x2} ${y2}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${x1} ${y1}`,
      'Z'
    ].join(' ');
    
    currentAngle += sliceAngle;
    
    const isHovered = hoveredSlice === index;
    const isSelected = selectedSlice === index;
    const color = item.color || `hsl(${(index * 137.5) % 360}, 70%, 60%)`;
    
    return {
      ...item,
      pathData,
      shadowPathData,
      sidePathData,
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
          <g opacity="0.4">
            {slices.map((slice, index) => (
              <path
                key={`shadow-${index}`}
                d={slice.shadowPathData}
                fill="#000"
                opacity={slice.isHovered ? 0.6 : 0.4}
              />
            ))}
          </g>
          
          {/* Side layer for 3D effect */}
          {slices.map((slice, index) => (
            <path
              key={`side-${index}`}
              d={slice.sidePathData}
              fill={slice.color}
              opacity={0.6}
              className="transition-all duration-200"
            />
          ))}
          
          {/* Main slices */}
          {slices.map((slice, index) => (
            <path
              key={index}
              d={slice.pathData}
              fill={slice.color}
              opacity={slice.isHovered ? 1 : 0.9}
              stroke="#fff"
              strokeWidth="2"
              className="cursor-pointer transition-all duration-300"
              style={{
                transform: slice.isHovered ? 'scale(1.05) translateY(-2px)' : 'scale(1)',
                filter: slice.isSelected ? 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
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
              left: centerX + (radius + 30) * Math.cos(slices[hoveredSlice].centerAngle),
              top: centerY + (radius + 30) * Math.sin(slices[hoveredSlice].centerAngle),
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
