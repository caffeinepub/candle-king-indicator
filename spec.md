# Specification

## Summary
**Goal:** Connect the Candle King Indicator frontend to live market data from the Binance public REST API using polling.

**Planned changes:**
- Add a "Live Mode" toggle in the DataInputPanel or header; when enabled, poll the Binance public klines endpoint (`/api/v3/klines`) every 10 seconds for the selected symbol and timeframe.
- Map Binance API OHLC responses to the existing `OHLCCandle` type and pipe the data through all existing analysis pipelines (patterns, EMA, trend, volume, S/R, signal aggregation).
- Show a pulsing green "LIVE" status indicator when Live Mode is active; fall back to manual/demo data when disabled.
- Add a symbol selector (dropdown/tabs) visible only in Live Mode with preset pairs: BTCUSDT, ETHUSDT, BNBUSDT, SOLUSDT, XRPUSDT.
- Map existing timeframe values (1m, 5m, 15m, 1H, 4H, Daily) to Binance interval parameters (1m, 5m, 15m, 1h, 4h, 1d); changing symbol or timeframe triggers an immediate fresh fetch.
- Display a real-time price ticker strip in the dashboard header (visible only in Live Mode) showing symbol name, last price, 24h change % (green/red), 24h high, and 24h low, fetched from `/api/v3/ticker/24hr` and updated every 10 seconds.
- Handle fetch errors gracefully with a toast notification, retaining the last successful data.

**User-visible outcome:** Users can enable Live Mode to see the candlestick chart and signals automatically update every 10 seconds with real Binance market data for their chosen symbol and timeframe, along with a live price ticker in the header.
