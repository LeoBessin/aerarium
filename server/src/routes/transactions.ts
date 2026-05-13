import { Router } from 'express'
import { readData, writeData } from '../store.js'
import { v4 as uuid } from 'uuid'

const router = Router()

router.get('/', (_req, res) => {
  const data = readData()
  res.json(data.transactions)
})

router.post('/', (req, res) => {
  const data = readData()
  const tx = { ...req.body, id: uuid() }
  data.transactions.push(tx)
  writeData(data)
  res.status(201).json(tx)
})

router.put('/:id', (req, res) => {
  const data = readData()
  const idx = data.transactions.findIndex(t => t.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  data.transactions[idx] = { ...data.transactions[idx], ...req.body, id: req.params.id }
  writeData(data)
  res.json(data.transactions[idx])
})

router.delete('/', (req, res) => {
  const data = readData()
  const ids: string[] = req.body.ids
  data.transactions = data.transactions.filter(t => !ids.includes(t.id))
  writeData(data)
  res.json({ deleted: ids.length })
})

router.delete('/:id', (req, res) => {
  const data = readData()
  const before = data.transactions.length
  data.transactions = data.transactions.filter(t => t.id !== req.params.id)
  if (data.transactions.length === before) return res.status(404).json({ error: 'Not found' })
  writeData(data)
  res.json({ deleted: 1 })
})

export default router
