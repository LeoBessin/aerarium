import { Router } from 'express'
import { readData, writeData } from '../store.js'
import { v4 as uuid } from 'uuid'

const router = Router()

router.get('/', (_req, res) => {
  res.json(readData().budgets)
})

router.post('/', (req, res) => {
  const data = readData()
  const budget = { ...req.body, id: uuid() }
  data.budgets.push(budget)
  writeData(data)
  res.status(201).json(budget)
})

router.put('/:id', (req, res) => {
  const data = readData()
  const idx = data.budgets.findIndex(b => b.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  data.budgets[idx] = { ...data.budgets[idx], ...req.body, id: req.params.id }
  writeData(data)
  res.json(data.budgets[idx])
})

router.delete('/:id', (req, res) => {
  const data = readData()
  const before = data.budgets.length
  data.budgets = data.budgets.filter(b => b.id !== req.params.id)
  if (data.budgets.length === before) return res.status(404).json({ error: 'Not found' })
  writeData(data)
  res.json({ deleted: 1 })
})

export default router
