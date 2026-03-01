import { OHLCCandle, TrendDirection, EMAData } from '../types/trading';

export function calculateEMA(data: number[], period: number): number[] {
  if (data.length === 0) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [];
  let prev = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ema.push(NaN);
    } else if (i === period - 1) {
      ema.push(prev);
    } else {
      prev = data[i] * k + prev * (1 - k);
      ema.push(prev);
    }
  }
  return ema;
}

export function calculateAllEMAs(candles: OHLCCandle[]): EMAData {
  const closes = candles.map(c => c.close);
  return {
    ema20: calculateEMA(closes, 20),
    ema50: calculateEMA(closes, 50),
    ema200: calculateEMA(closes, 200),
  };
}

export function detectTrend(candles: OHLCCandle[], ema20: number[], ema50: number[], ema200: number[]): TrendDirection {
  if (candles.length < 10) return 'SIDEWAYS';
  const last = candles.length - 1;
  const lookback = Math.min(10, candles.length - 1);

  // Higher highs / higher lows
  let higherHighs = 0;
  let lowerLows = 0;
  let lowerHighs = 0;
  let higherLows = 0;

  for (let i = last - lookback + 1; i <= last; i++) {
    if (i > 0) {
      if (candles[i].high > candles[i - 1].high) higherHighs++;
      if (candles[i].low < candles[i - 1].low) lowerLows++;
      if (candles[i].high < candles[i - 1].high) lowerHighs++;
      if (candles[i].low > candles[i - 1].low) higherLows++;
    }
  }

  // EMA alignment
  const e20 = ema20[last];
  const e50 = ema50[last];
  const e200 = ema200[last];
  const currentPrice = candles[last].close;

  const emaUptrend = !isNaN(e20) && !isNaN(e50) && e20 > e50 && currentPrice > e20;
  const emaDowntrend = !isNaN(e20) && !isNaN(e50) && e20 < e50 && currentPrice < e20;

  const hhhlScore = (higherHighs + higherLows) - (lowerHighs + lowerLows);

  if (hhhlScore > 2 || emaUptrend) return 'UP';
  if (hhhlScore < -2 || emaDowntrend) return 'DOWN';
  return 'SIDEWAYS';
}
