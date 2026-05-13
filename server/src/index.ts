import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import transactionsRouter from './routes/transactions.js'
import periodsRouter from './routes/periods.js'
import budgetsRouter from './routes/budgets.js'
import dashboardRouter from './routes/dashboard.js'
import settingsRouter from './routes/settings.js'
import authRouter, { isValidSession, COOKIE_NAME } from './routes/auth.js'

if (!process.env.AERARIUM_PASSWORD) {
  console.error('ERROR: AERARIUM_PASSWORD environment variable is not set. Refusing to start.')
  process.exit(1)
}

const app = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173'

app.use(cors({ origin: CORS_ORIGIN, credentials: true }))
app.use(express.json())
app.use(cookieParser())

// Auth routes (public)
app.use('/api/auth', authRouter)

// Auth middleware for all other API routes
app.use('/api', (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME]
  if (!isValidSession(token)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
})

app.use('/api/transactions', transactionsRouter)
app.use('/api/periods', periodsRouter)
app.use('/api/budgets', budgetsRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/settings', settingsRouter)

// Serve built frontend in production
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '../../dist')
app.use(express.static(distPath))
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Aerarium running on http://localhost:${PORT}`)
})
