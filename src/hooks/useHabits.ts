import { useCallback, useEffect, useState } from 'react'
import { HABIT_COLORS, PROJECT_COLORS } from '../constants/projectColors'
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
    return {
      habits: (parsed.habits ?? []).map((habit) => ({
        ...habit,
        labels: habit.labels ?? [],
        color: toHabitColor(habit.color),
      })),
    }
  } catch {
    return { habits: [] }
  }
}

/** Habits saved before HABIT_COLORS existed use the brighter project palette; map them across. */
function toHabitColor(color: string): string {
  const index = PROJECT_COLORS.indexOf(color)
  return index >= 0 ? HABIT_COLORS[index] : color
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

  const addHabit = useCallback((name: string, labels: string[] = []) => {
    const trimmed = name.trim()
    if (!trimmed) return false

    let added = false

    setState((current) => {
      const exists = current.habits.some(
        (habit) => habit.name.toLowerCase() === trimmed.toLowerCase(),
      )
      if (exists) return current

      added = true
      const habit: Habit = {
        id: createId(),
        name: trimmed,
        color: HABIT_COLORS[current.habits.length % HABIT_COLORS.length],
        createdAt: new Date().toISOString(),
        completedDates: [],
        labels,
      }

      return { habits: [habit, ...current.habits] }
    })

    return added
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

  const updateHabit = useCallback(
    (habitId: string, updates: Pick<Habit, 'name' | 'color' | 'labels'>) => {
      const trimmed = updates.name.trim()
      if (!trimmed) return false

      let updated = false

      setState((current) => {
        const duplicate = current.habits.some(
          (habit) => habit.id !== habitId && habit.name.toLowerCase() === trimmed.toLowerCase(),
        )
        if (duplicate) return current

        updated = true
        return {
          habits: current.habits.map((habit) =>
            habit.id === habitId
              ? { ...habit, name: trimmed, color: updates.color, labels: updates.labels }
              : habit,
          ),
        }
      })

      return updated
    },
    [],
  )

  return {
    habits: state.habits,
    addHabit,
    deleteHabit,
    toggleDate,
    updateHabit,
  }
}
