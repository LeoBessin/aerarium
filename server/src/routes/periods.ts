import { Router } from 'express'
import { readData, writeData } from '../store.js'
import { v4 as uuid } from 'uuid'

const router = Router()

router.get('/', (_req, res) => {
  res.json(readData().periods)
})

router.post('/', (req, res) => {
  const data = readData()
  const period = { ...req.body, id: uuid() }
  data.periods.push(period)
  writeData(data)
  res.status(201).json(period)
})

router.put('/:id', (req, res) => {
  const data = readData()
  const idx = data.periods.findIndex(p => p.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  data.periods[idx] = { ...data.periods[idx], ...req.body, id: req.params.id }
  writeData(data)
  res.json(data.periods[idx])
})

router.delete('/:id', (req, res) => {
  const data = readData()
  const before = data.periods.length
  data.periods = data.periods.filter(p => p.id !== req.params.id)
  if (data.periods.length === before) return res.status(404).json({ error: 'Not found' })
  writeData(data)
  res.json({ deleted: 1 })
})

export default router
