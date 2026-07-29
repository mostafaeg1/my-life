import { useCallback, useEffect, useState } from 'react'
import { PROJECT_COLORS } from '../constants/projectColors'
import type { ActiveSession, AppState, Project } from '../types'
const STORAGE_KEY = 'project-time-tracker'

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { projects: [], activeSession: null, sessions: [] }
    }

    const parsed = JSON.parse(raw) as AppState
    return {
      projects: parsed.projects ?? [],
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

  const addProject = useCallback((name: string) => {
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
    (projectId: string, updates: Pick<Project, 'name' | 'color'>) => {
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
        return {
          ...current,
          projects: current.projects.map((item) =>
            item.id === projectId
              ? { ...item, name: trimmed, color: updates.color }
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
    getProject,
  }
}
