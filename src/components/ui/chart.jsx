import * as React from 'react'
import { Tooltip } from 'recharts'
import { cn } from '../../lib/utils'

export function ChartContainer({ className, children, config = {} }) {
  const style = Object.fromEntries(
    Object.entries(config).map(([k, v]) => [`--color-${k}`, v.color])
  )
  return (
    <div className={cn('w-full', className)} style={style}>
      {children}
    </div>
  )
}

export function ChartTooltipContent({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-brand-border bg-white px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-brand-text mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: entry.fill || entry.color }} />
          <span className="text-brand-subtext">{entry.name}:</span>
          <span className="font-semibold text-brand-text">
            {formatter ? formatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export const ChartTooltip = Tooltip
