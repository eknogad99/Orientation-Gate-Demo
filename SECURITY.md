# Security Policy

**Review traceability:** 005 and 007.

## Supported status

No production version is currently supported. Version 1.0 is a reference demonstrator and must not be treated as a production security boundary.

The repository is proprietary and publicly visible for evaluation. Public visibility does not authorize production deployment, redistribution, modification, or commercialization. See `LICENSE`.

## Reporting a vulnerability

Use GitHub's private security-advisory feature for this repository. Do not disclose a suspected vulnerability in a public issue before a private review can occur.

Include the affected commit, reproduction steps, expected versus observed behavior, and the potential execution consequence.

## Security design priorities

- fail-closed behavior;
- non-execution under uncertainty;
- explicit policy and engine versions;
- reproducible evidence;
- separation of operational decision, authority, state, and execution outcome;
- public claims bounded by demonstrated evidence.

## Demonstrator limitations

The local JSON evidence adapter, local-development CORS configuration, mock executor, and optional log endpoint are not production controls. A production deployment requires its own threat model, identity boundary, durable evidence system, non-bypassable integration, operational monitoring, and incident-response process.
