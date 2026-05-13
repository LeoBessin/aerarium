import { useState, useMemo } from 'react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, parseISO,
  isWithinInterval, eachDayOfInterval
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { usePeriods } from '@/hooks/usePeriods'
import { Button } from '@/components/ui/button'
import { PeriodModal } from './PeriodModal'
import { cn } from '@/lib/utils'
import type { Period } from '@/types'

export function CalendarView() {
  const { periods, create, update, remove } = usePeriods()
  const [current, setCurrent] = useState(new Date())
  const [selected, setSelected] = useState<Date | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null)
  const [dragStart, setDragStart] = useState<Date | null>(null)
  const [dragEnd, setDragEnd] = useState<Date | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  // Periods that overlap with visible range
  const visiblePeriods = useMemo(() =>
    periods.filter(p => {
      const start = parseISO(p.startDate)
      const end = parseISO(p.endDate)
      return start <= calEnd && end >= calStart
    }),
    [periods, calStart, calEnd]
  )

  function getPeriodsForDay(day: Date) {
    return visiblePeriods.filter(p => {
      const start = parseISO(p.startDate)
      const end = parseISO(p.endDate)
      return isWithinInterval(day, { start, end })
    })
  }

  function handleDayMouseDown(day: Date) {
    setDragStart(day)
    setDragEnd(day)
    setIsDragging(true)
  }

  function handleDayMouseEnter(day: Date) {
    if (isDragging) setDragEnd(day)
  }

  function handleDayMouseUp(day: Date) {
    setIsDragging(false)
    if (dragStart) {
      const start = dragStart < day ? dragStart : day
      const end = dragStart < day ? day : dragStart
      setEditingPeriod(null)
      setDragStart(start)
      setDragEnd(end)
      setModalOpen(true)
    }
  }

  function openEdit(p: Period, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingPeriod(p)
    setModalOpen(true)
  }

  function inDragRange(day: Date) {
    if (!isDragging || !dragStart || !dragEnd) return false
    const s = dragStart < dragEnd ? dragStart : dragEnd
    const e = dragStart < dragEnd ? dragEnd : dragStart
    return isWithinInterval(day, { start: s, end: e })
  }

  return (
    <div className="flex flex-col h-full select-none" onMouseLeave={() => setIsDragging(false)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-text-primary flex-1">
          {format(current, 'MMMM yyyy')}
        </h2>
        <Button variant="ghost" size="icon" onClick={() => setCurrent(d => subMonths(d, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setCurrent(new Date())}>
          <span className="text-xs">Today</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setCurrent(d => addMonths(d, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={() => { setEditingPeriod(null); setDragStart(null); setDragEnd(null); setModalOpen(true) }}>
          <Plus className="h-3.5 w-3.5" />
          New period
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="py-2 text-center text-xs font-medium text-text-muted">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div
        className="flex-1 grid grid-cols-7"
        onMouseUp={() => setIsDragging(false)}
      >
        {days.map((day, idx) => {
          const dayPeriods = getPeriodsForDay(day)
          const isToday = isSameDay(day, new Date())
          const isCurrentMonth = isSameMonth(day, current)
          const inDrag = inDragRange(day)

          return (
            <div
              key={idx}
              className={cn(
                'min-h-[100px] p-1.5 border-b border-r border-border/50 cursor-pointer relative',
                !isCurrentMonth && 'opacity-40',
                inDrag && 'bg-accent/5',
                'hover:bg-surface-overlay/50 transition-colors'
              )}
              onMouseDown={() => handleDayMouseDown(day)}
              onMouseEnter={() => handleDayMouseEnter(day)}
              onMouseUp={() => handleDayMouseUp(day)}
            >
              <span className={cn(
                'text-xs font-medium inline-flex h-5 w-5 items-center justify-center rounded-full',
                isToday
                  ? 'bg-accent text-white'
                  : 'text-text-secondary'
              )}>
                {format(day, 'd')}
              </span>

              {/* Period bands */}
              <div className="mt-1 space-y-0.5">
                {dayPeriods.map(p => {
                  const start = parseISO(p.startDate)
                  const end = parseISO(p.endDate)
                  const isStart = isSameDay(day, start)
                  const isEnd = isSameDay(day, end)
                  return (
                    <div
                      key={p.id}
                      onClick={(e) => openEdit(p, e)}
                      className={cn(
                        'h-5 flex items-center px-1.5 text-2xs font-medium truncate cursor-pointer hover:brightness-110 transition-all',
                        isStart && 'rounded-l-sm',
                        isEnd && 'rounded-r-sm',
                      )}
                      style={{
                        backgroundColor: `${p.color}25`,
                        color: p.color,
                        borderLeft: isStart ? `2px solid ${p.color}` : undefined,
                        borderTop: `1px solid ${p.color}30`,
                        borderBottom: `1px solid ${p.color}30`,
                        borderRight: isEnd ? `1px solid ${p.color}30` : undefined,
                        marginLeft: isStart ? 0 : -6,
                        marginRight: isEnd ? 0 : -6,
                        paddingLeft: isStart ? 6 : 4,
                      }}
                    >
                      {isStart && p.label}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Periods legend */}
      {periods.length > 0 && (
        <div className="px-6 py-3 border-t border-border flex flex-wrap gap-3">
          {periods.map(p => (
            <button
              key={p.id}
              onClick={() => { setEditingPeriod(p); setModalOpen(true) }}
              className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
              {p.label}
            </button>
          ))}
        </div>
      )}

      <PeriodModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        period={editingPeriod}
        allPeriods={periods}
        defaultStart={dragStart ? format(dragStart, 'yyyy-MM-dd') : undefined}
        defaultEnd={dragEnd ? format(dragEnd, 'yyyy-MM-dd') : undefined}
        onSave={async (data) => {
          if (editingPeriod) await update(editingPeriod.id, data)
          else await create(data)
          setModalOpen(false)
        }}
        onDelete={editingPeriod ? async () => {
          await remove(editingPeriod.id)
          setModalOpen(false)
        } : undefined}
      />
    </div>
  )
}
