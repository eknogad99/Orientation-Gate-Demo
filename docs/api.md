# Version 1.0 API Reference

**Review traceability:** 002, 004, 005, 006, and 007.

The reference backend defaults to `http://localhost:3001`.

## Shared evaluation request

`POST /evaluate` and `POST /execute-demo` require:

- `action`: `safe_read`, `config_change`, or `deploy_update`;
- `operatingContext`: `stable` or `drift`;
- `previousState`: object containing `stability`, `configurationIntegrity`, and `resourcePressure`, each from `0` through `1`;
- `actorRole` and `requestedAuthority`: both omitted/null, or both supplied with recognized values;
- `requiresApproval`: optional boolean.

## `GET /health`

Returns service status plus active policy and engine versions.

## `POST /evaluate`

Validates and evaluates the proposed action, records local evidence, and returns the decision, authority mode, resulting state, execution outcome, rule ID, policy version, and engine version. It does not invoke an executor.

## `POST /execute-demo`

Runs the same evaluation and invokes an in-process mock executor only when `executionOutcome` is `EXECUTE`. The response includes `executorInvoked` and, when invoked, an execution receipt.

## `POST /replay/:id`

Re-evaluates the original validated inputs only when the original policy and engine versions match the active versions. Returns four match indicators:

- `decisionMatches`;
- `authorityMatches`;
- `executionOutcomeMatches`;
- `stateTransitionMatches`.

## `GET /logs`

Disabled by default. Set `ENABLE_LOG_API=true` for local demonstration. Production use requires authenticated access and a production evidence adapter.

## Fail-closed errors

| HTTP | Code | Meaning |
| --- | --- | --- |
| 400 | `OG-INVALID-REQUEST` | Input is missing, unknown, inconsistent, or out of range. Outcome is `DENY`. |
| 403 | `OG-LOG-API-DISABLED` | Audit-log browsing is not enabled. |
| 404 | `OG-EVIDENCE-NOT-FOUND` | No evaluation evidence exists for the supplied ID. |
| 409 | `OG-LEGACY-EVIDENCE` | Evidence predates the Version 1.0 replay contract. |
| 409 | `OG-REPLAY-VERSION-MISMATCH` | Original policy/engine versions are not active. Replay is refused. |
| 500 | `OG-INTERNAL-FAIL-CLOSED` | Evaluation could not complete. Outcome is `DENY`; executor is not invoked by the failed evaluation path. |
