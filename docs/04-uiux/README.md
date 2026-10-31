# 04 — UI/UX Wireframes

> Design status: MVP — Step 4 of 9, draft for review
>
> Implementation status: NOT STARTED

Step 4 turns the [information architecture](../03-information-architecture/README.md) into high-fidelity wireframes: static HTML with one shared stylesheet, exported to PNG. There are 18 page files for the 35 active screens (modals are states of their parent page; SCR-13 and SCR-17 were removed by D-33 and have no wireframe). The wireframes show where the three hands live (what the AI proposed, what the Rule Engine decided, and what a person decided or signed), the six conditions of BR-05 with their values, the signing flow with re-authentication, the ERP send states, and how every screen behaves when it is empty, loading, failing, in conflict, or when the AI fails. Inputs: [Screen inventory](../03-information-architecture/04-screen-inventory.md), [UI states](../03-information-architecture/06-ui-states-and-accessibility.md), and [Acceptance criteria](../02-usecases-userstories/04-acceptance-criteria.md). It is the input for Step 5 (database) and Step 9 (implementation).

| File | Content |
|---|---|
| [00-decisions.md](00-decisions.md) | Decisions D-42..D-46; defaults DF-45..DF-52; differences from Steps 1 to 3 |
| [01-design-system.md](01-design-system.md) | Design concept "three hands", tokens (color, type, space, shape), components, chart rules, accessibility |
| [02-screen-notes.md](02-screen-notes.md) | Per screen: purpose, annotated elements, and every state (empty, loading, error, AI error, conflict) |
| [wireframes/index.html](wireframes/index.html) | Gallery: open every page and switch states and roles. Open it in a browser from a local clone; GitHub shows `.html` files as source code. |
| [`../images/`](../images/) | PNG exports by role: `common/`, `ap-accountant/`, `chief-accountant/`, `payment-approver/`, `entity-admin/`, `group-admin/`, `demo-operator/` |

**Related:** [README](../../README.md) · [Previous: Information architecture](../03-information-architecture/README.md) · [Master traceability](../traceability/master-traceability.md)
