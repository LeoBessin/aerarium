import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import type { DashboardCard } from '@/types'

export function useDashboard() {
  const [cards, setCards] = useState<DashboardCard[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setCards(await api.dashboard.get())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (updated: DashboardCard[]) => {
    const saved = await api.dashboard.save(updated)
    setCards(saved)
    return saved
  }, [])

  const addCard = useCallback(async (card: DashboardCard) => {
    const updated = [...cards, card]
    return save(updated)
  }, [cards, save])

  const removeCard = useCallback(async (id: string) => {
    const updated = cards.filter(c => c.id !== id)
    return save(updated)
  }, [cards, save])

  const updateLayouts = useCallback(async (layouts: { id: string; layout: DashboardCard['layout'] }[]) => {
    const updated = cards.map(c => {
      const l = layouts.find(x => x.id === c.id)
      return l ? { ...c, layout: l.layout } : c
    })
    return save(updated)
  }, [cards, save])

  return { cards, loading, save, addCard, removeCard, updateLayouts, reload: load }
}
