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
  if (!account) return <div className="p-8 text-[#003135] dark:text-white">Account not found.</div>;
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#003135] dark:text-white">{account.name}</h1>
          <p className="text-sm text-[#64748B] dark:text-[#AFDDE5] mt-1">Account Holdings</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-[#64748B] dark:text-[#AFDDE5]">Updated: {new Date(account.updatedAt).toLocaleDateString('en-GB')}</div>
          <div className="text-sm font-medium text-[#003135] dark:text-white mt-1">
            Invested: {formatCurrency(Number(account.investedValue))} | Current: {formatCurrency(Number(account.currentValue))} | PnL: {formatCurrency(Number(account.pnl))} ({formatPercentage(Number(account.pnlPercent))})
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-[#003135] border border-[#E2E8F0] dark:border-[#024950] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] dark:border-[#024950] bg-[#F1F5F9] dark:bg-[#024950]">
          <h2 className="text-lg font-semibold text-[#003135] dark:text-white">Holdings</h2>
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
                  <td className="px-6 py-4 text-sm font-medium text-[#003135] dark:text-white">{s.stockName}</td>
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
    </div>
  );
}


