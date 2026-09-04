import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { claimAdmin, ensureSessionExists, subscribeSession } from '../../lib/store'
import { Button, Card, PageShell } from '../../components/ui'

export default function AdminLogin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    ensureSessionExists()
  }, [])

  useEffect(() => {
    if (!user) return
    const unsub = subscribeSession((s) => {
      if (s?.adminUid === user.uid) navigate('/admin/dashboard')
    })
    return unsub
  }, [user, navigate])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setBusy(true)
    setError('')
    try {
      await claimAdmin(user.uid, passcode.trim())
    } catch {
      setError('Wrong passcode, or an admin is already active for this session.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell>
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <h1 className="font-display text-3xl font-bold text-teal">Quizmaster login</h1>
        <form onSubmit={handleLogin} className="w-full max-w-xs flex flex-col gap-4">
          <Card>
            <label className="block text-sm font-semibold mb-1">Passcode</label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full rounded-xl border border-stone/40 bg-white px-4 py-3 text-lg"
              autoFocus
            />
          </Card>
          {error && <p className="text-red text-sm font-semibold text-center">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            Enter
          </Button>
        </form>
      </div>
    </PageShell>
  )
}
