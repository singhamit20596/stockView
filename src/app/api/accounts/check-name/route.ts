import { NextResponse } from 'next/server';
import { listRows } from '@/lib/filedb';
import { tables } from '@/lib/filedb';
import type { Account } from '@/lib/types';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const name = searchParams.get('name');
	if (!name) return NextResponse.json({ valid: false, reason: 'name required' }, { status: 400 });
	const rows = await listRows<Account>(tables.accounts);
	const exists = rows.some((a) => a.name.toLowerCase() === name.toLowerCase());
	return NextResponse.json({ valid: !exists });
}


