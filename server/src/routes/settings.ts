import { Router } from 'express'
import { readData, writeData } from '../store.js'

const router = Router()

router.get('/', (_req, res) => {
  res.json(readData().settings)
})

router.put('/', (req, res) => {
  const data = readData()
  data.settings = { ...data.settings, ...req.body }
  writeData(data)
  res.json(data.settings)
})

// Export full data
router.get('/export', (_req, res) => {
  const data = readData()
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Disposition', 'attachment; filename="aerarium.json"')
  res.json(data)
})

// Import full data
router.post('/import', (req, res) => {
  const body = req.body
  const required = ['transactions', 'periods', 'budgets', 'dashboard', 'settings']
  for (const key of required) {
    if (!(key in body)) {
      res.status(400).json({ error: `Missing key: ${key}` })
      return
    }
  }
  writeData(body)
  res.json({ ok: true })
})

export default router
