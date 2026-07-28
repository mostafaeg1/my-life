# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start Vite dev server (http://localhost:5173)
npm run build     # type-check (tsc -b) then production build via Vite
npm run lint      # run oxlint
npm run preview   # preview the production build
```

There is no test suite configured in this project.

## Architecture

This is a small client-only React + TypeScript app (Vite) with no backend. State is split across two independent, localStorage-backed hooks rather than one global store — each owns a distinct feature area and persists under its own key.

- [src/hooks/useTimeTracker.ts](src/hooks/useTimeTracker.ts) is the source of truth for time-tracking state, persisted under the `project-time-tracker` key. It owns `AppState` (`projects` + `activeSession` + `sessions`), loads/saves it to `localStorage` on every change, and exposes all mutations (`addProject`, `deleteProject`, `updateProject`, `startSession`, `stopSession`, `getProject`). `stopSession` both increments the project's `totalSeconds` and appends a `SessionRecord` (project id, start/end, duration) to `sessions` — the latter is what the dashboard charts are built from; a running total alone can't answer "how much time over the last week/month/year."
- [src/hooks/useHabits.ts](src/hooks/useHabits.ts) is the source of truth for the "don't break the chain" habit tracker, persisted separately under `project-time-tracker-habits`. It owns `Habit[]` (name, color, `completedDates: string[]` of `YYYY-MM-DD` keys) and exposes `addHabit`, `deleteHabit`, `toggleDate`. Completion is stored as a flat list of date keys rather than a nested per-day structure — streaks are derived from it on read via [src/utils/habitDates.ts](src/utils/habitDates.ts) (`getCurrentStreak`, `getLongestStreak`, `buildChainWeeks`), not stored.
- [src/App.tsx](src/App.tsx) is the sole consumer of both hooks and switches between three pages (`tracker` / `dashboard` / `habits`) via local `view` state — there is no router; it's a single-page app with in-memory view switching. It also owns transient UI-only state that isn't persisted: `selectedProjectId`, `editingProjectId`, and a `setInterval`-driven `liveElapsedSeconds` ticker used to render the live timer for the running session.
- Timers are not persisted as ticking state — a session only records elapsed time when `stopSession` is called, computed from the difference between `Date.now()` and `activeSession.startedAt` (an ISO string). The live-updating display during an active session is purely derived UI state in `App.tsx`, recomputed every second via `elapsedSecondsSince` in [src/utils/time.ts](src/utils/time.ts).
- Only one project can have an active session at a time (`AppState.activeSession` is a single nullable object, not per-project).
- New projects and new habits are both auto-assigned a color from the same fixed palette in [src/constants/projectColors.ts](src/constants/projectColors.ts), cycling by current item count within their own list.
- [src/components/Dashboard.tsx](src/components/Dashboard.tsx) buckets `sessions` by day (week/month range) or month (year range) via [src/utils/dashboardData.ts](src/utils/dashboardData.ts), then folds all but the top 7 projects by time into an "Other" series before handing data to [src/components/DashboardChart.tsx](src/components/DashboardChart.tsx) — a hand-rolled SVG stacked bar chart (no charting dependency). Segment colors reuse each project's own `color` rather than a generated palette, so identity stays consistent with the sidebar/project list.
- [src/components/HabitChain.tsx](src/components/HabitChain.tsx) renders the GitHub-contributions-style calendar grid (26 weeks, Sun–Sat columns) used for the "don't break the chain" view; clicking any non-future day toggles that date directly through `useHabits`' `toggleDate`.
