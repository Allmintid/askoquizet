import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useConfirm } from '../../context/ConfirmContext'
import {
  subscribeQuestions,
  subscribeSession,
  subscribeSubmissions,
  subscribeTeams,
  submissionId,
  submitAnswer,
} from '../../lib/store'
import type { Question, SessionDoc, Submission, Team } from '../../types'
import { Avatar, Button, Card, PageShell, Pill } from '../../components/ui'

export default function PlayPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const [session, setSession] = useState<(SessionDoc & { id: string }) | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [textAnswer, setTextAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [teamsLoaded, setTeamsLoaded] = useState(false)

  const teamId = localStorage.getItem('askoquizet_team_id')

  useEffect(() => {
    if (!teamId) navigate('/join')
  }, [teamId, navigate])

  useEffect(() => {
    const unsub1 = subscribeSession(setSession)
    const unsub2 = subscribeQuestions(setQuestions)
    const unsub3 = subscribeTeams((t) => {
      setTeams(t)
      setTeamsLoaded(true)
    })
    const unsub4 = subscribeSubmissions(setSubmissions)
    return () => {
      unsub1()
      unsub2()
      unsub3()
      unsub4()
    }
  }, [])

  const me = teams.find((t) => t.id === teamId)

  useEffect(() => {
    if (teamsLoaded && teamId && !me) {
      localStorage.removeItem('askoquizet_team_id')
      localStorage.removeItem('askoquizet_team_name')
      navigate('/join')
    }
  }, [teamsLoaded, teamId, me, navigate])
  const currentQuestion = questions.find((q) => q.id === session?.currentQuestionId) ?? null

  useEffect(() => {
    setTextAnswer('')
    setSelectedOption(null)
  }, [currentQuestion?.id])

  const mySubmission = useMemo(() => {
    if (!currentQuestion || !teamId) return null
    return submissions.find((s) => s.id === submissionId(currentQuestion.id, teamId)) ?? null
  }, [submissions, currentQuestion, teamId])


  if (!teamId) return null

  if (!session || !me) {
    return (
      <PageShell>
        <div className="flex-1 flex items-center justify-center text-ink/60">Loading…</div>
      </PageShell>
    )
  }

  async function handleSubmit() {
    if (!currentQuestion || !user || !teamId) return
    const answer = currentQuestion.type === 'single_choice' ? selectedOption : textAnswer.trim()
    if (!answer) return

    const answerLabel =
      currentQuestion.type === 'single_choice'
        ? currentQuestion.options?.find((o) => o.id === answer)?.text ?? answer
        : answer
    const ok = await confirm({
      title: 'Är ni riktigt säkra?',
      description: `Ni svarar: "${answerLabel}" — ni kan inte ändra svaret efteråt.`,
      confirmLabel: 'Ja, skicka in',
      cancelLabel: 'Avbryt',
    })
    if (!ok) return

    setSubmitting(true)
    try {
      await submitAnswer(currentQuestion.id, teamId, user.uid, answer)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell>
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Avatar avatar={me.avatar} className="w-8 h-8 text-2xl" />
          <span className="font-display font-semibold">{me.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Pill className="bg-teal text-cream">{me.score ?? 0} pts</Pill>
          <button
            className="text-xs text-ink/40 underline"
            onClick={async () => {
              const ok = await confirm({
                title: 'Leave this team?',
                description: `You'll leave "${me.name}" and can join as a different team.`,
                confirmLabel: 'Leave',
                variant: 'danger',
              })
              if (!ok) return
              localStorage.removeItem('askoquizet_team_id')
              localStorage.removeItem('askoquizet_team_name')
              navigate('/join')
            }}
          >
            Leave
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        {session.phase === 'lobby' && (
          <Card className="flex-1 flex flex-col items-center justify-center text-center gap-3">
            <p className="text-2xl">🎉</p>
            <h2 className="font-display text-xl font-bold">You're in!</h2>
            <p className="text-ink/70">Waiting for the game to begin…</p>
            <div className="mt-4 w-full">
              <p className="text-sm font-semibold text-ink/60 mb-2">
                {teams.length} team{teams.length === 1 ? '' : 's'} joined
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {teams.map((t) => (
                  <Pill key={t.id} className="bg-cream-dim">
                    <Avatar avatar={t.avatar} className="w-5 h-5" /> {t.name}
                  </Pill>
                ))}
              </div>
            </div>
          </Card>
        )}

        {session.phase === 'question' && currentQuestion && (
          <QuestionView
            question={currentQuestion}
            mySubmission={mySubmission}
            textAnswer={textAnswer}
            setTextAnswer={setTextAnswer}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}

        {session.phase === 'locked' && currentQuestion && (
          <Card className="flex-1 flex flex-col items-center justify-center text-center gap-3">
            <p className="text-2xl">🔒</p>
            <h2 className="font-display text-xl font-bold">Answers are locked</h2>
            <p className="text-ink/70">
              {mySubmission ? 'Your answer is in! Sit tight.' : "Time's up — no answer submitted."}
            </p>
          </Card>
        )}

        {session.phase === 'reveal' && currentQuestion && (
          <RevealView question={currentQuestion} mySubmission={mySubmission} />
        )}

        {session.phase === 'scoreboard' && (
          <Card className="flex-1 flex flex-col items-center justify-center text-center gap-3">
            <p className="text-2xl">👀</p>
            <h2 className="font-display text-xl font-bold">Check the screen!</h2>
            <p className="text-ink/70">The scoreboard is up front. Next question coming up…</p>
          </Card>
        )}

        {session.phase === 'finished' && (
          <Card className="flex-1 flex flex-col items-center justify-center text-center gap-3">
            <p className="text-3xl">🏆</p>
            <h2 className="font-display text-xl font-bold">Quiz finished!</h2>
            <p className="text-ink/70">Final results are up on the screen.</p>
            <Pill className="bg-teal text-cream text-lg mt-2">Your score: {me.score ?? 0}</Pill>
          </Card>
        )}
      </div>
    </PageShell>
  )
}

function QuestionView({
  question,
  mySubmission,
  textAnswer,
  setTextAnswer,
  selectedOption,
  setSelectedOption,
  onSubmit,
  submitting,
}: {
  question: Question
  mySubmission: Submission | null
  textAnswer: string
  setTextAnswer: (v: string) => void
  selectedOption: string | null
  setSelectedOption: (v: string) => void
  onSubmit: () => void
  submitting: boolean
}) {
  if (mySubmission) {
    const answerLabel =
      question.type === 'single_choice'
        ? question.options?.find((o) => o.id === mySubmission.answer)?.text ?? mySubmission.answer
        : mySubmission.answer
    return (
      <Card className="flex-1 flex flex-col items-center justify-center text-center gap-3">
        <p className="text-2xl">✅</p>
        <h2 className="font-display text-xl font-bold">Answer submitted</h2>
        <p className="text-ink/70">
          You answered: <span className="font-semibold text-ink">{answerLabel}</span>
        </p>
        <p className="text-ink/50 text-sm">Waiting for the other teams…</p>
      </Card>
    )
  }

  return (
    <Card className="flex-1 flex flex-col gap-4">
      {question.imageUrl && (
        <img
          src={question.imageUrl}
          alt=""
          className="w-full rounded-xl object-cover max-h-56"
        />
      )}
      <h2 className="font-display text-xl font-bold">{question.text}</h2>

      {question.type === 'single_choice' ? (
        <div className="flex flex-col gap-2">
          {(question.options ?? []).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelectedOption(opt.id)}
              className={`text-left rounded-xl border px-4 py-3 transition ${
                selectedOption === opt.id
                  ? 'bg-teal text-cream border-teal'
                  : 'bg-white border-stone/40'
              }`}
            >
              {opt.text}
            </button>
          ))}
        </div>
      ) : (
        <textarea
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          placeholder="Type your answer…"
          rows={3}
          className="w-full rounded-xl border border-stone/40 bg-white px-4 py-3 text-lg"
        />
      )}

      <Button
        onClick={onSubmit}
        disabled={
          submitting || (question.type === 'single_choice' ? !selectedOption : !textAnswer.trim())
        }
        className="w-full text-xl mt-auto"
      >
        {submitting ? 'Submitting…' : 'Submit answer'}
      </Button>
    </Card>
  )
}

function RevealView({ question, mySubmission }: { question: Question; mySubmission: Submission | null }) {
  const correctOption =
    question.type === 'single_choice'
      ? (question.options ?? []).find((o) => o.id === question.correctOptionId)
      : null

  const gotIt = mySubmission?.graded && mySubmission.correct

  return (
    <Card className="flex-1 flex flex-col items-center justify-center text-center gap-3">
      <p className="text-3xl">{mySubmission ? (gotIt ? '🎉' : '❌') : '🤷'}</p>
      <h2 className="font-display text-xl font-bold">
        {question.type === 'single_choice'
          ? `Correct answer: ${correctOption?.text ?? '—'}`
          : 'Answers graded'}
      </h2>
      {mySubmission?.graded && (
        <p className="text-ink/70">
          {gotIt ? `Nice! +${mySubmission.pointsAwarded} points` : 'Not this time.'}
        </p>
      )}
    </Card>
  )
}
