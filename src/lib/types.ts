export type Market = 'XAUUSD' | 'EURUSD' | 'GBPUSD' | 'USDJPY' | 'BTCUSD'
export type Timeframe = 'D1' | 'H4' | 'H1' | 'M15' | 'M5'

export interface Candle {
  time: number // unix ms
  open: number
  high: number
  low: number
  close: number
  volume: number | null
}

export const MARKETS: Market[] = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD']
export const TIMEFRAMES: Timeframe[] = ['D1', 'H4', 'H1', 'M15', 'M5']

export const TF_MS: Record<Timeframe, number> = {
  D1: 86_400_000,
  H4: 14_400_000,
  H1: 3_600_000,
  M15: 900_000,
  M5: 300_000,
}
