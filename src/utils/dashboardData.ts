import type { SessionRecord } from '../types'

export type DashboardRange = 'week' | 'month' | 'year'

export interface DashboardSegment {
  projectId: string
  seconds: number
}

export interface DashboardBucket {
  key: string
  label: string
  fullLabel: string
  totalSeconds: number
  segments: DashboardSegment[]
}

const WEEKDAY_LABEL = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
const DAY_LABEL = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
const MONTH_LABEL = new Intl.DateTimeFormat(undefined, { month: 'short' })
const FULL_DAY_LABEL = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})
const FULL_MONTH_LABEL = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' })

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function buildDailyBuckets(days: number, useWeekdayLabel: boolean, now: Date): DashboardBucket[] {
  const buckets: DashboardBucket[] = []

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    buckets.push({
      key: dayKey(date),
      label: useWeekdayLabel ? WEEKDAY_LABEL.format(date) : DAY_LABEL.format(date),
      fullLabel: FULL_DAY_LABEL.format(date),
      totalSeconds: 0,
      segments: [],
    })
  }

  return buckets
}

function buildMonthlyBuckets(months: number, now: Date): DashboardBucket[] {
  const buckets: DashboardBucket[] = []

  for (let i = months - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({
      key: monthKey(date),
      label: MONTH_LABEL.format(date),
      fullLabel: FULL_MONTH_LABEL.format(date),
      totalSeconds: 0,
      segments: [],
    })
  }

  return buckets
}

export function buildDashboardBuckets(
  sessions: SessionRecord[],
  range: DashboardRange,
  now: Date = new Date(),
): DashboardBucket[] {
  const buckets =
    range === 'year'
      ? buildMonthlyBuckets(12, now)
      : buildDailyBuckets(range === 'week' ? 7 : 30, range === 'week', now)

  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]))
  const keyFor = range === 'year' ? monthKey : dayKey

  for (const session of sessions) {
    const bucket = bucketByKey.get(keyFor(new Date(session.startedAt)))
    if (!bucket) continue

    bucket.totalSeconds += session.seconds
    const segment = bucket.segments.find((item) => item.projectId === session.projectId)
    if (segment) {
      segment.seconds += session.seconds
    } else {
      bucket.segments.push({ projectId: session.projectId, seconds: session.seconds })
    }
  }

  return buckets
}
