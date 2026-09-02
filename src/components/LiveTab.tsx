import { useEffect, useRef, useState } from 'react'

interface SpotRow {
  symbol: string
  quote_currency: string
  unit: string
  contract_type: string
  is_stale: boolean
  price?: string
  bid?: string
  ask?: string
  computed_at?: string
}

const POLL_MS = 60_000
const ENDPOINT = 'https://api.goldprice.dev/v1/spot/XAU-USD-SPOT'

export default function LiveTab() {
  const [data, setData] = useState<SpotRow | null>(null)
  const [prevPrice, setPrevPrice] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchOnce() {
      try {
        const res = await fetch(ENDPOINT)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: SpotRow = await res.json()
        if (cancelled) return
        setData((old) => {
          if (old?.price) setPrevPrice(parseFloat(old.price))
          return json
        })
        setError(null)
      } catch (e) {
        if (!cancelled) setError(String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchOnce()
    timerRef.current = window.setInterval(fetchOnce, POLL_MS)
    return () => {
      cancelled = true
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [])

  const price = data?.price ? parseFloat(data.price) : null
  const up = price !== null && prevPrice !== null ? price >= prevPrice : null

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        color: '#c9d1d9',
        fontFamily: 'ui-monospace, monospace',
      }}
    >
      {loading && <div style={{ color: '#7d8590' }}>Chargement…</div>}
      {error && <div style={{ color: '#ef5350' }}>Erreur: {error}</div>}

      {!loading && !error && data && (
        <>
          <div style={{ fontSize: 13, color: '#7d8590' }}>XAU/USD — Spot (goldprice.dev)</div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: up === null ? '#c9d1d9' : up ? '#26a69a' : '#ef5350',
            }}
          >
            {price !== null ? `$${price.toFixed(2)}` : '—'}
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#7d8590' }}>
            <span>Bid: {data.bid ?? '—'}</span>
            <span>Ask: {data.ask ?? '—'}</span>
          </div>
          <div style={{ fontSize: 11, color: '#4d5560' }}>
            {data.computed_at ? new Date(data.computed_at).toLocaleTimeString() : ''}
            {data.is_stale ? ' · donnée figée' : ' · en direct'}
          </div>
        </>
      )}
    </div>
  )
}
