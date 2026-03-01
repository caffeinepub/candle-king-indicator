import { useQuery } from '@tanstack/react-query';
import { fetchTicker24hr, BinanceTicker } from '../services/binance-api';

interface UseTickerDataOptions {
  symbol: string;
  enabled: boolean;
  refetchInterval?: number;
}

export function useTickerData({
  symbol,
  enabled,
  refetchInterval = 1_000,
}: UseTickerDataOptions) {
  return useQuery<BinanceTicker>({
    queryKey: ['ticker24hr', symbol],
    queryFn: () => fetchTicker24hr(symbol),
    enabled,
    refetchInterval: enabled ? refetchInterval : false,
    staleTime: 500,
    retry: 2,
  });
}
