import clsx from 'clsx';
import { getSectorColor, getSubsectorColor } from '@/lib/colors';

type Tone = 'neutral' | 'positive' | 'negative' | 'warn' | 'accent' | 'sector' | 'subsector' | 'secondary' | 'outline';

export function Badge({ 
  tone = 'neutral', 
  children, 
  sector,
  subsector
}: { 
  tone?: Tone; 
  children: React.ReactNode;
  sector?: string;
  subsector?: string;
}) {
  const tones: Record<Tone, string> = {
    neutral: 'bg-zinc-100 text-zinc-800',
    positive: 'bg-green-100 text-green-700',
    negative: 'bg-red-100 text-red-700',
    warn: 'bg-amber-100 text-amber-800',
    accent: 'bg-indigo-100 text-indigo-700',
    sector: 'text-white',
    subsector: 'text-white',
    secondary: 'bg-zinc-100 text-zinc-800',
    outline: 'bg-transparent border border-zinc-300 text-zinc-700',
  };

  let backgroundColor = '';
  if (sector && tone === 'sector') {
    backgroundColor = `background-color: ${getSectorColor(sector)}`;
  } else if (subsector && tone === 'subsector') {
    backgroundColor = `background-color: ${getSubsectorColor(subsector)}`;
  }

  return (
    <span 
      className={clsx('px-2 py-0.5 text-xs rounded-full', tones[tone])}
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      {children}
    </span>
  );
}


