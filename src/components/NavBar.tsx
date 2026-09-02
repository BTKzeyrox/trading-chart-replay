export type AppTab = 'replay' | 'live' | 'backtest'

interface Props {
  tab: AppTab
  onTabChange: (t: AppTab) => void
}

const tabs: { id: AppTab; label: string }[] = [
  { id: 'replay', label: 'Replay' },
  { id: 'live', label: 'Live' },
  { id: 'backtest', label: 'Backtest' },
]

const tabStyle = (active: boolean): React.CSSProperties => ({
  background: active ? '#1c2230' : 'transparent',
  border: 'none',
  borderBottom: active ? '2px solid #4f8cff' : '2px solid transparent',
  color: active ? '#e6edf3' : '#7d8590',
  padding: '10px 16px',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: active ? 600 : 400,
})

export default function NavBar({ tab, onTabChange }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: '#0e1117',
        borderBottom: '1px solid #1e2530',
        flexShrink: 0,
        padding: '0 8px',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: '#c9d1d9', padding: '0 12px 0 4px' }}>
        Chart Replay
      </div>
      {tabs.map((t) => (
        <button key={t.id} style={tabStyle(tab === t.id)} onClick={() => onTabChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  )
}
