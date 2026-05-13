import { useState, useMemo } from 'react'
import { Plus, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { useSettings } from '@/hooks/useSettings'
import { TransactionSheet } from './TransactionSheet'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate, categoryColor } from '@/lib/utils'
import type { Transaction } from '@/types'

type SortKey = 'date' | 'label' | 'amount' | 'type'
type SortDir = 'asc' | 'desc'

export function TransactionTable() {
  const { transactions, loading, create, update, remove, bulkRemove } = useTransactions()
  const { settings } = useSettings()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const filtered = useMemo(() => {
    let list = [...transactions]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.label.toLowerCase().includes(q) ||
        t.categories.some(c => c.toLowerCase().includes(q))
      )
    }
    if (filterType !== 'all') list = list.filter(t => t.type === filterType)
    list.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'date') cmp = a.date.localeCompare(b.date)
      else if (sortKey === 'label') cmp = a.label.localeCompare(b.label)
      else if (sortKey === 'amount') cmp = a.amount - b.amount
      else if (sortKey === 'type') cmp = a.type.localeCompare(b.type)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [transactions, search, filterType, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(t => t.id)))
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleBulkDelete() {
    await bulkRemove(Array.from(selected))
    setSelected(new Set())
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 text-text-disabled" />
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 text-accent" />
      : <ArrowDown className="h-3 w-3 text-accent" />
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-text-muted text-sm">Loading…</div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
          <Input
            placeholder="Search transactions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
          {(['all', 'income', 'expense'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors capitalize ${
                filterType === t
                  ? 'bg-surface-overlay text-text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {selected.size > 0 && (
          <Button variant="danger" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="h-3.5 w-3.5" />
            Delete {selected.size}
          </Button>
        )}

        <Button
          size="sm"
          onClick={() => { setEditing(null); setSheetOpen(true) }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-surface z-10">
            <tr className="border-b border-border">
              <th className="w-10 px-4 py-2.5 text-left">
                <Checkbox
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onCheckedChange={toggleAll}
                />
              </th>
              {([
                { key: 'label', label: 'Label' },
                { key: 'amount', label: 'Amount' },
                { key: 'type', label: 'Type' },
                { key: 'date', label: 'Date' },
              ] as { key: SortKey; label: string }[]).map(col => (
                <th
                  key={col.key}
                  className="px-4 py-2.5 text-left text-xs font-medium text-text-muted cursor-pointer select-none hover:text-text-secondary transition-colors"
                  onClick={() => toggleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <SortIcon k={col.key} />
                  </span>
                </th>
              ))}
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted">Categories</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-text-muted text-sm">
                  No transactions found
                </td>
              </tr>
            ) : filtered.map(tx => (
              <tr
                key={tx.id}
                className="border-b border-border/50 hover:bg-surface-overlay/50 transition-colors group cursor-pointer"
                onClick={() => { setEditing(tx); setSheetOpen(true) }}
              >
                <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
                  <Checkbox
                    checked={selected.has(tx.id)}
                    onCheckedChange={() => toggleOne(tx.id)}
                  />
                </td>
                <td className="px-4 py-2.5 font-medium text-text-primary">{tx.label}</td>
                <td className="px-4 py-2.5 font-mono font-medium tabular-nums">
                  <span className={tx.type === 'income' ? 'text-income' : 'text-expense'}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, settings.currency)}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-2xs font-medium ${
                    tx.type === 'income'
                      ? 'bg-income/10 text-income'
                      : 'bg-expense/10 text-expense'
                  }`}>
                    {tx.type}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{formatDate(tx.date)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {tx.categories.map(cat => (
                      <Badge key={cat} color={categoryColor(cat)}>{cat}</Badge>
                    ))}
                  </div>
                </td>
                <td className="px-2 py-2.5" onClick={e => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={() => remove(tx.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-text-muted hover:text-danger" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-2.5 border-t border-border text-xs text-text-muted">
        {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        {selected.size > 0 && ` · ${selected.size} selected`}
      </div>

      <TransactionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        transaction={editing}
        allTransactions={transactions}
        onSave={async (data) => {
          if (editing) await update(editing.id, data)
          else await create(data)
          setSheetOpen(false)
        }}
      />
    </div>
  )
}
