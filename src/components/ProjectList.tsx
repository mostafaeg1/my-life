import type { ActiveSession, Project } from '../types'
import { formatDurationShort } from '../utils/time'

interface ProjectListProps {
  projects: Project[]
  activeSession: ActiveSession | null
  selectedProjectId: string | null
  liveElapsedSeconds: number
  onSelect: (projectId: string) => void
  onEdit: (projectId: string) => void
  onDelete: (projectId: string) => void
}

export function ProjectList({
  projects,
  activeSession,
  selectedProjectId,
  liveElapsedSeconds,
  onSelect,
  onEdit,
  onDelete,
}: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="empty-state">
        <p>No projects yet.</p>
        <p>Use “New” to add your first one.</p>
      </div>
    )
  }

  return (
    <ul className="project-list">
      {projects.map((project) => {
        const isActive = activeSession?.projectId === project.id
        const isSelected = selectedProjectId === project.id
        const displaySeconds = isActive
          ? project.totalSeconds + liveElapsedSeconds
          : project.totalSeconds

        return (
          <li
            key={project.id}
            className={`project-card ${isSelected ? 'selected' : ''} ${isActive ? 'active' : ''}`}
          >
            <button type="button" className="project-select" onClick={() => onSelect(project.id)}>
              <span className="project-color" style={{ backgroundColor: project.color }} />
              <span className="project-info">
                <span className="project-name-row">
                  <span className="project-name">{project.name}</span>
                  {isActive ? <span className="live-badge">Live</span> : null}
                </span>
                <span className="project-time">{formatDurationShort(displaySeconds)} total</span>
              </span>
            </button>
            <div className="project-actions">
              <button
                type="button"
                className="button button-secondary button-small"
                aria-label={`Edit ${project.name}`}
                onClick={() => onEdit(project.id)}
              >
                Edit
              </button>
              <button
                type="button"
                className="icon-button icon-button-plain"
                aria-label={`Delete ${project.name}`}
                onClick={() => onDelete(project.id)}
              >
                ×
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
