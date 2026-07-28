import type { Habit } from '../types'
import { getCurrentStreak, getLongestStreak, toDateKey } from '../utils/habitDates'
import { AddHabitForm } from './AddHabitForm'
import { HabitChain } from './HabitChain'

interface HabitsProps {
  habits: Habit[]
  onAdd: (name: string) => boolean
  onDelete: (habitId: string) => void
  onToggleDate: (habitId: string, dateKey: string) => void
}

export function Habits({ habits, onAdd, onDelete, onToggleDate }: HabitsProps) {
  const today = toDateKey(new Date())

  function handleDelete(habitId: string, habitName: string) {
    const confirmed = window.confirm(`Delete "${habitName}" and its chain history?`)
    if (!confirmed) return
    onDelete(habitId)
  }

  return (
    <section className="habits-panel">
      <AddHabitForm onAdd={onAdd} />

      {habits.length === 0 ? (
        <div className="empty-state">
          <p>No habits yet.</p>
          <p>Add one above and start your chain today.</p>
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
                    <h3>{habit.name}</h3>
                    <p className="habit-streaks">
                      <span>
                        <strong>{currentStreak}</strong> day{currentStreak === 1 ? '' : 's'} current
                      </span>
                      <span>
                        <strong>{longestStreak}</strong> day{longestStreak === 1 ? '' : 's'} best
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
                    className="delete-button"
                    aria-label={`Delete ${habit.name}`}
                    onClick={() => handleDelete(habit.id, habit.name)}
                  >
                    ×
                  </button>
                </div>

                <HabitChain
                  color={habit.color}
                  completedDates={habit.completedDates}
                  onToggle={(dateKey) => onToggleDate(habit.id, dateKey)}
                />
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
