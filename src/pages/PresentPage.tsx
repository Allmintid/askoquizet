import { useEffect, useMemo, useState } from 'react'
import {
  subscribeQuestions,
  subscribeSegments,
  subscribeSession,
  subscribeSubmissions,
  subscribeTeams,
} from '../lib/store'
import type { Question, Segment, SessionDoc, Submission, Team } from '../types'
import { Avatar, FloatingQuestionMarks, Footer, Header } from '../components/ui'

export default function PresentPage() {
  const [session, setSession] = useState<(SessionDoc & { id: string }) | null>(null)
  const [segments, setSegments] = useState<Segment[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])

  useEffect(() => {
    const u1 = subscribeSession(setSession)
    const u2 = subscribeQuestions(setQuestions)
    const u3 = subscribeTeams(setTeams)
    const u4 = subscribeSubmissions(setSubmissions)
    const u5 = subscribeSegments(setSegments)
    return () => {
      u1()
      u2()
      u3()
      u4()
      u5()
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
  const orderedQuestions = useMemo(() => {
    const bySegment = [...segments].sort((a, b) => a.order - b.order)
    return bySegment.flatMap((seg) =>
      questions.filter((q) => q.segmentId === seg.id).sort((a, b) => a.order - b.order),
    )
  }, [segments, questions])

  if (!session) {
    return (
      <div className="min-h-dvh bg-teal flex items-center justify-center text-cream text-3xl font-display">
        Loading…
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-teal text-cream texture-dark flex flex-col relative overflow-hidden">
      <FloatingQuestionMarks className="text-cream/10" />
      <Header variant="dark" />
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-10 text-center">
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

      {session.phase === 'overview' && (
        <OverviewBoard segments={segments} questions={questions} teams={teams} />
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
        <ScoreboardBoard
          finished={session.phase === 'finished'}
          sortedTeams={sortedTeams}
          orderedQuestions={orderedQuestions}
          submissions={submissions}
        />
      )}
      </div>
      <Footer variant="dark" />
    </div>
  )
}

function answerLabelFor(question: Question, submission: Submission) {
  return question.type === 'single_choice'
    ? question.options?.find((o) => o.id === submission.answer)?.text ?? submission.answer
    : submission.answer
}

function lastGradedAnswer(
  teamId: string,
  wantCorrect: boolean,
  orderedQuestions: Question[],
  submissions: Submission[],
) {
  for (let i = orderedQuestions.length - 1; i >= 0; i--) {
    const question = orderedQuestions[i]
    const sub = submissions.find(
      (s) => s.teamId === teamId && s.questionId === question.id && s.graded && s.correct === wantCorrect,
    )
    if (sub) return { question, answerLabel: answerLabelFor(question, sub) }
  }
  return null
}

function ScoreboardBoard({
  finished,
  sortedTeams,
  orderedQuestions,
  submissions,
}: {
  finished: boolean
  sortedTeams: Team[]
  orderedQuestions: Question[]
  submissions: Submission[]
}) {
  return (
    <>
      <h2 className="font-display text-5xl font-bold mb-8">
        {finished ? 'Final results 🏆' : 'Scoreboard'}
      </h2>
      <ol className="flex flex-col gap-3 w-full max-w-3xl">
        {sortedTeams.map((t, i) => {
          const lastCorrect = lastGradedAnswer(t.id, true, orderedQuestions, submissions)
          const lastIncorrect = lastGradedAnswer(t.id, false, orderedQuestions, submissions)
          return (
            <li key={t.id} className="rounded-2xl bg-cream text-ink px-6 py-4">
              <div className="flex items-center justify-between text-2xl">
                <span className="flex items-center gap-3">
                  <span className="text-ink/40 w-8 font-display font-bold">{i + 1}</span>
                  <Avatar avatar={t.avatar} className="w-9 h-9 text-3xl" />
                  <span className="font-semibold">{t.name}</span>
                </span>
                <span className="font-display font-bold">{t.score ?? 0}</span>
              </div>
              {(lastCorrect || lastIncorrect) && (
                <div className="mt-3 pt-3 border-t border-stone/20 grid sm:grid-cols-2 gap-2 text-left text-sm">
                  {lastCorrect && (
                    <p className="text-green">
                      <span className="font-semibold">✓ {lastCorrect.question.text}</span>
                      {' — '}
                      {lastCorrect.answerLabel}
                    </p>
                  )}
                  {lastIncorrect && (
                    <p className="text-red">
                      <span className="font-semibold">✕ {lastIncorrect.question.text}</span>
                      {' — '}
                      {lastIncorrect.answerLabel}
                    </p>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </>
  )
}

function OverviewBoard({
  segments,
  questions,
  teams,
}: {
  segments: Segment[]
  questions: Question[]
  teams: Team[]
}) {
  const sortedSegments = useMemo(() => [...segments].sort((a, b) => a.order - b.order), [segments])

  return (
    <>
      <h1 className="font-display text-5xl font-bold mb-10">What's coming up</h1>
      <div className="w-full max-w-4xl grid sm:grid-cols-2 gap-8 text-left">
        <div>
          <h2 className="font-display text-2xl font-bold mb-4 text-yellow">
            Segments ({sortedSegments.length})
          </h2>
          <ol className="flex flex-col gap-2">
            {sortedSegments.map((seg, i) => {
              const count = questions.filter((q) => q.segmentId === seg.id).length
              return (
                <li
                  key={seg.id}
                  className="flex items-center justify-between rounded-xl bg-cream/10 px-4 py-3 text-xl"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-cream/50 w-6 font-display font-bold">{i + 1}</span>
                    {seg.title}
                  </span>
                  <span className="text-cream/60 text-base">
                    {count} question{count === 1 ? '' : 's'}
                  </span>
                </li>
              )
            })}
            {sortedSegments.length === 0 && <p className="text-cream/60 text-lg">No segments yet.</p>}
          </ol>
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold mb-4 text-yellow">Teams ({teams.length})</h2>
          <div className="flex flex-wrap gap-3">
            {teams.map((t) => (
              <span
                key={t.id}
                className="bg-cream text-ink rounded-pill px-4 py-2 text-lg font-semibold inline-flex items-center gap-2"
              >
                <Avatar avatar={t.avatar} className="w-6 h-6 text-xl" /> {t.name}
              </span>
            ))}
            {teams.length === 0 && <p className="text-cream/60 text-lg">No teams joined yet.</p>}
          </div>
        </div>
      </div>
    </>
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
