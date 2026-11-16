import { useCallback, useEffect, useMemo, useState } from 'react'
import { ConfirmDialog } from './components/ConfirmDialog'
import { Dashboard } from './components/Dashboard'
import { EditProjectDialog } from './components/EditProjectDialog'
import { FocusSession, type SessionMode } from './components/FocusSession'
import { HabitList } from './components/HabitList'
import { Habits } from './components/Habits'
import { ProjectList } from './components/ProjectList'
import { PromptDialog } from './components/PromptDialog'
import { useHabits } from './hooks/useHabits'
import { useTimeTracker } from './hooks/useTimeTracker'
import { toDateKey } from './utils/habitDates'
import { getAllLabels } from './utils/labels'
import { elapsedSecondsSince, formatClock, formatDuration, formatToday, isToday } from './utils/time'
import './App.css'

type View = 'tracker' | 'habits'
const DEFAULT_TITLE = 'My Life'

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
    cancelSession,
    getProject,
  } = useTimeTracker()

  const { habits, addHabit, deleteHabit, toggleDate, updateHabit } = useHabits()

  const [view, setView] = useState<View>('tracker')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0)
  const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<string | null>(null)
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false)
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false)
  const [isCancelSessionOpen, setIsCancelSessionOpen] = useState(false)
  const [sessionMode, setSessionMode] = useState<SessionMode>('stopwatch')
  const [durationMinutes, setDurationMinutes] = useState(25)

  useEffect(() => {
    if (!activeSession) {
      setLiveElapsedSeconds(0)
      setIsCancelSessionOpen(false)
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

  useEffect(() => {
    if (!isRunning || !activeProject) {
      document.title = DEFAULT_TITLE
      return
    }

    const displaySeconds =
      sessionMode === 'timer'
        ? Math.max(0, durationMinutes * 60 - liveElapsedSeconds)
        : liveElapsedSeconds

    document.title = `${formatClock(displaySeconds)} · ${activeProject.name}`

    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [isRunning, activeProject, sessionMode, durationMinutes, liveElapsedSeconds])

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

  // Stable callbacks so open dialogs aren't reset by the once-a-second timer re-render.
  const closeEdit = useCallback(() => setEditingProjectId(null), [])
  const closeAddProject = useCallback(() => setIsAddProjectOpen(false), [])
  const closeAddHabit = useCallback(() => setIsAddHabitOpen(false), [])
  const cancelDeleteProject = useCallback(() => setPendingDeleteProjectId(null), [])
  const keepSession = useCallback(() => setIsCancelSessionOpen(false), [])

  function confirmCancelSession() {
    cancelSession()
    setIsCancelSessionOpen(false)
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

  const todaysFocusedSeconds =
    sessions.reduce((sum, session) => (isToday(session.startedAt) ? sum + session.seconds : sum), 0) +
    (activeSession && isToday(activeSession.startedAt) ? liveElapsedSeconds : 0)

  const allLabels = useMemo(() => getAllLabels(projects), [projects])
  const todayKey = toDateKey(new Date())
  const habitsDoneToday = habits.filter((habit) => habit.completedDates.includes(todayKey)).length

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <nav className="segmented app-nav" role="radiogroup" aria-label="View">
          <button
            type="button"
            className={`segmented-option ${view === 'tracker' ? 'selected' : ''}`}
            aria-pressed={view === 'tracker'}
            onClick={() => setView('tracker')}
          >
            Tracker
          </button>
          <button
            type="button"
            className={`segmented-option ${view === 'habits' ? 'selected' : ''}`}
            aria-pressed={view === 'habits'}
            onClick={() => setView('habits')}
          >
            Habits
          </button>
        </nav>

        <div className="sidebar-header">
          <h2>{view === 'habits' ? 'Habits' : 'Projects'}</h2>
          <span className="count-badge">{view === 'habits' ? habits.length : projects.length}</span>
          <button
            type="button"
            className="button button-dark button-small sidebar-new-button"
            aria-label={view === 'habits' ? 'New habit' : 'New project'}
            onClick={() => (view === 'habits' ? setIsAddHabitOpen(true) : setIsAddProjectOpen(true))}
          >
            <span aria-hidden="true">+</span> New
          </button>
        </div>

        {view === 'tracker' ? (
          <div className="sidebar-content">
            <ProjectList
              projects={projects}
              activeSession={activeSession}
              selectedProjectId={selectedProjectId}
              liveElapsedSeconds={liveElapsedSeconds}
              onSelect={handleSelect}
              onEdit={setEditingProjectId}
              onDelete={handleDelete}
            />
          </div>
        ) : (
          <div className="sidebar-content">
            <HabitList habits={habits} />
          </div>
        )}
      </aside>

      <div className="main-content">
        <header className="app-header">
          <div>
            <p className="eyebrow">My Life · {formatToday()}</p>
            <h1>{view === 'habits' ? 'Habits' : 'Project Time Tracker'}</h1>
            <p className="subtitle">
              {view === 'habits'
                ? "Build routines and don't break the chain."
                : 'Track time on anything — homework, reading, side projects — one focus session at a time.'}
            </p>
          </div>
          {view === 'tracker' ? (
            <div className="summary-card">
              <span className="summary-label">Focused today</span>
              <strong>{formatDuration(todaysFocusedSeconds)}</strong>
            </div>
          ) : habits.length > 0 ? (
            <div className="summary-card">
              <span className="summary-label">Done today</span>
              <strong>
                {habitsDoneToday} / {habits.length}
              </strong>
            </div>
          ) : null}
        </header>

        {view === 'habits' ? (
          <Habits
            habits={habits}
            isAddOpen={isAddHabitOpen}
            onAddClose={closeAddHabit}
            onAdd={addHabit}
            onDelete={deleteHabit}
            onToggleDate={toggleDate}
            onUpdate={updateHabit}
          />
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
                onCancel={() => setIsCancelSessionOpen(true)}
              />
            </main>

            <Dashboard projects={projects} sessions={sessions} />
          </>
        )}
      </div>

      <EditProjectDialog
        project={editingProjectId ? getProject(editingProjectId) : undefined}
        availableLabels={allLabels}
        onSave={updateProject}
        onClose={closeEdit}
      />

      <ConfirmDialog
        open={pendingDeleteProjectId !== null}
        title="Delete project?"
        message="This will delete the project and its tracked time. This can't be undone."
        confirmLabel="Delete"
        danger
        onConfirm={confirmDeleteProject}
        onCancel={cancelDeleteProject}
      />

      <ConfirmDialog
        open={isCancelSessionOpen && isRunning}
        title="Cancel this session?"
        message={`The ${formatDuration(liveElapsedSeconds)} tracked so far won't be saved to ${activeProject?.name ?? 'this project'}.`}
        confirmLabel="Discard session"
        cancelLabel="Keep going"
        danger
        onConfirm={confirmCancelSession}
        onCancel={keepSession}
      />

      <PromptDialog
        open={isAddProjectOpen}
        title="New project"
        fieldLabel="Project name"
        placeholder="Math homework, reading..."
        confirmLabel="Add project"
        labelsField={{ label: 'Labels (optional)', availableLabels: allLabels }}
        onSubmit={(name, labels) => {
          const added = addProject(name, labels)
          if (added) setIsAddProjectOpen(false)
          return added
        }}
        onCancel={closeAddProject}
      />
    </div>
  )
}

export default App
