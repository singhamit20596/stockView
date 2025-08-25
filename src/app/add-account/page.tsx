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
		console.log('[ui] jobId:', jobId);
	}, [jobId]);
	useEffect(() => {
		console.log('[ui] progress', progress);
	}, [progress]);
	useEffect(() => {
		if (preview) console.log('[ui] preview', preview);
	}, [preview]);

	return (
		<div className="max-w-6xl mx-auto p-6 space-y-6">
			<h1 className="text-2xl font-semibold text-[#003135] dark:text-white">Add Account</h1>
			
			{/* Stepper */}
			<div className="relative">
				<div className="absolute top-4 left-0 right-0 h-0.5 bg-[#E2E8F0] dark:bg-[#024950]" />
				<div className="relative grid grid-cols-4 gap-4">
					{['Account Name', 'Select Broker', 'Scrape Holdings', 'Verify & Confirm'].map((label, idx) => (
						<div key={label} className="flex flex-col items-center">
							<div className="w-8 h-8 rounded-full grid place-items-center text-sm font-medium bg-[#0FA4AF] text-white relative z-10">
								{idx + 1}
							</div>
							<div className="mt-2 text-xs text-[#64748B] dark:text-[#AFDDE5] text-center font-medium">{label}</div>
						</div>
					))}
				</div>
			</div>
			<div className="space-y-4">
				<div className="space-y-2">
					<label className="block text-sm font-medium text-[#003135] dark:text-white">Account Name</label>
					<input 
						className="w-full px-3 py-2 border border-[#CBD5E1] dark:border-[#024950] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:border-transparent text-[#003135] dark:text-white bg-white dark:bg-[#003135]" 
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
								setChecked(res.data?.isUnique === true);
							}}
						>
							Check availability
						</Button>
						{checked !== null && (
							<span className={`font-medium ${isNameAvailable ? 'text-[#0FA4AF]' : 'text-[#964734]'}`}>
								{isNameAvailable ? '✓ Name is available' : '✗ Name already exists'}
							</span>
						)}
					</div>
				</div>
				
				<div className="space-y-2">
					<label className="block text-sm font-medium text-[#003135] dark:text-white">Select Broker</label>
					<select 
						className="w-full px-3 py-2 border border-[#CBD5E1] dark:border-[#024950] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:border-transparent text-[#003135] dark:text-white bg-white dark:bg-[#003135]" 
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
						console.log('[UI] Starting scrape for:', { name, brokerId });
						const res = await start.mutateAsync({ name, brokerId });
						console.log('[UI] Scrape started, jobId:', res.jobId);
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
					<div className="h-2 bg-[#E2E8F0] dark:bg-[#024950] rounded-full overflow-hidden">
						<div 
							className="h-full bg-gradient-to-r from-[#0FA4AF] to-[#024950] rounded-full transition-all duration-300" 
							style={{ width: `${progress.percent}%` }} 
						/>
					</div>
					<p className="text-sm text-[#64748B] dark:text-[#AFDDE5] font-medium">{progress.stage}</p>
				</div>
			)}
			{preview && (
				<div className="space-y-4">
					<h2 className="text-lg font-semibold text-[#003135] dark:text-white">Preview (mapped)</h2>
					<div className="bg-[#F1F5F9] dark:bg-[#024950] border border-[#E2E8F0] dark:border-[#024950] rounded-lg p-4">
						<pre className="text-xs text-[#003135] dark:text-white overflow-auto max-h-64 font-mono">{JSON.stringify(preview.mapped, null, 2)}</pre>
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


