"use client";
import Link from 'next/link';
import { trpc } from '@/app/providers';
import { useState } from 'react';

export default function ViewsPage() {
    const { data: views, isLoading } = trpc.views.list.useQuery();
    const del = trpc.views.delete.useMutation();
    const [busyId, setBusyId] = useState<string | null>(null);
    return (
        <div className="p-8 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Views</h1>
                <Link href="/add-view" className="px-3 py-2 bg-black text-white rounded">Add View</Link>
            </div>
            {isLoading ? (
                <p className="text-sm text-gray-500">Loading...</p>
            ) : !views || views.length === 0 ? (
                <p className="text-sm text-gray-500">No views yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {views.map((v) => (
                        <div key={v.id} className="border rounded p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium"><Link href={`/views/${v.id}`} className="underline">{v.name}</Link></div>
                                    <div className="text-xs text-gray-500">Updated: {v.updatedAt}</div>
                                </div>
                                <div className="text-right text-sm">
                                    <div>Invested: ₹{v.viewSummary.totalInvestedValue}</div>
                                    <div>Current: ₹{v.viewSummary.totalCurrentValue}</div>
                                    <div>PnL: ₹{v.viewSummary.totalPnl} ({v.viewSummary.totalPnlPercent}%)</div>
                                </div>
                            </div>
                            <div className="mt-2">
                                <button
                                    className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50"
                                    disabled={busyId === v.id}
                                    onClick={async () => {
                                        if (!confirm(`Delete view ${v.name}?`)) return;
                                        setBusyId(v.id);
                                        await del.mutateAsync({ viewId: v.id });
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


