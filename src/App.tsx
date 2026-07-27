import { useEffect, useState } from 'react'
import { AddProjectForm } from './components/AddProjectForm'
import { Dashboard } from './components/Dashboard'
import { FocusSession } from './components/FocusSession'
import { ProjectList } from './components/ProjectList'
import { useTimeTracker } from './hooks/useTimeTracker'
import { elapsedSecondsSince, formatToday } from './utils/time'
import './App.css'

type View = 'tracker' | 'dashboard'

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

  const [view, setView] = useState<View>('tracker')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0)

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
    const confirmed = window.confirm('Delete this project and its tracked time?')
    if (!confirmed) return

    deleteProject(projectId)
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null)
    }
    if (editingProjectId === projectId) {
      setEditingProjectId(null)
    }
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

        <div className="sidebar-footer">
          <AddProjectForm onAdd={addProject} />
        </div>
      </aside>

      <div className="main-content">
        <header className="app-header">
          <div>
            <p className="eyebrow">Focus tracker</p>
            <h1>{view === 'dashboard' ? 'Dashboard' : 'Project Time Tracker'}</h1>
            <p className="today-date">{formatToday()}</p>
            <p className="subtitle">
              {view === 'dashboard'
                ? 'See how your focused time breaks down over the last week, month, or year.'
                : 'Track time on anything — homework, reading, side projects — one focus session at a time.'}
            </p>
          </div>
          <div className="summary-card">
            <span className="summary-label">Total tracked</span>
            <strong>
              {Math.floor(totalTrackedSeconds / 3600)}h{' '}
              {Math.floor((totalTrackedSeconds % 3600) / 60)}m
            </strong>
          </div>
        </header>

        {view === 'dashboard' ? (
          <Dashboard projects={projects} sessions={sessions} />
        ) : (
          <main className="focus-area">
            <FocusSession
              project={isRunning ? activeProject : selectedProject}
              isRunning={isRunning}
              liveElapsedSeconds={liveElapsedSeconds}
              onStart={handleStart}
              onStop={stopSession}
            />
          </main>
        )}
      </div>
    </div>
  )
}

export default App
