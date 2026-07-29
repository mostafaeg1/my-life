export interface CalendarDay {
  key: string
  date: Date
  dayNumber: number
  isInPeriod: boolean
  isFuture: boolean
  isToday: boolean
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

export function buildMonthGrid(year: number, month: number, today: Date = new Date()): CalendarDay[][] {
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const firstOfMonth = new Date(year, month, 1)
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay())

  const weeks: CalendarDay[][] = []
  const cursor = new Date(gridStart)

  for (let week = 0; week < 6; week += 1) {
    const days: CalendarDay[] = []
    for (let day = 0; day < 7; day += 1) {
      days.push({
        key: toDateKey(cursor),
        date: new Date(cursor),
        dayNumber: cursor.getDate(),
        isInPeriod: cursor.getMonth() === month,
        isFuture: cursor.getTime() > todayStart.getTime(),
        isToday: cursor.getTime() === todayStart.getTime(),
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(days)
  }

  return weeks
}

export function buildYearGrid(year: number, today: Date = new Date()): CalendarDay[][] {
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const jan1 = new Date(year, 0, 1)
  const dec31 = new Date(year, 11, 31)
  const gridStart = new Date(year, 0, 1 - jan1.getDay())
  const totalDays = Math.round((dec31.getTime() - gridStart.getTime()) / 86_400_000) + 1
  const weekCount = Math.ceil(totalDays / 7)

  const weeks: CalendarDay[][] = []
  const cursor = new Date(gridStart)

  for (let week = 0; week < weekCount; week += 1) {
    const days: CalendarDay[] = []
    for (let day = 0; day < 7; day += 1) {
      days.push({
        key: toDateKey(cursor),
        date: new Date(cursor),
        dayNumber: cursor.getDate(),
        isInPeriod: cursor.getFullYear() === year,
        isFuture: cursor.getTime() > todayStart.getTime(),
        isToday: cursor.getTime() === todayStart.getTime(),
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(days)
  }

  return weeks
}
