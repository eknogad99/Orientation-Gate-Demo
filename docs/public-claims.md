# Public Claims and Evidence

**Governing review:** Review 007 — Public Release Readiness

This matrix is the maximum public claim surface for the Orientation Gate™ Version 1.0 repository. Absence from this matrix means the repository does not claim the capability.

| Public claim | Classification | Repository evidence | Binding limitation |
| --- | --- | --- | --- |
| The system evaluates admissibility before mock execution. | Demonstrated | `backend/engine.ts`, `POST /execute-demo`, boundary tests | In-process reference boundary only |
| Only `executionOutcome: EXECUTE` invokes the mock executor. | Demonstrated | `executeGovernedAction`, seven hosted tests | Does not intercept external tools or operating-system actions |
| Invalid, incomplete, unmatched, or internally failed evaluations deny execution. | Demonstrated | Strict validation, unmatched-policy fallback, HTTP tests | Application-process behavior, not an external security perimeter |
| Decision, authority, state admissibility, and execution outcome are composed separately. | Demonstrated | `backend/engine.ts`, policy adapter, UI proof surface | Reference policy and categorical operating context |
| Evidence is written before permitted mock execution. | Demonstrated | Evidence callback ordering and failure test | Local JSON evidence is mutable and non-production |
| Replay detects policy-version mismatch and compares four result surfaces. | Demonstrated | Replay endpoint, contract verifier, hosted tests | Replays only evidence compatible with the current reference policy |
| The repository has reproducible verification. | Demonstrated | GitHub Actions workflow and Review 006 hosted runs | Verification applies to the identified commit and merge tree |
| The repository is a Version 1.0 reference implementation. | Implemented | Version-aligned packages, engine, policy, documentation | Not a production system, hosted service, or non-bypassable gateway |
| Production execution governance is available. | Not claimed | None | Requires real adapter, identity, durable evidence, observability, incident response, and independent verification |

## Prohibited extrapolations

The repository must not be described as production-ready, independently certified, tamper-proof, immutable, high-availability, compliant with a specific regulatory regime, or capable of governing arbitrary external execution. Those are planned or deployment-specific capabilities, not demonstrated repository properties.
