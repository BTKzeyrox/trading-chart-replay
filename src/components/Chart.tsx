import { useEffect, useRef, useState, useCallback } from 'react'
import type { Candle } from '../lib/types'

interface Props {
  candles: Candle[]
  cutoffIndex: number // last visible candle index (replay position)
  visibleCount: number
  onVisibleCountChange: (n: number) => void
  panOffset: number // candles back from cutoff for the right edge
  onPanOffsetChange: (n: number) => void
}

const UP = '#26a69a'
const DOWN = '#ef5350'
const FLAT = '#5a6270'
const BG = '#0e1117'
const GRID = '#1e2530'
const TEXT = '#7d8590'

export default function Chart({
  candles,
  cutoffIndex,
  visibleCount,
  onVisibleCountChange,
  panOffset,
  onPanOffsetChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<{ x: number; y: number; candle: Candle } | null>(null)
  const dragState = useRef<{ startX: number; startPan: number } | null>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const dpr = window.devicePixelRatio || 1
    const w = container.clientWidth
    const h = container.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.fillStyle = BG
    ctx.fillRect(0, 0, w, h)

    const rightEdge = Math.min(cutoffIndex - panOffset, candles.length - 1)
    const maxByWidth = Math.max(20, Math.floor(w / 4))
    const effectiveVisibleCount = Math.min(visibleCount, maxByWidth, candles.length)
    const leftEdge = Math.max(0, rightEdge - effectiveVisibleCount + 1)
    const slice = candles.slice(leftEdge, rightEdge + 1)
    if (slice.length === 0) return

    const priceH = h * 0.78
    const volH = h - priceH
    let min = Infinity
    let max = -Infinity
    for (const c of slice) {
      if (c.low < min) min = c.low
      if (c.high > max) max = c.high
    }
    const pad = (max - min) * 0.08 || 1
    min -= pad
    max += pad

    let maxVol = 0
    for (const c of slice) if (c.volume && c.volume > maxVol) maxVol = c.volume

    const candleW = w / slice.length
    const bodyW = Math.max(1, candleW * 0.6)

    const yPrice = (p: number) => priceH - ((p - min) / (max - min)) * priceH

    // grid
    ctx.strokeStyle = GRID
    ctx.lineWidth = 1
    ctx.font = '10px ui-monospace, monospace'
    ctx.fillStyle = TEXT
    const gridLines = 5
    for (let i = 0; i <= gridLines; i++) {
      const y = (priceH / gridLines) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
      const price = max - ((max - min) / gridLines) * i
      ctx.fillText(price.toFixed(2), 4, y - 2)
    }

    slice.forEach((c, i) => {
      const x = i * candleW + candleW / 2
      const range = c.high - c.low || 1
      const flat = Math.abs(c.open - c.close) <= range * 0.02
      const up = c.close >= c.open
      const color = flat ? FLAT : up ? UP : DOWN
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, yPrice(c.high))
      ctx.lineTo(x, yPrice(c.low))
      ctx.stroke()
      const yO = yPrice(c.open)
      const yC = yPrice(c.close)
      const top = Math.min(yO, yC)
      const bh = Math.max(1, Math.abs(yC - yO))
      ctx.fillRect(x - bodyW / 2, top, bodyW, bh)

      if (c.volume && maxVol > 0) {
        const vh = (c.volume / maxVol) * (volH - 8)
        ctx.globalAlpha = 0.5
        ctx.fillRect(x - bodyW / 2, h - vh, bodyW, vh)
        ctx.globalAlpha = 1
      }
    })

    // cutoff marker (replay "now" line) if visible within slice
    if (rightEdge === cutoffIndex - panOffset && panOffset > 0) {
      ctx.strokeStyle = '#e5b800'
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(w - candleW / 2, 0)
      ctx.lineTo(w - candleW / 2, priceH)
      ctx.stroke()
      ctx.setLineDash([])
    }

    if (hover) {
      const idx = Math.floor(hover.x / candleW)
      const c = slice[idx]
      if (c) {
        ctx.strokeStyle = '#3a4150'
        ctx.beginPath()
        ctx.moveTo(hover.x, 0)
        ctx.lineTo(hover.x, h)
        ctx.stroke()
        const d = new Date(c.time)
        const label = `${d.toISOString().slice(0, 16).replace('T', ' ')}  O:${c.open.toFixed(2)} H:${c.high.toFixed(2)} L:${c.low.toFixed(2)} C:${c.close.toFixed(2)}`
        ctx.fillStyle = '#c9d1d9'
        ctx.font = '12px ui-monospace, monospace'
        ctx.fillText(label, 8, priceH + 14)
      }
    }
  }, [candles, cutoffIndex, visibleCount, panOffset, hover])

  useEffect(() => {
    draw()
    const ro = new ResizeObserver(draw)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [draw])

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 1 : -1
    const w = containerRef.current?.clientWidth || 800
    const maxByWidth = Math.max(20, Math.floor(w / 4))
    const next = Math.min(600, maxByWidth, Math.max(20, visibleCount + delta * 5))
    onVisibleCountChange(next)
  }

  const effectiveVisible = () => {
    const w = containerRef.current?.clientWidth || 800
    const maxByWidth = Math.max(20, Math.floor(w / 4))
    return Math.min(visibleCount, maxByWidth, candles.length || visibleCount)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    dragState.current = { startX: e.clientX, startPan: panOffset }
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, candle: candles[0] })
    if (dragState.current) {
      const dx = e.clientX - dragState.current.startX
      const w = containerRef.current?.clientWidth || 1
      const candleW = w / effectiveVisible()
      const shift = Math.round(-dx / candleW)
      const next = Math.max(0, dragState.current.startPan + shift)
      onPanOffsetChange(Math.min(next, cutoffIndex))
    }
  }
  const endDrag = () => {
    dragState.current = null
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    dragState.current = { startX: t.clientX, startPan: panOffset }
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0]
    if (!t || !dragState.current) return
    e.preventDefault()
    const dx = t.clientX - dragState.current.startX
    const w = containerRef.current?.clientWidth || 1
    const candleW = w / effectiveVisible()
    const shift = Math.round(-dx / candleW)
    const next = Math.max(0, dragState.current.startPan + shift)
    onPanOffsetChange(Math.min(next, cutoffIndex))
  }
  const handleTouchEnd = () => {
    dragState.current = null
  }

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', cursor: 'grab', touchAction: 'none' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={endDrag}
      onMouseLeave={() => {
        endDrag()
        setHover(null)
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <canvas ref={canvasRef} />
    </div>
  )
}
