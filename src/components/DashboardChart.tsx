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
}

const VIEW_WIDTH = 1000
const PLOT_TOP = 12
const PLOT_BOTTOM = 210
const AXIS_LABEL_Y = 232
const VIEW_HEIGHT = 250
const BAR_WIDTH_RATIO = 0.55
const SEGMENT_GAP = 2
const CORNER_RADIUS = 4

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

function seriesValuesForBucket(bucket: DashboardBucket, series: ChartSeries[]): number[] {
  const topIds = new Set(series.filter((item) => item.id !== '__other__').map((item) => item.id))
  const values = series.map(() => 0)
  const otherIndex = series.findIndex((item) => item.id === '__other__')

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

function roundedTopPath(x: number, y: number, width: number, height: number, radius: number): string {
  const r = Math.max(0, Math.min(radius, width / 2, height))
  return [
    `M ${x} ${y + height}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `L ${x + width - r} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + r}`,
    `L ${x + width} ${y + height}`,
    'Z',
  ].join(' ')
}

export function DashboardChart({ buckets, series }: DashboardChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const maxTotal = Math.max(...buckets.map((bucket) => bucket.totalSeconds), 0)
  const axisMax = niceCeil(maxTotal || 1)
  const plotHeight = PLOT_BOTTOM - PLOT_TOP

  const bandWidth = VIEW_WIDTH / buckets.length
  const barWidth = bandWidth * BAR_WIDTH_RATIO
  const labelStep = buckets.length <= 12 ? 1 : Math.ceil(buckets.length / 10)

  const hoveredBucket = hoveredIndex !== null ? buckets[hoveredIndex] : null
  const hoveredValues = hoveredBucket ? seriesValuesForBucket(hoveredBucket, series) : null
  const rawTooltipPercent =
    hoveredIndex !== null ? ((hoveredIndex + 0.5) / buckets.length) * 100 : 0
  const TOOLTIP_HALF_WIDTH_PERCENT = 8
  const tooltipLeftPercent = Math.min(
    100 - TOOLTIP_HALF_WIDTH_PERCENT,
    Math.max(TOOLTIP_HALF_WIDTH_PERCENT, rawTooltipPercent),
  )

  return (
    <div className="dashboard-chart">
      <svg
        className="dashboard-chart-svg"
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Focused time per period"
      >
        {[0, 0.5, 1].map((fraction) => {
          const y = PLOT_BOTTOM - plotHeight * fraction
          return (
            <g key={fraction}>
              <line x1={0} x2={VIEW_WIDTH} y1={y} y2={y} className="dashboard-gridline" />
              <text x={0} y={y - 4} className="dashboard-axis-label">
                {formatCompactDuration(axisMax * fraction)}
              </text>
            </g>
          )
        })}

        {buckets.map((bucket, index) => {
          const values = seriesValuesForBucket(bucket, series)
          const nonZeroCount = values.filter((value) => value > 0).length
          const bandX = index * bandWidth
          const barX = bandX + (bandWidth - barWidth) / 2

          let cumulativeBottom = PLOT_BOTTOM
          let segmentsDrawn = 0

          return (
            <g key={bucket.key}>
              {series.map((item, seriesIndex) => {
                const value = values[seriesIndex]
                if (value <= 0) return null

                segmentsDrawn += 1
                const isTopSegment = segmentsDrawn === nonZeroCount
                const isBottomSegment = segmentsDrawn === 1
                const rawHeight = (value / axisMax) * plotHeight
                const gapTop = isTopSegment ? 0 : SEGMENT_GAP / 2
                const gapBottom = isBottomSegment ? 0 : SEGMENT_GAP / 2
                const height = Math.max(0, rawHeight - gapTop - gapBottom)
                const bottom = cumulativeBottom - gapBottom
                const top = bottom - height
                cumulativeBottom -= rawHeight

                return isTopSegment ? (
                  <path
                    key={item.id}
                    d={roundedTopPath(barX, top, barWidth, height, CORNER_RADIUS)}
                    fill={item.color}
                  />
                ) : (
                  <rect key={item.id} x={barX} y={top} width={barWidth} height={height} fill={item.color} />
                )
              })}

              <rect
                x={bandX}
                y={PLOT_TOP}
                width={bandWidth}
                height={PLOT_BOTTOM - PLOT_TOP}
                fill="transparent"
                className="dashboard-hit-area"
                tabIndex={0}
                role="button"
                aria-label={`${bucket.fullLabel}: ${formatDuration(bucket.totalSeconds)}`}
                onPointerEnter={() => setHoveredIndex(index)}
                onPointerLeave={() =>
                  setHoveredIndex((current) => (current === index ? null : current))
                }
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex((current) => (current === index ? null : current))}
              />
              {hoveredIndex === index ? (
                <line
                  x1={bandX + bandWidth / 2}
                  x2={bandX + bandWidth / 2}
                  y1={PLOT_TOP}
                  y2={PLOT_BOTTOM}
                  className="dashboard-crosshair"
                />
              ) : null}

              {index % labelStep === 0 || index === buckets.length - 1 ? (
                <text
                  x={bandX + bandWidth / 2}
                  y={AXIS_LABEL_Y}
                  className="dashboard-axis-label centered"
                >
                  {bucket.label}
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>

      {hoveredBucket && hoveredValues ? (
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
  )
}
