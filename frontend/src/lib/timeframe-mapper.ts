/**
 * Maps app timeframe labels to Binance API interval strings.
 */
const TIMEFRAME_MAP: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1H': '1h',
  '4H': '4h',
  'Daily': '1d',
};

/**
 * Convert an app timeframe string to a Binance interval string.
 * Falls back to '1h' for unknown values.
 */
export function toBinanceInterval(appTimeframe: string): string {
  return TIMEFRAME_MAP[appTimeframe] ?? '1h';
}

/** All supported app timeframe labels */
export const SUPPORTED_TIMEFRAMES = Object.keys(TIMEFRAME_MAP);
