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

## Evidence retention

The demonstrator has no production retention schedule, automatic rotation, authenticated deletion, legal hold, encryption-at-rest control, or recovery guarantee. Local evidence persists only in the configured JSON file until an operator removes or replaces it. Do not submit production secrets, personal data, regulated records, or other sensitive information to the demonstrator.

Corrupt or unreadable evidence fails closed. This behavior protects execution ordering; it does not provide durability, confidentiality, immutability, or records-management compliance.
