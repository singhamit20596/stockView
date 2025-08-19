"use client";
import Link from 'next/link';
import { trpc } from '@/app/providers';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { DonutChart } from '@/components/ui/DonutChart';
import { PieChart3D } from '@/components/ui/PieChart3D';
import { Badge } from '@/components/ui/Badge';
import { useState, useMemo } from 'react';

export default function StockViewPage() {
  const { data: views, isLoading } = trpc.views.viewCardSummaries.useQuery();
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null);
  
  // Get the selected view data
  const selectedView = useMemo(() => {
    return views?.find(v => v.viewId === selectedViewId) || null;
  }, [views, selectedViewId]);
  
  const analyticsQuery = trpc.views.getAnalytics.useQuery(
    { viewId: selectedViewId! },
    { enabled: !!selectedViewId }
  );
  const stocksQuery = trpc.views.listStocks.useQuery(
    { viewId: selectedViewId! },
    { enabled: !!selectedViewId }
  );
  const newsQuery = trpc.views.newsForView.useQuery(
    { viewId: selectedViewId! },
    { enabled: !!selectedViewId }
  );
  
  const analytics = analyticsQuery.data;
  const stocks = stocksQuery.data || [];
  const news = newsQuery.data;
  
  // State for filtering stocks based on selections
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedSubsector, setSelectedSubsector] = useState<string | null>(null);
  const [selectedMarketCap, setSelectedMarketCap] = useState<string | null>(null);
  
  // Filter stocks based on selections
  const filteredStocks = useMemo(() => {
    if (!selectedSector && !selectedSubsector && !selectedMarketCap) {
      return stocks;
    }
    
    return stocks.filter(stock => {
      if (selectedSector && stock.sector !== selectedSector) return false;
      if (selectedSubsector && stock.subsector !== selectedSubsector) return false;
      if (selectedMarketCap && stock.capCategory !== selectedMarketCap) return false;
      return true;
    });
  }, [stocks, selectedSector, selectedSubsector, selectedMarketCap]);
  
  // Clear all filters
  const clearFilters = () => {
    setSelectedSector(null);
    setSelectedSubsector(null);
    setSelectedMarketCap(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Portfolio Analytics</h1>
        <p className="text-zinc-600">Comprehensive insights for your investment portfolio</p>
      </div>
      
      {/* View Selector */}
      <div className="max-w-md mx-auto">
        <label className="block text-sm font-medium text-zinc-700 mb-2">Select Portfolio</label>
        <select 
          className="w-full px-4 py-3 border border-zinc-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm"
          value={selectedViewId || ''}
          onChange={(e) => setSelectedViewId(e.target.value || null)}
        >
          <option value="">Choose a portfolio...</option>
          {views?.map((view) => (
            <option key={view.viewId} value={view.viewId}>
              {view.name}
            </option>
          ))}
        </select>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-4 text-lg text-zinc-600">Loading portfolio data...</span>
        </div>
      ) : !views || views.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-8xl mb-6">📊</div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">No portfolios found</h2>
          <p className="text-zinc-600 mb-6">Create your first portfolio to see analytics here</p>
          <Link href="/views" className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
            Create Portfolio
          </Link>
        </div>
      ) : !selectedViewId ? (
        <div className="text-center py-16">
          <div className="text-8xl mb-6">📈</div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">Select a portfolio</h2>
          <p className="text-zinc-600">Choose a portfolio from the dropdown above to view detailed analytics</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Portfolio Summary Card */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-0 shadow-lg">
            <CardBody className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-zinc-900 mb-2">{selectedView?.name}</h2>
                <p className="text-zinc-600">Portfolio Overview</p>
              </div>
              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-zinc-900">{formatCurrency(Number(selectedView?.viewSummary.totalInvestedValue) || 0)}</div>
                    <div className="text-sm text-zinc-600">Total Invested</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-zinc-900">{formatCurrency(Number(selectedView?.viewSummary.totalCurrentValue) || 0)}</div>
                    <div className="text-sm text-zinc-600">Current Value</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${(Number(selectedView?.viewSummary.totalPnl) || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Number(selectedView?.viewSummary.totalPnl) || 0)}
                    </div>
                    <div className="text-sm text-zinc-600">Total P&L</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${(Number(selectedView?.viewSummary.totalPnlPercent) || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(Number(selectedView?.viewSummary.totalPnlPercent) || 0)}
                    </div>
                    <div className="text-sm text-zinc-600">P&L %</div>
                  </div>
                </div>
              
              <div className="mt-6 pt-6 border-t border-zinc-200 grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-zinc-900">{selectedView?.linkedAccountCount || 0}</div>
                  <div className="text-sm text-zinc-600">Linked Accounts</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-zinc-900">{selectedView?.totalUniqueStocks || 0}</div>
                  <div className="text-sm text-zinc-600">Unique Stocks</div>
                </div>
                <div className="md:col-span-1 col-span-2">
                  <div className="text-sm text-zinc-600">Last Updated</div>
                  <div className="text-sm font-medium text-zinc-900">
                    {selectedView ? new Date(selectedView.updatedAt).toLocaleDateString('en-GB') : '-'}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
          
          {/* Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Sector Allocation */}
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-zinc-900">Sector Allocation</h3>
                  <div className="w-8 h-8 rounded-full bg-indigo-100 group-hover:bg-indigo-200 transition-colors flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                
                {analytics ? (
                  <div className="space-y-3">
                    {analytics.sector.slice(0, 3).map((item, index) => (
                      <div key={item.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#3B82F6', '#EF4444', '#10B981'][index] }}></div>
                          <span className="text-sm font-medium text-zinc-900">{item.key}</span>
                        </div>
                        <span className="text-sm font-semibold text-zinc-900">{item.value}%</span>
                      </div>
                    ))}
                    {analytics.sector.length > 3 && (
                      <div className="text-center pt-2">
                        <span className="text-sm text-zinc-500">+{analytics.sector.length - 3} more sectors</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  </div>
                )}
              </CardBody>
            </Card>
            
            {/* Subsector Allocation */}
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-zinc-900">Subsector Allocation</h3>
                  <div className="w-8 h-8 rounded-full bg-green-100 group-hover:bg-green-200 transition-colors flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                </div>
                
                {analytics ? (
                  <div className="space-y-3">
                    {analytics.subsector.slice(0, 3).map((item, index) => (
                      <div key={item.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#10B981', '#F59E0B', '#8B5CF6'][index] }}></div>
                          <span className="text-sm font-medium text-zinc-900">{item.key}</span>
                        </div>
                        <span className="text-sm font-semibold text-zinc-900">{item.value}%</span>
                      </div>
                    ))}
                    {analytics.subsector.length > 3 && (
                      <div className="text-center pt-2">
                        <span className="text-sm text-zinc-500">+{analytics.subsector.length - 3} more subsectors</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  </div>
                )}
              </CardBody>
            </Card>
            
            {/* Market Cap Allocation */}
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-zinc-900">Market Cap</h3>
                  <div className="w-8 h-8 rounded-full bg-purple-100 group-hover:bg-purple-200 transition-colors flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                
                {analytics ? (
                  <div className="space-y-3">
                    {analytics.cap.slice(0, 3).map((item, index) => (
                      <div key={item.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#8B5CF6', '#EC4899', '#06B6D4'][index] }}></div>
                          <span className="text-sm font-medium text-zinc-900">{item.key}</span>
                        </div>
                        <span className="text-sm font-semibold text-zinc-900">{item.value}%</span>
                      </div>
                    ))}
                    {analytics.cap.length > 3 && (
                      <div className="text-center pt-2">
                        <span className="text-sm text-zinc-500">+{analytics.cap.length - 3} more categories</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  </div>
                )}
              </CardBody>
            </Card>
            
            {/* Warnings */}
            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-zinc-900">Risk Alerts</h3>
                  <div className="w-8 h-8 rounded-full bg-red-100 group-hover:bg-red-200 transition-colors flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                
                {analytics ? (
                  <div className="space-y-3">
                    {analytics.sector.filter(item => item.value > 50).slice(0, 2).map(item => (
                      <div key={item.key} className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                        <Badge tone="warn">High</Badge>
                        <span className="text-sm text-zinc-700">
                          {item.key} sector: {item.value}%
                        </span>
                      </div>
                    ))}
                    {analytics.subsector.filter(item => item.value > 30).slice(0, 2).map(item => (
                      <div key={item.key} className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                        <Badge tone="warn">Medium</Badge>
                        <span className="text-sm text-zinc-700">
                          {item.key} subsector: {item.value}%
                        </span>
                      </div>
                    ))}
                    {analytics.sector.filter(item => item.value > 50).length === 0 && 
                     analytics.subsector.filter(item => item.value > 30).length === 0 && (
                      <div className="text-center py-4">
                        <div className="text-2xl mb-2">✅</div>
                        <p className="text-sm text-zinc-600">No risk alerts detected</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  </div>
                )}
              </CardBody>
            </Card>
            
            {/* Latest News */}
            <Card className="group hover:shadow-lg transition-all duration-300">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-zinc-900">Market News</h3>
                  <div className="w-8 h-8 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                </div>
                
                {news ? (
                  <div className="space-y-3">
                    {news.items?.slice(0, 3).map((item, index) => (
                      <div key={index} className="p-3 rounded-lg hover:bg-zinc-50 transition-colors">
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium block line-clamp-2"
                        >
                          {item.title}
                        </a>
                        {item.source && (
                          <p className="text-xs text-zinc-500 mt-1">{item.source}</p>
                        )}
                      </div>
                    ))}
                    {(!news.items || news.items.length === 0) && (
                      <div className="text-center py-4">
                        <div className="text-2xl mb-2">📰</div>
                        <p className="text-sm text-zinc-600">No recent news</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  </div>
                )}
              </CardBody>
            </Card>
            
            {/* Portfolio Holdings */}
            <Card className="lg:col-span-2 xl:col-span-1 group hover:shadow-lg transition-all duration-300">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-zinc-900">Holdings</h3>
                  <div className="w-8 h-8 rounded-full bg-indigo-100 group-hover:bg-indigo-200 transition-colors flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-zinc-900">{stocks.length}</div>
                    <div className="text-sm text-zinc-600">Total Holdings</div>
                  </div>
                  
                  {(selectedSector || selectedSubsector || selectedMarketCap) && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-zinc-900">Active Filters:</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedSector && (
                          <Badge tone="sector" sector={selectedSector}>
                            {selectedSector}
                          </Badge>
                        )}
                        {selectedSubsector && (
                          <Badge tone="subsector" subsector={selectedSubsector}>
                            {selectedSubsector}
                          </Badge>
                        )}
                        {selectedMarketCap && (
                          <Badge tone="outline">
                            {selectedMarketCap}
                          </Badge>
                        )}
                      </div>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={clearFilters}
                        className="w-full"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="text-lg font-semibold text-zinc-900">{filteredStocks.length}</div>
                    <div className="text-sm text-zinc-600">Filtered Results</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
          
          {/* Detailed Holdings Table - Only show when filters are active */}
          {(selectedSector || selectedSubsector || selectedMarketCap) && filteredStocks.length > 0 && (
            <Card>
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-zinc-900">Filtered Holdings</h3>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={clearFilters}
                  >
                    Clear All Filters
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
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
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}


