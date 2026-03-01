import React, { useRef, useEffect, useCallback, useState } from 'react';
import { OHLCCandle, PatternSignal, SupportResistanceZone, EMAData, SignalMarker } from '../types/trading';

interface CandlestickChartProps {
  candles: OHLCCandle[];
  emaData: EMAData;
  patternSignals: PatternSignal[];
  srZones: SupportResistanceZone[];
  signalMarkers?: SignalMarker[];
  isLive?: boolean;
  isLiveFetching?: boolean;
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
  signalMarkers = [],
  isLive = false,
  isLiveFetching = false,
}: CandlestickChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<ViewState>({ offsetX: 0, scale: 1 });
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const prevCandlesLengthRef = useRef(0);
  const isUserPanning = useRef(false);
  const [livePulse, setLivePulse] = useState(false);

  // Pulse animation when new live data arrives
  useEffect(() => {
    if (isLive && candles.length > 0) {
      setLivePulse(true);
      const t = setTimeout(() => setLivePulse(false), 600);
      return () => clearTimeout(t);
    }
  }, [candles, isLive]);

  const anchorToRight = useCallback(() => {
    const container = containerRef.current;
    if (!container || candles.length === 0) return;
    const W = container.clientWidth;
    const PAD_RIGHT = 60;
    const step = (CANDLE_WIDTH_BASE + CANDLE_GAP) * viewRef.current.scale;
    const totalWidth = candles.length * step;
    viewRef.current.offsetX = Math.min(0, W - PAD_RIGHT - totalWidth);
  }, [candles]);

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
      const isLastCandle = i === candles.length - 1;

      let color = isBull ? '#26a69a' : '#ef5350';
      if (isLive && isLastCandle) {
        color = isBull ? '#2dd4bf' : '#f87171';
      }

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = isLive && isLastCandle ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(x, toY(c.high));
      ctx.lineTo(x, toY(c.low));
      ctx.stroke();

      // Body
      const bodyTop = toY(Math.max(c.open, c.close));
      const bodyBot = toY(Math.min(c.open, c.close));
      const bodyH = Math.max(1, bodyBot - bodyTop);

      if (isLive && isLastCandle) {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.fillStyle = color;
        ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
        ctx.restore();
      } else {
        ctx.fillStyle = color;
        ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
      }
    }

    // ── Signal Markers (BUY/SELL arrows on chart) ────────────────────────────
    const visibleMarkers = signalMarkers.filter(
      m => m.candleIndex >= visibleStart && m.candleIndex <= visibleEnd
    );

    for (const marker of visibleMarkers) {
      const c = candles[marker.candleIndex];
      if (!c) continue;
      const x = toX(marker.candleIndex);
      const isBuy = marker.signalType === 'BUY';

      // Short label: last word of pattern name + confidence
      const shortName = marker.patternName.split(' ').slice(-1)[0];
      const labelText = `${shortName} ${marker.confidence}%`;

      ctx.save();

      if (isBuy) {
        // Position: below the candle low wick
        const arrowY = toY(c.low) + 8;
        const labelY = arrowY + 18;

        // Arrow glow
        ctx.shadowColor = '#00e676';
        ctx.shadowBlur = 8;

        // Draw upward triangle arrow
        const arrowSize = Math.max(6, 7 * scale);
        ctx.fillStyle = '#00e676';
        ctx.beginPath();
        ctx.moveTo(x, arrowY - arrowSize);          // tip (pointing up)
        ctx.lineTo(x - arrowSize * 0.7, arrowY);    // bottom-left
        ctx.lineTo(x + arrowSize * 0.7, arrowY);    // bottom-right
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;

        // Label background
        ctx.font = `bold ${Math.max(8, 8 * scale)}px JetBrains Mono, monospace`;
        const textW = ctx.measureText(labelText).width;
        const bgPad = 3;
        ctx.fillStyle = 'rgba(0,20,10,0.82)';
        ctx.beginPath();
        ctx.roundRect(
          x - textW / 2 - bgPad,
          labelY - 9,
          textW + bgPad * 2,
          12,
          2
        );
        ctx.fill();

        // Label text
        ctx.fillStyle = '#00e676';
        ctx.textAlign = 'center';
        ctx.fillText(labelText, x, labelY);

      } else {
        // SELL — position above the candle high wick
        const arrowY = toY(c.high) - 8;
        const labelY = arrowY - 12;

        // Arrow glow
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 8;

        // Draw downward triangle arrow
        const arrowSize = Math.max(6, 7 * scale);
        ctx.fillStyle = '#ff1744';
        ctx.beginPath();
        ctx.moveTo(x, arrowY + arrowSize);          // tip (pointing down)
        ctx.lineTo(x - arrowSize * 0.7, arrowY);    // top-left
        ctx.lineTo(x + arrowSize * 0.7, arrowY);    // top-right
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;

        // Label background
        ctx.font = `bold ${Math.max(8, 8 * scale)}px JetBrains Mono, monospace`;
        const textW = ctx.measureText(labelText).width;
        const bgPad = 3;
        ctx.fillStyle = 'rgba(20,0,0,0.82)';
        ctx.beginPath();
        ctx.roundRect(
          x - textW / 2 - bgPad,
          labelY - 9,
          textW + bgPad * 2,
          12,
          2
        );
        ctx.fill();

        // Label text
        ctx.fillStyle = '#ff1744';
        ctx.textAlign = 'center';
        ctx.fillText(labelText, x, labelY);
      }

      ctx.restore();
    }

    // Pattern labels (small per-candle pattern name labels — kept for detail)
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

    // Live current price line
    if (isLive && candles.length > 0) {
      const lastCandle = candles[candles.length - 1];
      const lastClose = lastCandle.close;
      if (lastClose >= pMin && lastClose <= pMax) {
        const y = toY(lastClose);
        ctx.save();
        ctx.strokeStyle = 'rgba(45,212,191,0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(PAD_LEFT, y);
        ctx.lineTo(W - PAD_RIGHT, y);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = '#2dd4bf';
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(lastClose.toFixed(0), W - PAD_RIGHT + 4, y + 4);
        ctx.restore();
      }
    }

    // LIVE/SYNCING badge overlay
    if (isLive) {
      ctx.save();
      const badgeX = W - PAD_RIGHT - 90;
      const badgeY = PAD_TOP + 6;
      const badgeW = 80;
      const badgeH = 18;

      ctx.fillStyle = isLiveFetching
        ? 'rgba(200,160,60,0.15)'
        : 'rgba(45,212,191,0.12)';
      ctx.strokeStyle = isLiveFetching
        ? 'rgba(200,160,60,0.5)'
        : 'rgba(45,212,191,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isLiveFetching ? '#c8a03c' : '#2dd4bf';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        isLiveFetching ? '⟳ SYNCING' : '● LIVE',
        badgeX + badgeW / 2,
        badgeY + 12
      );
      ctx.restore();
    }
  }, [candles, emaData, patternSignals, srZones, signalMarkers, isLive, isLiveFetching]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Auto-anchor to right edge when new live candles arrive (unless user is panning)
  useEffect(() => {
    if (!isLive || candles.length === 0) return;
    if (!isUserPanning.current) {
      anchorToRight();
      draw();
    }
    prevCandlesLengthRef.current = candles.length;
  }, [candles, isLive, anchorToRight, draw]);

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
      isUserPanning.current = true;
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
      const container = containerRef.current;
      if (container && candles.length > 0) {
        const W = container.clientWidth;
        const PAD_RIGHT = 60;
        const step = (CANDLE_WIDTH_BASE + CANDLE_GAP) * viewRef.current.scale;
        const totalWidth = candles.length * step;
        const rightEdgeOffset = Math.min(0, W - PAD_RIGHT - totalWidth);
        if (viewRef.current.offsetX >= rightEdgeOffset - step * 2) {
          isUserPanning.current = false;
        }
      }
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
  }, [draw, candles]);

  useEffect(() => {
    const ro = new ResizeObserver(() => draw());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [draw]);

  // Reset view when candles change (initial load or symbol change)
  useEffect(() => {
    if (candles.length > 0 && prevCandlesLengthRef.current === 0) {
      isUserPanning.current = false;
      anchorToRight();
      prevCandlesLengthRef.current = candles.length;
    }
  }, [candles, anchorToRight]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0d0d0d] rounded-lg overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />
      {livePulse && (
        <div className="absolute inset-0 pointer-events-none rounded-lg border border-bull/30 animate-pulse" />
      )}
      {candles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gold/40 text-4xl mb-3">📊</div>
            <p className="text-muted-foreground font-mono text-sm">No chart data</p>
            <p className="text-muted-foreground/60 font-mono text-xs mt-1">Enable live mode or load data</p>
          </div>
        </div>
      )}
    </div>
  );
}
