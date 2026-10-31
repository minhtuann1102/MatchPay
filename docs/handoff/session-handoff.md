# Session Handoff

> Written 2026-10-31 at the end of the local session that produced Steps 1 and 2, and updated after the Step 3 draft. The conversation itself does not transfer, so this page carries what a new session needs.

## Current state

| Step | Content | Status |
|---|---|---|
| 1 | Research ([docs/01-research](../01-research/README.md)) | Draft for review |
| 2 | Use cases and user stories ([docs/02-usecases-userstories](../02-usecases-userstories/README.md)), [business rules](../requirements/business-rules.md), [traceability](../traceability/master-traceability.md) | Draft for review |
| 3 | Information architecture ([docs/03-information-architecture](../03-information-architecture/README.md)); the Screen column of the [traceability matrix](../traceability/master-traceability.md) is filled | Draft for review |
| 4..9 | Not started | **Next: Step 4, but only after the user has reviewed Step 3** |

Steps 1, 2, and 3 are the baseline for later steps. The user asked to continue but has **not approved** them, so their decisions can still change. Step 4 must not start until the user has reviewed Step 3. If a later step changes one, update the source document and its ID, and do not fork the meaning.

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
- D-27, D-32: US-06 moved to Must, US-22 moved to Should.

### Step 3 calls most likely to change

These are in [Step 3 decisions](../03-information-architecture/00-decisions.md) and all await review.

- D-34: a left sidebar plus a top bar for every role.
- D-36: SCR-12 has a role-dependent action panel, so the Chief Accountant and the Payment Approver decide from the same page where the evidence stays read-only (AC-17.4).
- D-37: no profile screen and no password change, because no story asks for one.
- D-38: the Group Admin home page is SCR-75 Group Overview, built from US-06 and US-07 so that it does not depend on the Should story US-27.
- D-39: one Decision Queue (SCR-40) shared by the Chief Accountant and the Payment Approver.
- DF-39: "Waiting for AP confirmation" is a tag on an exception in `In Review`, because BR-34 has no such state.
- DF-40: a failed ERP send shows an alert to the AP Accountant, the Chief Accountant, and the Payment Approver, and no manual retry is drawn. Step 2 does not say who sees it or how a send is retried.
- DF-42: the demo seed also holds the price history and earlier recurring periods, which Step 2 does not seed.

## Open items only people can close

- O-01 official project name, and O-04 whether the internship workplace may be mentioned: the user or their manager.
- O-05 policy delegation, O-15 one signature record per request, O-07 foreign contractor tax under the new law: an accountant or lawyer.

## Known gaps

- **Mermaid diagrams are now parsed.** In Step 3 every `mermaid` block in the repo (10 from Steps 1 and 2, 5 from Step 3) was parsed with `mermaid.parse` from mermaid 11.4.1 inside the pre-installed Playwright Chromium: 15 of 15 parsed, none failed. Parsing is not rendering, so the look of the diagrams is unchecked. The script lives in the session scratchpad and is not in the repo; the structural lint in `tools/check_docs.py` still runs without a browser.
- **Weak legal evidence.** The move to Decree 254/2026 and Circular 91/2026 rests on one EY summary and the official texts were not opened (D-17). D-26 rests on one Sapo summary. The [research log](research-log.md) has every claim, URL, and verdict from Step 1.
- **SAP, Oracle, Odoo, and FAST were not verified** in [Similar products](../01-research/04-similar-products.md). This need not be pursued, because O-14 is skipped.
- **Unverified legal points** are marked in [Regulatory context](../01-research/10-regulatory-context.md).

## Things to know about the files

- `business-rules.md` and `master-traceability.md` were first generated by a script that no longer exists. They are now hand-maintained: when a story's rules change, update the story header in `04-acceptance-criteria.md`, the `Related US` line in the business rule, and the matrix row. `tools/check_docs.py` reports any disagreement between them.
- [INVEST](../02-usecases-userstories/03-user-stories-invest.md) has 17 of 28 stories with a `PARTIAL`, each with its reason. This is deliberate and stricter than the sample.

## Lessons from the review of Step 2

All checks passed while these errors existed. Look for the same kinds in later steps.

- Circular dependencies between stories.
- A decision labelled as the user's when the user had not made it.
- A Must story with no way in except through a Should story.
- A rule that needs data nothing provides: gates needed 50 comparisons, and no document said where a demo would get them.
- A diagram missing links that its own matrix stated.
