"use client";
import { trpc } from '@/app/providers';
import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

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
		<div className="max-w-6xl mx-auto p-6 space-y-6">
			<h1 className="text-2xl font-semibold">Add Account</h1>
			
			{/* Stepper */}
			<div className="relative">
				<div className="absolute top-4 left-0 right-0 h-0.5 bg-zinc-200" />
				<div className="relative grid grid-cols-4 gap-4">
					{['Account Name', 'Select Broker', 'Scrape Holdings', 'Verify & Confirm'].map((label, idx) => (
						<div key={label} className="flex flex-col items-center">
							<div className="w-8 h-8 rounded-full grid place-items-center text-sm font-medium bg-indigo-600 text-white relative z-10">
								{idx + 1}
							</div>
							<div className="mt-2 text-xs text-zinc-600 text-center font-medium">{label}</div>
						</div>
					))}
				</div>
			</div>
			<div className="space-y-4">
				<div className="space-y-2">
					<label className="block text-sm font-medium text-zinc-700">Account Name</label>
					<input 
						className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black" 
						value={name} 
						onChange={(e) => setName(e.target.value)} 
						placeholder="My Groww" 
					/>
					<div className="flex items-center gap-3 text-xs">
						<Button
							size="sm"
							variant="secondary"
							disabled={!name || isChecking}
							onClick={async () => {
								if (!name) return;
								const res = await check.refetch();
								setChecked(res.data?.valid === true);
							}}
						>
							Check availability
						</Button>
						{checked !== null && (
							<span className={`font-medium ${isNameAvailable ? 'text-green-600' : 'text-red-600'}`}>
								{isNameAvailable ? '✓ Name is available' : '✗ Name already exists'}
							</span>
						)}
					</div>
				</div>
				
				<div className="space-y-2">
					<label className="block text-sm font-medium text-zinc-700">Select Broker</label>
					<select 
						className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black" 
						value={brokerId} 
						onChange={(e) => setBrokerId(e.target.value as 'groww')}
					>
						<option value="groww">Groww</option>
					</select>
				</div>
			</div>
			<div className="flex gap-3">
				<Button
					variant="primary"
					disabled={!name || start.isPending || isChecking || !isNameAvailable}
					onClick={async () => {
						const res = await start.mutateAsync({ name, brokerId });
						setJobId(res.jobId);
					}}
				>
					Create & Scrape
				</Button>
				<Button
					variant="secondary"
					disabled={!name || start.isPending || isChecking || !isNameExists}
					onClick={async () => {
						const res = await start.mutateAsync({ name, brokerId });
						setJobId(res.jobId);
					}}
				>
					Update & Re-scrape
				</Button>
			</div>
			
			{progress && (
				<div className="space-y-2">
					<div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
						<div 
							className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300" 
							style={{ width: `${progress.percent}%` }} 
						/>
					</div>
					<p className="text-sm text-zinc-600 font-medium">{progress.stage}</p>
				</div>
			)}
			{preview && (
				<div className="space-y-4">
					<h2 className="text-lg font-semibold text-zinc-900">Preview (mapped)</h2>
					<div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
						<pre className="text-xs text-zinc-700 overflow-auto max-h-64 font-mono">{JSON.stringify(preview.mapped, null, 2)}</pre>
					</div>
					{jobId && (
						<Button
							variant={confirm.isPending ? 'secondary' : 'primary'}
							onClick={async () => {
								if (!jobId) return;
								await confirm.mutateAsync({ jobId });
								alert('Holdings saved to Accounts and Stocks');
								window.location.href = '/accounts';
								// navigate to accounts after confirmation
							}}
						>
							{confirm.isPending ? 'Saving…' : 'Confirm & Save'}
						</Button>
					)}
				</div>
			)}
		</div>
	);
}


