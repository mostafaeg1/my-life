import { useEffect, useRef } from 'react'
import type { Project } from '../types'
import { getLabelColor } from '../utils/labels'
import { playBell } from '../utils/sound'
import { formatClockLong, formatDurationShort } from '../utils/time'

export type SessionMode = 'stopwatch' | 'timer'

const DURATION_PRESETS_MINUTES = [5, 15, 25, 50]

interface FocusSessionProps {
  project: Project | undefined
  isRunning: boolean
  liveElapsedSeconds: number
  mode: SessionMode
  onModeChange: (mode: SessionMode) => void
  durationMinutes: number
  onDurationMinutesChange: (minutes: number) => void
  onStart: () => void
  onStop: () => void
  onCancel: () => void
}

function CancelIcon() {
  return (
    <svg className="button-icon" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg className="button-icon" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3 1.8v8.4a.6.6 0 0 0 .9.5l6.6-4.2a.6.6 0 0 0 0-1L3.9 1.3a.6.6 0 0 0-.9.5Z" fill="currentColor" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg className="button-icon" viewBox="0 0 12 12" aria-hidden="true">
      <rect x="2" y="2" width="8" height="8" rx="1.5" fill="currentColor" />
    </svg>
  )
}

export function FocusSession({
  project,
  isRunning,
  liveElapsedSeconds,
  mode,
  onModeChange,
  durationMinutes,
  onDurationMinutesChange,
  onStart,
  onStop,
  onCancel,
}: FocusSessionProps) {
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
      <section className="focus-card is-empty">
        <div className="focus-main">
          <p className="eyebrow">No project selected</p>
          <h2 className="focus-project">Pick a project</h2>
          <p className="focus-caption">Select a project from the sidebar to start a focus session.</p>
        </div>
        <div className="focus-side">
          <div className="timer-display" aria-hidden="true">
            {formatClockLong(0)}
          </div>
          <button type="button" className="button button-primary button-large" disabled>
            <PlayIcon />
            Start
          </button>
        </div>
      </section>
    )
  }

  const projectedTotal = project.totalSeconds + (isRunning ? liveElapsedSeconds : 0)
  const canStart = mode === 'stopwatch' || durationMinutes > 0

  const displaySeconds = isRunning
    ? mode === 'timer'
      ? remainingSeconds
      : liveElapsedSeconds
    : mode === 'timer'
      ? durationSeconds
      : 0

  const caption = isRunning
    ? mode === 'timer'
      ? 'A bell will sound when time is up. Stop to save early, or cancel to discard it.'
      : 'Stop to save this time, or cancel to discard it.'
    : mode === 'timer'
      ? durationMinutes > 0
        ? `Counts down from ${durationMinutes} minute${durationMinutes === 1 ? '' : 's'} when you press start.`
        : 'Choose a session length to start the timer.'
      : 'Counts up from zero when you press start.'

  return (
    <section className={`focus-card ${isRunning ? 'is-running' : ''}`}>
      <div className="focus-main">
        <p className="eyebrow">{isRunning ? 'Focusing now' : 'Ready to focus'}</p>
        <h2 className="focus-project">
          <span className="focus-project-dot" style={{ backgroundColor: project.color }} aria-hidden="true" />
          <span className="focus-project-name">{project.name}</span>
        </h2>

        {project.labels.length > 0 ? (
          <ul className="focus-labels" aria-label="Labels">
            {project.labels.map((label) => (
              <li key={label} className="focus-label-chip">
                <span className="label-dot" style={{ backgroundColor: getLabelColor(label) }} />
                {label}
              </li>
            ))}
          </ul>
        ) : null}

        <p className="focus-caption">{caption}</p>

        {!isRunning ? (
          <div className="session-options">
            <div className="segmented" role="radiogroup" aria-label="Session mode">
              {(['stopwatch', 'timer'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`segmented-option ${mode === option ? 'selected' : ''}`}
                  aria-pressed={mode === option}
                  onClick={() => onModeChange(option)}
                >
                  {option === 'stopwatch' ? 'Stopwatch' : 'Timer'}
                </button>
              ))}
            </div>

            {mode === 'timer' ? (
              <div className="duration-picker">
                {DURATION_PRESETS_MINUTES.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    className={`preset-button ${durationMinutes === minutes ? 'selected' : ''}`}
                    onClick={() => onDurationMinutesChange(minutes)}
                  >
                    {minutes}m
                  </button>
                ))}
                <label className="duration-input">
                  <input
                    type="number"
                    min={1}
                    max={480}
                    value={durationMinutes === 0 ? '' : durationMinutes}
                    aria-label="Custom session length in minutes"
                    onChange={(event) => {
                      const raw = event.target.value
                      if (raw === '') {
                        onDurationMinutesChange(0)
                        return
                      }
                      const parsed = Math.round(Number(raw))
                      if (Number.isFinite(parsed)) {
                        onDurationMinutesChange(Math.max(0, Math.min(480, parsed)))
                      }
                    }}
                  />
                  <span>min</span>
                </label>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="focus-side">
        <div className="timer-display" aria-live="polite">
          {formatClockLong(displaySeconds)}
        </div>
        {isRunning ? (
          <div className="focus-actions">
            <button
              type="button"
              className="button button-primary button-large"
              onClick={onStop}
              title={`Save this session · new total ${formatDurationShort(projectedTotal)}`}
            >
              <StopIcon />
              Stop
            </button>
            <button type="button" className="button button-danger-soft button-large" onClick={onCancel}>
              <CancelIcon />
              Cancel session
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="button button-primary button-large"
            disabled={!canStart}
            onClick={onStart}
          >
            <PlayIcon />
            Start
          </button>
        )}
      </div>
    </section>
  )
}
