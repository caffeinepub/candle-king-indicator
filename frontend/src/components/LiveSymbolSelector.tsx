import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export const LIVE_SYMBOLS = [
  { value: 'BTCUSDT', label: 'BTC/USDT' },
  { value: 'ETHUSDT', label: 'ETH/USDT' },
  { value: 'BNBUSDT', label: 'BNB/USDT' },
  { value: 'SOLUSDT', label: 'SOL/USDT' },
  { value: 'XRPUSDT', label: 'XRP/USDT' },
  { value: 'DOGEUSDT', label: 'DOGE/USDT' },
  { value: 'ADAUSDT', label: 'ADA/USDT' },
];

interface LiveSymbolSelectorProps {
  value: string;
  onChange: (symbol: string) => void;
}

export default function LiveSymbolSelector({ value, onChange }: LiveSymbolSelectorProps) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground font-mono mb-1 block">Symbol</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-surface-3 border-bull/40 text-foreground font-mono text-sm h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-surface-2 border-border">
          {LIVE_SYMBOLS.map((sym) => (
            <SelectItem
              key={sym.value}
              value={sym.value}
              className="font-mono text-sm text-foreground hover:bg-surface-3"
            >
              {sym.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
