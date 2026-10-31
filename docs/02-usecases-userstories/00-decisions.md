# Decisions and Defaults

> Design status: MVP — Step 2 of 9, draft for review
>
> Implementation status: NOT STARTED

Step 2 follows the decisions of Step 1 ([Step 1 decisions](../01-research/00-decisions.md)). This page records what Step 2 adds: the decisions it makes, how the Step 1 decisions appear in the use cases and rules, and the defaults that make the stories testable. Defaults apply unless the user changes them.

## Decisions made in this step

| ID | Decision | Resolves | Source |
|---|---|---|---|
| D-27 | **UC-06 Manage Automation Gates is a Must, not a Should.** Condition 5 of the batch rule needs a gate that is open for the supplier and entity pair (BR-05). With no way to open a gate, no invoice could ever join a batch and the touchless rate (G-01) would be 0%. This is the first of two priority moves from the first proposal; the other is D-32. | — | Step 2 review of the priorities |
| D-28 | **The simulated tax-risk list loads through UC-07 as a simulated external feed.** Each entry carries a source and a date (D-21). No use case and no actor is added: the backlog stays at exactly 28 use cases. An entry without a source or a date is rejected. | — | Step 1 review |
| D-29 | **A new supplier and entity pair starts with its gate closed.** Invoices of a closed pair go to exceptions with the reason "Gate closed". The AI's proposal is recorded next to the person's decision, which is how shadow mode measures accuracy (BR-06). | — | Step 2 |
| D-30 | **BR-37 applies to every state-changing action,** not only to signing and withdrawal. Signing and withdrawal are the critical cases; resolving an exception, deciding a hold, and approving an exception use the same version check. | — | Step 2 |
| D-31 | **Only some exceptions can be approved individually by the Payment Approver (UC-23):** gate closed, unusual price, possible duplicate, split orders, new supplier, changed bank account, and a recurring invoice outside its deviation threshold. These cannot: a failed XML signature, an exact duplicate, a wrong buyer tax code, an open tax-risk hold, unresolved foreign tax duties, and missing import documents. Each of those has its own decision path. | — | Step 2 |
| D-32 | **US-22 Confirm Foreign Tax Obligations is a Should, not a Must.** Foreign invoices enter only through US-11, which is a Should, so a Must story would have nothing to work on if US-11 were cut. US-11 and US-22 are cut together. | — | Step 2 review of the priorities |

## How the Step 1 decisions appear in Step 2

| Step 1 decision | Where it is applied |
|---|---|
| D-06 Automation gate: shadow mode, manual switch, alert | BR-06; US-06 (AC-06.1..AC-06.10); US-16 (AC-16.7); US-18 (AC-18.4) |
| D-07 Follow-up invoices: BR-31 wins over BR-26 | BR-26, BR-31; US-18 (AC-18.5); US-20 (AC-20.2, AC-20.3, AC-20.4) |
| D-08 The Rule Engine admits, the AI supplies evidence | BR-05, BR-17, BR-27; US-16 (AC-16.1, AC-16.10, AC-16.11) |
| D-09 Exact duplicates across the group, near-duplicates within one entity | BR-09, BR-11; US-10 (AC-10.7); US-15 (AC-15.2, AC-15.3) |
| D-10 One open batch per entity per period, with due dates | BR-35; US-24 (AC-24.1); US-17 (AC-17.8) |
| D-11 The signed batch goes to the simulated ERP, no bank | BR-32, BR-35; US-26 (AC-26.1, AC-26.2) |
| D-12 Demo Operator | UC-08; US-08 |
| D-13 One entity per finance user | DF-14; US-02 (AC-02.3) |
| D-14 Goal definitions | US-12 (AC-12.3); US-27 (AC-27.1, AC-27.2, AC-27.4) |
| D-21 Risk-list entries carry a source and a date | BR-08; US-07 (AC-07.9); US-21 (AC-21.2) |
| D-24 Signed non-coded XML | BR-17; US-10 (AC-10.5); US-16 (AC-16.3); US-03 (AC-03.6) |
| D-25 Non-cash payment | BR-32; US-26 (AC-26.3, AC-26.4) |
| D-26 BR-01 keys on the buyer tax code | BR-01; US-10 (AC-10.6); US-13 (AC-13.5) |
| O-15 One signature record per request | BR-20; US-25 (AC-25.4) |

## Defaults pending confirmation

| ID | Default |
|---|---|
| DF-01 | **Signature order:** the Chief Accountant signs a consolidated payment request first, then the Payment Approver. They must be two different people. The preparer of the batch cannot sign (extends BR-02, BR-36). For an individually approved exception (DF-03) the Approver's approval is already recorded and the Chief Accountant co-signs. |
| DF-02 | **Approval level of a consolidated request** is decided by the request total, not by each invoice, and is recomputed when lines are removed. Per-invoice levels would make grouping a way round the threshold. |
| DF-03 | **An individually approved exception** becomes a single-invoice payment request in the open batch, with the Approver's signature recorded. The Chief Accountant co-signs it in UC-25. Every invoice still traces to its signature (BR-20). |
| DF-04 | **Foreign PDF invoices** have low trust. After the AP Accountant confirms every field they always take the exception path and never join a batch untouched. |
| DF-05 | **New supplier** means no previously paid invoice for that supplier and entity pair. A new supplier and a changed bank account both take the exception path and are flagged on the signing screen (BR-30). |
| DF-06 | **Sample size** = the sample rate times the number of invoices in the batch, rounded up, with a minimum of 1. An invoice that fails the sample check is withdrawn into exceptions. |
| DF-07 | **Withdrawal** is allowed until the payment request is fully signed. Waiting for Goods (BR-14) is a state of its own and is not an exception. |
| DF-08 | **AI failure:** when the LLM is unavailable, takes longer than 20 seconds, or returns output that does not match the schema, the invoice goes to an exception and intake never blocks (BR-27). There is no automatic retry during intake; the AP Accountant can re-run the check from the worklist. |
| DF-09 | **The LLM is called through an API with synthetic data only** (O-03). Running it on the company's own servers is a later choice. |
| DF-10 | **Signing in the MVP** is a platform e-signature with a simulated certificate and a re-authentication step (password entered again). Verification of the signature on an XML invoice is real, using test certificates. |
| DF-11 | **The brief's example thresholds are the demo configuration:** price tolerance of 2%, approval threshold of VND 50,000,000, gate accuracy of 98%, sample rate of 10%, split-order window of 7 days, recurring-invoice deviation of 30% against the average of earlier periods, and price check of 20% against the 6-month median of the entity's own purchases. |
| DF-12 | **Demo group:** the fictional Calderwood Group with three entities, all names and tax codes invented: Calderwood Foods Co. (tax code 0100000011), Calderwood Packaging Co. (0100000022), Calderwood Retail Co. (0100000033). Sample people: AP Accountant Alice, Chief Accountant Carol, Department Head Dan, CFO Fiona, Entity Admin Evan (all of Calderwood Foods Co.), Group Admin Gina, Demo Operator Dina. Sample suppliers: Brightfield Paper Ltd, Harbor Cartons Ltd, Sunrise Electric Utility, CloudDesk Software Ltd, Tempest Marketing GmbH (foreign services), Eastmark Machinery Co (foreign goods), Eastbay Trading (on the simulated risk list). |
| DF-13 | **Demo limits:** batch threshold of VND 200,000,000 per invoice for Calderwood Foods Co.; group maximums of VND 300,000,000 for the batch threshold and 5% for the price tolerance. An invoice joins a batch only when its total is below the threshold. |
| DF-14 | **One user has one role in one entity** (D-13). A Group Admin belongs to the group. A user can be linked to an ERP user so that separation of duties (BR-02, BR-36) can tell whether two roles are the same person. |
| DF-15 | **Line matching thresholds:** a line is matched when the signal-fusion probability is at least 0.90. Between 0.50 and below 0.90 the LLM is called once for that line and the probability is recomputed. Below 0.50, or still below 0.90 after the LLM, the line is doubtful. The thresholds are calibrated on the labelled evaluation set (BR-28). |
| DF-16 | **Gate rules:** the accuracy of a pair is measured on at least 50 compared invoices before the Group Admin can open its gate (in the demo, DF-33 supplies this history). Opening below the 98% threshold needs a written reason. After at least 20 sampled invoices of an open pair in the last 30 days, a sample error rate above 2% (that is, 100% minus the 98% threshold) raises the alert of BR-06. |
| DF-17 | **Shadow-mode accuracy** of a pair = invoices where the person confirmed every AI result unchanged (entity, order, line matches, amounts), divided by invoices compared. |
| DF-18 | **A period is a calendar month.** The AP Accountant closes the open batch for review; invoices that arrive afterwards go to the next period's batch. Invoice due dates are shown, and an invoice due within 7 days is marked "Due soon". |
| DF-19 | **Near-duplicate** means the same supplier and entity, the same total, an invoice date within 3 days of the other, and a different invoice number. |
| DF-20 | **Price history:** the unusual-price check (BR-29) needs at least 3 purchases of the same item by the entity in the last 6 months. With fewer, the check is skipped and the skip is recorded. |
| DF-21 | **Correction requests:** the reply deadline is 5 working days, after which an internal reminder appears for the AP Accountant. Three request templates (correction request, data-fix notice, reissue request) are approved by the Chief Accountant and kept in configuration. |
| DF-22 | **Attachments** on an exception or a foreign invoice: up to 5 files of type pdf, jpg, or png, at most 10 MB each, stored unchanged with a hash. |
| DF-23 | **Dashboard:** the default range is the current calendar month. A Group Admin sees counts and rates for each entity and no invoice-level data (BR-09). |
| DF-24 | **Sending to the ERP:** up to 3 attempts, 5 minutes apart. The request number is the idempotency key, so a second send never creates a second payment. |
| DF-25 | **Sectors allowed to issue non-coded invoices** are listed in group configuration. The default list holds one sector: electricity (D-24). |
| DF-26 | **Cash flag threshold:** VND 5,000,000 including VAT, in group configuration (BR-32). |
| DF-27 | **Versions:** every invoice, exception, batch, and payment request has a version number that changes with each change. An action made from an outdated view is rejected and the user is asked to reload (BR-37). |
| DF-28 | **Home page after login:** AP Accountant, the invoice worklist; Chief Accountant, the decision queue; Payment Approver, the signing queue; Entity Admin, entity settings; Group Admin, the group overview; Demo Operator, the ERP simulator. |
| DF-29 | **Sample fallback:** when the AI cannot select the sample, the system takes the highest-value invoices first and labels the sample "selected without AI". |
| DF-30 | **The audit log fails closed:** if an audit entry cannot be written, the action does not complete (BR-12). |
| DF-31 | **ERP sync** runs every 15 minutes (configurable), and the Entity ERP is the source of truth (BR-25). |
| DF-32 | **Passwords** have at least 8 characters. Login is by email and password. |
| DF-33 | **Demo seed history:** the demo seed data includes a compared history of at least 50 invoices for chosen supplier and entity pairs (for example Brightfield Paper Ltd and Calderwood Foods Co., with 49 of 50 confirmed unchanged), so that their gates can be opened in the demo (D-29, DF-16). This history is labelled "Simulated history" and is excluded from the G-01 and G-02 figures and from the dashboard. Only invoices processed after the gate is open count. |

## Open items that affect Step 2

| ID | Item | How Step 2 handles it |
|---|---|---|
| O-05 | Whether a policy delegation can replace signing each voucher | Per-voucher signing (BR-20); legal confirmation stays open |
| O-07 | Foreign contractor tax with a supplier registered directly | An outcome of UC-22; status under the new Tax Administration Law is Unverified |
| O-15 | One signature record per request | Chosen as a default in review (BR-20, UC-25); legal confirmation stays open |
| O-16 | Usage-based non-coded invoices are confirmed only by plausibility | Stated in BR-17; a call for the user to review |

**Related:** [Step index](README.md) · [Step 1 decisions](../01-research/00-decisions.md)
