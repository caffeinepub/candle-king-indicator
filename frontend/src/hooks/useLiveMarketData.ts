import { useQuery } from '@tanstack/react-query';
import { OHLCCandle } from '../types/trading';
import { fetchKlines, BinanceKline } from '../services/binance-api';
import { toBinanceInterval } from '../lib/timeframe-mapper';

function mapToOHLC(k: BinanceKline): OHLCCandle {
  return {
    timestamp: k.timestamp,
    open: k.open,
    high: k.high,
    low: k.low,
    close: k.close,
    volume: k.volume,
  };
}

interface UseLiveMarketDataOptions {
  symbol: string;
  timeframe: string;
  enabled: boolean;
  refetchInterval?: number;
}

export function useLiveMarketData({
  symbol,
  timeframe,
  enabled,
  refetchInterval = 10_000,
}: UseLiveMarketDataOptions) {
  const interval = toBinanceInterval(timeframe);

  return useQuery<OHLCCandle[]>({
    queryKey: ['liveMarket', symbol, interval],
    queryFn: async () => {
      const klines = await fetchKlines(symbol, interval, 100);
      return klines.map(mapToOHLC);
    },
    enabled,
    refetchInterval: enabled ? refetchInterval : false,
    staleTime: 8_000,
    retry: 2,
  });
}
