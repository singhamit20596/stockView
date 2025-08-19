"use client";
import Link from 'next/link';
import { trpc } from '@/app/providers';
import { useMemo } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatPercentage } from '@/lib/utils';

export default function AccountsPage() {
  const { data: accounts, isLoading } = trpc.accounts.list.useQuery();
  const { data: counts } = trpc.accounts.stocksCountByAccount.useQuery();
  const holdingsCount = counts ?? {} as Record<string, number>;
  const del = trpc.accounts.delete.useMutation();
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
                    <h1 className="text-2xl font-semibold text-[#964734]">My Accounts</h1>
            <p className="text-sm text-[#964734] mt-1">Manage your broker accounts and portfolio data</p>
      </div>
      {isLoading ? (
        <p className="text-sm text-[#964734]">Loading...</p>
      ) : !accounts || accounts.length === 0 ? (
        <p className="text-sm text-[#964734]">No accounts yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((a) => (
            <Card key={a.id}>
              <CardBody className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#964734]">{a.name}</h3>
                    <p className="text-sm text-[#964734]">Primary trading account</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      className="w-8 h-8 rounded-lg bg-[#F1F5F9] dark:bg-[#024950] hover:bg-[#0FA4AF] grid place-items-center transition-colors relative group"
                      onClick={() => window.location.href = `/add-account?name=${encodeURIComponent(a.name)}`}
                      title="Update account data"
                    >
                      <svg className="w-4 h-4 text-[#024950] dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <div className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Update account data
                      </div>
                    </button>
                    <button 
                      className="w-8 h-8 rounded-lg bg-[#964734]/10 hover:bg-[#964734]/20 grid place-items-center transition-colors relative group"
                      onClick={async () => {
                        if (!confirm(`Delete account ${a.name}?`)) return;
                        await del.mutateAsync({ accountId: a.id });
                        location.reload();
                      }}
                      title="Delete account"
                    >
                      <svg className="w-4 h-4 text-[#964734]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <div className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Delete account
                      </div>
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-zinc-50 rounded-lg p-3">
                    <div className="text-xs text-[#964734] mb-1">INVESTED</div>
                    <div className="text-lg font-semibold text-[#964734]">{formatCurrency(a.investedValue)}</div>
                  </div>
                  <div className="bg-zinc-50 rounded-lg p-3">
                    <div className="text-xs text-[#964734] mb-1">CURRENT</div>
                    <div className="text-lg font-semibold text-[#964734]">{formatCurrency(a.currentValue)}</div>
                  </div>
                  <div className="bg-zinc-50 rounded-lg p-3">
                    <div className="text-xs text-[#964734] mb-1">P&L</div>
                    <div className={`text-lg font-semibold ${a.pnl >= 0 ? 'text-[#0FA4AF]' : 'text-[#964734]'}`}>
                      {formatCurrency(a.pnl)}
                    </div>
                  </div>
                  <div className="bg-zinc-50 rounded-lg p-3">
                    <div className="text-xs text-[#964734] mb-1">P&L %</div>
                    <div className={`text-lg font-semibold ${a.pnlPercent >= 0 ? 'text-[#0FA4AF]' : 'text-[#964734]'}`}>
                      {formatPercentage(a.pnlPercent)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-[#964734]">
                    Last updated: {new Date(a.updatedAt).toLocaleDateString('en-GB')} • {holdingsCount[a.id] ?? 0} stocks
                  </div>
                  <Link href={`/accounts/${a.id}`}>
                    <Button variant="primary" size="sm">View Details</Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


