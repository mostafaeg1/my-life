import { useCallback, useEffect, useState } from 'react'
import { PROJECT_COLORS } from '../constants/projectColors'
import type { ActiveSession, AppState, Project, ProjectUpdates } from '../types'
const STORAGE_KEY = 'project-time-tracker'

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { projects: [], activeSession: null, sessions: [] }
    }

    const parsed = JSON.parse(raw) as AppState
    return {
      projects: (parsed.projects ?? []).map((project) => ({
        ...project,
        labels: project.labels ?? [],
      })),
      activeSession: parsed.activeSession ?? null,
      sessions: parsed.sessions ?? [],
    }
  } catch {
    return { projects: [], activeSession: null, sessions: [] }
  }
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function createId() {
  return crypto.randomUUID()
}

export function useTimeTracker() {
  const [state, setState] = useState<AppState>(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  const addProject = useCallback((name: string, labels: string[] = []) => {
    const trimmed = name.trim()
    if (!trimmed) return false

    let added = false

    setState((current) => {
      const exists = current.projects.some(
        (project) => project.name.toLowerCase() === trimmed.toLowerCase(),
      )
      if (exists) return current

      added = true
      const project: Project = {
        id: createId(),
        name: trimmed,
        color: PROJECT_COLORS[current.projects.length % PROJECT_COLORS.length],
        totalSeconds: 0,
        createdAt: new Date().toISOString(),
        labels,
      }

      return {
        ...current,
        projects: [project, ...current.projects],
      }
    })

    return added
  }, [])

  const deleteProject = useCallback((projectId: string) => {
    setState((current) => ({
      projects: current.projects.filter((project) => project.id !== projectId),
      activeSession:
        current.activeSession?.projectId === projectId ? null : current.activeSession,
      sessions: current.sessions.filter((session) => session.projectId !== projectId),
    }))
  }, [])

  const updateProject = useCallback(
    (projectId: string, updates: ProjectUpdates) => {
      const trimmed = updates.name.trim()
      if (!trimmed) return false

      let updated = false

      setState((current) => {
        const project = current.projects.find((item) => item.id === projectId)
        if (!project) return current

        const duplicate = current.projects.some(
          (item) =>
            item.id !== projectId && item.name.toLowerCase() === trimmed.toLowerCase(),
        )
        if (duplicate) return current

        updated = true

        const newTotal = Math.max(0, Math.floor(updates.totalSeconds))
        const delta = newTotal - project.totalSeconds
        let sessions = current.sessions

        // Keep the dashboard (built from session records) in sync with the edited total.
        if (delta > 0) {
          const endedAt = new Date()
          sessions = [
            ...sessions,
            {
              id: createId(),
              projectId,
              startedAt: new Date(endedAt.getTime() - delta * 1000).toISOString(),
              endedAt: endedAt.toISOString(),
              seconds: delta,
            },
          ]
        } else if (delta < 0) {
          // Remove time from the most recent sessions first.
          let remaining = -delta
          const trimmedSessions: typeof sessions = []
          for (const session of [...sessions].reverse()) {
            if (session.projectId !== projectId || remaining <= 0) {
              trimmedSessions.push(session)
              continue
            }
            if (session.seconds <= remaining) {
              remaining -= session.seconds
              continue
            }
            trimmedSessions.push({ ...session, seconds: session.seconds - remaining })
            remaining = 0
          }
          sessions = trimmedSessions.reverse()
        }

        return {
          ...current,
          sessions,
          projects: current.projects.map((item) =>
            item.id === projectId
              ? {
                  ...item,
                  name: trimmed,
                  color: updates.color,
                  labels: updates.labels,
                  totalSeconds: newTotal,
                }
              : item,
          ),
        }
      })

      return updated
    },
    [],
  )

  const startSession = useCallback((projectId: string) => {
    setState((current) => {
      const project = current.projects.find((item) => item.id === projectId)
      if (!project) return current

      const activeSession: ActiveSession = {
        projectId,
        startedAt: new Date().toISOString(),
      }

      return { ...current, activeSession }
    })
  }, [])

  const stopSession = useCallback(() => {
    setState((current) => {
      if (!current.activeSession) return current

      const { projectId, startedAt } = current.activeSession
      const endedAt = new Date().toISOString()
      const elapsed = Math.max(
        0,
        Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000),
      )

      return {
        activeSession: null,
        projects: current.projects.map((project) =>
          project.id === projectId
            ? { ...project, totalSeconds: project.totalSeconds + elapsed }
            : project,
        ),
        sessions:
          elapsed > 0
            ? [
                ...current.sessions,
                { id: createId(), projectId, startedAt, endedAt, seconds: elapsed },
              ]
            : current.sessions,
      }
    })
  }, [])

  /** Ends the running session without recording any of its time. */
  const cancelSession = useCallback(() => {
    setState((current) => (current.activeSession ? { ...current, activeSession: null } : current))
  }, [])

  const getProject = useCallback(
    (projectId: string) => state.projects.find((project) => project.id === projectId),
    [state.projects],
  )

  return {
    projects: state.projects,
    activeSession: state.activeSession,
    sessions: state.sessions,
    addProject,
    deleteProject,
    updateProject,
    startSession,
    stopSession,
    cancelSession,
    getProject,
  }
}
