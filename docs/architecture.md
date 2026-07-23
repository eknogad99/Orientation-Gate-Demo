# Architecture and Trust Boundaries

**Review traceability:** 003, 004, 005, and 007.

## Reference architecture

```text
React proof surface
        ↓
Express HTTP boundary
        ↓
Request validation
        ↓
Versioned policy + authority + state transition
        ↓
EXECUTE | ESCALATE | DENY
        ↓
Mock executor        Local evidence adapter
        ↓                       ↓
Execution receipt          Version-bound replay
```

## Component responsibilities

- `engine.ts` is deterministic and owns the execution-governance composition.
- `policy.json` is the active versioned operational policy.
- `policy.ts` loads the policy and rejects structurally incomplete policy data.
- `evidence-store.ts` isolates the demonstrator persistence mechanism.
- `server.ts` owns HTTP validation, local-origin controls, endpoint exposure, evidence writes, replay refusal, and fail-closed error responses.
- `App.tsx` is a proof surface; it is not a security control.

## Trust boundaries

1. **Untrusted request → validation.** No request reaches evaluation without schema and range checks.
2. **Validated request → policy evaluation.** No unmatched validated request defaults to allow.
3. **Evaluation → executor.** Only `EXECUTE` invokes the mock executor.
4. **Evidence → replay.** Replay refuses legacy or version-mismatched evidence.

## Known non-production boundaries

- The executor is in-process and demonstrative; it is not a non-bypassable external control point.
- Evidence is stored in a local JSON file and is not immutable, authenticated, signed, replicated, or production durable.
- Administrative authentication, rate limiting, production telemetry, and incident recovery are not implemented.
- Policy loading validates only the minimum Version 1.0 reference structure; a production schema and signed policy distribution mechanism are not implemented.

These limitations are deliberate and must remain visible in public claims.
