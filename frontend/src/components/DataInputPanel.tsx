import React, { useState } from 'react';
import { OHLCCandle } from '../types/trading';
import { demoBTCData, symbol as demoSymbol, timeframe as demoTimeframe } from '../lib/demo-data';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Upload, Play, AlertCircle, ChevronDown, ChevronUp, Radio } from 'lucide-react';
import LiveSymbolSelector from './LiveSymbolSelector';
import LiveStatusIndicator from './LiveStatusIndicator';

interface DataInputPanelProps {
  onDataLoad: (candles: OHLCCandle[], symbol: string, timeframe: string) => void;
  liveMode: boolean;
  onLiveModeChange: (enabled: boolean) => void;
  liveSymbol: string;
  onLiveSymbolChange: (symbol: string) => void;
  liveTimeframe: string;
  onLiveTimeframeChange: (tf: string) => void;
  isLiveFetching?: boolean;
  isLiveError?: boolean;
}

const TIMEFRAMES = ['1m', '5m', '15m', '1H', '4H', 'Daily'];

function parseCSV(raw: string): { candles: OHLCCandle[]; error: string | null } {
  const lines = raw.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return { candles: [], error: 'Need at least 2 rows of data' };

  const candles: OHLCCandle[] = [];
  const startIdx = lines[0].toLowerCase().includes('timestamp') ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim());
    if (parts.length < 6) return { candles: [], error: `Row ${i + 1}: Expected 6 columns (timestamp,open,high,low,close,volume)` };

    const [ts, o, h, l, c, v] = parts.map(Number);
    if ([ts, o, h, l, c, v].some(isNaN)) {
      return { candles: [], error: `Row ${i + 1}: Non-numeric value found` };
    }
    if (h < l) return { candles: [], error: `Row ${i + 1}: High < Low` };
    if (o <= 0 || c <= 0) return { candles: [], error: `Row ${i + 1}: Open/Close must be positive` };

    candles.push({ timestamp: ts, open: o, high: h, low: l, close: c, volume: v });
  }

  return { candles, error: null };
}

export default function DataInputPanel({
  onDataLoad,
  liveMode,
  onLiveModeChange,
  liveSymbol,
  onLiveSymbolChange,
  liveTimeframe,
  onLiveTimeframeChange,
  isLiveFetching = false,
  isLiveError = false,
}: DataInputPanelProps) {
  const [csvText, setCsvText] = useState('');
  const [manualSymbol, setManualSymbol] = useState('BTC/USDT');
  const [manualTimeframe, setManualTimeframe] = useState('1H');
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLoadDemo = () => {
    setError(null);
    setManualSymbol(demoSymbol);
    setManualTimeframe(demoTimeframe);
    onDataLoad(demoBTCData, demoSymbol, demoTimeframe);
  };

  const handleParseCSV = () => {
    if (!csvText.trim()) {
      setError('Please paste CSV data first');
      return;
    }
    const { candles, error: parseError } = parseCSV(csvText);
    if (parseError) {
      setError(parseError);
      return;
    }
    setError(null);
    onDataLoad(candles, manualSymbol, manualTimeframe);
  };

  return (
    <div className="bg-surface-2 border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-3 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Upload className="w-4 h-4 text-gold" />
          <span className="text-sm font-mono font-semibold text-gold">Data Input</span>
          {/* Live mode toggle — stop propagation so clicking it doesn't collapse the panel */}
          <div
            className="flex items-center gap-2 ml-2"
            onClick={e => e.stopPropagation()}
          >
            <Radio className={`w-3.5 h-3.5 ${liveMode ? 'text-bull' : 'text-muted-foreground'}`} />
            <span className="text-xs font-mono text-muted-foreground">Live</span>
            <Switch
              checked={liveMode}
              onCheckedChange={onLiveModeChange}
              className="data-[state=checked]:bg-bull scale-90"
            />
            <LiveStatusIndicator isLive={liveMode} isError={isLiveError} isLoading={isLiveFetching} />
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-border space-y-3">
          {liveMode ? (
            /* ── LIVE MODE ── */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <LiveSymbolSelector value={liveSymbol} onChange={onLiveSymbolChange} />
                <div>
                  <Label className="text-xs text-muted-foreground font-mono mb-1 block">Timeframe</Label>
                  <Select value={liveTimeframe} onValueChange={onLiveTimeframeChange}>
                    <SelectTrigger className="bg-surface-3 border-bull/40 text-foreground font-mono text-sm h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-2 border-border">
                      {TIMEFRAMES.map(tf => (
                        <SelectItem key={tf} value={tf} className="font-mono text-sm text-foreground hover:bg-surface-3">
                          {tf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-bull/5 border border-bull/20 rounded p-2">
                <Radio className="w-3.5 h-3.5 text-bull shrink-0" />
                <span>
                  Live data from Binance — auto-refreshes every 10s. Last 100 candles loaded.
                </span>
              </div>
            </div>
          ) : (
            /* ── MANUAL MODE ── */
            <>
              {/* Symbol & Timeframe */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground font-mono mb-1 block">Symbol</Label>
                  <Input
                    value={manualSymbol}
                    onChange={e => setManualSymbol(e.target.value)}
                    placeholder="BTC/USDT"
                    className="bg-surface-3 border-border text-foreground font-mono text-sm h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground font-mono mb-1 block">Timeframe</Label>
                  <Select value={manualTimeframe} onValueChange={setManualTimeframe}>
                    <SelectTrigger className="bg-surface-3 border-border text-foreground font-mono text-sm h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-2 border-border">
                      {TIMEFRAMES.map(tf => (
                        <SelectItem key={tf} value={tf} className="font-mono text-sm text-foreground hover:bg-surface-3">
                          {tf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* CSV Input */}
              <div>
                <Label className="text-xs text-muted-foreground font-mono mb-1 block">
                  CSV Data (timestamp,open,high,low,close,volume)
                </Label>
                <Textarea
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                  placeholder="1700000000000,36800,37100,36600,36950,1200&#10;1700003600000,36950,37200,36800,37100,1350"
                  className="bg-surface-3 border-border text-foreground font-mono text-xs h-24 resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 text-bear text-xs font-mono bg-bear/10 border border-bear/30 rounded p-2">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleLoadDemo}
                  variant="outline"
                  className="flex-1 bg-gold/10 hover:bg-gold/20 text-gold border-gold/30 font-mono text-xs h-8"
                >
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  Load Demo (BTC/USDT)
                </Button>
                <Button
                  onClick={handleParseCSV}
                  className="flex-1 bg-gold hover:bg-gold-bright text-surface-1 font-mono text-xs h-8 font-semibold"
                >
                  Analyze CSV
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
