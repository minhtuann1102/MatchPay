# User Stories (INVEST)

> Design status: MVP — Step 2 of 9, draft for review
>
> Implementation status: NOT STARTED

Each requirement is small enough to implement and test on its own, or says why it is not. Cross-cutting authorization, entity isolation, and AI guardrails are acceptance constraints, not hidden features. Each story covers one use case and has its number, so US-01 is UC-01. US-11 and US-22 were removed by D-33 (foreign invoices and their tax duties are Advanced); their rows stay marked "Removed (D-33)" and their numbers are not reused. The backlog has 26 active stories.

## INVEST checklist

| Principle | Application in this backlog |
|---|---|
| Independent | Each story produces a demonstrable outcome and names its prerequisites (login, synced source data, the checks before the Rule Engine). Where a story depends on others to be meaningful, its review says `PARTIAL`. |
| Negotiable | Screens and technical choices may change while the stated outcome, permissions, and AI guardrails stay fixed. |
| Valuable | Every story names the benefit for a role. System behaviours (US-07, US-12, US-13, US-14, US-15, US-16, US-20, US-26) are written for the role that benefits from them. |
| Estimable | Inputs, limits, roles, and failure cases (including AI failure) are explicit through DF-01..DF-33, and every story has a size. |
| Small | Each story targets one use case. Sizes: **S** = a simple screen or rule; **M** = a screen or flow with several rules; **L** = AI integration, several checks, or cross-cutting logic. |
| Testable | Every story has Given/When/Then acceptance criteria with concrete values in [Acceptance criteria](04-acceptance-criteria.md). G-03, G-04, and G-06 are measured on named evaluation sets and a test suite. |

## Product backlog

| ID | User story | Value | Dependencies | MoSCoW | Size |
|---|---|---|---|---|---|
| US-01 | As a registered user, I want to log in and out and reach only the functions and the entity data of my role, so that I can do my work while other roles' functions and other entities' data stay protected. | Protected access | — | Must | M |
| US-02 | As an Administrator, I want to create users, give each one a role in one entity, link them to ERP users, and deactivate them, so that the right people can work and conflicts of duty can be detected. | Controlled access | US-01 | Must | M |
| US-03 | As Group Admin, I want to add entities, set group limits, and keep the list of sectors allowed to issue non-coded invoices, so that every entity works inside limits the group controls. | Group control | US-01 | Should | M |
| US-04 | As Entity Admin, I want to set my entity's tolerance, batch threshold, sample rate, and grouping mode inside the group limits, so that the checks follow my entity's own policy. | Entity policy | US-01, US-03 | Must | M |
| US-05 | As Entity Admin, I want to set the approval matrix by amount, so that every payment is approved at the right level. | Right approval level | US-01, US-02 | Must | M |
| US-06 | As Group Admin, I want to see the shadow-mode accuracy of each supplier and entity pair and open or close its gate by hand, so that automation grows only where the AI has proven itself. | Measured trust in AI | US-01 | Must | M |
| US-07 | As an AP Accountant, I want the purchase orders, receipts, acceptances, suppliers, and master data of my entity synced from its ERP, and the simulated tax-risk list loaded, so that every invoice is compared with current source data. *(System behaviour)* | Current source data | US-01, US-08 | Must | M |
| US-08 | As a Demo Operator, I want to create purchase orders and confirm receipts in the ERP simulator, so that the demo can run the whole loop from order to payment. | Complete demo | US-01 | Must | M |
| US-09 | As an AP Accountant, I want to keep recurring profiles for electricity, water, rent, and fixed-price subscriptions, so that recurring invoices have a reference without a purchase order. | Recurring invoices handled | US-01 | Should | S |
| US-10 | As an AP Accountant, I want to upload XML invoices that are checked for signature, buyer entity, duplicates, and trust level, so that a bad invoice is stopped at the door and a good one goes straight to the checks. | Safe intake | US-01, US-07 | Must | L |
| US-11 | Removed (D-33). Foreign PDF upload with field confirmation moved to Advanced as W-19. | — | — | — | — |
| US-12 | As an AP Accountant, I want every incoming invoice classified into its flow, with employee expenses separated, so that an invoice with no order goes to the right flow instead of being treated as an error. *(System behaviour)* | Right flow for every invoice | US-10 | Must | M |
| US-13 | As an AP Accountant, I want the AI to identify the entity, the order or recurring profile, and the receipt of each invoice, so that I do not look them up by hand. *(System behaviour)* | No manual lookup | US-07, US-12 | Must | M |
| US-14 | As an AP Accountant, I want invoice lines matched to internal items with unit conversion and evidence, so that I stop checking line by line and only doubtful lines reach me. *(System behaviour)* | Less manual matching | US-13 | Must | L |
| US-15 | As the Chief Accountant, I want the AI to flag unusual prices, duplicates, split orders, recurring jumps, and new suppliers with the numbers behind them, so that the entity does not pay wrongly or lose a deduction. *(System behaviour)* | Fraud and error detection | US-13, US-14 | Must | L |
| US-16 | As the Chief Accountant, I want the Rule Engine to admit an invoice to a batch only when all six conditions hold and to record why, so that no invoice reaches a signer on the AI's word alone. *(System behaviour)* | Explainable, auditable decision | US-04, US-06, US-12, US-13, US-14, US-15 | Must | L |
| US-17 | As an AP Accountant, I want a worklist of my entity's invoices with the evidence behind every AI and rule decision, and as Chief Accountant or Payment Approver I want the same view read-only, so that every result can be understood before I act on it. | Transparency | US-16 | Must | M |
| US-18 | As an AP Accountant, I want to resolve an exception by confirming a match, correcting the flow, reporting a wrong entity, asking for a correction, or rejecting the invoice, so that each exception ends with a clear decision and the system learns from my confirmations. | Exceptions end with a decision | US-16, US-17 | Must | L |
| US-19 | As an AP Accountant, I want the AI to draft correction requests and data-fix notices that I review and send, so that I do not write the same emails again and nothing leaves the system without me. | Faster exception handling | US-18 | Should | M |
| US-20 | As an AP Accountant, I want a follow-up invoice linked to its exception and checked again automatically, so that I do not search for it by hand and a fresh standard invoice closes the exception by itself. *(System behaviour)* | Exceptions close without a search | US-16, US-18, US-19 | Should | L |
| US-21 | As the Chief Accountant, I want to decide on invoices from suppliers on the tax-risk list, so that the entity does not lose a tax deduction and no valid invoice is rejected by a machine. | No lost deduction | US-07, US-16 | Must | M |
| US-22 | Removed (D-33). Foreign tax duties moved to Advanced as W-20. | — | — | — | — |
| US-23 | As a Payment Approver, I want to approve a single exception at my level, so that a justified exception can be paid without waiting for the batch rules to change. | Exceptions can still be paid | US-16, US-18, US-05 | Must | M |
| US-24 | As an AP Accountant, I want to close the period's batch, check the sample the AI selects by risk, and release the batch for signing, so that errors are caught before anyone signs. | Errors caught before signing | US-16, US-04 | Must | L |
| US-25 | As a Chief Accountant or Payment Approver, I want to sign many consolidated payment requests in one action after seeing a summary and the evidence, and to remove lines I do not accept, so that I sign on grounds instead of blind or invoice by invoice. | Signing on grounds | US-24, US-05 | Must | L |
| US-26 | As the Chief Accountant, I want the signed batch sent to the ERP as a non-cash transfer instruction and its paid status and payment reference recorded, so that every invoice shows when it was paid. *(System behaviour)* | Paid and traceable | US-25 | Must | M |
| US-27 | As a finance user or Administrator, I want a dashboard with the touchless rate, the AI misplacement rate beside it, and the exception backlog, so that I can judge whether the automation deserves trust. | Data-driven management | US-16, US-24 | Should | M |
| US-28 | As an Administrator or Chief Accountant, I want an audit log of every AI decision, rule decision, human decision, and signature, so that any payment can be traced and justified to an auditor. | Accountability | US-01 | Should | M |

## Per-story INVEST review

`PASS` means the design gives enough information for planning and acceptance. It does not claim that implementation or tests exist. `PARTIAL` means the story is weak on that criterion, and the note says why.

| Story | I | N | V | E | S | T | Notes |
|---|---|---|---|---|---|---|---|
| US-01 | PASS | PASS | PASS | PASS | PASS | PASS | Foundation story. Entity scope is tested against every role (AC-01.5). |
| US-02 | PASS | PASS | PASS | PASS | PASS | PASS | One role in one entity (D-13); the ERP link supports BR-02 and BR-36. |
| US-03 | PASS | PASS | PASS | PASS | PASS | PASS | Should: without it the demo uses fixed group limits (DF-13) and one fixed sector list. |
| US-04 | PARTIAL | PASS | PASS | PASS | PASS | PASS | Independent: it reads group limits from US-03 or the demo defaults. |
| US-05 | PASS | PASS | PASS | PASS | PASS | PASS | Gaps and overlaps between tiers are rejected (AC-05.2). |
| US-06 | PARTIAL | PASS | PASS | PARTIAL | PASS | PASS | Independent: the switch works with no history, but the accuracy figures need compared invoices from US-18, or the simulated history of DF-33 in the demo. Estimable: the 50-invoice minimum and the 2% alert limit (DF-16) are defaults that real data may change. |
| US-07 | PASS | PASS | PASS | PASS | PARTIAL | PASS | Small: it covers the sync, the rejection of bad records, and the risk-list feed (D-28), which could be three stories; kept as one use case. |
| US-08 | PASS | PASS | PASS | PASS | PASS | PASS | Demo-only; not part of the product. |
| US-09 | PASS | PASS | PASS | PASS | PASS | PASS | Should: without it every recurring invoice becomes an exception. |
| US-10 | PASS | PASS | PASS | PASS | PARTIAL | PASS | Small: signature check, trust level, entity check, and duplicate check in one story (L). Tested with test certificates. The checks of US-12 to US-16 run after an upload because UC-10 includes them; that is not a story dependency. |
| US-11 | — | — | — | — | — | — | Removed (D-33). No review: the story is Advanced (W-19). |
| US-12 | PASS | PASS | PASS | PASS | PASS | PARTIAL | Testable: LLM output varies, so it is tested with a mocked LLM and a fixed set; the "flow unclear" threshold still needs calibration. |
| US-13 | PARTIAL | PASS | PASS | PASS | PASS | PARTIAL | Independent: it needs synced data (US-07) and profiles (US-09). Testable: the LLM fallback is tested with a mock. |
| US-14 | PASS | PASS | PASS | PARTIAL | PARTIAL | PASS | Estimable: thresholds are calibrated later on ES-03, which does not exist yet. Small: mapping table, embedding, fusion model, and LLM in one story (L). Testable on ES-03. |
| US-15 | PASS | PASS | PASS | PARTIAL | PARTIAL | PARTIAL | Estimable: price history needs enough purchases (DF-20). Small: five detections in one story (L). Testable: ES-01 and ES-02 must be built by the team. |
| US-16 | PARTIAL | PASS | PASS | PASS | PARTIAL | PASS | Independent: it reads the tolerance and the threshold (US-04), the gate state (US-06), and the results of US-12 to US-15 to decide. Small: six conditions in one story (L); each condition has its own criterion (AC-16.3..AC-16.8), so each is tested alone. |
| US-17 | PASS | PASS | PASS | PASS | PASS | PASS | Read-only for the Chief Accountant and the Payment Approver. |
| US-18 | PARTIAL | PASS | PASS | PASS | PARTIAL | PASS | Independent: it needs exceptions from US-16. Small: several resolution actions (L). |
| US-19 | PARTIAL | PASS | PASS | PASS | PASS | PARTIAL | Independent: it starts from an exception (US-18). Testable: the Email Service is mocked, and the AI draft is checked against a fixed template. |
| US-20 | PARTIAL | PASS | PASS | PARTIAL | PARTIAL | PASS | Independent: it needs US-16, US-18, and US-19. Estimable: how a follow-up invoice is matched to its exception (by reference or by order) is not fixed by the brief. Small: includes the one-to-many case (L). |
| US-21 | PASS | PASS | PASS | PASS | PASS | PASS | The risk list is simulated, with a source and date per entry (D-21). |
| US-22 | — | — | — | — | — | — | Removed (D-33). No review: the story is Advanced (W-20). |
| US-23 | PASS | PASS | PASS | PASS | PASS | PASS | The approvable categories are fixed by D-31. |
| US-24 | PASS | PASS | PASS | PASS | PARTIAL | PASS | Small: batch period, sample, and release in one story (L). |
| US-25 | PASS | PARTIAL | PASS | PARTIAL | PARTIAL | PASS | Negotiable and Estimable: the signing model (one record per request, no policy delegation) awaits legal confirmation (O-05, O-15). Small: multi-sign, order, removal, and decline in one story (L). |
| US-26 | PARTIAL | PASS | PASS | PARTIAL | PASS | PASS | Independent and Estimable: the data the ERP returns (the paid status and the payment reference) is defined in Steps 5 and 6; the criteria assume a simulated reply. |
| US-27 | PASS | PASS | PASS | PASS | PASS | PASS | G-01 and G-02 are shown together; the limit of the risk-weighted sample is displayed (AC-27.4). |
| US-28 | PASS | PASS | PASS | PASS | PASS | PASS | Fail-closed logging (DF-30) is tested with a forced write failure. |

## Cross-cutting acceptance constraints

- Only these roles exist: AP Accountant, Chief Accountant, Payment Approver, Entity Admin, Group Admin, and the demo-only Demo Operator. A user has one role in one entity (DF-14).
- The server, not the browser, enforces entity scope and roles (BR-09). Measured by the permissions test suite TS-01 (G-06).
- The Rule Engine alone admits an invoice to a batch, from stored evidence, without an LLM (BR-05, BR-27). The AI never signs and never sends anything outside the system.
- Document content is data, never an instruction. LLM output must match its schema, and any AI failure sends the invoice to an exception without blocking intake (BR-27, DF-08).
- Every AI, rule, and human decision is written to the audit log, which cannot be edited through the application. If an entry cannot be written, the action does not complete (BR-12, DF-30).
- An invoice has exactly one state, and only the allowed transitions happen (BR-33). The same holds for exceptions (BR-34) and for batches and payment requests (BR-35).
- Every signature is tied to the version and content hash of one request. An action from an outdated view is rejected (BR-37).
- A signer cannot be the person who prepared the batch, created the order, or confirmed the receipt (BR-02, BR-36).
- The platform reads the Entity ERP and never edits it (BR-25).
- All figures use the brief's example values as demo configuration (DF-11), and all sample data is fictional (DF-12).

**Related:** [Step index](README.md)
