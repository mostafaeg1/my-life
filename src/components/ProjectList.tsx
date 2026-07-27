import { EditProjectSection } from './EditProjectSection'
import type { ActiveSession, Project } from '../types'
import { formatDuration } from '../utils/time'

interface ProjectListProps {
  projects: Project[]
  activeSession: ActiveSession | null
  selectedProjectId: string | null
  editingProjectId: string | null
  liveElapsedSeconds: number
  onSelect: (projectId: string) => void
  onToggleEdit: (projectId: string) => void
  onCloseEdit: () => void
  onSave: (projectId: string, updates: Pick<Project, 'name' | 'color'>) => boolean
  onDelete: (projectId: string) => void
}

export function ProjectList({
  projects,
  activeSession,
  selectedProjectId,
  editingProjectId,
  liveElapsedSeconds,
  onSelect,
  onToggleEdit,
  onCloseEdit,
  onSave,
  onDelete,
}: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="empty-state">
        <p>No projects yet.</p>
        <p>Add one below to get started.</p>
      </div>
    )
  }

  return (
    <ul className="project-list">
      {projects.map((project) => {
        const isActive = activeSession?.projectId === project.id
        const isSelected = selectedProjectId === project.id
        const isEditing = editingProjectId === project.id
        const displaySeconds = isActive
          ? project.totalSeconds + liveElapsedSeconds
          : project.totalSeconds

        return (
          <li key={project.id} className={`project-item ${isEditing ? 'editing' : ''}`}>
            <div
              className={`project-card ${isSelected ? 'selected' : ''} ${isActive ? 'active' : ''}`}
            >
              <button type="button" className="project-select" onClick={() => onSelect(project.id)}>
                <span className="project-color" style={{ backgroundColor: project.color }} />
                <span className="project-info">
                  <span className="project-name">{project.name}</span>
                  <span className="project-time">{formatDuration(displaySeconds)} total</span>
                </span>
                {isActive ? <span className="live-badge">Live</span> : null}
              </button>
              <div className="project-actions">
                <button
                  type="button"
                  className={`edit-button ${isEditing ? 'active' : ''}`}
                  aria-label={isEditing ? `Close edit for ${project.name}` : `Edit ${project.name}`}
                  aria-expanded={isEditing}
                  onClick={() => onToggleEdit(project.id)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="delete-button"
                  aria-label={`Delete ${project.name}`}
                  onClick={() => onDelete(project.id)}
                >
                  ×
                </button>
              </div>
            </div>

            {isEditing ? (
              <EditProjectSection
                project={project}
                onSave={onSave}
                onClose={onCloseEdit}
              />
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
