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
}

export interface EMAData {
  ema20: number[];
  ema50: number[];
  ema200: number[];
}
