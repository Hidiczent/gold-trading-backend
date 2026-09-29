import Decimal from 'decimal.js';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export { Decimal };

export function toDecimal(value: string | number | Decimal): Decimal {
  return new Decimal(value);
}

export function formatMoney(value: Decimal): string {
  return value.toFixed(0);
}

export function formatGold(value: Decimal): string {
  return value.toFixed(4);
}

export function assertPositive(value: Decimal, field: string): void {
  if (!value.isPositive() || value.isZero()) {
    throw new Error(`${field} must be greater than zero`);
  }
}
