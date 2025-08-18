"use client";
import { useParams } from 'next/navigation';
import { trpc } from '@/app/providers';

export default function ViewDetailPage() {
  const { viewId } = useParams<{ viewId: string }>();
  const viewQuery = trpc.views.getById.useQuery({ viewId });
  const stocksQuery = trpc.views.listStocks.useQuery({ viewId });
  const view = viewQuery.data;
  const stocks = stocksQuery.data ?? [];
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
              </tr>
            </thead>
            <tbody>
              {stocks.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="py-2 pr-2">{s.stockName}</td>
                  <td className="py-2 pr-2">{s.quantity}</td>
                  <td className="py-2 pr-2">₹{s.avgPrice}</td>
                  <td className="py-2 pr-2">₹{s.marketPrice}</td>
                  <td className="py-2 pr-2">₹{s.investedValue}</td>
                  <td className="py-2 pr-2">₹{s.currentValue}</td>
                  <td className="py-2 pr-2">₹{s.pnl}</td>
                  <td className="py-2 pr-2">{s.pnlPercent}%</td>
                  <td className="py-2 pr-2">{s.sector ?? '-'}</td>
                  <td className="py-2 pr-2">{s.subsector ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


