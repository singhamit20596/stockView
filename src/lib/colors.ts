// Color mapping for sectors and subsectors
export const sectorColors: Record<string, string> = {
  'Technology': '#3B82F6', // Blue
  'Financial Services': '#10B981', // Green
  'Healthcare': '#EF4444', // Red
  'Consumer Goods': '#F59E0B', // Amber
  'Energy': '#8B5CF6', // Purple
  'Industrials': '#6B7280', // Gray
  'Materials': '#F97316', // Orange
  'Real Estate': '#EC4899', // Pink
  'Communication Services': '#06B6D4', // Cyan
  'Utilities': '#84CC16', // Lime
  'Consumer Services': '#F43F5E', // Rose
  'Basic Materials': '#A855F7', // Violet
  'default': '#6B7280', // Default gray
};

export const subsectorColors: Record<string, string> = {
  // Technology
  'Software': '#1D4ED8',
  'Hardware': '#2563EB',
  'Internet': '#3B82F6',
  'Semiconductors': '#60A5FA',
  
  // Financial Services
  'Banking': '#059669',
  'Insurance': '#10B981',
  'Investment Services': '#34D399',
  'Real Estate Investment': '#6EE7B7',
  
  // Healthcare
  'Pharmaceuticals': '#DC2626',
  'Biotechnology': '#EF4444',
  'Healthcare Services': '#F87171',
  'Medical Devices': '#FCA5A5',
  
  // Consumer Goods
  'Food & Beverage': '#D97706',
  'Personal Care': '#F59E0B',
  'Household Products': '#FBBF24',
  'Apparel': '#FCD34D',
  
  // Energy
  'Oil & Gas': '#7C3AED',
  'Renewable Energy': '#8B5CF6',
  'Utilities': '#A78BFA',
  'Energy Services': '#C4B5FD',
  
  // Industrials
  'Manufacturing': '#4B5563',
  'Transportation': '#6B7280',
  'Construction': '#9CA3AF',
  'Aerospace & Defense': '#D1D5DB',
  
  // Materials
  'Chemicals': '#EA580C',
  'Metals & Mining': '#F97316',
  'Construction Materials': '#FB923C',
  'Paper & Packaging': '#FDBA74',
  
  // Real Estate
  'Real Estate Development': '#BE185D',
  'Real Estate Services': '#EC4899',
  'REITs': '#F472B6',
  'Property Management': '#F9A8D4',
  
  // Communication Services
  'Telecommunications': '#0891B2',
  'Media & Entertainment': '#06B6D4',
  'Social Media': '#22D3EE',
  'Content Creation': '#67E8F9',
  
  // Utilities
  'Electric Utilities': '#65A30D',
  'Gas Utilities': '#84CC16',
  'Water Utilities': '#A3E635',
  'Multi-Utilities': '#BEF264',
  
  // Consumer Services
  'Retail': '#E11D48',
  'Restaurants': '#F43F5E',
  'Travel & Leisure': '#FB7185',
  'Education': '#FDA4AF',
  
  // Basic Materials
  'Agricultural Chemicals': '#9333EA',
  'Forest Products': '#A855F7',
  'Steel': '#C084FC',
  'Aluminum': '#DDD6FE',
  
  'default': '#6B7280', // Default gray
};

export function getSectorColor(sector: string): string {
  return sectorColors[sector] || sectorColors.default;
}

export function getSubsectorColor(subsector: string): string {
  return subsectorColors[subsector] || subsectorColors.default;
}

// Generate a color for any sector/subsector that's not in our predefined list
export function generateColor(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
}
