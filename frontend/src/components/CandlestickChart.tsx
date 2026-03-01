import React, { useRef, useEffect, useCallback } from 'react';
import { OHLCCandle, PatternSignal, SupportResistanceZone, EMAData } from '../types/trading';

interface CandlestickChartProps {
  candles: OHLCCandle[];
  emaData: EMAData;
  patternSignals: PatternSignal[];
  srZones: SupportResistanceZone[];
  width?: number;
  height?: number;
}

interface ViewState {
  offsetX: number;
  scale: number;
}

const CANDLE_WIDTH_BASE = 12;
const CANDLE_GAP = 3;

export default function CandlestickChart({
  candles,
  emaData,
  patternSignals,
  srZones,
}: CandlestickChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<ViewState>({ offsetX: 0, scale: 1 });
  const isDragging = useRef(false);
  const lastX = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || candles.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const W = container.clientWidth;
    const H = container.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const { offsetX, scale } = viewRef.current;
    const candleW = CANDLE_WIDTH_BASE * scale;
    const gap = CANDLE_GAP * scale;
    const step = candleW + gap;

    const PAD_LEFT = 10;
    const PAD_RIGHT = 60;
    const PAD_TOP = 20;
    const PAD_BOTTOM = 30;
    const chartW = W - PAD_LEFT - PAD_RIGHT;
    const chartH = H - PAD_TOP - PAD_BOTTOM;

    // Visible range
    const visibleStart = Math.max(0, Math.floor(-offsetX / step));
    const visibleEnd = Math.min(candles.length - 1, Math.ceil((chartW - offsetX) / step));
    const visibleCandles = candles.slice(visibleStart, visibleEnd + 1);

    if (visibleCandles.length === 0) return;

    const prices = visibleCandles.flatMap(c => [c.high, c.low]);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const priceRange = maxP - minP || 1;
    const pricePad = priceRange * 0.05;
    const pMin = minP - pricePad;
    const pMax = maxP + pricePad;

    const toY = (p: number) => PAD_TOP + chartH - ((p - pMin) / (pMax - pMin)) * chartH;
    const toX = (i: number) => PAD_LEFT + offsetX + i * step + candleW / 2;

    // Background
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    const gridLines = 6;
    for (let i = 0; i <= gridLines; i++) {
      const y = PAD_TOP + (chartH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(PAD_LEFT, y);
      ctx.lineTo(W - PAD_RIGHT, y);
      ctx.stroke();
      const price = pMax - ((pMax - pMin) / gridLines) * i;
      ctx.fillStyle = 'rgba(200,180,100,0.6)';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(price.toFixed(0), W - PAD_RIGHT + 4, y + 4);
    }

    // S/R Zones
    for (const zone of srZones) {
      if (zone.level < pMin || zone.level > pMax) continue;
      const y = toY(zone.level);
      ctx.save();
      if (zone.type === 'support') {
        ctx.strokeStyle = 'rgba(80,200,120,0.5)';
        ctx.setLineDash([4, 4]);
      } else if (zone.type === 'resistance') {
        ctx.strokeStyle = 'rgba(220,80,80,0.5)';
        ctx.setLineDash([4, 4]);
      } else {
        ctx.strokeStyle = 'rgba(200,160,60,0.4)';
        ctx.setLineDash([2, 6]);
      }
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD_LEFT, y);
      ctx.lineTo(W - PAD_RIGHT, y);
      ctx.stroke();
      ctx.restore();
    }

    // Candles
    for (let i = visibleStart; i <= visibleEnd; i++) {
      const c = candles[i];
      const x = toX(i);
      const isBull = c.close >= c.open;
      const color = isBull ? '#26a69a' : '#ef5350';

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, toY(c.high));
      ctx.lineTo(x, toY(c.low));
      ctx.stroke();

      // Body
      const bodyTop = toY(Math.max(c.open, c.close));
      const bodyBot = toY(Math.min(c.open, c.close));
      const bodyH = Math.max(1, bodyBot - bodyTop);
      ctx.fillStyle = color;
      ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
    }

    // Pattern labels
    const labeledPatterns = patternSignals.filter(
      p => p.candleIndex >= visibleStart && p.candleIndex <= visibleEnd
    );
    for (const sig of labeledPatterns) {
      const c = candles[sig.candleIndex];
      const x = toX(sig.candleIndex);
      const isBuy = sig.signalType === 'BUY';
      const isSell = sig.signalType === 'SELL';

      ctx.save();
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.textAlign = 'center';

      if (isBuy) {
        const y = toY(c.low) + 14;
        ctx.fillStyle = '#26a69a';
        ctx.fillText('▲', x, y);
        ctx.fillStyle = 'rgba(38,166,154,0.9)';
        ctx.font = '8px Inter, sans-serif';
        ctx.fillText(sig.patternName.split(' ').slice(-1)[0], x, y + 10);
      } else if (isSell) {
        const y = toY(c.high) - 6;
        ctx.fillStyle = '#ef5350';
        ctx.fillText('▼', x, y);
        ctx.fillStyle = 'rgba(239,83,80,0.9)';
        ctx.font = '8px Inter, sans-serif';
        ctx.fillText(sig.patternName.split(' ').slice(-1)[0], x, y - 8);
      } else {
        const y = toY(c.high) - 6;
        ctx.fillStyle = 'rgba(200,180,100,0.8)';
        ctx.fillText('◆', x, y);
      }
      ctx.restore();
    }

    // EMA Lines
    const emaConfigs = [
      { data: emaData.ema20, color: '#4fc3f7', label: 'EMA20' },
      { data: emaData.ema50, color: '#ffb74d', label: 'EMA50' },
      { data: emaData.ema200, color: '#ce93d8', label: 'EMA200' },
    ];

    for (const { data, color, label } of emaConfigs) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      let started = false;
      for (let i = visibleStart; i <= visibleEnd; i++) {
        const val = data[i];
        if (isNaN(val) || val === undefined) continue;
        const x = toX(i);
        const y = toY(val);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Label at right edge
      const lastIdx = Math.min(visibleEnd, data.length - 1);
      if (!isNaN(data[lastIdx])) {
        ctx.fillStyle = color;
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(label, W - PAD_RIGHT + 4, toY(data[lastIdx]) + 3);
      }
    }

    // X-axis timestamps
    ctx.fillStyle = 'rgba(150,130,80,0.7)';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    const labelEvery = Math.max(1, Math.floor(10 / scale));
    for (let i = visibleStart; i <= visibleEnd; i += labelEvery) {
      const x = toX(i);
      if (x < PAD_LEFT || x > W - PAD_RIGHT) continue;
      const d = new Date(candles[i].timestamp);
      const label = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
      ctx.fillText(label, x, H - 8);
    }
  }, [candles, emaData, patternSignals, srZones]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      viewRef.current.scale = Math.max(0.3, Math.min(4, viewRef.current.scale * delta));
      draw();
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastX.current = e.clientX;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastX.current;
      viewRef.current.offsetX += dx;
      lastX.current = e.clientX;
      draw();
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draw]);

  useEffect(() => {
    const ro = new ResizeObserver(() => draw());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [draw]);

  // Reset view when candles change
  useEffect(() => {
    if (candles.length > 0) {
      const container = containerRef.current;
      if (!container) return;
      const W = container.clientWidth;
      const step = (CANDLE_WIDTH_BASE + CANDLE_GAP) * viewRef.current.scale;
      viewRef.current.offsetX = Math.max(0, W - candles.length * step - 70);
    }
  }, [candles]);

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-crosshair">
      <canvas ref={canvasRef} className="w-full h-full" />
      {candles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground font-mono text-sm">Load data to view chart</p>
        </div>
      )}
    </div>
  );
}
