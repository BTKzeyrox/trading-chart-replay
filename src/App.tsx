import { useEffect, useRef, useState } from 'react'
import Chart from './components/Chart'
import Toolbar from './components/Toolbar'
import NavBar, { type AppTab } from './components/NavBar'
import LiveTab from './components/LiveTab'
import { loadCandles } from './lib/loadCandles'
import type { Candle, Market, Timeframe } from './lib/types'

function toLocalInputValue(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

export default function App() {
  const [tab, setTab] = useState<AppTab>('replay')
  const [market, setMarket] = useState<Market>('XAUUSD')
  const [timeframe, setTimeframe] = useState<Timeframe>('H1')
  const [candles, setCandles] = useState<Candle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [cutoffIndex, setCutoffIndex] = useState(0)
  const [panOffset, setPanOffset] = useState(0)
  const [visibleCount, setVisibleCount] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 500 ? 70 : 150
  )
  const [datetimeValue, setDatetimeValue] = useState('')
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(500)

  const playRef = useRef<number | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    loadCandles(market, timeframe)
      .then((c) => {
        setCandles(c)
        setCutoffIndex(c.length - 1)
        setPanOffset(0)
        if (c.length) setDatetimeValue(toLocalInputValue(c[c.length - 1].time))
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [market, timeframe])

  useEffect(() => {
    if (playing) {
      playRef.current = window.setInterval(() => {
        setCutoffIndex((idx) => {
          if (idx >= candles.length - 1) {
            setPlaying(false)
            return idx
          }
          return idx + 1
        })
      }, speed)
    }
    return () => {
      if (playRef.current) window.clearInterval(playRef.current)
    }
  }, [playing, speed, candles.length])

  const handleJump = () => {
    if (!datetimeValue || candles.length === 0) return
    const target = Date.parse(datetimeValue + ':00Z')
    let idx = candles.findIndex((c) => c.time >= target)
    if (idx === -1) idx = candles.length - 1
    setCutoffIndex(idx)
    setPanOffset(0)
  }

  const step = (dir: 1 | -1) => {
    setCutoffIndex((idx) => Math.min(candles.length - 1, Math.max(0, idx + dir)))
    setPanOffset(0)
  }

  const current = candles[cutoffIndex - panOffset]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        width: '100vw',
        background: '#0e1117',
        color: '#c9d1d9',
        fontFamily: 'system-ui, sans-serif',
        overflow: 'hidden',
      }}
    >
      <NavBar tab={tab} onTabChange={setTab} />

      {tab === 'replay' && (
        <>
          <Toolbar
            market={market}
            timeframe={timeframe}
            onMarketChange={setMarket}
            onTimeframeChange={setTimeframe}
            datetimeValue={datetimeValue}
            onDatetimeChange={setDatetimeValue}
            onJump={handleJump}
            onStepBack={() => step(-1)}
            onStepForward={() => step(1)}
            onPlayPause={() => setPlaying((p) => !p)}
            playing={playing}
            onGoStart={() => {
              setCutoffIndex(0)
              setPanOffset(0)
            }}
            onGoEnd={() => {
              setCutoffIndex(candles.length - 1)
              setPanOffset(0)
            }}
            speed={speed}
            onSpeedChange={setSpeed}
            positionLabel={
              current
                ? `${new Date(current.time).toISOString().slice(0, 16).replace('T', ' ')} UTC — bougie ${cutoffIndex - panOffset + 1}/${candles.length}`
                : ''
            }
          />
          <div style={{ flex: 1, minHeight: 0, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
            {loading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7d8590' }}>
                Chargement des données…
              </div>
            )}
            {error && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: DOWN_COLOR }}>
                {error}
              </div>
            )}
            {!loading && !error && candles.length > 0 && (
              <Chart
                candles={candles}
                cutoffIndex={cutoffIndex}
                visibleCount={visibleCount}
                onVisibleCountChange={setVisibleCount}
                panOffset={panOffset}
                onPanOffsetChange={setPanOffset}
              />
            )}
          </div>
        </>
      )}

      {tab === 'live' && <LiveTab />}

      {tab === 'backtest' && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7d8590' }}>
          Calendrier backtest — à venir
        </div>
      )}
    </div>
  )
}

const DOWN_COLOR = '#ef5350'
