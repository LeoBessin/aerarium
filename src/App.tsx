import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import DashboardPage from '@/pages/DashboardPage'
import TransactionsPage from '@/pages/TransactionsPage'
import CalendarPage from '@/pages/CalendarPage'
import SettingsPage from '@/pages/SettingsPage'
import { LockScreen } from '@/components/auth/LockScreen'
import { api, AuthError } from '@/lib/api'

export default function App() {
  // null = unknown (checking), false = locked, true = authenticated
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    // Probe any protected endpoint to see if we have a valid session
    api.settings.get()
      .then(() => setAuthed(true))
      .catch(err => {
        if (err instanceof AuthError) setAuthed(false)
        else setAuthed(false) // server down etc — still show lock screen
      })
  }, [])

  if (authed === null) return null // brief blank while probing

  if (authed === false) return <LockScreen onAuthenticated={() => setAuthed(true)} />

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout onLogout={() => setAuthed(false)} />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
