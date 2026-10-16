export interface CurrencyInfo {
  code: string;
  /** Approximate units per 1 USD. Fetch from an exchange-rate API at runtime in production. */
  rate: number;
}

/**
 * Approximate exchange rates vs. USD (Oct 2025).
 * In production replace with a live fetch from e.g. open.er-api.com/v6/latest/USD.
 */
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  NGN: 1650,
  GHS: 15.8,
  KES: 129,
  ZAR: 18.2,
  CAD: 1.36,
  AUD: 1.52,
  NZD: 1.65,
  INR: 83.9,
  BRL: 5.1,
  MXN: 17.2,
  ARS: 1000,
  CNY: 7.25,
  JPY: 149,
  KRW: 1350,
  TRY: 34.2,
  RUB: 92,
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  EGP: 48.9,
  PKR: 278,
  BDT: 110,
  VND: 24800,
  THB: 35.1,
  IDR: 15700,
  MYR: 4.7,
  SGD: 1.34,
  HKD: 7.77,
  TWD: 32.2,
  SEK: 10.4,
  NOK: 10.7,
  DKK: 6.88,
  CHF: 0.89,
  PLN: 4.0,
  CZK: 23.5,
  HUF: 368,
  RON: 4.59,
  ILS: 3.73,
  ZMW: 27.4,
  UGX: 3700,
  TZS: 2700,
  MAD: 10.0,
  DZD: 134,
};

/** All supported currency codes, sorted alphabetically. */
export const SUPPORTED_CURRENCIES = Object.keys(EXCHANGE_RATES).sort();

/**
 * Best-guess currency code for the browser's locale.
 * Uses Intl where available; falls back to USD.
 */
export function detectCurrencyCode(): string {
  try {
    const locale = navigator.language || "en-US";
    // Intl.NumberFormat can resolve the currency for a locale when given one
    // We want the locale's native currency.
    // Use a lookup table for the common cases; Intl doesn't expose it directly.
    const region = locale.split(/[-_]/)[1]?.toUpperCase();
    const mapped = REGION_TO_CURRENCY[region ?? ""] ?? "USD";
    return EXCHANGE_RATES[mapped] ? mapped : "USD";
  } catch {
    return "USD";
  }
}

/** Format a USD amount into local currency for display. */
export function formatPrice(usd: number, code: string): string {
  const rate = EXCHANGE_RATES[code] ?? 1;
  const local = usd * rate;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: local >= 100 ? 0 : 2,
    }).format(local);
  } catch {
    return `${code} ${local.toFixed(2)}`;
  }
}

/** Convert a local-currency amount back to USD (for sending to the backend). */
export function toUsd(localAmount: number, code: string): number {
  const rate = EXCHANGE_RATES[code] ?? 1;
  return localAmount / rate;
}

const REGION_TO_CURRENCY: Record<string, string> = {
  US: "USD", GB: "GBP", NG: "NGN", GH: "GHS", KE: "KES", ZA: "ZAR",
  CA: "CAD", AU: "AUD", NZ: "NZD", IN: "INR", BR: "BRL", MX: "MXN",
  AR: "ARS", CN: "CNY", JP: "JPY", KR: "KRW", TR: "TRY", RU: "RUB",
  AE: "AED", SA: "SAR", QA: "QAR", EG: "EGP", PK: "PKR", BD: "BDT",
  VN: "VND", TH: "THB", ID: "IDR", MY: "MYR", SG: "SGD", HK: "HKD",
  TW: "TWD", SE: "SEK", NO: "NOK", DK: "DKK", CH: "CHF", PL: "PLN",
  CZ: "CZK", HU: "HUF", RO: "RON", IL: "ILS", ZM: "ZMW", UG: "UGX",
  TZ: "TZS", MA: "MAD", DZ: "DZD",
  // Eurozone
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", PT: "EUR", NL: "EUR",
  BE: "EUR", AT: "EUR", FI: "EUR", IE: "EUR", GR: "EUR", SK: "EUR",
  SI: "EUR", EE: "EUR", LV: "EUR", LT: "EUR", LU: "EUR", MT: "EUR",
  CY: "EUR",
};
