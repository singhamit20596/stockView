"use client";
import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatPercentage } from '@/lib/utils';

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface InteractiveChartProps {
  data: ChartData[];
  title: string;
  type: 'sector' | 'subsector' | 'marketCap';
  onSectionClick: (label: string) => void;
  onClose: () => void;
  isExpanded: boolean;
  filteredStocks?: any[];
  selectedFilter?: string | null;
}

export function InteractiveChart({ 
  data, 
  title, 
  type, 
  onSectionClick, 
  onClose, 
  isExpanded,
  filteredStocks = [],
  selectedFilter = null
}: InteractiveChartProps) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  const renderDonutChart = () => {
    let currentAngle = 0;
    const radius = isExpanded ? 120 : 80;
    const strokeWidth = isExpanded ? 40 : 25;
    const centerX = isExpanded ? 150 : 100;
    const centerY = isExpanded ? 150 : 100;
    
    return (
      <svg width={isExpanded ? 300 : 200} height={isExpanded ? 300 : 200} className="mx-auto" viewBox={`0 0 ${isExpanded ? 300 : 200} ${isExpanded ? 300 : 200}`}>
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.3)"/>
          </filter>
        </defs>
        
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const angle = (percentage / 100) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          const startX = centerX + (radius - strokeWidth/2) * Math.cos((startAngle - 90) * Math.PI / 180);
          const startY = centerY + (radius - strokeWidth/2) * Math.sin((startAngle - 90) * Math.PI / 180);
          const endX = centerX + (radius - strokeWidth/2) * Math.cos((endAngle - 90) * Math.PI / 180);
          const endY = centerY + (radius - strokeWidth/2) * Math.sin((endAngle - 90) * Math.PI / 180);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          const pathData = [
            `M ${startX} ${startY}`,
            `A ${radius - strokeWidth/2} ${radius - strokeWidth/2} 0 ${largeArcFlag} 1 ${endX} ${endY}`
          ].join(' ');
          
          currentAngle += angle;
          
          return (
            <g key={index}>
              <path
                d={pathData}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                filter="url(#shadow)"
                className="cursor-pointer transition-all duration-200 hover:stroke-opacity-80"
                onMouseEnter={() => setHoveredSection(item.label)}
                onMouseLeave={() => setHoveredSection(null)}
                onClick={() => onSectionClick(item.label)}
                style={{
                  transformOrigin: `${centerX}px ${centerY}px`,
                  transform: hoveredSection === item.label ? 'scale(1.05)' : 'scale(1)'
                }}
              />
            </g>
          );
        })}
        
        {/* Center circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius - strokeWidth}
          fill="white"
          filter="url(#shadow)"
        />
        
        {/* Center text */}
        <text
          x={centerX}
          y={centerY - 5}
          textAnchor="middle"
          className="text-sm font-semibold text-zinc-700"
        >
          {title}
        </text>
        <text
          x={centerX}
          y={centerY + 15}
          textAnchor="middle"
          className="text-xs text-zinc-500"
        >
          {data.length} items
        </text>
      </svg>
    );
  };
  
  const renderExpandedView = () => {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-zinc-900">{title} Distribution</h2>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Chart */}
              <div className="flex justify-center">
                {renderDonutChart()}
              </div>
              
              {/* Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">Allocation Details</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {data.map((item, index) => {
                    const percentage = (item.value / total) * 100;
                    return (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer group"
                        onClick={() => onSectionClick(item.label)}
                        onMouseEnter={() => setHoveredSection(item.label)}
                        onMouseLeave={() => setHoveredSection(null)}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="font-medium text-zinc-900">{item.label}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-zinc-900">{percentage.toFixed(1)}%</div>
                          <div className="text-sm text-zinc-500">{formatCurrency(item.value)}</div>
                        </div>
                        
                        {/* Hover tooltip for expanded view */}
                        {hoveredSection === item.label && (
                          <div className="absolute left-full ml-2 bg-black text-white px-3 py-2 rounded-lg text-sm font-medium z-20 pointer-events-none whitespace-nowrap">
                            {item.label}
                            <div className="text-xs opacity-80 mt-1">
                              {percentage.toFixed(1)}% allocation
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Holdings Table */}
            {selectedFilter && filteredStocks.length > 0 && (
              <div className="mt-8 border-t border-zinc-200 pt-6">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">
                  Holdings in {selectedFilter} ({filteredStocks.length} stocks)
                </h3>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full min-w-max">
                    <thead className="bg-zinc-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">Stock</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">Avg</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">Mkt</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">Invested</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">Current</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">PnL</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">PnL %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {filteredStocks.map((s) => (
                        <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-zinc-900">{s.stockName}</td>
                          <td className="px-4 py-3 text-sm text-zinc-700 text-right">{Number(s.quantity).toFixed(1)}</td>
                          <td className="px-4 py-3 text-sm text-zinc-700 text-right">{formatCurrency(Number(s.avgPrice))}</td>
                          <td className="px-4 py-3 text-sm text-zinc-700 text-right">{formatCurrency(Number(s.marketPrice))}</td>
                          <td className="px-4 py-3 text-sm text-zinc-700 text-right">{formatCurrency(Number(s.investedValue))}</td>
                          <td className="px-4 py-3 text-sm text-zinc-700 text-right">{formatCurrency(Number(s.currentValue))}</td>
                          <td className={`px-4 py-3 text-sm font-medium text-right ${Number(s.pnl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(Number(s.pnl))}
                          </td>
                          <td className={`px-4 py-3 text-sm font-medium text-right ${Number(s.pnlPercent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(Number(s.pnlPercent))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    );
  };
  
  if (isExpanded) {
    return renderExpandedView();
  }
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
      <CardBody className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => onSectionClick('expand')}
          >
            View Details
          </Button>
        </div>
        
        <div className="relative">
          {renderDonutChart()}
          
          {/* Hover tooltip */}
          {hoveredSection && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black text-white px-3 py-2 rounded-lg text-sm font-medium z-10 pointer-events-none">
              {hoveredSection}
              <div className="text-xs opacity-80 mt-1">
                {((data.find(item => item.label === hoveredSection)?.value || 0) / total * 100).toFixed(1)}%
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
