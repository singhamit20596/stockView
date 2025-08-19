"use client";
import { trpc } from '@/app/providers';
import { useMemo, useState, useEffect } from 'react';

export default function AddAccountPage() {
	const [name, setName] = useState('');
	const [brokerId, setBrokerId] = useState<'groww'>('groww');
	const [jobId, setJobId] = useState<string | null>(null);
	const start = trpc.scrape.createStartScrape.useMutation();
	const confirm = trpc.scrape.confirmScrape.useMutation();
	const check = trpc.accounts.checkNameUnique.useQuery({ name }, { enabled: false });
	const [checked, setChecked] = useState<null | boolean>(null);
	const isChecking = check.isLoading || check.isFetching;
	const isNameAvailable = checked === true;
	const isNameExists = checked === false;

	useEffect(() => {
		try {
			const pre = new URLSearchParams(window.location.search).get('name');
			if (pre) setName(pre);
		} catch {}
	}, []);

	const statusQuery = trpc.scrape.getScrapeStatus.useQuery(
		{ jobId: jobId ?? '' },
		{ enabled: !!jobId, refetchInterval: 3000 }
	);
	const progress = useMemo(() => statusQuery.data ?? { percent: 0, stage: 'idle' }, [statusQuery.data]);

	const previewQuery = trpc.scrape.getScrapePreview.useQuery(
		{ jobId: jobId ?? '' },
		{ enabled: !!jobId && (progress?.percent ?? 0) >= 60, refetchInterval: 3000 }
	);
	const preview = previewQuery.data;

	// simple frontend console logging for debug
	useEffect(() => {
		console.log('[ui] progress', progress);
	}, [progress]);
	useEffect(() => {
		if (preview) console.log('[ui] preview', preview);
	}, [preview]);

	return (
		<div className="p-6 space-y-4 max-w-3xl mx-auto">
			<h1 className="text-2xl font-semibold">Add Account (Wizard Draft)</h1>
			<div className="space-y-2">
				<label className="block text-sm">Account Name</label>
				<input className="border p-2 w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Groww" />
				<div className="flex items-center gap-2 text-xs">
					<button
						className="px-2 py-1 border rounded disabled:opacity-50"
						disabled={!name || isChecking}
						onClick={async () => {
							if (!name) return;
							const res = await check.refetch();
							setChecked(res.data?.valid === true);
						}}
					>
						Check availability
					</button>
					{checked !== null && (
						<span className={isNameAvailable ? 'text-green-600' : 'text-red-600'}>
							{isNameAvailable ? 'Name is available' : 'Name already exists'}
						</span>
					)}
				</div>
			</div>
			<div className="space-y-2">
				<label className="block text-sm">Select Broker</label>
				<select className="border p-2" value={brokerId} onChange={(e) => setBrokerId(e.target.value as 'groww')}>
					<option value="groww">Groww</option>
				</select>
			</div>
			<div className="flex gap-2">
				<button
					className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
					disabled={!name || start.isPending || isChecking || !isNameAvailable}
					onClick={async () => {
						const res = await start.mutateAsync({ name, brokerId });
						setJobId(res.jobId);
					}}
				>
					Create & Scrape
				</button>
				<button
					className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
					disabled={!name || start.isPending || isChecking || !isNameExists}
					onClick={async () => {
						const res = await start.mutateAsync({ name, brokerId });
						setJobId(res.jobId);
					}}
				>
					Update & Re-scrape
				</button>
			</div>
			{progress && (
				<div>
					<div className="h-2 bg-gray-200 rounded">
						<div className="h-2 bg-green-600 rounded" style={{ width: `${progress.percent}%` }} />
					</div>
					<p className="text-sm text-gray-600 mt-1">{progress.stage}</p>
				</div>
			)}
			{preview && (
				<div className="mt-4">
					<h2 className="font-medium">Preview (mapped)</h2>
					<pre className="text-xs bg-black text-green-200 p-2 rounded overflow-auto max-h-64">{JSON.stringify(preview.mapped, null, 2)}</pre>
					{jobId && (
						<button
							className={`mt-2 px-4 py-2 rounded ${confirm.isPending ? 'bg-blue-400' : 'bg-blue-600'} text-white`}
							onClick={async () => {
								if (!jobId) return;
								await confirm.mutateAsync({ jobId });
								alert('Holdings saved to Accounts and Stocks');
								window.location.href = '/accounts';
								// navigate to accounts after confirmation
							}}
						>
							{confirm.isPending ? 'Saving…' : 'Confirm & Save'}
						</button>
					)}
				</div>
			)}
		</div>
	);
}


