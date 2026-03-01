import React from 'react';
import { useTickerData } from '../hooks/useTickerData';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { LIVE_SYMBOLS } from './LiveSymbolSelector';

interface LivePriceTickerProps {
  symbol: string;
  isLive: boolean;
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

function getDisplaySymbol(binanceSymbol: string): string {
  const found = LIVE_SYMBOLS.find((s) => s.value === binanceSymbol);
  return found ? found.label : binanceSymbol;
}

export default function LivePriceTicker({ symbol, isLive }: LivePriceTickerProps) {
  const { data: ticker, isLoading, isError } = useTickerData({ symbol, enabled: isLive });

  if (!isLive) return null;

  if (isLoading && !ticker) {
    return (
      <div className="flex items-center gap-4 px-4 py-1.5 bg-surface-3 border-b border-border">
        <Skeleton className="h-4 w-20 bg-surface-2" />
        <Skeleton className="h-4 w-28 bg-surface-2" />
        <Skeleton className="h-4 w-16 bg-surface-2" />
        <Skeleton className="h-4 w-24 bg-surface-2" />
      </div>
    );
  }

  if (isError || !ticker) {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 bg-surface-3 border-b border-border">
        <span className="text-xs font-mono text-bear">Failed to load ticker data</span>
      </div>
    );
  }

  const isPositive = ticker.priceChangePercent >= 0;

  return (
    <div className="flex items-center gap-5 px-4 py-1.5 bg-surface-3 border-b border-gold-dim overflow-x-auto">
      {/* Symbol */}
      <span className="text-xs font-mono font-bold text-gold shrink-0">
        {getDisplaySymbol(symbol)}
      </span>

      {/* Last Price */}
      <span className="text-sm font-mono font-bold text-foreground shrink-0 tabular-nums">
        ${formatPrice(ticker.lastPrice)}
      </span>

      {/* 24h Change */}
      <div className={`flex items-center gap-1 shrink-0 ${isPositive ? 'text-bull' : 'text-bear'}`}>
        {isPositive ? (
          <TrendingUp className="w-3.5 h-3.5" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5" />
        )}
        <span className="text-xs font-mono font-semibold tabular-nums">
          {isPositive ? '+' : ''}{ticker.priceChangePercent.toFixed(2)}%
        </span>
      </div>

      {/* Separator */}
      <span className="text-muted-foreground text-xs font-mono shrink-0">|</span>

      {/* 24h High */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-xs text-muted-foreground font-mono">H:</span>
        <span className="text-xs font-mono text-bull tabular-nums">${formatPrice(ticker.highPrice)}</span>
      </div>

      {/* 24h Low */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-xs text-muted-foreground font-mono">L:</span>
        <span className="text-xs font-mono text-bear tabular-nums">${formatPrice(ticker.lowPrice)}</span>
      </div>

      {/* 24h Volume */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-xs text-muted-foreground font-mono">Vol:</span>
        <span className="text-xs font-mono text-muted-foreground tabular-nums">
          {ticker.volume.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </span>
      </div>
    </div>
  );
}
