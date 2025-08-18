"use client";

import Link from 'next/link';
import { trpc } from '@/app/providers';

export default function Home() {
	const { data: accounts, isLoading } = trpc.accounts.list.useQuery();

	return (
		<div className="min-h-screen p-8 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">stockView</h1>
				<Link href="/add-account" className="px-3 py-2 bg-black text-white rounded">Add Account</Link>
			</div>
			<p className="text-gray-500">Local JSON DB initialized. Use Accounts and the wizard to import holdings.</p>
			<div className="border rounded">
				<div className="px-4 py-2 border-b font-medium">Accounts</div>
				<div className="p-4">
					{isLoading ? (
						<p className="text-sm text-gray-500">Loading...</p>
					) : accounts && accounts.length > 0 ? (
						<table className="w-full text-sm">
							<thead>
								<tr className="text-left text-gray-600">
									<th className="py-1 pr-2">Name</th>
									<th className="py-1 pr-2">Invested</th>
									<th className="py-1 pr-2">Current</th>
									<th className="py-1 pr-2">PnL</th>
									<th className="py-1 pr-2">PnL %</th>
								</tr>
							</thead>
							<tbody>
								{accounts.map((a) => (
									<tr key={a.id} className="border-t">
										<td className="py-2 pr-2"><a href={`/accounts/${a.id}`} className="underline">{a.name}</a></td>
										<td className="py-2 pr-2">₹{a.investedValue}</td>
										<td className="py-2 pr-2">₹{a.currentValue}</td>
										<td className="py-2 pr-2">₹{a.pnl}</td>
										<td className="py-2 pr-2">{a.pnlPercent}%</td>
									</tr>
								))}
							</tbody>
						</table>
					) : (
						<p className="text-sm text-gray-500">No accounts yet. Use Add Account to import from Groww.</p>
					)}
				</div>
			</div>
		</div>
	);
}
