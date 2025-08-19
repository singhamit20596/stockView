export function roundToDecimal(value: number, decimals: number = 1): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function formatCurrency(value: number): string {
  return `₹${roundToDecimal(value).toLocaleString()}`;
}

export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${roundToDecimal(value)}%`;
}
