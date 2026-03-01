import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { ThemeProvider } from 'next-themes';

import DashboardLayout from './components/DashboardLayout';
import CandlestickChart from './components/CandlestickChart';
import VolumeChart from './components/VolumeChart';
import SignalDisplay from './components/SignalDisplay';
import SignalHistoryPanel from './components/SignalHistoryPanel';
import DataInputPanel from './components/DataInputPanel';
import LivePriceTicker from './components/LivePriceTicker';
import LiveStatusIndicator from './components/LiveStatusIndicator';

import { OHLCCandle, FinalSignal, TrendDirection, EMAData, SignalMarker } from './types/trading';
import { detectAllPatterns } from './lib/candlestick-patterns';
import { getAllSupportResistanceZones } from './lib/support-resistance';
import { calculateAllEMAs, detectTrend } from './lib/trend-analysis';
import { getVolumeSpikes, hasVolumeConfirmation } from './lib/volume-analysis';
import { aggregateSignals, buildSignalMarkers } from './lib/signal-aggregator';
import { useSaveSignalHistory } from './hooks/useQueries';
import { useLiveMarketData } from './hooks/useLiveMarketData';
import { LIVE_SYMBOLS } from './components/LiveSymbolSelector';

import { Crown, Activity } from 'lucide-react';

function runAnalysis(newCandles: OHLCCandle[]) {
  const emas = calculateAllEMAs(newCandles);
  const trendDir = detectTrend(newCandles, emas.ema20, emas.ema50, emas.ema200);
  const spikes = getVolumeSpikes(newCandles);
  const lastIdx = newCandles.length - 1;
  const patterns = detectAllPatterns(newCandles, lastIdx);
  const volConfirm = hasVolumeConfirmation(newCandles, lastIdx);
  const srZ = getAllSupportResistanceZones(newCandles);
  const signal = aggregateSignals(patterns, trendDir, srZ, volConfirm, newCandles[lastIdx].close, newCandles);
  // Build signal markers for all historical candles
  const markers = buildSignalMarkers(newCandles);
  return { emas, trendDir, spikes, patterns, signal, srZ, markers };
}

export default function App() {
  const [candles, setCandles] = useState<OHLCCandle[]>([]);
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [timeframe, setTimeframe] = useState('1H');
  const [finalSignal, setFinalSignal] = useState<FinalSignal | null>(null);
  const [trend, setTrend] = useState<TrendDirection>('SIDEWAYS');
  const [emaData, setEmaData] = useState<EMAData>({ ema20: [], ema50: [], ema200: [] });
  const [volumeSpikes, setVolumeSpikes] = useState<boolean[]>([]);
  const [signalMarkers, setSignalMarkers] = useState<SignalMarker[]>([]);

  // Live mode state — enabled by default with BTCUSDT / 1H
  const [liveMode, setLiveMode] = useState(true);
  const [liveSymbol, setLiveSymbol] = useState('BTCUSDT');
  const [liveTimeframe, setLiveTimeframe] = useState('1H');

  const saveSignalMutation = useSaveSignalHistory();

  // Live market data hook — polls every 1 second
  const {
    data: liveCandles,
    isFetching: isLiveFetching,
    isError: isLiveError,
    error: liveError,
  } = useLiveMarketData({
    symbol: liveSymbol,
    timeframe: liveTimeframe,
    enabled: liveMode,
  });

  // Track previous live candles to avoid redundant re-analysis
  const prevCandlesLengthRef = useRef(0);
  const prevSymbolRef = useRef(liveSymbol);
  const prevTimeframeRef = useRef(liveTimeframe);

  useEffect(() => {
    if (!liveMode || !liveCandles || liveCandles.length === 0) return;

    const symbolChanged = prevSymbolRef.current !== liveSymbol;
    const timeframeChanged = prevTimeframeRef.current !== liveTimeframe;
    const newCandleAppended = liveCandles.length !== prevCandlesLengthRef.current;
    const needsFullAnalysis = symbolChanged || timeframeChanged || newCandleAppended;

    prevSymbolRef.current = liveSymbol;
    prevTimeframeRef.current = liveTimeframe;
    prevCandlesLengthRef.current = liveCandles.length;

    const displaySymbol =
      LIVE_SYMBOLS.find(s => s.value === liveSymbol)?.label ?? liveSymbol;

    if (needsFullAnalysis) {
      const { emas, trendDir, spikes, signal, markers } = runAnalysis(liveCandles);
      setCandles(liveCandles);
      setSymbol(displaySymbol);
      setTimeframe(liveTimeframe);
      setEmaData(emas);
      setTrend(trendDir);
      setVolumeSpikes(spikes);
      setFinalSignal(signal);
      setSignalMarkers(markers);
    } else {
      // Lightweight update — only update candles array for chart redraw
      setCandles(liveCandles);
    }
  }, [liveCandles, liveMode, liveSymbol, liveTimeframe]);

  // Show toast on live fetch error
  useEffect(() => {
    if (liveMode && isLiveError && liveError) {
      toast.error('Live data fetch failed', {
        description: (liveError as Error).message ?? 'Could not reach Binance API',
        duration: 5000,
      });
    }
  }, [isLiveError, liveError, liveMode]);

  const handleLiveModeChange = useCallback((enabled: boolean) => {
    setLiveMode(enabled);
    if (!enabled) {
      prevCandlesLengthRef.current = 0;
      prevSymbolRef.current = liveSymbol;
      prevTimeframeRef.current = liveTimeframe;
    }
  }, [liveSymbol, liveTimeframe]);

  const srZones = useMemo(() => getAllSupportResistanceZones(candles), [candles]);

  const patternSignals = useMemo(() => {
    if (candles.length === 0) return [];
    const lastIdx = candles.length - 1;
    return detectAllPatterns(candles, lastIdx);
  }, [candles]);

  const handleDataLoad = useCallback((newCandles: OHLCCandle[], sym: string, tf: string) => {
    setSymbol(sym);
    setTimeframe(tf);
    setCandles(newCandles);

    if (newCandles.length === 0) return;

    const { emas, trendDir, spikes, patterns, signal, markers } = runAnalysis(newCandles);
    setEmaData(emas);
    setTrend(trendDir);
    setVolumeSpikes(spikes);
    setFinalSignal(signal);
    setSignalMarkers(markers);

    toast.success(`Analysis complete — ${patterns.length} pattern(s) detected`, {
      description: `${sym} ${tf} | Signal: ${signal.signalType} (${signal.confidence}%)`,
      duration: 4000,
    });
  }, []);

  const handleSaveSignal = useCallback(async () => {
    if (!finalSignal) return;
    try {
      await saveSignalMutation.mutateAsync({
        symbol,
        timeframe,
        patternName: finalSignal.dominantPattern,
        signalType: finalSignal.signalType,
        confidence: BigInt(finalSignal.confidence),
      });
      toast.success('Signal saved to history!');
    } catch {
      toast.error('Failed to save signal');
    }
  }, [finalSignal, symbol, timeframe, saveSignalMutation]);

  const header = (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <img
          src="/assets/generated/candle-king-logo.dim_256x256.png"
          alt="Candle King Logo"
          className="w-10 h-10 rounded-lg object-contain"
          onError={e => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div>
          <h1 className="text-gold font-bold text-lg font-mono tracking-wide leading-none">
            CANDLE KING
          </h1>
          <p className="text-muted-foreground text-xs font-mono">Chart Analyst Indicator</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {candles.length > 0 && (
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-muted-foreground">{symbol}</span>
            <span className="text-gold border border-gold/30 px-2 py-0.5 rounded">{timeframe}</span>
            <span className="text-muted-foreground">{candles.length} candles</span>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-bull animate-pulse" />
              <span className={`font-semibold ${
                trend === 'UP' ? 'text-bull' : trend === 'DOWN' ? 'text-bear' : 'text-gold'
              }`}>
                {trend}
              </span>
            </div>
          </div>
        )}
        <LiveStatusIndicator
          isLive={liveMode}
          isError={isLiveError}
          isLoading={isLiveFetching}
        />
        <div className="flex items-center gap-1.5">
          <Crown className="w-4 h-4 text-gold" />
          <span className="text-xs text-muted-foreground font-mono hidden sm:block">v1.0</span>
        </div>
      </div>
    </div>
  );

  const ticker = (
    <LivePriceTicker symbol={liveSymbol} isLive={liveMode} />
  );

  const volumeArea = (
    <VolumeChart candles={candles} volumeSpikes={volumeSpikes} />
  );

  const signalPanel = (
    <SignalDisplay
      signal={finalSignal}
      trend={trend}
      onSave={finalSignal ? handleSaveSignal : undefined}
      isSaving={saveSignalMutation.isPending}
    />
  );

  const historyPanel = <SignalHistoryPanel />;

  const dataInput = (
    <DataInputPanel
      onDataLoad={handleDataLoad}
      liveMode={liveMode}
      onLiveModeChange={handleLiveModeChange}
      liveSymbol={liveSymbol}
      onLiveSymbolChange={setLiveSymbol}
      liveTimeframe={liveTimeframe}
      onLiveTimeframeChange={setLiveTimeframe}
      isLiveFetching={isLiveFetching}
      isLiveError={isLiveError}
    />
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <div className="dark">
        <DashboardLayout
          header={header}
          ticker={ticker}
          chartArea={
            <div className="flex flex-col h-full">
              <div className="flex-1 min-h-0">
                <CandlestickChart
                  candles={candles}
                  emaData={emaData}
                  patternSignals={patternSignals}
                  srZones={srZones}
                  signalMarkers={signalMarkers}
                  isLive={liveMode}
                  isLiveFetching={isLiveFetching}
                />
              </div>
              <div className="h-24 border-t border-border shrink-0">
                {volumeArea}
              </div>
            </div>
          }
          signalPanel={signalPanel}
          historyPanel={historyPanel}
          dataInput={dataInput}
        />
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: 'oklch(0.18 0 0)',
              border: '1px solid oklch(0.40 0.06 75)',
              color: 'oklch(0.92 0.01 90)',
              fontFamily: 'JetBrains Mono, monospace',
            },
          }}
        />
      </div>
    </ThemeProvider>
  );
}
