# Data Model

> Design status: MVP — Step 5 of 9, draft for review
>
> Implementation status: NOT STARTED

The schema for **MatchPay** on PostgreSQL (D-47): 74 tables in twelve groups. It stores what the [business rules](../requirements/business-rules.md) and the [screens](../04-uiux/02-screen-notes.md) need, plus who created each record and when, and nothing that can be computed (D-63). Everything that comes from the Entity ERP is a read-only copy, and everything that a person decided is a row with its author. The sync to the feature mind map (D-88, [Step 5 decisions](00-decisions.md#mind-map-sync-d-88-draft-for-review)) added eleven tables, twelve enums, and the columns named in the tables below; all of it is draft for review.

Related sources of truth: [matchpay.dbml](matchpay.dbml), [ER diagram](02-er-diagram.md), [decisions](00-decisions.md).

## Tables

### Group and access

| Table | Purpose |
|---|---|
| `corporate_groups` | The group and its two maximums: price tolerance and batch threshold (BR-16, DF-13). Group-level, no `entity_id`. `version` for the conflict state of SCR-76. |
| `group_sectors` | Sectors allowed to issue non-coded invoices; the default list holds electricity (D-24, DF-25). A removed sector keeps its row with a removal time. |
| `entities` | The legal entities, identified by a unique 10-digit tax code (BR-01). `matrix_version` changes with every edit of the approval matrix. |
| `users` | Every account, with one `role` in one `entity_id` (D-13); the roles include the Requesting Department (D-90). `entity_id` is NULL only for the Group Admin and the Demo Operator (DF-14). `erp_user_id` links the account to an ERP user for separation of duties (BR-02, BR-36). Deactivated, never deleted. |
| `entity_policies` | One row per entity: price tolerance, batch threshold, sample rate, grouping mode (US-04). |
| `approval_tiers` | The approval matrix: amount range and level name, for example Department Head below VND 50,000,000 and CFO from it (BR-03). No gaps and no overlaps. |
| `approval_tier_approvers` | The Payment Approvers assigned to each tier. |
| `signing_delegations` | A delegator, a delegate of the same entity, a date range of at most 30 days, a reason, and a revocation. State (Scheduled, Active, Ended, Revoked) is computed. No overlap per delegator. `version` for the conflict state of SCR-55 (US-30, BR-38, D-119). |

### Automation gates

| Table | Purpose |
|---|---|
| `supplier_gates` | One gate per supplier and entity pair, closed when the pair first appears (D-29). Opened and closed by hand (D-06). |
| `gate_comparisons` | Shadow mode: one row per invoice where a person confirmed or changed the AI result, with `all_unchanged`. Simulated history rows have no invoice and `is_simulated = true` (DF-17, DF-33). |
| `gate_alerts` | The alert after sample errors, with the counts and the rate at that time (BR-06, DF-16). |

### ERP sync and synced source data

| Table | Purpose |
|---|---|
| `erp_sync_runs` | One row per sync of one entity: time, status, counts (US-07, DF-31). |
| `erp_sync_rejections` | Records the sync refused: a receipt without an order, a receipt marked as created from an invoice, a risk-list entry without a source or a date (BR-13, D-21). |
| `erp_users` | ERP users who create orders and confirm receipts. |
| `erp_suppliers` | Suppliers of one entity, with tax code, sector, and contact. One row per entity that buys from the supplier. |
| `erp_supplier_bank_accounts` | Bank account history of a supplier, one current row (BR-30). |
| `erp_items` | Goods and services of one entity with their base unit. |
| `erp_unit_conversions` | Supplier unit to base unit per item, for example 1 carton = 5 reams. |
| `erp_purchase_orders` | Purchase orders with the ERP user who created them (BR-02, BR-10). |
| `erp_po_lines` | Order lines. |
| `erp_receipts` | Goods receipts and service acceptances with the ERP user who confirmed them (BR-13, BR-19). |
| `erp_receipt_lines` | Quantities received per order line (BR-15). |
| `tax_risk_entries` | The simulated tax-risk list per entity, each entry with a source and a date (BR-08, D-21, D-28). |

### ERP simulator (demo only)

| Table | Purpose |
|---|---|
| `sim_personas` | The buyer, warehouse keeper, and acceptor the Demo Operator acts as (D-12). |
| `sim_purchase_orders`, `sim_po_lines` | Orders created in the simulator, with the persona that created them (US-08). |
| `sim_receipts`, `sim_receipt_lines` | Receipts and acceptances confirmed in the simulator, with the persona that confirmed them. The same persona cannot create the order and confirm the receipt (BR-02, checked by the simulator). |
| `sim_authority_statuses` | The simulated feed of invoice status at the tax authority: an invoice key, a status (Valid, Adjusted, Replaced, Cancelled), and a date. A table, because the demo changes a status after the invoice was taken in (US-07, BR-39, D-120). |

### Accumulated data

| Table | Purpose |
|---|---|
| `item_mappings` | The mapping table of one entity: supplier text to item, confirmed by a person (BR-28, D-52). |
| `recurring_profiles` | Contracts that repeat: supplier, location, period, fixed or usage-based price, deviation threshold (US-09, BR-24). |
| `recurring_profile_periods` | The one invoice of each period with its amount; earlier periods can be seeded (BR-24, DF-42). |
| `price_history` | The entity's own purchases per item, for the unusual-price check (BR-29, DF-20, D-64). |
| `supplier_entity_stats` | Paid invoices per supplier and entity pair; 0 means a new supplier (BR-30, DF-05, D-64). |

### Invoices

| Table | Purpose |
|---|---|
| `invoices` | The XML e-invoice: seller, buyer, series, number, dates, amounts, signature status, trust level, flow, `state` (BR-33), `holds_key` for the group-wide duplicate check, rejection reason, `source` (upload or email, UC-31), `version` (BR-37). |
| `invoice_documents` | The original XML unchanged with its SHA-256, also for rejected invoices (D-57). Never updated. |
| `invoice_lines` | Lines as the XML states them. The text is data (BR-27). |
| `invoice_corrections` | An adjustment or replacement invoice and the invoices it refers to; one adjustment can correct several (BR-31, AC-20.4). |
| `invoice_receipts` | Receipts matched to an invoice. No row means `Waiting for Goods` (BR-14). |

### Intake sources and invoice status

| Table | Purpose |
|---|---|
| `mailbox_fetch_runs` | One row per read of the simulated entity mailbox: scheduled or "Fetch now", time, status, counts. The last successful fetch and the failure warning are computed (US-31, DF-63, AC-31.7). |
| `mailbox_messages` | A message read from the mailbox: its identifier (unique per entity, so it is processed once), sender, time, and outcome. The body is not stored (AC-31.4). |
| `mailbox_attachments` | The result of each attachment: an invoice created, rejected as not XML (logged, no bytes kept), or rejected as too large. Links to the invoice it created (AC-31.1..AC-31.5). |
| `authority_status_lookups` | Every lookup of an invoice's status at the tax authority: the key, the outcome (answered or unavailable), the status and its date, and the time. The latest row is the evidence and the basis of V6 (BR-39, AC-10.12..AC-10.16). |
| `cancellation_notices` | A cancellation from the seller (reference, date, file, recorded by) or from the authority status, the state the invoice was in, the effect, and the request it cancelled (BR-31, D-94). |

### Check runs, Rule Engine, and AI outputs

| Table | Purpose |
|---|---|
| `invoice_check_runs` | One run of the checks on an invoice and why it ran (D-58). |
| `rule_evaluations` | One Rule Engine decision per run, with the entity values it used. |
| `rule_condition_results` | The six conditions of BR-05 with result, measured value, limit, and the value as shown (BR-12). |
| `ai_flow_classifications` | AI task 1: flow, confidence, reason, model and prompt version. |
| `ai_identifications` | AI task 3: entity, order or profile, with evidence and method. |
| `invoice_line_matches` | AI task 4: the proposed item per line, method, probability, unit conversion, reason, versions. A person's confirmation is a row with method `PERSON`. |
| `anomaly_findings` | AI task 5: each check with the numbers behind it, also when nothing is flagged or the check is skipped. |
| `anomaly_finding_invoices` | The invoices of one finding, for split orders and duplicate pairs. |
| `ai_requests` | One row per embedding or LLM call: task, model, outcome, latency, tokens, no text (D-59). |

### Exceptions and decisions

| Table | Purpose |
|---|---|
| `exceptions` | One exception on one invoice with `state` (BR-34), `outcome` when closed, who takes it, who decides, `version`. At most one open exception per invoice. |
| `exception_reasons` | The reasons with their numbers, the failed condition, and for a withdrawal who and why. A reason can point to the service acceptance, the failed lookup, or the cancellation notice behind it. |
| `wrong_entity_reports` | A report that an invoice seems to belong to another entity: who, when, the note, the traced source, and the reason it added. The invoice never moves (US-18, D-68). |
| `exception_follow_up_links` | A follow-up invoice linked to an exception, one to many (BR-26, BR-31). |
| `message_templates` | The three approved request templates, seeded (DF-21). |
| `correction_requests` | Correction requests, data-fix notices, and reissue requests: the AI draft, the sent text, send status, reply deadline (US-19). |
| `tax_risk_decisions` | The Chief Accountant's release or rejection of a hold, with a reason (US-21). |
| `individual_approvals` | The Payment Approver's approval or decline of an exception, with the amount and level judged, and a `decision_action_id` shared by the exceptions decided in one action (US-23, D-70). |
| `service_acceptances` | The Requesting Department's confirmation or rejection of the acceptance of a service invoice, with the note, the user, the time, the check run it started, and the ERP receipt that overrode it, if one did (US-29, D-90, D-121). |

### Batch, signing, and ERP send

| Table | Purpose |
|---|---|
| `payment_batches` | One batch per entity per calendar month with `state`, sample size and method, who closed and who released it (BR-35). |
| `batch_items` | An invoice admitted to a batch, how it was admitted, and its withdrawal. |
| `batch_sample_items` | The sample: each invoice with why it was selected, its mark, the reason for an error, and the expansion that added it, if any (BR-07, DF-65). |
| `payment_requests` | A consolidated payment request: number, supplier, total, required level, `state`, content hash, `version`, cancel, paid, and ERP failure columns (BR-20, BR-35). |
| `payment_request_lines` | The invoices of a request; a removed line stays with its end reason (BR-20). |
| `request_signatures` | One signature record per request and signer with version and content hash (O-15, BR-37). A delegate's record also names the person represented and the delegation (BR-38). |
| `ai_payment_summaries` | The AI summary shown to the signer, per request version (AC-25.1). |
| `erp_send_attempts` | The outbox of sends to the Entity ERP, with the idempotency key and the ERP reply (DF-24). Attempts 1 to 3 are automatic; a manual resend is a further row with its author (D-96). |
| `sample_expansions` | Each expansion of the sample of a batch: who, when, why, how it was selected, and how many invoices it added (DF-65, D-95). |
| `batch_reopenings` | Each time a batch went back from `In Signing` to `In Review`: who, when, why, how many requests were cancelled, and the release that was undone (B7, DF-66, D-95). |

### Notifications

| Table | Purpose |
|---|---|
| `notifications` | An in-app item for one user: kind, the invoice, batch, or payment request it opens, the text, the read time, and for a reminder its key and day (US-32, DF-67). |

### Audit

| Table | Purpose |
|---|---|
| `audit_log` | Append-only log of every AI decision, Rule Engine decision, person decision, signature, configuration change, and gate change (BR-12, DF-30). |

There are no dashboard or report tables: every rate, badge, and count is computed from the tables above (see [Derived values](#derived-values)).

## Entity isolation

BR-09 and G-06 ask that a user never sees another entity's data and that the server enforces it on every request. The schema supports this in five ways.

1. **`entity_id` on every business row.** Every table has it except `corporate_groups`, `group_sectors`, and `entities` (group-level), and `users` and `audit_log` may have a NULL one: `users` for the Group Admin and the Demo Operator, who belong to the group; `audit_log` for an event outside any entity such as a failed login with an unknown email.
2. **The entity comes from the session.** The server reads `users.entity_id` of the logged-in user and adds it to every query. No request carries an entity. A record of another entity is answered exactly like a record that does not exist ("Access denied", AC-01.5), so a repository method is always `find(entity_id, id)`, never `find(id)`.
3. **Parent and child in the same entity.** SQL turns each parent reference into a composite foreign key `(entity_id, parent_id)` that points to a unique `(entity_id, id)` of the parent (D-48). A purchase order of another entity cannot be stored as the order of an invoice, even by a bug.
4. **Row-level security** on `entity_id` against a session setting is recommended as a second layer, so that a query without the filter returns nothing. It is decided in Step 7 with the database roles.
5. **The Group Admin has no read path to business rows.** Gates, counts, and rates for each entity come from aggregate queries that return numbers and never rows of `invoices`, `payment_requests`, or `audit_log` entries of an invoice (DF-23, AC-06.9, AC-27.7). `audit_log.is_group_event` marks the events that the Group Admin may list.

**Is a cross-entity unique index needed?** One, and only one: `invoices (seller_tax_code, series, number) WHERE holds_key` (D-51). The exact-duplicate check runs across the whole group (D-09, BR-11), and the database is the one place that can see every entity at once. The index is used only by the insert. The application never lists, counts, or reads rows through it, so the answer to a duplicate is only "an invoice with this seller, series, and number already exists" (AC-10.7), with no entity name, amount, or content. Everything else that looks across entities (near-duplicates, price history, the mapping table, supplier statistics) is per entity (D-09, AC-15.12).

The same real supplier has one `erp_suppliers` row in each entity that buys from it. This duplicates a few master fields, and it means that no join ever crosses entities.

## Who created a record, and when

| Table | Columns | Read by |
|---|---|---|
| `corporate_groups`, `entities`, `entity_policies`, `supplier_gates`, `recurring_profiles`, `users` | `created_by`, `updated_by`, `deactivated_by` (as present), `created_at`, `updated_at` | Audit of a configuration change; the old and new values are in `audit_log.details` (AC-04.7, AC-05.6) |
| `approval_tiers`, `approval_tier_approvers`, `group_sectors`, `message_templates` | `created_by`, `assigned_by`, `added_by`, `approved_by` and their times | The matrix and sector screens, and the approval of a template (DF-21) |
| `invoices`, `invoice_documents` | `uploaded_by` (NULL for an invoice taken from email), `stored_by`, `received_at`; `rejected_by`, `flow_set_by`, `entity_confirmed_by` when a person acted | SCR-12 history |
| `exceptions` | `taken_by`, `closed_by` | Who works on it; closed by NULL means the system |
| `tax_risk_decisions`, `individual_approvals` | `decided_by`, `approver_id`, `decided_at` | SCR-16, SCR-18, the history |
| `payment_batches`, `batch_items`, `batch_sample_items` | `closed_by`, `released_by`, `withdrawn_by`, `marked_by` | `released_by` is the preparer who cannot sign (BR-36) |
| `payment_requests`, `payment_request_lines`, `request_signatures` | `prepared_by`, `cancelled_by`, `ended_by`, `signer_id` | Signer separation (BR-02, BR-36), signature records |
| `item_mappings`, `gate_comparisons`, `correction_requests` | `confirmed_by`, `compared_by`, `created_by`, `sent_by` | AC-18.2 "with my name and the time", AC-19.2 |
| `service_acceptances`, `cancellation_notices` | `decided_by`, `recorded_by` (NULL when the status feed caused the cancellation) | AC-29.2 "with my name, the time, and the note", AC-18.13; the rule on invoices a user processed (BR-36, D-89) |
| `signing_delegations`, `request_signatures` | `delegator_id`, `delegate_id`, `revoked_by`; `on_behalf_of_user_id` | "signed by Dan on behalf of Carol" (AC-30.10) |
| `sample_expansions`, `batch_reopenings`, `erp_send_attempts` | `expanded_by`, `reopened_by` and the undone `released_by`, `triggered_by` of a manual attempt | AC-24.12, AC-24.15, AC-26.11 |
| `mailbox_fetch_runs` | `requested_by` for "Fetch now"; NULL for a scheduled fetch | SCR-24 |

The ERP copy tables have no author but the ERP user of the order or the receipt (`created_by_erp_user_id`, `confirmed_by_erp_user_id`) and the sync run that wrote them.

## State columns and the lifecycles

The application changes a state only along the transitions of BR-33, BR-34, and BR-35 and writes the audit entry in the same transaction. The database holds the state and the checks that can be written on one row; the rest is the application's, as the sample does. The enum values are exactly the state names of the rules (see [the enums](02-er-diagram.md#enums)), and a checker compares them.

### Invoice (BR-33): `invoices.state`

| # | Transition | What is written |
|---|---|---|
| V1 | to `Received` | `invoices` row with `uploaded_by`, `received_at`, `state = RECEIVED`, `signature_status = NOT_CHECKED`; `invoice_documents` with the XML and its hash |
| V4 | `Received` to `In Check` | `signature_status = VALID`, `signature_checked_at`, `trust_level`, `holds_key = true` (fails on an exact duplicate, then V6); an `invoice_check_runs` row |
| V5 | `Received` to `Rejected` | `rejection_reason = SIGNATURE_FAILED` or `XML_NOT_SUPPORTED`; `holds_key` stays false |
| V6 | `In Check` to `Rejected` | `rejection_reason = BUYER_TAX_CODE_MISMATCH` or `EXACT_DUPLICATE`, or `CANCELLED_AT_AUTHORITY` or `REPLACED_AT_AUTHORITY` when the latest `authority_status_lookups` row says so (BR-39, the status date and the replacing invoice are on that row); a rule evaluation with decision `REJECTED` |
| V7 | `In Check` to `Separated` | `flow = EMPLOYEE_EXPENSE`; evaluation `SEPARATED` |
| V8, V9 | `In Check` and `Waiting for Goods` | Evaluation `WAITING_FOR_GOODS`; no `invoice_receipts` row and, for a service invoice, no `CONFIRMED` `service_acceptances` row. A sync that brings a receipt starts a new check run (trigger `ERP_SYNC`); a confirmed acceptance starts one with trigger `ACCEPTANCE` |
| V10 | `In Check` to `Exception` | Evaluation `EXCEPTION`; an `exceptions` row (E1) with `exception_reasons`, among them `SERVICE_ACCEPTANCE_REJECTED` (a `REJECTED` `service_acceptances` row) and `AUTHORITY_STATUS_UNAVAILABLE` (the latest lookup is `UNAVAILABLE`) |
| V11 | `In Check` to `In Batch` | Evaluation `ADMITTED`; a `batch_items` row with `admitted_via = RULE_ENGINE`; the batch row of the period is created if it does not exist |
| V12 | `Exception` to `In Batch` | Evaluation `ADMITTED` after a resolution, or an approved `individual_approvals` row; a `batch_items` row |
| V13 | `Exception` to `Rejected` | `rejection_reason = REJECTED_BY_PERSON`, `rejection_note`, `rejected_by`, `rejected_at` (required reason, AC-18.6, AC-21.4); or by a cancellation, `CANCELLED_BY_SELLER` (with `rejected_by`, the AP Accountant) or `CANCELLED_AT_AUTHORITY` (`rejected_by` NULL, the System), with a `cancellation_notices` row; the exception closes `REJECTED` (E11) |
| V14 | `Exception` to `Superseded` | `exception_follow_up_links` row confirmed or closed automatically, on each corrected original |
| V15 | `In Batch` to `Exception` | `batch_items.withdrawn_at`, `withdraw_reason`, `withdrawn_by`; a new `exceptions` row with the reason `WITHDRAWN_FROM_BATCH`; a payment request line ended when one exists. A cancellation notice before signing uses `withdraw_reason = CANCELLATION_NOTICE` and then V13 in the same action |
| V16 | `In Batch` to `Signed` | In the transaction of the second signature (R3, R4) |
| V17 | `Signed` to `Sent` | After the first successful `erp_send_attempts` row |
| V18 | `Sent` to `Paid` | The ERP reply on the attempt and `payment_requests.paid_at`; `price_history` and `supplier_entity_stats` updated |
| V19 | `Sent` to `Exception` | `erp_send_attempts.reply = FAILED`; a new exception with the reason `PAYMENT_FAILED`; the request keeps `Sent` and gets `erp_failed_at`. The failure is a mocked demo scenario and gets no request state (D-60, D-67) |
| V20 | `Signed` to `Exception` | The request becomes `CANCELLED` with `cancel_kind = CANCELLATION_NOTICE` (R9) and `request_id` is set on the `cancellation_notices` row (`effect = REQUEST_CANCELLED`); every line of the request is ended and every batch item withdrawn (`CANCELLATION_NOTICE` for the cancelled invoice, `REQUEST_CANCELLED` for the others); each invoice gets a new exception, with the reason `CANCELLED_AFTER_SIGNING` or `REQUEST_CANCELLED_OTHER_INVOICE`; nothing is sent (AC-18.14) |
| V21 | `Waiting for Goods` to `Rejected` | `rejection_reason = CANCELLED_BY_SELLER`, `CANCELLED_AT_AUTHORITY`, or `REPLACED_AT_AUTHORITY`; a `cancellation_notices` row with `effect = REJECTED` for a notice; the invoice is final, so no later receipt starts a check run (AC-18.16) |
| V2, V3 | Removed (D-33) | Not representable and not needed: there is no state `Awaiting Field Confirmation` and no PDF intake |

The sync to the feature mind map added no state: V20 and V21 use existing states, and a failure after `Sent` is still only mocked (D-67). A cancellation notice for an invoice that is `Sent` or `Paid` changes no state and is a `cancellation_notices` row with `effect = WARNING_ONLY` (AC-18.15). An invoice is in exactly one state because `state` is one column. The checks `ck_invoices_readable` and `ck_invoices_rejection` tie the state `REJECTED` to a reason, and an unreadable XML can only be `REJECTED`.

### Exception (BR-34): `exceptions.state`

| # | Transition | What is written |
|---|---|---|
| E1 | to `Open` | `exceptions` row, `opened_by_evaluation_id`, one `exception_reasons` row per failed condition or finding |
| E2 | `Open` to `In Review` | `taken_by`, `taken_at` |
| E3 | `In Review` to `Waiting for Supplier` | A `correction_requests` row with `send_status = SENT` and `reply_due_at` (5 working days); the state changes only after a successful send (AC-19.6) |
| E4 | `In Review` to `Waiting for Data Fix` | A `correction_requests` row of kind `DATA_FIX_NOTICE` that was sent |
| E5 | to `Waiting for Decision` | `waiting_role` = `CHIEF_ACCOUNTANT` for a tax-risk hold, `PAYMENT_APPROVER` for an individual approval (the check `ck_exceptions_waiting_role` ties the two) |
| E6, E7, E8 | back to `In Review` | A follow-up link, a recorded reply (`reply_recorded_at`), a sync that brings changed data, or a decision; `waiting_role` set to NULL |
| E9..E13 | `In Review` to `Closed` | `outcome` = `ADMITTED`, `APPROVED_INDIVIDUALLY`, `REJECTED`, `SUPERSEDED`, or `AUTO_CLOSED`, with `closed_at` and `closed_by` (NULL for the system). Checks tie `CLOSED` to an outcome and a time |
| DF-39 | tag "Waiting for AP confirmation" | `awaiting_ap_confirmation = true`, allowed only in `IN_REVIEW` (check) |

A new problem with a closed invoice opens a new row: the partial unique index on `invoice_id WHERE state <> 'CLOSED'` allows one open exception per invoice and any number of closed ones.

### Batch and payment request (BR-35)

| # | Transition | What is written |
|---|---|---|
| B1 | batch to `Open` | `payment_batches` row for the calendar month, created by the first admission (unique per entity and period) |
| B2 | `Open` to `In Review` | `closed_by`, `closed_at`, `sample_rate_pct`, `sample_size`, `sample_method`, model and prompt version of the sample, and the `batch_sample_items` rows |
| B3 | `In Review` to `In Signing` | `released_by`, `released_at`; the `payment_requests` and their `payment_request_lines`; allowed only when no sample row is `PENDING`, including the rows of an expansion |
| B4, B5, B6 | to `Signed`, `Sent`, `Completed` | Set by the application when every request has reached the state (for `Completed`: `Paid`, or the mocked failure recorded, D-67); the check `ck_batches_released` ties them to a release time |
| R1 | request to `Awaiting Chief Accountant` | Created at B3 with `required_tier_id`, `required_level_name`, `content_hash`, `version = 1`, `prepared_by` |
| R2, R3, R4 | signed | A `request_signatures` row in the same transaction as the state change; `request_version` and `content_hash` equal the request's current values or nothing is written |
| R5 | back to `Awaiting Chief Accountant` | A line is ended, `total_amount`, `content_hash`, `required_*`, and `version` are recomputed, and every `VALID` signature of the request becomes `VOIDED` (`voided_at`, `void_reason`) |
| R6 | to `Cancelled` | `cancel_kind` = `DECLINED`, `ALL_LINES_REMOVED`, or `BATCH_REOPENED` (B7), `cancel_reason`, `cancelled_by`, `cancelled_at`; every line ended with `REQUEST_DECLINED`, its removal reason, or `BATCH_REOPENED` (check ties `CANCELLED` to `cancel_kind`) |
| R7 | `Signed` to `Sent` | `sent_at` after the first delivered attempt |
| R8 | `Sent` to `Paid` | `paid_at`, `payment_reference` (the check ties `PAID` to a reference) |
| B7 | `In Signing` to `In Review` | A `batch_reopenings` row (who, when, reason, `requests_cancelled`, the undone `released_by` and `released_at`); `released_by` and `released_at` cleared on the batch; every request `CANCELLED` with `cancel_kind = BATCH_REOPENED` (R6); allowed only when no request of the batch has a `VALID` signature. The invoices stay `In Batch` (no batch item is withdrawn); sample marks, `batch_sample_items`, and `individual_approvals` are kept, and the next release (B3) creates new requests |
| R9 | `Signed` to `Cancelled` | `cancel_kind = CANCELLATION_NOTICE`; `cancelled_by` may be NULL because the `cancellation_notices` row names who recorded the notice or the lookup that read the status; the signatures stay as they were given (the request is final); nothing is sent (V20) |

Withdrawal (V15) is allowed until the request is `Signed` (DF-07): the application refuses it when the request of the active line is `SIGNED` or later. The one exception is a cancellation notice (R9, BR-31).

**Expanding the sample is not a transition.** The batch stays `In Review`; a `sample_expansions` row and new `batch_sample_items` rows with `expansion_id` are saved, and B3 stays refused while any of them is `PENDING`. The batch can be expanded again.

**A manual resend is not a transition either.** The request stays `Signed` until an attempt is `DELIVERED` (R7). A resend adds an `erp_send_attempts` row with `is_manual = true`, `triggered_by`, and the next number after 3 (the check `ck_send_attempts_no`); it uses the same idempotency key and asks for no signature (D-96).

## What a person changed and what the AI proposed

The AI's output is never overwritten, because the gate accuracy compares it with the person (DF-17).

| Subject | AI's value | Current value | Person's change |
|---|---|---|---|
| Flow | `ai_flow_classifications` (latest run) | `invoices.flow` | `flow_set_by`, `flow_set_at` (AC-12.4) |
| Entity | `ai_identifications.proposed_entity_id` | `invoices.entity_id` | `entity_confirmed_by`, `entity_confirmed_at` (AC-13.2): a person confirmed the entity of the upload. An invoice never changes entity; "Report wrong entity" is a `wrong_entity_reports` row (D-68) |
| Order, profile | `ai_identifications.order_id`, `recurring_profile_id` | `invoices.order_id`, `recurring_profile_id` | Set by the application when the identification is accepted |
| Line match | `invoice_line_matches` rows with method `MAPPING_TABLE`, `EMBEDDING_FUSION`, `LLM` | The latest row of the line | A `PERSON` row with `decided_by`; the pair also enters `item_mappings` |

## Derived values

These are computed when read and never stored (D-63). Each query is scoped by `entity_id` first.

| Value | How it is computed | Rule |
|---|---|---|
| Due soon | `invoices.due_date` within 7 days of today and the invoice not final | DF-18, AC-17.8 |
| Badge of open exceptions | Count of `exceptions` with `state <> CLOSED` of the entity | AC-17.1 |
| Reminder due | `correction_requests.reply_due_at` passed and `reply_recorded_at` NULL; the reminder itself is a `notifications` row, one per day (DF-67) | DF-21, AC-19.4, AC-32.4 |
| Last ERP sync and stale warning | Latest `erp_sync_runs.finished_at` with `status = SUCCESS`; a later `FAILED` run raises the warning | AC-07.7 |
| Gate compared invoices and accuracy | Rows of `gate_comparisons` of the gate; accuracy = `all_unchanged` rows divided by rows | DF-17, AC-06.3 |
| Gate can be opened | At least 50 compared rows (real and simulated) | DF-16, AC-06.4 |
| Sample error rate of a gate | `ERROR` marks of `batch_sample_items` of the pair's invoices in the last 30 days, divided by sampled; at least 20 sampled | DF-16, AC-06.7 |
| Sample size | `ceil(sample_rate_pct x invoices in the batch)`, minimum 1 | DF-06, AC-24.2 |
| Totals by entity and supplier, invoices of VND 50,000,000 or more | Sums over active `payment_request_lines` and their invoices | AC-25.1 |
| Required level of an individual approval | The active tier whose range holds `exceptions.approval_amount` | BR-03, AC-23.1 |
| New supplier, bank account changed | `supplier_entity_stats.paid_invoice_count = 0`; or the current `erp_supplier_bank_accounts` row first seen after `last_paid_at` | BR-30, DF-05, DF-60 |
| Flags on a request | The `NEW_SUPPLIER` and `BANK_ACCOUNT_CHANGED` findings of the invoices of its active lines | AC-25.1 |
| Price median and purchase count | Median of `price_history.unit_price_base` of the item in the last 6 months; fewer than 3 rows means the check is skipped | BR-29, DF-20 |
| Average of earlier periods | Average of `recurring_profile_periods.amount` before the current period; fewer than 3 means the check cannot run | BR-24 |
| Retry n of 3, next attempt, failed alert | Count and last row of the automatic `erp_send_attempts` (`is_manual` false); three failed attempts and no delivery is the alert, and then Resend is offered | DF-24, DF-69, AC-26.10 |
| Touchless rate (G-01) | Invoices whose `batch_items.admitted_via = RULE_ENGINE` and that never had an `exceptions` row, divided by invoices received in the period minus `Separated` ones | AC-27.1, D-14 |
| AI misplacement rate (G-02) | `ERROR` marks divided by sampled invoices of the period | AC-27.2 |
| Backlog by state and age | Open exceptions grouped by `state` and by `now() - opened_at` in 0 to 2, 3 to 7, over 7 days | AC-27.3 |
| `Waiting for Goods` count | Invoices in that state, shown apart | AC-27.5 |
| Authority status of an invoice | The latest `authority_status_lookups` row of the invoice: status, status date, time of lookup | BR-39, AC-10.16 |
| Delegation state | Scheduled before `valid_from`, Active from `valid_from` to `valid_to` unless revoked, Ended after `valid_to`, Revoked when `revoked_at` is set | AC-30.9 |
| Delegator blocked from signing | An active, unrevoked `signing_delegations` row of the user today | DF-62, AC-30.8 |
| Acceptance queue | Invoices of the entity with flow `SERVICES_WITH_ORDER`, state `WAITING_FOR_GOODS`, no `invoice_receipts` row, and no `service_acceptances` row | DF-61, AC-29.1 |
| Independent acceptance source of a service invoice | An `invoice_receipts` row of an ERP acceptance if there is one; otherwise a `CONFIRMED` `service_acceptances` row that has not been overridden | BR-19, AC-29.4 |
| Invoices a user processed | Union of `exceptions.taken_by` and `closed_by`, `exception_reasons.resolved_by`, `invoice_line_matches.decided_by`, `batch_sample_items.marked_by`, and `service_acceptances.decided_by` where `CONFIRMED`; the Chief Accountant's `tax_risk_decisions` are left out. Which actions count is a call (D-128) | BR-36, D-89 |
| Unread count of notifications | Rows of `notifications` of the recipient with `read_at` NULL | AC-32.6 |
| Last mailbox fetch and failure warning | Latest `mailbox_fetch_runs.finished_at` with `status = SUCCESS`; a later `FAILED` run raises the warning | AC-31.7 |
| Outstanding quantity of an order | `erp_po_lines.quantity` minus the sum of `erp_receipt_lines.quantity_received`; the same for the simulator | BR-15, AC-08.5 |
| Matched item and conversion arithmetic | The latest `invoice_line_matches` row of the line | AC-14.3 |
| Payment reference on an invoice | The `payment_reference` of the request of its active request line | AC-26.2, difference 6 |

### Stored although derivable

| Column | Why it is stored |
|---|---|
| `invoices.flow` | The worklist filters by it, and a person's correction must not overwrite the AI's value (D-66). |
| `exceptions.approval_amount` | The combined amount of split orders is decided once, from a finding, and the level must not change if an order is edited in the ERP later (BR-10). |
| `payment_requests.total_amount`, `content_hash`, `required_level_name` | A signature is bound to the content hash (BR-37); the total and the level are kept in step with the lines in the same transaction, and a signed request keeps its level (D-62). |
| `payment_request_lines.amount` | The invoice total at release, so a request still reads the same if the invoice record is corrected. |
| `payment_requests.payment_reference`, `paid_at` | The ERP's answer, and a unique index per entity. The same value is on the attempt that received it. |
| `individual_approvals.required_level_name`, `approval_amount` | The level and the amount the approver judged (D-62). |
| `individual_approvals.decision_action_id` | The rows written by one approve or decline action; for linked split-order exceptions it proves that all of them were decided together (D-70). |
| `supplier_entity_stats`, `price_history` | The seed has no paid invoices, and the checks must work from the first day (D-64). |
| `rule_evaluations.tolerance_pct`, `batch_threshold_vnd`, `anomaly_findings.limit_pct`, `gate_alerts.limit_pct` | The values in force at the decision, so that a later change of the entity policy does not change the explanation (BR-12). |
| `authority_status_lookups.seller_tax_code`, `series`, `number` | The key as it was looked up and normalized (DF-59), so that the evidence stays the same if the invoice record is corrected. |
| `cancellation_notices.invoice_state` | The state at the time of the notice decides the effect, and the invoice moves on afterwards. |
| `batch_reopenings.released_by`, `released_at` | The release that was undone; the batch row is cleared by the reopening. |
| `signing_delegations.delegated_role` | The role of the delegator when the delegation was made, so that a later change of role (UC-02) does not change what the delegate may sign. |
| `invoices.holds_key` | The partial unique index of D-51 needs a column to hang on. |
| `invoices.state_changed_at`, `exceptions.opened_at` | Cheap sort keys and the age of the backlog. |

## Transaction boundaries

A model call never runs inside a database transaction, so no lock is held while the model answers (DF-08 allows 20 seconds). Every transaction below includes its `audit_log` rows; if the insert fails, the whole transaction rolls back (DF-30, D-55). The one exception is the notification row, which never rolls anything back (DF-67).

| Action | Saved together in one transaction | After commit |
|---|---|---|
| Upload an XML file | `invoices`, `invoice_documents`, `invoice_lines`, `invoice_corrections` rows; the audit entry. The file is processed on its own, so a bad file never stops the others (AC-10.10) | Signature check, then the check run |
| Signature check passed | `signature_status`, `trust_level`, `holds_key = true`, state `In Check`, and a new run. A unique violation on the group key turns into V6 in the same transaction | The AI steps |
| One check run | Written in two steps: each AI output and its `ai_requests` row when it returns; then, in one transaction, the `rule_evaluations` row, its six `rule_condition_results`, the new invoice state, and the `exceptions` and `exception_reasons` or the `batch_items` row (and the batch row if the period has none), and the run's `outcome` | — |
| Resolve an exception | Version check on the exception (BR-37), the person's rows (`invoice_line_matches` with `PERSON`, `item_mappings`, `gate_comparisons`, `correction_requests`), exception state, and the audit entry; then a new check run | The check run |
| Send a correction request | The `correction_requests` status and the exception state change only when the Email Service answered; on failure `send_status = NOT_SENT` and `last_error`, and the exception does not change | — |
| Tax-risk decision | Version check, `tax_risk_decisions` row, exception state, and for a rejection the invoice state | Check run after a release |
| Report wrong entity | Version check on the exception (BR-37), a `wrong_entity_reports` row with the traced source and values, an `exception_reasons` row `WRONG_BUYER_TAX_CODE` (source `BUYER_TAX_CODE`) or `WRONG_ENTITY_REPORTED`, the exception in `IN_REVIEW`, the audit entry. `invoices.entity_id` never changes (D-68) | — |
| Individual approval | Version check on the exception, `individual_approvals` row, exception closed with `APPROVED_INDIVIDUALLY`, invoice `In Batch`, `batch_items` row. The payment request is not created here: it is created when the batch is released, with `individual_approval_id` (D-69). For linked split-order exceptions the same transaction does this for every exception of the split finding with one `decision_action_id`, checks every version and the separation of duties on every one, and saves nothing when a check fails; a decline writes a `DECLINED` row for each and returns all of them to the AP Accountant (D-70) | — |
| Close a batch for review | Version check on the batch, state, sample size, and the `batch_sample_items` rows. The AI selection runs before the transaction; if it fails, the fallback of DF-29 fills the rows and `sample_method = WITHOUT_AI` | — |
| Mark a sample item | The mark, and for `ERROR` the withdrawal (V15) and, when the alert condition holds, a `gate_alerts` row | — |
| Release a batch | Version check, no `PENDING` sample row, batch state `In Signing`, the `payment_requests` and `payment_request_lines` with totals, level, and content hash | AI summaries, which the signer's page waits for only as long as it chooses (AC-25.13) |
| Sign requests | **One transaction per request**, so a refused request does not block the others: the version and content-hash check, the signer's separation checks (BR-36, which for a delegate also use the invoices the delegate processed), for a delegate the check that the `signing_delegations` row is in its range and not revoked, the `request_signatures` row with the shared `signing_action_id` (and `on_behalf_of_user_id` and `delegation_id` for a delegate), the request state and, for the second signature, the invoices' state `Signed` (V16) and the first `erp_send_attempts` row | The send |
| Remove a line, decline a request | Version check, the line or the request ended with its reason, recomputed total, hash, level, version, every `VALID` signature voided, invoice back to exception with a `WITHDRAWN_FROM_BATCH` or `APPROVAL_DECLINED` reason | — |
| Confirm or reject an acceptance | Version check on the invoice (BR-37), the `service_acceptances` row, a new `invoice_check_runs` row with trigger `ACCEPTANCE`, and the audit entry. The run ends as any run does; a rejection ends in an exception with the reason `SERVICE_ACCEPTANCE_REJECTED` that points to the row. When the sync later brings an ERP acceptance, `overridden_by_receipt_id` and `overridden_at` are set in the check run that matches it | The rest of the check run |
| Mailbox fetch | One `mailbox_fetch_runs` row per fetch. Each new message is stored in its own transaction with its `mailbox_attachments` rows, and each XML attachment is saved like an upload (`invoices` with `source = EMAIL`, `invoice_documents`, `invoice_lines`, `invoice_corrections`) with the audit entry. A malformed attachment never stops the others (AC-31.5), and a message already stored is skipped by the unique identifier | Signature check, lookup, and check run of each invoice |
| Look up the authority status | The call runs outside any transaction and waits at most 10 seconds (DF-64). The `authority_status_lookups` row is saved with the signature check at intake (the outcome of V6 comes from it), with a re-run, or with an ERP sync; an unavailable answer is a row and the exception `AUTHORITY_STATUS_UNAVAILABLE` | The check run |
| Record a cancellation notice | Version check on the invoice and, when they exist, its request and batch (BR-37); the `cancellation_notices` row with its file and effect; the state changes of V13, V15, V20, or V21 with the rows named there; for a withdrawn line the recomputed total, hash, level, and version and the voided signatures (R5); for R9 the cancelled request, the new exceptions, and the notifications to the AP Accountant and the Chief Accountant | — |
| Expand the sample | Version check on the batch, the `sample_expansions` row, and the new `batch_sample_items` rows. The AI selection runs before the transaction; if it fails, the fallback of DF-29 fills the rows and `method = WITHOUT_AI` | — |
| Reopen a batch | Version check on the batch, a check inside the transaction that no request has a `VALID` signature, the `batch_reopenings` row, the batch `In Review` with `released_by` and `released_at` cleared, every request `CANCELLED` with `BATCH_REOPENED`, and their lines ended | — |
| Resend to the ERP | A check that the request is `Signed`, the 3 automatic attempts failed, and no attempt is `PENDING`; the hash check (AC-26.7); a new `erp_send_attempts` row with `is_manual = true`, `triggered_by`, and the same idempotency key. The worker sends it as any attempt | — |
| Create or revoke a delegation | The `signing_delegations` row; the exclusion constraint refuses an overlap with another unrevoked range of the delegator. A revocation checks the version and sets `revoked_by` and `revoked_at`. Audit entries with the type `CONFIG_CHANGE` (D-127) | — |
| Notifications | A notification is written in the transaction of the event that causes it, but a failure to write it is logged and never rolls the event back (DF-67, AC-32.9). Reminders are written by a daily job that skips work already done and rows that exist for the day | — |
| ERP send | A worker takes a `PENDING` attempt, sends with the request number as the idempotency key, and records the outcome and the next attempt in one transaction; the third failure leaves the request `Signed` and raises the alert. A hash that differs from the signed one is `HASH_MISMATCH` and is not sent (AC-26.7) | — |
| ERP paid status | `reply`, `payment_reference`, request `Paid`, invoices `Paid`, `price_history` and `supplier_entity_stats`, and the batch `Completed` when every request is paid or has its mocked failure recorded (D-67, a call awaiting review) | — |
| ERP sync | One transaction per record type: upserts by `(entity_id, erp_ref)` (so a second run creates no duplicate, AC-07.2), rejections logged, run totals; then new check runs for invoices that wait for goods or for a corrected record, and for invoices of a newly listed supplier (AC-07.10) | Check runs |
| Lower a group maximum | The group row and every entity policy above the new maximum are changed together, with one audit entry each (AC-03.4) | — |

## Concurrency

- **Versions** (BR-37, DF-27, D-56): a checked action runs `UPDATE ... SET version = version + 1 WHERE id = :id AND version = :seen`. Zero rows means the object changed, nothing is saved, and the user is asked to reload (the conflict state). Invoices, exceptions, batches, and payment requests carry it for the actions named by D-30; the configuration objects carry it for the conflict states of the Step 4 screens.
- **Signing** is bound to the version and the content hash of the request. The signature insert and the state change happen in the transaction that holds the checked `UPDATE` of the request, so a line removed a moment earlier makes the update fail and nothing is signed (AC-25.10).
- **One open exception per invoice**, **one active batch item per invoice**, and **one active request line per invoice** are partial unique indexes, so two users cannot admit or approve the same invoice twice.
- **One batch per entity per month** is a unique index on `(entity_id, period_start)`; "admit an invoice" uses `INSERT ... ON CONFLICT DO NOTHING` and then reads the row, so two admissions at the same time create one batch (D-10, AC-16.14).
- **One valid signature per request and signer, and per request and role**, are partial unique indexes (O-15). A delegate who signs for the delegator uses the delegator's role slot, and the signer index still stops the same person from signing both signatures (AC-30.3).
- **One decision per service acceptance**, **one mailbox message per entity and identifier**, and **one reminder per recipient, work item, and day** are unique indexes.
- **No overlapping delegations per delegator** is an exclusion constraint on the date range of unrevoked rows (SQL; the DBML records it in a note).
- **A reopening and a signature cannot both succeed.** The reopening checks the batch version and the absence of `VALID` signatures in one transaction, and a signature updates the request under the version check, so one of them fails and is asked to reload (BR-37, AC-24.17).
- **Sync** upserts by `(entity_id, erp_ref)`, so two overlapping runs do not duplicate records. A second run for the same entity waits for the first (advisory lock, Step 7).

## Duplicate checks

| Check | Mechanism | Rule |
|---|---|---|
| Exact duplicate across the group | The partial unique index `ux_invoices_group_key` (D-51); the key is normalized (DF-59). Only the insert uses it, and the answer reveals no entity, amount, or content | BR-11, D-09, AC-10.7 |
| Near-duplicate within one entity | A query on `ix_invoices_near_duplicate`: same supplier and entity, same total, a date within 3 days, a different number; the result is a `POSSIBLE_DUPLICATE` finding | DF-19, AC-15.3 |
| Replacement or adjustment invoice | Not a duplicate of the invoice it corrects: the near-duplicate query skips an invoice that `invoice_corrections` links | BR-31 |
| One invoice per recurring period | Unique `(profile_id, period_start)` | BR-24, AC-15.6 |
| One active profile per supplier, location, and period | Partial unique index on active profiles | AC-09.3 |
| One user per ERP user, one email per user | Unique indexes on `users` | AC-02.7 |
| One entity per tax code | Unique `entities.tax_code` | AC-03.2 |
| One mailbox message processed once | Unique `(entity_id, message_identifier)` on `mailbox_messages`; the XML in it is still checked for an exact duplicate like an upload | DF-63, AC-31.4 |
| One acceptance decision per invoice | Unique `invoice_id` on `service_acceptances` | AC-29.2 |
| One reminder per day | Partial unique index on `(recipient_id, reminder_key, reminder_on)` | DF-67 |
| One mapping per supplier text | Partial unique index on active mappings (D-52) | BR-28 |

## Privacy and retention

- `users.password_hash` is never returned by the API or written to logs.
- `ai_requests` and `erp_send_attempts.error_message` hold no document text, prompts, or secrets. The text of an invoice reaches the LLM only through the application, with synthetic data in the MVP (DF-09).
- Text inside an XML file is data and never an instruction (BR-27). It is stored in `invoice_lines.description` and shown as text, never executed or used to build queries.
- The sender of an email is not trusted: the seller signature and the checks of US-10 decide (DF-63). The body of a message is not stored, and an attachment that is not XML is logged without its bytes. A cancellation notice file is stored as evidence for its invoice only.
- `notifications` hold a line of text and a link, with no document content, and are created only for users of the entity of the object (AC-32.7).
- Another entity's data is never shown: not in a message, a count, an error, or a draft (BR-09, AC-19.9). The duplicate answer is the one place that touches the whole group, and it reveals only that a duplicate exists.
- The audit log holds the actor and the numbers of a decision, not the document. The Group Admin sees only the events flagged `is_group_event`.
- Nothing is deleted in the MVP (D-65, DF-57). A real deployment needs a retention period for invoice originals, signatures, and the audit log, and a way to remove personal data of a deactivated user without breaking the log; neither is designed here.

## Seed data

The seed is described in DF-56 and uses the sample data of DF-12, DF-33, DF-42, DF-46, and DF-49.

- The fictional **Calderwood Group** with three entities and their policies (price tolerance 2%, batch threshold VND 200,000,000 for Calderwood Foods Co., group maximums 5% and VND 300,000,000, sample rate 10%, grouping by supplier), and the users of DF-12 (Alice, Carol, Dan, Fiona, Evan, Gina, Dina).
- The approval matrix of Calderwood Foods Co.: Department Head below VND 50,000,000 (Dan), CFO from VND 50,000,000 (Fiona).
- The sector list with electricity (DF-25), and the sector of each seller on the ERP supplier data (Sunrise Electric Utility is electricity, D-71).
- ERP master data, orders, and receipts of the invoices in the wireframes, with the simulator personas (buyer, warehouse keeper, acceptor), and the tax-risk entry for Eastbay Trading with its source and date.
- Gate pairs and their history as in DF-49 (for example 50 compared with 49 unchanged for Brightfield Paper Ltd and Calderwood Foods Co.), as `gate_comparisons` rows with `is_simulated = true` and no invoice.
- Price history of at least 3 purchases per item in the last 6 months, the paid-invoice counts per supplier (for example 14 for Brightfield Paper Ltd), and earlier recurring periods for the usage-based electricity profile, as seed rows (DF-42, D-64, D-72). Where the demo has fewer than 3 paid purchases of an item, the history is seeded.
- The three message templates approved by the Chief Accountant (DF-21).
- Requesting Department user Rowan of Calderwood Foods Co., the service supplier Lakeside Facility Services Ltd, and a service invoice waiting for acceptance (DF-61, DF-73).
- The mailbox log of DF-73: 5 messages with 8 attachments, some accepted and some rejected with a reason, as `mailbox_messages` and `mailbox_attachments` rows with one `mailbox_fetch_runs` row.
- Four delegations as in DF-73 (Carol to Fiona, Fiona to Dan, Carol to Dan, Dan to Fiona) in the states Active, Scheduled, Ended, and Revoked.
- Entries of the simulated authority status feed for the demo: an invoice that is Cancelled at the authority since 2026-11-03, one that is Replaced, one that is Adjusted, and one that does not answer (D-120).
- Three unread notifications for each of the three finance roles (DF-74).
- Sample XML invoices and the October 2026 batch of DF-46 (5 invoices, VND 70,050,000, three requests) for the demo and for ES-04.

## Where the screens get their data

A spot check of the Step 4 screens. Every displayed field has a source.

| Screen | Field | Column or query |
|---|---|---|
| SCR-10 | State chip, supplier, flow, total, due date, "Due soon" | `invoices.state`, `supplier_id` to `erp_suppliers.name`, `flow`, `total_amount`, `due_date` (computed) |
| SCR-10 | "Last ERP sync: 31/10/2026 09:15", stale warning | `erp_sync_runs` (computed) |
| SCR-10 | Reasons with numbers, "Reminder due" | `exception_reasons.detail`; `correction_requests.reply_due_at` |
| SCR-10 | Source column and filter; "Run lookup again" | `invoices.source`; `authority_status_lookups` |
| SCR-10 | Search by number, supplier, amount, and state | `invoices` joined to `erp_suppliers`, scoped by `entity_id` (DF-68) |
| SCR-11 | Per-file result and reason | Not stored for a rejected non-XML file (no invoice); for a rejected XML `invoices.rejection_reason`; the upload is also an audit entry |
| SCR-12 | Seller, series and number, buyer tax code, order reference | `invoices.seller_name`, `seller_tax_code`, `series`, `number`, `buyer_tax_code`, `order_id` |
| SCR-12 | "Seller signature valid, checked 31/10/2026 08:52", stored hash | `invoices.signature_status`, `signature_checked_at`; `invoice_documents.sha256` |
| SCR-12 | Order and receipt with sync time | `erp_purchase_orders`, `erp_po_lines`, `erp_receipts`, `erp_receipt_lines` (`synced_at`), through `invoices.order_id` and `invoice_receipts` |
| SCR-12 | Flow, confidence 0.97, reason, "model 2026.10 · prompt v14" | `ai_flow_classifications` and `ai_identifications` (latest run) |
| SCR-12 | Line matches with method and probability (threshold 0.90) | `invoice_line_matches` (latest per line) |
| SCR-12 | Anomaly numbers ("median VND 60,000 from 6 purchases: +2.5%") | `anomaly_findings.observed_value`, `reference_value`, `deviation_pct`, `limit_pct`, `sample_count`, `detail` |
| SCR-12 | Six conditions with value and Pass or Fail | `rule_condition_results` of the latest `rule_evaluations` |
| SCR-12 | Decision history with the five tags | `audit_log` by `invoice_id`, tag from `actor_type` |
| SCR-12 | Authority status, its date, and the time of the lookup | Latest `authority_status_lookups` of the invoice |
| SCR-12 | Service acceptance with user, time, note, and source (ERP or Requesting Department) | `service_acceptances` or `invoice_receipts` |
| SCR-12 | State history | `audit_log` by `invoice_id` (AC-17.11) |
| SCR-12 | Stored cancellation notice as a warning | `cancellation_notices` |
| SCR-12 | "signed by Dan on behalf of Carol" | `request_signatures.signer_id` and `on_behalf_of_user_id` |
| SCR-12 | Payment request and signature records, payment reference | `payment_request_lines` to `payment_requests` to `request_signatures` |
| SCR-14 | AI draft, editable text, "Not sent" | `correction_requests.ai_draft`, `body`, `send_status` |
| SCR-16 | List entry with source and date, "Listed on 28/10/2026" | `tax_risk_entries.source`, `listed_on`, `loaded_at` |
| SCR-18 | Level needed, "You created the order for this invoice" | `individual_approvals.required_level_name`; `users.erp_user_id` against `erp_purchase_orders.created_by_erp_user_id` |
| SCR-20 | Profiles, earlier-period amounts and their average | `recurring_profiles`, `recurring_profile_periods` |
| SCR-19 | Reference, date, file, and the effect for the current state | `cancellation_notices` (`effect` is computed before it is saved) |
| SCR-22, SCR-23 | Acceptance queue; confirm or reject with a note | Acceptance queue (see Derived values); `service_acceptances` |
| SCR-24 | Messages, attachments, result of each, last fetch, failure | `mailbox_messages`, `mailbox_attachments`, `mailbox_fetch_runs` |
| SCR-30 | Batch state, sample with reasons and marks, request status | `payment_batches`, `batch_sample_items`, `payment_requests`, `erp_send_attempts` |
| SCR-33, SCR-34 | Expand sample; reopen for review | `sample_expansions`, `batch_sample_items`; `batch_reopenings` |
| SCR-55, SCR-56 | Delegations with state, new delegation, revoke | `signing_delegations` |
| SCR-57 | Resend to the ERP, the failed attempts | `erp_send_attempts` (`is_manual`, `triggered_by`) |
| SCR-40 | Decisions and approvals by role, age | `exceptions.waiting_role`, `approval_amount`, `opened_at` |
| SCR-50, SCR-51 | Number, total, level, flags, signatures so far, ERP status | `payment_requests`, `request_signatures`, `anomaly_findings`, `erp_send_attempts` |
| SCR-51 | AI summary | `ai_payment_summaries` |
| SCR-50, SCR-51, SCR-52 | "On behalf of" marking | Requests that wait for a delegator, from `signing_delegations`; the record in `request_signatures` |
| SCR-62 | Notification list, unread count, "Unread only" | `notifications` |
| SCR-60 | Touchless rate, misplacement, backlog | Computed (see Derived values) |
| SCR-61 | Entries and filters | `audit_log` |
| SCR-70, SCR-71 | Users, role, entity, ERP user link, status | `users`, `erp_users` |
| SCR-73, SCR-74 | Policy values with the group maximum; tiers and approvers | `entity_policies`, `corporate_groups`; `approval_tiers`, `approval_tier_approvers` |
| SCR-75, SCR-78 | Gates, compared invoices, accuracy, alert, "Simulated history", last sync | `supplier_gates`, `gate_comparisons`, `gate_alerts`, `erp_sync_runs` (counts only) |
| SCR-76 | Entities, maximums, sector list | `entities`, `corporate_groups`, `group_sectors` |
| SCR-80..SCR-82 | Personas, orders, receipts, outstanding quantity | `sim_personas`, `sim_purchase_orders`, `sim_po_lines`, `sim_receipts`, `sim_receipt_lines` |

## Stories and their tables

Every active story has data in at least one table. The same lists fill the Database column of the [master traceability matrix](../traceability/master-traceability.md).

| Story | Tables |
|---|---|
| US-01 | `users`, `entities`, `audit_log` |
| US-02 | `users`, `erp_users`, `entities`, `audit_log` |
| US-03 | `corporate_groups`, `group_sectors`, `entities`, `entity_policies`, `audit_log` |
| US-04 | `entity_policies`, `corporate_groups`, `entities`, `audit_log` |
| US-05 | `approval_tiers`, `approval_tier_approvers`, `entities`, `users`, `audit_log` |
| US-06 | `supplier_gates`, `gate_comparisons`, `gate_alerts`, `erp_suppliers`, `batch_sample_items`, `audit_log` |
| US-07 | `erp_sync_runs`, `erp_sync_rejections`, `erp_users`, `erp_suppliers`, `erp_supplier_bank_accounts`, `erp_items`, `erp_unit_conversions`, `erp_purchase_orders`, `erp_po_lines`, `erp_receipts`, `erp_receipt_lines`, `tax_risk_entries`, `sim_authority_statuses`, `authority_status_lookups`, `cancellation_notices` |
| US-08 | `sim_personas`, `sim_purchase_orders`, `sim_po_lines`, `sim_receipts`, `sim_receipt_lines` |
| US-09 | `recurring_profiles`, `recurring_profile_periods`, `erp_suppliers`, `audit_log` |
| US-10 | `invoices`, `invoice_documents`, `invoice_lines`, `invoice_corrections`, `erp_suppliers`, `group_sectors`, `authority_status_lookups`, `audit_log` |
| US-12 | `ai_flow_classifications`, `invoice_check_runs`, `ai_requests`, `invoices` |
| US-13 | `ai_identifications`, `invoice_receipts`, `service_acceptances`, `invoice_check_runs`, `invoices`, `erp_purchase_orders`, `erp_receipts`, `recurring_profiles` |
| US-14 | `invoice_line_matches`, `item_mappings`, `invoice_lines`, `erp_items`, `erp_unit_conversions` |
| US-15 | `anomaly_findings`, `anomaly_finding_invoices`, `price_history`, `supplier_entity_stats`, `erp_supplier_bank_accounts`, `recurring_profile_periods`, `invoices` |
| US-16 | `rule_evaluations`, `rule_condition_results`, `invoice_check_runs`, `invoices`, `exceptions`, `exception_reasons`, `batch_items`, `payment_batches`, `supplier_gates`, `entity_policies`, `ai_requests`, `authority_status_lookups`, `service_acceptances` |
| US-17 | `invoices`, `invoice_documents`, `invoice_lines`, `exceptions`, `exception_reasons`, `rule_condition_results`, `invoice_line_matches`, `anomaly_findings`, `authority_status_lookups`, `service_acceptances`, `cancellation_notices`, `audit_log` |
| US-18 | `exceptions`, `exception_reasons`, `wrong_entity_reports`, `item_mappings`, `invoice_line_matches`, `gate_comparisons`, `exception_follow_up_links`, `cancellation_notices`, `batch_items`, `payment_requests`, `payment_request_lines`, `request_signatures`, `invoices`, `audit_log` |
| US-19 | `correction_requests`, `message_templates`, `exceptions`, `erp_suppliers` |
| US-20 | `exception_follow_up_links`, `invoice_corrections`, `exceptions`, `invoices` |
| US-21 | `tax_risk_entries`, `tax_risk_decisions`, `exceptions`, `exception_reasons` |
| US-23 | `individual_approvals`, `approval_tiers`, `exceptions`, `batch_items`, `service_acceptances`, `batch_sample_items`, `users`, `erp_users` |
| US-24 | `payment_batches`, `batch_items`, `batch_sample_items`, `sample_expansions`, `batch_reopenings`, `payment_requests`, `payment_request_lines`, `entity_policies`, `ai_requests` |
| US-25 | `payment_requests`, `payment_request_lines`, `request_signatures`, `signing_delegations`, `ai_payment_summaries`, `approval_tiers`, `approval_tier_approvers`, `service_acceptances`, `batch_sample_items`, `exceptions` |
| US-26 | `erp_send_attempts`, `payment_requests`, `payment_batches`, `payment_request_lines`, `invoices` |
| US-27 | `invoices`, `exceptions`, `batch_items`, `batch_sample_items`, `payment_batches`, `gate_comparisons` |
| US-28 | `audit_log` |
| US-29 | `service_acceptances`, `invoices`, `erp_purchase_orders`, `erp_receipts`, `invoice_receipts`, `invoice_check_runs`, `exceptions`, `exception_reasons`, `users`, `erp_users`, `audit_log` |
| US-30 | `signing_delegations`, `request_signatures`, `payment_requests`, `approval_tiers`, `approval_tier_approvers`, `users`, `audit_log` |
| US-31 | `mailbox_fetch_runs`, `mailbox_messages`, `mailbox_attachments`, `invoices`, `invoice_documents`, `audit_log` |
| US-32 | `notifications`, `users`, `exceptions`, `payment_batches`, `payment_requests`, `correction_requests` |

## Not modelled in Step 5

| Item | Why | Where it is decided |
|---|---|---|
| Foreign invoices, their original currency and exchange rate, customs documents, import-stage VAT, foreign contractor tax outcomes | Removed from the MVP by D-33 (Advanced W-19, W-20). An invoice that still arrives with a seller who has no Vietnamese tax code is flagged by the flow value `UNSUPPORTED_FOREIGN` and becomes an exception; nothing more is stored. `invoices.currency` is checked to be VND | W-19, W-20 |
| PDF and image intake, field confirmation after reading, a multimodal reading result | Removed by D-33 (W-19). A non-XML file is rejected at upload and creates no row | W-19 |
| Payment method, the cash flag, and the cash threshold | Removed by D-33 (W-21). The MVP sends a non-cash instruction by design (D-11) and stores only the paid status and the payment reference | W-21 |
| Attachments on an exception | DF-22 is kept only for W-20; no MVP story attaches files | W-20 |
| Subscriptions charged to a card, card transactions, subscription profiles | Advanced (W-04); the flow value `SUBSCRIPTION` exists so such an invoice becomes the exception "Advanced flow" | W-04 |
| Automatic opening and closing of a gate | Advanced (W-01); `supplier_gates` is changed by a person only | W-01 |
| Comparison across entities, group median price | Advanced (W-07); every table is per entity | W-07 |
| Policy delegation instead of per-request signing | Open (O-05, O-15); one signature record per request | O-05, O-15 |
| Login sessions, tokens, password reset | Depends on the authentication design. A deactivated user's session must end on the next request (AC-02.5) whatever the design | Step 7 |
| File storage for the XML bytes | `invoice_documents.xml_content` holds them in the MVP; object storage is an option | Step 7 |
| Server configuration (thresholds, intervals, retry counts, timeouts) | DF-55; kept out of tables so that the Group Admin has no screen that is not in Step 3 | Step 7 |
| Master data of the ERP simulator (suppliers, items, unit conversions, risk feed) | Seed files (D-49) | Step 9 |
| Alerts as rows | The failed-send alert and the stale warning are computed from the rows above (DF-69, supersedes DF-40). In-app notifications and reminders are rows since the sync to the mind map (`notifications`, D-126) | Step 6 |
| Supplier portal and the real connection to the tax authority | Advanced (W-05, W-13). The MVP has the simulated mailbox and the simulated status feed only | W-05, W-13 |
| The mailbox address of each entity, the fetch interval, and the 10-second lookup timeout | Server configuration (DF-55); the address is copied onto each message as read | Step 7 |
| Delegation of individual approvals | No acceptance criterion names it; UC-30 delegates signing only (D-119). A delegate signs requests, and an exception still waits for its Payment Approver | UC-30 |
| SQL migrations, composite foreign keys, partial indexes, exclusion constraint, trigger, row-level security | Written with the code; the DBML records the intent | Step 9 |

**Related:** [Step index](README.md) · [Decisions](00-decisions.md) · [ER diagram](02-er-diagram.md)
