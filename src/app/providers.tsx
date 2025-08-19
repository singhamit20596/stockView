"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { loggerLink } from '@trpc/client/links/loggerLink';
import superjson from 'superjson';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/routers';
import { useState, createContext, useContext, useEffect } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export const trpc = createTRPCReact<AppRouter>();

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: 'light',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

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

	const [theme, setTheme] = useState<Theme>('light');

	useEffect(() => {
		const savedTheme = localStorage.getItem('theme') as Theme;
		if (savedTheme) {
			setTheme(savedTheme);
		}
	}, []);

	useEffect(() => {
		document.documentElement.classList.toggle('dark', theme === 'dark');
		localStorage.setItem('theme', theme);
	}, [theme]);

	const toggleTheme = () => {
		setTheme(prev => prev === 'light' ? 'dark' : 'light');
	};

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme }}>
			<trpc.Provider client={trpcClient} queryClient={client}>
				<QueryClientProvider client={client}>
					{children}
					<ReactQueryDevtools initialIsOpen={false} />
				</QueryClientProvider>
			</trpc.Provider>
		</ThemeContext.Provider>
	);
}


