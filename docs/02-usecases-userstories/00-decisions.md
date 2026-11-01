# Decisions and Defaults

> Design status: MVP — Step 2 of 9, draft for review
>
> Implementation status: NOT STARTED

Step 2 follows the decisions of Step 1 ([Step 1 decisions](../01-research/00-decisions.md)). This page records what Step 2 adds: the decisions it makes, how the Step 1 decisions appear in the use cases and rules, and the defaults that make the stories testable. Defaults apply unless the user changes them. After the first draft the user changed the scope (D-33, section "Scope change decided by the user"): foreign invoices and the cash payment flag are no longer in the MVP. After that the user attached a feature mind map (F01..F12) and asked for the documents to be brought in line with it (D-88, section "Sync to the feature mind map"); the four use cases and stories that came from it (UC-29..UC-32) are Should.

## Decisions made in this step

| ID | Decision | Resolves | Source |
|---|---|---|---|
| D-27 | **UC-06 Manage Automation Gates is a Must, not a Should.** Condition 5 of the batch rule needs a gate that is open for the supplier and entity pair (BR-05). With no way to open a gate, no invoice could ever join a batch and the touchless rate (G-01) would be 0%. This is the first of two priority moves from the first proposal; the other is D-32 (removed by D-33). | — | Step 2 review of the priorities |
| D-28 | **The simulated tax-risk list loads through UC-07 as a simulated external feed.** Each entry carries a source and a date (D-21). No use case and no actor is added: the backlog stays at exactly 28 use cases. (D-33 later removed two of them, UC-11 and UC-22, leaving 26 active use cases; D-88 later added four, UC-29..UC-32, so there are 30.) An entry without a source or a date is rejected. | — | Step 1 review |
| D-29 | **A new supplier and entity pair starts with its gate closed.** Invoices of a closed pair go to exceptions with the reason "Gate closed". The AI's proposal is recorded next to the person's decision, which is how shadow mode measures accuracy (BR-06). | — | Step 2 |
| D-30 | **BR-37 applies to every state-changing action,** not only to signing and withdrawal. Signing and withdrawal are the critical cases; resolving an exception, deciding a hold, and approving an exception use the same version check. | — | Step 2 |
| D-31 | **Only some exceptions can be approved individually by the Payment Approver (UC-23):** gate closed, unusual price, possible duplicate, split orders, new supplier, changed bank account, and a recurring invoice outside its deviation threshold. These cannot: a failed XML signature, an exact duplicate, a wrong buyer tax code, an open tax-risk hold, and an unsupported foreign invoice (D-33), and an invoice with a reported wrong entity (D-68). Each of those has its own decision path; an unsupported foreign invoice can only be rejected with a reason, and a reported wrong entity is resolved by a correction or reissue request or by a rejection. | — | Step 2; list extended by user decision D-68 |
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
- Active scope after D-33 was **26 use cases and 26 stories**: 20 Must and six Should (D-88 later added four Should stories, so it is now 30 stories, 20 Must and ten Should). The numbers UC-11, UC-22, US-11, and US-22 are not reused; their entries stay and read "Removed (D-33)". The brief's "about 28" was then 26.
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
| DF-03 | **An individually approved exception** puts its invoice `In Batch` with the Approver's approval recorded. Its single-invoice payment request is created when the batch is released (BR-35 R1; changed by user decision D-69), and the Chief Accountant co-signs it in UC-25. Every invoice still traces to its signature (BR-20). |
| DF-04 | Removed (D-33). **Foreign PDF invoices** have low trust. After the AP Accountant confirms every field they always take the exception path and never join a batch untouched. (Moved to Advanced, W-19.) |
| DF-05 | **New supplier** means no previously paid invoice for that supplier and entity pair. A new supplier and a changed bank account both take the exception path and are flagged on the signing screen (BR-30). |
| DF-06 | **Sample size** = the sample rate times the number of invoices in the batch, rounded up, with a minimum of 1. An invoice that fails the sample check is withdrawn into exceptions. |
| DF-07 | **Withdrawal** is allowed until the payment request is fully signed. Waiting for Goods (BR-14) is a state of its own and is not an exception. A cancellation notice (BR-31, D-94) is the one thing that can still stop a signed request before it is sent. |
| DF-08 | **AI failure:** when the LLM is unavailable, takes longer than 20 seconds, or returns output that does not match the schema, the invoice goes to an exception and intake never blocks (BR-27). There is no automatic retry during intake; the AP Accountant can re-run the check from the worklist. |
| DF-09 | **The LLM is called through an API with synthetic data only** (O-03). Running it on the company's own servers is a later choice. |
| DF-10 | **Signing in the MVP** is a platform e-signature with a simulated certificate and a re-authentication step (password entered again). Verification of the signature on an XML invoice is real, using test certificates. |
| DF-11 | **The brief's example thresholds are the demo configuration:** price tolerance of 2%, approval threshold of VND 50,000,000, gate accuracy of 98%, sample rate of 10%, split-order window of 7 days, recurring-invoice deviation of 30% against the average of earlier periods, and price check of 20% against the 6-month median of the entity's own purchases. |
| DF-12 | **Demo group:** the fictional Calderwood Group with three entities, all names and tax codes invented: Calderwood Foods Co. (tax code 0100000011), Calderwood Packaging Co. (0100000022), Calderwood Retail Co. (0100000033). Sample people: AP Accountant Alice, Chief Accountant Carol, Department Head Dan, CFO Fiona, Entity Admin Evan (all of Calderwood Foods Co.), Group Admin Gina, Demo Operator Dina. Sample suppliers: Brightfield Paper Ltd, Harbor Cartons Ltd, Sunrise Electric Utility, CloudDesk Software Ltd, Tempest Marketing GmbH (the sample of the "Unsupported: foreign invoice" exception, D-33), Eastmark Machinery Co (foreign goods; not used in the MVP demo after D-33), Eastbay Trading (on the simulated risk list). |
| DF-13 | **Demo limits:** batch threshold of VND 200,000,000 per invoice for Calderwood Foods Co.; group maximums of VND 300,000,000 for the batch threshold and 5% for the price tolerance. An invoice joins a batch only when its total is below the threshold. |
| DF-14 | **One user has one role in one entity** (D-13), and the Requesting Department is a role like the others. A Group Admin belongs to the group. A user can be linked to an ERP user so that separation of duties (BR-02, BR-36) can tell whether two roles are the same person. |
| DF-15 | **Line matching thresholds:** a line is matched when the signal-fusion probability is at least 0.90. Between 0.50 and below 0.90 the LLM is called once for that line and the probability is recomputed. Below 0.50, or still below 0.90 after the LLM, the line is doubtful. The thresholds are calibrated on the labelled evaluation set (BR-28). |
| DF-16 | **Gate rules:** the accuracy of a pair is measured on at least 50 compared invoices before the Group Admin can open its gate (in the demo, DF-33 supplies this history). Opening below the 98% threshold needs a written reason. After at least 20 sampled invoices of an open pair in the last 30 days, a sample error rate above 2% (that is, 100% minus the 98% threshold) raises the alert of BR-06. |
| DF-17 | **Shadow-mode accuracy** of a pair = invoices where the person confirmed every AI result unchanged (entity, order, line matches, amounts), divided by invoices compared. |
| DF-18 | **A period is a calendar month.** The AP Accountant closes the open batch for review; invoices that arrive afterwards go to the next period's batch. Invoice due dates are shown, and an invoice due within 7 days is marked "Due soon". |
| DF-19 | **Near-duplicate** means the same supplier and entity, the same total, an invoice date within 3 days of the other, and a different invoice number. |
| DF-20 | **Price history:** the unusual-price check (BR-29) needs at least 3 purchases of the same item by the entity in the last 6 months. A purchase is a paid invoice; where the demo has fewer than 3, the history is seeded (changed by user decision D-72). With fewer, the check is skipped and the skip is recorded. |
| DF-21 | **Correction requests:** the reply deadline is 5 working days, after which an internal reminder appears for the AP Accountant. Three request templates (correction request, data-fix notice, reissue request) are approved by the Chief Accountant and kept in configuration. |
| DF-22 | **Attachments** on an exception: up to 5 files of type pdf, jpg, or png, at most 10 MB each, stored unchanged with a hash. After D-33 no MVP story attaches files; the default is kept for the foreign tax documents of W-20. |
| DF-23 | **Dashboard:** the default range is the current calendar month. A Group Admin sees counts and rates for each entity and no invoice-level data (BR-09). |
| DF-24 | **Sending to the ERP:** up to 3 attempts, 5 minutes apart. The request number is the idempotency key, so a second send never creates a second payment. |
| DF-25 | **Sectors allowed to issue non-coded invoices** are listed in group configuration. The default list holds one sector: electricity (D-24). The sector of a seller comes from the ERP supplier data, seeded in the demo ERP (user decision D-71). |
| DF-26 | Removed (D-33). **Cash flag threshold:** VND 5,000,000 including VAT, in group configuration (BR-32). (Moved to Advanced, W-21.) |
| DF-27 | **Versions:** every invoice, exception, batch, and payment request has a version number that changes with each change. An action made from an outdated view is rejected and the user is asked to reload (BR-37). |
| DF-28 | **Home page after login:** AP Accountant, the invoice worklist; Chief Accountant, the decision queue; Payment Approver, the signing queue; Entity Admin, entity settings; Group Admin, the group overview; Demo Operator, the ERP simulator; Requesting Department, the acceptance queue (DF-61). |
| DF-29 | **Sample fallback:** when the AI cannot select the sample, the system takes the highest-value invoices first and labels the sample "selected without AI". |
| DF-30 | **The audit log fails closed:** if an audit entry cannot be written, the action does not complete (BR-12). |
| DF-31 | **ERP sync** runs every 15 minutes (configurable), and the Entity ERP is the source of truth (BR-25). |
| DF-32 | **Passwords** have at least 8 characters. Login is by email and password. |
| DF-33 | **Demo seed history:** the demo seed data includes a compared history of at least 50 invoices for chosen supplier and entity pairs (for example Brightfield Paper Ltd and Calderwood Foods Co., with 49 of 50 confirmed unchanged), so that their gates can be opened in the demo (D-29, DF-16). This history is labelled "Simulated history" and is excluded from the G-01 and G-02 figures and from the dashboard. Only invoices processed after the gate is open count. |

## Open items that affect Step 2

| ID | Item | How Step 2 handles it |
|---|---|---|
| O-05 | Whether a policy delegation can replace signing each voucher | Per-voucher signing (BR-20); legal confirmation stays open. The delegation for a date range (UC-30, BR-38) is a different thing: the delegate still signs each voucher |
| O-17 | Whether an e-signature given by a delegate for a named signer is valid | Delegation by date range is designed as a call (D-91, BR-38); validity is Unverified, and the accountant and the lawyer must confirm it (O-17) |
| O-07 | Foreign contractor tax with a supplier registered directly | No longer applicable (D-33): the outcome belonged to UC-22, now Advanced (W-20); status under the new Tax Administration Law stays Unverified |
| O-15 | One signature record per request | Chosen as a default in review (BR-20, UC-25); legal confirmation stays open |
| O-16 | Usage-based non-coded invoices are confirmed only by plausibility | Stated in BR-17; a call for the user to review |

On 2026-10-31 the user asked that the diagrams show the actors as the sample does; the worker split the use case diagram into one actor diagram and four module-group diagrams with human actors on the left and systems on the right. No use case, actor, or link changed. Awaiting user review.

## Changed by user decisions after the first draft

On 2026-10-31 the user ruled on gaps found in Step 5 (see [Step 5 decisions](../05-database/00-decisions.md#decisions-made-by-the-user)). The IDs are D-68..D-72 and they are recorded there, because the gaps arose in Step 5. The changes made here keep every ID.

| Changed by user decision | What changed in Step 2 |
|---|---|
| D-68 | UC-18 and US-18 no longer offer to "correct the entity". The AP Accountant reports a wrong entity, the system traces the mismatch, and the exception follows the wrong-invoice path. AC-18.1 is reworded; AC-18.11 and AC-18.12 are added at the end of the range; AC-13.2 and AC-23.4 name the report; D-31 lists the new reason "Wrong entity reported" (and "Wrong buyer tax code") as not individually approvable. The user said: "No moving between entities. Only allow reporting the error, tracing where the error is, then putting it into an exception like a wrong invoice." The choice of the two reason names and of what the trace compares is a call awaiting user review. |
| D-69 | AC-23.2, UC-23, DF-03, and the note under the UC-16 diagram: an individually approved exception is recorded at once and its invoice is `In Batch`; the single-invoice payment request is created when the batch is released (BR-35 R1 is unchanged) and goes straight to the Chief Accountant's co-signature (R4). The user chose to fix the wording of AC-23.2 and keep BR-35. |
| D-70 | BR-10, AC-15.4, AC-23.3, UC-23: split orders become three linked exceptions, one per invoice, joined by the split finding; the combined amount sets the level; the approver approves or declines all of them together. AC-23.11 and AC-23.12 are added at the end of the range. The user said the approver must decide all linked exceptions together, so that nobody can approve piecemeal to dodge the level. The handling of a blocked or changed linked exception in AC-23.12 is a call awaiting user review. |
| D-71 | DF-25: the seller's sector comes from the ERP supplier data (no change to a requirement). |
| D-72 | DF-20: a purchase for the price check is a paid invoice, and the demo seeds the history where it has fewer than 3. |

## Sync to the feature mind map (user decision D-88, 2026-11-01)

On 2026-11-01 the user attached a mind map of the product with twelve features, F01 to F12, and asked to bring the documents in line with it ("dong bo voi mindmap"). The mind map is in Vietnamese; this page reads it in English. The decision to sync is the user's. **Every reading below is a call made in review and awaits user review:** which leaf means what, which story it becomes, its priority, and the limits. The mind map marks one leaf as new, "Block signing invoices you processed" (F01).

| ID | Decision | Resolves | Source |
|---|---|---|---|
| D-88 | **Bring Steps 1 and 2 in line with the feature mind map F01..F12.** The mind map is read as a feature map. Where it adds or sharpens a feature, the documents follow (D-89..D-98); where it is silent about something the documents already hold, the documents keep it (D-99). Steps 3 to 5 are not changed in this pass; what they must add is listed in "Follow-up in Steps 3 to 5" below. | The request to sync with the mind map | User decision, 2026-11-01 |

### Calls made while applying D-88, awaiting user review

| ID | Decision | Resolves | Source |
|---|---|---|---|
| D-89 | **Block signing invoices you processed (F01, marked new).** The documents already blocked the preparer of the batch and the creator of the order or confirmer of the receipt (BR-02, BR-36). BR-36 gains one more rule: a user who processed an invoice in MatchPay (resolved or confirmed its exception, marked it in the sample check, or confirmed its service acceptance as Requesting Department) cannot sign or approve the request that holds it. With one role per user (D-13) the rule bites when a role changes (UC-02), when an ERP link ties two people (DF-14), and for a delegate (UC-30). **The Chief Accountant's tax-risk decision (UC-21) is not counted as processing:** counting it would need a second Chief Accountant in every entity, because the Chief Accountant is the first signer of every request. | F01 new leaf | Call, awaiting user review |
| D-90 | **New role Requesting Department, and UC-29 / US-29 Confirm Service Acceptance (F01, F05).** For a service invoice with no acceptance in the ERP, a user of the Requesting Department of that entity confirms or rejects the acceptance in MatchPay with a note. The confirmation counts as the independent acceptance source (BR-17, BR-19 amended); the ERP acceptance is still preferred and wins if both exist. A rejection makes the exception "Service acceptance rejected", which cannot be approved individually (D-31). One user, one role, one entity (DF-14). Priority **Should**: if it is cut, an acceptance comes from the ERP only, as before. The role name "Requesting Department" and the choice that a confirming user counts as the "confirmer" of BR-02 are calls. | F01 role "using department"; F05 "Services: the using department confirms acceptance" | Call, awaiting user review |
| D-91 | **UC-30 / US-30 Delegate Signing Authority and BR-38 (F02).** A Chief Accountant or Payment Approver names a delegate in the same entity for a date range. The delegate signs with the delegator's level only in that range; BR-02 and BR-36 still apply to the delegate; the signature records "on behalf of"; the Entity Admin sees and revokes. Priority **Should**. This is not the policy delegation of O-05 (the approver signs a rule instead of each voucher), which stays open and out of the MVP. **The legal validity of a delegated e-signature is Unverified:** O-17 asks an accountant and a lawyer to confirm it. | F02 "Delegate signing while absent" | Call, awaiting user review |
| D-92 | **UC-31 / US-31 Receive Invoices by Email (F04).** The mailbox part of W-05 moves into the MVP as a simulated entity mailbox read through the Email Service. XML attachments go through the same checks as an upload (US-10); a non-XML attachment is logged and rejected like a non-XML upload (BR-17). The supplier portal stays Advanced: W-05 now means the portal only. Priority **Should**: if it is cut, the AP Accountant uploads each file. | F04 "Receive invoices by email" | Call, awaiting user review |
| D-93 | **Invoice status at the tax authority, simulated (F04 validity checks) and BR-39.** W-13 (no official API found, O-10) is split: a simulated lookup comes into the MVP, like the simulated tax-risk list (D-21), and W-13 now means the real connection point. The status "Cancelled" or "Replaced" at the authority stops the invoice at intake (new criteria of US-10); a lookup that does not answer makes an exception and never blocks intake (DF-64). The Invoice Status Lookup Service stays a system actor, now simulated, with no use case of its own. US-10 stays **Must**. | F04 "Invoice status on the tax authority's invoice portal" | Call, awaiting user review |
| D-94 | **Cancelled invoices (F04 "replacement / adjustment / cancellation").** BR-31 gains the third case. A cancellation notice (from the seller, recorded by the AP Accountant, or from the simulated authority status) withdraws the invoice from any batch that is not yet signed and rejects it. After signing but before sending, the request is cancelled and its invoices become exceptions (new transitions V20, V21, and R9 in BR-33 and BR-35); once `Sent`, the notice is only stored as a warning, because an ERP failure after `Sent` is only mocked (D-67). The cancellation of a signed request is the only exception to DF-07. | F04 | Call, awaiting user review |
| D-95 | **Sample failure handling (F07 "remove invoice / reopen batch / expand sample").** BR-07 already withdraws a wrong invoice. Added: the AP Accountant can expand the sample (the next invoices by risk, at least the original sample size again, DF-65), and can reopen a batch that is `In Signing` back to `In Review` while no request holds a signature (new transition B7 in BR-35, DF-66). | F07 | Call, awaiting user review |
| D-96 | **Manual resend to the ERP (F08 "track ERP send: error, resend, paid").** After the 3 automatic attempts of DF-24 fail, the AP Accountant or the Chief Accountant can resend the same signed request, with the request number as idempotency key and no new signature (DF-66). This is different from the ERP returning a payment failure (AC-26.6 is unchanged). The user's decision D-67 is respected: the resend happens before the ERP accepts the request, and no new state is added for a failure after `Sent`. | F08 | Call, awaiting user review |
| D-97 | **UC-32 / US-32 Receive Notifications and Reminders (F11).** In-app notifications, no email to staff, for: a batch released and waiting for a signature (signers); a new exception and a returned or declined request (AP Accountant); overdue reminders, that is a correction request past 5 working days (DF-21) and a request waiting for a signature past its due date (DF-67). Priority **Should**. **This reverses the approved Step 3 decision D-41 ("There is no notification centre"):** D-41 said that no story asked for notifications, and now one does. Step 3 must change in the follow-up. | F11 | Call, awaiting user review |
| D-98 | **Search and drill-down (F10) need no new story.** US-17 covers the worklist; criteria are added to it (AC-17.10..AC-17.13): search all invoices of the own entity by number, supplier, amount, and state; open the state history of any invoice; open an invoice from a batch or a payment request. | F10 | Call, awaiting user review |
| D-99 | **Kept although the mind map does not show them:** UC-08 ERP simulator and the Demo Operator (demo only), the tax-risk hold UC-21, split-order handling (BR-10), employee-expense invoices (BR-23), and group limits (UC-03). The mind map is read as a feature map at a higher level, so these stay. The map names four role groups (accountant, approver, using department, administrator); the documents read "accountant" as the AP Accountant and the Chief Accountant, and keep the Chief Accountant because BR-20 needs the first signer. | The map's silence | Call, awaiting user review |

### What the brief says

The brief is never edited. These are the places where the documents now differ from it (line numbers are those of the brief file; the Vietnamese text is paraphrased in English).

- Scope table, row "Documents" (line 161): the Advanced column holds "an invoice mailbox that fetches XML by itself; a supplier portal; connection to each entity's real ERP". The MVP now holds the simulated mailbox (D-92); the supplier portal and the real ERP stay Advanced.
- Scope table, row "Tax" (line 165), and the actor table (line 46): "lookup of the invoice status through a connection point" and the actor "Invoice status lookup service" are Advanced ("connection point designed in advance"). The MVP now holds a simulated lookup (D-93); the real connection point stays Advanced (W-13).
- BR-19 (brief): the quantity received and the acceptance of a service come from the confirmation of the warehouse keeper or the acceptor in the ERP or warehouse software. The documents add the Requesting Department's confirmation in MatchPay as a second source, with the ERP first (D-90).
- The brief has no signing delegation and no notifications. The brief's only reminder is the internal reminder of BR-26 (DF-21). UC-30 and UC-32 are new (D-91, D-97), and the brief's open question on policy delegation stays O-05.
- The brief's process has no manual resend, no sample expansion, and no reopening of a batch; they are added by D-95 and D-96.

### How the mind map is covered

"Already" means the feature existed before this pass; "Added" means this pass added or extended it.

| Feature | Already | Added |
|---|---|---|
| F01 Log in and permissions | UC-01, UC-02, BR-09; the roles AP Accountant (accountant), Payment Approver, Chief Accountant, and the two administrators; BR-02 and BR-36 for the preparer, the order creator, and the receipt confirmer | The Requesting Department role (D-90); the rule on invoices you processed (D-89, BR-36) |
| F02 System administration | UC-02 users, UC-03 entities, UC-04 policy and tolerance, UC-05 approval matrix | UC-30 signing delegation while absent (D-91, BR-38) |
| F03 Source data | UC-07 sync from the ERP, suppliers and bank accounts, the simulated tax-risk list, UC-09 recurring profiles | The simulated status feed is loaded by UC-07 (D-93) |
| F04 Intake and validation | UC-10 upload, reading and identifying the buyer entity (UC-13), signature, buyer tax code, and duplicate checks, BR-31 adjustment and replacement | UC-31 email intake (D-92); the status at the tax authority (BR-39, D-93); cancelled invoices (BR-31, D-94) |
| F05 Classification and matching | UC-12 flow, UC-13 and UC-14 matching, UC-15 anomalies including a changed bank account, UC-16 routing | Services accepted by the using department (UC-29, D-90) |
| F06 Exception handling | UC-17 evidence, UC-18 confirm or edit, UC-19 drafts, UC-20 re-check, rejection with a reason | Recording a cancellation notice (AC-18.13..AC-18.16) |
| F07 Payment batch | UC-24 period batch, risk-based sample, the sample check, the AI summary for the signer (UC-25), withdrawal | Expand the sample and reopen the batch (D-95) |
| F08 Signing | UC-25 summary request per supplier, many signatures in one action, UC-23 individual approval, decline with a reason, UC-26 send and paid | Manual resend (D-96); the rule on invoices you processed (D-89) |
| F09 Monitoring and automation control | UC-06 gates in shadow mode, per supplier and entity, the alert, closing a gate means manual handling | None |
| F10 Invoice lookup | UC-17 worklist and the evidence | Search, state history, and opening from a batch or request (D-98) |
| F11 Notifications and reminders | The reminder of DF-21 and the alerts of BR-06 and DF-24 | UC-32 (D-97) |
| F12 Reports and log | UC-27 touchless rate, misplacement rate, backlog, UC-28 audit log | None |

### New defaults, awaiting user review

| ID | Default |
|---|---|
| DF-61 | **Service acceptance by the Requesting Department.** The acceptance queue shows the service invoices of the entity that are `Waiting for Goods` because the ERP holds no acceptance. The user confirms or rejects with a note (a rejection needs one). The record keeps the user, the time, and the note. The ERP acceptance wins if both exist. The home page of a Requesting Department user is the acceptance queue (extends DF-28). Sample people: Requesting Department user Rowan of Calderwood Foods Co.; sample service supplier: Lakeside Facility Services Ltd (extends DF-12). The queue is for the whole entity; a filter by department is not modelled. |
| DF-62 | **Signing delegation limits.** The delegate is an active Chief Accountant or Payment Approver of the same entity, so that no one gets signing power without a signing role. A range is at most 30 days, starts today or later, and cannot overlap another delegation of the same delegator. The delegator cannot sign while the delegation is active. The delegate signs after entering their own password again (DF-10). The delegator or the Entity Admin can revoke at any time; signatures already given stay valid. |
| DF-63 | **Entity mailbox.** Each entity has a simulated invoice mailbox (for example invoices-foods@calderwood.example) read every 15 minutes, like the ERP sync (DF-31), or at once on "Fetch now". A message is identified by its message identifier and is processed once. Only XML attachments become invoices. The sender is not trusted: the seller's signature and the checks of US-10 decide. Attachments are limited to 10 MB each, like DF-22. |
| DF-64 | **Authority status.** The simulated feed gives one of Valid, Adjusted, Replaced, or Cancelled for an invoice key (seller, series, number), with a status date. Cancelled and Replaced stop the invoice; Adjusted is a warning. The lookup waits at most 10 seconds, after which the invoice becomes the exception "Authority status unavailable"; the AP Accountant can run the lookup again from the worklist (like DF-08). The status of an unsent invoice is refreshed at every ERP sync (DF-31). |
| DF-65 | **Sample expansion.** An expansion selects at least the original sample size again from the invoices not yet in the sample, in the order of BR-07, or all that remain. It can be repeated and is saved with the name, the time, and the reason. If the AI cannot select, the highest-value invoices not yet selected are taken and labelled "selected without AI" (DF-29). The batch cannot be released until every selected invoice is marked. |
| DF-66 | **Reopen and resend.** A batch that is `In Signing` can be reopened only while no request holds a signature; its requests become `Cancelled`, its invoices stay `In Batch`, sample marks and recorded individual approvals are kept, and release creates new requests. A manual resend is offered only for a request that is `Signed` after the 3 automatic attempts failed; it uses the same request number, asks for no new signature, checks the content hash first (AC-26.7), and is saved as a manual attempt with the name and the time. |
| DF-67 | **Notifications.** In-app only, no email to staff. Each item has a recipient, a link to its object, and a read mark. A reminder repeats once a day until its work is done. The due date of a payment request is the earliest due date of its invoices (DF-18). A notification that cannot be saved never stops the action that caused it (the audit log still fails closed, DF-30). |
| DF-68 | **Search.** Search runs over all invoices of the own entity in any state. Text matches part of an invoice number or a supplier name; an amount matches the total including VAT exactly, ignoring thousands separators. Results can be narrowed by state and are listed 50 to a page. |

### What changed in existing items

| Item | Change |
|---|---|
| BR-02 | The Requesting Department user who confirms an acceptance counts like the confirmer of a receipt |
| BR-14, BR-17, BR-19 | A service with no acceptance from either source is `Waiting for Goods`; the Requesting Department's confirmation is an independent acceptance source; the ERP wins |
| BR-31 | Third case: the cancellation notice, with the handling before signing, after signing, and after sending |
| BR-33 | V6 also rejects on a cancelled or replaced status; V13 may be done by the System; V20 and V21 are added at the end |
| BR-35 | B7 (reopen) and R9 (a signed request is cancelled by a cancellation notice) are added at the end; R6 also covers the reopening |
| BR-36 | The "processed in MatchPay" rule (D-89), and the delegate |
| BR-38, BR-39 | New: signing delegation; invoice status at the tax authority |
| US-10, US-17, US-18, US-23, US-24, US-25, US-26, US-07, US-13, US-02, US-01 | Criteria added at the end of each range, or one criterion reworded: AC-01.1, AC-02.2, AC-23.4, AC-19.4. No number was changed |
| US-10, US-17, US-24, US-26 | The story sentence is longer (status check, search, expand and reopen, resend) |
| W-05, W-13 | Reworded to the supplier portal and the real connection point; the numbers stay |

### Follow-up in Steps 3 to 5

Steps 3, 4, and 5 are not edited in this pass. Until they are, the new stories read `Pending (Step 3 sync)` in the Screen column and `Pending (Step 5 sync)` in the Database column of the [traceability matrix](../traceability/master-traceability.md), and the checker accepts exactly those markers for US-29..US-32. The existing stories that gained criteria are also affected.

| Step | What it must add or change | Because of |
|---|---|---|
| 3 | A seventh role, Requesting Department, in the role list, the permission table, the sitemap, the screens per role, and DF-28 (home page: the acceptance queue); a screen for the acceptance queue with a confirm-or-reject modal (US-29) | D-90 |
| 3 | A delegations screen for the Chief Accountant and the Payment Approver, a read and revoke view for the Entity Admin, and the "On behalf of" marking on the signing screens (US-30) | D-91 |
| 3 | A mailbox log screen with "Fetch now" (US-31) | D-92 |
| 3 | A notification list with an unread count in the top bar, and the **reversal of D-41** (no notification centre), including the sidebar-badge wording of DF-40 and DF-43 where they depend on it (US-32) | D-97 |
| 3 | Search on the worklist, the state history on the invoice detail, and links from a batch and a payment request to the invoice (AC-17.10..AC-17.13) | D-98 |
| 3 | Actions on the batch screens: expand the sample, reopen for review; on the batch and request screens: resend; an action to record a cancellation notice on the invoice detail | D-94, D-95, D-96 |
| 3 | DF-40 says no manual retry is drawn; it must change for the resend. The flows for intake, exception handling, batch and signing need the new branches | D-96 |
| 4 | Wireframes and screen notes for every screen and state above; the design system needs the notification list and the "On behalf of" marker | All of the above |
| 5 | New roles value `REQUESTING_DEPARTMENT`; tables for service acceptances, signing delegations, mailbox messages and attachments, authority status lookups, cancellation notices, sample expansions, and notifications; a marker for a manual attempt and its author on the ERP send attempts; "on behalf of" on the signature records; reopen columns on the batch; new invoice states and request transitions (V20, V21, R9, B7) in the lifecycle columns and checks | D-90..D-97 |

**Related:** [Step index](README.md) · [Step 1 decisions](../01-research/00-decisions.md)
