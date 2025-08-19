import clsx from 'clsx';
import React from 'react';

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx(
      'rounded-2xl border border-zinc-200 bg-white shadow-sm',
      'hover:ring-1 hover:ring-black/5 transition-shadow',
      className,
    )}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx('px-4 py-3 border-b border-zinc-200', className)}>{children}</div>;
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx('p-4', className)}>{children}</div>;
}


