import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { DashboardCard, CardType, ChartType, Period } from '@/types'
import { v4 as uuid } from 'uuid'

const CARD_TYPES: { type: CardType; label: string; description: string; chartTypes: ChartType[] }[] = [
  { type: 'total', label: 'Total', description: 'Sum of income or expenses with trend', chartTypes: ['number'] },
  { type: 'top-categories', label: 'Top Categories', description: 'Biggest spending categories', chartTypes: ['bar', 'pie'] },
  { type: 'daily-breakdown', label: 'Daily Breakdown', description: 'Spend per day within the selected month', chartTypes: ['bar'] as ChartType[] },
  { type: 'avg-daily-per-period', label: 'Avg Daily per Period', description: 'Average daily spend by period', chartTypes: ['bar'] },
  { type: 'budget-vs-actual', label: 'Budget vs Actual', description: 'Compare budgets against real spend', chartTypes: ['bar'] },
  { type: 'top-category-per-period', label: 'Top Category per Period', description: 'Which category dominated each period', chartTypes: ['bar'] },
  { type: 'category-breakdown', label: 'Category Breakdown', description: 'Transaction totals by label within each category', chartTypes: ['bar'] },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  periods: Period[]
  onAdd: (card: DashboardCard) => void
}

export function CardBuilder({ open, onOpenChange, periods, onAdd }: Props) {
  const [step, setStep] = useState(0)
  const [cardType, setCardType] = useState<CardType | null>(null)
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [title, setTitle] = useState('')
  const [direction, setDirection] = useState<'income' | 'expense' | 'both'>('expense')
  const [topN, setTopN] = useState('5')
  const [periodId, setPeriodId] = useState<string>('__all__')

  function reset() {
    setStep(0); setCardType(null); setChartType('bar')
    setTitle(''); setDirection('expense'); setTopN('5'); setPeriodId('__all__')
  }

  function handleClose() { reset(); onOpenChange(false) }

  function handleSelectType(t: CardType) {
    setCardType(t)
    const def = CARD_TYPES.find(x => x.type === t)!
    setChartType(def.chartTypes[0])
    const defaultTitle = def.label
    setTitle(defaultTitle)
    setStep(1)
  }

  function handleAdd() {
    if (!cardType) return
    const card: DashboardCard = {
      id: uuid(),
      title: title || CARD_TYPES.find(x => x.type === cardType)!.label,
      type: cardType,
      chartType,
      config: {
        direction: cardType === 'total' || cardType === 'top-categories' || cardType === 'top-category-per-period' || cardType === 'category-breakdown' ? direction : undefined,
        topN: cardType === 'top-categories' ? parseInt(topN) : undefined,
        periodId: periodId !== '__all__' ? periodId : undefined,
      },
      layout: { x: 0, y: 9999, w: 4, h: 3 },
    }
    onAdd(card)
    handleClose()
  }

  const selectedTypeDef = CARD_TYPES.find(x => x.type === cardType)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 0 ? 'Choose card type' : `Configure — ${selectedTypeDef?.label}`}
          </DialogTitle>
        </DialogHeader>

        {step === 0 && (
          <div className="space-y-1.5 py-2">
            {CARD_TYPES.map(ct => (
              <button
                key={ct.type}
                onClick={() => handleSelectType(ct.type)}
                className="w-full flex items-center gap-3 p-3 rounded-md border border-border hover:border-border-strong hover:bg-surface-overlay transition-colors text-left group"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{ct.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{ct.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-text-disabled group-hover:text-text-muted transition-colors" />
              </button>
            ))}
          </div>
        )}

        {step === 1 && selectedTypeDef && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={selectedTypeDef.label} />
            </div>

            {selectedTypeDef.chartTypes.length > 1 && (
              <div className="space-y-1.5">
                <Label>Chart type</Label>
                <div className="flex gap-2">
                  {selectedTypeDef.chartTypes.map(ct => (
                    <button
                      key={ct}
                      onClick={() => setChartType(ct)}
                      className={cn(
                        'flex-1 py-1.5 rounded-md border text-sm font-medium capitalize transition-colors',
                        chartType === ct
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border text-text-muted hover:text-text-secondary hover:border-border-strong'
                      )}
                    >
                      {ct}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(cardType === 'total' || cardType === 'top-categories' || cardType === 'top-category-per-period' || cardType === 'category-breakdown') && (
              <div className="space-y-1.5">
                <Label>Direction</Label>
                <div className="flex gap-2">
                  {(['expense', 'income', 'both'] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => setDirection(d)}
                      className={cn(
                        'flex-1 py-1.5 rounded-md border text-sm font-medium capitalize transition-colors',
                        direction === d
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border text-text-muted hover:text-text-secondary'
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {cardType === 'top-categories' && (
              <div className="space-y-1.5">
                <Label>Top N categories</Label>
                <Select value={topN} onValueChange={setTopN}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[3, 5, 10].map(n => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {cardType === 'avg-daily-per-period' && periods.length > 0 && (
              <div className="space-y-1.5">
                <Label>Filter to period (optional)</Label>
                <Select value={periodId} onValueChange={setPeriodId}>
                  <SelectTrigger><SelectValue placeholder="All periods" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All periods</SelectItem>
                    {periods.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 1 && (
            <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
          )}
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          {step === 1 && (
            <Button onClick={handleAdd}>Add card</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
