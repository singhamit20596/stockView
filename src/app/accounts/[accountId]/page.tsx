"use client";
import { trpc } from '@/app/providers';
import { useParams } from 'next/navigation';

export default function AccountDetailPage() {
  const { accountId } = useParams<{ accountId: string }>();
  const accountQuery = trpc.accounts.getById.useQuery({ accountId });
  const stocksQuery = trpc.accounts.listStocks.useQuery({ accountId });
  const account = accountQuery.data;
  const stocks = stocksQuery.data ?? [];
  if (!account) return <div className="p-8">Account not found.</div>;
  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{account.name}</h1>
        <div className="text-sm text-right">
          <div>Updated: {account.updatedAt}</div>
          <div>Invested: ₹{account.investedValue} | Current: ₹{account.currentValue} | PnL: ₹{account.pnl} ({account.pnlPercent}%)</div>
        </div>
      </div>
      <div className="border rounded">
        <div className="px-4 py-2 border-b font-medium">Holdings</div>
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


