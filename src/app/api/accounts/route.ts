import { NextResponse } from 'next/server';
import { listRows, replaceRows } from '@/lib/filedb';
import { tables } from '@/lib/filedb';
import type { Account } from '@/lib/types';
import { nowIso, generateId } from '@/lib/ids';

export async function GET() {
	const accounts = await listRows<Account>(tables.accounts);
	return NextResponse.json(accounts);
}

export async function POST(request: Request) {
	const body = await request.json();
	const { name } = body as { name: string };
	if (!name || typeof name !== 'string') {
		return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
	}
	const rows = await listRows<Account>(tables.accounts);
	if (rows.some((a) => a.name.toLowerCase() === name.toLowerCase())) {
		return NextResponse.json({ error: 'Account name already exists' }, { status: 409 });
	}
	const now = nowIso();
	const newAccount: Account = {
		id: generateId(),
		name,
		investedValue: '0',
		currentValue: '0',
		pnl: '0',
		pnlPercent: '0',
		createdAt: now,
		updatedAt: now,
	};
	await replaceRows<Account>(tables.accounts, [...rows, newAccount]);
	return NextResponse.json(newAccount, { status: 201 });
}


