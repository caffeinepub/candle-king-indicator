import { OHLCCandle } from '../types/trading';

export const symbol = 'BTC/USDT';
export const timeframe = '1H';

// 60 realistic BTC/USDT candles with patterns embedded
export const demoBTCData: OHLCCandle[] = [
  { timestamp: 1700000000000, open: 36800, high: 37100, low: 36600, close: 36950, volume: 1200 },
  { timestamp: 1700003600000, open: 36950, high: 37200, low: 36800, close: 37100, volume: 1350 },
  { timestamp: 1700007200000, open: 37100, high: 37400, low: 36900, close: 37300, volume: 1500 },
  { timestamp: 1700010800000, open: 37300, high: 37600, low: 37100, close: 37500, volume: 1800 },
  { timestamp: 1700014400000, open: 37500, high: 37800, low: 37200, close: 37250, volume: 2100 }, // Shooting Star
  { timestamp: 1700018000000, open: 37250, high: 37400, low: 36800, close: 36900, volume: 2400 }, // Bearish Engulfing
  { timestamp: 1700021600000, open: 36900, high: 37000, low: 36400, close: 36500, volume: 1900 },
  { timestamp: 1700025200000, open: 36500, high: 36700, low: 36000, close: 36200, volume: 1700 },
  { timestamp: 1700028800000, open: 36200, high: 36400, low: 35800, close: 36100, volume: 1600 },
  { timestamp: 1700032400000, open: 36100, high: 36200, low: 35600, close: 35700, volume: 1500 },
  { timestamp: 1700036000000, open: 35700, high: 36000, low: 35400, close: 35900, volume: 2200 }, // Hammer
  { timestamp: 1700039600000, open: 35900, high: 36500, low: 35800, close: 36400, volume: 2800 }, // Bullish Engulfing
  { timestamp: 1700043200000, open: 36400, high: 36800, low: 36200, close: 36700, volume: 2100 },
  { timestamp: 1700046800000, open: 36700, high: 37000, low: 36500, close: 36900, volume: 1900 },
  { timestamp: 1700050400000, open: 36900, high: 37200, low: 36700, close: 37100, volume: 1700 },
  { timestamp: 1700054000000, open: 37100, high: 37300, low: 36900, close: 37000, volume: 1400 }, // Doji
  { timestamp: 1700057600000, open: 37000, high: 37100, low: 36800, close: 36850, volume: 1300 },
  { timestamp: 1700061200000, open: 36850, high: 37200, low: 36700, close: 37150, volume: 1600 },
  { timestamp: 1700064800000, open: 37150, high: 37400, low: 37000, close: 37350, volume: 1800 },
  { timestamp: 1700068400000, open: 37350, high: 37600, low: 37200, close: 37550, volume: 2000 },
  { timestamp: 1700072000000, open: 37550, high: 37900, low: 37400, close: 37800, volume: 2300 },
  { timestamp: 1700075600000, open: 37800, high: 38100, low: 37600, close: 38000, volume: 2500 },
  { timestamp: 1700079200000, open: 38000, high: 38300, low: 37800, close: 38200, volume: 2700 }, // Three White Soldiers end
  { timestamp: 1700082800000, open: 38200, high: 38500, low: 37900, close: 38100, volume: 1800 },
  { timestamp: 1700086400000, open: 38100, high: 38400, low: 37800, close: 37900, volume: 1600 },
  { timestamp: 1700090000000, open: 37900, high: 38200, low: 37700, close: 38000, volume: 1500 },
  { timestamp: 1700093600000, open: 38000, high: 38100, low: 37800, close: 37850, volume: 1400 }, // Inside Bar
  { timestamp: 1700097200000, open: 37850, high: 38300, low: 37700, close: 38200, volume: 2100 },
  { timestamp: 1700100800000, open: 38200, high: 38600, low: 38000, close: 38500, volume: 2400 },
  { timestamp: 1700104400000, open: 38500, high: 38900, low: 38300, close: 38800, volume: 2600 },
  { timestamp: 1700108000000, open: 38800, high: 39200, low: 38600, close: 39000, volume: 3000 },
  { timestamp: 1700111600000, open: 39000, high: 39500, low: 38800, close: 39100, volume: 2800 },
  { timestamp: 1700115200000, open: 39100, high: 39600, low: 38900, close: 39050, volume: 2500 }, // Doji near top
  { timestamp: 1700118800000, open: 39050, high: 39200, low: 38500, close: 38600, volume: 3200 }, // Bearish Engulfing
  { timestamp: 1700122400000, open: 38600, high: 38800, low: 38100, close: 38200, volume: 2800 },
  { timestamp: 1700126000000, open: 38200, high: 38400, low: 37800, close: 37900, volume: 2400 },
  { timestamp: 1700129600000, open: 37900, high: 38100, low: 37500, close: 37600, volume: 2100 },
  { timestamp: 1700133200000, open: 37600, high: 37800, low: 37200, close: 37300, volume: 1900 },
  { timestamp: 1700136800000, open: 37300, high: 37500, low: 36900, close: 37000, volume: 1700 },
  { timestamp: 1700140400000, open: 37000, high: 37200, low: 36600, close: 36700, volume: 1600 },
  { timestamp: 1700144000000, open: 36700, high: 36900, low: 36300, close: 36800, volume: 2500 }, // Hammer
  { timestamp: 1700147600000, open: 36800, high: 37400, low: 36600, close: 37300, volume: 3100 }, // Bullish Engulfing
  { timestamp: 1700151200000, open: 37300, high: 37700, low: 37100, close: 37600, volume: 2700 },
  { timestamp: 1700154800000, open: 37600, high: 38000, low: 37400, close: 37900, volume: 2400 },
  { timestamp: 1700158400000, open: 37900, high: 38300, low: 37700, close: 38200, volume: 2200 },
  { timestamp: 1700162000000, open: 38200, high: 38500, low: 38000, close: 38400, volume: 2000 },
  { timestamp: 1700165600000, open: 38400, high: 38700, low: 38200, close: 38600, volume: 1900 },
  { timestamp: 1700169200000, open: 38600, high: 38900, low: 38400, close: 38800, volume: 1800 },
  { timestamp: 1700172800000, open: 38800, high: 39100, low: 38600, close: 39000, volume: 2100 },
  { timestamp: 1700176400000, open: 39000, high: 39300, low: 38800, close: 39200, volume: 2300 },
  { timestamp: 1700180000000, open: 39200, high: 39500, low: 39000, close: 39400, volume: 2500 },
  { timestamp: 1700183600000, open: 39400, high: 39700, low: 39200, close: 39600, volume: 2700 },
  { timestamp: 1700187200000, open: 39600, high: 40000, low: 39400, close: 39800, volume: 3200 },
  { timestamp: 1700190800000, open: 39800, high: 40200, low: 39600, close: 40100, volume: 3500 },
  { timestamp: 1700194400000, open: 40100, high: 40500, low: 39900, close: 40300, volume: 3800 },
  { timestamp: 1700198000000, open: 40300, high: 40700, low: 40100, close: 40600, volume: 4000 },
  { timestamp: 1700201600000, open: 40600, high: 41000, low: 40400, close: 40800, volume: 4200 },
  { timestamp: 1700205200000, open: 40800, high: 41200, low: 40600, close: 41000, volume: 4500 },
  { timestamp: 1700208800000, open: 41000, high: 41400, low: 40800, close: 41100, volume: 4100 },
  { timestamp: 1700212400000, open: 41100, high: 41500, low: 40900, close: 41050, volume: 3800 }, // Doji near top
  { timestamp: 1700216000000, open: 41050, high: 41200, low: 40500, close: 40600, volume: 4800 }, // Shooting Star / Bearish
];
