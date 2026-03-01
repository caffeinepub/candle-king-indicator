import { OHLCCandle, ConfirmationSignal } from '../types/trading';

/**
 * MMC — Market Maker Candle / Liquidity Sweep
 * Detects when a wick sweeps beyond a recent swing high/low but the candle
 * closes back inside the prior range (stop-hunt / liquidity grab).
 */
export function detectMMC(candles: OHLCCandle[]): ConfirmationSignal | null {
  if (candles.length < 6) return null;

  const lookback = Math.min(10, candles.length - 1);
  const recent = candles.slice(candles.length - 1 - lookback, candles.length - 1);
  const last = candles[candles.length - 1];

  const swingHigh = Math.max(...recent.map(c => c.high));
  const swingLow = Math.min(...recent.map(c => c.low));

  // Bullish MMC: wick sweeps below swing low but closes above it
  if (last.low < swingLow && last.close > swingLow) {
    return {
      name: 'MMC (Bullish Sweep)',
      type: 'BULLISH',
      confidenceBoost: 8,
      description: `Wick swept below swing low (${swingLow.toFixed(2)}) then closed above — liquidity grab, bullish reversal likely.`,
    };
  }

  // Bearish MMC: wick sweeps above swing high but closes below it
  if (last.high > swingHigh && last.close < swingHigh) {
    return {
      name: 'MMC (Bearish Sweep)',
      type: 'BEARISH',
      confidenceBoost: 8,
      description: `Wick swept above swing high (${swingHigh.toFixed(2)}) then closed below — liquidity grab, bearish reversal likely.`,
    };
  }

  return null;
}

/**
 * After Effect — Post-Breakout Retest Confirmation
 * Checks if the candle after a breakout candle retests the breakout level
 * and closes in the breakout direction.
 */
export function detectAfterEffect(candles: OHLCCandle[]): ConfirmationSignal | null {
  if (candles.length < 4) return null;

  const len = candles.length;
  const prev2 = candles[len - 3]; // breakout candle
  const prev1 = candles[len - 2]; // retest candle
  const last = candles[len - 1];  // confirmation candle

  const breakoutBody = Math.abs(prev2.close - prev2.open);
  const avgBody = candles.slice(-10).reduce((s, c) => s + Math.abs(c.close - c.open), 0) / 10;

  // Bullish breakout: prev2 closes strongly up, prev1 retests, last confirms
  if (
    prev2.close > prev2.open &&
    breakoutBody > avgBody * 1.2 &&
    prev1.low <= prev2.close &&
    prev1.close >= prev2.open &&
    last.close > prev1.high
  ) {
    return {
      name: 'After Effect (Bullish)',
      type: 'BULLISH',
      confidenceBoost: 7,
      description: 'Breakout candle followed by retest and bullish confirmation — After Effect pattern active.',
    };
  }

  // Bearish breakout: prev2 closes strongly down, prev1 retests, last confirms
  if (
    prev2.close < prev2.open &&
    breakoutBody > avgBody * 1.2 &&
    prev1.high >= prev2.close &&
    prev1.close <= prev2.open &&
    last.close < prev1.low
  ) {
    return {
      name: 'After Effect (Bearish)',
      type: 'BEARISH',
      confidenceBoost: 7,
      description: 'Breakdown candle followed by retest and bearish confirmation — After Effect pattern active.',
    };
  }

  return null;
}

/**
 * Ellipse — Tight Consolidation Zone
 * Identifies 5+ consecutive candles where the total high-low range is
 * less than 1% of the average close price (coiling / compression).
 */
export function detectEllipse(candles: OHLCCandle[]): ConfirmationSignal | null {
  if (candles.length < 5) return null;

  const window = candles.slice(-8);
  const avgClose = window.reduce((s, c) => s + c.close, 0) / window.length;
  const rangeHigh = Math.max(...window.map(c => c.high));
  const rangeLow = Math.min(...window.map(c => c.low));
  const totalRange = rangeHigh - rangeLow;
  const rangePercent = (totalRange / avgClose) * 100;

  if (rangePercent < 1.0) {
    // Determine bias from last candle direction
    const last = candles[candles.length - 1];
    const type = last.close >= last.open ? 'BULLISH' : 'BEARISH';
    return {
      name: 'Ellipse (Compression)',
      type,
      confidenceBoost: 6,
      description: `Price compressed in ${rangePercent.toFixed(2)}% range over last ${window.length} candles — breakout imminent.`,
    };
  }

  return null;
}

/**
 * Arc — Progressive Curve Pattern
 * Scans the last 10 candles for a progressive series of higher lows (bullish arc)
 * or lower highs (bearish arc) indicating a curved momentum build-up.
 */
export function detectArc(candles: OHLCCandle[]): ConfirmationSignal | null {
  if (candles.length < 10) return null;

  const window = candles.slice(-10);

  // Bullish arc: at least 6 of 9 consecutive low-to-low steps are higher
  let higherLowCount = 0;
  let lowerHighCount = 0;
  for (let i = 1; i < window.length; i++) {
    if (window[i].low > window[i - 1].low) higherLowCount++;
    if (window[i].high < window[i - 1].high) lowerHighCount++;
  }

  if (higherLowCount >= 6) {
    return {
      name: 'Arc (Bullish Curve)',
      type: 'BULLISH',
      confidenceBoost: 7,
      description: `Progressive higher lows detected over 10 candles (${higherLowCount}/9 steps) — bullish arc momentum building.`,
    };
  }

  if (lowerHighCount >= 6) {
    return {
      name: 'Arc (Bearish Curve)',
      type: 'BEARISH',
      confidenceBoost: 7,
      description: `Progressive lower highs detected over 10 candles (${lowerHighCount}/9 steps) — bearish arc momentum building.`,
    };
  }

  return null;
}

/**
 * TBC — To Be Confirmed
 * Meta-detector: flags the signal as uncertain when composite confidence
 * falls in the 40–60 range. Returns a NEUTRAL signal with a TBC label.
 */
export function detectTBC(compositeScore: number): ConfirmationSignal | null {
  if (compositeScore >= 40 && compositeScore <= 60) {
    return {
      name: 'TBC (To Be Confirmed)',
      type: 'NEUTRAL',
      confidenceBoost: 0,
      description: `Confidence score (${compositeScore}%) is in the uncertain zone (40–60). Wait for additional confirmation before entering.`,
    };
  }
  return null;
}

/**
 * Triangle — Converging Trendline Pattern
 * Detects ascending (rising lows, flat highs), descending (falling highs, flat lows),
 * and symmetrical (converging highs and lows) triangles over at least 8 candles.
 */
export function detectTriangle(candles: OHLCCandle[]): ConfirmationSignal | null {
  if (candles.length < 8) return null;

  const window = candles.slice(-12);
  const n = window.length;

  // Linear regression slope helper
  function slope(values: number[]): number {
    const len = values.length;
    const xMean = (len - 1) / 2;
    const yMean = values.reduce((s, v) => s + v, 0) / len;
    let num = 0;
    let den = 0;
    for (let i = 0; i < len; i++) {
      num += (i - xMean) * (values[i] - yMean);
      den += (i - xMean) ** 2;
    }
    return den === 0 ? 0 : num / den;
  }

  const highs = window.map(c => c.high);
  const lows = window.map(c => c.low);
  const avgPrice = window.reduce((s, c) => s + c.close, 0) / n;

  const highSlope = slope(highs);
  const lowSlope = slope(lows);

  // Normalize slopes relative to price
  const normHighSlope = highSlope / avgPrice;
  const normLowSlope = lowSlope / avgPrice;

  const flat = 0.0003; // threshold for "flat"

  // Ascending triangle: flat highs, rising lows
  if (Math.abs(normHighSlope) < flat && normLowSlope > flat) {
    return {
      name: 'Triangle (Ascending)',
      type: 'BULLISH',
      confidenceBoost: 8,
      description: 'Ascending triangle: flat resistance with rising support — bullish breakout expected.',
    };
  }

  // Descending triangle: falling highs, flat lows
  if (normHighSlope < -flat && Math.abs(normLowSlope) < flat) {
    return {
      name: 'Triangle (Descending)',
      type: 'BEARISH',
      confidenceBoost: 8,
      description: 'Descending triangle: falling resistance with flat support — bearish breakdown expected.',
    };
  }

  // Symmetrical triangle: converging highs and lows
  if (normHighSlope < -flat && normLowSlope > flat) {
    const last = candles[candles.length - 1];
    const type = last.close >= last.open ? 'BULLISH' : 'BEARISH';
    return {
      name: 'Triangle (Symmetrical)',
      type,
      confidenceBoost: 6,
      description: 'Symmetrical triangle: converging highs and lows — breakout direction determined by momentum.',
    };
  }

  return null;
}
