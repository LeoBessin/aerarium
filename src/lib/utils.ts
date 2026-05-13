import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

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

export function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? '#8a8a9a'
}
