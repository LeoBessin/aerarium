import { useState } from 'react'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Props {
  onAuthenticated: () => void
}

export function LockScreen({ onAuthenticated }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.auth.login(password)
      onAuthenticated()
    } catch {
      setError('Invalid password')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-72 space-y-3">
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoFocus
          autoComplete="current-password"
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading || !password}>
          {loading ? 'Verifying…' : 'Unlock'}
        </Button>
      </form>
    </div>
  )
}
