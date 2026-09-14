import { useState, useEffect, useMemo, useRef } from 'react'
import { X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn, isoToday, categoryColor, formatCurrency, latestByLabel } from '@/lib/utils'
import type { Transaction } from '@/types'

const FALLBACK_CATEGORIES = [
  'Food', 'Transport', 'Housing', 'Health', 'Entertainment',
  'Utilities', 'Shopping', 'Education', 'Travel', 'Other',
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
  allTransactions: Transaction[]
  currency: string
  onSave: (data: Omit<Transaction, 'id'>) => Promise<void>
}

export function TransactionSheet({ open, onOpenChange, transaction, allTransactions, currency, onSave }: Props) {
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [date, setDate] = useState(isoToday())
  const [categories, setCategories] = useState<string[]>([])
  const [catInput, setCatInput] = useState('')
  const [saving, setSaving] = useState(false)

  // Sort suggestions by usage frequency across all transactions
  const suggestedCategories = useMemo(() => {
    const freq: Record<string, number> = {}
    allTransactions.forEach(t => t.categories.forEach(c => { freq[c] = (freq[c] ?? 0) + 1 }))
    const known = [...FALLBACK_CATEGORIES].sort((a, b) => (freq[b] ?? 0) - (freq[a] ?? 0))
    const custom = Object.keys(freq).filter(c => !FALLBACK_CATEGORIES.includes(c))
      .sort((a, b) => freq[b] - freq[a])
    return [...known, ...custom]
  }, [allTransactions])

  // Label autocomplete: newest transaction per label, filtered by current input
  const [labelFocused, setLabelFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const labelRef = useRef<HTMLDivElement>(null)
  // The type toggle has no "empty" state, so track whether the user set it by hand
  const typeTouched = useRef(false)

  const byLabel = useMemo(
    () => latestByLabel(allTransactions, t => t.date),
    [allTransactions]
  )

  const labelSuggestions = useMemo(() => {
    if (!label.trim()) return []
    const q = label.trim().toLowerCase()
    return [...byLabel.values()]
      .filter(t => {
        const l = t.label.toLowerCase()
        return l.includes(q) && l !== q
      })
      .slice(0, 8)
  }, [label, byLabel])

  useEffect(() => {
    if (transaction) {
      setLabel(transaction.label)
      setAmount(String(transaction.amount))
      setType(transaction.type)
      setDate(transaction.date)
      setCategories(transaction.categories)
    } else {
      setLabel(''); setAmount(''); setType('expense'); setDate(isoToday()); setCategories([])
    }
    setCatInput('')
    setActiveIndex(-1)
    typeTouched.current = false
  }, [transaction, open])

  /** Carry over the fields of the last transaction with this label, never clobbering user input. */
  function applyFields(t: Transaction) {
    setAmount(prev => (prev.trim() ? prev : String(t.amount)))
    setCategories(prev => (prev.length ? prev : [...t.categories]))
    if (!typeTouched.current) setType(t.type)
  }

  function pickSuggestion(t: Transaction) {
    setLabel(t.label)
    applyFields(t)
    setActiveIndex(-1)
    setLabelFocused(false)
  }

  // Typing a label that exactly matches an existing one fills the rest too.
  // Driven from onChange rather than an effect: an effect would also fire on the
  // reset pass when the sheet opens, re-applying the previous entry's fields.
  // Skipped in edit mode, where the record's own label would pull in another's.
  function handleLabelChange(value: string) {
    setLabel(value)
    setActiveIndex(-1)
    if (transaction) return
    const match = byLabel.get(value.trim().toLowerCase())
    if (match) applyFields(match)
  }

  function addCategory(cat: string) {
    const trimmed = cat.trim()
    if (trimmed && !categories.includes(trimmed)) {
      setCategories(prev => [...prev, trimmed])
    }
    setCatInput('')
  }

  function removeCategory(cat: string) {
    setCategories(prev => prev.filter(c => c !== cat))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label || !amount || !date) return
    setSaving(true)
    try {
      await onSave({ label, amount: parseFloat(amount), type, date, categories })
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-scrim-soft"
        onClick={() => onOpenChange(false)}
      />
      {/* Sheet */}
      <div className={cn(
        'fixed right-0 top-0 bottom-0 z-50 w-[420px] bg-surface border-l border-border shadow-2xl flex flex-col',
        'animate-in slide-in-from-right-full duration-200'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">
            {transaction ? 'Edit transaction' : 'New transaction'}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Type toggle */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <div className="flex rounded-md border border-border overflow-hidden">
              {(['expense', 'income'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { typeTouched.current = true; setType(t) }}
                  className={cn(
                    'flex-1 py-1.5 text-sm font-medium transition-colors capitalize',
                    type === t
                      ? t === 'income' ? 'bg-income/15 text-income' : 'bg-expense/15 text-expense'
                      : 'text-text-muted hover:text-text-secondary hover:bg-surface-overlay'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Label */}
          <div className="space-y-1.5">
            <Label htmlFor="label">Label</Label>
            <div ref={labelRef} className="relative">
              <Input
                id="label"
                placeholder="e.g. Grocery shopping"
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
                required
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
                          'flex items-center justify-between gap-3 px-3 py-2 text-sm cursor-pointer transition-colors',
                          i === activeIndex
                            ? 'bg-accent/10 text-text-primary'
                            : 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary'
                        )}
                        onClick={() => pickSuggestion(s)}
                      >
                        <span className="truncate">
                          {idx >= 0 ? (
                            <>
                              {s.label.slice(0, idx)}
                              <span className="text-accent font-medium">{s.label.slice(idx, idx + q.length)}</span>
                              {s.label.slice(idx + q.length)}
                            </>
                          ) : s.label}
                        </span>
                        <span className="shrink-0 text-xs text-text-muted tabular-nums">
                          {s.type === 'income' ? '+' : '-'}{formatCurrency(s.amount, currency)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          {/* Categories */}
          <div className="space-y-1.5">
            <Label>Categories</Label>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => removeCategory(cat)}
                    className="chip inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs font-medium transition-opacity hover:opacity-70"
                    style={{ '--chip': categoryColor(cat) } as React.CSSProperties}
                  >
                    {cat}
                    <X className="h-2.5 w-2.5" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Add category…"
                value={catInput}
                onChange={e => setCatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); addCategory(catInput) }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={() => addCategory(catInput)}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {suggestedCategories.filter(c => !categories.includes(c)).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => addCategory(cat)}
                  className="text-2xs px-1.5 py-0.5 rounded border border-border text-text-muted hover:text-text-secondary hover:border-border-strong transition-colors"
                >
                  + {cat}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit as never} disabled={saving}>
            {saving ? 'Saving…' : transaction ? 'Save changes' : 'Add transaction'}
          </Button>
        </div>
      </div>
    </>
  )
}
