import { useEffect, useRef, useState } from 'react'
import type { Project } from '../types'
import { playBell } from '../utils/sound'
import { formatClock, formatDuration } from '../utils/time'

type SessionMode = 'stopwatch' | 'timer'

const DURATION_PRESETS_MINUTES = [5, 15, 25, 50]
const DEFAULT_DURATION_MINUTES = 25

interface FocusSessionProps {
  project: Project | undefined
  isRunning: boolean
  liveElapsedSeconds: number
  onStart: () => void
  onStop: () => void
}

export function FocusSession({
  project,
  isRunning,
  liveElapsedSeconds,
  onStart,
  onStop,
}: FocusSessionProps) {
  const [mode, setMode] = useState<SessionMode>('stopwatch')
  const [durationMinutes, setDurationMinutes] = useState(DEFAULT_DURATION_MINUTES)
  const hasRungRef = useRef(false)

  const durationSeconds = durationMinutes * 60
  const remainingSeconds = Math.max(0, durationSeconds - liveElapsedSeconds)
  const isTimerFinished = mode === 'timer' && isRunning && remainingSeconds <= 0

  useEffect(() => {
    if (!isRunning) {
      hasRungRef.current = false
      return
    }

    if (isTimerFinished && !hasRungRef.current) {
      hasRungRef.current = true
      playBell()
      onStop()
    }
  }, [isRunning, isTimerFinished, onStop])

  if (!project) {
    return (
      <section className="focus-panel empty-focus">
        <p>Select a project to start a focus session.</p>
      </section>
    )
  }

  const projectedTotal = project.totalSeconds + (isRunning ? liveElapsedSeconds : 0)
  const displaySeconds = mode === 'timer' ? remainingSeconds : liveElapsedSeconds
  const canStart = mode === 'stopwatch' || durationMinutes > 0

  return (
    <section className="focus-panel">
      <div className="focus-header">
        <span className="project-color large" style={{ backgroundColor: project.color }} />
        <div>
          <p className="eyebrow">Focus session</p>
          <h2>{project.name}</h2>
        </div>
      </div>

      <div className="mode-switch" role="radiogroup" aria-label="Session mode">
        <button
          type="button"
          className={`mode-button ${mode === 'stopwatch' ? 'selected' : ''}`}
          aria-pressed={mode === 'stopwatch'}
          disabled={isRunning}
          onClick={() => setMode('stopwatch')}
        >
          Stopwatch
        </button>
        <button
          type="button"
          className={`mode-button ${mode === 'timer' ? 'selected' : ''}`}
          aria-pressed={mode === 'timer'}
          disabled={isRunning}
          onClick={() => setMode('timer')}
        >
          Timer
        </button>
      </div>

      {mode === 'timer' && !isRunning ? (
        <div className="duration-picker">
          <span className="field-label">Session length</span>
          <div className="duration-presets">
            {DURATION_PRESETS_MINUTES.map((minutes) => (
              <button
                key={minutes}
                type="button"
                className={`preset-button ${durationMinutes === minutes ? 'selected' : ''}`}
                onClick={() => setDurationMinutes(minutes)}
              >
                {minutes}m
              </button>
            ))}
          </div>
          <label className="duration-input-row">
            <span>Custom (minutes)</span>
            <input
              type="number"
              min={1}
              max={480}
              value={durationMinutes === 0 ? '' : durationMinutes}
              onChange={(event) => {
                const raw = event.target.value
                if (raw === '') {
                  setDurationMinutes(0)
                  return
                }
                const parsed = Math.round(Number(raw))
                if (Number.isFinite(parsed)) {
                  setDurationMinutes(Math.max(0, Math.min(480, parsed)))
                }
              }}
            />
          </label>
        </div>
      ) : null}

      <div className="timer-display" aria-live="polite">
        {isRunning
          ? formatClock(displaySeconds)
          : mode === 'timer'
            ? formatClock(durationSeconds)
            : '00:00'}
      </div>

      <p className="timer-caption">
        {isRunning
          ? mode === 'timer'
            ? 'Time remaining. A bell will sound when the session ends.'
            : 'Time will be added to this project when you stop.'
          : `Project total: ${formatDuration(project.totalSeconds)}`}
      </p>

      {isRunning ? (
        <button type="button" className="primary-button stop" onClick={onStop}>
          Stop session
        </button>
      ) : (
        <button
          type="button"
          className="primary-button start"
          disabled={!canStart}
          onClick={onStart}
        >
          Start focus session
        </button>
      )}

      {isRunning ? (
        <p className="projected-total">
          New total after stop: {formatDuration(projectedTotal)}
        </p>
      ) : null}
    </section>
  )
}
