# Current Capabilities

This document reflects the current repository state. It separates implemented behavior from partially implemented or planned work.

## Implemented

### Operational Decisions

- `POST /evaluate` returns an operational `decision`.
- Supported decision values are `ALLOW`, `WARN`, and `BLOCK`.
- Current decision logic is implemented in backend code, not in an external policy engine.
- Current demonstrated inputs:
  - `safe_read`
  - `config_change`
  - `deploy_update`
- Current demonstrated system states:
  - `stable`
  - `drift`

### Authority Escalation

- `POST /evaluate` accepts optional authority fields:
  - `actorRole`
  - `requestedAuthority`
  - `requiresApproval`
- The backend returns:
  - `authorityMode`
  - `authorityReason`
- Supported `authorityMode` values are:
  - `AUTONOMOUS`
  - `SUPERVISED`
  - `BLOCKED`
- The authority result is separate from the operational decision.

### Evaluation Logging

- Each `/evaluate` call receives a unique `id`.
- Each `/evaluate` call is appended to `backend/logs.json`.
- Logged entries include original replay inputs:
  - `action`
  - `systemState`
  - `actorRole`
  - `requestedAuthority`
  - `requiresApproval`
- Logged entries include returned outputs:
  - `decision`
  - `reason`
  - `authorityMode`
  - `authorityReason`
  - `confidence`
  - `timestamp`
- `GET /logs` returns the contents of `backend/logs.json`.

### Replay Verification

- `POST /replay/:id` replays a logged evaluation by evaluation id.
- Replay uses the logged original request inputs.
- Replay re-runs the current backend evaluation logic.
- Replay compares:
  - original `decision` vs replayed `decision`
  - original `authorityMode` vs replayed `authorityMode`
- Replay returns:
  - `decisionMatches`
  - `authorityMatches`
- Replay does not append a new log entry.

### Active Frontend Surface

- The active frontend starts from `frontend/index.html`.
- `frontend/index.html` loads `frontend/src/main.tsx`.
- `frontend/src/main.tsx` renders `frontend/src/App.tsx`.
- The active UI supports:
  - system state selection
  - authority scenario selection
  - action evaluation buttons
  - display of operational decision
  - display of authority layer output
  - replay verification by evaluation id

### Build Verification

- Backend TypeScript verification is available through `tsc`.
- Frontend production build is available through `npm run build`.
- The frontend build currently compiles both the active React UI and legacy source files.

## Partially Implemented

### Policy Rules

- `backend/policy.json` exists and contains rule definitions.
- The active `/evaluate` endpoint does not currently apply `backend/policy.json`.
- Operational decisions are currently hardcoded in backend logic.

### Audit Log Visibility

- Backend logging is active.
- `GET /logs` exposes log data.
- The active UI does not currently include a full audit log browser or timeline.
- Replay can be initiated by id, but the user must know or copy the evaluation id.

### Replay Coverage For Historical Logs

- New log entries contain the inputs needed for replay.
- Older entries in `backend/logs.json` may not contain all replay inputs.
- The backend returns an error for older entries that cannot be replayed.

### Legacy Dashboard Code

- `frontend/src/main.ts` contains legacy dashboard concepts such as timeline, policy editing, status, summary, incident report, and export controls.
- This file is not the active frontend entry point.
- It is kept buildable, but it is not currently rendered by `frontend/index.html`.

### CI/CD Integration

- `.github/workflows/deploy.yml` contains a simulated deployment workflow.
- The workflow calls an external Orientation Gate URL.
- It is not wired to the local backend in this repository.
- The deploy step is simulated.

## Planned

### Externalized Policy Engine

- Move operational rules out of hardcoded backend branches.
- Apply versioned policy definitions from a structured policy source.
- Keep operational decisions reproducible across policy versions.

### Policy Versioning

- Attach a policy version to each evaluation.
- Store the policy version in `logs.json`.
- Include policy version in replay results.

### Audit Log Browser

- Add a visible UI for browsing logged evaluations.
- Allow selecting a logged evaluation and replaying it directly.
- Show replay status without requiring manual id copy/paste.

### Replay History

- Store replay attempts separately from evaluation logs.
- Record replay timestamp and comparison result.
- Preserve the distinction between original evaluation logs and replay verification events.

### Production Persistence

- Replace file-based `backend/logs.json` storage with a durable data store if this moves beyond demo/local use.

### CI/CD Hardening

- Point CI/CD checks at a stable deployed Orientation Gate service.
- Decide whether `authorityMode: BLOCKED` should fail deployment independently from `decision: BLOCK`.
