import { useMemo } from 'react'

export interface SalesDay {
  date: string
  revenue: number
  orders: number
}

interface SalesChartProps {
  days: number
  data: SalesDay[]
  currency: Intl.NumberFormat
}

const W = 720
const H = 220
const PAD_X = 24
const PAD_TOP = 16
const PAD_BOTTOM = 34
const CHART_H = H - PAD_TOP - PAD_BOTTOM

const shortDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/** Fills the full date range so days without orders still render as zeroes. */
function fillRange(days: number, data: SalesDay[]): SalesDay[] {
  const byDate = new Map(data.map((d) => [d.date, d]))
  const out: SalesDay[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    out.push(byDate.get(key) ?? { date: key, revenue: 0, orders: 0 })
  }
  return out
}

export function SalesChart({ days, data, currency }: SalesChartProps) {
  const series = useMemo(() => fillRange(days, data), [days, data])
  const maxRevenue = Math.max(...series.map((d) => d.revenue), 1)
  const maxOrders = Math.max(...series.map((d) => d.orders), 1)

  const xAt = (i: number) => (series.length === 1 ? W / 2 : PAD_X + ((W - PAD_X * 2) / (series.length - 1)) * i)
  const yRevenue = (v: number) => PAD_TOP + CHART_H - (v / maxRevenue) * CHART_H
  const barW = Math.max(2, ((W - PAD_X * 2) / series.length) * 0.55)

  const dateIndexes = [0, Math.floor((series.length - 1) / 2), series.length - 1]

  const linePoints = series.map((d, i) => `${xAt(i)} ${yRevenue(d.revenue)}`)
  const linePath = `M ${linePoints.join(' L ')}`
  const areaPath = `${linePath} L ${xAt(series.length - 1)} ${PAD_TOP + CHART_H} L ${xAt(0)} ${PAD_TOP + CHART_H} Z`

  const ticks = [0, 0.5, 1].map((t) => ({ y: PAD_TOP + CHART_H - t * CHART_H, label: currency.format(maxRevenue * t) }))

  return (
    <div className="admin-chart" role="img" aria-label={`Daily revenue for the last ${days} days`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="sales-chart">
        <defs>
          <linearGradient id="sales-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => (
          <g key={tick.y}>
            <line x1={PAD_X} x2={W - PAD_X} y1={tick.y} y2={tick.y} className="chart-grid" />
            <text x={PAD_X - 6} y={tick.y + 3} textAnchor="end" className="chart-tick">{tick.label}</text>
          </g>
        ))}
        {series.map((d, i) => {
          const h = (d.orders / maxOrders) * CHART_H * 0.35
          return <rect key={d.date} x={xAt(i) - barW / 2} y={PAD_TOP + CHART_H - h} width={barW} height={h} rx="1" className="sales-orders-bar" />
        })}
        <path d={areaPath} fill="url(#sales-fill)" />
        <path d={linePath} className="chart-line" />
        {series.map((d, i) => d.revenue > 0 ? (
          <circle key={d.date} cx={xAt(i)} cy={yRevenue(d.revenue)} r="2.5" className="sales-point" />
        ) : null)}
        {dateIndexes.map((i) => (
          <text key={series[i].date} x={xAt(i)} y={H - 10} textAnchor="middle" className="chart-tick">{shortDate(series[i].date)}</text>
        ))}
      </svg>
      <div className="chart-legend">
        <span><i className="legend-line" /> Daily revenue</span>
        <span><i className="legend-fill" /> Orders per day</span>
      </div>
    </div>
  )
}
