import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { SignalHistoryEntry } from '../backend';

export function useGetRecentSignalHistory(limit: bigint) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<SignalHistoryEntry[]>({
    queryKey: ['signalHistory', limit.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecentSignalHistory(limit);
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 30000,
  });
}

export function useGetSignalHistory() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<SignalHistoryEntry[]>({
    queryKey: ['signalHistory', 'all'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSignalHistory();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSaveSignalHistory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      symbol,
      timeframe,
      patternName,
      signalType,
      confidence,
    }: {
      symbol: string;
      timeframe: string;
      patternName: string;
      signalType: string;
      confidence: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveSignalHistory(symbol, timeframe, patternName, signalType, confidence);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signalHistory'] });
    },
  });
}
