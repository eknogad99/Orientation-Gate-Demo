# Orientation Gate™

### Governing Consequential Execution

Orientation Gate™ is an execution-governance layer that evaluates the admissibility of consequential actions before execution.

In plain language:

> Orientation Gate™ helps organizations decide whether an important action should happen before it happens.

## Version 1.0 repository scope

This repository is a **reference demonstrator** of the decision and evidence loop required for execution governance. It proves that operational decision, delegated authority, resulting-state admissibility, and final execution outcome can be evaluated separately and composed before a mock executor is invoked.

It is not yet a production, non-bypassable gateway. It does not intercept arbitrary tools, APIs, databases, model calls, or operating-system operations. Public claims about this repository must remain within that demonstrated boundary.

## Why orientation?

Organizations already measure security, compliance, maturity, readiness, and capability. Those measures remain essential, but they usually assume that the organization is presently oriented for consequential execution.

Orientation asks:

> Given the present operating context, delegated authority, intended action, and resulting state, should this execution presently proceed?

| Organizations measure | Question answered |
| --- | --- |
| Security | Is it protected? |
| Compliance | Is it permitted? |
| Maturity | How developed is it? |
| Readiness | Can it begin? |
| Capability | Can it perform? |
| **Orientation** | **Should it presently proceed to consequential execution?** |

## Implemented execution-governance path

```text
Validated request
      ↓
Versioned operational policy
      ↓
ALLOW | WARN | BLOCK
      ↓
AUTONOMOUS | SUPERVISED | BLOCKED
      ↓
Resulting-state admissibility
      ↓
EXECUTE | ESCALATE | DENY
      ↓
Mock execution boundary + versioned evidence + replay
```

Only `executionOutcome: EXECUTE` may invoke the mock executor. `ESCALATE`, `DENY`, invalid input, unmatched policy, and internal evaluation failure remain non-executable.

## Demonstrated proof surfaces

- `POST /evaluate` returns a versioned evaluation and records local evidence.
- `POST /execute-demo` proves whether the mock executor was invoked.
- `POST /replay/:id` compares decision, authority, execution outcome, and state transition using the original policy and engine versions.
- The active React interface displays operating context, authority, execution outcome, mock-executor invocation, state transition, and replay results.
- Automated tests verify the execution-boundary acceptance matrix and fail-closed request handling.

See [Review 004 — Execution-Boundary Proof](REVIEW_004_EXECUTION_BOUNDARY.md) for the governing acceptance specification.

## Decision composition

| Condition | Final outcome | Mock executor |
| --- | --- | --- |
| `ALLOW` + `AUTONOMOUS` + admissible resulting state | `EXECUTE` | Invoked |
| `WARN`, `SUPERVISED`, or at-risk resulting state | `ESCALATE` | Not invoked |
| `BLOCK`, `BLOCKED`, or inadmissible resulting state | `DENY` | Not invoked |
| Invalid request or unmatched policy | `DENY` | Not invoked |

## Request contract

`POST /evaluate` and `POST /execute-demo` require:

```json
{
  "action": "deploy_update",
  "operatingContext": "drift",
  "actorRole": "operator",
  "requestedAuthority": "deploy",
  "requiresApproval": false,
  "previousState": {
    "stability": 1,
    "configurationIntegrity": 1,
    "resourcePressure": 0
  }
}
```

Missing, unknown, inconsistent, or out-of-range values return HTTP `400`, `OG-INVALID-REQUEST`, and `executionOutcome: DENY`.

See [API Reference](docs/api.md) for complete endpoint and error behavior.

## Repository architecture

- `backend/engine.ts` — validation, operational evaluation, authority, state transition, outcome composition, and governed execution.
- `backend/policy.json` — active Version 1.0 release-candidate policy.
- `backend/policy.ts` — policy loading contract.
- `backend/evidence-store.ts` — local atomic JSON evidence adapter.
- `backend/server.ts` — HTTP boundary, restricted CORS, evidence endpoints, and fail-closed error handling.
- `backend/tests/` — execution-boundary and invalid-input verification.
- `frontend/src/main.tsx` and `frontend/src/App.tsx` — active proof surface.

The local JSON evidence adapter is demonstrator infrastructure, not production persistence. See [Architecture and Trust Boundaries](docs/architecture.md).

## Local setup

Requirements:

- Node.js 24
- npm 11 or compatible

Backend:

```bash
cd backend
npm ci
npm run dev
```

Frontend:

```bash
cd frontend
npm ci
npm run dev
```

The backend defaults to `http://localhost:3001`. The frontend defaults to that URL and may be configured with `VITE_API_BASE_URL`.

## Verification

```bash
cd backend
npm ci
npm run typecheck
npm test
npm run replay-contract
npm audit --audit-level=low

cd ../frontend
npm ci
npm run build
npm audit --audit-level=low
```

The GitHub verification workflow runs the same checks from a clean checkout. It performs no deployment and makes no call to an external Orientation Gate service.

## Security and operating defaults

- Unknown or invalid inputs fail closed.
- Policy and engine versions are attached to evidence.
- Replay refuses a policy or engine version mismatch.
- Audit-log access is disabled unless `ENABLE_LOG_API=true`.
- Browser origins default to the local Vite development URLs and may be set through `ALLOWED_ORIGINS`.
- Runtime evidence is excluded from version control.
- Evidence persistence must succeed before the mock executor is invoked.

These controls harden the reference demonstrator; they do not make it a production security boundary. See [SECURITY.md](SECURITY.md).

## Capability classification

[CURRENT_CAPABILITIES.md](CURRENT_CAPABILITIES.md) distinguishes demonstrated, implemented, planned, and production capability. That distinction governs public claims.

## Intended role and license

This repository is a **proprietary reference implementation** of the Orientation Gate™ Version 1.0 execution-governance architecture. Its purpose is to make the governing concepts, decision composition, proof surfaces, and verification evidence inspectable.

It is not a production system, a hosted service, or a ready-to-deploy security boundary. Production use would require a separately authorized implementation with non-bypassable integration, identity controls, durable evidence, operational monitoring, deployment-specific threat modeling, and independent verification.

The source is publicly visible for evaluation, research, and discussion, but it is **not open source**. No permission to copy, modify, distribute, commercialize, or create derivative works is granted without prior written authorization. See [LICENSE](LICENSE).

## Engineering review discipline

Every repository change must trace to a numbered item in the Orientation Gate™ Version 1.0 Engineering Review or an accepted acceptance specification. Contribution requirements are defined in [CONTRIBUTING.md](CONTRIBUTING.md).

Current review outcomes and remaining release gates are maintained in the [Engineering Review Status Register](ENGINEERING_REVIEW_STATUS.md).

---

Contact  
Raymond Brown  
https://www.linkedin.com/in/rlb1183/
