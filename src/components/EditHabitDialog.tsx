import { useEffect, useRef, useState, type FormEvent } from 'react'
import { HABIT_COLORS } from '../constants/projectColors'
import type { Habit } from '../types'
import { LabelPicker } from './LabelPicker'

type HabitUpdates = Pick<Habit, 'name' | 'color' | 'labels'>

interface EditHabitDialogProps {
  habit: Habit | undefined
  availableLabels: string[]
  onSave: (habitId: string, updates: HabitUpdates) => boolean
  onClose: () => void
}

export function EditHabitDialog({ habit, availableLabels, onSave, onClose }: EditHabitDialogProps) {
  if (!habit) return null

  // Keyed by habit id so the form resets when a different habit is opened.
  return (
    <EditHabitForm
      key={habit.id}
      habit={habit}
      availableLabels={availableLabels}
      onSave={onSave}
      onClose={onClose}
    />
  )
}

function EditHabitForm({
  habit,
  availableLabels,
  onSave,
  onClose,
}: EditHabitDialogProps & { habit: Habit }) {
  const [name, setName] = useState(habit.name)
  const [color, setColor] = useState(habit.color)
  const [labels, setLabels] = useState<string[]>(habit.labels)
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

  // Older habits may carry a color outside the palette; keep it selectable.
  const colorOptions = HABIT_COLORS.includes(habit.color) ? HABIT_COLORS : [...HABIT_COLORS, habit.color]

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const updated = onSave(habit.id, { name: name.trim(), color, labels })
    if (!updated) {
      setError('Enter a name that is not already used by another habit.')
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
        aria-labelledby="edit-habit-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-heading">
            <p className="eyebrow">Edit habit</p>
            <h2 id="edit-habit-title" className="modal-title-with-dot" dir="auto">
              <span className="title-dot" style={{ backgroundColor: color }} aria-hidden="true" />
              <span>{name.trim() || habit.name}</span>
            </h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="field-label" htmlFor="edit-habit-name">
              Habit name
            </label>
            <input
              ref={nameInputRef}
              id="edit-habit-name"
              type="text"
              dir="auto"
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
          </div>

          <div className="form-field">
            <span className="field-label">Color</span>
            <div className="color-picker" role="radiogroup" aria-label="Habit color">
              {colorOptions.map((option) => (
                <label key={option} className={`color-option ${color === option ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="habit-color"
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
