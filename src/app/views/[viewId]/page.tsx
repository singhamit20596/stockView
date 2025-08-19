"use client";
import { useParams } from 'next/navigation';
import { trpc } from '@/app/providers';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { PieChart } from '@/components/ui/PieChart';
import { DonutChart } from '@/components/ui/DonutChart';
import { PieChart3D } from '@/components/ui/PieChart3D';
import { Card, CardBody } from '@/components/ui/Card';
import { formatCurrency, formatPercentage } from '@/lib/utils';

export default function ViewDetailPage() {
  const { viewId } = useParams<{ viewId: string }>();
  const viewQuery = trpc.views.getById.useQuery({ viewId });
  const stocksQuery = trpc.views.listStocks.useQuery({ viewId });
  const analyticsQuery = trpc.views.getAnalytics.useQuery({ viewId });
  const newsQuery = trpc.views.newsForView.useQuery({ viewId });
  const view = viewQuery.data;
  const stocks = stocksQuery.data ?? [];
  const analytics = analyticsQuery.data;
  const news = newsQuery.data;
  const [modalStock, setModalStock] = useState<string | null>(null);
  if (!view) return <div className="p-8 text-[#964734]">View not found.</div>;
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#964734]">{view.name}</h1>
          <p className="text-sm text-[#964734] mt-1">Combined Holdings View</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-[#964734]">Updated: {view.updatedAt}</div>
          <div className="text-sm font-medium text-[#964734] mt-1">
            Invested: {formatCurrency(Number(view.viewSummary.totalInvestedValue))} | Current: {formatCurrency(Number(view.viewSummary.totalCurrentValue))} | PnL: {formatCurrency(Number(view.viewSummary.totalPnl))} ({formatPercentage(Number(view.viewSummary.totalPnlPercent))})
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-[#003135] border border-[#E2E8F0] dark:border-[#024950] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] dark:border-[#024950] bg-[#F1F5F9] dark:bg-[#024950]">
          <h2 className="text-lg font-semibold text-[#003135] dark:text-white">Combined Holdings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-[#F1F5F9] dark:bg-[#024950] sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] dark:text-[#AFDDE5] uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#64748B] dark:text-[#AFDDE5] uppercase tracking-wider">Qty</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#64748B] dark:text-[#AFDDE5] uppercase tracking-wider">Avg</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#64748B] dark:text-[#AFDDE5] uppercase tracking-wider">Mkt</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#64748B] dark:text-[#AFDDE5] uppercase tracking-wider">Invested</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#64748B] dark:text-[#AFDDE5] uppercase tracking-wider">Current</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#64748B] dark:text-[#AFDDE5] uppercase tracking-wider">PnL</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#64748B] dark:text-[#AFDDE5] uppercase tracking-wider">PnL %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#024950]">
              {stocks.map((s) => (
                <tr key={s.id} className="hover:bg-[#F1F5F9] dark:hover:bg-[#024950] transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-[#003135] dark:text-white">
                    <button 
                      className="text-[#0FA4AF] hover:text-[#024950] underline" 
                      onClick={() => setModalStock(s.stockName)}
                    >
                      {s.stockName}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748B] dark:text-[#AFDDE5] text-right">{Number(s.quantity).toFixed(1)}</td>
                  <td className="px-6 py-4 text-sm text-[#64748B] dark:text-[#AFDDE5] text-right">{formatCurrency(Number(s.avgPrice))}</td>
                  <td className="px-6 py-4 text-sm text-[#64748B] dark:text-[#AFDDE5] text-right">{formatCurrency(Number(s.marketPrice))}</td>
                  <td className="px-6 py-4 text-sm text-[#64748B] dark:text-[#AFDDE5] text-right">{formatCurrency(Number(s.investedValue))}</td>
                  <td className="px-6 py-4 text-sm text-[#64748B] dark:text-[#AFDDE5] text-right">{formatCurrency(Number(s.currentValue))}</td>
                  <td className={`px-6 py-4 text-sm font-medium text-right ${Number(s.pnl) >= 0 ? 'text-[#0FA4AF]' : 'text-[#964734]'}`}>
                    {formatCurrency(Number(s.pnl))}
                  </td>
                  <td className={`px-6 py-4 text-sm font-medium text-right ${Number(s.pnlPercent) >= 0 ? 'text-[#0FA4AF]' : 'text-[#964734]'}`}>
                    {formatPercentage(Number(s.pnlPercent))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modalStock && (
        <StockSplitModal viewId={view.id} stockName={modalStock} onClose={() => setModalStock(null)} />
      )}
    </div>
  );
}

function StockSplitModal({ viewId, stockName, onClose }: { viewId: string; stockName: string; onClose: () => void }) {
  const parts = trpc.views.stockBreakdown.useQuery({ viewId, stockName }).data ?? [];
  
  const pieData = parts.map((p, index) => ({
    label: p.accountName,
    value: p.quantity,
    color: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'][index % 6]
  }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-4xl mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-zinc-900">{stockName} — distribution across accounts</h3>
          <button 
            className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 grid place-items-center transition-colors"
            onClick={onClose}
          >
            <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-96">
          <table className="w-full">
            <thead className="bg-zinc-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">Account</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">Share %</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">Invested Value</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">Current Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {parts.map((p) => (
                <tr key={p.accountId} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-zinc-900">{p.accountName}</td>
                  <td className="px-4 py-3 text-sm text-zinc-700 text-right">{Number(p.quantity).toFixed(1)}</td>
                  <td className="px-4 py-3 text-sm text-zinc-700 text-right">{Number(p.sharePercent).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-sm text-zinc-700 text-right">{formatCurrency(Number(p.investedValue))}</td>
                  <td className="px-4 py-3 text-sm text-zinc-700 text-right">{formatCurrency(Number(p.currentValue))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


