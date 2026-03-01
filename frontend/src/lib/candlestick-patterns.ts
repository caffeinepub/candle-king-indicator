import { OHLCCandle, PatternSignal } from '../types/trading';

function bodySize(c: OHLCCandle): number {
  return Math.abs(c.close - c.open);
}
function totalRange(c: OHLCCandle): number {
  return c.high - c.low;
}
function upperWick(c: OHLCCandle): number {
  return c.high - Math.max(c.open, c.close);
}
function lowerWick(c: OHLCCandle): number {
  return Math.min(c.open, c.close) - c.low;
}
function isBullish(c: OHLCCandle): boolean {
  return c.close > c.open;
}
function isBearish(c: OHLCCandle): boolean {
  return c.close < c.open;
}
function avgBody(candles: OHLCCandle[], idx: number, lookback = 5): number {
  const start = Math.max(0, idx - lookback);
  const slice = candles.slice(start, idx);
  if (slice.length === 0) return 1;
  return slice.reduce((s, c) => s + bodySize(c), 0) / slice.length;
}

// 1. Doji
export function detectDoji(candles: OHLCCandle[], idx: number): PatternSignal {
  const c = candles[idx];
  const body = bodySize(c);
  const range = totalRange(c);
  const detected = range > 0 && body / range < 0.1;
  return {
    detected,
    signalType: 'NEUTRAL',
    confidence: detected ? 55 : 0,
    patternName: 'Doji',
    candleIndex: idx,
  };
}

// 2. Hammer
export function detectHammer(candles: OHLCCandle[], idx: number): PatternSignal {
  const c = candles[idx];
  const body = bodySize(c);
  const lower = lowerWick(c);
  const upper = upperWick(c);
  const range = totalRange(c);
  const avg = avgBody(candles, idx);
  const detected =
    range > 0 &&
    lower >= 2 * body &&
    upper <= 0.3 * body &&
    body >= 0.3 * avg;
  return {
    detected,
    signalType: 'BUY',
    confidence: detected ? 70 : 0,
    patternName: 'Hammer',
    candleIndex: idx,
  };
}

// 3. Shooting Star
export function detectShootingStar(candles: OHLCCandle[], idx: number): PatternSignal {
  const c = candles[idx];
  const body = bodySize(c);
  const upper = upperWick(c);
  const lower = lowerWick(c);
  const range = totalRange(c);
  const avg = avgBody(candles, idx);
  const detected =
    range > 0 &&
    upper >= 2 * body &&
    lower <= 0.3 * body &&
    body >= 0.3 * avg;
  return {
    detected,
    signalType: 'SELL',
    confidence: detected ? 70 : 0,
    patternName: 'Shooting Star',
    candleIndex: idx,
  };
}

// 4. Bullish Engulfing
export function detectBullishEngulfing(candles: OHLCCandle[], idx: number): PatternSignal {
  if (idx < 1) return { detected: false, signalType: 'NEUTRAL', confidence: 0, patternName: 'Bullish Engulfing', candleIndex: idx };
  const prev = candles[idx - 1];
  const curr = candles[idx];
  const detected =
    isBearish(prev) &&
    isBullish(curr) &&
    curr.open < prev.close &&
    curr.close > prev.open;
  return {
    detected,
    signalType: 'BUY',
    confidence: detected ? 80 : 0,
    patternName: 'Bullish Engulfing',
    candleIndex: idx,
  };
}

// 5. Bearish Engulfing
export function detectBearishEngulfing(candles: OHLCCandle[], idx: number): PatternSignal {
  if (idx < 1) return { detected: false, signalType: 'NEUTRAL', confidence: 0, patternName: 'Bearish Engulfing', candleIndex: idx };
  const prev = candles[idx - 1];
  const curr = candles[idx];
  const detected =
    isBullish(prev) &&
    isBearish(curr) &&
    curr.open > prev.close &&
    curr.close < prev.open;
  return {
    detected,
    signalType: 'SELL',
    confidence: detected ? 80 : 0,
    patternName: 'Bearish Engulfing',
    candleIndex: idx,
  };
}

// 6. Morning Star
export function detectMorningStar(candles: OHLCCandle[], idx: number): PatternSignal {
  if (idx < 2) return { detected: false, signalType: 'NEUTRAL', confidence: 0, patternName: 'Morning Star', candleIndex: idx };
  const c1 = candles[idx - 2];
  const c2 = candles[idx - 1];
  const c3 = candles[idx];
  const avg = avgBody(candles, idx);
  const detected =
    isBearish(c1) &&
    bodySize(c2) < 0.3 * avg &&
    isBullish(c3) &&
    c3.close > (c1.open + c1.close) / 2;
  return {
    detected,
    signalType: 'BUY',
    confidence: detected ? 82 : 0,
    patternName: 'Morning Star',
    candleIndex: idx,
  };
}

// 7. Evening Star
export function detectEveningStar(candles: OHLCCandle[], idx: number): PatternSignal {
  if (idx < 2) return { detected: false, signalType: 'NEUTRAL', confidence: 0, patternName: 'Evening Star', candleIndex: idx };
  const c1 = candles[idx - 2];
  const c2 = candles[idx - 1];
  const c3 = candles[idx];
  const avg = avgBody(candles, idx);
  const detected =
    isBullish(c1) &&
    bodySize(c2) < 0.3 * avg &&
    isBearish(c3) &&
    c3.close < (c1.open + c1.close) / 2;
  return {
    detected,
    signalType: 'SELL',
    confidence: detected ? 82 : 0,
    patternName: 'Evening Star',
    candleIndex: idx,
  };
}

// 8. Pin Bar (Bullish)
export function detectBullishPinBar(candles: OHLCCandle[], idx: number): PatternSignal {
  const c = candles[idx];
  const body = bodySize(c);
  const lower = lowerWick(c);
  const range = totalRange(c);
  const detected =
    range > 0 &&
    lower >= 0.6 * range &&
    body <= 0.25 * range;
  return {
    detected,
    signalType: 'BUY',
    confidence: detected ? 72 : 0,
    patternName: 'Bullish Pin Bar',
    candleIndex: idx,
  };
}

// 9. Pin Bar (Bearish)
export function detectBearishPinBar(candles: OHLCCandle[], idx: number): PatternSignal {
  const c = candles[idx];
  const body = bodySize(c);
  const upper = upperWick(c);
  const range = totalRange(c);
  const detected =
    range > 0 &&
    upper >= 0.6 * range &&
    body <= 0.25 * range;
  return {
    detected,
    signalType: 'SELL',
    confidence: detected ? 72 : 0,
    patternName: 'Bearish Pin Bar',
    candleIndex: idx,
  };
}

// 10. Inside Bar
export function detectInsideBar(candles: OHLCCandle[], idx: number): PatternSignal {
  if (idx < 1) return { detected: false, signalType: 'NEUTRAL', confidence: 0, patternName: 'Inside Bar', candleIndex: idx };
  const prev = candles[idx - 1];
  const curr = candles[idx];
  const detected =
    curr.high < prev.high &&
    curr.low > prev.low;
  return {
    detected,
    signalType: 'NEUTRAL',
    confidence: detected ? 60 : 0,
    patternName: 'Inside Bar',
    candleIndex: idx,
  };
}

// 11. Marubozu (Bullish)
export function detectBullishMarubozu(candles: OHLCCandle[], idx: number): PatternSignal {
  const c = candles[idx];
  const body = bodySize(c);
  const range = totalRange(c);
  const detected =
    isBullish(c) &&
    range > 0 &&
    body / range >= 0.9;
  return {
    detected,
    signalType: 'BUY',
    confidence: detected ? 75 : 0,
    patternName: 'Bullish Marubozu',
    candleIndex: idx,
  };
}

// 12. Marubozu (Bearish)
export function detectBearishMarubozu(candles: OHLCCandle[], idx: number): PatternSignal {
  const c = candles[idx];
  const body = bodySize(c);
  const range = totalRange(c);
  const detected =
    isBearish(c) &&
    range > 0 &&
    body / range >= 0.9;
  return {
    detected,
    signalType: 'SELL',
    confidence: detected ? 75 : 0,
    patternName: 'Bearish Marubozu',
    candleIndex: idx,
  };
}

// 13. Bullish Harami
export function detectBullishHarami(candles: OHLCCandle[], idx: number): PatternSignal {
  if (idx < 1) return { detected: false, signalType: 'NEUTRAL', confidence: 0, patternName: 'Bullish Harami', candleIndex: idx };
  const prev = candles[idx - 1];
  const curr = candles[idx];
  const detected =
    isBearish(prev) &&
    isBullish(curr) &&
    curr.open > prev.close &&
    curr.close < prev.open &&
    bodySize(curr) < bodySize(prev) * 0.5;
  return {
    detected,
    signalType: 'BUY',
    confidence: detected ? 65 : 0,
    patternName: 'Bullish Harami',
    candleIndex: idx,
  };
}

// 14. Bearish Harami
export function detectBearishHarami(candles: OHLCCandle[], idx: number): PatternSignal {
  if (idx < 1) return { detected: false, signalType: 'NEUTRAL', confidence: 0, patternName: 'Bearish Harami', candleIndex: idx };
  const prev = candles[idx - 1];
  const curr = candles[idx];
  const detected =
    isBullish(prev) &&
    isBearish(curr) &&
    curr.open < prev.close &&
    curr.close > prev.open &&
    bodySize(curr) < bodySize(prev) * 0.5;
  return {
    detected,
    signalType: 'SELL',
    confidence: detected ? 65 : 0,
    patternName: 'Bearish Harami',
    candleIndex: idx,
  };
}

// 15. Three White Soldiers
export function detectThreeWhiteSoldiers(candles: OHLCCandle[], idx: number): PatternSignal {
  if (idx < 2) return { detected: false, signalType: 'NEUTRAL', confidence: 0, patternName: 'Three White Soldiers', candleIndex: idx };
  const c1 = candles[idx - 2];
  const c2 = candles[idx - 1];
  const c3 = candles[idx];
  const detected =
    isBullish(c1) && isBullish(c2) && isBullish(c3) &&
    c2.open > c1.open && c2.open < c1.close &&
    c3.open > c2.open && c3.open < c2.close &&
    c3.close > c2.close && c2.close > c1.close;
  return {
    detected,
    signalType: 'BUY',
    confidence: detected ? 85 : 0,
    patternName: 'Three White Soldiers',
    candleIndex: idx,
  };
}

// 16. Three Black Crows
export function detectThreeBlackCrows(candles: OHLCCandle[], idx: number): PatternSignal {
  if (idx < 2) return { detected: false, signalType: 'NEUTRAL', confidence: 0, patternName: 'Three Black Crows', candleIndex: idx };
  const c1 = candles[idx - 2];
  const c2 = candles[idx - 1];
  const c3 = candles[idx];
  const detected =
    isBearish(c1) && isBearish(c2) && isBearish(c3) &&
    c2.open < c1.open && c2.open > c1.close &&
    c3.open < c2.open && c3.open > c2.close &&
    c3.close < c2.close && c2.close < c1.close;
  return {
    detected,
    signalType: 'SELL',
    confidence: detected ? 85 : 0,
    patternName: 'Three Black Crows',
    candleIndex: idx,
  };
}

// 17. Dark Cloud Cover
export function detectDarkCloudCover(candles: OHLCCandle[], idx: number): PatternSignal {
  if (idx < 1) return { detected: false, signalType: 'NEUTRAL', confidence: 0, patternName: 'Dark Cloud Cover', candleIndex: idx };
  const prev = candles[idx - 1];
  const curr = candles[idx];
  const midpoint = (prev.open + prev.close) / 2;
  const detected =
    isBullish(prev) &&
    isBearish(curr) &&
    curr.open > prev.high &&
    curr.close < midpoint &&
    curr.close > prev.open;
  return {
    detected,
    signalType: 'SELL',
    confidence: detected ? 75 : 0,
    patternName: 'Dark Cloud Cover',
    candleIndex: idx,
  };
}

// 18. Piercing Line
export function detectPiercingLine(candles: OHLCCandle[], idx: number): PatternSignal {
  if (idx < 1) return { detected: false, signalType: 'NEUTRAL', confidence: 0, patternName: 'Piercing Line', candleIndex: idx };
  const prev = candles[idx - 1];
  const curr = candles[idx];
  const midpoint = (prev.open + prev.close) / 2;
  const detected =
    isBearish(prev) &&
    isBullish(curr) &&
    curr.open < prev.low &&
    curr.close > midpoint &&
    curr.close < prev.open;
  return {
    detected,
    signalType: 'BUY',
    confidence: detected ? 75 : 0,
    patternName: 'Piercing Line',
    candleIndex: idx,
  };
}

// 19. Tweezer Tops
export function detectTweezerTops(candles: OHLCCandle[], idx: number): PatternSignal {
  if (idx < 1) return { detected: false, signalType: 'NEUTRAL', confidence: 0, patternName: 'Tweezer Tops', candleIndex: idx };
  const prev = candles[idx - 1];
  const curr = candles[idx];
  const tolerance = (prev.high + curr.high) / 2 * 0.001;
  const detected =
    Math.abs(prev.high - curr.high) <= tolerance &&
    isBullish(prev) &&
    isBearish(curr);
  return {
    detected,
    signalType: 'SELL',
    confidence: detected ? 70 : 0,
    patternName: 'Tweezer Tops',
    candleIndex: idx,
  };
}

// 20. Tweezer Bottoms
export function detectTweezerBottoms(candles: OHLCCandle[], idx: number): PatternSignal {
  if (idx < 1) return { detected: false, signalType: 'NEUTRAL', confidence: 0, patternName: 'Tweezer Bottoms', candleIndex: idx };
  const prev = candles[idx - 1];
  const curr = candles[idx];
  const tolerance = (prev.low + curr.low) / 2 * 0.001;
  const detected =
    Math.abs(prev.low - curr.low) <= tolerance &&
    isBearish(prev) &&
    isBullish(curr);
  return {
    detected,
    signalType: 'BUY',
    confidence: detected ? 70 : 0,
    patternName: 'Tweezer Bottoms',
    candleIndex: idx,
  };
}

export function detectAllPatterns(candles: OHLCCandle[], idx: number): PatternSignal[] {
  const detectors = [
    detectDoji,
    detectHammer,
    detectShootingStar,
    detectBullishEngulfing,
    detectBearishEngulfing,
    detectMorningStar,
    detectEveningStar,
    detectBullishPinBar,
    detectBearishPinBar,
    detectInsideBar,
    detectBullishMarubozu,
    detectBearishMarubozu,
    detectBullishHarami,
    detectBearishHarami,
    detectThreeWhiteSoldiers,
    detectThreeBlackCrows,
    detectDarkCloudCover,
    detectPiercingLine,
    detectTweezerTops,
    detectTweezerBottoms,
  ];
  return detectors
    .map(fn => fn(candles, idx))
    .filter(s => s.detected);
}
