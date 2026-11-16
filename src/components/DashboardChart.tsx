import { useState } from 'react'
import type { DashboardBucket } from '../utils/dashboardData'
import { formatCompactDuration, formatDuration } from '../utils/time'

export interface ChartSeries {
  id: string
  name: string
  color: string
}

interface DashboardChartProps {
  buckets: DashboardBucket[]
  series: ChartSeries[]
  emptyMessage?: string | null
}

const OTHER_ID = '__other__'
const TICKS = [1, 0.5, 0]
// Axis maximums whose halves are also round numbers (10m/5m, 1h/30m, ...).
const AXIS_STEPS_SECONDS = [600, 1200, 1800, 3600, 7200, 14400, 21600, 28800, 43200, 57600, 86400]
const EMPTY_AXIS_MAX = 3600

function niceCeil(value: number): number {
  if (value <= 0) return 1

  const exponent = Math.floor(Math.log10(value))
  const magnitude = 10 ** exponent
  const residual = value / magnitude

  let niceResidual: number
  if (residual <= 1) niceResidual = 1
  else if (residual <= 2) niceResidual = 2
  else if (residual <= 5) niceResidual = 5
  else niceResidual = 10

  return niceResidual * magnitude
}

function getAxisMax(maxTotalSeconds: number): number {
  if (maxTotalSeconds <= 0) return EMPTY_AXIS_MAX

  const step = AXIS_STEPS_SECONDS.find((candidate) => candidate >= maxTotalSeconds)
  if (step) return step

  return niceCeil(maxTotalSeconds / 3600) * 3600
}

function seriesValuesForBucket(bucket: DashboardBucket, series: ChartSeries[]): number[] {
  const topIds = new Set(series.filter((item) => item.id !== OTHER_ID).map((item) => item.id))
  const values = series.map(() => 0)
  const otherIndex = series.findIndex((item) => item.id === OTHER_ID)

  for (const segment of bucket.segments) {
    if (topIds.has(segment.projectId)) {
      const index = series.findIndex((item) => item.id === segment.projectId)
      values[index] += segment.seconds
    } else if (otherIndex >= 0) {
      values[otherIndex] += segment.seconds
    }
  }

  return values
}

export function DashboardChart({ buckets, series, emptyMessage }: DashboardChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const maxTotal = Math.max(...buckets.map((bucket) => bucket.totalSeconds), 0)
  const axisMax = getAxisMax(maxTotal)
  const labelStep = buckets.length <= 12 ? 1 : Math.ceil(buckets.length / 10)

  const hoveredBucket = hoveredIndex !== null ? buckets[hoveredIndex] : null
  const hoveredValues = hoveredBucket ? seriesValuesForBucket(hoveredBucket, series) : null
  const rawTooltipPercent = hoveredIndex !== null ? ((hoveredIndex + 0.5) / buckets.length) * 100 : 0
  const TOOLTIP_HALF_WIDTH_PERCENT = 10
  const tooltipLeftPercent = Math.min(
    100 - TOOLTIP_HALF_WIDTH_PERCENT,
    Math.max(TOOLTIP_HALF_WIDTH_PERCENT, rawTooltipPercent),
  )

  function clearHover(index: number) {
    setHoveredIndex((current) => (current === index ? null : current))
  }

  return (
    <div className="dashboard-chart">
      <div className="chart-body">
        <div className="chart-y-axis" aria-hidden="true">
          {TICKS.map((tick) => (
            <span key={tick} style={{ bottom: `${tick * 100}%` }}>
              {formatCompactDuration(axisMax * tick)}
            </span>
          ))}
        </div>

        <div className="chart-plot">
          {TICKS.map((tick) => (
            <div key={tick} className="chart-gridline" style={{ bottom: `${tick * 100}%` }} />
          ))}

          <div className="chart-bars" role="list" aria-label="Focused time per period">
            {buckets.map((bucket, index) => {
              const values = seriesValuesForBucket(bucket, series)
              const heightPercent = (bucket.totalSeconds / axisMax) * 100

              return (
                <div
                  key={bucket.key}
                  role="listitem"
                  tabIndex={0}
                  className={`chart-band ${hoveredIndex === index ? 'hovered' : ''}`}
                  aria-label={`${bucket.fullLabel}: ${formatDuration(bucket.totalSeconds)}`}
                  onPointerEnter={() => setHoveredIndex(index)}
                  onPointerLeave={() => clearHover(index)}
                  onFocus={() => setHoveredIndex(index)}
                  onBlur={() => clearHover(index)}
                >
                  {bucket.totalSeconds > 0 ? (
                    <div className="chart-bar" style={{ height: `${heightPercent}%` }}>
                      {series.map((item, seriesIndex) =>
                        values[seriesIndex] > 0 ? (
                          <span
                            key={item.id}
                            className="chart-bar-segment"
                            style={{ flexGrow: values[seriesIndex], backgroundColor: item.color }}
                          />
                        ) : null,
                      )}
                    </div>
                  ) : (
                    <div className="chart-bar-placeholder" />
                  )}
                </div>
              )
            })}
          </div>

          {emptyMessage ? (
            <div className="chart-empty">
              <span>{emptyMessage}</span>
            </div>
          ) : null}

          {hoveredBucket && hoveredValues && !emptyMessage ? (
            <div className="chart-tooltip" style={{ left: `${tooltipLeftPercent}%` }}>
              <p className="chart-tooltip-title">{hoveredBucket.fullLabel}</p>
              <p className="chart-tooltip-total">
                <strong>{formatDuration(hoveredBucket.totalSeconds)}</strong>
              </p>
              {hoveredBucket.totalSeconds > 0 ? (
                <ul className="chart-tooltip-list">
                  {series.map((item, index) =>
                    hoveredValues[index] > 0 ? (
                      <li key={item.id}>
                        <span className="chart-tooltip-key" style={{ backgroundColor: item.color }} />
                        <span className="chart-tooltip-name">{item.name}</span>
                        <strong>{formatDuration(hoveredValues[index])}</strong>
                      </li>
                    ) : null,
                  )}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="chart-x-axis" aria-hidden="true">
        {buckets.map((bucket, index) => (
          <span key={bucket.key}>
            {index % labelStep === 0 || index === buckets.length - 1 ? bucket.label : ''}
          </span>
        ))}
      </div>
    </div>
  )
}
