# Orientation Gate Demo

Pre-execution control layer for automated systems.

## 🎥 Demo

[Orientation Gate Blocks Deploy During Drift](PASTE_YOUR_LOOM_LINK_HERE)

---

## What It Does

Orientation Gate sits between intent and execution.
```text
Action Attempt → Evaluation → Decision → Execute or Stop
```

## Core Behavior

| System State | Action              | Decision |
| ------------ | ------------------- | -------- |
| Stable       | Safe Read Operation | ALLOW    |
| Stable       | Config Change       | ALLOW    |
| Stable       | Deploy Code Update  | ALLOW    |
| Under Drift  | Safe Read Operation | ALLOW    |
| Under Drift  | Config Change       | WARN     |
| Under Drift  | Deploy Code Update  | BLOCK    |


## Example Output

```json
{
  "actionAttempted": "Deploy Code Update",
  "coherenceCheck": "FAILED",
  "decision": "BLOCK",
  "reason": "Temporal + System Drift",
  "displacement": {
    "temporal": "HIGH",
    "system": "HIGH",
    "energy": "MEDIUM"
  },
  "confidence": 0.91
}
```
## CI/CD Integration

Orientation Gate integrates with GitHub Actions as a pre-deployment check.

```text
GitHub Workflow → Orientation Gate → Decision
```

If the system returns BLOCK, the pipeline exits with code 1 and deployment stops.

## Local Setup
### Backend

```bash
cd backend
npm install
npm run dev
```
Runs at: http://localhost:3001

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs at: http://localhost:5173

## API
POST /evaluate

Example request:

```json
{
  "action": "deploy_update",
  "systemState": "drift"
}
```

Returns a decision, reason, displacement values, confidence score, and timestamp.

## Positioning

Orientation Gate is not just a dashboard.

It is a control layer that evaluates whether an action should execute before it happens.

```text
Intent → Evaluation → Decision → Execution Boundary
```


