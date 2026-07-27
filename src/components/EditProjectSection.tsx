import { useEffect, useState, type FormEvent } from 'react'
import { PROJECT_COLORS } from '../constants/projectColors'
import type { Project } from '../types'
import { formatDuration } from '../utils/time'

interface EditProjectSectionProps {
  project: Project
  onSave: (projectId: string, updates: Pick<Project, 'name' | 'color'>) => boolean
  onClose: () => void
}

export function EditProjectSection({ project, onSave, onClose }: EditProjectSectionProps) {
  const [name, setName] = useState(project.name)
  const [color, setColor] = useState(project.color)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setName(project.name)
    setColor(project.color)
    setError('')
    setSaved(false)
  }, [project.id, project.name, project.color])

  const hasChanges = name.trim() !== project.name || color !== project.color

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!hasChanges) return

    const updated = onSave(project.id, { name: name.trim(), color })
    if (!updated) {
      setError('Enter a unique project name.')
      setSaved(false)
      return
    }

    setError('')
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <section className="edit-project-section">
      <div className="edit-project-header">
        <div className="panel-heading">
          <h3>Edit project</h3>
          <p>Update the name or color for this project.</p>
        </div>
        <button type="button" className="close-edit-button" onClick={onClose} aria-label="Close edit">
          ×
        </button>
      </div>

      <form className="edit-project-form" onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="edit-project-name">
          Project name
        </label>
        <input
          id="edit-project-name"
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            if (error) setError('')
            if (saved) setSaved(false)
          }}
          maxLength={60}
        />

        <span className="field-label">Color</span>
        <div className="color-picker" role="radiogroup" aria-label="Project color">
          {PROJECT_COLORS.map((option) => (
            <label key={option} className={`color-option ${color === option ? 'selected' : ''}`}>
              <input
                type="radio"
                name="project-color"
                value={option}
                checked={color === option}
                onChange={() => {
                  setColor(option)
                  if (saved) setSaved(false)
                }}
              />
              <span className="color-swatch" style={{ backgroundColor: option }} />
            </label>
          ))}
        </div>

        <div className="edit-meta">
          <span>Total tracked: {formatDuration(project.totalSeconds)}</span>
        </div>

        {error ? <p className="form-error">{error}</p> : null}
        {saved ? <p className="form-success">Project updated.</p> : null}

        <button type="submit" className="save-button" disabled={!name.trim() || !hasChanges}>
          Save changes
        </button>
      </form>
    </section>
  )
}
