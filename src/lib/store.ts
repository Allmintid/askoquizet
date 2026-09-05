import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  addDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Question, Segment, SessionDoc, SessionPhase, Submission, Team } from '../types'

const SESSION_ID = 'main'
const sessionRef = doc(db, 'sessions', SESSION_ID)
const segmentsCol = collection(db, 'sessions', SESSION_ID, 'segments')
const questionsCol = collection(db, 'sessions', SESSION_ID, 'questions')
const teamsCol = collection(db, 'sessions', SESSION_ID, 'teams')
const submissionsCol = collection(db, 'sessions', SESSION_ID, 'submissions')

export function genJoinCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function ensureSessionExists() {
  const snap = await getDoc(sessionRef)
  if (!snap.exists()) {
    await setDoc(sessionRef, {
      joinCode: genJoinCode(),
      phase: 'lobby' as SessionPhase,
      currentSegmentId: null,
      currentQuestionId: null,
      createdAt: serverTimestamp(),
    })
  }
}

export function subscribeSession(cb: (s: (SessionDoc & { id: string }) | null) => void) {
  return onSnapshot(sessionRef, (snap) => {
    if (!snap.exists()) return cb(null)
    cb({ id: snap.id, ...(snap.data() as SessionDoc) })
  })
}

export async function claimAdmin(uid: string, passcode: string) {
  await updateDoc(sessionRef, {
    adminUid: uid,
    passcodeAttempt: passcode,
  })
}

export function updateSession(patch: Partial<SessionDoc>) {
  return updateDoc(sessionRef, patch)
}

// Segments
export function subscribeSegments(cb: (segs: Segment[]) => void) {
  const q = query(segmentsCol, orderBy('order'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Segment, 'id'>) })))
  })
}

export function addSegment(title: string, order: number) {
  return addDoc(segmentsCol, { title, order })
}

export function updateSegment(id: string, patch: Partial<Segment>) {
  return updateDoc(doc(segmentsCol, id), patch)
}

export function deleteSegment(id: string) {
  return deleteDoc(doc(segmentsCol, id))
}

// Questions
export function subscribeQuestions(cb: (qs: Question[]) => void) {
  const q = query(questionsCol, orderBy('order'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Question, 'id'>) })))
  })
}

export function addQuestion(question: Omit<Question, 'id'>) {
  return addDoc(questionsCol, question)
}

export function updateQuestion(id: string, patch: Partial<Question>) {
  return updateDoc(doc(questionsCol, id), patch)
}

export function deleteQuestion(id: string) {
  return deleteDoc(doc(questionsCol, id))
}

// Teams
export function subscribeTeams(cb: (teams: Team[]) => void) {
  return onSnapshot(teamsCol, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Team, 'id'>) })))
  })
}

export async function joinTeam(name: string, avatar: string, uid: string): Promise<string> {
  const ref = doc(teamsCol)
  await setDoc(ref, {
    name,
    nameLower: name.trim().toLowerCase(),
    avatar,
    uid,
    score: 0,
    joinedAt: serverTimestamp(),
  })
  return ref.id
}

export function deleteTeam(id: string) {
  return deleteDoc(doc(teamsCol, id))
}

// Submissions
export function subscribeSubmissions(cb: (subs: Submission[]) => void) {
  return onSnapshot(submissionsCol, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Submission, 'id'>) })))
  })
}

export function submissionId(questionId: string, teamId: string) {
  return `${questionId}_${teamId}`
}

export async function submitAnswer(
  questionId: string,
  teamId: string,
  teamUid: string,
  answer: string,
) {
  const ref = doc(submissionsCol, submissionId(questionId, teamId))
  await setDoc(ref, {
    questionId,
    teamId,
    teamUid,
    answer,
    submittedAt: serverTimestamp(),
    graded: false,
    correct: null,
    pointsAwarded: 0,
  })
}

export function gradeSubmission(id: string, correct: boolean, points: number) {
  return updateDoc(doc(submissionsCol, id), {
    graded: true,
    correct,
    pointsAwarded: correct ? points : 0,
  })
}

export async function setSubmissionPoints(questionId: string, teamId: string, points: number) {
  const ref = doc(submissionsCol, submissionId(questionId, teamId))
  const snap = await getDoc(ref)
  if (snap.exists()) {
    await updateDoc(ref, { graded: true, correct: points > 0, pointsAwarded: points })
  } else {
    await setDoc(ref, {
      questionId,
      teamId,
      teamUid: '',
      answer: '',
      submittedAt: serverTimestamp(),
      graded: true,
      correct: points > 0,
      pointsAwarded: points,
    })
  }
}

export function addTeamScore(teamId: string, delta: number) {
  return updateDoc(doc(teamsCol, teamId), {
    score: increment(delta),
  })
}

// Rerun the quiz from the start: back to lobby, submissions cleared, scores
// zeroed. Questions/segments and joined teams are left untouched.
export async function resetQuiz() {
  const [subsSnap, teamsSnap] = await Promise.all([getDocs(submissionsCol), getDocs(teamsCol)])

  const batch = writeBatch(db)
  subsSnap.docs.forEach((d) => batch.delete(d.ref))
  teamsSnap.docs.forEach((d) => batch.update(d.ref, { score: 0 }))
  batch.update(sessionRef, {
    phase: 'lobby',
    currentSegmentId: null,
    currentQuestionId: null,
  })
  await batch.commit()
}
