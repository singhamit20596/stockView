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
            <h1 className="text-2xl font-semibold text-[#003135] dark:text-white font-bold">Add View</h1>
            <div className="space-y-2">
                <label className="block text-sm font-bold text-[#003135] dark:text-white">View Name</label>
                <input className="border border-[#CBD5E1] dark:border-[#024950] p-2 w-full text-[#003135] dark:text-white bg-white dark:bg-[#003135] rounded-lg" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Combined Portfolio" />
                {name && check.data && (
                    <p className={`text-xs ${check.data.valid ? 'text-[#0FA4AF]' : 'text-[#964734]'}`}>{check.data.valid ? 'Name is available' : 'Name already exists'}</p>
                )}
            </div>
            <div className="space-y-2">
                <div className="text-sm font-medium text-[#003135] dark:text-white font-bold">Select Accounts</div>
                <div className="border border-[#CBD5E1] dark:border-[#024950] rounded-lg">
                    <div className="divide-y divide-[#E2E8F0] dark:divide-[#024950]">
                        {(accountsQuery.data ?? []).map((a) => (
                            <label key={a.id} className="flex items-center gap-2 p-2 hover:bg-[#F1F5F9] dark:hover:bg-[#024950]">
                                <input type="checkbox" checked={!!selected[a.id]} onChange={(e) => setSelected((s) => ({ ...s, [a.id]: e.target.checked }))} />
                                <span className="text-[#003135] dark:text-white">{a.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
            <div>
                <button
                    className="px-4 py-2 bg-[#0FA4AF] hover:bg-[#024950] text-white rounded-lg disabled:opacity-50 transition-colors"
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


