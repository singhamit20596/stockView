"use client";
import Link from 'next/link';
import { trpc } from '@/app/providers';

export default function StockViewPage() {
  const { data, isLoading } = trpc.views.viewCardSummaries.useQuery();
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-semibold">StockView</h1>
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-gray-500">No views found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((v) => (
            <div key={v.viewId} className="border rounded p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium"><Link className="underline" href={`/stock-view/${v.viewId}`}>{v.name}</Link></div>
                  <div className="text-xs text-gray-500">Updated: {new Date(v.updatedAt).toLocaleDateString('en-GB')}</div>
                </div>
                <div className="text-right text-sm">
                  <div>Invested: ₹{v.viewSummary.totalInvestedValue}</div>
                  <div>Current: ₹{v.viewSummary.totalCurrentValue}</div>
                  <div>PnL: ₹{v.viewSummary.totalPnl} ({v.viewSummary.totalPnlPercent}%)</div>
                </div>
              </div>
              <div className="text-sm">Linked accounts ({v.linkedAccountCount}): {v.linkedAccountNames.join(', ') || '-'}</div>
              <div className="text-sm">Total unique stocks: {v.totalUniqueStocks}</div>
              <div className="text-xs text-gray-600">
                % share by account:
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {v.perAccountShare.map((p) => (
                    <div key={p.accountId} className="border rounded px-2 py-1 flex items-center justify-between">
                      <span>{p.accountName}</span>
                      <span>{p.sharePercent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


