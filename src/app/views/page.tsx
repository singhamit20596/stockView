"use client";
import Link from 'next/link';
import { trpc } from '@/app/providers';
import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatPercentage } from '@/lib/utils';

export default function ViewsPage() {
    const { data: views, isLoading } = trpc.views.list.useQuery();
    const { data: uniqueCounts } = trpc.views.uniqueStockCount.useQuery();
    const del = trpc.views.delete.useMutation();
    const [busyId, setBusyId] = useState<string | null>(null);
    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-zinc-900">My Views</h1>
                <p className="text-sm text-zinc-600 mt-1">Manage your portfolio views and analytics</p>
            </div>
            {isLoading ? (
                <p className="text-sm text-gray-500">Loading...</p>
            ) : !views || views.length === 0 ? (
                <p className="text-sm text-gray-500">No views yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {views.map((v) => (
                        <Card key={v.id}>
                            <CardBody className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-zinc-900">
                                            <Link href={`/views/${v.id}`} className="hover:text-indigo-600 transition-colors">
                                                {v.name}
                                            </Link>
                                        </h3>
                                        <p className="text-sm text-zinc-500">Portfolio view</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 grid place-items-center transition-colors relative group"
                                            disabled={busyId === v.id}
                                            onClick={async () => {
                                                if (!confirm(`Delete view ${v.name}?`)) return;
                                                setBusyId(v.id);
                                                await del.mutateAsync({ viewId: v.id });
                                                location.reload();
                                            }}
                                            title="Delete view"
                                        >
                                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            <div className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                Delete view
                                            </div>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-zinc-50 rounded-lg p-3">
                                        <div className="text-xs text-zinc-500 mb-1">INVESTED</div>
                                        <div className="text-lg font-semibold text-zinc-900">{formatCurrency(v.viewSummary.totalInvestedValue)}</div>
                                    </div>
                                    <div className="bg-zinc-50 rounded-lg p-3">
                                        <div className="text-xs text-zinc-500 mb-1">CURRENT</div>
                                        <div className="text-lg font-semibold text-zinc-900">{formatCurrency(v.viewSummary.totalCurrentValue)}</div>
                                    </div>
                                    <div className="bg-zinc-50 rounded-lg p-3">
                                        <div className="text-xs text-zinc-500 mb-1">P&L</div>
                                        <div className={`text-lg font-semibold ${v.viewSummary.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(v.viewSummary.totalPnl)}
                                        </div>
                                    </div>
                                    <div className="bg-zinc-50 rounded-lg p-3">
                                        <div className="text-xs text-zinc-500 mb-1">P&L %</div>
                                        <div className={`text-lg font-semibold ${v.viewSummary.totalPnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatPercentage(v.viewSummary.totalPnlPercent)}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-zinc-500">
                                        Last updated: {new Date(v.updatedAt).toLocaleDateString('en-GB')} • {uniqueCounts?.[v.id] ?? 0} stocks
                                    </div>
                                    <Link href={`/views/${v.id}`}>
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


