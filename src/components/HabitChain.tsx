import { useState } from 'react'
import { buildMonthGrid, type CalendarDay } from '../utils/habitDates'

interface HabitChainProps {
  completedDates: string[]
  onToggle: (dateKey: string) => void
}

type CalendarView = 'month' | 'year'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_YEAR_LABEL = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' })
const MONTH_LABEL = new Intl.DateTimeFormat(undefined, { month: 'long' })
const FULL_DAY_LABEL = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

/** Month grids always have 6 rows; drop rows that fall entirely in the next month. */
function monthWeeks(year: number, month: number): CalendarDay[][] {
  return buildMonthGrid(year, month).filter((week) => week.some((day) => day.isInPeriod))
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M3 6.2l2 2 4-4.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface DayCellProps {
  day: CalendarDay
  isDone: boolean
  compact?: boolean
  onToggle: (dateKey: string) => void
}

function DayCell({ day, isDone, compact = false, onToggle }: DayCellProps) {
  if (!day.isInPeriod) {
    return <span className="habit-day is-outside" aria-hidden="true" />
  }

  const className = [
    'habit-day',
    isDone ? 'is-done' : '',
    day.isFuture ? 'is-future' : '',
    day.isToday ? 'is-today' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={className}
      disabled={day.isFuture}
      aria-pressed={isDone}
      aria-label={`${FULL_DAY_LABEL.format(day.date)}: ${isDone ? 'done' : 'not done'}`}
      title={FULL_DAY_LABEL.format(day.date)}
      onClick={() => onToggle(day.key)}
    >
      {day.dayNumber}
      {isDone && !compact ? (
        <span className="habit-day-check">
          <CheckIcon />
        </span>
      ) : null}
    </button>
  )
}

export function HabitChain({ completedDates, onToggle }: HabitChainProps) {
  const today = new Date()
  const [view, setView] = useState<CalendarView>('month')
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() })

  const completed = new Set(completedDates)
  const isCurrentMonth = cursor.year === today.getFullYear() && cursor.month === today.getMonth()
  const isCurrentYear = cursor.year === today.getFullYear()
  const isNextDisabled = view === 'year' ? isCurrentYear : isCurrentMonth

  function goPrev() {
    setCursor((current) =>
      view === 'year'
        ? { ...current, year: current.year - 1 }
        : current.month === 0
          ? { year: current.year - 1, month: 11 }
          : { year: current.year, month: current.month - 1 },
    )
  }

  function goNext() {
    if (isNextDisabled) return
    setCursor((current) =>
      view === 'year'
        ? { ...current, year: current.year + 1 }
        : current.month === 11
          ? { year: current.year + 1, month: 0 }
          : { year: current.year, month: current.month + 1 },
    )
  }

  return (
    <div className="habit-calendar">
      <div className="habit-calendar-toolbar">
        <div className="segmented" role="radiogroup" aria-label="Calendar view">
          {(['month', 'year'] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={`segmented-option ${view === option ? 'selected' : ''}`}
              aria-pressed={view === option}
              onClick={() => setView(option)}
            >
              {option === 'month' ? 'Month' : 'Year'}
            </button>
          ))}
        </div>

        <div className="habit-calendar-nav">
          <button
            type="button"
            className="calendar-nav-button"
            aria-label={view === 'month' ? 'Previous month' : 'Previous year'}
            onClick={goPrev}
          >
            ‹
          </button>
          <span className="habit-calendar-label">
            {view === 'month'
              ? MONTH_YEAR_LABEL.format(new Date(cursor.year, cursor.month, 1))
              : cursor.year}
          </span>
          <button
            type="button"
            className="calendar-nav-button"
            aria-label={view === 'month' ? 'Next month' : 'Next year'}
            disabled={isNextDisabled}
            onClick={goNext}
          >
            ›
          </button>
        </div>
      </div>

      {view === 'month' ? (
        <div className="habit-month">
          <div className="habit-weekdays">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="habit-days">
            {monthWeeks(cursor.year, cursor.month)
              .flat()
              .map((day) => (
                <DayCell
                  key={day.key}
                  day={day}
                  isDone={completed.has(day.key)}
                  onToggle={onToggle}
                />
              ))}
          </div>
        </div>
      ) : (
        <div className="habit-year">
          {Array.from({ length: 12 }, (_, month) => (
            <section key={month} className="habit-mini-month" aria-label={MONTH_LABEL.format(new Date(cursor.year, month, 1))}>
              <h5>{MONTH_LABEL.format(new Date(cursor.year, month, 1))}</h5>
              <div className="habit-weekdays">
                {WEEKDAY_INITIALS.map((label, index) => (
                  <span key={index}>{label}</span>
                ))}
              </div>
              <div className="habit-days">
                {monthWeeks(cursor.year, month)
                  .flat()
                  .map((day) => (
                    <DayCell
                      key={day.key}
                      day={day}
                      isDone={completed.has(day.key)}
                      compact
                      onToggle={onToggle}
                    />
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
