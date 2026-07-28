import { buildChainWeeks } from '../utils/habitDates'

interface HabitChainProps {
  color: string
  completedDates: string[]
  onToggle: (dateKey: string) => void
  weeks?: number
}

const WEEK_COUNT = 26

const MONTH_LABEL = new Intl.DateTimeFormat(undefined, { month: 'short' })
const FULL_DAY_LABEL = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})

export function HabitChain({ color, completedDates, onToggle, weeks = WEEK_COUNT }: HabitChainProps) {
  const grid = buildChainWeeks(weeks)
  const completed = new Set(completedDates)

  const monthLabels = grid.map((week, index) => {
    const firstDay = week[0].date
    const previousFirstDay = grid[index - 1]?.[0].date
    const isNewMonth = index === 0 || previousFirstDay?.getMonth() !== firstDay.getMonth()
    return isNewMonth ? MONTH_LABEL.format(firstDay) : ''
  })

  return (
    <div className="habit-chain-scroll">
      <div className="habit-chain-months">
        {monthLabels.map((label, index) => (
          <span key={index} className="habit-chain-month-label">
            {label}
          </span>
        ))}
      </div>
      <div className="habit-chain-grid">
        {grid.map((week, weekIndex) => (
          <div className="habit-chain-week" key={weekIndex}>
            {week.map((day) => {
              const isDone = completed.has(day.key)
              return (
                <button
                  key={day.key}
                  type="button"
                  className={`habit-chain-day ${isDone ? 'done' : ''} ${day.isFuture ? 'future' : ''}`}
                  style={isDone ? { backgroundColor: color, borderColor: color } : undefined}
                  disabled={day.isFuture}
                  aria-pressed={isDone}
                  aria-label={`${FULL_DAY_LABEL.format(day.date)}: ${isDone ? 'done' : 'not done'}`}
                  title={FULL_DAY_LABEL.format(day.date)}
                  onClick={() => onToggle(day.key)}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
