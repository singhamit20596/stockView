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
    neutral: 'bg-[#F1F5F9] dark:bg-[#024950] text-[#024950] dark:text-white',
    positive: 'bg-[#0FA4AF]/10 text-[#0FA4AF] dark:bg-[#0FA4AF]/20',
    negative: 'bg-[#964734]/10 text-[#964734] dark:bg-[#964734]/20',
    warn: 'bg-[#964734]/10 text-[#964734] dark:bg-[#964734]/20',
    accent: 'bg-[#0FA4AF]/10 text-[#0FA4AF] dark:bg-[#0FA4AF]/20',
    sector: 'text-white',
    subsector: 'text-white',
    secondary: 'bg-[#F1F5F9] dark:bg-[#024950] text-[#024950] dark:text-white',
    outline: 'bg-transparent border border-[#CBD5E1] dark:border-[#024950] text-[#64748B] dark:text-[#AFDDE5]',
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


