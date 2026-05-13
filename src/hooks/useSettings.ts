import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import type { Settings } from '@/types'

export function useSettings() {
  const [settings, setSettings] = useState<Settings>({ currency: 'EUR' })

  const load = useCallback(async () => {
    setSettings(await api.settings.get())
  }, [])

  useEffect(() => { load() }, [load])

  const update = useCallback(async (s: Partial<Settings>) => {
    const updated = await api.settings.update(s)
    setSettings(updated)
    return updated
  }, [])

  return { settings, update }
}
