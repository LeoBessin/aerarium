import { Router } from 'express'
import { readData, writeData } from '../store.js'

const router = Router()

router.get('/', (_req, res) => {
  res.json(readData().dashboard)
})

router.put('/', (req, res) => {
  const data = readData()
  data.dashboard = req.body
  writeData(data)
  res.json(data.dashboard)
})

export default router
