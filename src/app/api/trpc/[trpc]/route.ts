import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers';
import { createTRPCContext } from '@/server/trpc';

const handler = async (request: Request) => {
	const url = new URL(request.url);
	try {
		console.log(`[trpc] ${request.method} ${url.pathname}${url.search} start`);
		const res = await fetchRequestHandler({
			endpoint: '/api/trpc',
			req: request,
			router: appRouter,
			createContext: createTRPCContext,
		});
		console.log(`[trpc] ${url.pathname} end`);
		return res;
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error(`[trpc][error] ${url.pathname}: ${message}`);
		throw err;
	}
};

export { handler as GET, handler as POST };


