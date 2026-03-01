import React from 'react';
import { useGetRecentSignalHistory } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, TrendingUp, TrendingDown, Minus } from 'lucide-react';

function formatTime(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const d = new Date(ms);
  return d.toLocaleString('en-IN', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function SignalHistoryPanel() {
  const { data: history, isLoading } = useGetRecentSignalHistory(50n);

  return (
    <div className="bg-surface-2 border border-border rounded-lg overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <History className="w-4 h-4 text-gold" />
        <span className="text-sm font-mono font-semibold text-gold">Signal History</span>
        {history && (
          <span className="ml-auto text-xs text-muted-foreground font-mono">{history.length} records</span>
        )}
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full bg-surface-3" />
            ))}
          </div>
        ) : !history || history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <History className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground font-mono">No signals saved yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {[...history].reverse().map((entry, i) => {
              const isBuy = entry.signalType === 'BUY';
              const isSell = entry.signalType === 'SELL';
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-3 transition-colors">
                  {/* Signal Icon */}
                  <div className={`flex-shrink-0 ${isBuy ? 'text-bull' : isSell ? 'text-bear' : 'text-muted-foreground'}`}>
                    {isBuy ? <TrendingUp className="w-4 h-4" /> : isSell ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                  </div>

                  {/* Symbol & Pattern */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-foreground">{entry.symbol}</span>
                      <span className="text-xs text-muted-foreground font-mono">{entry.timeframe}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono truncate">{entry.patternName}</p>
                  </div>

                  {/* Signal Badge */}
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border flex-shrink-0 ${
                    isBuy
                      ? 'bg-bull/10 border-bull/30 text-bull'
                      : isSell
                      ? 'bg-bear/10 border-bear/30 text-bear'
                      : 'bg-surface-3 border-border text-muted-foreground'
                  }`}>
                    {entry.signalType}
                  </span>

                  {/* Confidence */}
                  <span className="text-xs font-mono text-gold flex-shrink-0 w-10 text-right">
                    {entry.confidence.toString()}%
                  </span>

                  {/* Time */}
                  <span className="text-xs font-mono text-muted-foreground flex-shrink-0 hidden lg:block">
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
