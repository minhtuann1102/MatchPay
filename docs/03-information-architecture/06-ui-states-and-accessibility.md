# UI/UX States and Accessibility

> Design status: MVP — Step 3 of 9, approved
>
> Implementation status: NOT STARTED

All interface copy is English. A message quoted from a Step 2 acceptance criterion is used word for word. Copy that Step 2 does not quote is marked *(proposed)* and can change in Step 4.

## UI/UX state contract

### General states

| State | Required behavior |
|---|---|
| Initial loading | Keep the page shell and the sidebar; show a skeleton for the affected list or panel. |
| Empty | Say that nothing exists yet and offer the permitted next action (for example "Upload XML" on SCR-10 for the AP Accountant, nothing for a read-only role). An empty list is different from "no results for these filters". |
| No results | Show the active filters and a **Clear filters** action (AC-17.7). A search with no hit shows "No invoice found" and nothing that tells whether the invoice exists in another entity (AC-17.13). |
| Validation error | Keep the entered values, show the message next to the field, and focus the first error. Examples: "Maximum allowed by the group: 5%" (AC-04.2), "Email already in use" (AC-02.7), "A user has one role in one entity in the MVP" (AC-02.3), "No approver for VND 50,000,000 and over" (AC-05.3), "At least 50 compared invoices are needed" (AC-06.4). |
| Server error | Show a short message with Retry; never show technical details. |
| Unauthorized (no session, session ended, account deactivated) | Clear the session and go to SCR-01 with a message. After a deactivation the next request ends the session (AC-02.5). |
| Forbidden | Show SCR-90 "Access denied" with a link to the home page of the role. A record of another entity gets the same page and no hint that it exists (AC-01.5). |
| Saving | Disable the submit button to prevent double submission and show progress. |
| Success | Confirm the action in a short message, close the modal if there is one, and refresh the affected list or panel. |
| Conflict (object changed meanwhile, BR-37, DF-27) | Nothing is saved. Keep the user's input (reason, marks, selection) and show "This item was changed by someone else. Reload to see the change." *(proposed)* with a **Reload** action. Applies to resolving, deciding, approving, releasing, signing, withdrawing (D-30), confirming or rejecting an acceptance (AC-29.7), expanding the sample, reopening a batch (AC-24.17), and recording a cancellation notice. |
| Audit write failure (DF-30) | The action is not completed and nothing is saved. Show "Action not completed. The audit log could not be written. Try again." *(proposed)* with Retry. The system fails closed; it never completes an action without its audit entry. |
| Destructive confirmation | Name the item and the effect. Deactivating a user: no login, sessions end on the next request, earlier decisions and signatures stay (SCR-72). Removing a line: earlier signatures are voided and the level may change (SCR-53). Declining a request: the request is cancelled and all its invoices return to exceptions (SCR-54). Closing a batch: later invoices go to the next period (SCR-31). Deactivating a recurring profile: later invoices become exceptions. Closing a gate: later invoices of the pair become exceptions. Recording a cancellation notice: the modal states what happens for the state of the invoice, including that a signed request that is not yet sent is cancelled as a whole (SCR-19). Reopening a batch: the requests are cancelled and the invoices stay in the batch (SCR-34). Resending: the same request number is used and no new signature is asked (SCR-57). Revoking a delegation: the delegate can no longer sign, and signatures already given stay valid (SCR-55). |

### Status chips

A chip always carries its text. Colour supports the text and never replaces it. The names are exactly the states of the lifecycle rules.

**Invoice state (BR-33).** Final states are `Rejected`, `Separated`, `Superseded`, and `Paid`.

| Chip | Meaning shown to the user |
|---|---|
| Received | XML stored with its hash, signature check running. |
| In Check | The AI checks and the Rule Engine are running. |
| Waiting for Goods | No matching receipt yet; checked again when a receipt is synced. Not an exception. |
| Separated | An employee-expense invoice, listed as "Waiting for reimbursement file". Not an exception. |
| Rejected | Final; the reason is shown. |
| Exception | One or more reasons need a person; the exception state is shown beside it. |
| In Batch | Admitted by the Rule Engine, or approved individually. |
| Signed | Its payment request is fully signed. Withdrawal is no longer possible (DF-07). |
| Sent | The instruction went to the Entity ERP. |
| Paid | The ERP returned the paid status; the payment reference is shown. |
| Superseded | Replaced by a confirmed follow-up invoice. Final; cannot be admitted or paid (AC-20.7). |

**Exception state (BR-34).** `Closed` is final and shows its outcome.

| Chip | Meaning shown to the user |
|---|---|
| Open | Created by the Rule Engine; nobody has started. |
| In Review | The AP Accountant is working on it. When a legal adjustment or replacement invoice is linked, the chip carries the tag "Waiting for AP confirmation" (DF-39). |
| Waiting for Supplier | A correction request was sent; the reminder date is shown. |
| Waiting for Data Fix | A data-fix notice was sent; waits for the next ERP sync. |
| Waiting for Decision | Routed to the Chief Accountant or the Payment Approver; the role is named. |
| Closed | With one outcome: Admitted, Approved individually, Rejected, Superseded, or Auto-closed. |

An exception also shows its reasons as plain text with their numbers, for example "Price +2.5%, tolerance 2%" (AC-16.2). The reasons Step 2 names include: Gate closed, Tax-risk hold, AI unavailable, Flow unclear, Entity unconfirmed, No matching profile, Line not matched, Unusual price, Possible duplicate, Period already invoiced, New supplier, Bank account changed, Anomaly check unavailable, No tax-authority code, Unsupported: foreign invoice (resolved only by Reject with a reason, AC-12.9), Wrong buyer tax code and Wrong entity reported (a reported wrong entity, resolved by a correction or reissue request or by Reject, AC-18.12), Advanced flow, Payment failed, Service acceptance rejected (a rejection by the Requesting Department, which cannot be approved individually, AC-29.3), Authority status unavailable (AC-10.15), Cancelled after signing, and Request cancelled: another invoice was cancelled (AC-18.14). A rejection that closes an invoice reads "Cancelled by the seller" (AC-18.13) or "Cancelled at the tax authority on 2026-11-03" (AC-10.12).

**Batch state (BR-35).** `Completed` is final.

| Chip | Meaning shown to the user |
|---|---|
| Open | Invoices of the period are being admitted. |
| In Review | Closed by the AP Accountant; the sample is being checked. |
| In Signing | Released; payment requests wait for signatures. |
| Signed | Every request is Signed or Cancelled. |
| Sent | Requests were sent to the Entity ERP. |
| Completed | Every request is Paid. |

**Payment request state (BR-35).** `Cancelled` and `Paid` are final.

| Chip | Meaning shown to the user |
|---|---|
| Awaiting Chief Accountant | The Chief Accountant signs first, or co-signs an individually approved exception. |
| Awaiting Payment Approver | Signed once; waits for the approver at the required level. |
| Signed | Fully signed; the send to the ERP starts at once. |
| Sent | In the ERP; waits for the paid status. |
| Paid | Paid status and payment reference are shown. |
| Cancelled | All lines removed, or declined with a reason. |

**Delegation state (BR-38).** `Ended` and `Revoked` are final.

| Chip | Meaning shown to the user |
|---|---|
| Scheduled | The range starts on a later day; the delegate cannot sign yet. |
| Active | Today is inside the range; the delegate signs at the level of the delegator and the delegator's own signing is disabled (AC-30.2, AC-30.8). |
| Ended | The last day has passed. |
| Revoked | The delegator or the Entity Admin ended it early; signatures already given stay valid (AC-30.9). |

**Authority status (BR-39).** Shown on SCR-12 with the status date and the time of the lookup (AC-10.16).

| Status | Meaning shown to the user |
|---|---|
| Valid | Processed normally. |
| Adjusted | A warning that an adjustment invoice exists; the original stays valid (AC-10.14). |
| Replaced | The upload is rejected with "Replaced at the tax authority by C26TAA-0000141" (AC-10.13). |
| Cancelled | The upload is rejected with "Cancelled at the tax authority on 2026-11-03" (AC-10.12). An invoice already in a batch follows AC-07.11. |
| Unavailable | The lookup did not answer in 10 seconds; the invoice becomes the exception "Authority status unavailable" and is never admitted with an unknown status (AC-10.15). The AP Accountant can run the lookup again from SCR-10. |

### Due-date and sync-time states

| State | Where | Required behavior |
|---|---|---|
| Due date | SCR-10, SCR-12, SCR-30, SCR-51 | The invoice due date in the format dd/MM/yyyy. |
| Due soon | SCR-10, SCR-30 | The text "Due soon" next to the date when the invoice is due within 7 days (AC-17.8, DF-18). |
| Reminder due | SCR-10 | A mark and a filter for a correction request with no reply after 5 working days (DF-21). Nothing is sent to the supplier automatically. |
| Sync time | SCR-10, SCR-12, SCR-75 | "Last ERP sync: 31/10/2026 09:15". On SCR-12 the order and the receipt each show the sync time they came from. |
| Stale data | SCR-10, SCR-12, SCR-75 | When the last sync failed: a warning "ERP sync failed. Data shown is from 31/10/2026 09:15." *(proposed)* that stays until a sync succeeds; invoices are checked against the earlier data (AC-07.7). |

### Acceptance, mailbox, delegation, notification, and batch-action states

Added by the mind map sync (D-88). Copy marked *(proposed)* is not quoted from Step 2.

| State | Where | Required behavior |
|---|---|---|
| Acceptance queue empty | SCR-22 | "No service invoices wait for acceptance" *(proposed)*; no action. |
| Acceptance queue loading or error | SCR-22 | Skeleton rows; on an error a short message with Retry. |
| Rejection without a note | SCR-23 | Refused with "A note is required to reject" *(proposed)*; the entered text stays (AC-29.3). |
| Order creator blocked | SCR-23 | "You created the order for this invoice"; Confirm and Reject are disabled (AC-29.6). |
| ERP acceptance exists | SCR-22, SCR-23 | The invoice is no longer offered; the earlier confirmation stays in the history (AC-29.4). |
| Acceptance saved | SCR-22, SCR-23 | A short message with the result of the re-check: the invoice is `In Batch`, still `Waiting for Goods`, or an exception "Service acceptance rejected". |
| Mailbox empty | SCR-24 | "No messages have been fetched yet" *(proposed)*; Fetch now is offered. |
| Fetching | SCR-24 | Fetch now is disabled and shows progress; the log refreshes when the fetch ends. |
| Fetch failed | SCR-24 | The failure and the time of the last successful fetch are shown, earlier data stays, and the next scheduled fetch tries again (AC-31.7). |
| Attachment results | SCR-24 | Each attachment reads Accepted with a link to the invoice, or Rejected with its reason; a message with no attachment reads "No attachment" (AC-31.2, AC-31.3). |
| Delegation list empty | SCR-55 | "No delegations" *(proposed)*; New delegation for the Chief Accountant and the Payment Approver only. |
| Delegation validation | SCR-56 | The errors of AC-30.6 and AC-30.7 next to the field: "A delegate must be an active Chief Accountant or Payment Approver of the same entity" and "Maximum 30 days". |
| Own signing disabled | SCR-50, SCR-51, SCR-52 | "You delegated signing until 2026-11-14" while the delegation is active (AC-30.8). |
| On behalf of | SCR-50, SCR-51, SCR-52 | The text "On behalf of Carol" beside each request the delegate may sign, and "signed by Dan on behalf of Carol" in the record (AC-30.2, AC-30.10). Never colour alone. |
| Signer processed an invoice | SCR-18, SCR-51, SCR-52 | "You processed this invoice" (SCR-18) or "You processed an invoice in this request" naming the invoice (AC-23.13, AC-25.16); the control stays disabled with the reason. |
| Notification list empty | SCR-62 | "No notifications" *(proposed)*. |
| Unread and read | SCR-62, top bar | Each item carries the text "Unread" until opened; the top bar shows "Notifications 3" with the number of unread items, and no number when there are none (AC-32.6). |
| Reminder repeated | SCR-62 | A reminder appears again once a day until its work is done, and then stops (AC-32.4, AC-32.5). |
| Notification not saved | all | The action that caused it completes; nothing is shown to the user, and the failure is logged (AC-32.9). |
| Expand sample disabled | SCR-30, SCR-33 | "Every invoice is already in the sample" when none is left (AC-24.13). |
| Expanded sample not marked | SCR-30 | Release for signing stays disabled and the page says how many items are still to mark (AC-24.12). |
| Reopen refused | SCR-34 | "A request in this batch is already signed"; the user can still withdraw an invoice (AC-24.16). |
| Resend offered | SCR-30, SCR-51 | The Resend action appears after the 3 automatic attempts failed, only for a `Signed` request and only to the AP Accountant and the Chief Accountant (AC-26.10). It is not shown for a payment failure (AC-26.13). |
| Resend running or finished | SCR-30, SCR-51, SCR-57 | The attempt is listed as manual with the name and the time; on acceptance the request follows the normal sent and paid states (AC-26.11). |
| Cancellation recorded | SCR-12, SCR-19 | The message names the effect: the invoice is `Rejected` with "Cancelled by the seller"; or the request is `Cancelled` and its other invoices became exceptions; or the notice is stored as a warning (AC-18.13 to AC-18.16). |

### AI states

An AI result is always labelled as AI and always sits beside the human-readable evidence. A failure never blocks intake or signing (BR-27, DF-08).

| State | Where | Required behavior |
|---|---|---|
| Classification, reading, matching in progress | SCR-10, SCR-12 | The invoice shows `In Check` with a "Checking…" note in the evidence panels. The page is usable; SCR-12 refreshes when the result is ready. |
| AI failure at intake | SCR-10, SCR-12 | The invoice becomes an exception with the reason "AI unavailable". The AP Accountant can re-run the check from the worklist; there is no automatic retry (DF-08). |
| AI-written text | SCR-12, SCR-14, SCR-51 | Every explanation, draft, and summary carries an "AI" label (AC-17.3). Document content shown from the XML is marked as data, and text that looks like an instruction changes nothing (BR-27). |
| Flow unclear | SCR-12 | The exception reason "Flow unclear" and a control to choose the flow (AC-12.4). |
| Wrong entity reported | SCR-12 | The AP Accountant writes a required note, and the page shows the traced mismatch: the buyer tax code on the XML against the tax code of the entity, the buyer name, the order reference, and the ERP data of the entity (BR-09: nothing of another entity). The invoice stays in its entity as an exception with the reason "Wrong buyer tax code" or "Wrong entity reported". Individual approval and sending for a decision are not offered (AC-18.11, AC-18.12, D-31, D-68). |
| Line match with method | SCR-12 | Each line shows its method (mapping table, embedding with the signal-fusion model, or LLM) and probability; a doubtful line is marked with the reason, for example the unit that is unknown. |
| Non-XML file at upload | SCR-11 | The file is listed as Rejected with "Only XML e-invoices are accepted in the MVP" (AC-10.8); no invoice is created and the other files continue. |
| Split-order group | SCR-12, SCR-18, SCR-40 | The three linked exceptions are shown as one group: the three invoices, their amounts, the combined amount, and the level it needs. One Approve and one Decline cover all three; a partial decision is not offered. When the approver is blocked on one invoice (BR-36) or one was changed meanwhile (BR-37), the whole group is blocked and the screen names that invoice (AC-23.11, AC-23.12, D-70). |
| Unsupported: foreign invoice | SCR-10, SCR-12, SCR-40 | The invoice shows the exception reason "Unsupported: foreign invoice". The action panel offers only Reject with a reason (SCR-15); individual approval and sending for a decision are not offered (AC-12.9, D-31). |
| Draft request loading | SCR-14 | Spinner in the text area; Send is disabled until the draft or an error arrives. |
| Draft request failure | SCR-14 | The blank approved template is shown so the AP Accountant can write the request (AC-19.7). |
| Email failure | SCR-14, SCR-12 | The status "Not sent" with a Retry action; the exception keeps its state (AC-19.6). |
| Sample selected without AI | SCR-30, SCR-51 | The label "selected without AI" beside the sample (AC-24.8). |
| Sample not fully marked | SCR-30 | Release for signing is disabled and the page says how many items are still to mark (AC-24.5). |
| Signing summary loading | SCR-51 | Spinner in the summary panel; the evidence and the signing controls stay usable. |
| Signing summary unavailable | SCR-51 | The message "The AI summary is unavailable. You can still sign using the evidence." *(proposed, AC-25.13)*. |
| Misplacement above 1% | SCR-60 | The touchless rate is marked "not valid" beside the AI misplacement rate (AC-27.2). |
| Gate accuracy below the threshold | SCR-78, SCR-79 | The accuracy is shown next to 98% with the text "Below threshold"; opening needs a written reason (AC-06.5). |
| Too few compared invoices | SCR-78, SCR-79 | The text "At least 50 compared invoices are needed" and Open disabled (AC-06.4). |
| Simulated history | SCR-78, SCR-79 | The label "Simulated history" beside figures that come from the seed (AC-06.10). |
| Gate alert | SCR-75, SCR-78 | A text alert that recommends closing the gate; the gate stays as it is until the Group Admin acts (AC-06.7). |

### ERP send states

| State | Where | Required behavior |
|---|---|---|
| Not yet sent | SCR-30, SCR-50, SCR-51 | The request is `Awaiting Chief Accountant` or `Awaiting Payment Approver`. |
| Sending | SCR-30, SCR-50, SCR-51 | Chip `Signed` with the text "Sending to ERP…". |
| Retry n of 3 | SCR-30, SCR-50, SCR-51 | "Retry 2 of 3, next attempt in 5 minutes" (DF-24). |
| Failed alert | SCR-30, SCR-50, SCR-51 | After 3 attempts: an alert "Sending to the ERP failed after 3 attempts." *(proposed)*; the request stays `Signed`. The AP Accountant (SCR-30) and the Chief Accountant (SCR-51) are offered Resend (SCR-57); the Payment Approver sees the alert only (DF-69, AC-26.10). |
| Manual resend | SCR-30, SCR-51 | The attempt is marked manual with the name and the time. The same request number is the idempotency key, no signature is asked, and a content hash mismatch stops the resend with the alert of AC-26.7 (AC-26.11, AC-26.12). |
| Rejected by the ERP | SCR-10, SCR-12, SCR-30 | The invoices become exceptions with the reason "Payment failed"; a new request needs new signatures (AC-26.6). |
| Hash mismatch | SCR-51, SCR-57 | The request is not sent and an alert appears (AC-26.7). |
| Paid | SCR-12, SCR-30, SCR-50, SCR-51 | `Paid` with the payment reference, for example "PAY-CF-2026-0042". |

## Responsive and accessibility rules

- **Responsive:** the layout works at phone width (A-06). The sidebar collapses to a menu button; the top bar keeps the entity name, the user, and Log out. Tables become stacked cards on narrow screens without hiding data permanently. The signing queue keeps its checkboxes and a sticky "Sign selected" bar. Approval on a phone is not a goal of the MVP (W-11).
- **SCR-12 on narrow screens** stacks in this order: header and state, action panel (when the role has one), evidence panels (collapsible), history.
- **Colour is never the only signal.** Every state chip, "Due soon", "Below threshold", flag, AI label, "On behalf of" mark, and unread mark carries text.
- **Labels and names:** every input has a visible label; icon-only buttons have accessible names; errors are tied to their fields and announced.
- **Modals** fit the viewport, trap keyboard focus, close with `Escape` unless a submission or a signing is running, and return focus to the control that opened them. Modals for decisions (SCR-15, SCR-16, SCR-18, SCR-54) focus the reason field first, and so do SCR-19, SCR-33, SCR-34, and SCR-56; SCR-23 focuses the note field.
- **Keyboard order:** skip link, sidebar, top bar, page title, filters, list or form, primary action. Table rows open with `Enter`. Row selection on SCR-50 works with `Space`.
- **Live regions:** per-file upload results, signing results, and conflict messages are announced to screen readers. So are the results of a mailbox fetch and a change of the unread count in the top bar.
- **Money:** `VND 53,000,000`, with the currency code first, a comma as thousands separator, and no decimals for VND. All amounts are in VND in the MVP; foreign currencies moved to Advanced (D-33).
- **Dates and times:** `dd/MM/yyyy HH:mm` everywhere (DF-37).
- **Demo-only marking:** SCR-80, SCR-81, SCR-82, and the top bar of the Demo Operator show "Demo only" in text, in a place that cannot be scrolled out of view.
- **Language:** all copy is English. Names of fictional people use they/them when a pronoun is needed.

**Related:** [Step index](README.md) · [Screen inventory](04-screen-inventory.md) · [User flows](05-user-flows.md) · [Business rules](../requirements/business-rules.md)
