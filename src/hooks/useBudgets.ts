import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import type { Budget } from '@/types'

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([])

  const load = useCallback(async () => {
    setBudgets(await api.budgets.list())
  }, [])

  useEffect(() => { load() }, [load])

  const create = useCallback(async (b: Omit<Budget, 'id'>) => {
    const created = await api.budgets.create(b)
    setBudgets(prev => [...prev, created])
    return created
  }, [])

  const update = useCallback(async (id: string, b: Partial<Budget>) => {
    const updated = await api.budgets.update(id, b)
    setBudgets(prev => prev.map(x => x.id === id ? updated : x))
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    await api.budgets.delete(id)
    setBudgets(prev => prev.filter(x => x.id !== id))
  }, [])

  return { budgets, create, update, remove, reload: load }
}
