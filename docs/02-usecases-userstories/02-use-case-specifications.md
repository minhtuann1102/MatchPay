# Use Case Specifications

> Design status: MVP — Step 2 of 9, draft for review
>
> Implementation status: NOT STARTED

Each use case has one story with the same number (US-nn is UC-nn). "Re-runs UC-16" means the Rule Engine checks the invoice again from the stored evidence. UC-11 and UC-22 were removed by D-33; their headings stay and their numbers are not reused. UC-29 to UC-32 were added by the sync to the feature mind map (D-88); their readings are calls awaiting user review (D-90, D-91, D-92, D-97).

## UC-01 Log In and Out

- **Actor:** all users
- **Preconditions:** an active account exists
- **Main flow:** enter email and password → system verifies the credentials and the account status → opens the home page of the role (DF-28) with the role's entity scope applied. Log out ends the session and shows the login page.
- **Alternative:** wrong credentials → one generic error; deactivated account → "account deactivated" message
- **Permission:** public for login; authenticated for logout
- **Result:** an authenticated session with a role and an entity scope; protected pages are no longer reachable after log out · **Stories:** US-01

## UC-02 Manage Users and Roles

- **Actor:** Administrator (Entity Admin for the own entity, Group Admin for all entities)
- **Preconditions:** logged in as Administrator
- **Main flow:** open Users → create a user (name, email, role, entity, initial password), change a role, link the user to an ERP user, or deactivate the user → confirm → saved and written to the audit log
- **Alternative:** duplicate email, a second role or entity for the same user (D-13), or an Entity Admin creating an admin role → rejected
- **Permission:** `ADMIN`; an Entity Admin only in the own entity and only for finance roles
- **Result:** every user has one role in one entity (DF-14); an ERP link lets separation of duties compare people (BR-02, BR-36) · **Stories:** US-02

## UC-03 Manage Entities and Group Limits

- **Actor:** Group Admin
- **Main flow:** add an entity (name, unique tax code) → set the group maximums for price tolerance and batch threshold (BR-16) → maintain the list of sectors allowed to issue non-coded invoices (DF-25)
- **Alternative:** duplicate tax code or an invalid number → error; lowering a maximum below an entity's value lowers that value
- **Permission:** Group Admin only
- **Result:** entities exist with default policy inside the limits · **Stories:** US-03

## UC-04 Configure Entity Policy

- **Actor:** Entity Admin
- **Main flow:** open the entity policy → set price tolerance, batch threshold, sample rate, and grouping mode (by supplier or per invoice) → save
- **Alternative:** a value above the group limit (BR-16) → rejected with the limit shown
- **Permission:** Entity Admin, own entity only
- **Result:** the new values apply to invoices checked after the change (BR-04, BR-07, BR-20) · **Stories:** US-04

## UC-05 Configure Approval Matrix

- **Actor:** Entity Admin
- **Main flow:** define amount tiers and the approval level of each tier (department head, CFO) → assign Payment Approvers to levels → save
- **Alternative:** gaps or overlaps between tiers, or a tier with no active approver → rejected
- **Permission:** Entity Admin, own entity only
- **Result:** the matrix decides the level of each payment request and individual approval (BR-03) · **Stories:** US-05

## UC-06 Manage Automation Gates

- **Actor:** Group Admin
- **Main flow:** open the gates → see for each supplier and entity pair the state, the invoices compared in shadow mode, and the accuracy next to the threshold → open or close a gate → written reason when opening below the threshold
- **Alternative:** fewer than 50 compared invoices → the gate cannot be opened (DF-16); an alert appears when sample checks of an open pair fail above the limit
- **Permission:** Group Admin only; sees counts and accuracy, not invoice contents (BR-09)
- **Result:** the state of the gate feeds condition 5 of BR-05; nothing opens or closes by itself (D-06) · **Stories:** US-06

## UC-07 Sync Source Data from ERP

- **Actor:** System; Entity ERP · **Re-runs:** UC-16 for invoices waiting for goods
- **Main flow:** on a schedule (DF-31) read purchase orders, goods receipts, service acceptances, suppliers, master data, and unit conversions from each entity's ERP, and load the simulated tax-risk list feed and the simulated tax-authority status feed → store each record with its entity code and sync time → re-check invoices that were waiting for goods or for a data fix, and refresh the authority status of invoices that are not yet sent (BR-39)
- **Alternative:** ERP unavailable → the sync fails, earlier data stays, and the last successful sync time is shown; a record that breaks BR-13, a risk-list entry with no source or date, or a status entry with no key, status, or date → rejected and logged; a status that turns to cancelled or replaced for an unsent invoice → the cancellation handling of BR-31 (UC-18)
- **Permission:** internal
- **Result:** current source data per entity; running it twice creates no duplicates (BR-25) · **Stories:** US-07

## UC-08 Create PO and Confirm Receipt in ERP Simulator

- **Actor:** Demo Operator (demo only)
- **Main flow:** choose an entity and a persona → create a purchase order, or confirm a receipt or acceptance against an order → saved in the simulated ERP, and picked up by the next sync
- **Alternative:** the same persona created the order and confirms the receipt → rejected (BR-02); a receipt with no order reference → rejected (BR-13); a short delivery keeps the order open (BR-15)
- **Permission:** Demo Operator only; the screens are marked "Demo only"
- **Result:** a closed demo loop from order to payment without a real ERP · **Stories:** US-08

## UC-09 Manage Recurring Profiles

- **Actor:** AP Accountant
- **Main flow:** create a profile (supplier, location, contract, period, fixed or usage-based price, deviation threshold) → save → the profile shows the amounts of earlier periods
- **Alternative:** a second active profile for the same supplier, location, and period → rejected; deactivated profile → later invoices find no match and become exceptions
- **Permission:** AP Accountant, own entity only
- **Result:** recurring invoices (electricity, rent, subscriptions) have an independent reference (BR-24, BR-17) · **Stories:** US-09

## UC-10 Upload XML Invoice

- **Actor:** AP Accountant; Invoice Status Lookup Service (simulated) · **Includes:** UC-12, UC-13, UC-14, UC-15, UC-16
- **Preconditions:** logged in as AP Accountant
- **Main flow:** choose one or more XML files → system stores each unchanged with a hash, checks the seller's signature and the schema version → looks up the invoice status at the simulated tax authority (BR-39) → sets the trust level (BR-17) → runs UC-12 to UC-16. The same checks run on every XML attachment that UC-31 fetches from the entity mailbox. The MVP accepts XML only: a PDF or any other non-XML file is rejected at upload with "Only XML e-invoices are accepted in the MVP" (BR-17, D-33)
- **Alternative:** failed signature or unsupported XML → `Rejected`; buyer tax code of another entity → `Rejected` with a reissue request offered (BR-01); exact duplicate in the group → `Rejected` without revealing the other entity (BR-09, BR-11); status "Cancelled" or "Replaced" at the tax authority → `Rejected` with the reason (BR-39); status lookup unavailable → exception "Authority status unavailable", intake not blocked (BR-39, DF-64); a PDF or other non-XML file → rejected at upload (BR-17)
- **Permission:** AP Accountant, own entity only
- **Result:** every file is processed on its own; a failing file never stops the others · **Stories:** US-10

## UC-11 Upload Foreign PDF and Confirm Fields

Removed (D-33). Moved to Advanced as W-19 (foreign invoices from PDF with field confirmation and multimodal reading). The number UC-11 is not reused.

## UC-12 Classify Invoice Flow

- **Actor:** AI Agent · **Included by:** UC-10
- **Main flow:** classify the invoice as goods with an order, services with an order, recurring, unsupported (foreign invoice), employee expense, or other document → store the flow with its reason and confidence → an employee expense is separated (BR-23)
- **Alternative:** unclear flow, or AI failure → exception; the invoice is never blocked at intake (DF-08). An "Unsupported: foreign invoice" becomes an exception that the AP Accountant can only reject with a reason (BR-17, D-33)
- **Permission:** internal
- **Result:** an invoice with no order is moved to the right flow and is not treated as an error · **Stories:** US-12

## UC-13 Read and Identify Invoice

- **Actor:** AI Agent · **Included by:** UC-10
- **Main flow:** read the XML invoice into the common document model → identify the entity from the buyer tax code, and the order or recurring profile → look up the receipt, or for a service the acceptance from the ERP or from the Requesting Department (UC-29) → store the evidence
- **Alternative:** buyer tax code missing → the AI proposes the entity from other fields and the AP Accountant confirms; no receipt, or for a service no acceptance from either source → `Waiting for Goods`; tax code of another entity → `Rejected`; AI failure → exception
- **Permission:** internal
- **Result:** the invoice has an entity, an order or profile, and a receipt, or a clear reason why not (BR-01, BR-14, BR-27) · **Stories:** US-13

## UC-14 Match Invoice Lines

- **Actor:** AI Agent · **Included by:** UC-10
- **Main flow:** for each line → look up the entity's mapping table → otherwise find candidates by embedding and compute the signal-fusion probability → call the LLM only for the lines still unsure → store the method, probability, and reason (BR-28)
- **Alternative:** probability below the threshold, an unknown unit, or an LLM failure → the line is doubtful and the invoice becomes an exception
- **Permission:** internal
- **Result:** every line matched with evidence or flagged; most lines matched without an LLM call (G-07) · **Stories:** US-14

## UC-15 Detect Anomalies

- **Actor:** AI Agent · **Included by:** UC-10
- **Main flow:** compare line prices with the entity's own history (BR-29); check exact and near duplicates (BR-11); detect split orders (BR-10); check recurring invoices against the profile (BR-24); check for a new supplier or a changed bank account (BR-30) → store each finding with its numbers
- **Alternative:** the check cannot run → the invoice becomes an exception, because a check that did not run is not a clean result; fewer than 3 purchases → the price check is skipped and recorded
- **Permission:** internal; uses only the entity's own history (BR-09)
- **Result:** anomalies explained in numbers; seeded cases measure G-03 and G-04 · **Stories:** US-15

## UC-16 Evaluate Batch Conditions and Route

- **Actor:** Rule Engine · **Included by:** UC-10 · **Re-run by:** UC-07, UC-18, UC-20, UC-21
- **Main flow:** read the stored evidence → evaluate the six conditions of BR-05 → admit the invoice to the open batch of its entity, or create an exception with every failed condition, or set `Waiting for Goods`, `Separated`, or `Rejected`
- **Alternative:** evidence missing because an AI step failed → exception; no open batch for the period → one is created (D-10)
- **Permission:** internal
- **Result:** every invoice has exactly one state and a recorded reason; 95% are decided within 60 seconds (G-05) · **Stories:** US-16

## UC-17 View Invoice Worklist and Evidence

- **Actor:** AP Accountant, Chief Accountant, Payment Approver
- **Main flow:** open the worklist → filter by state, supplier, flow, or date, or search all invoices of the entity by number, supplier, amount, or state (DF-68); due dates are shown → open an invoice, from the list, from a search result, or from a batch or a payment request → see the original, the matched order and receipt with their sync time, each line match with its method, the anomaly numbers, each condition with its value, the history of decisions, and the state history of the invoice (D-98)
- **Alternative:** nothing found → empty state
- **Permission:** own entity only; read-only for the Chief Accountant and the Payment Approver (BR-09)
- **Result:** every decision can be understood and audited (BR-12) · **Stories:** US-17

## UC-18 Resolve Exception

- **Actor:** AP Accountant · **Re-runs:** UC-16 · **May use:** UC-19
- **Main flow:** open an exception → read its reasons → confirm or correct a line match, or correct the flow; report a wrong entity (the invoice is never moved to another entity: the system traces where the mismatch comes from and the exception follows the wrong-invoice path, D-68); ask for a correction (UC-19); record a cancellation notice from the seller (BR-31, D-94); reject the invoice with a reason; or send it for a decision → the system re-runs UC-16
- **Alternative:** a legal adjustment or replacement invoice waits for the AP Accountant's confirmation (BR-31); a gate-closed exception records the person's decision beside the AI's proposal (BR-06); a reported wrong entity adds the reason "Wrong buyer tax code" or "Wrong entity reported" and is resolved only by a correction or reissue request (UC-19) or by a rejection, never by an individual approval (D-31, D-68); a change made from an outdated view is rejected (BR-37); an "Unsupported: foreign invoice" can only be rejected with a reason (BR-17, D-33); a cancellation notice withdraws the invoice from a batch that is not yet signed and rejects it, cancels a signed request that is not yet sent, and is only stored as a warning once the invoice is `Sent` (BR-31, D-94)
- **Permission:** AP Accountant, own entity only
- **Result:** a confirmed pair enters the entity's mapping table; the exception moves on (BR-34) · **Stories:** US-18

## UC-19 Send Correction Request or Data-Fix Notice

- **Actor:** AP Accountant; AI Agent drafts; Email Service
- **Main flow:** from an exception → the AI drafts a request to the supplier, or a data-fix notice to the responsible internal team, from an approved template → the AP Accountant edits and presses Send → the exception waits (BR-34) → a reminder appears after 5 working days, also as a notification (UC-32)
- **Alternative:** LLM failure → a blank template; Email Service failure → "Not sent" and a retry; the AI never sends (BR-26)
- **Permission:** AP Accountant, own entity only
- **Result:** the supplier or team is asked; a corrected invoice or new ERP data re-opens the check · **Stories:** US-19

## UC-20 Re-check Follow-up Invoice and Close Exception

- **Actor:** System · **Re-runs:** UC-16
- **Main flow:** a new invoice from the same supplier is linked to the open exception → UC-12 to UC-16 run on it → a fresh standard invoice that passes closes the exception and joins the batch; a legal adjustment or replacement invoice waits for the AP Accountant (D-07)
- **Alternative:** one adjustment invoice that corrects several invoices is linked to all their exceptions (one to many); the follow-up fails the checks → the exception stays open with the new reasons
- **Permission:** internal; links only within the same entity and supplier
- **Result:** the loop from request to closed exception needs no manual search (BR-26, BR-31) · **Stories:** US-20

## UC-21 Decide on Tax-Risk Hold

- **Actor:** Chief Accountant · **Re-runs:** UC-16
- **Main flow:** open a held invoice → see the list entry with its source and date and the invoice evidence → release (reason required) or reject (reason required)
- **Alternative:** a newly listed supplier's invoice that is in an unsigned batch is moved back to a hold (BR-08)
- **Permission:** Chief Accountant, own entity only
- **Result:** the invoice continues or is rejected; the system never rejects it by itself (BR-08) · **Stories:** US-21

## UC-22 Confirm Foreign Tax Obligations

Removed (D-33). Moved to Advanced as W-20 (foreign tax duties: foreign contractor tax outcome, customs declaration, and import-stage VAT documents). The number UC-22 is not reused.

## UC-23 Approve Exception Individually

- **Actor:** Payment Approver
- **Main flow:** open an exception awaiting approval at the approver's level → see the evidence → approve, or decline with a reason → an approved exception is recorded at once and its invoice is `In Batch`; when the batch is released, a single-invoice payment request is created and waits for the Chief Accountant's co-signature (DF-03, D-69)
- **Alternative:** only the categories of D-31 can be approved; split-order exceptions are linked, need the level of the combined amount, and are approved or declined all together in one action (BR-10, D-70); a conflict with the person who created the order or confirmed the receipt, or who processed the invoice, blocks the approval (BR-36, D-89)
- **Permission:** Payment Approver, own entity, own level only
- **Result:** the invoice is in the batch and awaits the Chief Accountant's co-signature · **Stories:** US-23

## UC-24 Review Batch and Perform Sample Check

- **Actor:** AP Accountant; AI Agent selects the sample
- **Main flow:** close the open batch for review → the AI selects the sample by risk → mark each selected invoice OK or Error → release the batch for signing → payment requests are created per supplier (or per invoice)
- **Alternative:** an Error withdraws the invoice into exceptions, and the AP Accountant can expand the sample (at least the original sample size again, by risk, DF-65) or, while no request is signed, reopen the batch `In Signing` back to review (BR-35 B7, DF-66, D-95); the AI cannot select → the highest-value invoices are taken (DF-29); the batch cannot be released until every selected invoice is marked
- **Permission:** AP Accountant, own entity only
- **Result:** a reviewed batch and payment requests ready to sign (BR-07, BR-35) · **Stories:** US-24

## UC-25 Sign Payment Requests

- **Actor:** Chief Accountant, Payment Approver; AI Agent summarises · **Includes:** UC-26
- **Main flow:** open the signing queue → see the AI summary, totals by entity and supplier, large invoices, the sample result, and flags → the Chief Accountant selects requests and signs in one action → the Payment Approver at the required level does the same → each request becomes `Signed`
- **Alternative:** remove lines before signing (earlier signatures are voided); decline a request with a reason; a conflict with the order creator, the receipt confirmer, or the person who processed an invoice in the request blocks the signer (BR-36, D-89); a delegate signs with the delegator's level and the record says "on behalf of" (UC-30); a change made from an outdated view is rejected (BR-37); the AI summary is unavailable → signing continues with the evidence
- **Permission:** Chief Accountant and Payment Approver of the entity; the Administrator, the AP Accountant, and the Requesting Department cannot sign, except that a delegate named in UC-30 signs only in the range of the delegation
- **Result:** one signature record per request (O-15); every invoice traces to its signatures (BR-20, BR-36) · **Stories:** US-25

## UC-26 Send Signed Batch to ERP

- **Actor:** System; Entity ERP; AP Accountant or Chief Accountant for a manual resend · **Included by:** UC-25
- **Main flow:** when a request is `Signed`, send it to the entity's ERP as a non-cash transfer instruction (a signed batch is a non-cash transfer by design, D-11) → receive the paid status with the payment document reference → store it → set the invoices to `Paid`
- **Alternative:** ERP unavailable → 3 attempts, then an alert (DF-24), and the AP Accountant or the Chief Accountant can resend the same signed request with the same request number as idempotency key and no new signature (DF-66, D-96); ERP returns a failure → the invoices become exceptions and no resend is offered
- **Permission:** internal; the manual resend is for the AP Accountant and the Chief Accountant of the own entity
- **Result:** invoices paid in the ERP, each with its payment document reference; the batch becomes `Completed` when every request is paid (D-11). The payment method and a cash flag are Advanced (W-21, D-33) · **Stories:** US-26

## UC-27 View Dashboard

- **Actor:** AP Accountant, Chief Accountant, Payment Approver, Administrator
- **Main flow:** open the dashboard → choose a period (default: the current month) → see the touchless rate with its counts, the AI misplacement rate beside it, and the exception backlog by state and age
- **Alternative:** no data → empty state
- **Permission:** own entity; a Group Admin sees per-entity counts and rates only (BR-09)
- **Result:** G-01 and G-02 are reported together, with the limit of the risk-weighted sample stated · **Stories:** US-27

## UC-28 View Audit Log

- **Actor:** Administrator, Chief Accountant
- **Main flow:** open the log → filter by date, document, event type, or user → read the entries
- **Alternative:** a request to edit or delete an entry → rejected (BR-12)
- **Permission:** Chief Accountant and Entity Admin for the own entity; Group Admin for group-level events only (BR-09)
- **Result:** every AI decision, rule decision, human decision, signature, and flag can be traced · **Stories:** US-28

## UC-29 Confirm Service Acceptance

- **Actor:** Requesting Department · **Re-runs:** UC-16
- **Preconditions:** logged in as a Requesting Department user; a service invoice of the own entity is `Waiting for Goods` because the ERP holds no acceptance for its order
- **Main flow:** open the acceptance queue → see the invoice, its order, the service lines, the amount, and the due date → confirm the acceptance, or reject it, with a note → the acceptance is saved with the user, the time, and the note → on confirmation the system re-runs UC-16
- **Alternative:** a rejection with no note → refused; a rejection → the invoice becomes the exception "Service acceptance rejected", which cannot be approved individually (D-31, D-90); the ERP also holds an acceptance → the ERP acceptance wins and the confirmation stays in the history (BR-19); a user linked to the ERP user who created the order → blocked (BR-02); a goods invoice is never listed; a change made from an outdated view is rejected (BR-37)
- **Permission:** Requesting Department, own entity only; no other role can confirm an acceptance
- **Result:** a service invoice with no ERP acceptance has an independent acceptance source in MatchPay (BR-17, BR-19) · **Stories:** US-29

## UC-30 Delegate Signing Authority

- **Actor:** Chief Accountant, Payment Approver; Entity Admin views and revokes
- **Preconditions:** logged in as a Chief Accountant or a Payment Approver; another active Chief Accountant or Payment Approver exists in the same entity
- **Main flow:** open the delegations → choose the delegate, a start date, an end date (at most 30 days, DF-62), and a reason → save → in the range the delegate sees the requests that wait for the delegator's signature, marked "On behalf of", and signs at the delegator's level after entering their own password again → the signature record names both people (BR-38) → the delegation ends on its end date, or earlier when the delegator or the Entity Admin revokes it
- **Alternative:** a delegate of another entity, an Administrator, or an AP Accountant → rejected; a range over 30 days, in the past, or overlapping another delegation → rejected; the delegate would be the other signer of the same request, is linked to the creator or confirmer of an invoice in it, or processed an invoice in it → blocked at signing (BR-02, BR-36); during the range the delegator's own signing action is disabled (DF-62)
- **Permission:** Chief Accountant and Payment Approver for their own delegation; Entity Admin sees and revokes in the own entity and cannot create or sign
- **Result:** signing continues while a signer is absent without sharing an account; the legal validity of a delegated e-signature is Unverified (O-17), and a policy delegation instead of per-voucher signing stays open (O-05) · **Stories:** US-30

## UC-31 Receive Invoices by Email

- **Actor:** System; Email Service (the simulated entity mailbox); AP Accountant reads the log and can fetch at once
- **Preconditions:** the entity has a simulated invoice mailbox (DF-63)
- **Main flow:** on a schedule (DF-63) read the new messages of the entity mailbox through the Email Service → store each message with its identifier, sender, and time → every XML attachment goes through the same checks as an upload (UC-10) and then UC-12 to UC-16, with the source "Email" → every non-XML attachment is logged and rejected with "Only XML e-invoices are accepted in the MVP" (BR-17) → the AP Accountant sees the mailbox log with the result of each attachment
- **Alternative:** mailbox unavailable → the fetch fails, earlier data stays, and the last successful fetch time is shown; a message with no attachment → logged "No attachment"; a message fetched before → not processed twice; a duplicate invoice, a buyer tax code of another entity, or a failing file → handled as in UC-10 without stopping the other attachments
- **Permission:** internal; the AP Accountant sees the mailbox log of the own entity only (BR-09)
- **Result:** XML invoices sent by suppliers enter without a manual upload; the supplier portal stays Advanced (W-05) · **Stories:** US-31

## UC-32 Receive Notifications and Reminders

- **Actor:** AP Accountant, Chief Accountant, Payment Approver; the System creates the items
- **Main flow:** the System creates an in-app notification when a batch is released for signing (to the signers who must sign), when a new exception is created or a request is returned or declined (to the AP Accountant), and as a daily reminder when a correction request has waited more than 5 working days or a request waits for a signature past its due date (DF-21, DF-67) → the user sees an unread count and a list → opening an item goes to its object and marks it read → a reminder stops when its work is done
- **Alternative:** no email is sent to staff (D-97); an item that cannot be saved does not stop the action that caused it; an object of another entity never creates an item for this user (BR-09)
- **Permission:** own entity; each user sees only their own notifications
- **Result:** work waiting for a person is visible without searching; this reverses the Step 3 decision D-41 (no notification centre), which Step 3 must follow (D-97) · **Stories:** US-32

**Related:** [Step index](README.md)
