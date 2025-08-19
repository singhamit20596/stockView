"use client";
import { useState } from 'react';

interface LogoOption {
  id: string;
  name: string;
  svg: string;
  description: string;
}

const logoOptions: LogoOption[] = [
  {
    id: 'chart-lines',
    name: 'Chart Lines',
    svg: `<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 3h18v2H3V3zm0 4h18v2H3V7zm0 4h18v2H3v-2zm0 4h18v2H3v-2zm0 4h18v2H3v-2z"/>
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" opacity="0.6"/>
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.8"/>
    </svg>`,
    description: 'Chart lines with portfolio growth indicator'
  },
  {
    id: 'trending-up',
    name: 'Trending Up',
    svg: `<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 17l9-9 4 4 7-7"/>
      <path d="M21 7v10h-2"/>
      <path d="M3 17v-2"/>
    </svg>`,
    description: 'Simple trending up arrow'
  },
  {
    id: 'pie-chart',
    name: 'Pie Chart',
    svg: `<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 2v10l8 2" fill="currentColor"/>
      <path d="M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20z" fill="none" stroke="currentColor" strokeWidth="2"/>
    </svg>`,
    description: 'Pie chart representing portfolio allocation'
  },
  {
    id: 'bar-chart',
    name: 'Bar Chart',
    svg: `<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="16" width="3" height="6"/>
      <rect x="8" y="12" width="3" height="10"/>
      <rect x="13" y="8" width="3" height="14"/>
      <rect x="18" y="4" width="3" height="18"/>
    </svg>`,
    description: 'Bar chart showing portfolio performance'
  },
  {
    id: 'diamond',
    name: 'Diamond',
    svg: `<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      <path d="M12 2l-5 10 5 10 5-10-5-10z"/>
    </svg>`,
    description: 'Diamond shape representing value and growth'
  },
  {
    id: 'target',
    name: 'Target',
    svg: `<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
    </svg>`,
    description: 'Target representing investment goals'
  }
];

interface LogoOptionsProps {
  onSelect: (logoId: string) => void;
  currentLogo: string;
}

export function LogoOptions({ onSelect, currentLogo }: LogoOptionsProps) {
  const [selectedLogo, setSelectedLogo] = useState(currentLogo);

  const handleSelect = (logoId: string) => {
    setSelectedLogo(logoId);
    onSelect(logoId);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-zinc-900">Choose Your Logo</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {logoOptions.map((logo) => (
          <div
            key={logo.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedLogo === logo.id
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-zinc-200 hover:border-zinc-300'
            }`}
            onClick={() => handleSelect(logo.id)}
          >
            <div className="flex items-center justify-center mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white grid place-items-center">
                <div dangerouslySetInnerHTML={{ __html: logo.svg }} />
              </div>
            </div>
            <h4 className="text-sm font-medium text-zinc-900 mb-1">{logo.name}</h4>
            <p className="text-xs text-zinc-600">{logo.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function getLogoSvg(logoId: string): string {
  const logo = logoOptions.find(l => l.id === logoId);
  return logo?.svg || logoOptions[0].svg;
}
