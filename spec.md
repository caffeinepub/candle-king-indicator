# Specification

## Summary
**Goal:** Overlay buy/sell signal arrows and labels directly on the candlestick chart canvas so they pan and zoom in sync with price data.

**Planned changes:**
- For each candle with a BUY signal, render a green upward-pointing arrow below the candle's low wick on the chart canvas.
- For each candle with a SELL signal, render a red downward-pointing arrow above the candle's high wick on the chart canvas.
- Each arrow marker includes a small text label showing the dominant pattern name and confidence score (e.g., "Hammer 78%").
- Integrate marker rendering into the existing CandlestickChart canvas draw cycle so markers pan and zoom with the candles.
- Skip rendering markers for NEUTRAL or non-threshold signals.
- Ensure markers do not obscure price data and are visually distinct from EMA lines and support/resistance bands.

**User-visible outcome:** Users will see green up-arrows below BUY signal candles and red down-arrows above SELL signal candles, each labeled with the pattern name and confidence score, directly on the candlestick chart.
