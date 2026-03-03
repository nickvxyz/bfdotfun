// USDC has 6 decimals
export const USDC_DECIMALS = 6;

// Prices in human-readable USD
export const PRICE_PER_KG = 1.0;
export const RETROSPECTIVE_PRICE_PER_KG = 0.5;

// Prices in USDC smallest unit (6 decimals)
export const PRICE_PER_KG_USDC = BigInt(1_000_000);
export const RETROSPECTIVE_PRICE_PER_KG_USDC = BigInt(500_000);

export function calculateCostUsdc(kgAmount: number, isRetrospective: boolean): bigint {
  const pricePerKg = isRetrospective ? RETROSPECTIVE_PRICE_PER_KG_USDC : PRICE_PER_KG_USDC;
  return pricePerKg * BigInt(kgAmount);
}

export function calculateCostDisplay(kgAmount: number, isRetrospective: boolean): string {
  const price = isRetrospective ? RETROSPECTIVE_PRICE_PER_KG : PRICE_PER_KG;
  return (kgAmount * price).toFixed(2);
}

export function formatUsdc(amount: bigint): string {
  const whole = amount / BigInt(10 ** USDC_DECIMALS);
  const fraction = amount % BigInt(10 ** USDC_DECIMALS);
  const fractionStr = fraction.toString().padStart(USDC_DECIMALS, "0").slice(0, 2);
  return `${whole}.${fractionStr}`;
}
