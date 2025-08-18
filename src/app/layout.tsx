import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';
import Link from 'next/link';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "stockView",
  description: "Local portfolio viewer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <div className="p-4 border-b flex gap-4 text-sm">
            <Link href="/" className="font-medium">stockView</Link>
            <Link href="/accounts">Accounts</Link>
            <Link href="/add-account">Add Account</Link>
            <Link href="/add-view">Add View</Link>
            <Link href="/views">Views</Link>
          </div>
          {children}
        </Providers>
      </body>
    </html>
  );
}
