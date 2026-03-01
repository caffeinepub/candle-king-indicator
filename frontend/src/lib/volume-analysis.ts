import { OHLCCandle } from '../types/trading';

export function getAverageVolume(candles: OHLCCandle[], idx: number, period = 20): number {
  const start = Math.max(0, idx - period);
  const slice = candles.slice(start, idx);
  if (slice.length === 0) return 0;
  return slice.reduce((s, c) => s + c.volume, 0) / slice.length;
}

export function detectVolumeSpike(candles: OHLCCandle[], idx: number): boolean {
  const avg = getAverageVolume(candles, idx);
  if (avg === 0) return false;
  return candles[idx].volume > avg * 1.5;
}

export function hasVolumeConfirmation(candles: OHLCCandle[], idx: number): boolean {
  return detectVolumeSpike(candles, idx);
}

export function calculateVolumeBonus(hasConfirmation: boolean): number {
  return hasConfirmation ? 15 : 0;
}

export function getLowVolumeWarning(candles: OHLCCandle[], idx: number): string | null {
  const avg = getAverageVolume(candles, idx);
  if (avg === 0) return null;
  if (candles[idx].volume < avg * 0.5) {
    return 'Low volume — signal may be weak';
  }
  return null;
}

export function getVolumeSpikes(candles: OHLCCandle[]): boolean[] {
  return candles.map((_, i) => detectVolumeSpike(candles, i));
}
