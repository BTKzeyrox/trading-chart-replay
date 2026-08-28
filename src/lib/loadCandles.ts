import type { Candle, Market, Timeframe } from './types'

const cache = new Map<string, Candle[]>()

function parseTime(raw: string): number {
  // "2025-01-02" or "2025-01-02 00:00:00" -> treat as UTC
  const iso = raw.includes(' ') ? raw.replace(' ', 'T') + 'Z' : raw + 'T00:00:00Z'
  return Date.parse(iso)
}

export async function loadCandles(market: Market, tf: Timeframe): Promise<Candle[]> {
  const key = `${market}_${tf}`
  const cached = cache.get(key)
  if (cached) return cached

  const url = `/data/${market}_${tf}_2025-01_2026-08.csv`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Impossible de charger ${url}`)
  const text = await res.text()

  const lines = text.split('\n')
  const candles: Candle[] = []
  // header: time,open,high,low,close,volume
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue
    const parts = line.split(',')
    if (parts.length < 5) continue
    const time = parseTime(parts[0])
    if (Number.isNaN(time)) continue
    candles.push({
      time,
      open: parseFloat(parts[1]),
      high: parseFloat(parts[2]),
      low: parseFloat(parts[3]),
      close: parseFloat(parts[4]),
      volume: parts[5] ? parseFloat(parts[5]) || null : null,
    })
  }
  candles.sort((a, b) => a.time - b.time)
  cache.set(key, candles)
  return candles
}
