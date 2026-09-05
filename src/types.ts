export type SessionPhase =
  | 'lobby'
  | 'overview'
  | 'question'
  | 'locked'
  | 'reveal'
  | 'scoreboard'
  | 'finished'

export interface SessionDoc {
  joinCode: string
  phase: SessionPhase
  currentSegmentId: string | null
  currentQuestionId: string | null
  adminUid?: string
  createdAt?: unknown
}

export type QuestionType = 'single_choice' | 'text'

export interface QuestionOption {
  id: string
  text: string
}

export interface Segment {
  id: string
  title: string
  order: number
}

export interface Question {
  id: string
  segmentId: string
  order: number
  text: string
  imageUrl?: string | null
  type: QuestionType
  options?: QuestionOption[]
  correctOptionId?: string | null
  acceptedAnswerHint?: string
  points: number
}

export const AVATARS = [
  '🦊', '🐸', '🐼', '🦁', '🐨', '🐷', '🦄', '🐙',
  '🐧', '🦖', '🐶', '🐱', '🦉', '🐢', '🦆', '🐝',
]

export interface Team {
  id: string
  name: string
  nameLower: string
  avatar: string
  uid: string
  joinedAt?: unknown
  score?: number
}

export interface Submission {
  id: string
  questionId: string
  teamId: string
  teamUid: string
  answer: string
  submittedAt?: unknown
  graded: boolean
  correct: boolean | null
  pointsAwarded: number
}
