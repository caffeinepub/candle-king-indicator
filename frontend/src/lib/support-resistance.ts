import { OHLCCandle, SupportResistanceZone } from '../types/trading';

export function detectSwingHighsLows(candles: OHLCCandle[], lookback = 3): SupportResistanceZone[] {
  const zones: SupportResistanceZone[] = [];
  for (let i = lookback; i < candles.length - lookback; i++) {
    const c = candles[i];
    let isSwingHigh = true;
    let isSwingLow = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j === i) continue;
      if (candles[j].high >= c.high) isSwingHigh = false;
      if (candles[j].low <= c.low) isSwingLow = false;
    }
    if (isSwingHigh) {
      zones.push({ level: c.high, type: 'resistance', strength: lookback * 20 });
    }
    if (isSwingLow) {
      zones.push({ level: c.low, type: 'support', strength: lookback * 20 });
    }
  }
  return zones;
}

export function detectRoundNumberLevels(candles: OHLCCandle[], increments = [100, 500, 1000]): SupportResistanceZone[] {
  if (candles.length === 0) return [];
  const prices = candles.flatMap(c => [c.high, c.low]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const zones: SupportResistanceZone[] = [];

  for (const inc of increments) {
    const start = Math.floor(minPrice / inc) * inc;
    const end = Math.ceil(maxPrice / inc) * inc;
    for (let level = start; level <= end; level += inc) {
      if (level >= minPrice && level <= maxPrice) {
        zones.push({
          level,
          type: 'round',
          strength: inc >= 1000 ? 90 : inc >= 500 ? 70 : 50,
        });
      }
    }
  }
  return zones;
}

export function detectSessionLevels(candles: OHLCCandle[]): SupportResistanceZone[] {
  if (candles.length < 2) return [];
  const zones: SupportResistanceZone[] = [];
  const sessionHigh = Math.max(...candles.slice(0, -1).map(c => c.high));
  const sessionLow = Math.min(...candles.slice(0, -1).map(c => c.low));
  zones.push({ level: sessionHigh, type: 'resistance', strength: 80 });
  zones.push({ level: sessionLow, type: 'support', strength: 80 });
  return zones;
}

export function getAllSupportResistanceZones(candles: OHLCCandle[]): SupportResistanceZone[] {
  if (candles.length < 7) return [];
  const swing = detectSwingHighsLows(candles, 3);
  const round = detectRoundNumberLevels(candles);
  const session = detectSessionLevels(candles);
  return [...swing, ...round, ...session];
}

export function isNearSRZone(price: number, zones: SupportResistanceZone[], tolerance = 0.005): SupportResistanceZone | null {
  for (const zone of zones) {
    if (Math.abs(price - zone.level) / zone.level <= tolerance) {
      return zone;
    }
  }
  return null;
}
