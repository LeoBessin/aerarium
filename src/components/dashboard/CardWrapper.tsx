import { useState } from 'react'
import { X, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  TotalCard, TopCategoriesCard, DailyBreakdownCard,
  AvgDailyPerPeriodCard, BudgetVsActualCard, TopCategoryPerPeriodCard, CategoryBreakdownCard
} from './cards/CardRenderers'
import type { CardProps } from './cards/CardRenderers'
import type { DashboardCard, Transaction, Budget, Period } from '@/types'

interface Props {
  card: DashboardCard
  transactions: Transaction[]
  budgets: Budget[]
  periods: Period[]
  currency: string
  month: Date
  onRemove: () => void
}

export function CardWrapper({ card, transactions, budgets, periods, currency, month, onRemove }: Props) {
  const [hovered, setHovered] = useState(false)

  const cardProps: CardProps = { card, transactions, budgets, periods, currency, month }

  function renderCard() {
    switch (card.type) {
      case 'total': return <TotalCard {...cardProps} />
      case 'top-categories': return <TopCategoriesCard {...cardProps} />
      case 'daily-breakdown': return <DailyBreakdownCard {...cardProps} />
      case 'avg-daily-per-period': return <AvgDailyPerPeriodCard {...cardProps} />
      case 'budget-vs-actual': return <BudgetVsActualCard {...cardProps} />
      case 'top-category-per-period': return <TopCategoryPerPeriodCard {...cardProps} />
      case 'category-breakdown': return <CategoryBreakdownCard {...cardProps} />
    }
  }

  return (
    <div
      className="flex flex-col bg-surface border border-border rounded-lg overflow-hidden h-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Card header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
        <div className="drag-handle cursor-grab text-text-disabled hover:text-text-muted transition-colors">
          <GripVertical className="h-4 w-4" />
        </div>
        <span className="text-xs font-medium text-text-secondary flex-1 truncate">{card.title}</span>
        <Button
          variant="ghost"
          size="icon"
          className={`h-5 w-5 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Card body */}
      <div className="flex-1 p-3 min-h-0">
        {renderCard()}
      </div>
    </div>
  )
}
