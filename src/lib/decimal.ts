import Decimal from 'decimal.js';

export const D = (v: string | number | Decimal) => new Decimal(v);

export function toString(d: Decimal): string {
	return d.toFixed();
}

export function safeDivide(numerator: Decimal, denominator: Decimal): Decimal {
	if (denominator.isZero()) return new Decimal(0);
	return numerator.div(denominator);
}


