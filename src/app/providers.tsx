"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { loggerLink } from '@trpc/client/links/loggerLink';
import superjson from 'superjson';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/routers';
import { useState } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export const trpc = createTRPCReact<AppRouter>();

export function Providers({ children }: { children: React.ReactNode }) {
	const [client] = useState(() => new QueryClient());
	const [trpcClient] = useState(() =>
		trpc.createClient({
			links: [
				loggerLink({
					enabled: (op) => typeof window !== 'undefined' && process.env.NODE_ENV === 'development',
				}),
				httpBatchLink({ url: '/api/trpc', transformer: superjson }),
			],
		})
	);
	return (
		<trpc.Provider client={trpcClient} queryClient={client}>
			<QueryClientProvider client={client}>
				{children}
				<ReactQueryDevtools initialIsOpen={false} />
			</QueryClientProvider>
		</trpc.Provider>
	);
}


