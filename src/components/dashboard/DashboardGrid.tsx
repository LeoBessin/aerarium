import { useCallback, useState } from 'react'
import GridLayout, { Layout } from 'react-grid-layout'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth } from 'date-fns'
import { useDashboard } from '@/hooks/useDashboard'
import { useTransactions } from '@/hooks/useTransactions'
import { usePeriods } from '@/hooks/usePeriods'
import { useBudgets } from '@/hooks/useBudgets'
import { useSettings } from '@/hooks/useSettings'
import { CardWrapper } from './CardWrapper'
import { CardBuilder } from './CardBuilder'
import { Button } from '@/components/ui/button'
import type { DashboardCard } from '@/types'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const COLS = 12
const ROW_HEIGHT = 60

export function DashboardGrid() {
  const { cards, addCard, removeCard, save } = useDashboard()
  const { transactions } = useTransactions()
  const { periods } = usePeriods()
  const { budgets } = useBudgets()
  const { settings } = useSettings()
  const [builderOpen, setBuilderOpen] = useState(false)
  const [containerWidth, setContainerWidth] = useState(1200)
  const [month, setMonth] = useState<Date>(startOfMonth(new Date()))

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const obs = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width)
    })
    obs.observe(node)
  }, [])

  const layout: Layout[] = cards.map(c => ({
    i: c.id,
    x: c.layout.x,
    y: c.layout.y,
    w: c.layout.w,
    h: c.layout.h,
    minW: 2,
    minH: 2,
  }))

  function onLayoutChange(newLayout: Layout[]) {
    const updated: DashboardCard[] = cards.map(c => {
      const l = newLayout.find(x => x.i === c.id)
      if (!l) return c
      return { ...c, layout: { x: l.x, y: l.y, w: l.w, h: l.h } }
    })
    save(updated)
  }

  const isCurrentMonth =
    format(month, 'yyyy-MM') === format(startOfMonth(new Date()), 'yyyy-MM')

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <h1 className="text-sm font-semibold text-text-primary flex-1">Dashboard</h1>

        {/* Month picker */}
        <div className="flex items-center gap-1 rounded-md border border-border px-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setMonth(m => subMonths(m, 1))}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-sm text-text-primary w-24 text-center tabular-nums">
            {format(month, 'MMM yyyy')}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={isCurrentMonth}
            onClick={() => setMonth(m => addMonths(m, 1))}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        {!isCurrentMonth && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMonth(startOfMonth(new Date()))}
          >
            Today
          </Button>
        )}

        <Button size="sm" onClick={() => setBuilderOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add card
        </Button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-4" ref={containerRef}>
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-text-muted">
            <p className="text-sm">No cards yet. Add one to get started.</p>
            <Button variant="outline" onClick={() => setBuilderOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add your first card
            </Button>
          </div>
        ) : (
          <GridLayout
            className="layout"
            layout={layout}
            cols={COLS}
            rowHeight={ROW_HEIGHT}
            width={containerWidth - 32}
            onLayoutChange={onLayoutChange}
            draggableHandle=".drag-handle"
            margin={[12, 12]}
          >
            {cards.map(card => (
              <div key={card.id}>
                <CardWrapper
                  card={card}
                  transactions={transactions}
                  budgets={budgets}
                  periods={periods}
                  currency={settings.currency}
                  month={month}
                  onRemove={() => removeCard(card.id)}
                />
              </div>
            ))}
          </GridLayout>
        )}
      </div>

      <CardBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        periods={periods}
        onAdd={addCard}
      />
    </div>
  )
}
