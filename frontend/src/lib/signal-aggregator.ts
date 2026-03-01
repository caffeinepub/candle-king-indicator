import { PatternSignal, TrendDirection, SupportResistanceZone, FinalSignal, SignalType } from '../types/trading';
import { isNearSRZone } from './support-resistance';

export function aggregateSignals(
  patternSignals: PatternSignal[],
  trend: TrendDirection,
  srZones: SupportResistanceZone[],
  volumeConfirmation: boolean,
  currentPrice: number
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

  const totalConfidence = Math.min(100, Math.round(patternScore + trendScore + srScore + volumeScore));

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
  };
}
