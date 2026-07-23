# Changelog

All notable repository changes will be recorded here and traced to the Orientation Gate™ Version 1.0 Engineering Review.

## Unreleased — Version 1.0 Release Candidate

### Reviews 004, 006, and 007

- Added a governed mock execution boundary where only `EXECUTE` invokes the executor.
- Added strict request validation and fail-closed unmatched-policy behavior.
- Externalized the active operational rules into a versioned policy.
- Added state admissibility to execution-outcome composition.
- Added policy and engine versions to evidence and replay.
- Added version-mismatch replay refusal.
- Replaced the simulated external deployment workflow with clean-checkout verification.
- Added execution-boundary tests and dependency audits.
- Restricted audit-log exposure and local browser origins by default.
- Removed legacy frontend scaffolding, runtime evidence, and machine-specific artifacts.
- Aligned repository documentation with demonstrated evidence and non-production boundaries.
- Added a proprietary all-rights-reserved license notice and aligned it with the repository's reference-implementation role.
