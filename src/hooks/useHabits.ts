import { useCallback, useEffect, useState } from 'react'
import { PROJECT_COLORS } from '../constants/projectColors'
import type { Habit } from '../types'

const STORAGE_KEY = 'project-time-tracker-habits'

interface HabitState {
  habits: Habit[]
}

function loadState(): HabitState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { habits: [] }
    }

    const parsed = JSON.parse(raw) as HabitState
    return { habits: parsed.habits ?? [] }
  } catch {
    return { habits: [] }
  }
}

function saveState(state: HabitState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function createId() {
  return crypto.randomUUID()
}

export function useHabits() {
  const [state, setState] = useState<HabitState>(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  const addHabit = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return false

    setState((current) => {
      const exists = current.habits.some(
        (habit) => habit.name.toLowerCase() === trimmed.toLowerCase(),
      )
      if (exists) return current

      const habit: Habit = {
        id: createId(),
        name: trimmed,
        color: PROJECT_COLORS[current.habits.length % PROJECT_COLORS.length],
        createdAt: new Date().toISOString(),
        completedDates: [],
      }

      return { habits: [habit, ...current.habits] }
    })

    return true
  }, [])

  const deleteHabit = useCallback((habitId: string) => {
    setState((current) => ({
      habits: current.habits.filter((habit) => habit.id !== habitId),
    }))
  }, [])

  const toggleDate = useCallback((habitId: string, dateKey: string) => {
    setState((current) => ({
      habits: current.habits.map((habit) => {
        if (habit.id !== habitId) return habit

        const hasDate = habit.completedDates.includes(dateKey)
        return {
          ...habit,
          completedDates: hasDate
            ? habit.completedDates.filter((date) => date !== dateKey)
            : [...habit.completedDates, dateKey],
        }
      }),
    }))
  }, [])

  return {
    habits: state.habits,
    addHabit,
    deleteHabit,
    toggleDate,
  }
}
