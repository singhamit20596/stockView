import clsx from 'clsx';
import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0FA4AF] disabled:opacity-50';
  const sizes: Record<Size, string> = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-5 text-base',
  };
  const variants: Record<Variant, string> = {
    primary: 'bg-[#0FA4AF] text-white hover:bg-[#024950]',
    secondary: 'border border-[#CBD5E1] dark:border-[#024950] text-[#024950] dark:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#024950]',
    danger: 'bg-[#964734] text-white hover:bg-[#7C3A2A]',
    ghost: 'text-[#64748B] dark:text-[#AFDDE5] hover:bg-[#F1F5F9] dark:hover:bg-[#024950]',
  };
  return (
    <button className={clsx(base, sizes[size], variants[variant], className)} {...props}>
      {children}
    </button>
  );
}


