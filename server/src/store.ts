import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { AerariumData } from '../../src/types/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.resolve(__dirname, '../../data/aerarium.json')

const DEFAULT_DATA: AerariumData = {
  transactions: [],
  periods: [],
  budgets: [],
  dashboard: [],
  settings: { currency: 'EUR' },
}

function ensureDataFile(): void {
  const dir = path.dirname(DATA_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8')
  }
}

export function readData(): AerariumData {
  ensureDataFile()
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8')
    const data: AerariumData = { ...DEFAULT_DATA, ...JSON.parse(raw) }
    // Migrate legacy card types
    data.dashboard = data.dashboard.map(card => ({
      ...card,
      type: card.type === ('spend-over-time' as string) ? 'daily-breakdown' : card.type,
      layout: {
        ...card.layout,
        x: card.layout.x ?? 0,
        y: card.layout.y ?? 9999,
        w: card.layout.w ?? 4,
        h: card.layout.h ?? 3,
      },
    }))
    return data
  } catch {
    return DEFAULT_DATA
  }
}

export function writeData(data: AerariumData): void {
  ensureDataFile()
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8')
}
