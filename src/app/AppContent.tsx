"use client";
import Link from 'next/link';
import { useTheme } from './providers';
import { useState, useEffect } from 'react';
import { getLogoSvg } from '@/components/ui/LogoOptions';

export default function AppContent({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const [selectedLogo, setSelectedLogo] = useState('chart-lines');

  useEffect(() => {
    const savedLogo = localStorage.getItem('stockview-logo');
    if (savedLogo) {
      setSelectedLogo(savedLogo);
    }
  }, []);
  
  return (
    <div className={`flex min-h-screen ${theme === 'dark' ? 'dark bg-zinc-900' : 'bg-zinc-50'}`}>
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-72 bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-6">
        <div className="pb-6 mb-6 border-b border-white/10">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <div className="w-8 h-8 rounded-lg bg-white text-indigo-600 grid place-items-center font-bold">
              <div dangerouslySetInnerHTML={{ __html: getLogoSvg(selectedLogo) }} />
            </div>
            <span>stockView</span>
          </div>
        </div>
        <nav className="space-y-1 text-sm">
          <Link href="/" className="block px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">Home</Link>
          <Link href="/accounts" className="block px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">Accounts</Link>
          <Link href="/views" className="block px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">Views</Link>
          <Link href="/stock-view" className="block px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">Dashboard</Link>
          <Link href="/settings" className="block px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">Settings</Link>
        </nav>
      </aside>
      {/* Main */}
      <div className="flex-1 ml-72 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white dark:bg-zinc-800 h-14 border-b border-zinc-200 dark:border-zinc-700 shadow-sm">
          <div className="px-6 h-full flex items-center justify-between">
            <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200"></div>
            <div className="flex items-center gap-3">
              <button 
                className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 grid place-items-center transition-colors"
                onClick={toggleTheme}
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? (
                  <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </button>
              <Link href="/add-account" className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition-colors" title="Add new account">Add Account</Link>
              <Link href="/add-view" className="px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md text-sm dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors" title="Add new view">Add View</Link>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 grid place-items-center text-xs font-semibold" title="User profile">U</div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
        <footer className="border-t border-zinc-200 dark:border-zinc-700">
          <div className="px-6 py-4 text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
            <div>© {new Date().getFullYear()} stockView</div>
            <div className="flex gap-3">
              <a className="underline hover:text-zinc-800 dark:hover:text-zinc-200" href="https://github.com/singhamit20596/stockView" target="_blank" rel="noreferrer" title="View on GitHub">GitHub</a>
              <Link className="underline hover:text-zinc-800 dark:hover:text-zinc-200" href="/stock-view" title="Go to Dashboard">Dashboard</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
