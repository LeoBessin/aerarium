import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ResolvedTheme } from '@/lib/theme'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateShort(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function isoToday(): string {
  return new Date().toISOString().split('T')[0]
}

export function getDaysInRange(from: string, to: string): number {
  const a = new Date(from)
  const b = new Date(to)
  return Math.max(1, Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1)
}

/** Canonical (dark-theme) category hues. Keys are stable — never rename. */
export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f5a623',
  Transport: '#5e6ad2',
  Housing: '#4caf7d',
  Health: '#e05c5c',
  Entertainment: '#a78bfa',
  Utilities: '#38bdf8',
  Shopping: '#fb923c',
  Education: '#34d399',
  Travel: '#60a5fa',
  Other: '#8a8a9a',
}

/** The same hues, deepened to stay legible on a white surface (>= 4.5:1). */
export const CATEGORY_COLORS_LIGHT: Record<string, string> = {
  Food: '#b5730c',
  Transport: '#4f5ac4',
  Housing: '#157f4c',
  Health: '#c4383a',
  Entertainment: '#7c5cf0',
  Utilities: '#0a7ea8',
  Shopping: '#c2620c',
  Education: '#12855c',
  Travel: '#2a6fd4',
  Other: '#6c6e7b',
}

export function categoryColor(cat: string, theme: ResolvedTheme = 'dark'): string {
  return theme === 'light'
    ? CATEGORY_COLORS_LIGHT[cat] ?? '#6c6e7b'
    : CATEGORY_COLORS[cat] ?? '#8a8a9a'
}

/**
 * Newest item per distinct label, keyed by lowercased label, in recency order.
 * Built from a date-descending sort, so iterating the values yields newest-first
 * and `map.get(typed.trim().toLowerCase())` is an exact-label lookup.
 */
export function latestByLabel<T extends { label: string }>(
  items: T[],
  dateOf: (item: T) => string,
): Map<string, T> {
  const map = new Map<string, T>()
  items
    .slice()
    .sort((a, b) => dateOf(b).localeCompare(dateOf(a)))
    .forEach(item => {
      const key = item.label.trim().toLowerCase()
      if (!map.has(key)) map.set(key, item)
    })
  return map
}
