import { useSyncExternalStore } from 'react'
import {
  applyTheme,
  readStoredPreference,
  resolveTheme,
  writeStoredPreference,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from '@/lib/theme'

interface ThemeState {
  preference: ThemePreference
  resolved: ResolvedTheme
}

// Module-level store: one source of truth shared by the sidebar toggle and
// every chart, with no provider to thread through App.
let state: ThemeState = (() => {
  const preference = readStoredPreference()
  return { preference, resolved: resolveTheme(preference) }
})()

const listeners = new Set<() => void>()

function emit(next: ThemeState) {
  // Snapshot identity must only change when the value does.
  if (next.preference === state.preference && next.resolved === state.resolved) return
  state = next
  applyTheme(state.resolved)
  listeners.forEach(l => l())
}

if (typeof window !== 'undefined') {
  // Follow the OS while — and only while — the preference is 'system'.
  window.matchMedia?.('(prefers-color-scheme: light)').addEventListener('change', e => {
    if (state.preference !== 'system') return
    emit({ preference: 'system', resolved: e.matches ? 'light' : 'dark' })
  })

  // Keep other tabs of the app in sync.
  window.addEventListener('storage', e => {
    if (e.key !== null && e.key !== THEME_STORAGE_KEY) return
    const preference = readStoredPreference()
    emit({ preference, resolved: resolveTheme(preference) })
  })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// Must return the cached object: a fresh one per call makes React loop with
// "The result of getSnapshot should be cached".
function getSnapshot() {
  return state
}

export function setTheme(preference: ThemePreference) {
  writeStoredPreference(preference)
  emit({ preference, resolved: resolveTheme(preference) })
}

const CYCLE: ThemePreference[] = ['dark', 'light', 'system']

export function cycleTheme() {
  setTheme(CYCLE[(CYCLE.indexOf(state.preference) + 1) % CYCLE.length])
}

export function useTheme() {
  const { preference, resolved } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return { preference, resolved, setTheme, cycleTheme }
}
