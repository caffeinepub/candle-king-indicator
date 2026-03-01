import React, { useRef, useEffect, useCallback } from 'react';
import { OHLCCandle } from '../types/trading';

interface VolumeChartProps {
  candles: OHLCCandle[];
  volumeSpikes: boolean[];
}

const CANDLE_WIDTH_BASE = 12;
const CANDLE_GAP = 3;

export default function VolumeChart({ candles, volumeSpikes }: VolumeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const offsetXRef = useRef(0);
  const scaleRef = useRef(1);

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

    const candleW = CANDLE_WIDTH_BASE * scaleRef.current;
    const gap = CANDLE_GAP * scaleRef.current;
    const step = candleW + gap;
    const PAD_LEFT = 10;
    const PAD_RIGHT = 60;
    const PAD_TOP = 4;
    const PAD_BOTTOM = 4;
    const chartH = H - PAD_TOP - PAD_BOTTOM;

    const visibleStart = Math.max(0, Math.floor(-offsetXRef.current / step));
    const visibleEnd = Math.min(candles.length - 1, Math.ceil((W - PAD_LEFT - PAD_RIGHT - offsetXRef.current) / step));
    const visibleCandles = candles.slice(visibleStart, visibleEnd + 1);

    if (visibleCandles.length === 0) return;

    const maxVol = Math.max(...visibleCandles.map(c => c.volume));

    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, W, H);

    for (let i = visibleStart; i <= visibleEnd; i++) {
      const c = candles[i];
      const x = PAD_LEFT + offsetXRef.current + i * step;
      const isBull = c.close >= c.open;
      const barH = (c.volume / maxVol) * chartH;
      const y = H - PAD_BOTTOM - barH;

      const isSpike = volumeSpikes[i];
      ctx.fillStyle = isBull
        ? isSpike ? 'rgba(38,166,154,0.9)' : 'rgba(38,166,154,0.5)'
        : isSpike ? 'rgba(239,83,80,0.9)' : 'rgba(239,83,80,0.5)';

      ctx.fillRect(x, y, candleW, barH);

      if (isSpike) {
        ctx.strokeStyle = 'rgba(200,160,60,0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, candleW, barH);
      }
    }

    // Volume label
    ctx.fillStyle = 'rgba(150,130,80,0.6)';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('VOL', W - PAD_RIGHT + 4, 14);
  }, [candles, volumeSpikes]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Sync with main chart via custom event
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      offsetXRef.current = e.detail.offsetX;
      scaleRef.current = e.detail.scale;
      draw();
    };
    window.addEventListener('chartViewChange', handler as EventListener);
    return () => window.removeEventListener('chartViewChange', handler as EventListener);
  }, [draw]);

  useEffect(() => {
    const ro = new ResizeObserver(() => draw());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
