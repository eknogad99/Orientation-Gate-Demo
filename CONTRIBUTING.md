# Contributing

The Orientation Gate™ Version 1.0 Engineering Review is the governing artifact for repository changes.

This is a proprietary repository. Opening an issue, proposing a change, or submitting material does not grant a license to the repository and does not guarantee acceptance. Contribution terms must be agreed before external code or documentation is incorporated.

## Traceability requirement

Every change must identify:

1. the numbered Review item or accepted acceptance specification;
2. the engineering objective;
3. the implementation;
4. the evidence that satisfies the finding;
5. remaining gaps;
6. the resulting review status.

A change that cannot be traced to the Engineering Review must explain why it is necessary before implementation.

## Change discipline

- Do not introduce feature work unless a review finding requires it.
- Favor reproducibility, evidence, verification, and fail-closed behavior.
- Keep demonstrated, implemented, planned, and production capability distinct.
- Do not increase public claims without corresponding evidence.
- Use a commit or pull-request title beginning with the governing item, for example: `[Review 004] Prove mock execution boundary`.

## Required verification

Run the backend typecheck, execution-boundary tests, replay contract, dependency audit, frontend build, and frontend dependency audit described in the README. A pull request is not review-complete until the hosted verification workflow passes.
