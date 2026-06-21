# Orientation Gate

### Governing Consequential Execution

Orientation Gate is a pre-execution governance layer for autonomous and agentic systems.

It evaluates proposed actions before execution and determines:

1. Whether the action is operationally admissible under current conditions.
2. Whether the requesting actor has enough authority to execute it.
3. Whether the evaluation can be logged and replayed for audit verification.

Orientation Gate sits between orchestration and execution.

```text
Agent / Workflow
        ↓
 ORIENTATION GATE
        ↓
Execution Layer
```

The objective is simple:

> Prevent inadmissible execution before consequence occurs.

---

## Current Capabilities

### 1. Operational Decisions

The `/evaluate` endpoint determines the operational decision for a proposed action.

Possible values:

- `ALLOW`
- `WARN`
- `BLOCK`

Current demonstrated behavior:

- Stable safe read → `ALLOW`
- Stable config change → `ALLOW`
- Config change during drift → `WARN`
- Stable deploy update → `ALLOW`
- Deploy update during drift → `BLOCK`

This layer answers:

> Is this action safe under current system conditions?

---

### 2. Authority Escalation

The `/evaluate` endpoint also returns an independent authority result.

Optional request fields:

```json
{
  "actorRole": "operator",
  "requestedAuthority": "deploy",
  "requiresApproval": false
}
```

Returned fields:

```json
{
  "authorityMode": "BLOCKED",
  "authorityReason": "Requested authority 'deploy' exceeds actor role 'operator'."
}
```

Possible `authorityMode` values:

- `AUTONOMOUS`: the actor has enough authority to proceed without extra approval.
- `SUPERVISED`: the action requires review, approval, or human oversight.
- `BLOCKED`: the requested authority exceeds the actor's role.

This layer answers:

> Is this actor allowed to perform the requested level of authority?

Important distinction:

> An action may be operationally allowed while still being blocked by authority constraints.

Example:

```json
{
  "decision": "ALLOW",
  "authorityMode": "BLOCKED"
}
```

---

### 3. Evaluation Logging

Every `/evaluate` call now creates a durable audit entry in:

```text
backend/logs.json
```

Each logged evaluation includes:

- `id`
- timestamp
- original request inputs:
  - `action`
  - `systemState`
  - `actorRole`
  - `requestedAuthority`
  - `requiresApproval`
- returned outputs:
  - `decision`
  - `reason`
  - `authorityMode`
  - `authorityReason`
  - `confidence`

The current backend also exposes:

```text
GET /logs
```

This returns the current audit history from `backend/logs.json`.

---

### 4. Replay Verification

Logged evaluations can be replayed by evaluation id.

Endpoint:

```text
POST /replay/:id
```

Replay uses the original logged request inputs and re-runs the current evaluation logic. It does not create a new log entry.

Replay compares:

- original `decision`
- replayed `decision`
- original `authorityMode`
- replayed `authorityMode`

Replay returns:

```json
{
  "id": "example-id",
  "original": {
    "decision": "ALLOW",
    "authorityMode": "BLOCKED"
  },
  "replayed": {
    "decision": "ALLOW",
    "authorityMode": "BLOCKED"
  },
  "decisionMatches": true,
  "authorityMatches": true
}
```

If the log entry is missing:

```json
{
  "error": "Evaluation log not found"
}
```

If an older log entry does not contain the replay inputs:

```json
{
  "error": "Evaluation log does not contain replay inputs"
}
```

---

## Example Evaluation Request

```json
{
  "action": "deploy_update",
  "systemState": "stable",
  "actorRole": "operator",
  "requestedAuthority": "deploy"
}
```

Example response:

```json
{
  "id": "1781980000000-ab12cd34",
  "actionAttempted": "Deploy Code Update",
  "coherenceCheck": "PASSED",
  "decision": "ALLOW",
  "reason": "System stable",
  "displacement": {
    "temporal": "LOW",
    "system": "LOW",
    "energy": "LOW"
  },
  "confidence": 0.95,
  "authorityMode": "BLOCKED",
  "authorityReason": "Requested authority 'deploy' exceeds actor role 'operator'.",
  "timestamp": "2026-06-20T00:00:00.000Z"
}
```

Interpretation:

- The action is operationally acceptable.
- The actor lacks deploy authority.
- The authority layer blocks execution.
- The evaluation is logged and can be replayed by id.

---

## Architecture

```text
Agent / Workflow
        ↓
Operational Evaluation
        ↓
ALLOW | WARN | BLOCK
        ↓
Authority Evaluation
        ↓
AUTONOMOUS | SUPERVISED | BLOCKED
        ↓
Evaluation Logging
        ↓
Replay Verification
        ↓
Execution Outcome
```

---

## Local Setup

Backend:

```bash
cd backend
npm install
npm run dev
```

Runs at:

```text
http://localhost:3001
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Runs at the Vite local URL, usually:

```text
http://localhost:5173
```

---

## Roadmap

Future work may add:

- explicit policy versioning
- externalized operational policy rules
- richer audit log browsing in the UI
- replay history reporting

---

## Orientation Principle

Traditional governance asks:

> Can this action be performed?

Orientation asks:

> Does the resulting state remain admissible once the action enters the field of all other actions already in motion?

Orientation Gate exists to answer that question before execution occurs.

---

Contact  
Raymond Brown  
https://www.linkedin.com/in/rlb1183/
