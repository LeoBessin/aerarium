import { TransactionTable } from '@/components/table/TransactionTable'

export default function TransactionsPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-sm font-semibold text-text-primary">Transactions</h1>
        <p className="text-xs text-text-muted mt-0.5">All income and expenditure</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <TransactionTable />
      </div>
    </div>
  )
}
