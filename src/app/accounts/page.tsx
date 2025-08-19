"use client";
import Link from 'next/link';
import { trpc } from '@/app/providers';
import { useMemo } from 'react';

export default function AccountsPage() {
  const { data: accounts, isLoading } = trpc.accounts.list.useQuery();
  const { data: counts } = trpc.accounts.stocksCountByAccount.useQuery();
  const holdingsCount = counts ?? {} as Record<string, number>;
  const del = trpc.accounts.delete.useMutation();
  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <Link href="/add-account" className="px-3 py-2 bg-black text-white rounded">Add Account</Link>
      </div>
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : !accounts || accounts.length === 0 ? (
        <p className="text-sm text-gray-500">No accounts yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((a) => (
            <div key={a.id} className="border rounded p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-gray-500">Updated: {new Date(a.updatedAt).toLocaleDateString('en-GB')}</div>
                </div>
                <div className="text-right text-sm">
                  <div>Invested: ₹{a.investedValue}</div>
                  <div>Current: ₹{a.currentValue}</div>
                  <div>PnL: ₹{a.pnl} ({a.pnlPercent}%)</div>
                  <div className="text-xs text-gray-500">Holdings: {holdingsCount[a.id] ?? 0}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/accounts/${a.id}`} className="px-3 py-1 bg-gray-100 rounded">Open</Link>
                <Link href={`/add-account?name=${encodeURIComponent(a.name)}`} className="px-3 py-1 bg-gray-100 rounded">Update</Link>
                <button
                  className="px-3 py-1 bg-red-600 text-white rounded"
                  onClick={async () => {
                    if (!confirm(`Delete account ${a.name}?`)) return;
                    await del.mutateAsync({ accountId: a.id });
                    location.reload();
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


