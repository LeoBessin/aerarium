import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import type { Period } from '@/types'

export function usePeriods() {
  const [periods, setPeriods] = useState<Period[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setPeriods(await api.periods.list())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const create = useCallback(async (p: Omit<Period, 'id'>) => {
    const created = await api.periods.create(p)
    setPeriods(prev => [...prev, created])
    return created
  }, [])

  const update = useCallback(async (id: string, p: Partial<Period>) => {
    const updated = await api.periods.update(id, p)
    setPeriods(prev => prev.map(x => x.id === id ? updated : x))
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    await api.periods.delete(id)
    setPeriods(prev => prev.filter(x => x.id !== id))
  }, [])

  return { periods, loading, create, update, remove, reload: load }
}
