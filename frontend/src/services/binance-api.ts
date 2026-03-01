// Binance public REST API service — no API key required

export interface BinanceKline {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BinanceTicker {
  symbol: string;
  lastPrice: number;
  priceChangePercent: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
}

const BASE_URL = 'https://api.binance.com/api/v3';

/**
 * Fetch OHLCV klines from Binance public API.
 * @param symbol  e.g. "BTCUSDT"
 * @param interval  e.g. "1m", "5m", "15m", "1h", "4h", "1d"
 * @param limit  number of candles (max 1000, default 100)
 */
export async function fetchKlines(
  symbol: string,
  interval: string,
  limit = 100
): Promise<BinanceKline[]> {
  const url = `${BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Binance klines error ${response.status}: ${text}`);
  }

  // Each element: [openTime, open, high, low, close, volume, closeTime, ...]
  const raw: (string | number)[][] = await response.json();

  return raw.map((row) => ({
    timestamp: Number(row[0]),
    open: parseFloat(row[1] as string),
    high: parseFloat(row[2] as string),
    low: parseFloat(row[3] as string),
    close: parseFloat(row[4] as string),
    volume: parseFloat(row[5] as string),
  }));
}

/**
 * Fetch 24-hour ticker statistics from Binance public API.
 * @param symbol  e.g. "BTCUSDT"
 */
export async function fetchTicker24hr(symbol: string): Promise<BinanceTicker> {
  const url = `${BASE_URL}/ticker/24hr?symbol=${symbol}`;

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Binance ticker error ${response.status}: ${text}`);
  }

  const data = await response.json();

  return {
    symbol: data.symbol,
    lastPrice: parseFloat(data.lastPrice),
    priceChangePercent: parseFloat(data.priceChangePercent),
    highPrice: parseFloat(data.highPrice),
    lowPrice: parseFloat(data.lowPrice),
    volume: parseFloat(data.volume),
  };
}
