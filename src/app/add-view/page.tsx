"use client";
import { useMemo, useState } from 'react';
import { trpc } from '@/app/providers';

export default function AddViewPage() {
    const [name, setName] = useState('');
    const accountsQuery = trpc.accounts.list.useQuery();
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const create = trpc.views.create.useMutation();
    const check = trpc.views.checkNameUnique.useQuery({ name }, { enabled: !!name });
    const canSubmit = useMemo(() => {
        const ids = Object.entries(selected).filter(([, v]) => v).map(([id]) => id);
        return !!name && (check.data?.valid ?? false) && ids.length > 0;
    }, [name, check.data, selected]);

    return (
        <div className="p-8 space-y-4 max-w-2xl mx-auto">
            <h1 className="text-2xl font-semibold text-black font-bold">Add View</h1>
            <div className="space-y-2">
                <label className="block text-sm font-bold text-black">View Name</label>
                <input className="border p-2 w-full text-black" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Combined Portfolio" />
                {name && check.data && (
                    <p className={`text-xs ${check.data.valid ? 'text-green-600' : 'text-red-600'}`}>{check.data.valid ? 'Name is available' : 'Name already exists'}</p>
                )}
            </div>
            <div className="space-y-2">
                <div className="text-sm font-medium text-black font-bold">Select Accounts</div>
                <div className="border rounded">
                    <div className="divide-y">
                        {(accountsQuery.data ?? []).map((a) => (
                            <label key={a.id} className="flex items-center gap-2 p-2">
                                <input type="checkbox" checked={!!selected[a.id]} onChange={(e) => setSelected((s) => ({ ...s, [a.id]: e.target.checked }))} />
                                <span>{a.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
            <div>
                <button
                    className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
                    disabled={!canSubmit || create.isPending}
                    onClick={async () => {
                        const accountIds = Object.entries(selected).filter(([, v]) => v).map(([id]) => id);
                        const res = await create.mutateAsync({ name, accountIds });
                        alert(`View created: ${res.name}`);
                    }}
                >
                    Create View
                </button>
            </div>
        </div>
    );
}


