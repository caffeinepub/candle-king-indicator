import { PatternSignal, TrendDirection, SupportResistanceZone, FinalSignal, SignalType, ConfirmationSignal, OHLCCandle, SignalMarker } from '../types/trading';
import { isNearSRZone } from './support-resistance';
import {
  detectMMC,
  detectAfterEffect,
  detectEllipse,
  detectArc,
  detectTBC,
  detectTriangle,
} from './advanced-confirmations';
import { detectAllPatterns } from './candlestick-patterns';
import { getAllSupportResistanceZones } from './support-resistance';
import { calculateAllEMAs, detectTrend } from './trend-analysis';
import { hasVolumeConfirmation } from './volume-analysis';

export function aggregateSignals(
  patternSignals: PatternSignal[],
  trend: TrendDirection,
  srZones: SupportResistanceZone[],
  volumeConfirmation: boolean,
  currentPrice: number,
  candles: OHLCCandle[] = []
): FinalSignal {
  const warnings: string[] = [];

  // Pattern score (50% weight)
  let buyScore = 0;
  let sellScore = 0;
  let patternScore = 0;
  let dominantPattern = 'No Pattern';

  if (patternSignals.length > 0) {
    const buyPatterns = patternSignals.filter(p => p.signalType === 'BUY');
    const sellPatterns = patternSignals.filter(p => p.signalType === 'SELL');

    buyScore = buyPatterns.reduce((s, p) => s + p.confidence, 0) / Math.max(1, buyPatterns.length);
    sellScore = sellPatterns.reduce((s, p) => s + p.confidence, 0) / Math.max(1, sellPatterns.length);

    const topPattern = [...patternSignals].sort((a, b) => b.confidence - a.confidence)[0];
    dominantPattern = topPattern.patternName;
    patternScore = Math.max(buyScore, sellScore) * 0.5;
  } else {
    warnings.push('No candlestick pattern detected');
  }

  // Trend score (20% weight)
  let trendScore = 0;
  const netSignal = buyScore - sellScore;
  if (trend === 'UP' && netSignal > 0) trendScore = 20;
  else if (trend === 'DOWN' && netSignal < 0) trendScore = 20;
  else if (trend === 'SIDEWAYS') {
    trendScore = 10;
    warnings.push('Sideways market — lower signal reliability');
  } else {
    warnings.push('Pattern conflicts with trend direction');
  }

  // S/R proximity score (15% weight)
  let srScore = 0;
  const nearZone = isNearSRZone(currentPrice, srZones);
  if (nearZone) {
    srScore = 15 * (nearZone.strength / 100);
    if (nearZone.type === 'support' && netSignal > 0) srScore = 15;
    else if (nearZone.type === 'resistance' && netSignal < 0) srScore = 15;
    else srScore = 7;
  }

  // Volume score (15% weight)
  const volumeScore = volumeConfirmation ? 15 : 0;
  if (!volumeConfirmation) warnings.push('No volume confirmation');

  const baseConfidence = Math.round(patternScore + trendScore + srScore + volumeScore);

  // ── Advanced Candle King Confirmations ──────────────────────────────────────
  const confirmations: ConfirmationSignal[] = [];

  if (candles.length > 0) {
    const mmcSignal = detectMMC(candles);
    if (mmcSignal) confirmations.push(mmcSignal);

    const aeSignal = detectAfterEffect(candles);
    if (aeSignal) confirmations.push(aeSignal);

    const ellipseSignal = detectEllipse(candles);
    if (ellipseSignal) confirmations.push(ellipseSignal);

    const arcSignal = detectArc(candles);
    if (arcSignal) confirmations.push(arcSignal);

    const triangleSignal = detectTriangle(candles);
    if (triangleSignal) confirmations.push(triangleSignal);
  }

  // Sum confidence boosts from advanced confirmations
  const confirmationBoost = confirmations.reduce((s, c) => s + c.confidenceBoost, 0);
  const totalConfidence = Math.min(100, Math.max(0, baseConfidence + confirmationBoost));

  // TBC check on final composite score
  let tbcFlag = false;
  const tbcSignal = detectTBC(totalConfidence);
  if (tbcSignal) {
    confirmations.push(tbcSignal);
    tbcFlag = true;
  }

  let signalType: SignalType = 'NEUTRAL';
  if (patternSignals.length > 0) {
    if (buyScore > sellScore && totalConfidence >= 40) signalType = 'BUY';
    else if (sellScore > buyScore && totalConfidence >= 40) signalType = 'SELL';
  }

  return {
    signalType,
    confidence: totalConfidence,
    components: {
      patternScore: Math.round(patternScore),
      trendScore,
      srScore: Math.round(srScore),
      volumeScore,
      detectedPatterns: patternSignals,
    },
    warnings,
    dominantPattern,
    confirmations,
    tbcFlag,
  };
}

/**
 * Scans every candle in the dataset and returns SignalMarker entries for
 * candles that produced a clear BUY or SELL signal (confidence >= 40,
 * not NEUTRAL, not TBC-only).
 *
 * This is intentionally a lightweight pass: it only runs pattern detection
 * per candle and uses a simplified scoring so it stays fast even for 200+
 * candle datasets.
 */
export function buildSignalMarkers(candles: OHLCCandle[]): SignalMarker[] {
  if (candles.length < 3) return [];

  const markers: SignalMarker[] = [];
  const emas = calculateAllEMAs(candles);
  const srZones = getAllSupportResistanceZones(candles);

  // Scan each candle (skip first 2 — need prior context for patterns)
  for (let i = 2; i < candles.length; i++) {
    const patterns = detectAllPatterns(candles, i);
    if (patterns.length === 0) continue;

    const buyPatterns = patterns.filter(p => p.signalType === 'BUY');
    const sellPatterns = patterns.filter(p => p.signalType === 'SELL');

    const buyScore = buyPatterns.length > 0
      ? buyPatterns.reduce((s, p) => s + p.confidence, 0) / buyPatterns.length
      : 0;
    const sellScore = sellPatterns.length > 0
      ? sellPatterns.reduce((s, p) => s + p.confidence, 0) / sellPatterns.length
      : 0;

    if (buyScore === 0 && sellScore === 0) continue;

    const trend = detectTrend(candles.slice(0, i + 1), emas.ema20, emas.ema50, emas.ema200);
    const volConfirm = hasVolumeConfirmation(candles, i);
    const currentPrice = candles[i].close;

    const netSignal = buyScore - sellScore;
    let trendScore = 0;
    if (trend === 'UP' && netSignal > 0) trendScore = 20;
    else if (trend === 'DOWN' && netSignal < 0) trendScore = 20;
    else if (trend === 'SIDEWAYS') trendScore = 10;

    const nearZone = isNearSRZone(currentPrice, srZones);
    let srScore = 0;
    if (nearZone) {
      if (nearZone.type === 'support' && netSignal > 0) srScore = 15;
      else if (nearZone.type === 'resistance' && netSignal < 0) srScore = 15;
      else srScore = 7;
    }

    const volumeScore = volConfirm ? 15 : 0;
    const patternScore = Math.max(buyScore, sellScore) * 0.5;
    const confidence = Math.min(100, Math.round(patternScore + trendScore + srScore + volumeScore));

    if (confidence < 40) continue;

    // Determine signal type
    let signalType: 'BUY' | 'SELL' | null = null;
    if (buyScore > sellScore) signalType = 'BUY';
    else if (sellScore > buyScore) signalType = 'SELL';

    if (!signalType) continue;

    // TBC zone — skip ambiguous signals
    if (confidence >= 40 && confidence <= 60) {
      // Still show them but only if confidence is clearly above 50
      if (confidence < 52) continue;
    }

    const topPattern = [...patterns].sort((a, b) => b.confidence - a.confidence)[0];

    markers.push({
      candleIndex: i,
      price: signalType === 'BUY' ? candles[i].low : candles[i].high,
      signalType,
      patternName: topPattern.patternName,
      confidence,
    });
  }

  return markers;
}
