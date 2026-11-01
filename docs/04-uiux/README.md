# 04 — UI/UX Wireframes

> Design status: MVP — Step 4 of 9, approved
>
> Implementation status: NOT STARTED
>
> Revision R1 (UX redesign, 2026-11-01): draft for review

Revision R1 (2026-11-01, draft for review) redesigned the layout of every page after the user said the screens were long and messy: object pages with a stepper and tabs, lists with tiles, saved-view tabs, and one-line rows, drawers for forms, and folded detail (D-73..D-87; content, rules, and states are unchanged, and the PNGs are exported again).

The mind map sync (D-88, 2026-11-01, draft for review) added the pages SCR-22 (acceptance queue, new role Requesting Department), SCR-24 (mailbox log), SCR-55 (signing delegations), and SCR-62 (notifications), the modals and drawers SCR-19, SCR-23, SCR-33, SCR-34, SCR-56, and SCR-57, new states on SCR-10, SCR-12, SCR-30, SCR-50, SCR-51, and SCR-90, and a notification bell in the top bar. The calls are D-108..D-117 and DF-73..DF-76 in [the decisions](00-decisions.md#mind-map-sync-d-88-draft-for-review). All 125 PNGs were exported again.

Step 4 turns the [information architecture](../03-information-architecture/README.md) into high-fidelity wireframes: static HTML with one shared stylesheet, exported to PNG. There are 22 page files for the 45 active screens (modals are states of their parent page; SCR-13 and SCR-17 were removed by D-33 and have no wireframe). The wireframes show where the three hands live (what the AI proposed, what the Rule Engine decided, and what a person decided or signed), the six conditions of BR-05 with their values, the signing flow with re-authentication, the ERP send states, and how every screen behaves when it is empty, loading, failing, in conflict, or when the AI fails. Inputs: [Screen inventory](../03-information-architecture/04-screen-inventory.md), [UI states](../03-information-architecture/06-ui-states-and-accessibility.md), and [Acceptance criteria](../02-usecases-userstories/04-acceptance-criteria.md). It is the input for Step 5 (database) and Step 9 (implementation).

| File | Content |
|---|---|
| [00-decisions.md](00-decisions.md) | Decisions D-42..D-46; defaults DF-45..DF-52; differences from Steps 1 to 3; revision R1 (D-73..D-87, draft for review) |
| [01-design-system.md](01-design-system.md) | Design concept "three hands", tokens (color, type, space, shape), components, layout patterns P1 to P11 (R1), chart rules, accessibility |
| [02-screen-notes.md](02-screen-notes.md) | Per screen: purpose, annotated elements, and every state (empty, loading, error, AI error, conflict) |
| [wireframes/index.html](wireframes/index.html) | Gallery: open every page and switch states and roles. Open it in a browser from a local clone; GitHub shows `.html` files as source code. |
| [`../images/`](../images/) | PNG exports by role: `common/`, `ap-accountant/`, `chief-accountant/`, `payment-approver/`, `entity-admin/`, `group-admin/`, `demo-operator/` |

**Related:** [README](../../README.md) · [Previous: Information architecture](../03-information-architecture/README.md) · [Next: Database](../05-database/README.md) · [Master traceability](../traceability/master-traceability.md)
