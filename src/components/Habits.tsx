import { useMemo, useState } from 'react'
import type { Habit } from '../types'
import { getCurrentStreak, getLongestStreak, toDateKey } from '../utils/habitDates'
import { getAllLabels, getLabelColor } from '../utils/labels'
import { ConfirmDialog } from './ConfirmDialog'
import { HabitChain } from './HabitChain'
import { LabelPicker } from './LabelPicker'
import { PromptDialog } from './PromptDialog'

interface HabitsProps {
  habits: Habit[]
  onAdd: (name: string, labels: string[]) => boolean
  onDelete: (habitId: string) => void
  onToggleDate: (habitId: string, dateKey: string) => void
  onUpdateLabels: (habitId: string, labels: string[]) => void
}

export function Habits({ habits, onAdd, onDelete, onToggleDate, onUpdateLabels }: HabitsProps) {
  const today = toDateKey(new Date())
  const [pendingDeleteHabitId, setPendingDeleteHabitId] = useState<string | null>(null)
  const pendingDeleteHabit = habits.find((habit) => habit.id === pendingDeleteHabitId)
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false)
  const [editingLabelsHabitId, setEditingLabelsHabitId] = useState<string | null>(null)

  const availableLabels = useMemo(() => getAllLabels(habits), [habits])

  function confirmDelete() {
    if (!pendingDeleteHabitId) return
    onDelete(pendingDeleteHabitId)
    setPendingDeleteHabitId(null)
  }

  return (
    <section className="habits-panel">
      {habits.length === 0 ? (
        <div className="empty-state">
          <p>No habits yet.</p>
          <p>Use the + button to add one and start your chain today.</p>
        </div>
      ) : (
        <ul className="habit-list">
          {habits.map((habit) => {
            const currentStreak = getCurrentStreak(habit.completedDates)
            const longestStreak = getLongestStreak(habit.completedDates)
            const doneToday = habit.completedDates.includes(today)

            return (
              <li key={habit.id} className="habit-card">
                <div className="habit-card-header">
                  <span className="project-color" style={{ backgroundColor: habit.color }} />
                  <div className="habit-card-heading">
                    <h3 className="habit-name">{habit.name}</h3>
                    <p className="habit-streaks">
                      <span>
                      current streak: <strong>{currentStreak}</strong> day{currentStreak === 1 ? '' : 's'} 
                      </span>
                      <span>
                      best streak: <strong> {longestStreak}</strong> day{longestStreak === 1 ? '' : 's'} 
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`today-toggle ${doneToday ? 'done' : ''}`}
                    onClick={() => onToggleDate(habit.id, today)}
                  >
                    {doneToday ? 'Done today' : 'Mark today done'}
                  </button>
                  <button
                    type="button"
                    className={`edit-button ${editingLabelsHabitId === habit.id ? 'active' : ''}`}
                    aria-label={
                      editingLabelsHabitId === habit.id
                        ? `Close label edit for ${habit.name}`
                        : `Edit labels for ${habit.name}`
                    }
                    aria-expanded={editingLabelsHabitId === habit.id}
                    onClick={() =>
                      setEditingLabelsHabitId((current) => (current === habit.id ? null : habit.id))
                    }
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="delete-button"
                    aria-label={`Delete ${habit.name}`}
                    onClick={() => setPendingDeleteHabitId(habit.id)}
                  >
                    ×
                  </button>
                </div>

                {editingLabelsHabitId === habit.id ? (
                  <div className="edit-project-section">
                    <div className="edit-project-header">
                      <div className="panel-heading">
                        <h3>Edit labels</h3>
                        <p>Update the labels for this habit.</p>
                      </div>
                      <button
                        type="button"
                        className="close-edit-button"
                        onClick={() => setEditingLabelsHabitId(null)}
                        aria-label="Close edit"
                      >
                        ×
                      </button>
                    </div>
                    <div className="edit-project-form">
                      <LabelPicker
                        selectedLabels={habit.labels}
                        availableLabels={availableLabels}
                        onChange={(next) => onUpdateLabels(habit.id, next)}
                      />
                    </div>
                  </div>
                ) : habit.labels.length > 0 ? (
                  <ul className="project-labels">
                    {habit.labels.map((label) => (
                      <li key={label} className="project-label-chip">
                        <span className="label-dot" style={{ backgroundColor: getLabelColor(label) }} />
                        {label}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <HabitChain
                  completedDates={habit.completedDates}
                  onToggle={(dateKey) => onToggleDate(habit.id, dateKey)}
                />
              </li>
            )
          })}
        </ul>
      )}

      <button
        type="button"
        className="fab-button"
        aria-label="Add habit"
        onClick={() => setIsAddHabitOpen(true)}
      >
        +
      </button>

      <ConfirmDialog
        open={pendingDeleteHabitId !== null}
        title="Delete habit?"
        message={`This will delete "${pendingDeleteHabit?.name}" and its chain history. This can't be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteHabitId(null)}
      />

      <PromptDialog
        open={isAddHabitOpen}
        title="Add habit"
        placeholder="Meditate, stretch, read..."
        confirmLabel="Add habit"
        labelsField={{ label: 'Labels (optional)', availableLabels }}
        onSubmit={(name, labels) => {
          const added = onAdd(name, labels)
          if (added) setIsAddHabitOpen(false)
          return added
        }}
        onCancel={() => setIsAddHabitOpen(false)}
      />
    </section>
  )
}
