# Decisions and Defaults

> Design status: MVP — Step 2 of 9, draft for review
>
> Implementation status: NOT STARTED

Step 2 follows the decisions of Step 1 ([Step 1 decisions](../01-research/00-decisions.md)). This page records what Step 2 adds: the decisions it makes, how the Step 1 decisions appear in the use cases and rules, and the defaults that make the stories testable. Defaults apply unless the user changes them. After the first draft the user changed the scope (D-33, section "Scope change decided by the user"): foreign invoices and the cash payment flag are no longer in the MVP.

## Decisions made in this step

| ID | Decision | Resolves | Source |
|---|---|---|---|
| D-27 | **UC-06 Manage Automation Gates is a Must, not a Should.** Condition 5 of the batch rule needs a gate that is open for the supplier and entity pair (BR-05). With no way to open a gate, no invoice could ever join a batch and the touchless rate (G-01) would be 0%. This is the first of two priority moves from the first proposal; the other is D-32 (removed by D-33). | — | Step 2 review of the priorities |
| D-28 | **The simulated tax-risk list loads through UC-07 as a simulated external feed.** Each entry carries a source and a date (D-21). No use case and no actor is added: the backlog stays at exactly 28 use cases. (D-33 later removed two of them, UC-11 and UC-22, leaving 26 active use cases.) An entry without a source or a date is rejected. | — | Step 1 review |
| D-29 | **A new supplier and entity pair starts with its gate closed.** Invoices of a closed pair go to exceptions with the reason "Gate closed". The AI's proposal is recorded next to the person's decision, which is how shadow mode measures accuracy (BR-06). | — | Step 2 |
| D-30 | **BR-37 applies to every state-changing action,** not only to signing and withdrawal. Signing and withdrawal are the critical cases; resolving an exception, deciding a hold, and approving an exception use the same version check. | — | Step 2 |
| D-31 | **Only some exceptions can be approved individually by the Payment Approver (UC-23):** gate closed, unusual price, possible duplicate, split orders, new supplier, changed bank account, and a recurring invoice outside its deviation threshold. These cannot: a failed XML signature, an exact duplicate, a wrong buyer tax code, an open tax-risk hold, and an unsupported foreign invoice (D-33). Each of those has its own decision path; an unsupported foreign invoice can only be rejected with a reason. | — | Step 2 |
| D-32 | Removed (D-33). **US-22 Confirm Foreign Tax Obligations is a Should, not a Must.** Foreign invoices enter only through US-11, which is a Should, so a Must story would have nothing to work on if US-11 were cut. US-11 and US-22 are cut together. D-33 then removed both stories from the MVP. | — | Step 2 review of the priorities |

## Scope change decided by the user

After the first draft of Step 2, the user decided to take foreign invoices and the cash payment flag out of the MVP. This is the user's own decision, not a call made in review.

| ID | Decision | Resolves | Source |
|---|---|---|---|
| D-33 | **Remove foreign invoices and the cash payment flag from the MVP and move them to Advanced as new W items.** Removed: foreign invoices and their tax duties (UC-11/US-11, UC-22/US-22, BR-21, DF-04, D-32), PDF intake and the multimodal LLM (BR-18 becomes entirely Advanced, and the PDF part of BR-17 with it), and the cash payment flag (BR-32, D-25, DF-26). Kept unchanged: the tax-risk list and hold (UC-21/US-21, BR-08, D-21, D-28), the XML digital signature check and the buyer tax code check (BR-01, D-24, D-26), the platform e-signature on payment requests (BR-20), and the goal of not losing tax deductions. P-03 stays addressed by the MVP. | O-07, O-12, and the non-cash part of O-08 no longer apply to the MVP | User decision, 2026-10-31 |

### What the brief says

The brief is never edited. These are the places that D-33 changes (line numbers are those of the brief file; the Vietnamese text is paraphrased in English).

- Scope table, row "Invoice types", MVP column (line 162): "foreign invoices (level A)". Row "Documents", MVP column (line 161): "foreign invoices as PDF". Row "Tax", MVP column (line 165): "for foreign invoices: flag foreign contractor tax and import documents, block payment until the accountant confirms"; the Advanced column of that row holds "cross-check of customs declarations".
- Batch condition 6 (line 72): "no sign of anomaly and no unhandled tax duty (foreign contractor tax, import documents)". BR-21 (line 195): block payment of a foreign service until the accountant confirms foreign contractor tax; imported goods need the customs declaration and the proof of import-stage VAT before joining a batch; store the original currency and the exchange rate. BR-18 (line 192): PDF and XML of one invoice that differ are flagged as suspected fraud.
- The AI table and the architecture table (lines 56, 91, 163) have the AI read PDF through a multimodal LLM, and the process table (line 61) has a row for foreign contractor tax. The brief's scope sentence (line 157) says "about 28 user stories".
- Cash: the brief has **no rule** about cash or non-cash payment. The only mention is in its open questions (line 265): the current purchase-list form "and the condition of payment by non-cash means (the sources conflict)". BR-32 was added in Step 1 review (D-25) and was never in the brief.

### What the documents now say

- The MVP takes **XML e-invoices only** (BR-17). Foreign invoices, their tax duties, PDF intake, and the multimodal LLM are Advanced: W-19 (foreign invoices from PDF with field confirmation), W-20 (foreign tax duties), and W-21 (cash payment flag and payment-method recording). W-08 (suggested foreign contractor tax type), W-09 (finding the original XML from a PDF), and W-14 (customs declaration cross-check) stay Advanced and now build on W-19 and W-20.
- Condition 6 of BR-05 reads "There is no anomaly (BR-10, BR-11, BR-24, BR-29, BR-30)". There are still six conditions, and condition 5 is unchanged.
- UC-26 keeps the paid status and the ERP payment document reference. It no longer records the payment method or flags cash. A signed batch stays a non-cash transfer instruction by design (BR-35, D-11); the non-cash rule stays as regulatory background (L-12) and in the "why now" rationale.

### Consequences

- The demo no longer covers foreign invoices, foreign tax duties, or the cash flag.
- Active scope is **26 use cases and 26 stories**: 20 Must and 6 Should. The numbers UC-11, UC-22, US-11, and US-22 are not reused; their entries stay and read "Removed (D-33)". The brief's "about 28" is now 26.
- BR-21 and BR-32 are marked "Removed (D-33), now Advanced W-20 / W-21". BR-18 stays defined with status Advanced, carried by W-19 and W-09. DF-04, DF-26, D-25, and D-32 are marked "Removed (D-33)". The state "Awaiting Field Confirmation" and transitions V2 and V3 of BR-33 are removed; the row numbers stay and read "Removed (D-33)".
- The AI does eight tasks, not nine: the task "flag foreign tax duties" is gone, task 2 reads XML only, and the "foreign invoice" class of task 1 becomes "unsupported (foreign invoice)", which is an exception.
- O-07 and O-12 are no longer applicable to the MVP, and the non-cash part of O-08 with them (the purchase-list form part of O-08 stays). R-05 and R-20 now point to W-20 and W-21 and state the residual risk.
- AC-26.3 and AC-26.4 and every other criterion that tested only removed behaviour read "Removed (D-33)"; criteria that depended on PDF, foreign, import, contractor, or cash are rewritten to the new scope. No AC number is changed.

### Calls made while applying D-33, awaiting user review

These are not the user's words. They fill gaps that the decision leaves open.

- **A foreign invoice that still arrives.** The MVP upload accepts only XML. A PDF or any other non-XML file is rejected at upload with the reason "Only XML e-invoices are accepted in the MVP" (BR-17, AC-10.8). A foreign invoice that still arrives, for example an XML whose seller has no Vietnamese tax code, or a foreign supplier invoice that the flow classifier recognises, is classified "Unsupported: foreign invoice" and becomes an exception (BR-17, AC-12.9). It cannot be approved individually (D-31) and cannot join a batch. The AP Accountant resolves it by rejecting it with a reason, and it is handled outside the system.
- **Format of removed items.** Removed use cases, stories, rules, and defaults keep their entry, marked "Removed (D-33)", in the same table or section as before. No ID is renumbered or reused.
- **DF-12 sample suppliers.** Tempest Marketing GmbH stays only as the sample for the "Unsupported: foreign invoice" exception. Eastmark Machinery Co (foreign goods) is not used in the MVP demo.
- **DF-22 attachments.** The only MVP use of attachments was the foreign tax documents of UC-22. DF-22 stays as the default for W-20 and no MVP story uses it.
- **BR-18 status.** BR-18 is Advanced, not Removed, because the rule is still sound and the Advanced item W-09 needs it.

## How the Step 1 decisions appear in Step 2

| Step 1 decision | Where it is applied |
|---|---|
| D-06 Automation gate: shadow mode, manual switch, alert | BR-06; US-06 (AC-06.1..AC-06.10); US-16 (AC-16.7); US-18 (AC-18.4) |
| D-07 Follow-up invoices: BR-31 wins over BR-26 | BR-26, BR-31; US-18 (AC-18.5); US-20 (AC-20.2, AC-20.3, AC-20.4) |
| D-08 The Rule Engine admits, the AI supplies evidence | BR-05, BR-17, BR-27; US-16 (AC-16.1, AC-16.10, AC-16.11) |
| D-09 Exact duplicates across the group, near-duplicates within one entity | BR-09, BR-11; US-10 (AC-10.7); US-15 (AC-15.2, AC-15.3) |
| D-10 One open batch per entity per period, with due dates | BR-35; US-24 (AC-24.1); US-17 (AC-17.8) |
| D-11 The signed batch goes to the simulated ERP, no bank | BR-35; US-26 (AC-26.1, AC-26.2) |
| D-12 Demo Operator | UC-08; US-08 |
| D-13 One entity per finance user | DF-14; US-02 (AC-02.3) |
| D-14 Goal definitions | US-12 (AC-12.3); US-27 (AC-27.1, AC-27.2, AC-27.4) |
| D-21 Risk-list entries carry a source and a date | BR-08; US-07 (AC-07.9); US-21 (AC-21.2) |
| D-24 Signed non-coded XML | BR-17; US-10 (AC-10.5); US-16 (AC-16.3); US-03 (AC-03.6) |
| D-25 Non-cash payment | Removed (D-33): BR-32, AC-26.3, and AC-26.4 are removed. The signed batch stays a non-cash transfer instruction by design (BR-35; US-26, AC-26.1) |
| D-26 BR-01 keys on the buyer tax code | BR-01; US-10 (AC-10.6); US-13 (AC-13.5) |
| O-15 One signature record per request | BR-20; US-25 (AC-25.4) |

## Defaults pending confirmation

| ID | Default |
|---|---|
| DF-01 | **Signature order:** the Chief Accountant signs a consolidated payment request first, then the Payment Approver. They must be two different people. The preparer of the batch cannot sign (extends BR-02, BR-36). For an individually approved exception (DF-03) the Approver's approval is already recorded and the Chief Accountant co-signs. |
| DF-02 | **Approval level of a consolidated request** is decided by the request total, not by each invoice, and is recomputed when lines are removed. Per-invoice levels would make grouping a way round the threshold. |
| DF-03 | **An individually approved exception** becomes a single-invoice payment request in the open batch, with the Approver's signature recorded. The Chief Accountant co-signs it in UC-25. Every invoice still traces to its signature (BR-20). |
| DF-04 | Removed (D-33). **Foreign PDF invoices** have low trust. After the AP Accountant confirms every field they always take the exception path and never join a batch untouched. (Moved to Advanced, W-19.) |
| DF-05 | **New supplier** means no previously paid invoice for that supplier and entity pair. A new supplier and a changed bank account both take the exception path and are flagged on the signing screen (BR-30). |
| DF-06 | **Sample size** = the sample rate times the number of invoices in the batch, rounded up, with a minimum of 1. An invoice that fails the sample check is withdrawn into exceptions. |
| DF-07 | **Withdrawal** is allowed until the payment request is fully signed. Waiting for Goods (BR-14) is a state of its own and is not an exception. |
| DF-08 | **AI failure:** when the LLM is unavailable, takes longer than 20 seconds, or returns output that does not match the schema, the invoice goes to an exception and intake never blocks (BR-27). There is no automatic retry during intake; the AP Accountant can re-run the check from the worklist. |
| DF-09 | **The LLM is called through an API with synthetic data only** (O-03). Running it on the company's own servers is a later choice. |
| DF-10 | **Signing in the MVP** is a platform e-signature with a simulated certificate and a re-authentication step (password entered again). Verification of the signature on an XML invoice is real, using test certificates. |
| DF-11 | **The brief's example thresholds are the demo configuration:** price tolerance of 2%, approval threshold of VND 50,000,000, gate accuracy of 98%, sample rate of 10%, split-order window of 7 days, recurring-invoice deviation of 30% against the average of earlier periods, and price check of 20% against the 6-month median of the entity's own purchases. |
| DF-12 | **Demo group:** the fictional Calderwood Group with three entities, all names and tax codes invented: Calderwood Foods Co. (tax code 0100000011), Calderwood Packaging Co. (0100000022), Calderwood Retail Co. (0100000033). Sample people: AP Accountant Alice, Chief Accountant Carol, Department Head Dan, CFO Fiona, Entity Admin Evan (all of Calderwood Foods Co.), Group Admin Gina, Demo Operator Dina. Sample suppliers: Brightfield Paper Ltd, Harbor Cartons Ltd, Sunrise Electric Utility, CloudDesk Software Ltd, Tempest Marketing GmbH (the sample of the "Unsupported: foreign invoice" exception, D-33), Eastmark Machinery Co (foreign goods; not used in the MVP demo after D-33), Eastbay Trading (on the simulated risk list). |
| DF-13 | **Demo limits:** batch threshold of VND 200,000,000 per invoice for Calderwood Foods Co.; group maximums of VND 300,000,000 for the batch threshold and 5% for the price tolerance. An invoice joins a batch only when its total is below the threshold. |
| DF-14 | **One user has one role in one entity** (D-13). A Group Admin belongs to the group. A user can be linked to an ERP user so that separation of duties (BR-02, BR-36) can tell whether two roles are the same person. |
| DF-15 | **Line matching thresholds:** a line is matched when the signal-fusion probability is at least 0.90. Between 0.50 and below 0.90 the LLM is called once for that line and the probability is recomputed. Below 0.50, or still below 0.90 after the LLM, the line is doubtful. The thresholds are calibrated on the labelled evaluation set (BR-28). |
| DF-16 | **Gate rules:** the accuracy of a pair is measured on at least 50 compared invoices before the Group Admin can open its gate (in the demo, DF-33 supplies this history). Opening below the 98% threshold needs a written reason. After at least 20 sampled invoices of an open pair in the last 30 days, a sample error rate above 2% (that is, 100% minus the 98% threshold) raises the alert of BR-06. |
| DF-17 | **Shadow-mode accuracy** of a pair = invoices where the person confirmed every AI result unchanged (entity, order, line matches, amounts), divided by invoices compared. |
| DF-18 | **A period is a calendar month.** The AP Accountant closes the open batch for review; invoices that arrive afterwards go to the next period's batch. Invoice due dates are shown, and an invoice due within 7 days is marked "Due soon". |
| DF-19 | **Near-duplicate** means the same supplier and entity, the same total, an invoice date within 3 days of the other, and a different invoice number. |
| DF-20 | **Price history:** the unusual-price check (BR-29) needs at least 3 purchases of the same item by the entity in the last 6 months. With fewer, the check is skipped and the skip is recorded. |
| DF-21 | **Correction requests:** the reply deadline is 5 working days, after which an internal reminder appears for the AP Accountant. Three request templates (correction request, data-fix notice, reissue request) are approved by the Chief Accountant and kept in configuration. |
| DF-22 | **Attachments** on an exception: up to 5 files of type pdf, jpg, or png, at most 10 MB each, stored unchanged with a hash. After D-33 no MVP story attaches files; the default is kept for the foreign tax documents of W-20. |
| DF-23 | **Dashboard:** the default range is the current calendar month. A Group Admin sees counts and rates for each entity and no invoice-level data (BR-09). |
| DF-24 | **Sending to the ERP:** up to 3 attempts, 5 minutes apart. The request number is the idempotency key, so a second send never creates a second payment. |
| DF-25 | **Sectors allowed to issue non-coded invoices** are listed in group configuration. The default list holds one sector: electricity (D-24). |
| DF-26 | Removed (D-33). **Cash flag threshold:** VND 5,000,000 including VAT, in group configuration (BR-32). (Moved to Advanced, W-21.) |
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
| O-07 | Foreign contractor tax with a supplier registered directly | No longer applicable (D-33): the outcome belonged to UC-22, now Advanced (W-20); status under the new Tax Administration Law stays Unverified |
| O-15 | One signature record per request | Chosen as a default in review (BR-20, UC-25); legal confirmation stays open |
| O-16 | Usage-based non-coded invoices are confirmed only by plausibility | Stated in BR-17; a call for the user to review |

On 2026-10-31 the user asked that the diagrams show the actors as the sample does; the worker split the use case diagram into one actor diagram and four module-group diagrams with human actors on the left and systems on the right. No use case, actor, or link changed. Awaiting user review.

**Related:** [Step index](README.md) · [Step 1 decisions](../01-research/00-decisions.md)
