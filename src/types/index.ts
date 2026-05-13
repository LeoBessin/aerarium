export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  label: string
  amount: number
  type: TransactionType
  categories: string[]
  date: string // ISO 8601
}

export interface Period {
  id: string
  label: string
  color: string // hex
  startDate: string
  endDate: string
}

export interface Budget {
  id: string
  category: string
  amount: number // monthly cap
}

export type CardType =
  | 'total'
  | 'top-categories'
  | 'daily-breakdown'
  | 'avg-daily-per-period'
  | 'budget-vs-actual'
  | 'top-category-per-period'
  | 'category-breakdown'

export type ChartType = 'bar' | 'line' | 'pie' | 'number'

export interface CardConfig {
  categories?: string[]
  periodId?: string
  dateRange?: { from: string; to: string }
  topN?: number
  direction?: 'income' | 'expense' | 'both'
}

export interface DashboardCard {
  id: string
  title: string
  type: CardType
  chartType: ChartType
  config: CardConfig
  layout: { x: number; y: number; w: number; h: number }
}

export interface Settings {
  currency: string
}

export interface AerariumData {
  transactions: Transaction[]
  periods: Period[]
  budgets: Budget[]
  dashboard: DashboardCard[]
  settings: Settings
}
