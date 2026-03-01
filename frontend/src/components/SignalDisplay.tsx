import React from 'react';
import { FinalSignal } from '../types/trading';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface SignalDisplayProps {
  signal: FinalSignal | null;
  trend: string;
  onSave?: () => void;
  isSaving?: boolean;
}

export default function SignalDisplay({ signal, trend, onSave, isSaving }: SignalDisplayProps) {
  if (!signal) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
        <div className="w-16 h-16 rounded-full bg-surface-3 flex items-center justify-center">
          <Minus className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm font-mono text-center">
          Load data to generate signal
        </p>
      </div>
    );
  }

  const isBuy = signal.signalType === 'BUY';
  const isSell = signal.signalType === 'SELL';

  const signalColor = isBuy
    ? 'text-bull'
    : isSell
    ? 'text-bear'
    : 'text-muted-foreground';

  const signalBg = isBuy
    ? 'bg-bull/10 border-bull/30 glow-bull'
    : isSell
    ? 'bg-bear/10 border-bear/30 glow-bear'
    : 'bg-surface-3 border-border';

  const progressColor = isBuy ? '#26a69a' : isSell ? '#ef5350' : '#888';

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      {/* Main Signal Badge */}
      <div className={`rounded-lg border p-4 flex flex-col items-center gap-2 transition-all duration-500 animate-slide-in ${signalBg}`}>
        <div className={`flex items-center gap-2 ${signalColor}`}>
          {isBuy ? (
            <TrendingUp className="w-8 h-8" />
          ) : isSell ? (
            <TrendingDown className="w-8 h-8" />
          ) : (
            <Minus className="w-8 h-8" />
          )}
          <span className={`text-4xl font-bold font-mono tracking-wider ${signalColor}`}>
            {signal.signalType}
          </span>
        </div>
        <p className="text-xs text-muted-foreground font-mono">{signal.dominantPattern}</p>
      </div>

      {/* Confidence Meter */}
      <div className="bg-surface-2 rounded-lg p-3 border border-border">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Confidence</span>
          <span className="text-gold font-mono font-bold text-lg">{signal.confidence}%</span>
        </div>
        <div className="w-full bg-surface-3 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${signal.confidence}%`,
              backgroundColor: progressColor,
              boxShadow: `0 0 8px ${progressColor}60`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted-foreground font-mono">0</span>
          <span className="text-xs text-muted-foreground font-mono">100</span>
        </div>
      </div>

      {/* Trend */}
      <div className="bg-surface-2 rounded-lg p-3 border border-border">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Trend</span>
          <span className={`font-mono font-semibold text-sm ${
            trend === 'UP' ? 'text-bull' : trend === 'DOWN' ? 'text-bear' : 'text-gold'
          }`}>
            {trend === 'UP' ? '↑ UPTREND' : trend === 'DOWN' ? '↓ DOWNTREND' : '→ SIDEWAYS'}
          </span>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="bg-surface-2 rounded-lg p-3 border border-border">
        <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-3">Score Breakdown</p>
        <div className="space-y-2">
          {[
            { label: 'Pattern', value: signal.components.patternScore, max: 50 },
            { label: 'Trend', value: signal.components.trendScore, max: 20 },
            { label: 'S/R Zone', value: signal.components.srScore, max: 15 },
            { label: 'Volume', value: signal.components.volumeScore, max: 15 },
          ].map(({ label, value, max }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono w-16">{label}</span>
              <div className="flex-1 bg-surface-3 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gold transition-all duration-500"
                  style={{ width: `${(value / max) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gold font-mono w-10 text-right">{value}/{max}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detected Patterns */}
      {signal.components.detectedPatterns.length > 0 && (
        <div className="bg-surface-2 rounded-lg p-3 border border-border">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-2">Detected Patterns</p>
          <div className="flex flex-wrap gap-1.5">
            {signal.components.detectedPatterns.map((p, i) => (
              <span
                key={i}
                className={`text-xs font-mono px-2 py-0.5 rounded border ${
                  p.signalType === 'BUY'
                    ? 'bg-bull/10 border-bull/30 text-bull'
                    : p.signalType === 'SELL'
                    ? 'bg-bear/10 border-bear/30 text-bear'
                    : 'bg-surface-3 border-border text-muted-foreground'
                }`}
              >
                {p.patternName} ({p.confidence}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {signal.warnings.length > 0 && (
        <div className="bg-surface-2 rounded-lg p-3 border border-yellow-900/30">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
            <p className="text-xs text-yellow-500 font-mono uppercase tracking-wider">Warnings</p>
          </div>
          <ul className="space-y-1">
            {signal.warnings.map((w, i) => (
              <li key={i} className="text-xs text-yellow-400/80 font-mono">• {w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Save Button */}
      {onSave && (
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="w-full bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 font-mono text-sm"
          variant="outline"
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save Signal</>
          )}
        </Button>
      )}
    </div>
  );
}
