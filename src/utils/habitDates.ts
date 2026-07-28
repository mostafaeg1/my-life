export interface ChainDay {
  key: string
  date: Date
  isFuture: boolean
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function getCurrentStreak(completedDates: string[], today: Date = new Date()): number {
  const dates = new Set(completedDates)
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  if (!dates.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
  }

  let streak = 0
  while (dates.has(toDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export function getLongestStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0

  const sorted = [...new Set(completedDates)].sort()
  let longest = 1
  let current = 1

  for (let i = 1; i < sorted.length; i += 1) {
    const dayDiff = Math.round(
      (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86_400_000,
    )
    current = dayDiff === 1 ? current + 1 : 1
    longest = Math.max(longest, current)
  }

  return longest
}

export function buildChainWeeks(weekCount: number, today: Date = new Date()): ChainDay[][] {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const gridEnd = new Date(end)
  gridEnd.setDate(end.getDate() + (6 - end.getDay()))

  const gridStart = new Date(gridEnd)
  gridStart.setDate(gridEnd.getDate() - weekCount * 7 + 1)

  const weeks: ChainDay[][] = []
  const cursor = new Date(gridStart)

  for (let week = 0; week < weekCount; week += 1) {
    const days: ChainDay[] = []
    for (let day = 0; day < 7; day += 1) {
      days.push({
        key: toDateKey(cursor),
        date: new Date(cursor),
        isFuture: cursor.getTime() > end.getTime(),
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(days)
  }

  return weeks
}
