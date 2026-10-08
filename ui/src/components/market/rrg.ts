import type { EtfBar } from '../../api'

// RRG-style approximation (JdK's exact RS-Ratio/RS-Momentum are proprietary):
//   rs       = etf / benchmark
//   rsRatio  = 100 + 100 * (rs / SMA_N(rs) - 1)          strength vs benchmark, 100 = in line
//   rsMom    = 100 + 100 * (rsRatio / SMA_M(rsRatio) - 1) momentum of that strength
// Horizons share the same daily series and differ in smoothing windows and how the tail is sampled.
export type Horizon = 'D' | 'W' | 'Q'
export const HORIZONS: Record<Horizon, { n: number; m: number; step: number; tail: number; smooth: number }> = {
  D: { n: 20, m: 10, step: 1, tail: 10, smooth: 5 },    // one point per trading day, last 10 days (rs smoothed 5d so the tail doesn't zig-zag)
  W: { n: 50, m: 10, step: 5, tail: 8, smooth: 5 },     // one point per week, last 8 weeks
  Q: { n: 120, m: 20, step: 21, tail: 6, smooth: 10 },  // one point per month, last 6 months (two quarters)
}
export type RrgPoint = { x: number; y: number; date: string }
export type RrgSector = { symbol: string; name: string; tail: RrgPoint[]; now: RrgPoint; volRatio: number }

const sma = (a: number[], n: number) => a.map((_, i) => i + 1 < n ? NaN : a.slice(i + 1 - n, i + 1).reduce((s, v) => s + v, 0) / n)

export function computeRrg(bars: EtfBar[], etfs: { symbol: string; name: string }[], h: Horizon): RrgSector[] {
  const { n, m, step, tail, smooth } = HORIZONS[h]
  const by = new Map<string, EtfBar[]>()
  for (const b of bars) by.set(b.symbol, [...(by.get(b.symbol) ?? []), b])
  const spy = (by.get('SPY') ?? []).sort((a, b) => a.date.localeCompare(b.date))
  const spyClose = new Map(spy.map(b => [b.date, b.close]))
  return etfs.flatMap(({ symbol, name }) => {
    const rows = (by.get(symbol) ?? []).filter(b => spyClose.has(b.date)).sort((a, b) => a.date.localeCompare(b.date))
    if (rows.length < n + m + step * tail) return []
    const rsRaw = rows.map(b => b.close / (spyClose.get(b.date) as number))
    const rs = sma(rsRaw, smooth).map((v, i) => (isNaN(v) ? rsRaw[i] : v))
    const ratio = rs.map((v, i) => 100 + 100 * (v / sma(rs, n)[i] - 1))
    const ratioSma = sma(ratio.map(v => (isNaN(v) ? 0 : v)), m)
    const mom = ratio.map((v, i) => 100 + 100 * (v / ratioSma[i] - 1))
    const last = rows.length - 1
    const pts: RrgPoint[] = []
    for (let k = tail - 1; k >= 0; k--) {
      const i = last - k * step
      if (i >= 0 && !isNaN(ratio[i]) && !isNaN(mom[i])) pts.push({ x: ratio[i], y: mom[i], date: rows[i].date })
    }
    // Bubble size: dollar volume of the last *completed* session ÷ its trailing 20-day average.
    // While the US session is open, today's bar is partial, so use the previous day.
    const dollar = rows.map(b => b.close * b.volume)
    const v = rows[last].date === etToday() && usSessionOpen() ? last - 1 : last
    const avg20 = dollar.slice(v - 20, v).reduce((s, x) => s + x, 0) / 20
    return [{ symbol, name, tail: pts, now: pts[pts.length - 1], volRatio: avg20 ? dollar[v] / avg20 : 1 }]
  })
}

const etParts = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' }).formatToParts(new Date())
const etToday = () => { const g = (t: string) => etParts().find(x => x.type === t)!.value; return `${g('year')}-${g('month')}-${g('day')}` }
const usSessionOpen = () => { const g = (t: string) => etParts().find(x => x.type === t)!.value; const min = +g('hour') * 60 + +g('minute'); return !['Sat', 'Sun'].includes(g('weekday')) && min >= 570 && min < 960 }

// Smooth SVG path through the points (Catmull-Rom → cubic Bézier); passes through every point.
export function smoothPath(p: { x: number; y: number }[]): string {
  if (!p.length) return ''
  let d = `M${p[0].x},${p[0].y}`
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] ?? p[i], b = p[i], c = p[i + 1], e = p[i + 2] ?? c
    d += ` C${b.x + (c.x - a.x) / 6},${b.y + (c.y - a.y) / 6} ${c.x - (e.x - b.x) / 6},${c.y - (e.y - b.y) / 6} ${c.x},${c.y}`
  }
  return d
}

// Glow strength 0..1 from volRatio: none at ≤0.6× the 20-day average, full at ≥2×.
export const glowStrength = (volRatio: number) => Math.min(1, Math.max(0, (volRatio - 0.6) / 1.4))
