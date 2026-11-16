import { useEffect, useRef, useState, type FormEvent } from 'react'
import { PROJECT_COLORS } from '../constants/projectColors'
import type { Project, ProjectUpdates } from '../types'
import { formatDuration } from '../utils/time'
import { LabelPicker } from './LabelPicker'

interface EditProjectDialogProps {
  project: Project | undefined
  availableLabels: string[]
  onSave: (projectId: string, updates: ProjectUpdates) => boolean
  onClose: () => void
}

const TIME_UNITS = [
  { key: 'hours', suffix: 'h', max: 99999 },
  { key: 'minutes', suffix: 'm', max: 59 },
  { key: 'seconds', suffix: 's', max: 59 },
] as const

function splitSeconds(totalSeconds: number) {
  return {
    hours: String(Math.floor(totalSeconds / 3600)),
    minutes: String(Math.floor((totalSeconds % 3600) / 60)),
    seconds: String(totalSeconds % 60),
  }
}

function toSeconds(value: string) {
  const parsed = Math.floor(Number(value))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export function EditProjectDialog({ project, availableLabels, onSave, onClose }: EditProjectDialogProps) {
  if (!project) return null

  // Keyed by project id so the form state resets when a different project is opened.
  return (
    <EditProjectForm
      key={project.id}
      project={project}
      availableLabels={availableLabels}
      onSave={onSave}
      onClose={onClose}
    />
  )
}

function EditProjectForm({
  project,
  availableLabels,
  onSave,
  onClose,
}: EditProjectDialogProps & { project: Project }) {
  const [name, setName] = useState(project.name)
  const [color, setColor] = useState(project.color)
  const [labels, setLabels] = useState<string[]>(project.labels)
  const [time, setTime] = useState(() => splitSeconds(project.totalSeconds))
  const [error, setError] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    nameInputRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const totalSeconds =
    toSeconds(time.hours) * 3600 + toSeconds(time.minutes) * 60 + toSeconds(time.seconds)

  const hasChanges =
    name.trim() !== project.name ||
    totalSeconds !== project.totalSeconds ||
    color !== project.color ||
    labels.join(',') !== project.labels.join(',')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!hasChanges) {
      onClose()
      return
    }

    const updated = onSave(project.id, { name: name.trim(), color, labels, totalSeconds })
    if (!updated) {
      setError('Enter a unique project name.')
      return
    }

    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog modal-dialog-large"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-project-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="edit-project-title">Edit project</h2>
            <p className="modal-subtitle">Update the name, color, labels or tracked time.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="field-label" htmlFor="edit-project-name">
              Project name
            </label>
            <input
              ref={nameInputRef}
              id="edit-project-name"
              type="text"
              className="modal-input"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                if (error) setError('')
              }}
              maxLength={60}
            />
          </div>

          <div className="form-field">
            <span className="field-label">Labels</span>
            <LabelPicker selectedLabels={labels} availableLabels={availableLabels} onChange={setLabels} />

            <div className="color-picker" role="radiogroup" aria-label="Project color">
              {PROJECT_COLORS.map((option) => (
                <label key={option} className={`color-option ${color === option ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="project-color"
                    value={option}
                    checked={color === option}
                    onChange={() => setColor(option)}
                    aria-label={option}
                  />
                  <span className="color-swatch" style={{ backgroundColor: option }} />
                </label>
              ))}
            </div>
          </div>

          <div className="form-field">
            <span className="field-label">Tracked time</span>
            <div className="time-fields">
              {TIME_UNITS.map((unit) => (
                <label key={unit.key} className="time-field">
                  <input
                    type="number"
                    className="modal-input"
                    min={0}
                    max={unit.max}
                    inputMode="numeric"
                    value={time[unit.key]}
                    onChange={(event) =>
                      setTime((current) => ({ ...current, [unit.key]: event.target.value }))
                    }
                    aria-label={unit.key}
                  />
                  <span>{unit.suffix}</span>
                </label>
              ))}
            </div>
            <p className="field-hint">
              Total tracked: {formatDuration(project.totalSeconds)}
              {totalSeconds !== project.totalSeconds ? ` → ${formatDuration(totalSeconds)}` : ''}
            </p>
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="modal-actions">
            <button type="button" className="button button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button-primary" disabled={!name.trim()}>
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
