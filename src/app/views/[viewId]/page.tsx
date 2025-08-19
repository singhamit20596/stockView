"use client";
import { useParams } from 'next/navigation';
import { trpc } from '@/app/providers';
import { useState } from 'react';

export default function ViewDetailPage() {
  const { viewId } = useParams<{ viewId: string }>();
  const viewQuery = trpc.views.getById.useQuery({ viewId });
  const stocksQuery = trpc.views.listStocks.useQuery({ viewId });
  const view = viewQuery.data;
  const stocks = stocksQuery.data ?? [];
  const [modalStock, setModalStock] = useState<string | null>(null);
  if (!view) return <div className="p-8">View not found.</div>;
  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{view.name}</h1>
        <div className="text-sm text-right">
          <div>Updated: {view.updatedAt}</div>
          <div>Invested: ₹{view.viewSummary.totalInvestedValue} | Current: ₹{view.viewSummary.totalCurrentValue} | PnL: ₹{view.viewSummary.totalPnl} ({view.viewSummary.totalPnlPercent}%)</div>
        </div>
      </div>
      <div className="border rounded">
        <div className="px-4 py-2 border-b font-medium">Combined Holdings</div>
        <div className="p-4 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-1 pr-2">Stock</th>
                <th className="py-1 pr-2">Qty</th>
                <th className="py-1 pr-2">Avg</th>
                <th className="py-1 pr-2">Mkt</th>
                <th className="py-1 pr-2">Invested</th>
                <th className="py-1 pr-2">Current</th>
                <th className="py-1 pr-2">PnL</th>
                <th className="py-1 pr-2">PnL %</th>
                <th className="py-1 pr-2">Sector</th>
                <th className="py-1 pr-2">Subsector</th>
                <th className="py-1 pr-2">M.Cap</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="py-2 pr-2">
                    <button className="underline" onClick={() => setModalStock(s.stockName)}>{s.stockName}</button>
                  </td>
                  <td className="py-2 pr-2">{s.quantity}</td>
                  <td className="py-2 pr-2">₹{s.avgPrice}</td>
                  <td className="py-2 pr-2">₹{s.marketPrice}</td>
                  <td className="py-2 pr-2">₹{s.investedValue}</td>
                  <td className="py-2 pr-2">₹{s.currentValue}</td>
                  <td className="py-2 pr-2">₹{s.pnl}</td>
                  <td className="py-2 pr-2">{s.pnlPercent}%</td>
                  <td className="py-2 pr-2">{s.sector ?? '-'}</td>
                  <td className="py-2 pr-2">{s.subsector ?? '-'}</td>
                  <td className="py-2 pr-2">{s.capCategory ?? '-'}</td>
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
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded shadow p-4 w-full max-w-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">{stockName} — distribution across accounts</div>
          <button className="px-2 py-1" onClick={onClose}>Close</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-1 pr-2">Account</th>
              <th className="py-1 pr-2">Quantity</th>
              <th className="py-1 pr-2">Share %</th>
              <th className="py-1 pr-2">Invested Value</th>
              <th className="py-1 pr-2">Current Value</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => (
              <tr key={p.accountId} className="border-t">
                <td className="py-2 pr-2">{p.accountName}</td>
                <td className="py-2 pr-2">{p.quantity}</td>
                <td className="py-2 pr-2">{p.sharePercent}%</td>
                <td className="py-2 pr-2">₹{p.investedValue}</td>
                <td className="py-2 pr-2">₹{p.currentValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


