import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { joinTeam, subscribeSession } from '../../lib/store'
import { useAuth } from '../../context/AuthContext'
import { AVATARS } from '../../types'
import { Button, Card, PageShell } from '../../components/ui'

export default function JoinPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [sessionCode, setSessionCode] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const unsub = subscribeSession((s) => setSessionCode(s?.joinCode ?? null))
    return unsub
  }, [])

  useEffect(() => {
    const existing = localStorage.getItem('askoquizet_team_id')
    if (existing) navigate('/play')
  }, [navigate])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!user) return
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Enter a team name.')
      return
    }
    if (sessionCode && joinCode.trim().toUpperCase() !== sessionCode) {
      setError('That join code doesn’t match. Double check with your quizmaster.')
      return
    }
    setBusy(true)
    try {
      const teamsRef = collection(db, 'sessions', 'main', 'teams')
      const dupQuery = query(teamsRef, where('nameLower', '==', trimmedName.toLowerCase()))
      const dupSnap = await getDocs(dupQuery)
      if (!dupSnap.empty) {
        setError('That team name is already taken. Try another.')
        setBusy(false)
        return
      }
      const teamId = await joinTeam(trimmedName, avatar, user.uid)
      localStorage.setItem('askoquizet_team_id', teamId)
      localStorage.setItem('askoquizet_team_name', trimmedName)
      navigate('/play')
    } catch {
      setError('Something went wrong joining. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell>
      <h1 className="font-display text-3xl font-bold text-teal text-center mb-6">Join the quiz</h1>
      <form onSubmit={handleJoin} className="flex flex-col gap-5">
        <Card>
          <label className="block text-sm font-semibold mb-1">Join code</label>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="e.g. AB123"
            className="w-full rounded-xl border border-stone/40 bg-white px-4 py-3 text-lg tracking-widest uppercase text-center"
            maxLength={8}
          />
        </Card>

        <Card>
          <label className="block text-sm font-semibold mb-1">Team name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="The Quiz Bees"
            className="w-full rounded-xl border border-stone/40 bg-white px-4 py-3 text-lg"
            maxLength={24}
          />
        </Card>

        <Card>
          <label className="block text-sm font-semibold mb-2">Pick an avatar</label>
          <div className="grid grid-cols-8 gap-2">
            {AVATARS.map((a) => (
              <button
                type="button"
                key={a}
                onClick={() => setAvatar(a)}
                className={`text-2xl rounded-xl py-2 transition ${
                  avatar === a ? 'bg-teal scale-110 shadow' : 'bg-cream-dim'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </Card>

        {error && <p className="text-red text-sm font-semibold text-center">{error}</p>}

        <Button type="submit" disabled={busy || loading} className="w-full text-xl">
          {busy ? 'Joining…' : `${avatar} Join as ${name.trim() || 'your team'}`}
        </Button>
      </form>
    </PageShell>
  )
}
