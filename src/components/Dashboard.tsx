import { useMemo, useState } from 'react'
import type { Project, SessionRecord } from '../types'
import { buildDashboardBuckets, type DashboardRange } from '../utils/dashboardData'
import { formatDuration } from '../utils/time'
import { DashboardChart, type ChartSeries } from './DashboardChart'

interface DashboardProps {
  projects: Project[]
  sessions: SessionRecord[]
}

const RANGE_OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: 'week', label: 'Last week' },
  { value: 'month', label: 'Last month' },
  { value: 'year', label: 'Last year' },
]

const MAX_SERIES = 7
const OTHER_COLOR = '#a3a3a3'
const OTHER_ID = '__other__'

export function Dashboard({ projects, sessions }: DashboardProps) {
  const [range, setRange] = useState<DashboardRange>('week')

  const buckets = useMemo(() => buildDashboardBuckets(sessions, range), [sessions, range])

  const series = useMemo<ChartSeries[]>(() => {
    const totalsByProject = new Map<string, number>()
    for (const bucket of buckets) {
      for (const segment of bucket.segments) {
        totalsByProject.set(
          segment.projectId,
          (totalsByProject.get(segment.projectId) ?? 0) + segment.seconds,
        )
      }
    }

    const ranked = [...totalsByProject.entries()].sort((a, b) => b[1] - a[1])
    const top = ranked.slice(0, MAX_SERIES)
    const hasOther = ranked.length > MAX_SERIES

    const topSeries = top.map(([projectId]) => {
      const project = projects.find((item) => item.id === projectId)
      return {
        id: projectId,
        name: project?.name ?? 'Deleted project',
        color: project?.color ?? OTHER_COLOR,
      }
    })

    return hasOther ? [...topSeries, { id: OTHER_ID, name: 'Other', color: OTHER_COLOR }] : topSeries
  }, [buckets, projects])

  const rangeTotalSeconds = buckets.reduce((sum, bucket) => sum + bucket.totalSeconds, 0)

  return (
    <section className="dashboard-panel">
      <div className="dashboard-toolbar">
        <div className="mode-switch" role="radiogroup" aria-label="Chart range">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`mode-button ${range === option.value ? 'selected' : ''}`}
              aria-pressed={range === option.value}
              onClick={() => setRange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="dashboard-total">
          <span>Focused time</span>
          <strong>{formatDuration(rangeTotalSeconds)}</strong>
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <p>No focus sessions yet.</p>
          <p>Complete a session to see it charted here.</p>
        </div>
      ) : (
        <>
          <DashboardChart buckets={buckets} series={series} />

          {series.length > 0 ? (
            <ul className="dashboard-legend">
              {series.map((item) => (
                <li key={item.id}>
                  <span className="dashboard-legend-swatch" style={{ backgroundColor: item.color }} />
                  {item.name}
                </li>
              ))}
            </ul>
          ) : null}

          <details className="dashboard-table-details">
            <summary>View as table</summary>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Total</th>
                    {series.map((item) => (
                      <th scope="col" key={item.id}>
                        {item.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {buckets.map((bucket) => (
                    <tr key={bucket.key}>
                      <th scope="row">{bucket.fullLabel}</th>
                      <td>{formatDuration(bucket.totalSeconds)}</td>
                      {series.map((item) => {
                        const seconds =
                          item.id === OTHER_ID
                            ? bucket.segments
                                .filter((segment) => !series.some((s) => s.id === segment.projectId))
                                .reduce((sum, segment) => sum + segment.seconds, 0)
                            : (bucket.segments.find((segment) => segment.projectId === item.id)
                                ?.seconds ?? 0)
                        return <td key={item.id}>{formatDuration(seconds)}</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  )
}
