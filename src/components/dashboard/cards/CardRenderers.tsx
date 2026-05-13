import { useMemo, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { DashboardCard, Transaction, Budget, Period } from '@/types'
import { formatCurrency, categoryColor, getDaysInRange } from '@/lib/utils'
import { parseISO, isWithinInterval, format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval } from 'date-fns'

export interface CardProps {
  card: DashboardCard
  transactions: Transaction[]
  budgets: Budget[]
  periods: Period[]
  currency: string
  /** The month to scope all cards to */
  month: Date
}

const CHART_STYLE = {
  fontSize: 11,
  fill: '#8a8a9a',
}

function TooltipContent({ active, payload, label, currency }: {
  active?: boolean; payload?: { name: string; value: number }[]; label?: string; currency: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-raised border border-border rounded-md px-3 py-2 text-xs shadow-lg">
      <p className="text-text-muted mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-text-primary font-medium">
          {p.name && <span className="text-text-muted mr-1">{p.name}:</span>}
          {formatCurrency(p.value, currency)}
        </p>
      ))}
    </div>
  )
}

function filterToMonth(transactions: Transaction[], month: Date, card: DashboardCard, periods: Period[]) {
  const mStart = startOfMonth(month)
  const mEnd = endOfMonth(month)

  let list = transactions.filter(t =>
    isWithinInterval(parseISO(t.date), { start: mStart, end: mEnd })
  )

  if (card.config.direction && card.config.direction !== 'both') {
    list = list.filter(t => t.type === card.config.direction)
  }

  if (card.config.categories?.length) {
    list = list.filter(t => t.categories.some(c => card.config.categories!.includes(c)))
  }

  if (card.config.periodId) {
    const p = periods.find(x => x.id === card.config.periodId)
    if (p) {
      list = list.filter(t =>
        isWithinInterval(parseISO(t.date), { start: parseISO(p.startDate), end: parseISO(p.endDate) })
      )
    }
  }

  return list
}

// ── Total Card ────────────────────────────────────────────────────────────────
export function TotalCard({ card, transactions, currency, month }: CardProps) {
  const direction = card.config.direction ?? 'expense'

  const filtered = filterToMonth(transactions, month, card, [])
  const total = filtered
    .filter(t => direction === 'both' || t.type === direction)
    .reduce((s, t) => s + t.amount, 0)

  // Compare with previous month
  const prevFiltered = filterToMonth(transactions, subMonths(month, 1), card, [])
  const prevTotal = prevFiltered
    .filter(t => direction === 'both' || t.type === direction)
    .reduce((s, t) => s + t.amount, 0)
  const trend = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0

  return (
    <div className="flex flex-col h-full justify-between p-1">
      <div>
        <p className="text-3xl font-bold text-text-primary tabular-nums">
          {formatCurrency(total, currency)}
        </p>
        <p className="text-xs text-text-muted mt-1 capitalize">
          Total {direction === 'both' ? 'flow' : direction}
        </p>
      </div>
      {prevTotal > 0 && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend > 0 ? 'text-expense' : 'text-income'}`}>
          {trend > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {Math.abs(trend).toFixed(1)}% vs {format(subMonths(month, 1), 'MMM')}
        </div>
      )}
    </div>
  )
}

// ── Top Categories Card ───────────────────────────────────────────────────────
export function TopCategoriesCard({ card, transactions, currency, month }: CardProps) {
  const filtered = filterToMonth(transactions, month, card, [])
  const topN = card.config.topN ?? 5

  const data = useMemo(() => {
    const map: Record<string, number> = {}
    filtered.forEach(t => {
      t.categories.forEach(c => {
        map[c] = (map[c] ?? 0) + t.amount
      })
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([name, value]) => ({ name, value, color: categoryColor(name) }))
  }, [filtered, topN])

  if (!data.length) return <div className="flex items-center justify-center h-full text-text-muted text-sm">No data</div>

  if (card.chartType === 'pie') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="70%">
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip content={<TooltipContent currency={currency} />} />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#26262c" horizontal={false} />
        <XAxis type="number" tick={CHART_STYLE} tickFormatter={v => formatCurrency(v, currency)} />
        <YAxis dataKey="name" type="category" tick={CHART_STYLE} width={70} />
        <Tooltip content={<TooltipContent currency={currency} />} />
        <Bar dataKey="value" radius={[0, 3, 3, 0]}>
          {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Daily Breakdown Card ──────────────────────────────────────────────────────
// Cumulative running total per day within the selected month
export function DailyBreakdownCard({ card, transactions, currency, month }: CardProps) {
  const mStart = startOfMonth(month)
  const mEnd = endOfMonth(month)

  const data = useMemo(() => {
    let list = transactions.filter(t =>
      isWithinInterval(parseISO(t.date), { start: mStart, end: mEnd })
    )
    if (card.config.direction && card.config.direction !== 'both') {
      list = list.filter(t => t.type === card.config.direction)
    }
    if (card.config.categories?.length) {
      list = list.filter(t => t.categories.some(c => card.config.categories!.includes(c)))
    }

    // Sum per day (income positive, expense negative)
    const byDay: Record<string, number> = {}
    list.forEach(t => {
      const signed = t.type === 'income' ? t.amount : -t.amount
      byDay[t.date] = (byDay[t.date] ?? 0) + signed
    })

    // Build cumulative series
    let running = 0
    const days = eachDayOfInterval({ start: mStart, end: mEnd })
    return days.map(day => {
      const iso = format(day, 'yyyy-MM-dd')
      running += byDay[iso] ?? 0
      return { label: format(day, 'd'), value: running }
    })
  }, [transactions, card.config.direction, card.config.categories, mStart, mEnd])

  const hasData = data.some(d => d.value > 0)
  if (!hasData) return <div className="flex items-center justify-center h-full text-text-muted text-sm">No data this month</div>

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ left: 8, right: 4, top: 4, bottom: 4 }}>
        <defs>
          <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#5e6ad2" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#5e6ad2" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#26262c" vertical={false} />
        <XAxis dataKey="label" tick={CHART_STYLE} interval={4} />
        <YAxis tick={CHART_STYLE} tickFormatter={v => formatCurrency(v, currency)} width={70} />
        <Tooltip content={<TooltipContent currency={currency} />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#5e6ad2"
          strokeWidth={2}
          fill="url(#dailyGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#5e6ad2', stroke: '#0e0e10', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── Avg Daily Per Period Card ─────────────────────────────────────────────────
// Shows periods that overlap with the selected month
export function AvgDailyPerPeriodCard({ card, transactions, periods, currency, month }: CardProps) {
  const mStart = startOfMonth(month)
  const mEnd = endOfMonth(month)

  const data = useMemo(() => {
    // Only consider periods overlapping with the selected month
    const overlapping = periods.filter(p => {
      const pStart = parseISO(p.startDate)
      const pEnd = parseISO(p.endDate)
      return pStart <= mEnd && pEnd >= mStart
    })

    // Group by label (merge same-named periods)
    const grouped: Record<string, { totalAmount: number; totalDays: number; color: string }> = {}

    overlapping.forEach(p => {
      // Clamp period to the selected month
      const clampStart = parseISO(p.startDate) < mStart ? mStart : parseISO(p.startDate)
      const clampEnd = parseISO(p.endDate) > mEnd ? mEnd : parseISO(p.endDate)
      const days = getDaysInRange(
        format(clampStart, 'yyyy-MM-dd'),
        format(clampEnd, 'yyyy-MM-dd')
      )
      const total = transactions
        .filter(t =>
          (card.config.direction !== 'income' ? t.type === 'expense' : t.type === 'income') &&
          isWithinInterval(parseISO(t.date), { start: clampStart, end: clampEnd })
        )
        .reduce((s, t) => s + t.amount, 0)

      if (!grouped[p.label]) {
        grouped[p.label] = { totalAmount: 0, totalDays: 0, color: p.color }
      }
      grouped[p.label].totalAmount += total
      grouped[p.label].totalDays += days
    })

    return Object.entries(grouped)
      .map(([label, { totalAmount, totalDays, color }]) => ({
        label,
        value: totalAmount / totalDays,
        color,
      }))
      .filter(d => d.value > 0)
  }, [transactions, periods, card.config.direction, mStart, mEnd])

  if (!data.length) return <div className="flex items-center justify-center h-full text-text-muted text-sm">No periods this month</div>

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#26262c" />
        <XAxis dataKey="label" tick={CHART_STYLE} />
        <YAxis tick={CHART_STYLE} tickFormatter={v => formatCurrency(v, currency)} width={70} />
        <Tooltip content={<TooltipContent currency={currency} />} />
        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Budget vs Actual Card ─────────────────────────────────────────────────────
export function BudgetVsActualCard({ card, transactions, budgets, currency, month }: CardProps) {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)

  const data = useMemo(() => {
    return budgets.map(b => {
      const actual = transactions
        .filter(t =>
          t.type === 'expense' &&
          t.categories.includes(b.category) &&
          isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
        )
        .reduce((s, t) => s + t.amount, 0)
      return {
        label: b.category,
        Budget: b.amount,
        Actual: actual,
        color: categoryColor(b.category),
      }
    })
  }, [budgets, transactions, monthStart, monthEnd])

  if (!data.length) return <div className="flex items-center justify-center h-full text-text-muted text-sm">No budgets set</div>

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#26262c" />
        <XAxis dataKey="label" tick={CHART_STYLE} />
        <YAxis tick={CHART_STYLE} tickFormatter={v => formatCurrency(v, currency)} width={70} />
        <Tooltip content={<TooltipContent currency={currency} />} />
        <Bar dataKey="Budget" fill="#363640" radius={[3, 3, 0, 0]} />
        <Bar dataKey="Actual" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.Actual > entry.Budget ? '#e05c5c' : '#4caf7d'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Top Category per Period Card ──────────────────────────────────────────────
export function TopCategoryPerPeriodCard({ card, transactions, periods, currency, month }: CardProps) {
  const mStart = startOfMonth(month)
  const mEnd = endOfMonth(month)
  const direction = card.config.direction ?? 'expense'

  const tabs = useMemo(() => {
    const overlapping = periods.filter(p => {
      const pStart = parseISO(p.startDate)
      const pEnd = parseISO(p.endDate)
      return pStart <= mEnd && pEnd >= mStart
    })

    // Merge by label
    const grouped: Record<string, { catAmounts: Record<string, number>; days: number }> = {}
    const order: string[] = []

    overlapping.forEach(p => {
      const clampStart = parseISO(p.startDate) < mStart ? mStart : parseISO(p.startDate)
      const clampEnd = parseISO(p.endDate) > mEnd ? mEnd : parseISO(p.endDate)

      const relevant = transactions.filter(t => {
        const matchDir = direction === 'both' || t.type === direction
        return matchDir && isWithinInterval(parseISO(t.date), { start: clampStart, end: clampEnd })
      })

      const days = getDaysInRange(format(clampStart, 'yyyy-MM-dd'), format(clampEnd, 'yyyy-MM-dd'))

      if (!grouped[p.label]) {
        grouped[p.label] = { catAmounts: {}, days: 0 }
        order.push(p.label)
      }
      grouped[p.label].days += days
      relevant.forEach(t => {
        t.categories.forEach(c => {
          grouped[p.label].catAmounts[c] = (grouped[p.label].catAmounts[c] ?? 0) + t.amount
        })
      })
    })

    return order.map(label => ({
      label,
      bars: Object.entries(grouped[label].catAmounts)
        .sort((a, b) => b[1] - a[1])
        .map(([category, total]) => ({
          category,
          amount: grouped[label].days > 0 ? total / grouped[label].days : 0,
        })),
    }))
  }, [transactions, periods, direction, mStart, mEnd])

  const [activeIdx, setActiveIdx] = useState(0)
  const safeIdx = Math.min(activeIdx, tabs.length - 1)
  const active = tabs[safeIdx]

  if (!tabs.length) return (
    <div className="flex items-center justify-center h-full text-text-muted text-sm">No periods this month</div>
  )

  if (!active || !active.bars.length) return (
    <div className="flex flex-col h-full">
      <TabStrip tabs={tabs} activeIdx={safeIdx} onSelect={setActiveIdx} />
      <div className="flex-1 flex items-center justify-center text-text-muted text-sm">No transactions</div>
    </div>
  )

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { category: string; amount: number } }[] }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="bg-surface-raised border border-border rounded-md px-3 py-2 text-xs shadow-lg">
        <p className="font-medium" style={{ color: categoryColor(d.category) }}>{d.category}</p>
        <p className="text-text-primary">{formatCurrency(d.amount, currency)}<span className="text-text-muted">/day</span></p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-2">
      <TabStrip tabs={tabs} activeIdx={safeIdx} onSelect={setActiveIdx} />
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={active.bars} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#26262c" vertical={false} />
            <XAxis dataKey="category" tick={CHART_STYLE} />
            <YAxis tick={CHART_STYLE} tickFormatter={v => `${formatCurrency(v, currency)}/d`} width={72} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
              {active.bars.map((entry, i) => (
                <Cell key={i} fill={categoryColor(entry.category)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function TabStrip({ tabs, activeIdx, onSelect }: {
  tabs: { label: string }[]
  activeIdx: number
  onSelect: (i: number) => void
}) {
  return (
    <div className="flex gap-1 overflow-x-auto shrink-0 pb-0.5 scrollbar-none">
      {tabs.map((t, i) => (
        <button
          key={t.label}
          onClick={() => onSelect(i)}
          className={[
            'shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
            i === activeIdx
              ? 'bg-accent/15 text-accent'
              : 'text-text-muted hover:text-text-secondary hover:bg-surface-overlay',
          ].join(' ')}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Category Breakdown Card ───────────────────────────────────────────────────
export function CategoryBreakdownCard({ card, transactions, currency, month }: CardProps) {
  const mStart = startOfMonth(month)
  const mEnd = endOfMonth(month)
  const direction = card.config.direction ?? 'expense'

  const tabs = useMemo(() => {
    const relevant = transactions.filter(t => {
      const matchDir = direction === 'both' || t.type === direction
      return matchDir && isWithinInterval(parseISO(t.date), { start: mStart, end: mEnd })
    })

    // category → label → total
    const catMap: Record<string, Record<string, number>> = {}

    relevant.forEach(t => {
      t.categories.forEach(c => {
        if (!catMap[c]) catMap[c] = {}
        catMap[c][t.label] = (catMap[c][t.label] ?? 0) + t.amount
      })
    })

    // Sort categories by their grand total desc
    return Object.entries(catMap)
      .map(([category, labelAmounts]) => ({
        label: category,
        bars: Object.entries(labelAmounts)
          .sort((a, b) => b[1] - a[1])
          .map(([name, amount]) => ({ name, amount })),
        total: Object.values(labelAmounts).reduce((s, v) => s + v, 0),
      }))
      .sort((a, b) => b.total - a.total)
  }, [transactions, direction, mStart, mEnd])

  const [activeIdx, setActiveIdx] = useState(0)
  const safeIdx = Math.min(activeIdx, tabs.length - 1)
  const active = tabs[safeIdx]

  if (!tabs.length) return (
    <div className="flex items-center justify-center h-full text-text-muted text-sm">No transactions this month</div>
  )

  const color = categoryColor(active.label)

  const CustomTooltip = ({ active: a, payload }: { active?: boolean; payload?: { payload: { name: string; amount: number } }[] }) => {
    if (!a || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="bg-surface-raised border border-border rounded-md px-3 py-2 text-xs shadow-lg">
        <p className="text-text-muted mb-1 truncate max-w-[160px]">{d.name}</p>
        <p className="font-medium" style={{ color }}>{formatCurrency(d.amount, currency)}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-2">
      <TabStrip tabs={tabs} activeIdx={safeIdx} onSelect={setActiveIdx} />
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={active.bars} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#26262c" vertical={false} />
            <XAxis dataKey="name" tick={CHART_STYLE} />
            <YAxis tick={CHART_STYLE} tickFormatter={v => formatCurrency(v, currency)} width={72} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" radius={[3, 3, 0, 0]} fill={color} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
