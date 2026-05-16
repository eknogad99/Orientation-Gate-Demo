# ORIENTATION GATE™

### A Pre-Inference Control Layer for Agentic AI Systems

Agentic AI systems are increasingly capable of initiating actions, invoking tools, executing workflows, and affecting operational environments with limited human intervention.

Yet many current architectures still transition directly from orchestration to execution without a deterministic governance layer capable of evaluating operational state, policy alignment, and execution risk prior to downstream action initiation.

ORIENTATION GATE™ proposes an execution governance layer positioned between orchestration and execution, capable of rendering deterministic ALLOW, WARN, or BLOCK decisions before actions occur.

---

## Architectural Placement

```text
Agent
  ↓
Orchestrator
  ↓
ORIENTATION GATE™
├─ ALLOW
├─ WARN
└─ BLOCK
  ↓
Execution Layer
```

---

## Governed Execution Example

### Deployment Attempt During Drift State

### Input

```json
{
  "action": "deploy_update",
  "systemState": "drift",
  "stability_score": 0.32,
  "threshold": 0.50
}
```

### Policy Evaluation

```text
Decision: BLOCK
Policy Rule: OG-RULE-001
Confidence: 0.91

Reason:
Stability score below threshold during drift;
deployment blocked.
```

The governance layer prevents downstream execution before deployment occurs.

---

## Replay Verification

ORIENTATION GATE™ supports deterministic replay verification by re-evaluating historical execution conditions against the active governance policy set.

```text
Original Decision: BLOCK
Replayed Decision: BLOCK

Original Policy: OG-RULE-001
Replayed Policy: OG-RULE-001

Match: TRUE
```

Replay verification enables auditability, execution traceability, and deterministic policy validation under reproducible operational conditions.

---

## Policy Versioning

Governance policies are externalized and versioned independently from orchestration systems.

```json
{
  "policy_version": "v1.0.0",
  "rule_id": "OG-RULE-001",
  "decision": "BLOCK"
}
```

Policy versioning allows execution decisions to remain attributable to specific governance conditions over time.

---

## Fail-Closed Governance

If required evaluation inputs are absent or invalid, ORIENTATION GATE™ defaults to deterministic BLOCK behavior.

```text
Decision: BLOCK
Policy: OG-FAIL-CLOSED

Reason:
Missing or invalid input;
evaluation cannot proceed.
```

Fail-closed behavior prevents downstream execution under incomplete or unverifiable operational conditions.

---

## Core Principle

> AI systems need a deterministic execution governance layer between orchestration and execution.


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


