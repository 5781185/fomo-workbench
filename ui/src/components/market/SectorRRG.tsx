import { useEffect, useMemo, useState } from 'react'
import { SECTOR_ETFS, fetchSectorEtfs, type EtfBar } from '../../api'
import type { Strings } from '../../i18n'
import { computeRrg, glowStrength, smoothPath, type Horizon, type RrgSector } from './rrg'

const W = 720, H = 520, PAD = 36
const QUAD = { leading: '#26a69a', weakening: '#f5b166', lagging: '#ef5350', improving: '#4f8cff' }
const GOLD = '#f5c451'
const quadrant = (x: number, y: number) => x >= 100 ? (y >= 100 ? 'leading' : 'weakening') : (y >= 100 ? 'improving' : 'lagging')

export default function SectorRRG({ s }: { s: Strings }) {
  const [bars, setBars] = useState<EtfBar[] | null>(null)
  const [err, setErr] = useState(false)
  const [h, setH] = useState<Horizon>('D')
  const [hover, setHover] = useState<RrgSector | null>(null)
  const [entered, setEntered] = useState(false)  // first paint puts bubbles on the previous point, then they glide to now
  useEffect(() => {
    const load = () => fetchSectorEtfs().then(b => { setBars(b); setErr(false) }).catch(() => setErr(true))
    load(); const id = setInterval(load, 300_000); return () => clearInterval(id)
  }, [])
  const sectors = useMemo(() => (bars ? computeRrg(bars, SECTOR_ETFS, h) : []), [bars, h])
  useEffect(() => {
    if (!sectors.length || entered) return
    const id = setTimeout(() => setEntered(true), 80); return () => clearTimeout(id)
  }, [sectors.length, entered])

  // symmetric scale around 100 so the quadrant cross stays centred; margin so bubbles don't clip
  // scale from where bubbles are now (plus the last few tail points); older tail segments may run off-plot and are clipped
  const span = Math.max(1.5, ...sectors.flatMap(sec => sec.tail.slice(-3).flatMap(p => [Math.abs(p.x - 100), Math.abs(p.y - 100)]))) * 1.3
  const sx = (x: number) => PAD + ((x - (100 - span)) / (2 * span)) * (W - 2 * PAD)
  const sy = (y: number) => H - PAD - ((y - (100 - span)) / (2 * span)) * (H - 2 * PAD)
  const radius = (v: number) => 12 * Math.sqrt(Math.min(3, Math.max(0.4, v)))

  return (
    <section className="panel flex flex-col p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-ink-2 uppercase">{s.rrg}</h2>
        <div className="flex gap-0.5 rounded-md border border-line p-0.5">
          {(['D', 'W', 'Q'] as Horizon[]).map(k => <button key={k} onClick={() => setH(k)} className={`rounded px-2 py-0.5 text-[11px] ${h === k ? 'bg-panel-2 text-ink' : 'text-ink-3 hover:text-ink-2'}`}>{k === 'D' ? s.horizonD : k === 'W' ? s.horizonW : s.horizonQ}</button>)}
        </div>
      </div>
      {err ? <p className="text-sm text-ink-3">{s.noData}</p> : !bars ? <p className="text-sm text-ink-3">…</p> : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" onMouseLeave={() => setHover(null)}>
            <defs><clipPath id="rrg-clip"><rect x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} /></clipPath>
              <filter id="rrg-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="6" /></filter>
              <radialGradient id="rrg-glass" cx="38%" cy="32%" r="72%"><stop offset="0" stopColor="#fff" stopOpacity={0.42} /><stop offset="0.55" stopColor="#fff" stopOpacity={0.12} /><stop offset="1" stopColor="#fff" stopOpacity={0.05} /></radialGradient>
              {sectors.map(sec => {
                const a = sec.tail[0], b = sec.now, c = QUAD[quadrant(b.x, b.y)]
                return <linearGradient key={sec.symbol} id={`rrg-tail-${sec.symbol}`} gradientUnits="userSpaceOnUse" x1={sx(a.x)} y1={sy(a.y)} x2={sx(b.x)} y2={sy(b.y)}><stop offset="0" stopColor={c} stopOpacity={0} /><stop offset="1" stopColor={c} stopOpacity={0.75} /></linearGradient>
              })}
            </defs>
            {/* quadrants */}
            <rect x={sx(100)} y={PAD} width={W - PAD - sx(100)} height={sy(100) - PAD} fill={QUAD.leading} opacity={0.06} />
            <rect x={sx(100)} y={sy(100)} width={W - PAD - sx(100)} height={H - PAD - sy(100)} fill={QUAD.weakening} opacity={0.06} />
            <rect x={PAD} y={sy(100)} width={sx(100) - PAD} height={H - PAD - sy(100)} fill={QUAD.lagging} opacity={0.06} />
            <rect x={PAD} y={PAD} width={sx(100) - PAD} height={sy(100) - PAD} fill={QUAD.improving} opacity={0.06} />
            <line x1={sx(100)} x2={sx(100)} y1={PAD} y2={H - PAD} stroke="#3a4356" strokeDasharray="4 3" />
            <line x1={PAD} x2={W - PAD} y1={sy(100)} y2={sy(100)} stroke="#3a4356" strokeDasharray="4 3" />
            {([['leading', W - PAD - 6, PAD + 14, 'end'], ['weakening', W - PAD - 6, H - PAD - 6, 'end'], ['lagging', PAD + 6, H - PAD - 6, 'start'], ['improving', PAD + 6, PAD + 14, 'start']] as const).map(([q, x, y, anchor]) => (
              <text key={q} x={x} y={y} textAnchor={anchor} fontSize="11" fontWeight={600} fill={QUAD[q]} fontFamily="Inter, sans-serif">{s[q].toUpperCase()}</text>
            ))}
            <text x={W / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="#5c6577" fontFamily="JetBrains Mono, monospace">{s.rsRatio} →</text>
            <text x={12} y={H / 2} textAnchor="middle" fontSize="10" fill="#5c6577" fontFamily="JetBrains Mono, monospace" transform={`rotate(-90 12 ${H / 2})`}>{s.rsMom} →</text>
            {/* tails: smooth curve fading from the oldest point to now */}
            <g clipPath="url(#rrg-clip)">
            {sectors.map(sec => {
              const dim = hover && hover.symbol !== sec.symbol
              return <path key={sec.symbol} fill="none" stroke={`url(#rrg-tail-${sec.symbol})`} strokeWidth={1.25} strokeLinecap="round" opacity={dim ? 0.15 : 1}
                d={smoothPath(sec.tail.map(p => ({ x: sx(p.x), y: sy(p.y) })))} style={{ transition: 'opacity .3s' }} />
            })}
            </g>
            {/* bubbles: frosted glass with a gold glow that strengthens with volRatio; transform transitions so they glide on open and when the horizon changes */}
            {sectors.map(sec => {
              const r = radius(sec.volRatio), g = glowStrength(sec.volRatio), dim = hover && hover.symbol !== sec.symbol
              const at = entered ? sec.now : sec.tail[sec.tail.length - 2] ?? sec.now
              return (
                <g key={sec.symbol} style={{ transform: `translate(${sx(at.x)}px, ${sy(at.y)}px)`, transition: 'transform 1.2s cubic-bezier(.22,1,.36,1), opacity .3s' }} opacity={dim ? 0.25 : 1}
                  onMouseEnter={() => setHover(sec)} className="cursor-default">
                  <circle r={r * (1.15 + 0.45 * g)} fill={GOLD} opacity={0.12 + 0.6 * g} filter="url(#rrg-glow)" style={{ transition: 'r .6s ease, opacity .6s' }} />
                  <circle r={r} fill="url(#rrg-glass)" stroke="#fff" strokeOpacity={0.55} strokeWidth={1} style={{ transition: 'r .6s ease' }} />
                  <text y={3.5} textAnchor="middle" fontSize={r >= 14 ? 10 : 8} fill="#f3f5f9" fontFamily="JetBrains Mono, monospace" fontWeight={600}>{sec.symbol}</text>
                </g>
              )
            })}
          </svg>
          {hover && (
            <div className="pointer-events-none absolute z-10 rounded border border-line bg-panel-2 px-2 py-1 text-xs text-ink"
              style={{ left: `${(sx(hover.now.x) / W) * 100}%`, top: `${(sy(hover.now.y) / H) * 100}%`, transform: 'translate(-50%, calc(-100% - 22px))' }}>
              <div className="font-semibold">{hover.name} <span className="num font-normal text-ink-3">{hover.symbol}</span> · <span style={{ color: QUAD[quadrant(hover.now.x, hover.now.y)] }}>{s[quadrant(hover.now.x, hover.now.y)]}</span></div>
              <div className="num">{s.rsRatio} {hover.now.x.toFixed(2)} · {s.rsMom} {hover.now.y.toFixed(2)} · {s.volX} {hover.volRatio.toFixed(2)}×</div>
              <div className="num text-ink-3">{hover.tail[0].date} → {hover.now.date}</div>
            </div>
          )}
        </div>
      )}
      <p className="mt-2 text-[11px] text-ink-3">{s.rrgNote}</p>
    </section>
  )
}
