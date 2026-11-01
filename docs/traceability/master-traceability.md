# Master Traceability Matrix — MatchPay MVP

> Design status: MVP — updated at every step (last update: sync of Step 5 to the feature mind map, draft for review)
>
> Implementation status: NOT STARTED

Columns marked TBD are filled in by the step that owns them: API operationId (Step 6) and C4 Component (Step 7). The Database column was filled in Step 5 with the tables that hold the data of each story ([stories and their tables](../05-database/01-data-model.md#stories-and-their-tables)). The Screen column was filled in Step 3 from the [requirement-to-screen mapping](../03-information-architecture/04-screen-inventory.md#requirement-to-screen-mapping); stories that describe system behaviour list the screens where their results are visible. The four stories added by the sync to the feature mind map (US-29..US-32, D-88) have their Screen cells filled by the Step 3 sync, and the stories that gained criteria (US-10, US-17, US-18, US-24, US-26) have the screens that were added for them; the other stories that gained criteria (US-07, US-13, US-23, US-25) were checked and keep their screens. Step 5 was synced after Step 4 ([Step 5 decisions](../05-database/00-decisions.md#mind-map-sync-d-88-draft-for-review)): the Database cells of US-29..US-32 are filled, and the stories that gained criteria (US-07, US-10, US-13, US-16, US-17, US-18, US-23, US-24, US-25) list the new tables. Step 6 uses this matrix for its cross-check: every user story must have an API, and every API must use an entity from the database model. The top-down chain is: business goal, problem (P), capability, module (M), then use case (UC), user story (US), acceptance criteria (AC), and business rule (BR). The chain from goal to module is in [Context and problem](../01-research/01-context-and-problem.md).

## Functional traceability

Each user story has the number of its use case. The acceptance criteria and the business rules come from the header of each story in [Acceptance criteria](../02-usecases-userstories/04-acceptance-criteria.md), and the priority from the [backlog](../02-usecases-userstories/03-user-stories-invest.md). US-11 and US-22 were removed by the user's decision D-33 (foreign invoices moved to Advanced): their rows stay, marked "Removed (D-33)", so that the numbers are not reused. The 30 other rows are active.

| Requirement | Use Case | Acceptance Criteria | Business Rules | Screen | API operationId | Database | C4 Component | MoSCoW |
|---|---|---|---|---|---|---|---|---|
| US-01 | UC-01 | AC-01.1–AC-01.9 | BR-09, BR-12 | SCR-01, SCR-90 | TBD (Step 6) | users, entities, audit_log | TBD (Step 7) | Must |
| US-02 | UC-02 | AC-02.1–AC-02.9 | BR-02, BR-09, BR-12, BR-36 | SCR-70, SCR-71, SCR-72 | TBD (Step 6) | users, erp_users, entities, audit_log | TBD (Step 7) | Must |
| US-03 | UC-03 | AC-03.1–AC-03.6 | BR-01, BR-09, BR-12, BR-16, BR-17 | SCR-76, SCR-77 | TBD (Step 6) | corporate_groups, group_sectors, entities, entity_policies, audit_log | TBD (Step 7) | Should |
| US-04 | UC-04 | AC-04.1–AC-04.8 | BR-04, BR-07, BR-09, BR-12, BR-16, BR-20 | SCR-73 | TBD (Step 6) | entity_policies, corporate_groups, entities, audit_log | TBD (Step 7) | Must |
| US-05 | UC-05 | AC-05.1–AC-05.6 | BR-03, BR-09, BR-12 | SCR-74 | TBD (Step 6) | approval_tiers, approval_tier_approvers, entities, users, audit_log | TBD (Step 7) | Must |
| US-06 | UC-06 | AC-06.1–AC-06.10 | BR-06, BR-07, BR-09, BR-12 | SCR-75, SCR-78, SCR-79 | TBD (Step 6) | supplier_gates, gate_comparisons, gate_alerts, erp_suppliers, batch_sample_items, audit_log | TBD (Step 7) | Must |
| US-07 | UC-07 | AC-07.1–AC-07.12 | BR-08, BR-09, BR-12, BR-13, BR-14, BR-19, BR-25, BR-31, BR-39 | SCR-10, SCR-12, SCR-16, SCR-75 | TBD (Step 6) | erp_sync_runs, erp_sync_rejections, erp_users, erp_suppliers, erp_supplier_bank_accounts, erp_items, erp_unit_conversions, erp_purchase_orders, erp_po_lines, erp_receipts, erp_receipt_lines, tax_risk_entries, sim_authority_statuses, authority_status_lookups, cancellation_notices | TBD (Step 7) | Must |
| US-08 | UC-08 | AC-08.1–AC-08.8 | BR-02, BR-09, BR-13, BR-15, BR-19 | SCR-80, SCR-81, SCR-82 | TBD (Step 6) | sim_personas, sim_purchase_orders, sim_po_lines, sim_receipts, sim_receipt_lines | TBD (Step 7) | Must |
| US-09 | UC-09 | AC-09.1–AC-09.6 | BR-09, BR-12, BR-24 | SCR-20, SCR-21 | TBD (Step 6) | recurring_profiles, recurring_profile_periods, erp_suppliers, audit_log | TBD (Step 7) | Should |
| US-10 | UC-10 | AC-10.1–AC-10.16 | BR-01, BR-09, BR-11, BR-12, BR-17, BR-31, BR-33, BR-39 | SCR-10, SCR-11, SCR-12 | TBD (Step 6) | invoices, invoice_documents, invoice_lines, invoice_corrections, erp_suppliers, group_sectors, authority_status_lookups, audit_log | TBD (Step 7) | Must |
| US-11 | UC-11 | Removed (D-33) | Removed (D-33), now Advanced W-19 | Removed (D-33) | — | — | — | Removed (D-33) |
| US-12 | UC-12 | AC-12.1–AC-12.9 | BR-12, BR-17, BR-23, BR-27, BR-33 | SCR-10, SCR-12, SCR-15 | TBD (Step 6) | ai_flow_classifications, invoice_check_runs, ai_requests, invoices | TBD (Step 7) | Must |
| US-13 | UC-13 | AC-13.1–AC-13.9 | BR-01, BR-09, BR-12, BR-14, BR-19, BR-24, BR-27, BR-33 | SCR-10, SCR-12 | TBD (Step 6) | ai_identifications, invoice_receipts, service_acceptances, invoice_check_runs, invoices, erp_purchase_orders, erp_receipts, recurring_profiles | TBD (Step 7) | Must |
| US-14 | UC-14 | AC-14.1–AC-14.10 | BR-09, BR-12, BR-27, BR-28 | SCR-12 | TBD (Step 6) | invoice_line_matches, item_mappings, invoice_lines, erp_items, erp_unit_conversions | TBD (Step 7) | Must |
| US-15 | UC-15 | AC-15.1–AC-15.12 | BR-09, BR-10, BR-11, BR-12, BR-24, BR-29, BR-30 | SCR-12 | TBD (Step 6) | anomaly_findings, anomaly_finding_invoices, price_history, supplier_entity_stats, erp_supplier_bank_accounts, recurring_profile_periods, invoices | TBD (Step 7) | Must |
| US-16 | UC-16 | AC-16.1–AC-16.15 | BR-04, BR-05, BR-06, BR-08, BR-10, BR-11, BR-12, BR-14, BR-15, BR-16, BR-17, BR-24, BR-27, BR-28, BR-29, BR-30, BR-33 | SCR-10, SCR-12, SCR-30 | TBD (Step 6) | rule_evaluations, rule_condition_results, invoice_check_runs, invoices, exceptions, exception_reasons, batch_items, payment_batches, supplier_gates, entity_policies, ai_requests, authority_status_lookups, service_acceptances | TBD (Step 7) | Must |
| US-17 | UC-17 | AC-17.1–AC-17.13 | BR-09, BR-12 | SCR-10, SCR-12, SCR-30, SCR-51 | TBD (Step 6) | invoices, invoice_documents, invoice_lines, exceptions, exception_reasons, rule_condition_results, invoice_line_matches, anomaly_findings, authority_status_lookups, service_acceptances, cancellation_notices, audit_log | TBD (Step 7) | Must |
| US-18 | UC-18 | AC-18.1–AC-18.16 | BR-05, BR-06, BR-09, BR-12, BR-25, BR-26, BR-31, BR-33, BR-34, BR-35, BR-37 | SCR-10, SCR-12, SCR-15, SCR-19 | TBD (Step 6) | exceptions, exception_reasons, wrong_entity_reports, item_mappings, invoice_line_matches, gate_comparisons, exception_follow_up_links, cancellation_notices, batch_items, payment_requests, payment_request_lines, request_signatures, invoices, audit_log | TBD (Step 7) | Must |
| US-19 | UC-19 | AC-19.1–AC-19.10 | BR-01, BR-09, BR-25, BR-26, BR-27, BR-31 | SCR-10, SCR-12, SCR-14 | TBD (Step 6) | correction_requests, message_templates, exceptions, erp_suppliers | TBD (Step 7) | Should |
| US-20 | UC-20 | AC-20.1–AC-20.9 | BR-09, BR-11, BR-12, BR-25, BR-26, BR-31, BR-34 | SCR-10, SCR-12 | TBD (Step 6) | exception_follow_up_links, invoice_corrections, exceptions, invoices | TBD (Step 7) | Should |
| US-21 | UC-21 | AC-21.1–AC-21.9 | BR-08, BR-12, BR-34, BR-37 | SCR-12, SCR-16, SCR-40 | TBD (Step 6) | tax_risk_entries, tax_risk_decisions, exceptions, exception_reasons | TBD (Step 7) | Must |
| US-22 | UC-22 | Removed (D-33) | Removed (D-33), now Advanced W-20 | Removed (D-33) | — | — | — | Removed (D-33) |
| US-23 | UC-23 | AC-23.1–AC-23.13 | BR-02, BR-03, BR-09, BR-10, BR-30, BR-34, BR-35, BR-36, BR-37 | SCR-12, SCR-18, SCR-40 | TBD (Step 6) | individual_approvals, approval_tiers, exceptions, batch_items, service_acceptances, batch_sample_items, users, erp_users | TBD (Step 7) | Must |
| US-24 | UC-24 | AC-24.1–AC-24.17 | BR-05, BR-06, BR-07, BR-09, BR-14, BR-30, BR-35, BR-37 | SCR-12, SCR-30, SCR-31, SCR-32, SCR-33, SCR-34 | TBD (Step 6) | payment_batches, batch_items, batch_sample_items, sample_expansions, batch_reopenings, payment_requests, payment_request_lines, entity_policies, ai_requests | TBD (Step 7) | Must |
| US-25 | UC-25 | AC-25.1–AC-25.17 | BR-02, BR-03, BR-09, BR-12, BR-20, BR-30, BR-35, BR-36, BR-37 | SCR-50, SCR-51, SCR-52, SCR-53, SCR-54 | TBD (Step 6) | payment_requests, payment_request_lines, request_signatures, signing_delegations, ai_payment_summaries, approval_tiers, approval_tier_approvers, service_acceptances, batch_sample_items, exceptions | TBD (Step 7) | Must |
| US-26 | UC-26 | AC-26.1–AC-26.14 | BR-09, BR-12, BR-20, BR-25, BR-33, BR-35, BR-37 | SCR-12, SCR-30, SCR-50, SCR-51, SCR-57 | TBD (Step 6) | erp_send_attempts, payment_requests, payment_batches, payment_request_lines, invoices | TBD (Step 7) | Must |
| US-27 | UC-27 | AC-27.1–AC-27.9 | BR-05, BR-07, BR-09, BR-23 | SCR-60 | TBD (Step 6) | invoices, exceptions, batch_items, batch_sample_items, payment_batches, gate_comparisons | TBD (Step 7) | Should |
| US-28 | UC-28 | AC-28.1–AC-28.7 | BR-06, BR-09, BR-12 | SCR-61 | TBD (Step 6) | audit_log | TBD (Step 7) | Should |
| US-29 | UC-29 | AC-29.1–AC-29.9 | BR-02, BR-09, BR-12, BR-14, BR-17, BR-19, BR-33, BR-37 | SCR-22, SCR-23 | TBD (Step 6) | service_acceptances, invoices, erp_purchase_orders, erp_receipts, invoice_receipts, invoice_check_runs, exceptions, exception_reasons, users, erp_users, audit_log | TBD (Step 7) | Should |
| US-30 | UC-30 | AC-30.1–AC-30.11 | BR-02, BR-03, BR-09, BR-12, BR-20, BR-36, BR-37, BR-38 | SCR-12, SCR-50, SCR-51, SCR-52, SCR-55, SCR-56 | TBD (Step 6) | signing_delegations, request_signatures, payment_requests, approval_tiers, approval_tier_approvers, users, audit_log | TBD (Step 7) | Should |
| US-31 | UC-31 | AC-31.1–AC-31.9 | BR-01, BR-09, BR-11, BR-12, BR-17, BR-33 | SCR-10, SCR-24 | TBD (Step 6) | mailbox_fetch_runs, mailbox_messages, mailbox_attachments, invoices, invoice_documents, audit_log | TBD (Step 7) | Should |
| US-32 | UC-32 | AC-32.1–AC-32.10 | BR-09, BR-12, BR-26, BR-34, BR-35 | SCR-62 | TBD (Step 6) | notifications, users, exceptions, payment_batches, payment_requests, correction_requests | TBD (Step 7) | Should |

## Module traceability

Links the MVP modules of [MVP scope](../01-research/05-scope.md) to the use cases and stories that deliver them.

| Module | Use Cases | Stories |
|---|---|---|
| M-01 Access and roles | UC-01, UC-02 | US-01, US-02 |
| M-02 Group and entity configuration | UC-03, UC-04, UC-05 | US-03, US-04, US-05 |
| M-03 Source data sync and recurring profiles | UC-07, UC-09, UC-29 | US-07, US-09, US-29 |
| M-04 ERP simulator (demo only) | UC-08 | US-08 |
| M-05 Invoice intake (XML only, D-33; also by email, D-92) | UC-10, UC-31 | US-10, US-31 |
| M-06 AI document understanding | UC-12, UC-13, UC-14, UC-15 (and the AI parts of UC-19, UC-24, UC-25) | US-12, US-13, US-14, US-15 |
| M-07 Rule Engine and automation gates | UC-06, UC-16 | US-06, US-16 |
| M-08 Exception handling | UC-17, UC-18, UC-19, UC-20, UC-21, UC-23 | US-17, US-18, US-19, US-20, US-21, US-23 |
| M-09 Payment batch and signing | UC-24, UC-25, UC-26, UC-30 | US-24, US-25, US-26, US-30 |
| M-10 Oversight and audit | UC-27, UC-28, UC-32 | US-27, US-28, US-32 |

## Goal traceability

Links the measurable goals of [Goals and success metrics](../01-research/02-goals-and-metrics.md) to the stories and criteria that deliver or measure them. G-03, G-04, and G-06 have no user feature that measures them: they are measured on the named evaluation sets and the permissions test suite defined in [Acceptance criteria](../02-usecases-userstories/04-acceptance-criteria.md#evaluation-sets-and-test-suites). G-05 and G-07 are measured on the stored decision records.

| Goal | Delivered by | Measured by |
|---|---|---|
| G-01 Touchless rate | US-06, US-12, US-13, US-14, US-15, US-16 | US-27 (AC-27.1, AC-27.2); labelled invoice set ES-04 |
| G-02 AI misplacement rate | US-06, US-16, US-24 | US-27 (AC-27.2, AC-27.4); AC-24.4; labelled invoice set ES-04 |
| G-03 Split orders caught | US-15 (AC-15.4) | Evaluation set ES-01 (AC-15.10) |
| G-04 Duplicates caught | US-10, US-15 (AC-10.7, AC-15.2, AC-15.3) | Evaluation set ES-02 (AC-15.10) |
| G-05 AI processing time | US-16 | AC-16.12 on ES-04 |
| G-06 No data leaks between entities | US-01 and the entity-scope criteria of every story | Permissions test suite TS-01 (AC-01.5, AC-17.5) |
| G-07 Lines matched without an LLM call | US-14, US-18 | AC-14.7 on evaluation set ES-03; the method recorded in the audit log (US-28) |

## Problem traceability

Links the problems of [Context and problem](../01-research/01-context-and-problem.md) to the goals, the MVP modules, and the stories that address them.

| Problem | Goals | Modules | Stories |
|---|---|---|---|
| P-01 Manual matching of invoice, order, and receipt | G-01, G-02, G-05 | M-03, M-04, M-05, M-06, M-07 | US-07, US-08, US-10, US-12, US-13, US-14, US-16 |
| P-02 Item names and units differ | G-02, G-07 | M-06, M-08 | US-14, US-18 |
| P-03 Risky suppliers and wrong buying entity | G-02, G-03, G-04, G-06 | M-05, M-06, M-07, M-08 | US-10, US-13, US-15, US-16, US-21, US-23 |
| P-04 Approval by email and chat with no approval matrix | G-01, G-02, G-06 | M-01, M-02, M-09, M-10 | US-01, US-02, US-04, US-05, US-06, US-24, US-25, US-26, US-27, US-28 |

## Advanced items and the rules they carry

A rule that is entirely Advanced has no MVP story. It is carried by its item in the [MoSCoW prioritization](../02-usecases-userstories/05-moscow-prioritization.md#wont-this-release), and the Advanced part of a rule that spans both is listed here.

| Item | Rule | Part |
|---|---|---|
| W-01 | BR-06 | Automatic gate opening and closing |
| W-13 | BR-39 | The real connection point for the invoice status (the simulated lookup is MVP, D-93) |
| W-03 | BR-17 | Medium-trust PDF invoices |
| W-04 | BR-22 | Entire rule (subscriptions charged to a card) |
| W-09 | BR-18 | Entire rule (PDF and XML of the same invoice); builds on W-19 |
| W-07 | BR-09 | Comparison across entities |
| W-19 | BR-17, BR-18 | PDF intake (the PDF part of BR-17); BR-18 entire rule; foreign invoices (D-33) |
| W-20 | BR-21 | Entire rule (foreign tax duties, D-33) |
| W-21 | BR-32 | Entire rule (cash payment flag and payment method, D-33) |

## Decision traceability

Links the decisions of Step 1 that shape the use cases to the rules and criteria that apply them. The full table is in [Decisions and defaults](../02-usecases-userstories/00-decisions.md#how-the-step-1-decisions-appear-in-step-2).

| Decision | Rules | Stories |
|---|---|---|
| D-06 Automation gate | BR-06 | US-06, US-16, US-18 |
| D-07 Follow-up invoices | BR-26, BR-31 | US-18, US-20 |
| D-08 The Rule Engine admits | BR-05, BR-17, BR-27 | US-16 |
| D-09 Duplicates across the group | BR-09, BR-11 | US-10, US-15 |
| D-10 One open batch per period | BR-35 | US-17, US-24 |
| D-11 No bank in the MVP | BR-35 | US-26 |
| D-24 Signed non-coded XML | BR-17, BR-24 | US-03, US-10, US-16 |
| D-25 Non-cash payment (Removed, D-33) | BR-32, Advanced W-21 | none |
| D-26 BR-01 keys on the tax code | BR-01, BR-31 | US-10, US-13, US-19 |
| D-33 Foreign invoices and the cash flag moved to Advanced (user decision) | BR-17, BR-18, BR-21, BR-32 | US-10, US-12, US-16, US-26 |
| D-88 Sync to the feature mind map (user decision) | BR-36, BR-38, BR-39 and the rules named by D-89..D-98 | US-29..US-32 and the stories named below |
| D-89 Block signing invoices you processed (call) | BR-36 | US-23, US-25 |
| D-90 Requesting Department and service acceptance (call) | BR-02, BR-14, BR-17, BR-19 | US-29, US-13 |
| D-91 Signing delegation (call) | BR-38 | US-30 |
| D-92 Email intake (call) | BR-17 | US-31 |
| D-93 Simulated invoice status at the tax authority (call) | BR-39 | US-07, US-10 |
| D-94 Cancelled invoices (call) | BR-31, BR-33, BR-35 | US-18 |
| D-95 Sample failure handling (call) | BR-07, BR-35 | US-24 |
| D-96 Manual resend to the ERP (call) | BR-35 | US-26 |
| D-97 Notifications and reminders (call) | BR-26, BR-34, BR-35 | US-32 |
| D-98 Search and drill-down (call) | BR-09, BR-12 | US-17 |

**Related:** [Research](../01-research/README.md) · [Use cases and user stories](../02-usecases-userstories/README.md) · [Information architecture](../03-information-architecture/README.md) · [Business rules](../requirements/business-rules.md)
