import { Router } from 'express'
import crypto from 'crypto'

const router = Router()

const SESSION_TTL_MS = 24 * 60 * 60 * 1000 // 24h
const COOKIE_NAME = 'aerarium_session'

// In-memory session store: token → expiresAt
export const sessions = new Map<string, number>()

export function isValidSession(token: string | undefined): boolean {
  if (!token) return false
  const expiresAt = sessions.get(token)
  if (!expiresAt) return false
  if (Date.now() > expiresAt) {
    sessions.delete(token)
    return false
  }
  return true
}

router.post('/login', (req, res) => {
  const { password } = req.body as { password?: string }
  const expected = process.env.AERARIUM_PASSWORD
  if (!expected || password !== expected) {
    res.status(401).json({ error: 'Invalid password' })
    return
  }
  const token = crypto.randomBytes(32).toString('hex')
  sessions.set(token, Date.now() + SESSION_TTL_MS)
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: SESSION_TTL_MS,
  })
  res.json({ ok: true })
})

router.post('/logout', (req, res) => {
  const token = req.cookies?.[COOKIE_NAME]
  if (token) sessions.delete(token)
  res.clearCookie(COOKIE_NAME)
  res.json({ ok: true })
})

export { COOKIE_NAME }
export default router
