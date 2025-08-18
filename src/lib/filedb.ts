import fs from 'fs/promises';
import path from 'path';
import { tableFilePaths } from './paths';
import type { TableFile } from './types';

// Simple in-process mutex per file to avoid concurrent writes
const locks = new Map<string, Promise<void>>();

async function withLock<T>(filePath: string, fn: () => Promise<T>): Promise<T> {
	const previous = locks.get(filePath) || Promise.resolve();
	let release!: () => void;
	const current = new Promise<void>((resolve) => (release = resolve));
	locks.set(filePath, previous.then(() => current));
	try {
		await previous;
		return await fn();
	} finally {
		release();
		// Clean up if this lock is the last one
		if (locks.get(filePath) === current) {
			locks.delete(filePath);
		}
	}
}

async function ensureFile(filePath: string): Promise<void> {
	try {
		await fs.access(filePath);
	} catch {
		const dir = path.dirname(filePath);
		await fs.mkdir(dir, { recursive: true });
		const empty: TableFile<unknown> = { meta: { version: 1, updatedAt: new Date(0).toISOString() }, rows: [] };
		await fs.writeFile(filePath, JSON.stringify(empty, null, 2), 'utf8');
	}
}

export async function readTable<T>(filePath: string): Promise<TableFile<T>> {
	await ensureFile(filePath);
	const raw = await fs.readFile(filePath, 'utf8');
	return JSON.parse(raw) as TableFile<T>;
}

export async function writeTable<T>(filePath: string, table: TableFile<T>): Promise<void> {
	await withLock(filePath, async () => {
		const tmpPath = `${filePath}.tmp`;
		const toWrite = { ...table, meta: { ...table.meta, updatedAt: new Date().toISOString() } } as TableFile<T>;
		await fs.writeFile(tmpPath, JSON.stringify(toWrite, null, 2), 'utf8');
		await fs.rename(tmpPath, filePath);
	});
}

export async function listRows<T>(filePath: string): Promise<T[]> {
	const table = await readTable<T>(filePath);
	return table.rows;
}

export async function replaceRows<T>(filePath: string, rows: T[]): Promise<void> {
	const table = await readTable<T>(filePath);
	table.rows = rows;
	await writeTable<T>(filePath, table);
}

export async function withLockedTables<T>(filePaths: string[], fn: () => Promise<T>): Promise<T> {
	// Acquire locks in deterministic order
	const sorted = [...filePaths].sort();
	let result!: T;
	await sorted.reduce<Promise<void>>(async (prev, fp) => {
		await prev;
		await withLock(fp, async () => {
			result = await fn();
		});
		return Promise.resolve();
	}, Promise.resolve());
	return result;
}

export const tables = tableFilePaths;


