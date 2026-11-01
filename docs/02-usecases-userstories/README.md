# 02 — Use Cases and User Stories

> Design status: MVP — Step 2 of 9, draft for review
>
> Implementation status: NOT STARTED

Step 2 defines who uses **MatchPay** and what they can do: 30 active use cases by actor (UC-11 and UC-22 were removed by D-33 and their numbers are not reused; UC-29..UC-32 were added by the sync to the feature mind map, D-88), one user story for each (reviewed with INVEST), Given/When/Then acceptance criteria with concrete values, and MoSCoW priorities. Inputs: [01 — Research](../01-research/README.md) and the [product mind map](../mindmap.md). It is the input for Step 3 (information architecture), Step 5 (database), and Step 6 (API cross-check).

| File | Content |
|---|---|
| [00-decisions.md](00-decisions.md) | Decisions D-27..D-32; the scope change D-33 decided by the user (foreign invoices and the cash flag moved to Advanced); the sync to the feature mind map, decided by the user (D-88), with the calls D-89..D-99, the new defaults DF-61..DF-68, and the follow-up in Steps 3 to 5; how the Step 1 decisions appear in Step 2; defaults DF-01..DF-33; open items that affect Step 2 |
| [01-use-cases.md](01-use-cases.md) | Actors and roles, role and use case matrix, use case diagram, include and re-run links, use cases by actor |
| [02-use-case-specifications.md](02-use-case-specifications.md) | UC-01..UC-32 (UC-11 and UC-22 removed, D-33): actor, preconditions, main flow, alternatives, permission, result |
| [03-user-stories-invest.md](03-user-stories-invest.md) | INVEST checklist, product backlog US-01..US-32 (one per use case, same number; US-11 and US-22 removed, D-33), per-story INVEST review, cross-cutting constraints |
| [04-acceptance-criteria.md](04-acceptance-criteria.md) | Given/When/Then acceptance criteria for every story, and the evaluation sets and test suite for G-03, G-04, G-06, and G-07 |
| [05-moscow-prioritization.md](05-moscow-prioritization.md) | Must / Should / Could / Won't (W-01..W-21), and what to cut first |

Rules shared by many stories, including the lifecycles of invoices, exceptions, and batches, are in [Business rules](../requirements/business-rules.md); links to screens, APIs, and data are in [Master traceability](../traceability/master-traceability.md).

**Related:** [README](../../README.md) · [Previous: Research](../01-research/README.md) · [Next: Information architecture](../03-information-architecture/README.md)
