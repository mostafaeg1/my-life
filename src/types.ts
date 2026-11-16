export interface Project {
  id: string
  name: string
  color: string
  totalSeconds: number
  createdAt: string
  labels: string[]
}

export type ProjectUpdates = Pick<Project, 'name' | 'color' | 'labels' | 'totalSeconds'>

export interface ActiveSession {
  projectId: string
  startedAt: string
}

export interface SessionRecord {
  id: string
  projectId: string
  startedAt: string
  endedAt: string
  seconds: number
}

export interface AppState {
  projects: Project[]
  activeSession: ActiveSession | null
  sessions: SessionRecord[]
}

export interface Habit {
  id: string
  name: string
  color: string
  createdAt: string
  completedDates: string[]
  labels: string[]
}
