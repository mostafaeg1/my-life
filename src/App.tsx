import { useEffect, useState } from 'react'
import { ConfirmDialog } from './components/ConfirmDialog'
import { Dashboard } from './components/Dashboard'
import { FocusSession, type SessionMode } from './components/FocusSession'
import { Habits } from './components/Habits'
import { ProjectList } from './components/ProjectList'
import { PromptDialog } from './components/PromptDialog'
import { useHabits } from './hooks/useHabits'
import { useTimeTracker } from './hooks/useTimeTracker'
import { elapsedSecondsSince, formatToday } from './utils/time'
import './App.css'

type View = 'tracker' | 'dashboard' | 'habits'

function App() {
  const {
    projects,
    activeSession,
    sessions,
    addProject,
    deleteProject,
    updateProject,
    startSession,
    stopSession,
    getProject,
  } = useTimeTracker()

  const { habits, addHabit, deleteHabit, toggleDate } = useHabits()

  const [view, setView] = useState<View>('tracker')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0)
  const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<string | null>(null)
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false)
  const [sessionMode, setSessionMode] = useState<SessionMode>('stopwatch')
  const [durationMinutes, setDurationMinutes] = useState(25)

  useEffect(() => {
    if (!activeSession) {
      setLiveElapsedSeconds(0)
      return
    }

    setSelectedProjectId(activeSession.projectId)
    setLiveElapsedSeconds(elapsedSecondsSince(activeSession.startedAt))

    const interval = window.setInterval(() => {
      setLiveElapsedSeconds(elapsedSecondsSince(activeSession.startedAt))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [activeSession])

  const selectedProject = selectedProjectId ? getProject(selectedProjectId) : undefined
  const activeProject = activeSession ? getProject(activeSession.projectId) : undefined
  const isRunning = Boolean(activeSession && selectedProjectId === activeSession.projectId)

  function handleSelect(projectId: string) {
    if (activeSession && activeSession.projectId !== projectId) {
      return
    }

    setSelectedProjectId(projectId)
  }

  function handleStart() {
    if (!selectedProjectId) return
    startSession(selectedProjectId)
  }

  function handleToggleEdit(projectId: string) {
    setEditingProjectId((current) => (current === projectId ? null : projectId))
  }

  function handleCloseEdit() {
    setEditingProjectId(null)
  }

  function handleDelete(projectId: string) {
    setPendingDeleteProjectId(projectId)
  }

  function confirmDeleteProject() {
    const projectId = pendingDeleteProjectId
    if (!projectId) return

    deleteProject(projectId)
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null)
    }
    if (editingProjectId === projectId) {
      setEditingProjectId(null)
    }
    setPendingDeleteProjectId(null)
  }

  const totalTrackedSeconds = projects.reduce((sum, project) => {
    if (activeSession?.projectId === project.id) {
      return sum + project.totalSeconds + liveElapsedSeconds
    }

    return sum + project.totalSeconds
  }, 0)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <nav className="mode-switch app-nav" role="radiogroup" aria-label="View">
          <button
            type="button"
            className={`mode-button ${view === 'tracker' ? 'selected' : ''}`}
            aria-pressed={view === 'tracker'}
            onClick={() => setView('tracker')}
          >
            Tracker
          </button>
          <button
            type="button"
            className={`mode-button ${view === 'dashboard' ? 'selected' : ''}`}
            aria-pressed={view === 'dashboard'}
            onClick={() => setView('dashboard')}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={`mode-button ${view === 'habits' ? 'selected' : ''}`}
            aria-pressed={view === 'habits'}
            onClick={() => setView('habits')}
          >
            Habits
          </button>
        </nav>

        <div className="sidebar-header">
          <h2>Projects</h2>
          <span className="project-count">{projects.length}</span>
        </div>

        <div className="sidebar-content">
          <ProjectList
            projects={projects}
            activeSession={activeSession}
            selectedProjectId={selectedProjectId}
            editingProjectId={editingProjectId}
            liveElapsedSeconds={liveElapsedSeconds}
            onSelect={handleSelect}
            onToggleEdit={handleToggleEdit}
            onCloseEdit={handleCloseEdit}
            onSave={updateProject}
            onDelete={handleDelete}
          />
        </div>
      </aside>

      <div className="main-content">
        <header className="app-header">
          <div>
            <p className="eyebrow">My Life</p>
            <h1>
              {view === 'dashboard' ? 'Dashboard' : view === 'habits' ? 'Habits' : 'Project Time Tracker'}
            </h1>
            <p className="today-date">{formatToday()}</p>
            <p className="subtitle">
              {view === 'dashboard'
                ? 'See how your focused time breaks down over the last week, month, or year.'
                : view === 'habits'
                  ? "Build routines and don't break the chain."
                  : 'Track time on anything — homework, reading, side projects — one focus session at a time.'}
            </p>
          </div>
          {view === 'tracker' ? (
            <div className="summary-card">
              <span className="summary-label">Total tracked</span>
              <strong>
                {Math.floor(totalTrackedSeconds / 3600)}h{' '}
                {Math.floor((totalTrackedSeconds % 3600) / 60)}m
              </strong>
            </div>
          ) : null}
        </header>

        {view === 'dashboard' ? (
          <Dashboard projects={projects} sessions={sessions} />
        ) : view === 'habits' ? (
          <Habits habits={habits} onAdd={addHabit} onDelete={deleteHabit} onToggleDate={toggleDate} />
        ) : (
          <>
            <main className="focus-area">
              <FocusSession
                project={isRunning ? activeProject : selectedProject}
                isRunning={isRunning}
                liveElapsedSeconds={liveElapsedSeconds}
                mode={sessionMode}
                onModeChange={setSessionMode}
                durationMinutes={durationMinutes}
                onDurationMinutesChange={setDurationMinutes}
                onStart={handleStart}
                onStop={stopSession}
              />
            </main>

            <button
              type="button"
              className="fab-button"
              aria-label="Add project"
              onClick={() => setIsAddProjectOpen(true)}
            >
              +
            </button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={pendingDeleteProjectId !== null}
        title="Delete project?"
        message="This will delete the project and its tracked time. This can't be undone."
        confirmLabel="Delete"
        danger
        onConfirm={confirmDeleteProject}
        onCancel={() => setPendingDeleteProjectId(null)}
      />

      <PromptDialog
        open={isAddProjectOpen}
        title="Add project"
        placeholder="Math homework, reading..."
        confirmLabel="Add project"
        onSubmit={(name) => {
          const added = addProject(name)
          if (added) setIsAddProjectOpen(false)
          return added
        }}
        onCancel={() => setIsAddProjectOpen(false)}
      />
    </div>
  )
}

export default App
