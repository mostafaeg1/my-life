import { useEffect, useState, type CSSProperties } from 'react'
import { buildMonthGrid, buildYearGrid, type CalendarDay } from '../utils/habitDates'

interface HabitChainProps {
  color: string
  completedDates: string[]
  onToggle: (dateKey: string) => void
}

type CalendarView = 'month' | 'year'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_YEAR_LABEL = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' })
const FULL_DAY_LABEL = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})

function getBandCount(): number {
  if (typeof window === 'undefined') return 4
  if (window.innerWidth <= 560) return 1
  if (window.innerWidth <= 860) return 2
  return 4
}

function useYearBandCount(): number {
  const [bandCount, setBandCount] = useState(getBandCount)

  useEffect(() => {
    function handleResize() {
      setBandCount(getBandCount())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return bandCount
}

interface CalendarGridProps {
  weeks: CalendarDay[][]
  completed: Set<string>
  color: string
  onToggle: (dateKey: string) => void
  bands?: number
}

function CalendarGrid({ weeks, completed, color, onToggle, bands = 1 }: CalendarGridProps) {
  function renderDay(day: CalendarDay, position?: CSSProperties) {
    const isDone = day.isInPeriod && completed.has(day.key)
    const isInteractive = day.isInPeriod && !day.isFuture

    return (
      <button
        key={day.key}
        type="button"
        className={[
          'habit-month-day',
          isDone ? 'done' : '',
          day.isInPeriod ? '' : 'outside',
          day.isFuture ? 'future' : '',
          day.isToday ? 'today' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          ...position,
          ...(isDone ? { backgroundColor: color, borderColor: color } : undefined),
        }}
        disabled={!isInteractive}
        aria-pressed={isDone}
        aria-label={`${FULL_DAY_LABEL.format(day.date)}: ${isDone ? 'done' : 'not done'}`}
        title={FULL_DAY_LABEL.format(day.date)}
        onClick={() => onToggle(day.key)}
      >
        {day.isInPeriod ? day.dayNumber : null}
      </button>
    )
  }

  if (bands <= 1) {
    return (
      <div className="habit-month-grid">
        <div className="habit-month-weekdays">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="habit-month-weeks">
          {weeks.map((week, index) => (
            <div className="habit-month-week" key={index}>
              {week.map((day) => renderDay(day))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const rowsPerBand = Math.ceil(weeks.length / bands)

  return (
    <div
      className="habit-year-grid"
      style={{
        gridTemplateColumns: `repeat(${bands * 7}, 2.1rem)`,
        gridTemplateRows: `auto repeat(${rowsPerBand}, 2.1rem)`,
      }}
    >
      {Array.from({ length: bands }).map((_, band) =>
        WEEKDAY_LABELS.map((label, dayIndex) => (
          <span
            key={`heading-${band}-${label}`}
            className="habit-year-weekday-label"
            style={{ gridColumn: band * 7 + dayIndex + 1, gridRow: 1 }}
          >
            {label}
          </span>
        )),
      )}
      {weeks.map((week, weekIndex) => {
        const band = Math.floor(weekIndex / rowsPerBand)
        const rowInBand = weekIndex % rowsPerBand
        return week.map((day, dayIndex) =>
          renderDay(day, { gridColumn: band * 7 + dayIndex + 1, gridRow: rowInBand + 2 }),
        )
      })}
    </div>
  )
}

export function HabitChain({ color, completedDates, onToggle }: HabitChainProps) {
  const today = new Date()
  const [view, setView] = useState<CalendarView>('month')
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const yearBandCount = useYearBandCount()

  const completed = new Set(completedDates)
  const isCurrentMonth = cursor.year === today.getFullYear() && cursor.month === today.getMonth()
  const isCurrentYear = cursor.year === today.getFullYear()

  function goPrev() {
    if (view === 'year') {
      setCursor((current) => ({ ...current, year: current.year - 1 }))
      return
    }

    setCursor((current) =>
      current.month === 0
        ? { year: current.year - 1, month: 11 }
        : { year: current.year, month: current.month - 1 },
    )
  }

  function goNext() {
    if (view === 'year') {
      if (isCurrentYear) return
      setCursor((current) => ({ ...current, year: current.year + 1 }))
      return
    }

    if (isCurrentMonth) return
    setCursor((current) =>
      current.month === 11
        ? { year: current.year + 1, month: 0 }
        : { year: current.year, month: current.month + 1 },
    )
  }

  const isNextDisabled = view === 'year' ? isCurrentYear : isCurrentMonth
  const weeks = view === 'year' ? buildYearGrid(cursor.year) : buildMonthGrid(cursor.year, cursor.month)

  return (
    <div className="habit-calendar">
      <div className="habit-calendar-toolbar">
        <div className="mode-switch" role="radiogroup" aria-label="Calendar view">
          <button
            type="button"
            className={`mode-button ${view === 'month' ? 'selected' : ''}`}
            aria-pressed={view === 'month'}
            onClick={() => setView('month')}
          >
            Month
          </button>
          <button
            type="button"
            className={`mode-button ${view === 'year' ? 'selected' : ''}`}
            aria-pressed={view === 'year'}
            onClick={() => setView('year')}
          >
            Year
          </button>
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
            {view === 'month' ? MONTH_YEAR_LABEL.format(new Date(cursor.year, cursor.month, 1)) : cursor.year}
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

      <CalendarGrid
        weeks={weeks}
        completed={completed}
        color={color}
        onToggle={onToggle}
        bands={view === 'year' ? yearBandCount : 1}
      />
    </div>
  )
}
