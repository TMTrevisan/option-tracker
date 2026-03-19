/**
 * Black-Scholes Option Greeks Calculation
 * 
 * S: Current Underlying Price
 * K: Strike Price
 * T: Time to Expiration (in years)
 * v: Implied Volatility (as a decimal, e.g. 0.25 for 25%)
 * r: Risk-free Interest Rate (as a decimal, e.g. 0.05 for 5%)
 * type: 'CALL' | 'PUT'
 */

export type Greeks = {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
};

// Standard Normal Cumulative Distribution Function (N(x))
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) return 1 - prob;
  return prob;
}

// Standard Normal Probability Density Function (n(x))
function normalPDF(x: number): number {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

export function calculateGreeks(
  S: number,
  K: number,
  T: number, // years
  v: number, // decimal
  r: number, // decimal
  type: 'CALL' | 'PUT'
): Greeks {
  // Edge cases
  if (T <= 0 || v <= 0) {
    return {
      delta: type === 'CALL' ? (S > K ? 1 : 0) : (S < K ? -1 : 0),
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0,
    };
  }

  const d1 = (Math.log(S / K) + (r + (v * v) / 2) * T) / (v * Math.sqrt(T));
  const d2 = d1 - v * Math.sqrt(T);

  const delta = type === 'CALL' ? normalCDF(d1) : normalCDF(d1) - 1;
  const gamma = normalPDF(d1) / (S * v * Math.sqrt(T));
  const vega = (S * normalPDF(d1) * Math.sqrt(T)) / 100; // per 1% change in vol

  const theta = (
    -(S * normalPDF(d1) * v) / (2 * Math.sqrt(T)) -
    r * K * Math.exp(-r * T) * normalCDF(type === 'CALL' ? d2 : -d2)
  ) / 365; // per day

  const rho = (
    K * T * Math.exp(-r * T) * normalCDF(type === 'CALL' ? d2 : -d2) * (type === 'CALL' ? 1 : -1)
  ) / 100; // per 1% change in rates

  return { delta, gamma, theta, vega, rho };
}

export function getDTE(expirationDate: string): number {
  const exp = new Date(expirationDate);
  const now = new Date();
  const diffTime = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
