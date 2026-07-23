# Current Capabilities

This inventory is governed by Reviews 002, 004, 005, 006, and 007 of the Orientation Gate™ Version 1.0 Engineering Review. Public claims must not exceed the evidence classified here.

## Demonstrated capability

Demonstrated means directly observable through the active UI, API, or automated verification.

- Versioned operational decisions: `ALLOW`, `WARN`, and `BLOCK`.
- Independent authority modes: `AUTONOMOUS`, `SUPERVISED`, and `BLOCKED`.
- Resulting-state classifications: `STATE_ADMISSIBLE`, `STATE_AT_RISK`, and `STATE_INADMISSIBLE`.
- Composed execution outcomes: `EXECUTE`, `ESCALATE`, and `DENY`.
- A mock execution boundary where only `EXECUTE` invokes the executor.
- Fail-closed rejection of invalid, incomplete, and unmatched-policy requests.
- Local evidence records with policy and engine versions.
- Replay comparison of decision, authority, execution outcome, and state transition.
- A clean frontend production build and backend typecheck.
- Automated execution-boundary and invalid-input tests.

## Implemented capability

Implemented means present in repository code but not necessarily proven under production conditions.

- Express HTTP endpoints for health, evaluation, governed mock execution, logs, and replay.
- Policy rules loaded from `backend/policy.json`.
- Atomic replacement of the local JSON evidence file.
- Restricted local-development CORS with environment configuration.
- Audit-log API disabled by default.
- Policy/engine replay-version checks.
- Environment-configurable frontend API base URL.
- Clean-checkout GitHub verification workflow.

## Planned capability

Planned means required by the Engineering Review but not implemented in this repository.

- A non-bypassable adapter between a real orchestrator and consequential executor.
- Durable, append-only production evidence storage.
- Authentication and authorization for administrative and evidence APIs.
- Retained historical policy bundles that permit replay across released versions.
- Signed evidence, tamper detection, and retention controls.
- Production observability, rate limiting, recovery, and deployment architecture.
- Connectors for external tools, APIs, databases, MCP servers, or operating-system controls.

## Production capability

No production capability is claimed for Version 1.0 at this stage.

The repository is a hardened reference demonstrator. Production capability requires deployment-specific threat modeling, non-bypassable integration, identity controls, durable evidence infrastructure, operational monitoring, incident response, and independent verification.

## Current release determination

**Release Candidate status: HOLD pending completion of Review 007.**

Remaining release-decision items include successful hosted CI evidence on the candidate commit and final Engineering Review status reconciliation.
