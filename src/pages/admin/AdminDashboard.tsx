import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  addQuestion,
  addSegment,
  addTeamScore,
  deleteQuestion,
  deleteSegment,
  deleteTeam,
  gradeSubmission,
  subscribeQuestions,
  subscribeSegments,
  subscribeSession,
  subscribeSubmissions,
  subscribeTeams,
  updateQuestion,
  updateSegment,
  updateSession,
  resetQuiz,
} from '../../lib/store'
import type { Question, QuestionOption, Segment, SessionDoc, Submission, Team } from '../../types'
import { Avatar, Button, Card, Pill } from '../../components/ui'

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'build' | 'live'>('build')
  const [session, setSession] = useState<(SessionDoc & { id: string }) | null>(null)
  const [segments, setSegments] = useState<Segment[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])

  useEffect(() => {
    const u1 = subscribeSession(setSession)
    const u2 = subscribeSegments(setSegments)
    const u3 = subscribeQuestions(setQuestions)
    const u4 = subscribeTeams(setTeams)
    const u5 = subscribeSubmissions(setSubmissions)
    return () => {
      u1()
      u2()
      u3()
      u4()
      u5()
    }
  }, [])

  useEffect(() => {
    if (!loading && (!user || (session && session.adminUid && session.adminUid !== user.uid))) {
      // not admin yet — let AdminLogin handle claiming; but if session has a different admin, block
    }
  }, [loading, user, session])

  if (loading || !session) {
    return <div className="min-h-dvh flex items-center justify-center">Loading…</div>
  }

  if (user && session.adminUid && session.adminUid !== user.uid) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-display text-xl font-bold">Admin already active</p>
        <p className="text-ink/70">Someone else is already running this session as quizmaster.</p>
      </div>
    )
  }

  if (!session.adminUid) {
    navigate('/admin')
    return null
  }

  return (
    <div className="min-h-dvh bg-cream text-ink">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <header className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <h1 className="font-display text-2xl font-bold text-teal">Quizmaster panel</h1>
          <div className="flex items-center gap-3">
            <a
              href={`${import.meta.env.BASE_URL}present`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-teal underline"
            >
              Open present view ↗
            </a>
            <Pill className="bg-teal text-cream text-lg tracking-widest">{session.joinCode}</Pill>
          </div>
        </header>

        <div className="flex gap-2 mb-6">
          <TabButton active={tab === 'build'} onClick={() => setTab('build')}>
            Build quiz
          </TabButton>
          <TabButton active={tab === 'live'} onClick={() => setTab('live')}>
            Run live
          </TabButton>
        </div>

        {tab === 'build' && <BuildTab segments={segments} questions={questions} />}
        {tab === 'live' && (
          <LiveTab
            session={session}
            segments={segments}
            questions={questions}
            teams={teams}
            submissions={submissions}
          />
        )}
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-pill px-5 py-2 font-display font-semibold ${
        active ? 'bg-teal text-cream' : 'bg-cream-dim text-ink/70'
      }`}
    >
      {children}
    </button>
  )
}

// ---------- Build tab ----------

function BuildTab({ segments, questions }: { segments: Segment[]; questions: Question[] }) {
  const [newSegmentTitle, setNewSegmentTitle] = useState('')

  async function handleAddSegment(e: React.FormEvent) {
    e.preventDefault()
    if (!newSegmentTitle.trim()) return
    await addSegment(newSegmentTitle.trim(), segments.length)
    setNewSegmentTitle('')
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <form onSubmit={handleAddSegment} className="flex gap-2">
          <input
            value={newSegmentTitle}
            onChange={(e) => setNewSegmentTitle(e.target.value)}
            placeholder="New segment name (e.g. Geography)"
            className="flex-1 rounded-xl border border-stone/40 bg-white px-4 py-2"
          />
          <Button type="submit" variant="secondary">
            Add segment
          </Button>
        </form>
      </Card>

      {segments.map((seg) => (
        <SegmentBlock key={seg.id} segment={seg} questions={questions.filter((q) => q.segmentId === seg.id)} />
      ))}
    </div>
  )
}

function SegmentBlock({ segment, questions }: { segment: Segment; questions: Question[] }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(segment.title)
  const [adding, setAdding] = useState(false)

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        {editing ? (
          <div className="flex gap-2 flex-1">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 rounded-lg border border-stone/40 px-2 py-1"
            />
            <Button
              variant="ghost"
              onClick={async () => {
                await updateSegment(segment.id, { title })
                setEditing(false)
              }}
            >
              Save
            </Button>
          </div>
        ) : (
          <h3 className="font-display text-lg font-bold">{segment.title}</h3>
        )}
        <div className="flex gap-2 ml-2">
          {!editing && (
            <button className="text-sm text-ink/50 underline" onClick={() => setEditing(true)}>
              Rename
            </button>
          )}
          <button className="text-sm text-red underline" onClick={() => deleteSegment(segment.id)}>
            Delete
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {questions
          .sort((a, b) => a.order - b.order)
          .map((q) => (
            <QuestionRow key={q.id} question={q} />
          ))}
      </div>

      {adding ? (
        <QuestionForm
          segmentId={segment.id}
          nextOrder={questions.length}
          onDone={() => setAdding(false)}
        />
      ) : (
        <button
          className="mt-3 text-sm font-semibold text-teal underline"
          onClick={() => setAdding(true)}
        >
          + Add question
        </button>
      )}
    </Card>
  )
}

function QuestionRow({ question }: { question: Question }) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <QuestionForm
        segmentId={question.segmentId}
        nextOrder={question.order}
        existing={question}
        onDone={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="rounded-xl bg-cream-dim px-3 py-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {question.imageUrl && (
          <img src={question.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
        )}
        <div className="min-w-0">
          <p className="font-semibold truncate">{question.text}</p>
          <p className="text-xs text-ink/50">
            {question.type === 'single_choice' ? 'Multiple choice' : 'Text answer'} · {question.points} pts
          </p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button className="text-sm underline" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button className="text-sm text-red underline" onClick={() => deleteQuestion(question.id)}>
          Delete
        </button>
      </div>
    </div>
  )
}

function QuestionForm({
  segmentId,
  nextOrder,
  existing,
  onDone,
}: {
  segmentId: string
  nextOrder: number
  existing?: Question
  onDone: () => void
}) {
  const [text, setText] = useState(existing?.text ?? '')
  const [type, setType] = useState<Question['type']>(existing?.type ?? 'single_choice')
  const [options, setOptions] = useState<QuestionOption[]>(
    existing?.options ?? [
      { id: crypto.randomUUID(), text: '' },
      { id: crypto.randomUUID(), text: '' },
    ],
  )
  const [correctOptionId, setCorrectOptionId] = useState<string | null>(existing?.correctOptionId ?? null)
  const [points, setPoints] = useState(existing?.points ?? 10)
  const [imageUrl, setImageUrl] = useState(existing?.imageUrl ?? '')

  async function handleSave() {
    if (!text.trim()) return
    const payload: Omit<Question, 'id'> = {
      segmentId,
      order: existing?.order ?? nextOrder,
      text: text.trim(),
      imageUrl: imageUrl || null,
      type,
      points,
      options: type === 'single_choice' ? options.filter((o) => o.text.trim()) : [],
      correctOptionId: type === 'single_choice' ? correctOptionId : null,
    }
    if (existing) {
      await updateQuestion(existing.id, payload)
    } else {
      await addQuestion(payload)
    }
    onDone()
  }

  return (
    <div className="rounded-xl border border-teal/30 bg-white p-3 flex flex-col gap-3 mt-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Question text"
        className="w-full rounded-lg border border-stone/40 px-3 py-2"
        rows={2}
      />

      <div className="flex items-center gap-3">
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Image URL (optional) — paste a link"
          className="flex-1 rounded-lg border border-stone/40 px-3 py-2 text-sm"
        />
        {imageUrl && <img src={imageUrl} alt="" className="w-12 h-12 rounded object-cover" />}
      </div>

      <div className="flex gap-4 items-center">
        <label className="text-sm font-semibold">Answer type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as Question['type'])}
          className="rounded-lg border border-stone/40 px-2 py-1"
        >
          <option value="single_choice">Multiple choice (pick one)</option>
          <option value="text">Text answer</option>
        </select>
        <label className="text-sm font-semibold ml-auto">Points</label>
        <input
          type="number"
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          className="w-16 rounded-lg border border-stone/40 px-2 py-1"
        />
      </div>

      {type === 'single_choice' && (
        <div className="flex flex-col gap-2">
          {options.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-2">
              <input
                type="radio"
                checked={correctOptionId === opt.id}
                onChange={() => setCorrectOptionId(opt.id)}
                title="Mark as correct answer"
              />
              <input
                value={opt.text}
                onChange={(e) => {
                  const next = [...options]
                  next[i] = { ...opt, text: e.target.value }
                  setOptions(next)
                }}
                placeholder={`Option ${i + 1}`}
                className="flex-1 rounded-lg border border-stone/40 px-2 py-1"
              />
              {options.length > 2 && (
                <button
                  className="text-red text-sm"
                  onClick={() => setOptions(options.filter((o) => o.id !== opt.id))}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            className="text-sm text-teal underline self-start"
            onClick={() => setOptions([...options, { id: crypto.randomUUID(), text: '' }])}
          >
            + Add option
          </button>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save question</Button>
      </div>
    </div>
  )
}

// ---------- Live tab ----------

function LiveTab({
  session,
  segments,
  questions,
  teams,
  submissions,
}: {
  session: SessionDoc & { id: string }
  segments: Segment[]
  questions: Question[]
  teams: Team[]
  submissions: Submission[]
}) {
  const orderedQuestions = useMemo(() => {
    const bySegment = [...segments].sort((a, b) => a.order - b.order)
    return bySegment.flatMap((seg) =>
      questions.filter((q) => q.segmentId === seg.id).sort((a, b) => a.order - b.order),
    )
  }, [segments, questions])

  const currentIndex = orderedQuestions.findIndex((q) => q.id === session.currentQuestionId)
  const currentQuestion = orderedQuestions[currentIndex] ?? null
  const currentSubs = submissions.filter((s) => s.questionId === currentQuestion?.id)

  async function startQuiz() {
    const first = orderedQuestions[0]
    if (!first) return
    await updateSession({
      phase: 'question',
      currentSegmentId: first.segmentId,
      currentQuestionId: first.id,
    })
  }

  async function lockAnswers() {
    await updateSession({ phase: 'locked' })
  }

  async function reveal() {
    if (!currentQuestion) return
    if (currentQuestion.type === 'single_choice') {
      for (const sub of currentSubs) {
        const correct = sub.answer === currentQuestion.correctOptionId
        if (!sub.graded) {
          await gradeSubmission(sub.id, correct, currentQuestion.points)
          if (correct) await addTeamScore(sub.teamId, currentQuestion.points)
        }
      }
    }
    await updateSession({ phase: 'reveal' })
  }

  async function showScoreboard() {
    await updateSession({ phase: 'scoreboard' })
  }

  async function nextQuestion() {
    const next = orderedQuestions[currentIndex + 1]
    if (!next) {
      await updateSession({ phase: 'finished' })
      return
    }
    await updateSession({
      phase: 'question',
      currentSegmentId: next.segmentId,
      currentQuestionId: next.id,
    })
  }

  async function handleReset() {
    if (
      !window.confirm(
        'Restart the quiz from the beginning? This clears all submissions and resets every team’s score to 0. Questions and joined teams stay put.',
      )
    ) {
      return
    }
    await resetQuiz()
  }

  async function goToQuestion(index: number) {
    const q = orderedQuestions[index]
    if (!q) return
    await updateSession({
      phase: 'question',
      currentSegmentId: q.segmentId,
      currentQuestionId: q.id,
    })
  }

  async function grade(sub: Submission, correct: boolean) {
    if (!currentQuestion) return
    const prevAwarded = sub.pointsAwarded ?? 0
    await gradeSubmission(sub.id, correct, currentQuestion.points)
    const newAwarded = correct ? currentQuestion.points : 0
    const delta = newAwarded - prevAwarded
    if (delta !== 0) await addTeamScore(sub.teamId, delta)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-ink/50">Phase</p>
            <p className="font-display text-xl font-bold capitalize">{session.phase}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {session.phase === 'lobby' && (
              <Button onClick={startQuiz} disabled={orderedQuestions.length === 0}>
                Start quiz
              </Button>
            )}
            {session.phase === 'question' && <Button onClick={lockAnswers}>Lock answers</Button>}
            {session.phase === 'locked' && <Button onClick={reveal}>Reveal answer</Button>}
            {session.phase === 'reveal' && <Button onClick={showScoreboard}>Show scoreboard</Button>}
            {session.phase === 'scoreboard' && (
              <Button onClick={nextQuestion}>
                {currentIndex + 1 >= orderedQuestions.length ? 'Finish quiz' : 'Next question'}
              </Button>
            )}
            {session.phase !== 'lobby' && (
              <Button variant="danger" onClick={handleReset}>
                Restart quiz
              </Button>
            )}
          </div>
        </div>

        {session.phase !== 'lobby' && orderedQuestions.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone/20">
            <button
              className="text-sm font-semibold text-teal underline disabled:opacity-30 disabled:no-underline"
              disabled={currentIndex <= 0}
              onClick={() => goToQuestion(currentIndex - 1)}
            >
              ← Previous question
            </button>
            <span className="text-xs text-ink/50">
              {currentIndex >= 0
                ? `Question ${currentIndex + 1} of ${orderedQuestions.length}`
                : 'Jump to a question'}
            </span>
            <button
              className="text-sm font-semibold text-teal underline disabled:opacity-30 disabled:no-underline"
              disabled={currentIndex < 0 || currentIndex + 1 >= orderedQuestions.length}
              onClick={() => goToQuestion(currentIndex + 1)}
            >
              Next question →
            </button>
          </div>
        )}
      </Card>

      <Card>
        <p className="text-sm text-ink/50 mb-2">
          Teams in lobby ({teams.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {teams.map((t) => (
            <Pill key={t.id} className="bg-cream-dim">
              <Avatar avatar={t.avatar} className="w-5 h-5" /> {t.name} · {t.score ?? 0}pts
              <button
                className="ml-2 text-red"
                title="Remove team"
                onClick={() => deleteTeam(t.id)}
              >
                ✕
              </button>
            </Pill>
          ))}
        </div>
      </Card>

      {currentQuestion && (
        <Card>
          <p className="text-sm text-ink/50 mb-1">
            Question {currentIndex + 1} of {orderedQuestions.length}
          </p>
          <h3 className="font-display text-lg font-bold mb-3">{currentQuestion.text}</h3>

          <p className="text-sm font-semibold mb-2">
            Submissions ({currentSubs.length}/{teams.length})
          </p>
          <div className="flex flex-col gap-2">
            {currentSubs.map((sub) => {
              const team = teams.find((t) => t.id === sub.teamId)
              const answerLabel =
                currentQuestion.type === 'single_choice'
                  ? currentQuestion.options?.find((o) => o.id === sub.answer)?.text ?? sub.answer
                  : sub.answer
              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-cream-dim px-3 py-2"
                >
                  <span className="min-w-0 truncate">
                    <span className="font-semibold inline-flex items-center gap-1">
                      {team && <Avatar avatar={team.avatar} className="w-4 h-4" />} {team?.name}:
                    </span>{' '}
                    {answerLabel}
                  </span>
                  {currentQuestion.type === 'text' ? (
                    <div className="flex gap-1 shrink-0">
                      <button
                        className={`rounded-full px-2 py-1 text-xs font-bold ${
                          sub.graded && sub.correct ? 'bg-green text-cream' : 'bg-white'
                        }`}
                        onClick={() => grade(sub, true)}
                      >
                        ✓
                      </button>
                      <button
                        className={`rounded-full px-2 py-1 text-xs font-bold ${
                          sub.graded && sub.correct === false ? 'bg-red text-cream' : 'bg-white'
                        }`}
                        onClick={() => grade(sub, false)}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    sub.graded && (
                      <span className={sub.correct ? 'text-green' : 'text-red'}>
                        {sub.correct ? '✓' : '✕'}
                      </span>
                    )
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

