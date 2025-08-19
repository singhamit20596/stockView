"use client";
import { useState, useRef, useEffect } from 'react';
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
  const [topHeight, setTopHeight] = useState(50); // Percentage for top section
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  const renderCircleChart = () => {
    let currentAngle = 0;
    const radius = isExpanded ? 120 : 80;
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

          const startX = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
          const startY = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
          const endX = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
          const endY = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);

          const largeArcFlag = angle > 180 ? 1 : 0;

          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${startX} ${startY}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `Z`
          ].join(' ');

          currentAngle += angle;

          return (
            <g key={index}>
              <path
                d={pathData}
                fill={item.color}
                filter="url(#shadow)"
                className="cursor-pointer transition-all duration-200 hover:opacity-80"
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
      </svg>
    );
  };
  
  const renderExpandedView = () => {
    return (
      <div className="fixed inset-0 bg-[#003135]/80 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden" ref={containerRef}>
          <Card className="w-full h-full">
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#003135] dark:text-white">{title} Distribution</h2>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
            
            <div className="relative" style={{ height: 'calc(90vh - 200px)' }}>
              {/* Top Half - Allocation Details */}
              <div 
                className="overflow-y-auto"
                style={{ height: `${topHeight}%` }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                  {/* Chart */}
                  <div className="flex justify-center">
                    {renderCircleChart()}
                  </div>

                  {/* Details - Compact Layout */}
                  <div className="lg:col-span-3">
                    <h3 className="text-sm font-semibold text-[#003135] dark:text-white mb-3">Allocation Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {data.map((item, index) => {
                        const percentage = (item.value / total) * 100;
                        return (
                          <div 
                            key={index}
                            className="flex items-center justify-between p-1.5 rounded-md hover:bg-[#F1F5F9] dark:hover:bg-[#024950] transition-colors cursor-pointer group relative"
                            onClick={() => onSectionClick(item.label)}
                            onMouseEnter={() => setHoveredSection(item.label)}
                            onMouseLeave={() => setHoveredSection(null)}
                          >
                            <div className="flex items-center gap-1.5">
                              <div 
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: item.color }}
                              ></div>
                              <span className="text-xs font-medium text-[#003135] dark:text-white truncate">{item.label}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-semibold text-[#003135] dark:text-white">{percentage.toFixed(1)}%</div>
                              <div className="text-xs text-[#64748B] dark:text-[#AFDDE5]">{formatCurrency(item.value)}</div>
                            </div>
                            
                            {/* Hover tooltip for expanded view */}
                            {hoveredSection === item.label && (
                              <div className="absolute left-full ml-2 bg-[#003135] text-white px-3 py-2 rounded-lg text-sm font-medium z-20 pointer-events-none whitespace-nowrap">
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
              </div>
              
              {/* Resizable Divider */}
              <div 
                className="absolute left-0 right-0 bg-[#E2E8F0] dark:bg-[#024950] cursor-ns-resize select-none"
                style={{ 
                  top: `${topHeight}%`, 
                  height: '4px',
                  transform: 'translateY(-50%)'
                }}
                onMouseDown={(e) => {
                  setIsDragging(true);
                  e.preventDefault();
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-8 h-1 bg-[#CBD5E1] dark:bg-[#64748B] rounded-full"></div>
                </div>
              </div>

              {/* Bottom Half - Holdings Table */}
              {selectedFilter && filteredStocks.length > 0 && (
                <div 
                  className="border-t border-[#E2E8F0] dark:border-[#024950] pt-4 overflow-y-auto"
                  style={{ height: `${100 - topHeight}%` }}
                >
                  <h3 className="text-lg font-semibold text-[#003135] dark:text-white mb-4">
                    Holdings in {selectedFilter} ({filteredStocks.length} stocks)
                  </h3>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full min-w-max">
                      <thead className="bg-[#F1F5F9] dark:bg-[#024950] sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] dark:text-[#AFDDE5] uppercase tracking-wider">Stock</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-[#64748B] dark:text-[#AFDDE5] uppercase tracking-wider">Qty</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-[#64748B] dark:text-[#AFDDE5] uppercase tracking-wider">Avg</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-[#64748B] dark:text-[#AFDDE5] uppercase tracking-wider">Mkt</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-[#64748B] dark:text-[#AFDDE5] uppercase tracking-wider">Invested</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-[#64748B] dark:text-[#AFDDE5] uppercase tracking-wider">Current</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-[#64748B] dark:text-[#AFDDE5] uppercase tracking-wider">PnL</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-[#64748B] dark:text-[#AFDDE5] uppercase tracking-wider">PnL %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#024950]">
                        {filteredStocks.map((s) => (
                          <tr key={s.id} className="hover:bg-[#F1F5F9] dark:hover:bg-[#024950] transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-[#003135] dark:text-white">{s.stockName}</td>
                            <td className="px-4 py-3 text-sm text-[#64748B] dark:text-[#AFDDE5] text-right">{Number(s.quantity).toFixed(1)}</td>
                            <td className="px-4 py-3 text-sm text-[#64748B] dark:text-[#AFDDE5] text-right">{formatCurrency(Number(s.avgPrice))}</td>
                            <td className="px-4 py-3 text-sm text-[#64748B] dark:text-[#AFDDE5] text-right">{formatCurrency(Number(s.marketPrice))}</td>
                            <td className="px-4 py-3 text-sm text-[#64748B] dark:text-[#AFDDE5] text-right">{formatCurrency(Number(s.investedValue))}</td>
                            <td className="px-4 py-3 text-sm text-[#64748B] dark:text-[#AFDDE5] text-right">{formatCurrency(Number(s.currentValue))}</td>
                            <td className={`px-4 py-3 text-sm font-medium text-right ${Number(s.pnl) >= 0 ? 'text-[#0FA4AF]' : 'text-[#964734]'}`}>
                              {formatCurrency(Number(s.pnl))}
                            </td>
                            <td className={`px-4 py-3 text-sm font-medium text-right ${Number(s.pnlPercent) >= 0 ? 'text-[#0FA4AF]' : 'text-[#964734]'}`}>
                              {formatPercentage(Number(s.pnlPercent))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
        </div>
      </div>
    );
  };

  // Mouse move handler for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const containerHeight = rect.height - 200; // Subtract header height
      const mouseY = e.clientY - rect.top - 100; // Subtract header offset
      
      const newTopHeight = Math.max(20, Math.min(80, (mouseY / containerHeight) * 100));
      setTopHeight(newTopHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);
  
  if (isExpanded) {
    return renderExpandedView();
  }
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
      <CardBody className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#003135] dark:text-white">{title}</h3>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => onSectionClick('expand')}
          >
            View Details
          </Button>
        </div>
        
        <div className="relative">
          {renderCircleChart()}
          
          {/* Hover tooltip */}
          {hoveredSection && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#003135] text-white px-3 py-2 rounded-lg text-sm font-medium z-10 pointer-events-none">
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
