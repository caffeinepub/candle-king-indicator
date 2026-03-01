export interface OHLCCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type SignalType = 'BUY' | 'SELL' | 'NEUTRAL';
export type TrendDirection = 'UP' | 'DOWN' | 'SIDEWAYS';

export interface PatternSignal {
  detected: boolean;
  signalType: SignalType;
  confidence: number;
  patternName: string;
  candleIndex: number;
}

export interface SupportResistanceZone {
  level: number;
  type: 'support' | 'resistance' | 'round';
  strength: number;
}

export interface ConfirmationSignal {
  name: string;
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidenceBoost: number;
  description: string;
}

export interface FinalSignal {
  signalType: SignalType;
  confidence: number;
  components: {
    patternScore: number;
    trendScore: number;
    srScore: number;
    volumeScore: number;
    detectedPatterns: PatternSignal[];
  };
  warnings: string[];
  dominantPattern: string;
  confirmations: ConfirmationSignal[];
  tbcFlag: boolean;
}

export interface EMAData {
  ema20: number[];
  ema50: number[];
  ema200: number[];
}

/** A buy/sell signal marker to be rendered directly on the candlestick chart canvas. */
export interface SignalMarker {
  /** Index into the candles array where this signal occurred. */
  candleIndex: number;
  /** The price at the candle's low (for BUY) or high (for SELL). */
  price: number;
  /** BUY = green arrow below candle, SELL = red arrow above candle. */
  signalType: 'BUY' | 'SELL';
  /** Name of the dominant pattern that triggered this signal. */
  patternName: string;
  /** Confidence score 0–100. */
  confidence: number;
}
