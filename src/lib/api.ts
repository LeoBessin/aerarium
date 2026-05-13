import type {
  Transaction,
  Period,
  Budget,
  DashboardCard,
  Settings,
  AerariumData,
} from '@/types'

const BASE = '/api'

export class AuthError extends Error {}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  })
  if (res.status === 401) throw new AuthError('Unauthorized')
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res.json() as Promise<T>
}

// Transactions
export const api = {
  auth: {
    login: (password: string) =>
      req<{ ok: boolean }>('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
    logout: () =>
      req<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  },
  transactions: {
    list: () => req<Transaction[]>('/transactions'),
    create: (tx: Omit<Transaction, 'id'>) =>
      req<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(tx) }),
    update: (id: string, tx: Partial<Transaction>) =>
      req<Transaction>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(tx) }),
    delete: (id: string) =>
      req<{ deleted: number }>(`/transactions/${id}`, { method: 'DELETE' }),
    bulkDelete: (ids: string[]) =>
      req<{ deleted: number }>('/transactions', { method: 'DELETE', body: JSON.stringify({ ids }) }),
  },
  periods: {
    list: () => req<Period[]>('/periods'),
    create: (p: Omit<Period, 'id'>) =>
      req<Period>('/periods', { method: 'POST', body: JSON.stringify(p) }),
    update: (id: string, p: Partial<Period>) =>
      req<Period>(`/periods/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
    delete: (id: string) =>
      req<{ deleted: number }>(`/periods/${id}`, { method: 'DELETE' }),
  },
  budgets: {
    list: () => req<Budget[]>('/budgets'),
    create: (b: Omit<Budget, 'id'>) =>
      req<Budget>('/budgets', { method: 'POST', body: JSON.stringify(b) }),
    update: (id: string, b: Partial<Budget>) =>
      req<Budget>(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    delete: (id: string) =>
      req<{ deleted: number }>(`/budgets/${id}`, { method: 'DELETE' }),
  },
  dashboard: {
    get: () => req<DashboardCard[]>('/dashboard'),
    save: (cards: DashboardCard[]) =>
      req<DashboardCard[]>('/dashboard', { method: 'PUT', body: JSON.stringify(cards) }),
  },
  settings: {
    get: () => req<Settings>('/settings'),
    update: (s: Partial<Settings>) =>
      req<Settings>('/settings', { method: 'PUT', body: JSON.stringify(s) }),
    export: () => fetch('/api/settings/export', { credentials: 'include' }).then(r => r.blob()),
    import: (data: AerariumData) =>
      req<{ ok: boolean }>('/settings/import', { method: 'POST', body: JSON.stringify(data) }),
  },
}
