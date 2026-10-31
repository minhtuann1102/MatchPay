# Screen Inventory

> Design status: MVP — Step 3 of 9, approved
>
> Implementation status: NOT STARTED

The inventory lists 37 screen numbers, of which SCR-13 and SCR-17 are removed (D-33) and not reused, so **35 screens are active: 18 pages (including the system page SCR-90) and 17 modals**. Screen IDs are numbered by area (access 01 and 90, invoices 10s, recurring profiles 20s, batch 30s, decisions 40, signing 50s, oversight 60s, entity administration 70 to 74, group administration 75 to 79, demo 80s). A new screen takes the next free number in its range (DF-38). "Opened from" says where a user gets in: `Navigation` means the sidebar or the login redirect, and `SCR-nn` means the parent page that has the button or link. A modal is always opened from a page, never from another modal. A removed screen keeps its row, reads "Removed (D-33)", and has no route, no card in the sitemap, no permission row, and no place in any flow.

## Screen inventory

| Screen ID | Screen | Presentation | Roles | Opened from | Main content | Related stories |
|---|---|---|---|---|---|---|
| `SCR-01` | Login | Page | All roles (public) | Navigation | Email, password, Log in. Errors: "Email or password is incorrect" and "Your account is deactivated. Please contact your administrator." After a session ends the page shows a short message. A user who is logged in and opens it goes to the role home page. | US-01 |
| `SCR-90` | Access denied | System page | All roles | Navigation | The message "Access denied" and a link back to the home page of the role. Shown when a URL is opened without permission or with the identifier of another entity (AC-01.5, AC-01.6). It never reveals whether the record exists. | US-01 |
| `SCR-10` | Invoice Worklist | Page | AP Accountant (full), Chief Accountant and Payment Approver (read-only) | Navigation | Invoices of the own entity: number, supplier, flow, total, due date with a "Due soon" mark, state chip. Filters: state, supplier, flow, date, and "Reminder due" for correction requests with no reply after 5 working days. Badge of open exceptions. Last ERP sync time, with a stale warning when the last sync failed. AP Accountant only: Upload XML. Empty state, and "no results" with Clear filters. Chief Accountant and Payment Approver see no upload button. | US-07, US-10, US-12, US-13, US-16, US-17, US-18, US-19, US-20 |
| `SCR-11` | Upload XML Invoices | Modal on SCR-10 | AP Accountant | SCR-10 | Choose one or many XML files and upload. A result list shows each file as Accepted or Rejected with the reason, for example "XML signature check failed", "An invoice with this seller, series, and number already exists", or, for a PDF, an image, or any other file that is not XML, "Only XML e-invoices are accepted in the MVP" (AC-10.8). No invoice is created from a rejected file. A failing file never stops the others. Close returns to SCR-10 with the new rows. | US-10 |
| `SCR-12` | Invoice Detail and Evidence | Page | AP Accountant (full), Chief Accountant and Payment Approver (read-only evidence) | SCR-10, SCR-40, SCR-51 | Original document, matched order and receipt with their sync time, flow with reason and confidence, line matches with method and probability, anomaly numbers, each of the six BR-05 conditions with its value, exception reasons and state, decision history with who or what decided, payment request and signature records, the payment reference once paid, and for an unsupported foreign invoice the exception "Unsupported: foreign invoice", whose only resolution is Reject (SCR-15; AC-12.9, D-31), and for a reported wrong entity the traced mismatch and the exception reason "Wrong buyer tax code" or "Wrong entity reported" (AC-18.11, AC-18.12). AI text is labelled as AI. Duplicates in another entity show only that one exists. Role-dependent action panel that appears only when the invoice awaits that role: AP Accountant confirms a line match, corrects the flow, reports a wrong entity (the invoice never moves to another entity: the page traces the mismatch and the exception follows the wrong-invoice path, D-68), requests a correction (SCR-14), rejects (SCR-15), withdraws from the batch with a reason, or sends for a decision; Chief Accountant decides a tax-risk hold (SCR-16); Payment Approver approves individually (SCR-18). | US-07, US-12, US-13, US-14, US-15, US-16, US-17, US-18, US-19, US-20, US-21, US-23, US-24, US-26 |
| `SCR-13` | Removed (D-33) | Removed (D-33) | — | — | The page "Confirm Foreign PDF Fields" belonged to US-11, which D-33 moved to Advanced (W-19). The number is not reused. | — |
| `SCR-14` | Correction Request Draft | Modal on SCR-12 | AP Accountant | SCR-12 | Request type (correction request, data-fix notice, reissue request), recipient, AI draft from an approved template labelled as AI, editable text, Send. A blank template when the AI is unavailable. Status "Not sent" with a retry when the email fails. Nothing is sent until Send is pressed. | US-19 |
| `SCR-15` | Reject Invoice | Modal on SCR-12 | AP Accountant | SCR-12 | Invoice number, a required reason, Reject and Cancel. Saving without a reason is refused. The invoice becomes Rejected and the exception closes with the outcome Rejected. It is the only resolution of an "Unsupported: foreign invoice" exception (AC-12.9). | US-12, US-18 |
| `SCR-16` | Tax-Risk Hold Decision | Modal on SCR-12 | Chief Accountant | SCR-12 | The tax-risk list entry with its source and date, the amount, a note that the VAT deduction may be at risk, Release or Reject, and a required reason. The decision, the person, and the time go to the audit log. | US-07, US-21 |
| `SCR-17` | Removed (D-33) | Removed (D-33) | — | — | The modal "Foreign Tax Outcome" belonged to US-22, which D-33 moved to Advanced (W-20). The number is not reused. | — |
| `SCR-18` | Approve Exception Individually | Modal on SCR-12 | Payment Approver | SCR-12 | Evidence summary, amount, and the approval level it needs. Approve, or Decline with a required reason. Approving is blocked with "You created the order for this invoice" when the approver is linked to the order creator or receipt confirmer. Not offered for the categories that cannot be approved individually (D-31). A split-order exception needs the level of the combined amount. | US-23 |
| `SCR-20` | Recurring Profiles | Page | AP Accountant | Navigation | Profiles of the own entity: supplier, location, contract, period, fixed or usage-based price, deviation threshold, status. Each profile shows the amounts of earlier periods and their average. Add profile, Edit, Deactivate (with a note that later invoices become exceptions). Empty state. | US-09 |
| `SCR-21` | Recurring Profile Form | Modal on SCR-20 | AP Accountant | SCR-20 | Supplier, location, contract, period, price type, contract price (required for a fixed price), deviation threshold (example 30%). Errors for a missing contract price and for a second active profile of the same supplier, location, and period. | US-09 |
| `SCR-30` | Batch Review | Page | AP Accountant | Navigation | The open batch of the period with its state chip, invoices with due dates and a Withdraw link to SCR-12, and Close for review (SCR-31). After closing: the AI-selected sample, each item with why it was selected and OK or Error marks (an Error needs a reason and withdraws the invoice into exceptions), the label "selected without AI" when the AI could not select, and the number still to mark. Release for signing (SCR-32) stays disabled until every sample item is marked, and with the text "No invoices in this batch" when the batch is empty. After release: the payment requests with state, total, and required level, and the ERP send status (Sending, Retry n of 3, Failed with an alert, Paid) with the payment reference. | US-16, US-24, US-26 |
| `SCR-31` | Close Batch | Modal on SCR-30 | AP Accountant | SCR-30 | Period, number of invoices, sample size that will be drawn, and a note that invoices admitted afterwards go to the next period. Close for review and Cancel. A stale view shows the reload message (BR-37). | US-24 |
| `SCR-32` | Release Batch | Modal on SCR-30 | AP Accountant | SCR-30 | Number of invoices, confirmation that every sample item is marked, number of payment requests that will be created (by supplier or per invoice, as the entity policy sets), total. Release for signing and Cancel. A stale view shows the reload message (BR-37). | US-24 |
| `SCR-40` | Decision Queue | Page | Chief Accountant, Payment Approver | Navigation | One list, different content by role. Chief Accountant: tax-risk holds awaiting a decision. Payment Approver: exceptions awaiting individual approval at the approver level. Each row shows supplier, invoice, amount, reason, age, and opens SCR-12. Filter by kind, empty state. Rows the user cannot decide are not listed. | US-21, US-23 |
| `SCR-50` | Signing Queue | Page | Chief Accountant, Payment Approver | Navigation | Payment requests of the own entity: number, supplier, total, required level, state chip, flags for a new supplier or a changed bank account, signatures so far, ERP status once signed. Select many requests and sign them in one action (SCR-52). The Payment Approver action is disabled until the Chief Accountant has signed, with a hint. After signing the page stays and shows one result per request. Filter by state, empty state. | US-25, US-26 |
| `SCR-51` | Payment Request Detail | Page | Chief Accountant, Payment Approver | SCR-50 | AI summary labelled as AI, and a message when the summary is unavailable (signing continues on the evidence). Totals by entity and supplier, invoices of VND 50,000,000 or more, the sample-check result, flags for a new supplier or a changed bank account, required level, signature records. Lines with links to SCR-12, Remove line (SCR-53), Decline request (SCR-54), Sign (SCR-52). After the ERP replies: paid status and payment reference. | US-25, US-26 |
| `SCR-52` | Sign with Re-authentication | Modal on SCR-50, SCR-51 | Chief Accountant, Payment Approver | SCR-50, SCR-51 | Count of requests and their total, password entry again, Sign and Cancel. A wrong password keeps the modal open. The result is one line per request, including the ones that were refused (outdated view, level, conflict of duty). | US-25 |
| `SCR-53` | Remove Line | Modal on SCR-51 | Chief Accountant, Payment Approver | SCR-51 | Invoice, required reason, new request total and required level, a warning that earlier signatures are voided and the level may change. The invoice returns to exceptions. Removing the last line cancels the request. | US-25 |
| `SCR-54` | Decline Request | Modal on SCR-51 | Chief Accountant, Payment Approver | SCR-51 | Request number, total, required reason. Declining cancels the request and returns all its invoices to exceptions. | US-25 |
| `SCR-60` | Dashboard | Page | All finance roles and Entity Admin (own entity), Group Admin (per-entity aggregates) | Navigation | Period (default the current month). Touchless rate with its counts and formula, and the AI misplacement rate beside it with the note that the sample is weighted by risk; touchless rate marked "not valid" above 1% misplacement. Exception backlog by state and by age (0 to 2 days, 3 to 7 days, over 7 days). Waiting for Goods as a separate count. Every figure opens a list with the same count. Group Admin: counts and rates for each entity, no invoice data. Empty state. | US-27 |
| `SCR-61` | Audit Log | Page | Chief Accountant (own entity), Entity Admin (own entity), Group Admin (group events only) | Navigation | Read-only list of entries: AI decisions (time, document, task, method, result, reason, confidence, model version, prompt version), Rule Engine decisions with conditions, decisions by people, signatures, configuration changes, gate changes. Filters: date, document, event type, user. No edit or delete action exists. Group Admin sees entities, limits, gates, and user events only. | US-28 |
| `SCR-70` | Users | Page | Entity Admin (own entity), Group Admin (all entities) | Navigation | Users with name, email, role, entity, ERP user link, status. Group Admin has an entity filter. Create user and Edit (SCR-71), Deactivate (SCR-72). On the own row, role change and deactivation are not offered (AC-02.8). Entity Admin sees only the own entity. | US-02 |
| `SCR-71` | User Form | Modal on SCR-70 | Entity Admin, Group Admin | SCR-70 | Name, unique email, role, entity, initial password of at least 8 characters (on create), ERP user link. Entity Admin can choose only AP Accountant, Chief Accountant, or Payment Approver and only the own entity. Errors: "Email already in use" and "A user has one role in one entity in the MVP". | US-02 |
| `SCR-72` | Deactivate User | Modal on SCR-70 | Entity Admin, Group Admin | SCR-70 | User name and a statement of the effect: the user cannot log in, open sessions end on the next request, earlier decisions and signatures stay unchanged. Deactivate and Cancel. | US-02 |
| `SCR-73` | Entity Policy | Page | Entity Admin | Navigation | Price tolerance, batch threshold, sample rate, and grouping mode (by supplier or per invoice). The group maximum is shown next to each field, and an error such as "Maximum allowed by the group: 5%" appears when it is exceeded. A sample rate must be between 1% and 100%. Note that new values apply to invoices checked afterwards. Save. | US-04 |
| `SCR-74` | Approval Matrix | Page | Entity Admin | Navigation | Amount tiers with the approval level of each (Department Head, CFO) and the Payment Approvers assigned to each level. Errors list the amounts left uncovered by a gap or overlap, and "No approver for VND 50,000,000 and over" when a tier has no active approver. Note that requests not yet signed are recomputed. Save. | US-05 |
| `SCR-75` | Group Overview | Page | Group Admin | Navigation | Entities with their numbers of open and closed gates, gate alerts (BR-06), and the last ERP sync per entity with a failure marker. Links to SCR-78 and SCR-70. Counts only, no invoice data. Built from US-06 and US-07, so it stays when US-03 is cut. | US-06, US-07 |
| `SCR-76` | Entities and Group Limits | Page | Group Admin | Navigation | Entity list with name and tax code, Add entity (SCR-77), group maximums for price tolerance and batch threshold, and the list of sectors allowed to issue non-coded invoices (default: electricity). Lowering a maximum below an entity value shows that the value will be lowered. | US-03 |
| `SCR-77` | Entity Form | Modal on SCR-76 | Group Admin | SCR-76 | Entity name and a unique 10-digit tax code. Errors for a duplicate or invalid tax code. | US-03 |
| `SCR-78` | Automation Gates | Page | Group Admin | Navigation | For each supplier and entity pair: gate state, compared invoices, accuracy next to the 98% threshold, alert after sample errors, and the label "Simulated history" for seeded history. Open or Close (SCR-79). Counts and accuracy only, no invoice contents. | US-06 |
| `SCR-79` | Open or Close Gate | Modal on SCR-78 | Group Admin | SCR-78 | Pair, state, compared invoices, accuracy. Open is disabled below 50 compared invoices ("At least 50 compared invoices are needed"). Opening below the threshold needs a written reason. The "Simulated history" label shows when the figures come from seeded data. Close needs confirmation only. | US-06 |
| `SCR-80` | ERP Simulator | Page | Demo Operator | Navigation | Banner "Demo only". Entity selector and persona selector (buyer, warehouse keeper, acceptor). Lists of purchase orders (number, supplier, outstanding quantity) and of receipts and acceptances. New order (SCR-81) and Confirm receipt or acceptance on an order row (SCR-82). Data of one entity is not visible in another. | US-08 |
| `SCR-81` | Purchase Order Form | Modal on SCR-80 | Demo Operator | SCR-80 | Supplier, order lines with item, quantity, and price, goods or service. The creator is the persona chosen on SCR-80. Marked "Demo only". | US-08 |
| `SCR-82` | Receipt or Acceptance Form | Modal on SCR-80 | Demo Operator | SCR-80 | Order reference (required), received quantities, a short delivery note ("60 of 100 received, 40 outstanding"). No field takes data from an invoice. Errors for a missing order and for the same persona as the order creator ("The receipt must be confirmed by a different person than the order creator"). Marked "Demo only". | US-08 |

## Requirement-to-screen mapping

One row per story; US-11 and US-22 read "Removed (D-33)". Eight stories describe system behaviour and have no screen of their own (DF-35). Their row names the screens where the result can be seen, and those screens list the story in their "Related stories".

| Requirement | Screens and actions |
|---|---|
| US-01 | `SCR-01` submit login -> role home page (DF-28); Log out in the top bar -> SCR-01; `SCR-90` denied URLs and other entities' identifiers |
| US-02 | `SCR-70` list, filter, find users; `SCR-71` create, edit role, entity, ERP link; `SCR-72` deactivate |
| US-03 | `SCR-76` entity list, group limits, non-coded sectors; `SCR-77` add entity |
| US-04 | `SCR-73` set tolerance, batch threshold, sample rate, grouping mode inside the group limits |
| US-05 | `SCR-74` set tiers, levels, approvers |
| US-06 | `SCR-78` pair accuracy and state, alerts; `SCR-79` open or close a gate; `SCR-75` gate counts and alerts per entity |
| US-07 | No screen of its own (system behaviour). Results are visible on `SCR-10` last ERP sync time and stale warning (no screen of its own); `SCR-12` order and receipt with their sync time; `SCR-16` tax-risk list entry with source and date; `SCR-75` last sync per entity and failure |
| US-08 | `SCR-80` choose entity and persona; lists of orders and receipts; `SCR-81` create a purchase order; `SCR-82` confirm a receipt or acceptance |
| US-09 | `SCR-20` list, earlier-period amounts, deactivate; `SCR-21` create or edit a profile |
| US-10 | `SCR-10` Upload XML button; `SCR-11` per-file result, including the rejection of a file that is not XML (AC-10.8) |
| US-11 | Removed (D-33) |
| US-12 | No screen of its own (system behaviour). Results are visible on `SCR-10` flow column and filter, Separated list (no screen of its own); `SCR-12` flow with reason and confidence, and the exception "Unsupported: foreign invoice" that only `SCR-15` Reject resolves (AC-12.9) |
| US-13 | No screen of its own (system behaviour). Results are visible on `SCR-10` Waiting for Goods and exception states (no screen of its own); `SCR-12` entity, order or profile, receipt evidence |
| US-14 | No screen of its own (system behaviour). Results are visible on `SCR-12` line matches with method and probability (no screen of its own) |
| US-15 | No screen of its own (system behaviour). Results are visible on `SCR-12` anomaly numbers and findings (no screen of its own) |
| US-16 | No screen of its own (system behaviour). Results are visible on `SCR-10` state and reasons per invoice (no screen of its own); `SCR-12` the six conditions with their values; `SCR-30` invoices admitted to the open batch |
| US-17 | `SCR-10` list and filter; `SCR-12` read the evidence |
| US-18 | `SCR-10` exception filter and badge; `SCR-12` resolve panel: confirm, correct, send for a decision; `SCR-15` reject with a reason |
| US-19 | `SCR-10` Reminder due filter; `SCR-12` Request correction button; `SCR-14` AI draft, edit, Send |
| US-20 | No screen of its own (system behaviour). Results are visible on `SCR-10` follow-up marker (no screen of its own); `SCR-12` linked follow-up and the closing outcome in the history |
| US-21 | `SCR-40` tax-risk holds awaiting a decision; `SCR-12` evidence; `SCR-16` release or reject with a reason |
| US-22 | Removed (D-33) |
| US-23 | `SCR-40` exceptions awaiting approval at the approver level; `SCR-12` evidence; `SCR-18` approve or decline |
| US-24 | `SCR-30` close, sample, marks, release; `SCR-12` withdraw an invoice with a reason; `SCR-31` close for review; `SCR-32` release for signing |
| US-25 | `SCR-50` select many requests, sign in one action; `SCR-51` summary, evidence, remove line, decline; `SCR-52` re-authentication and sign; `SCR-53` remove a line; `SCR-54` decline a request |
| US-26 | No screen of its own (system behaviour). Results are visible on `SCR-30` send status and failure alert for the AP Accountant (no screen of its own); `SCR-50` ERP status per request; `SCR-51` paid status and payment reference; `SCR-12` Paid state and payment reference on the invoice |
| US-27 | `SCR-60` dashboard (scope by role) |
| US-28 | `SCR-61` filter and read entries |

## Reachability of Must stories

Every Must story is reachable through at least one screen that a Must story also uses, so cutting a Should story never leaves a Must story without a way in (lesson from Step 2). The checker walks the "Opened from" chain of the screens of each Must story and fails when a chain passes only through screens used by Should stories alone. The Group Overview (SCR-75) is built from US-06 and US-07, both Must, so the Group Admin home page survives when US-03 is cut. The Dashboard (SCR-60) is US-27, a Should, so no home page and no Must screen depends on it.

The table lists the screens that disappear when one Should story is cut. US-11 and US-22 are no longer in it, because D-33 removed them from the MVP. A screen disappears only when no other story uses it.

| Story cut | Screens that disappear | Effect |
|---|---|---|
| US-03 | SCR-76, SCR-77 | The "Entities and limits" sidebar item goes. Entities, group limits, and the sector list come from the seed data (DF-13, DF-25). |
| US-09 | SCR-20, SCR-21 | The "Recurring profiles" sidebar item goes. Every recurring invoice becomes an exception. |
| US-19 | SCR-14 | The AP Accountant writes requests outside the system. The Reminder due filter on SCR-10 and the Request correction button on SCR-12 go too. |
| US-20 | None | The follow-up marker and history entries disappear from SCR-10 and SCR-12 only. |
| US-27 | SCR-60 | The "Dashboard" sidebar item goes for every role. |
| US-28 | SCR-61 | The "Audit log" sidebar item goes for all three roles that have it. |

## Screen-to-API mapping

Filled in by Step 6 (OpenAPI).

| Screen | API operations |
|---|---|
| SCR-01, SCR-90 | TBD (Step 6) |
| SCR-10, SCR-11, SCR-12 | TBD (Step 6) |
| SCR-14, SCR-15, SCR-16, SCR-18 | TBD (Step 6) |
| SCR-20, SCR-21 | TBD (Step 6) |
| SCR-30, SCR-31, SCR-32 | TBD (Step 6) |
| SCR-40 | TBD (Step 6) |
| SCR-50, SCR-51, SCR-52, SCR-53, SCR-54 | TBD (Step 6) |
| SCR-60, SCR-61 | TBD (Step 6) |
| SCR-70, SCR-71, SCR-72 | TBD (Step 6) |
| SCR-73, SCR-74 | TBD (Step 6) |
| SCR-75, SCR-76, SCR-77, SCR-78, SCR-79 | TBD (Step 6) |
| SCR-80, SCR-81, SCR-82 | TBD (Step 6) |

**Related:** [Step index](README.md) · [Sitemap](01-sitemap.md) · [Routes and permissions](02-routes-and-permissions.md) · [Master traceability](../traceability/master-traceability.md)
