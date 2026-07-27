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

This is a small client-only React + TypeScript app (Vite) with no backend — all state persists to `localStorage` under the key `project-time-tracker`.

- [src/hooks/useTimeTracker.ts](src/hooks/useTimeTracker.ts) is the single source of truth for app state. It owns `AppState` (`projects` + `activeSession`), loads/saves it to `localStorage` on every change, and exposes all mutations (`addProject`, `deleteProject`, `updateProject`, `startSession`, `stopSession`, `getProject`). All state logic lives here — components are presentational and receive data/callbacks as props rather than touching storage directly.
- [src/App.tsx](src/App.tsx) is the sole consumer of `useTimeTracker` and composes the UI (`ProjectList`, `AddProjectForm`, `FocusSession`). It also owns transient UI-only state that isn't persisted: `selectedProjectId`, `editingProjectId`, and a `setInterval`-driven `liveElapsedSeconds` ticker used to render the live timer for the running session.
- Timers are not persisted as ticking state — a session only records elapsed time (`totalSeconds`) when `stopSession` is called, computed from the difference between `Date.now()` and `activeSession.startedAt` (an ISO string). The live-updating display during an active session is purely derived UI state in `App.tsx`, recomputed every second via `elapsedSecondsSince` in [src/utils/time.ts](src/utils/time.ts).
- Only one project can have an active session at a time (`AppState.activeSession` is a single nullable object, not per-project).
- New projects are auto-assigned a color from the fixed palette in [src/constants/projectColors.ts](src/constants/projectColors.ts), cycling by current project count.
