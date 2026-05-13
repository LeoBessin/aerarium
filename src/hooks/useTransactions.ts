import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import type { Transaction } from '@/types'

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setTransactions(await api.transactions.list())
      setError(null)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const create = useCallback(async (tx: Omit<Transaction, 'id'>) => {
    const created = await api.transactions.create(tx)
    setTransactions(prev => [created, ...prev])
    return created
  }, [])

  const update = useCallback(async (id: string, tx: Partial<Transaction>) => {
    const updated = await api.transactions.update(id, tx)
    setTransactions(prev => prev.map(t => t.id === id ? updated : t))
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    await api.transactions.delete(id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }, [])

  const bulkRemove = useCallback(async (ids: string[]) => {
    await api.transactions.bulkDelete(ids)
    setTransactions(prev => prev.filter(t => !ids.includes(t.id)))
  }, [])

  return { transactions, loading, error, create, update, remove, bulkRemove, reload: load }
}
