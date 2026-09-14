export type ThemePreference = 'dark' | 'light' | 'system'
export type ResolvedTheme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'aerarium.theme'

export function readStoredPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    if (v === 'dark' || v === 'light' || v === 'system') return v
  } catch {
    /* private mode / storage blocked */
  }
  return 'system'
}

export function writeStoredPreference(pref: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref)
  } catch {
    /* private mode: the theme still applies for this session */
  }
}

export function systemTheme(): ResolvedTheme {
  return typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  return pref === 'system' ? systemTheme() : pref
}

/** Mirrors the pre-paint inline script in index.html. */
export function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement
  root.setAttribute('data-theme', resolved)
  root.style.colorScheme = resolved
}

// ── Chart palette ───────────────────────────────────────────────────────────
// Recharts writes these straight into SVG attributes, so they have to be
// literal strings rather than CSS variables. Keep in sync with the :root and
// html[data-theme='light'] blocks in src/index.css.

export interface ChartColors {
  /** Axis ticks — --text-muted */
  axis: string
  /** Grid lines — --border */
  grid: string
  accent: string
  /** activeDot halo: must equal the card background — --surface */
  surface: string
  /** Neutral "budget" bar — --border-strong */
  neutralBar: string
  income: string
  expense: string
}

const CHART_COLORS: Record<ResolvedTheme, ChartColors> = {
  dark: {
    axis: '#8a8a9a',
    grid: '#26262c',
    accent: '#5e6ad2',
    surface: '#131316',
    neutralBar: '#363640',
    income: '#4caf7d',
    expense: '#e05c5c',
  },
  light: {
    axis: '#6c6e7b',
    grid: '#e4e5ec',
    accent: '#4f5ac4',
    surface: '#ffffff',
    neutralBar: '#c7c9d4',
    income: '#157f4c',
    expense: '#c4383a',
  },
}

export function chartColors(theme: ResolvedTheme): ChartColors {
  return CHART_COLORS[theme]
}
