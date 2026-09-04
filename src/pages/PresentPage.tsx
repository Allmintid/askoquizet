import { useEffect, useMemo, useState } from 'react'
import {
  subscribeQuestions,
  subscribeSession,
  subscribeSubmissions,
  subscribeTeams,
} from '../lib/store'
import type { Question, SessionDoc, Submission, Team } from '../types'
import { Avatar } from '../components/ui'

export default function PresentPage() {
  const [session, setSession] = useState<(SessionDoc & { id: string }) | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])

  useEffect(() => {
    const u1 = subscribeSession(setSession)
    const u2 = subscribeQuestions(setQuestions)
    const u3 = subscribeTeams(setTeams)
    const u4 = subscribeSubmissions(setSubmissions)
    return () => {
      u1()
      u2()
      u3()
      u4()
    }
  }, [])

  const currentQuestion = questions.find((q) => q.id === session?.currentQuestionId) ?? null
  const currentSubs = useMemo(
    () => submissions.filter((s) => s.questionId === currentQuestion?.id),
    [submissions, currentQuestion],
  )
  const sortedTeams = useMemo(
    () => [...teams].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    [teams],
  )

  if (!session) {
    return (
      <div className="min-h-dvh bg-teal flex items-center justify-center text-cream text-3xl font-display">
        Loading…
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-teal text-cream flex flex-col items-center justify-center p-10 text-center">
      {session.phase === 'lobby' && (
        <>
          <h1 className="font-display text-6xl font-bold mb-4">Askoquizet</h1>
          <p className="text-2xl mb-8">
            Join at <span className="font-semibold">{window.location.origin}{import.meta.env.BASE_URL}join</span>
          </p>
          <p className="text-8xl font-display font-bold tracking-widest mb-10">{session.joinCode}</p>
          <div className="flex flex-wrap gap-3 justify-center max-w-4xl">
            {teams.map((t) => (
              <span
                key={t.id}
                className="bg-cream text-ink rounded-pill px-5 py-2 text-xl font-semibold inline-flex items-center gap-2"
              >
                <Avatar avatar={t.avatar} className="w-7 h-7 text-2xl" /> {t.name}
              </span>
            ))}
          </div>
          {teams.length === 0 && <p className="text-xl text-cream/70">Waiting for teams to join…</p>}
        </>
      )}

      {(session.phase === 'question' || session.phase === 'locked') && currentQuestion && (
        <>
          {currentQuestion.imageUrl && (
            <img
              src={currentQuestion.imageUrl}
              alt=""
              className="max-h-[40vh] rounded-2xl object-contain mb-8 shadow-lg"
            />
          )}
          <h2 className="font-display text-5xl font-bold max-w-4xl">{currentQuestion.text}</h2>
          <p className="mt-10 text-2xl text-cream/80">
            {currentSubs.length} / {teams.length} answers in
            {session.phase === 'locked' ? ' · locked 🔒' : ''}
          </p>
        </>
      )}

      {session.phase === 'reveal' && currentQuestion && (
        <RevealBoard question={currentQuestion} submissions={currentSubs} teams={teams} />
      )}

      {(session.phase === 'scoreboard' || session.phase === 'finished') && (
        <>
          <h2 className="font-display text-5xl font-bold mb-8">
            {session.phase === 'finished' ? 'Final results 🏆' : 'Scoreboard'}
          </h2>
          <ol className="flex flex-col gap-3 w-full max-w-2xl">
            {sortedTeams.map((t, i) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-2xl bg-cream text-ink px-6 py-4 text-2xl"
              >
                <span className="flex items-center gap-3">
                  <span className="text-ink/40 w-8 font-display font-bold">{i + 1}</span>
                  <Avatar avatar={t.avatar} className="w-9 h-9 text-3xl" />
                  <span className="font-semibold">{t.name}</span>
                </span>
                <span className="font-display font-bold">{t.score ?? 0}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}

function RevealBoard({
  question,
  submissions,
  teams,
}: {
  question: Question
  submissions: Submission[]
  teams: Team[]
}) {
  const correctOption =
    question.type === 'single_choice'
      ? (question.options ?? []).find((o) => o.id === question.correctOptionId)
      : null

  return (
    <>
      <h2 className="font-display text-4xl font-bold max-w-4xl mb-2">{question.text}</h2>
      {question.type === 'single_choice' && (
        <p className="text-3xl text-yellow font-display font-bold mb-8">✓ {correctOption?.text ?? '—'}</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-4xl">
        {teams.map((t) => {
          const sub = submissions.find((s) => s.teamId === t.id)
          const answerLabel =
            question.type === 'single_choice'
              ? question.options?.find((o) => o.id === sub?.answer)?.text ?? '—'
              : sub?.answer ?? '—'
          const status = !sub ? 'none' : sub.graded ? (sub.correct ? 'correct' : 'incorrect') : 'pending'
          return (
            <div
              key={t.id}
              className={`rounded-xl px-4 py-3 text-left ${
                status === 'correct'
                  ? 'bg-green text-cream'
                  : status === 'incorrect'
                    ? 'bg-red text-cream'
                    : 'bg-cream/20 text-cream'
              }`}
            >
              <p className="font-semibold flex items-center gap-2 text-lg">
                <Avatar avatar={t.avatar} className="w-6 h-6 text-xl" /> {t.name}
              </p>
              <p className="text-sm opacity-90 truncate">{sub ? answerLabel : 'No answer'}</p>
            </div>
          )
        })}
      </div>
    </>
  )
}
