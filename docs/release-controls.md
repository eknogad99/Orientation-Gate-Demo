# Version 1.0 Release Controls

**Governing review:** Review 007 — Public Release Readiness

These controls govern merge, version designation, tagging, rollback, and public release. A successful build or hosted workflow is necessary but not sufficient authorization.

## Release object

Version 1.0 designates the proprietary Orientation Gate™ reference implementation in this repository. It does not designate a production system, hosted service, certified control, or non-bypassable external gateway.

The backend package, frontend package, engine, and active policy use version `1.0.0`. Version alignment identifies the candidate contents; it does not itself authorize release.

## Required authorization evidence

Before merge or release designation, the review board must record:

1. the exact candidate commit and branch;
2. Review 001–007 status;
3. the hosted workflow run and successful job steps;
4. repository cleanliness and claim-to-evidence reconciliation;
5. accepted non-production limitations;
6. an explicit **MERGE AUTHORIZED** or **MERGE REFUSED** determination.

## Controlled merge sequence

1. Keep the candidate pull request in draft while any review item is not `PASS`.
2. Require the hosted `Orientation Gate Review Verification / verify` job to pass on the final candidate.
3. Confirm that the pull request head SHA has not changed since the board determination.
4. Mark the pull request ready only after Review 007 records `PASS` and **MERGE AUTHORIZED**.
5. Merge without bypassing required checks and without force-pushing `main`.
6. Record the resulting `main` merge commit.
7. Require the verification workflow to pass on that exact `main` commit.
8. Create annotated tag `v1.0.0` only after the post-merge workflow passes.
9. Verify that the tag resolves to the approved `main` commit, then create the public release record.

No release-candidate or Version 1.0 designation is authorized before step 4. No tag is authorized before step 8.

## Tagging and immutability

- Release tag: `v1.0.0`.
- Tags are immutable release evidence and must not be moved or reused.
- A failed or withdrawn candidate receives no release tag.
- Later corrections use a new semantic version and a new Engineering Review entry.

## Rollback

If a material defect is found after merge but before tagging:

1. stop the release sequence;
2. revert the merge through a new reviewed pull request;
3. preserve the failed commit and workflow evidence;
4. return Review 007 to `HOLD`.

If a defect is found after tagging:

1. do not move or delete `v1.0.0`;
2. mark the release as affected and document the defect;
3. revert through a reviewed corrective commit when necessary;
4. issue a new semantic version only after verification and review.

Rollback is history-preserving. Force-push, tag reassignment, and evidence deletion are prohibited.

## Branch and merge controls

The repository owner must require pull-request review and the hosted verification job for `main` where GitHub plan and repository settings permit. Until those settings are independently confirmed, the draft-PR state, exact-SHA board determination, and explicit no-bypass procedure are the governing merge controls.
