# 05 — Database

> Design status: MVP — Step 5 of 9, draft for review
>
> Implementation status: NOT STARTED

The schema was synced to the feature mind map (D-88) after Step 4: delegations, service acceptances, the mailbox, authority status lookups, cancellation notices, sample expansions, batch reopenings, and notifications are tables now, all draft for review.

Step 5 turns the [business rules](../requirements/business-rules.md), the [use cases and user stories](../02-usecases-userstories/README.md), and the [screens](../04-uiux/02-screen-notes.md) into a database schema: a DBML file and Mermaid ER diagrams. It also fills the Database column of the [master traceability matrix](../traceability/master-traceability.md). The schema has 74 tables in twelve groups. Every business row carries its entity, the original XML of every invoice is stored with its hash, every AI output and every Rule Engine condition is a row with its versions and values, and the audit log is append-only. Inputs: [Business rules](../requirements/business-rules.md), [Acceptance criteria](../02-usecases-userstories/04-acceptance-criteria.md), [UI states](../03-information-architecture/06-ui-states-and-accessibility.md), and [Screen notes](../04-uiux/02-screen-notes.md). It is the input for Step 6 (OpenAPI), where every API must use an entity from this schema.

| File | Content |
|---|---|
| [00-decisions.md](00-decisions.md) | Decisions D-47..D-66 and the user decisions D-67..D-72; defaults DF-53..DF-60; the mind map sync D-118..D-129 and DF-77..DF-82; differences from Steps 1 to 4; gaps found in approved steps |
| [01-data-model.md](01-data-model.md) | Tables by group, entity isolation, who created each record, state columns against the BR-33, BR-34, and BR-35 lifecycles, derived values, transaction boundaries, concurrency, duplicate checks, privacy, seed data, stories and their tables, and what is not modelled |
| [02-er-diagram.md](02-er-diagram.md) | Overview diagram, enums with their UI labels, and detailed ER diagrams by group |
| [matchpay.dbml](matchpay.dbml) | Schema source of truth in DBML; paste it into dbdiagram.io to view it |

**Related:** [README](../../README.md) · [Previous: UI/UX wireframes](../04-uiux/README.md) · [Master traceability](../traceability/master-traceability.md)
