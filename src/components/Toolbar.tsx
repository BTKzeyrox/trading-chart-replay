import { MARKETS, TIMEFRAMES, type Market, type Timeframe } from '../lib/types'

interface Props {
  market: Market
  timeframe: Timeframe
  onMarketChange: (m: Market) => void
  onTimeframeChange: (t: Timeframe) => void
  datetimeValue: string
  onDatetimeChange: (v: string) => void
  onJump: () => void
  onStepBack: () => void
  onStepForward: () => void
  onPlayPause: () => void
  playing: boolean
  onGoStart: () => void
  onGoEnd: () => void
  speed: number
  onSpeedChange: (s: number) => void
  positionLabel: string
}

const btnStyle: React.CSSProperties = {
  background: '#1c2230',
  border: '1px solid #2a3242',
  color: '#c9d1d9',
  borderRadius: 6,
  padding: '6px 10px',
  cursor: 'pointer',
  fontSize: 13,
}

const selectStyle: React.CSSProperties = { ...btnStyle, minWidth: 90 }

export default function Toolbar(props: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        padding: '10px 14px',
        background: '#11151d',
        borderBottom: '1px solid #1e2530',
      }}
    >
      <select
        style={selectStyle}
        value={props.market}
        onChange={(e) => props.onMarketChange(e.target.value as Market)}
      >
        {MARKETS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <select
        style={selectStyle}
        value={props.timeframe}
        onChange={(e) => props.onTimeframeChange(e.target.value as Timeframe)}
      >
        {TIMEFRAMES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <div style={{ width: 1, height: 22, background: '#2a3242', margin: '0 4px' }} />

      <input
        type="datetime-local"
        style={{ ...btnStyle, colorScheme: 'dark' }}
        value={props.datetimeValue}
        onChange={(e) => props.onDatetimeChange(e.target.value)}
      />
      <button style={btnStyle} onClick={props.onJump}>
        Aller à
      </button>

      <div style={{ width: 1, height: 22, background: '#2a3242', margin: '0 4px' }} />

      <button style={btnStyle} onClick={props.onGoStart} title="Début">
        |◀
      </button>
      <button style={btnStyle} onClick={props.onStepBack} title="Reculer">
        ◀
      </button>
      <button style={btnStyle} onClick={props.onPlayPause}>
        {props.playing ? '⏸ Pause' : '▶ Play'}
      </button>
      <button style={btnStyle} onClick={props.onStepForward} title="Avancer">
        ▶
      </button>
      <button style={btnStyle} onClick={props.onGoEnd} title="Fin">
        ▶|
      </button>

      <select
        style={{ ...selectStyle, minWidth: 70 }}
        value={props.speed}
        onChange={(e) => props.onSpeedChange(Number(e.target.value))}
      >
        <option value={1000}>1x</option>
        <option value={500}>2x</option>
        <option value={200}>5x</option>
        <option value={80}>10x</option>
      </select>

      <div style={{ marginLeft: 'auto', color: '#7d8590', fontSize: 12, fontFamily: 'ui-monospace, monospace' }}>
        {props.positionLabel}
      </div>
    </div>
  )
}
