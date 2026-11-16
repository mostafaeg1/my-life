import { useCallback, useMemo, useState, type CSSProperties } from 'react'
import type { Habit } from '../types'
import { getCurrentStreak, getLongestStreak, toDateKey } from '../utils/habitDates'
import { getAllLabels, getLabelColor } from '../utils/labels'
import { ConfirmDialog } from './ConfirmDialog'
import { EditHabitDialog } from './EditHabitDialog'
import { HabitChain } from './HabitChain'
import { PromptDialog } from './PromptDialog'

interface HabitsProps {
  habits: Habit[]
  isAddOpen: boolean
  onAddClose: () => void
  onAdd: (name: string, labels: string[]) => boolean
  onDelete: (habitId: string) => void
  onToggleDate: (habitId: string, dateKey: string) => void
  onUpdate: (habitId: string, updates: Pick<Habit, 'name' | 'color' | 'labels'>) => boolean
}

function CheckIcon() {
  return (
    <svg className="button-icon" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M2.5 6.3l2.4 2.4 4.6-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StreakStat({ label, days }: { label: string; days: number }) {
  return (
    <div className="habit-stat">
      <span className="habit-stat-label">{label}</span>
      <strong className="habit-stat-value">
        {days}
        <span>{days === 1 ? 'day' : 'days'}</span>
      </strong>
    </div>
  )
}

export function Habits({
  habits,
  isAddOpen,
  onAddClose,
  onAdd,
  onDelete,
  onToggleDate,
  onUpdate,
}: HabitsProps) {
  const today = toDateKey(new Date())
  const [pendingDeleteHabitId, setPendingDeleteHabitId] = useState<string | null>(null)
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null)
  const pendingDeleteHabit = habits.find((habit) => habit.id === pendingDeleteHabitId)

  const availableLabels = useMemo(() => getAllLabels(habits), [habits])
  const cancelDelete = useCallback(() => setPendingDeleteHabitId(null), [])
  const closeEdit = useCallback(() => setEditingHabitId(null), [])

  function confirmDelete() {
    if (!pendingDeleteHabitId) return
    onDelete(pendingDeleteHabitId)
    setPendingDeleteHabitId(null)
  }

  return (
    <section className="habits-panel">
      {habits.length === 0 ? (
        <div className="empty-card">
          <p>No habits yet.</p>
          <p>Use “New” in the sidebar to add one and start your chain today.</p>
        </div>
      ) : (
        <ul className="habit-list">
          {habits.map((habit) => {
            const doneToday = habit.completedDates.includes(today)

            return (
              <li
                key={habit.id}
                id={`habit-${habit.id}`}
                className="habit-card"
                style={{ '--habit-color': habit.color } as CSSProperties}
              >
                <div className="habit-card-header">
                  <span className="habit-dot" aria-hidden="true" />
                  <div className="habit-card-heading">
                    <h3 className="habit-name" dir="auto">
                      {habit.name}
                    </h3>
                    {habit.labels.length > 0 ? (
                      <ul className="project-labels" aria-label="Labels">
                        {habit.labels.map((label) => (
                          <li key={label} className="project-label-chip">
                            <span className="label-dot" style={{ backgroundColor: getLabelColor(label) }} />
                            {label}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div className="habit-card-actions">
                    <button
                      type="button"
                      className={`button ${doneToday ? 'button-success-soft' : 'button-primary'}`}
                      aria-pressed={doneToday}
                      onClick={() => onToggleDate(habit.id, today)}
                    >
                      {doneToday ? (
                        <>
                          <CheckIcon />
                          Done today
                        </>
                      ) : (
                        'Mark today done'
                      )}
                    </button>
                    <button
                      type="button"
                      className="button button-secondary"
                      aria-label={`Edit ${habit.name}`}
                      onClick={() => setEditingHabitId(habit.id)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="icon-button icon-button-plain"
                      aria-label={`Delete ${habit.name}`}
                      onClick={() => setPendingDeleteHabitId(habit.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="habit-card-body">
                  <div className="habit-stats">
                    <StreakStat label="Current streak" days={getCurrentStreak(habit.completedDates)} />
                    <StreakStat label="Best streak" days={getLongestStreak(habit.completedDates)} />
                  </div>
                  <HabitChain
                    completedDates={habit.completedDates}
                    onToggle={(dateKey) => onToggleDate(habit.id, dateKey)}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <EditHabitDialog
        habit={editingHabitId ? habits.find((habit) => habit.id === editingHabitId) : undefined}
        availableLabels={availableLabels}
        onSave={onUpdate}
        onClose={closeEdit}
      />

      <ConfirmDialog
        open={pendingDeleteHabitId !== null}
        title="Delete habit?"
        message={`This will delete "${pendingDeleteHabit?.name}" and its chain history. This can't be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <PromptDialog
        open={isAddOpen}
        title="New habit"
        fieldLabel="Habit name"
        placeholder="Meditate, stretch, read..."
        confirmLabel="Add habit"
        labelsField={{ label: 'Labels (optional)', availableLabels }}
        onSubmit={(name, labels) => {
          const added = onAdd(name, labels)
          if (added) onAddClose()
          return added
        }}
        onCancel={onAddClose}
      />
    </section>
  )
}
