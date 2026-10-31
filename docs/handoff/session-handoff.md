# Session Handoff

> Written 2026-10-31 at the end of the local session that produced Steps 1 and 2, updated after the Step 3 draft, and updated again when the user approved Step 3 and the scope change D-33 was applied, updated once more when the user approved Step 4, updated after the Step 5 draft, and updated again after the user ruled on the last Step 5 gaps. The conversation itself does not transfer, so this page carries what a new session needs.

## Current state

| Step | Content | Status |
|---|---|---|
| 1 | Research ([docs/01-research](../01-research/README.md)) | Draft for review |
| 2 | Use cases and user stories ([docs/02-usecases-userstories](../02-usecases-userstories/README.md)), [business rules](../requirements/business-rules.md), [traceability](../traceability/master-traceability.md) | Draft for review |
| 3 | Information architecture ([docs/03-information-architecture](../03-information-architecture/README.md)); the Screen column of the [traceability matrix](../traceability/master-traceability.md) is filled | **Approved by the user** ("Step 3 looks good", 2026-10-31), then adjusted for D-33; the adjustments await review |
| 4 | UI/UX ([docs/04-uiux](../04-uiux/README.md)): design system, screen notes, 18 HTML page files for the 35 active screens, PNG exports by role | **Approved by the user** ("OK, that's it", 2026-10-31) |
| 5 | Database ([docs/05-database](../05-database/README.md)): DBML with 63 tables, data model, ER diagrams; the Database column of the [traceability matrix](../traceability/master-traceability.md) is filled | **Draft for review.** Step 6 waits for the user's review of Step 5 |
| 6..9 | Not started | Next: Step 6 (API), after the user reviews Step 5 |

Steps 1, 2, 3, and 4 are the baseline for later steps. Steps 1 and 2 are still draft for review and Steps 3 and 4 are approved, so the decisions of Steps 1 and 2 can still change. If a later step changes one, update the source document and its ID, and do not fork the meaning.

**Scope change D-33 (2026-10-31).** After the first draft the user removed foreign invoices and the cash payment flag from the MVP and moved them to Advanced (W-19, W-20, W-21). Steps 1 and 2 on this branch already carry the change: 26 active use cases and stories (UC-11, UC-22, US-11, US-22 are marked "Removed (D-33)"), 20 Must and 6 Should, eight AI tasks, and condition 6 of the batch rule without the tax obligation. See [Step 2 decisions](../02-usecases-userstories/00-decisions.md#scope-change-decided-by-the-user).

**Step 3 and D-33.** Step 3 was written on the old scope and then rebased onto the scope change. Its own decisions were renumbered from D-33..D-40 to **D-34..D-41**; its defaults keep DF-34..DF-44. The screens SCR-13 (Confirm Foreign PDF Fields) and SCR-17 (Foreign Tax Outcome) are removed and marked "Removed (D-33)" in the inventory, and the route `/invoices/:id/confirm-fields`, the foreign branches of the flows, and the foreign, PDF, and cash states are gone. There are 35 active screens (18 pages, 17 modals) for the 26 active stories. The list of changes is in [Step 3 decisions](../03-information-architecture/00-decisions.md#changes-made-to-step-3-because-of-d-33), and those changes await review.

## Remaining steps

The user fixed this order.

| Step | Deliverable | Folder | Sample to follow |
|---|---|---|---|
| 3 | Information architecture: sitemap, routes and permissions, navigation, screen inventory, user flows, UI states and accessibility | `docs/03-information-architecture/` | Same folder in the sample |
| 4 | UI/UX: design system, screen notes, HTML wireframes | `docs/04-uiux/` | Same folder in the sample. Wireframe copy is English here, unlike the sample |
| 5 | Database: DBML and a Mermaid ER diagram | `docs/05-database/` | Same folder in the sample |
| 6 | OpenAPI document, cross-checked so every story has an API and every API uses an entity from the ER diagram | `docs/06-api/` | None in the sample |
| 7 | C4 documentation, tech stack, LLM provider | `docs/07-architecture/` | None in the sample |
| 8 | Code structure: folders and files | `docs/08-code-structure/` | None in the sample |
| 9 | Code | Decided in Step 8 | None in the sample |

Each step fills its column in the [traceability matrix](../traceability/master-traceability.md): Screen (Step 3), Database (Step 5), API operationId (Step 6), C4 Component (Step 7). `Related API` in the business rules is filled in Step 6.

## What the user has decided

Only these are the user's own decisions:

- All documentation is 100% English.
- The fixed step order above, and following the HelpdeskAI presentation.
- Opus plans; one Sonnet worker does the rest; no parallel agents.
- **Skip the "why not buy an international product" question** (O-14). Do not research it further and do not raise it again.
- **D-33: remove foreign invoices and the cash payment flag from the MVP and move them to Advanced** as W-19 (foreign invoices from PDF), W-20 (foreign tax duties), and W-21 (cash payment flag). Kept: the tax-risk hold, the XML signature and buyer tax code checks, and the platform e-signature. One reading inside D-33 is not the user's and awaits review: how a foreign invoice that still arrives is treated (see "Calls most likely to change").
- **Step 3 is approved** ("Step 3 looks good", 2026-10-31): D-34..D-41 and DF-34..DF-44 as they stood before the D-33 adjustments. D-34, D-37, D-40, and DF-41 had their text changed for D-33, and that change awaits review.

- **2026-10-31 rulings on Step 5 gaps.** D-67: an ERP failure after a request is `Sent` is only mocked, with no new BR-35 state. D-68: no invoice moves between entities; the AP Accountant reports a wrong entity, the system traces it, and the invoice becomes an exception like a wrong invoice (Steps 2, 3, and 4 were changed, recorded as "Changed by user decision D-68"). DF-60 (changed bank account means since the last paid invoice of the pair) is approved. Readings added inside D-67 and D-68 are marked "Call, awaiting user review".
- **2026-10-31 rulings on the remaining Step 5 gaps.** D-69: the payment request of an individually approved exception is created when the batch is released (BR-35 R1 unchanged, AC-23.2 reworded). D-70: split orders become three linked exceptions that the CFO approves or declines together in one action, at the level of the combined amount (BR-10, AC-15.4, AC-23.3 reworded; AC-23.11 and AC-23.12 added; SCR-18 and the wireframe states `approve-split` and `approve-split-modal` added). D-71: the seller's sector comes from the ERP supplier data, seeded in the demo ERP. D-72: a purchase for the price check is a paid invoice, and the demo seeds the history where it has fewer than 3. Steps 2, 3, and 4 record "Changed by user decision". Readings added inside D-70 are marked "Call, awaiting user review".

Everything else in the `00-decisions.md` files is a call made during document review and awaits user review.

## Calls most likely to change

Read these before building on them.

- D-12: the demo-only Demo Operator actor, who switches personas so that separation of duties (BR-02) still holds.
- D-13: one finance user belongs to one entity. This weakens the brief's shared-service claim.
- D-06: automation gates are switched by hand in the MVP.
- D-07: BR-31 wins over BR-26. Adjustment and replacement invoices always need a person.
- D-24, O-16: a usage-based non-coded invoice is only checked for plausibility.
- DF-16: a gate needs at least 50 compared invoices before it can open. DF-33: the demo seeds this history.
- BR-24, BR-29, and DF-20: the minimum-history limits on the recurring and unusual-price checks. The price check relaxes the brief.
- D-27: US-06 moved to Must.
- D-33, the reading of a foreign invoice that still arrives: a PDF is rejected at upload, and an XML or other foreign invoice becomes an "Unsupported: foreign invoice" exception that only a rejection with a reason resolves (BR-17, AC-10.8, AC-12.9). The user decided the removal; this reading is a call.

### Step 5 calls (awaiting review)

These are in [Step 5 decisions](../05-database/00-decisions.md): D-47..D-66 (calls), D-67..D-72 (user decisions), DF-53..DF-60 (DF-60 approved, DF-58 decided by D-71), eleven differences from Steps 1 to 4, and five gaps in approved steps (all resolved; no gap from Step 5 is open). The ones most likely to change:

- D-49: the ERP simulator keeps the ERP side of the demo in its own `sim_*` tables, and the sync copies them into the `erp_*` tables. Step 7 may move them to a separate schema or service.
- D-50: the tax-risk list is stored per entity, not once for the group.
- D-51: the exact-duplicate check across the group is one partial unique index on `invoices`, the only cross-entity structure.
- D-53 and D-54: one exception row per invoice for split orders, and the payment request of an individually approved exception is created at release, not at approval. The user decided both (D-70, D-69).
- D-60: the schema keeps the request `Sent` and records `erp_failed_at` after an ERP failure. The user ruled this failure a mocked demo scenario with no new state (D-67), so the point is closed.
- D-64: `price_history` and `supplier_entity_stats` are written when an invoice is `Paid` and are seeded; the simulated gate history has no invoice rows (DF-56). The user decided this (D-72).
- No gap from Step 5 is open. Gaps 3 and 5 (AC-23.2 against BR-35 R1, BR-10 against AC-23.3, the seller sector DF-58, the price history DF-20 / D-64) were ruled by the user on 2026-10-31 (D-69..D-72). The one call left inside them, how a blocked or changed linked split-order exception is handled (D-70, AC-23.12), awaits review.

**Step 6 must cross-check every story, API, and entity in `matchpay.dbml`.** Each active story has its tables in the [data model](../05-database/01-data-model.md#stories-and-their-tables) and in the Database column of the matrix. Every API operation must name tables that exist in the DBML, the simulator operations of US-08 use the `sim_*` tables, and the derived values (rates, badges, retry counts, alerts) have no table and need an endpoint that computes them.

### Step 3 calls (approved by the user)

These are in [Step 3 decisions](../03-information-architecture/00-decisions.md). The user approved Step 3, so they are no longer calls awaiting review, except where D-33 changed their text (marked there). They are still the first places to look if a later step finds a conflict.

- D-35: a left sidebar plus a top bar for every role.
- D-37: SCR-12 has a role-dependent action panel, so the Chief Accountant and the Payment Approver decide from the same page where the evidence stays read-only (AC-17.4). Text changed for D-33: no foreign tax outcome action; awaits review.
- D-38: no profile screen and no password change, because no story asks for one.
- D-39: the Group Admin home page is SCR-75 Group Overview, built from US-06 and US-07 so that it does not depend on the Should story US-27.
- D-40: one Decision Queue (SCR-40) shared by the Chief Accountant and the Payment Approver. Text changed for D-33: the Chief Accountant's part holds only tax-risk holds; awaits review.
- DF-39: "Waiting for AP confirmation" is a tag on an exception in `In Review`, because BR-34 has no such state.
- DF-40: a failed ERP send shows an alert to the AP Accountant, the Chief Accountant, and the Payment Approver, and no manual retry is drawn. Step 2 does not say who sees it or how a send is retried.
- DF-42: the demo seed also holds the price history and earlier recurring periods, which Step 2 does not seed.

### Step 4 calls (approved by the user)

These are in [Step 4 decisions](../04-uiux/00-decisions.md) (D-42..D-46, DF-45..DF-52, and eight differences from Steps 1 to 3). The user approved them with Step 4 on 2026-10-31, so they are no longer calls awaiting review. They are still the first places to look if a later step finds a conflict:

- D-44: the design concept "three hands" (dotted rail and dashed round tag for AI, double rail and square tag for the Rule Engine, solid rail and filled tag for a person). Step 9 reuses the tokens in `wireframes/assets/wireframe.css`.
- D-45: one file per page and modals as states of their parent page.
- DF-47: the Payment Approver in the wireframes is CFO Fiona; Department Head Dan's view is only described.
- DF-46 and DF-49: sample numbers (October 2026 batch of VND 70,050,000, gate history, request numbers). Step 5 seed data can reuse them.
- The eight differences: a "Choose another item" action, an "Add sector" control, the XML signature check labelled Rule Engine, and similar details that Steps 1 to 3 do not define. Step 6 should decide them before it writes the API.
- The wireframe PNGs were made with a throwaway script outside the repository (headless browser, 1440 px, 256-colour reduction). Regenerate them after any change to a page.

## Open items only people can close

- O-01 official project name, and O-04 whether the internship workplace may be mentioned: the user or their manager.
- O-05 policy delegation, O-15 one signature record per request: an accountant or lawyer. O-07 (foreign contractor tax under the new law) is no longer open for the MVP after D-33; it returns with W-20.

## Known gaps

- **Diagram presentation change awaiting review (2026-10-31).** At the user's request, the use case diagram is split into an actor diagram and four module-group diagrams, the sitemap into two diagrams of three actors, and the user flows start from actor nodes with the person icon, with a 👤 actor prefix on every human step (swimlanes were tried and dropped). `tools/check_docs.py` now reads several diagrams per file.
- **Mermaid diagrams are parsed only by a script outside the repo.** `tools/check_docs.py` does only a structural lint. A script in the session scratchpad (not part of the repo) parses every `mermaid` block with `mermaid.parse` inside headless Chromium; parsing is not rendering, so the look of the diagrams is unchecked. Parse them again after any diagram change. The result of the last run is in the Step 3 report.
- **Weak legal evidence.** The move to Decree 254/2026 and Circular 91/2026 rests on one EY summary and the official texts were not opened (D-17). D-26 rests on one Sapo summary. The [research log](research-log.md) has every claim, URL, and verdict from Step 1.
- **SAP, Oracle, Odoo, and FAST were not verified** in [Similar products](../01-research/04-similar-products.md). This need not be pursued, because O-14 is skipped.
- **Unverified legal points** are marked in [Regulatory context](../01-research/10-regulatory-context.md).

## Things to know about the files

- `business-rules.md` and `master-traceability.md` were first generated by a script that no longer exists. They are now hand-maintained: when a story's rules change, update the story header in `04-acceptance-criteria.md`, the `Related US` line in the business rule, and the matrix row. `tools/check_docs.py` reports any disagreement between them.
- [INVEST](../02-usecases-userstories/03-user-stories-invest.md) has 15 of 26 active stories with a `PARTIAL` (US-11 and US-22 were removed by D-33), each with its reason. This is deliberate and stricter than the sample.

## Lessons from the review of Step 2

All checks passed while these errors existed. Look for the same kinds in later steps.

- Circular dependencies between stories.
- A decision labelled as the user's when the user had not made it.
- A Must story with no way in except through a Should story.
- A rule that needs data nothing provides: gates needed 50 comparisons, and no document said where a demo would get them.
- A diagram missing links that its own matrix stated.
