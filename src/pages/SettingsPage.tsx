import { useRef, useState } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { useBudgets } from '@/hooks/useBudgets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Plus, Download, Upload } from 'lucide-react'
import { categoryColor } from '@/lib/utils'
import { api } from '@/lib/api'
import type { AerariumData } from '@/types'

const CURRENCIES = ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD']
const CATEGORIES = [
  'Food', 'Transport', 'Housing', 'Health', 'Entertainment',
  'Utilities', 'Shopping', 'Education', 'Travel', 'Other',
]

export default function SettingsPage() {
  const { settings, update } = useSettings()
  const { budgets, create, update: updateBudget, remove } = useBudgets()
  const [newCategory, setNewCategory] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    const blob = await api.settings.export()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'aerarium.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    setImportError(null)
    fileRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportError(null)
    try {
      const text = await file.text()
      const data = JSON.parse(text) as AerariumData
      const required = ['transactions', 'periods', 'budgets', 'dashboard', 'settings']
      const missing = required.filter(k => !(k in data))
      if (missing.length) throw new Error(`Missing keys: ${missing.join(', ')}`)
      await api.settings.import(data)
      window.location.reload()
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Invalid file')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function addBudget() {
    if (!newCategory || !newAmount) return
    await create({ category: newCategory, amount: parseFloat(newAmount) })
    setNewCategory(''); setNewAmount('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-sm font-semibold text-text-primary">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-lg">
        {/* Currency */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">General</h2>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={settings.currency} onValueChange={v => update({ currency: v })}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Budgets */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Monthly Budgets</h2>
          <p className="text-xs text-text-muted">Set a monthly spending cap per category. Used in the budget-vs-actual dashboard card.</p>

          <div className="space-y-2">
            {budgets.map(b => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-md bg-surface border border-border">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: categoryColor(b.category) }}
                />
                <span className="text-sm text-text-primary flex-1">{b.category}</span>
                <Input
                  type="number"
                  className="w-28 text-right"
                  value={b.amount}
                  min={0}
                  step={1}
                  onChange={e => updateBudget(b.id, { amount: parseFloat(e.target.value) })}
                />
                <Button variant="ghost" size="icon" onClick={() => remove(b.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-text-muted hover:text-danger" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add budget */}
          <div className="flex gap-2">
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.filter(c => !budgets.find(b => b.category === c)).map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Amount"
              className="w-28"
              value={newAmount}
              min={0}
              onChange={e => setNewAmount(e.target.value)}
            />
            <Button size="icon" onClick={addBudget} disabled={!newCategory || !newAmount}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Data */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Data</h2>
          <p className="text-xs text-text-muted">Export your full data as a JSON file, or import a previously exported file to restore it.</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleImportClick} disabled={importing}>
              <Upload className="h-3.5 w-3.5" />
              {importing ? 'Importing…' : 'Import'}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          {importError && (
            <p className="text-xs text-danger">{importError}</p>
          )}
        </section>
      </div>
    </div>
  )
}
