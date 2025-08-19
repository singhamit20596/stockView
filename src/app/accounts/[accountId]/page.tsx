"use client";
import { trpc } from '@/app/providers';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatPercentage } from '@/lib/utils';

export default function AccountDetailPage() {
  const { accountId } = useParams<{ accountId: string }>();
  const accountQuery = trpc.accounts.getById.useQuery({ accountId });
  const stocksQuery = trpc.accounts.listStocks.useQuery({ accountId });
  const account = accountQuery.data;
  const stocks = stocksQuery.data ?? [];
  if (!account) return <div className="p-8">Account not found.</div>;
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">{account.name}</h1>
          <p className="text-sm text-zinc-600 mt-1">Account Holdings</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-zinc-600">Updated: {new Date(account.updatedAt).toLocaleDateString('en-GB')}</div>
          <div className="text-sm font-medium text-zinc-900 mt-1">
            Invested: {formatCurrency(Number(account.investedValue))} | Current: {formatCurrency(Number(account.currentValue))} | PnL: {formatCurrency(Number(account.pnl))} ({formatPercentage(Number(account.pnlPercent))})
          </div>
        </div>
      </div>
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <h2 className="text-lg font-semibold text-zinc-900">Holdings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-zinc-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">Avg</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">Mkt</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">Invested</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">Current</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">PnL</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">PnL %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {stocks.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-zinc-900">{s.stockName}</td>
                  <td className="px-6 py-4 text-sm text-zinc-700 text-right">{Number(s.quantity).toFixed(1)}</td>
                  <td className="px-6 py-4 text-sm text-zinc-700 text-right">{formatCurrency(Number(s.avgPrice))}</td>
                  <td className="px-6 py-4 text-sm text-zinc-700 text-right">{formatCurrency(Number(s.marketPrice))}</td>
                  <td className="px-6 py-4 text-sm text-zinc-700 text-right">{formatCurrency(Number(s.investedValue))}</td>
                  <td className="px-6 py-4 text-sm text-zinc-700 text-right">{formatCurrency(Number(s.currentValue))}</td>
                  <td className={`px-6 py-4 text-sm font-medium text-right ${Number(s.pnl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(Number(s.pnl))}
                  </td>
                  <td className={`px-6 py-4 text-sm font-medium text-right ${Number(s.pnlPercent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(Number(s.pnlPercent))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


