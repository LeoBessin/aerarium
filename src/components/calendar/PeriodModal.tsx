import { useState, useEffect, useMemo, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn, isoToday, latestByLabel } from '@/lib/utils'
import type { Period } from '@/types'

const PRESET_COLORS = [
  '#5e6ad2', '#4caf7d', '#e05c5c', '#f5a623', '#a78bfa',
  '#38bdf8', '#fb923c', '#34d399', '#60a5fa', '#f472b6',
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  period: Period | null
  allPeriods: Period[]
  defaultStart?: string
  defaultEnd?: string
  onSave: (data: Omit<Period, 'id'>) => Promise<void>
  onDelete?: () => Promise<void>
}

export function PeriodModal({ open, onOpenChange, period, allPeriods, defaultStart, defaultEnd, onSave, onDelete }: Props) {
  const [label, setLabel] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [startDate, setStartDate] = useState(isoToday())
  const [endDate, setEndDate] = useState(isoToday())
  const [saving, setSaving] = useState(false)

  // Autocomplete state
  const [labelFocused, setLabelFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  // The color always has a value, so track whether the user set it by hand
  const colorTouched = useRef(false)

  // "The last period with this name" = the one with the latest start date
  const byLabel = useMemo(
    () => latestByLabel(allPeriods, p => p.startDate),
    [allPeriods]
  )

  const labelSuggestions = useMemo(() => {
    if (!label.trim()) return []
    const q = label.trim().toLowerCase()
    return [...byLabel.values()]
      .filter(p => {
        const l = p.label.toLowerCase()
        return l.includes(q) && l !== q
      })
      .slice(0, 8)
  }, [label, byLabel])

  useEffect(() => {
    if (period) {
      setLabel(period.label)
      setColor(period.color)
      setStartDate(period.startDate)
      setEndDate(period.endDate)
    } else {
      setLabel('')
      setColor(PRESET_COLORS[0])
      setStartDate(defaultStart ?? isoToday())
      setEndDate(defaultEnd ?? isoToday())
    }
    setActiveIndex(-1)
    colorTouched.current = false
  }, [period, defaultStart, defaultEnd, open])

  /** Carry over the color of the last period with this name, unless the user picked one. */
  function applyColor(p: Period) {
    if (!colorTouched.current) setColor(p.color)
  }

  function pickSuggestion(p: Period) {
    setLabel(p.label)
    applyColor(p)
    setLabelFocused(false)
    setActiveIndex(-1)
  }

  function pickColor(c: string) {
    colorTouched.current = true
    setColor(c)
  }

  // Typing a name that exactly matches an existing period picks up its color too.
  // Driven from onChange rather than an effect: an effect would also fire on the
  // reset pass when the modal opens, re-applying the previous period's color.
  // Skipped in edit mode, where the period's own label would pull in another's.
  function handleLabelChange(value: string) {
    setLabel(value)
    setActiveIndex(-1)
    if (period) return
    const match = byLabel.get(value.trim().toLowerCase())
    if (match) applyColor(match)
  }

  async function handleSave() {
    if (!label) return
    setSaving(true)
    try {
      await onSave({ label, color, startDate, endDate })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{period ? 'Edit period' : 'New period'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="period-label">Label</Label>
            <div className="relative">
              <Input
                id="period-label"
                placeholder="e.g. Summer vacation"
                value={label}
                onChange={e => handleLabelChange(e.target.value)}
                onFocus={() => setLabelFocused(true)}
                onBlur={() => setLabelFocused(false)}
                onKeyDown={e => {
                  if (!labelSuggestions.length) return
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setActiveIndex(i => Math.min(i + 1, labelSuggestions.length - 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setActiveIndex(i => Math.max(i - 1, -1))
                  } else if (e.key === 'Enter' && activeIndex >= 0) {
                    e.preventDefault()
                    pickSuggestion(labelSuggestions[activeIndex])
                  } else if (e.key === 'Escape') {
                    setLabelFocused(false)
                  }
                }}
                autoFocus
                autoComplete="off"
              />
              {/* preventDefault on mousedown keeps focus on the input, so onBlur can hide
                  the list immediately instead of racing a timer against the click */}
              {labelFocused && labelSuggestions.length > 0 && (
                <ul
                  className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-lg overflow-hidden"
                  onMouseDown={e => e.preventDefault()}
                >
                  {labelSuggestions.map((s, i) => {
                    const q = label.trim().toLowerCase()
                    const idx = s.label.toLowerCase().indexOf(q)
                    return (
                      <li
                        key={s.id}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors',
                          i === activeIndex
                            ? 'bg-accent/10 text-text-primary'
                            : 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary'
                        )}
                        onClick={() => pickSuggestion(s)}
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="truncate">
                          {idx >= 0 ? (
                            <>
                              {s.label.slice(0, idx)}
                              <span className="text-accent font-medium">{s.label.slice(idx, idx + q.length)}</span>
                              {s.label.slice(idx + q.length)}
                            </>
                          ) : s.label}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => pickColor(c)}
                  className="h-6 w-6 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: 2,
                  }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={e => pickColor(e.target.value)}
                className="h-6 w-6 rounded-full cursor-pointer border-0 bg-transparent"
                title="Custom color"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start">Start</Label>
              <Input
                id="start"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end">End</Label>
              <Input
                id="end"
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Preview */}
          <div
            className="chip rounded-md px-3 py-2 text-sm font-medium"
            style={{ '--chip': color } as React.CSSProperties}
          >
            {label || 'Period preview'}
          </div>
        </div>

        <DialogFooter className="flex items-center">
          {onDelete && (
            <Button variant="danger" size="sm" onClick={onDelete} className="mr-auto">
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !label}>
            {saving ? 'Saving…' : period ? 'Save changes' : 'Create period'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
