import clsx from 'clsx';
import React from 'react';

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx(
      'rounded-2xl border border-[#E2E8F0] dark:border-[#024950] bg-white dark:bg-[#003135] shadow-sm',
      'hover:ring-1 hover:ring-[#0FA4AF]/20 transition-shadow',
      className,
    )}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx('px-4 py-3 border-b border-[#E2E8F0] dark:border-[#024950]', className)}>{children}</div>;
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx('p-4', className)}>{children}</div>;
}


