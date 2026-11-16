import type { CSSProperties } from 'react'
import type { Habit } from '../types'
import { getCurrentStreak } from '../utils/habitDates'

interface HabitListProps {
  habits: Habit[]
}

function scrollToHabit(habitId: string) {
  const card = document.getElementById(`habit-${habitId}`)
  if (!card) return

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
}

export function HabitList({ habits }: HabitListProps) {
  if (habits.length === 0) {
    return (
      <div className="empty-state">
        <p>No habits yet.</p>
        <p>Use “New” to add your first one.</p>
      </div>
    )
  }

  return (
    <ul className="project-list">
      {habits.map((habit) => {
        const streak = getCurrentStreak(habit.completedDates)

        return (
          <li
            key={habit.id}
            className="project-card habit-list-item"
            style={{ '--habit-color': habit.color } as CSSProperties}
          >
            <button type="button" className="project-select" onClick={() => scrollToHabit(habit.id)}>
              <span className="project-color" style={{ backgroundColor: habit.color }} />
              <span className="project-info">
                <span className="project-name" dir="auto">
                  {habit.name}
                </span>
                <span className="project-time">
                  {streak} {streak === 1 ? 'day' : 'days'} streak
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
