# Screen Notes and States

> Design status: MVP — Step 4 of 9, draft for review
>
> Implementation status: NOT STARTED

Each page lists its purpose, the yellow annotation numbers shown in the HTML, and its states. The **Source** column names the row of the [UI/UX state contract](../03-information-architecture/06-ui-states-and-accessibility.md) (Step 3) that each state implements, or the rule or acceptance criterion behind it. Open a state with `?state=<name>` and a role with `?role=<name>` (roles: `ap`, `chief`, `approver`, `entity-admin`, `group-admin`, `demo`). Modals are states of their parent page and have their own `####` heading. Sample data is the Calderwood Group (DF-12, DF-46). The design language is in the [design system](01-design-system.md).

## Access

### SCR-01 Login — [`01-login.html`](wireframes/01-login.html) · [PNG](../images/common/01-login.png)

Purpose: sign in with email and password, then go to the home page of the role (DF-28). Public.

| # | Note |
|---|---|
| 1 | One **Log in** button; after login the user goes to the role home page, never back to the old URL (Step 3 routes). |
| 2 | One message for a wrong email or a wrong password, without saying which (AC-01.2). |
| 3 | A deactivated account sees "Your account is deactivated. Please contact your administrator." and is not logged in (AC-01.3). |
| 4 | After a session ends the page shows a short message (Step 3, SCR-01). Copy is proposed. |

| State | Source | Behavior |
|---|---|---|
| default | Initial | Two fields and the button. There is no sign-up and no password reset (no story asks for them, D-38). |
| [`error`](wireframes/01-login.html?state=error) | Validation error | "Email or password is incorrect" above the fields; values kept ([PNG](../images/common/01b-login-error.png)). |
| [`deactivated`](wireframes/01-login.html?state=deactivated) | Unauthorized | The deactivation message ([PNG](../images/common/01c-login-deactivated.png)). |
| [`session-ended`](wireframes/01-login.html?state=session-ended) | Unauthorized | "Your session ended. Log in again to continue." |
| [`saving`](wireframes/01-login.html?state=saving) | Saving | Button disabled with "Logging in…". |

### SCR-90 Access denied — [`90-access-denied.html`](wireframes/90-access-denied.html) · [PNG](../images/common/90-access-denied.png)

Purpose: the one answer to a URL the role may not open or a record of another entity. Roles: any (try `?role=ap`, `chief`, `entity-admin`, `demo`).

| # | Note |
|---|---|
| 1 | "Access denied" (AC-01.5, AC-01.6). The sidebar still shows only the permitted items. |
| 2 | For the record of another entity the text is the same and never says whether it exists (BR-09). |
| 3 | A link to the home page of the role. |

| State | Source | Behavior |
|---|---|---|
| default | Forbidden | A page the role may not open. |
| [`other-entity`](wireframes/90-access-denied.html?state=other-entity) | Forbidden | A record identifier of another entity; no hint that it exists. |

## Invoices

### SCR-10 Invoice Worklist and SCR-11 — [`10-invoice-worklist.html`](wireframes/10-invoice-worklist.html) · roles `ap`, `chief`, `approver` · [PNG AP Accountant](../images/ap-accountant/10-invoice-worklist.png), [PNG Chief Accountant](../images/chief-accountant/10-invoice-worklist.png), [PNG Payment Approver](../images/payment-approver/10-invoice-worklist.png)

Purpose: every invoice of the own entity with its state, reasons, and due date. The AP Accountant uploads and re-runs; the Chief Accountant and the Payment Approver see no upload and no re-run control (AC-17.4, read-only).

| # | Note |
|---|---|
| 1 | "Last ERP sync: 31/10/2026 09:15" (US-07). |
| 2 | **Upload XML** opens SCR-11. AP Accountant only. |
| 3 | Filters: state, supplier, flow, invoice date, and **Reminder due** for correction requests with no reply after 5 working days (AC-17.7, DF-21). The sidebar badge "6" counts the open exceptions. |
| 4 | "No results" names the active filters and offers **Clear filters** (AC-17.7). |
| 5 | An invoice with the reason "AI unavailable" can be re-run from the worklist; there is no automatic retry (DF-08). Rows also show: "Due soon" within 7 days (AC-17.8, DF-18); Waiting for Goods as a non-exception (BR-14); the reason numbers of AC-16.2; and the payment reference once Paid (AC-26.2). |

| State | Source | Behavior |
|---|---|---|
| default | Initial | 18 invoices with every invoice state except Separated and Superseded, which have no DF-12 sample (they are in the [design system](01-design-system.md)). |
| [`loading`](wireframes/10-invoice-worklist.html?state=loading) | Initial loading | Filters and shell stay; skeleton rows. |
| [`empty`](wireframes/10-invoice-worklist.html?state=empty) | Empty | "No invoices yet" with **Upload XML** for the AP Accountant and a plain sentence for the other roles ([PNG](../images/ap-accountant/10d-invoice-worklist-empty.png)). |
| [`no-results`](wireframes/10-invoice-worklist.html?state=no-results) | No results | The filters and **Clear filters** (AC-17.7). |
| [`stale`](wireframes/10-invoice-worklist.html?state=stale) | Stale data | "ERP sync failed. Data shown is from 31/10/2026 09:15." (AC-07.7) ([PNG](../images/ap-accountant/10e-invoice-worklist-stale.png)). |
| [`server-error`](wireframes/10-invoice-worklist.html?state=server-error) | Server error | A short message and **Retry**. |

#### SCR-11 Upload XML Invoices (state of SCR-10)

| # | Note |
|---|---|
| 6 | The modal lists the chosen files and uploads them together; a failing file never stops the others (AC-10.8). |
| 7 | The per-file result: Accepted, or Rejected with a reason. A PDF or an image says "Only XML e-invoices are accepted in the MVP" (AC-10.8, BR-17); no invoice is created from a rejected file. |

| State | Source | Behavior |
|---|---|---|
| [`upload`](wireframes/10-invoice-worklist.html?state=upload) | Initial | Three files chosen, **Upload 3 files**. |
| [`upload-results`](wireframes/10-invoice-worklist.html?state=upload-results) | Success, AI states (non-XML) | One accepted, "XML signature check failed" (AC-10.2), and "An invoice with this seller, series, and number already exists" (AC-10.7) ([PNG](../images/ap-accountant/10b-invoice-worklist-upload-results.png)). The list is announced. |
| [`upload-non-xml`](wireframes/10-invoice-worklist.html?state=upload-non-xml) | Non-XML file at upload | A PDF and an image rejected with "Only XML e-invoices are accepted in the MVP" while the XML file is accepted ([PNG](../images/ap-accountant/10c-invoice-worklist-upload-non-xml.png)). |

### SCR-12 Invoice Detail and Evidence — [`12-invoice-detail.html`](wireframes/12-invoice-detail.html) · roles `ap`, `chief`, `approver` · [PNG](../images/ap-accountant/12-invoice-detail.png)

Purpose: the core screen. The evidence of one invoice, with the three hands visible, and a role-dependent action panel that appears only when the invoice awaits that role (D-37, AC-17.4). The default invoice is C26TAA-0000123 from Brightfield Paper Ltd (VND 8,098,750), an exception with four reasons. Layout on narrow screens: header, action panel, evidence panels (collapsible), history.

| # | Note |
|---|---|
| 1 | Exception reasons with their numbers, for example "Price +2.5%, tolerance 2%" (AC-16.2). |
| 2 | Flow with the AI tag; the flow, its reason, and its confidence are stored (AC-12.1). |
| 3 | The order and the receipt each show the time of the sync they came from (US-07, Step 3 sync-time state). |
| 4 | Flow and identification: AI reason, confidence 0.97, model and prompt versions (BR-12). |
| 5 | Line matches with the method (mapping table, embedding with signal fusion, LLM) and the probability against the 0.90 threshold; a doubtful line says why (AC-14.1, AC-14.5, DF-15). |
| 6 | Anomaly numbers: price against the 6-month median, near-duplicate, supplier history, period (AC-15.1, AC-15.3, AC-15.7). |
| 7 | The six conditions of BR-05, each with its value and Pass or Fail, set by the Rule Engine without an LLM (AC-16.2, AC-16.3). |
| 8 | Decision history: who or what decided, with the three tags (AC-17.3). |
| 9 | Action panel for the AP Accountant: confirm a line match, correct the entity or flow, request a correction, send for a decision, reject (US-18). Chief Accountant and Payment Approver see a notice that nothing waits for them. |
| 10 | In the default invoice: **Request correction** opens SCR-14. In other cases: the hold decision (SCR-16), the individual approval (SCR-18), the only action for a foreign invoice, or **Withdraw from batch** (AC-24.7). |
| 11 | **Reject invoice** opens SCR-15. |
| 12 | **Send for a decision** (state Waiting for Decision) for a reason another role decides. |
| 13 | Conflict: "This item was changed by someone else. Reload to see the change." (BR-37). |
| 14 | Audit write failure: the action is not completed (DF-30). |

| State | Source | Behavior |
|---|---|---|
| default | Initial | AP Accountant, exception In Review. With `role=chief` or `role=approver` the evidence is the same, read-only, with no action panel. |
| [`loading`](wireframes/12-invoice-detail.html?state=loading) | Initial loading | Skeleton for the header and the panels. |
| [`server-error`](wireframes/12-invoice-detail.html?state=server-error) | Server error | Message with **Retry**. |
| [`checking`](wireframes/12-invoice-detail.html?state=checking) | Classification, reading, matching in progress | Invoice C26TAA-0000165 In Check; AI panels say "Checking…", the page stays usable. |
| [`confirm-line`](wireframes/12-invoice-detail.html?state=confirm-line) | Line match with method (DF-41) | Inline confirmation that saves the pair to the mapping table with name and time (AC-18.2). |
| [`correct`](wireframes/12-invoice-detail.html?state=correct) | Flow unclear (DF-41) | Inline choice of flow and entity. |
| [`ai-failure`](wireframes/12-invoice-detail.html?state=ai-failure) | AI failure at intake | C26TAA-0000140: reason "AI unavailable"; the Rule Engine conditions read "Not evaluated"; re-run from the worklist; no automatic retry (AC-12.5, DF-08) ([PNG](../images/ap-accountant/12d-invoice-detail-ai-failure.png)). |
| [`foreign`](wireframes/12-invoice-detail.html?state=foreign) | Unsupported: foreign invoice | TM-2026-0415 from Tempest Marketing GmbH: the only action is Reject; individual approval and sending for a decision are not offered (AC-12.9, D-31) ([PNG](../images/ap-accountant/12e-invoice-detail-foreign.png)). |
| [`in-batch`](wireframes/12-invoice-detail.html?state=in-batch) | BR-33 `In Batch` | C26TAA-0000098: all six conditions pass; withdraw with a required reason until the request is fully signed (DF-07) ([PNG](../images/ap-accountant/12f-invoice-detail-in-batch.png)). |
| [`paid`](wireframes/12-invoice-detail.html?state=paid) | ERP send states, Paid | C26TAA-0000081: request PR-0038, two signature records, payment reference PAY-CF-2026-0042 (AC-25.15, AC-26.2) ([PNG](../images/ap-accountant/12g-invoice-detail-paid.png)). |
| [`hold`](wireframes/12-invoice-detail.html?state=hold&role=chief) | Tax-risk hold (D-37) | C26TAA-0000188 from Eastbay Trading: list entry with source and date. `role=chief` has **Decide on the hold**; `role=ap` sees "Waiting for the Chief Accountant" ([PNG](../images/chief-accountant/12-invoice-detail-hold.png)). |
| [`approve`](wireframes/12-invoice-detail.html?state=approve&role=approver) | Individual approval (D-37) | C26TAA-0000151, VND 63,800,000, level CFO; `role=approver` has **Review and decide** ([PNG](../images/payment-approver/12-invoice-detail-approve.png)). |
| [`conflict`](wireframes/12-invoice-detail.html?state=conflict) | Conflict | Notice with **Reload**; nothing saved; input kept ([PNG](../images/ap-accountant/12h-invoice-detail-conflict.png)). |
| [`audit-error`](wireframes/12-invoice-detail.html?state=audit-error) | Audit write failure | "Action not completed. The audit log could not be written. Try again." with **Retry**. |

#### SCR-14 Correction Request Draft (state of SCR-12)

Purpose: the AP Accountant writes a correction request, data-fix notice, or reissue request. The AI drafts from an approved template; nothing is sent until **Send** (AC-19.1, BR-26).

| State | Source | Behavior |
|---|---|---|
| [`draft`](wireframes/12-invoice-detail.html?state=draft&role=ap) | AI-written text | Type, recipient, subject, and an editable draft labelled "AI draft from an approved template" with the order number, the invoice number, and the quantities ([PNG](../images/ap-accountant/12b-invoice-detail-correction-draft.png)). |
| [`draft-loading`](wireframes/12-invoice-detail.html?state=draft-loading) | Draft request loading | Spinner in the text area; **Send** disabled. |
| [`draft-ai-error`](wireframes/12-invoice-detail.html?state=draft-ai-error) | Draft request failure | The blank approved template (AC-19.7). |
| [`draft-not-sent`](wireframes/12-invoice-detail.html?state=draft-not-sent) | Email failure | "Not sent." with **Retry**; the exception keeps its state (AC-19.6). |

#### SCR-15 Reject Invoice (state of SCR-12)

| State | Source | Behavior |
|---|---|---|
| [`reject`](wireframes/12-invoice-detail.html?state=reject&role=ap) | Destructive confirmation | Invoice number, a required reason, **Reject invoice** and **Cancel** ([PNG](../images/ap-accountant/12c-invoice-detail-reject.png)). |
| [`reject-error`](wireframes/12-invoice-detail.html?state=reject-error) | Validation error | "A reason is required to reject an invoice." The copy is proposed. |
| [`foreign-reject`](wireframes/12-invoice-detail.html?state=foreign-reject) | Unsupported: foreign invoice | Same modal for TM-2026-0415 with the sentence that rejecting is the only resolution (AC-12.9). |

#### SCR-16 Tax-Risk Hold Decision (state of SCR-12)

| State | Source | Behavior |
|---|---|---|
| [`hold-decision`](wireframes/12-invoice-detail.html?state=hold-decision&role=chief) | US-21 | List entry with source and date, the amount, "The VAT deduction on this invoice may be at risk.", **Release** or **Reject**, a required reason, and a line that the decision goes to the audit log ([PNG](../images/chief-accountant/12b-invoice-detail-hold-decision.png)). |

#### SCR-18 Approve Exception Individually (state of SCR-12)

| State | Source | Behavior |
|---|---|---|
| [`approve-modal`](wireframes/12-invoice-detail.html?state=approve-modal&role=approver) | US-23 | Evidence summary, amount, level needed, **Approve** or **Decline** with a reason ([PNG](../images/payment-approver/12b-invoice-detail-approve-modal.png)). |
| [`approve-blocked`](wireframes/12-invoice-detail.html?state=approve-blocked&role=approver) | Separation of duties (BR-02, BR-36) | "You created the order for this invoice" (AC-23.6); **Approve** disabled ([PNG](../images/payment-approver/12c-invoice-detail-approve-blocked.png)). |

## Recurring profiles

### SCR-20 Recurring Profiles and SCR-21 — [`20-recurring-profiles.html`](wireframes/20-recurring-profiles.html) · role `ap` · [PNG](../images/ap-accountant/20-recurring-profiles.png)

Purpose: the contracts that repeat each period; a matching profile is the independent source for a recurring invoice (BR-17, BR-24).

| # | Note |
|---|---|
| 1 | **Add profile** opens SCR-21. |
| 2 | Each profile shows the amounts of earlier periods and their average, so the usage-based 30% limit can be checked (AC-09.1, DF-11). |
| 3 | **Deactivate** states that later invoices become exceptions. |
| 4 | SCR-21: supplier, location, contract, period, price type, contract price (required for a fixed price), deviation threshold. |

| State | Source | Behavior |
|---|---|---|
| default | Initial | Four profiles, one inactive. |
| [`loading`](wireframes/20-recurring-profiles.html?state=loading) | Initial loading | Skeleton rows. |
| [`empty`](wireframes/20-recurring-profiles.html?state=empty) | Empty | "No recurring profiles yet" with **Add profile**. |
| [`server-error`](wireframes/20-recurring-profiles.html?state=server-error) | Server error | Message with **Retry**. |
| [`deactivate`](wireframes/20-recurring-profiles.html?state=deactivate) | Destructive confirmation | Names the profile and the effect. |
| [`form`](wireframes/20-recurring-profiles.html?state=form) | SCR-21 | The form with sample values. |
| [`form-error`](wireframes/20-recurring-profiles.html?state=form-error) | Validation error | "A contract price is required for a fixed price." next to the field ([PNG](../images/ap-accountant/20b-recurring-profile-form-error.png)). |
| [`form-duplicate`](wireframes/20-recurring-profiles.html?state=form-duplicate) | Validation error | A second active profile for the same supplier, location, and period is refused. |
| [`form-saving`](wireframes/20-recurring-profiles.html?state=form-saving) | Saving | Button disabled with "Saving…". |

## Batch

### SCR-30 Batch Review, SCR-31, and SCR-32 — [`30-batch-review.html`](wireframes/30-batch-review.html) · role `ap` · [PNG](../images/ap-accountant/30-batch-review.png)

Purpose: close the October 2026 batch (5 invoices, VND 70,050,000), check the AI-selected sample, release it for signing, and follow the ERP send status.

| # | Note |
|---|---|
| 1 | The batch state chip (BR-35: Open, In Review, In Signing, Signed, Sent) and the count and total. |
| 2 | **Close for review** opens SCR-31. |
| 3 | The sample carries the AI tag, or the Rule Engine tag "Selected without AI" when the AI could not select (AC-24.8, DF-29). 5 invoices at 10% is 0.5, rounded up to 1 (AC-24.2, DF-06). |
| 4 | Each sample item shows why it was selected and **OK** or **Error**; an Error needs a reason and withdraws the invoice (AC-24.4). |
| 5 | **Release for signing** stays disabled until every sample item is marked, and says how many are still to mark (AC-24.5). |
| 6 | After release: one payment request per supplier with total, level, and state (AC-24.6, DF-02). |
| 7 | ERP send status per request: not yet sent, Sending, Retry n of 3, Failed, Paid with the payment reference (AC-26.2, AC-26.5). |
| 8 | A failed send raises an alert; the request stays Signed (AC-26.5, DF-40). |

| State | Source | Behavior |
|---|---|---|
| default | BR-35 `Open` | Invoices admitted by the Rule Engine with a **Withdraw** link to SCR-12. |
| [`loading`](wireframes/30-batch-review.html?state=loading) | Initial loading | Skeleton. |
| [`empty`](wireframes/30-batch-review.html?state=empty) | Empty batch | "No invoices in this batch"; release disabled (AC-24.9). |
| [`close`](wireframes/30-batch-review.html?state=close) | SCR-31 | Period, invoices, sample size, and the note that later invoices go to the next period (AC-24.1) ([PNG](../images/ap-accountant/30b-batch-review-close.png)). |
| [`in-review`](wireframes/30-batch-review.html?state=in-review) | Sample not fully marked | One item still to mark; release disabled ([PNG](../images/ap-accountant/30c-batch-review-sample.png)). |
| [`sample-no-ai`](wireframes/30-batch-review.html?state=sample-no-ai) | Sample selected without AI | The label "selected without AI" and "Highest value first" ([PNG](../images/ap-accountant/30d-batch-review-sample-no-ai.png)). |
| [`mark-error`](wireframes/30-batch-review.html?state=mark-error) | Validation error | A required reason for an Error mark. |
| [`ready`](wireframes/30-batch-review.html?state=ready) | BR-35 `In Review` | Every item marked; **Release for signing** enabled. |
| [`release`](wireframes/30-batch-review.html?state=release) | SCR-32 | Invoices, "Every sample item is marked", 3 requests by supplier ([PNG](../images/ap-accountant/30e-batch-review-release.png)). |
| [`conflict`](wireframes/30-batch-review.html?state=conflict) | Conflict | Reload message; nothing saved (AC-24.10). |
| [`released`](wireframes/30-batch-review.html?state=released) | BR-35 `In Signing` | Three requests, all awaiting the Chief Accountant ([PNG](../images/ap-accountant/30f-batch-review-released.png)). |
| [`sending`](wireframes/30-batch-review.html?state=sending) | ERP send states | PR-0042 Paid, PR-0043 "Retry 2 of 3, next attempt in 5 minutes", PR-0044 Sent ([PNG](../images/ap-accountant/30g-batch-review-erp-retry.png)). |
| [`send-failed`](wireframes/30-batch-review.html?state=send-failed) | ERP send states | "Sending to the ERP failed after 3 attempts." ([PNG](../images/ap-accountant/30h-batch-review-send-failed.png)). |

## Decisions and signing

### SCR-40 Decision Queue — [`40-decision-queue.html`](wireframes/40-decision-queue.html) · roles `chief`, `approver` · [PNG Chief Accountant](../images/chief-accountant/40-decision-queue.png), [PNG Payment Approver](../images/payment-approver/40-decision-queue.png)

Purpose: one list, two roles (D-40). "Decisions" for the Chief Accountant (tax-risk holds), "Approvals" for the Payment Approver (exceptions at the approver level).

| # | Note |
|---|---|
| 1 | Chief Accountant: C26TAA-0000188 from Eastbay Trading, "Tax-risk hold" (AC-21.1). |
| 2 | Payment Approver: only the exceptions of the own level. Fiona (CFO) sees VND 50,000,000 and over; Dan (Department Head) would see amounts under VND 50,000,000 (AC-23.1, DF-47). Rows the user cannot decide are not listed. |

| State | Source | Behavior |
|---|---|---|
| default | Initial | Rows with supplier, amount, reasons, level, and age; each opens SCR-12. |
| [`loading`](wireframes/40-decision-queue.html?state=loading) | Initial loading | Skeleton. |
| [`empty`](wireframes/40-decision-queue.html?state=empty) | Empty | "Nothing is waiting for your decision". |
| [`no-results`](wireframes/40-decision-queue.html?state=no-results) | No results | Filter and **Clear filters**. |
| [`server-error`](wireframes/40-decision-queue.html?state=server-error) | Server error | Message with **Retry**. |

### SCR-50 Signing Queue and SCR-52 — [`50-signing-queue.html`](wireframes/50-signing-queue.html) · roles `chief`, `approver` · [PNG Chief Accountant](../images/chief-accountant/50-signing-queue.png), [PNG Payment Approver](../images/payment-approver/50-signing-queue.png)

Purpose: payment requests of the entity; several can be signed in one action (AC-25.4).

| # | Note |
|---|---|
| 1 | Filter by state; the default view is "To sign". |
| 2 | Required level, state chip, flags (New supplier, Bank account changed), and signatures so far (BR-30, AC-25.1). |
| 3 | The Payment Approver's action is disabled until the Chief Accountant has signed, and each row says why (AC-25.2, DF-01). |
| 4 | ERP status per request: "Retry 2 of 3, next attempt in 5 minutes" (DF-24). |
| 5 | After signing, the page stays and gives one result per request, including the refused ones (Step 3). |
| 6 | The sticky bar shows how many requests are selected and their total; it stays visible on a phone. |

| State | Source | Behavior |
|---|---|---|
| default | Initial | Chief Accountant: PR-0042 and PR-0044 selected, total VND 65,650,000; PR-0043 not selectable ("You signed this request"). |
| [`loading`](wireframes/50-signing-queue.html?state=loading) | Initial loading | Skeleton. |
| [`empty`](wireframes/50-signing-queue.html?state=empty) | Empty | "No payment requests to sign". |
| [`server-error`](wireframes/50-signing-queue.html?state=server-error) | Server error | Message with **Retry**. |
| [`sign`](wireframes/50-signing-queue.html?state=sign&role=chief) | SCR-52 | Count, total, password entry again, **Sign 2 requests**; the platform e-signature is applied (AC-25.3) ([PNG](../images/chief-accountant/50b-signing-queue-sign.png)). |
| [`sign-wrong-password`](wireframes/50-signing-queue.html?state=sign-wrong-password&role=chief) | Validation error | The modal stays open: "The password is incorrect. Nothing was signed." |
| [`sign-results`](wireframes/50-signing-queue.html?state=sign-results&role=chief) | Success, Conflict | PR-0042 signed, PR-0044 not signed because the view was outdated (AC-25.10) ([PNG](../images/chief-accountant/50c-signing-queue-sign-results.png)). |
| [`chief-signed`](wireframes/50-signing-queue.html?state=chief-signed&role=approver) | AC-25.2 | PR-0042 awaits the Payment Approver and the action is enabled ([PNG](../images/payment-approver/50b-signing-queue-chief-signed.png)). |
| [`erp-retry`](wireframes/50-signing-queue.html?state=erp-retry) | ERP send states | Sending and "Retry 2 of 3" rows. |
| [`erp-failed`](wireframes/50-signing-queue.html?state=erp-failed) | ERP send states | "Sending to the ERP failed after 3 attempts." |
| [`conflict`](wireframes/50-signing-queue.html?state=conflict&role=chief) | Conflict | Reload message; nothing signed; selection kept. |

### SCR-51 Payment Request Detail, SCR-53, and SCR-54 — [`51-payment-request.html`](wireframes/51-payment-request.html) · roles `chief`, `approver` · [PNG](../images/chief-accountant/51-payment-request.png)

Purpose: what the signer reads before signing PR-0042 (Harbor Cartons Ltd, VND 53,000,000, level CFO). There is no payment method and no cash flag: the MVP sends a non-cash instruction to the simulated ERP (AC-26.1, D-33).

| # | Note |
|---|---|
| 1 | AI summary labelled as AI; it is never a signature (AC-25.1, AC-25.9). |
| 2 | When the summary fails: "The AI summary is unavailable. You can still sign using the evidence." (AC-25.13). |
| 3 | Rule Engine totals by entity and supplier, invoices of VND 50,000,000 or more, and the sample-check result (AC-25.1). |
| 4 | Flags for a new supplier or a changed bank account (BR-30). None on this request. |
| 5 | **Remove line** opens SCR-53. |
| 6 | Signature records: Carol first, Fiona second; pending ones are dashed (DF-01, BR-20). |
| 7 | **Decline request** opens SCR-54. |
| 8 | A failed send raises an alert and the request stays Signed (AC-26.5). |
| 9 | After the ERP replies: Paid status and the payment reference (AC-26.2). |

| State | Source | Behavior |
|---|---|---|
| default | Initial | Awaiting Chief Accountant; Carol's **Sign** enabled; with `role=approver` it is disabled with "Disabled until the Chief Accountant has signed." |
| [`loading`](wireframes/51-payment-request.html?state=loading) | Initial loading | Skeleton. |
| [`server-error`](wireframes/51-payment-request.html?state=server-error) | Server error | Message with **Retry**. |
| [`summary-loading`](wireframes/51-payment-request.html?state=summary-loading) | Signing summary loading | Spinner in the summary; evidence and controls usable. |
| [`summary-unavailable`](wireframes/51-payment-request.html?state=summary-unavailable) | Signing summary unavailable | The AC-25.13 message ([PNG](../images/chief-accountant/51b-payment-request-summary-unavailable.png)). |
| [`sample-no-ai`](wireframes/51-payment-request.html?state=sample-no-ai) | Sample selected without AI | "selected without AI" beside the sample result (AC-24.8). |
| [`remove-line`](wireframes/51-payment-request.html?state=remove-line) | SCR-53 | C26TAA-0000102 removed: total VND 39,500,000, level Department Head, earlier signatures voided (AC-25.5) ([PNG](../images/chief-accountant/51c-payment-request-remove-line.png)). |
| [`decline`](wireframes/51-payment-request.html?state=decline) | SCR-54 | Cancels the request and returns 3 invoices to exceptions ([PNG](../images/chief-accountant/51d-payment-request-decline.png)). |
| [`decline-error`](wireframes/51-payment-request.html?state=decline-error) | Validation error | A required reason. Copy proposed. |
| [`conflict`](wireframes/51-payment-request.html?state=conflict) | Conflict | Reload message (AC-25.10). |
| [`chief-signed`](wireframes/51-payment-request.html?state=chief-signed&role=approver) | AC-25.2 | Carol's record is solid; Fiona's **Sign** is enabled. |
| [`sending`](wireframes/51-payment-request.html?state=sending) | ERP send states | Signed, "Sending to ERP…". |
| [`retry`](wireframes/51-payment-request.html?state=retry) | ERP send states | "Retry 2 of 3, next attempt in 5 minutes" ([PNG](../images/chief-accountant/51e-payment-request-erp-retry.png)). |
| [`failed`](wireframes/51-payment-request.html?state=failed) | ERP send states | Alert after 3 attempts ([PNG](../images/chief-accountant/51f-payment-request-erp-failed.png)). |
| [`hash-mismatch`](wireframes/51-payment-request.html?state=hash-mismatch) | ERP send states | "Not sent: the content differs from the signed hash." (AC-26.7). |
| [`paid`](wireframes/51-payment-request.html?state=paid) | ERP send states | PR-0038: Paid, reference PAY-CF-2026-0042, two signature records ([PNG](../images/chief-accountant/51g-payment-request-paid.png)). |

## Oversight

### SCR-60 Dashboard — [`60-dashboard.html`](wireframes/60-dashboard.html) · roles `ap`, `chief`, `approver`, `entity-admin`, `group-admin` · [PNG AP Accountant](../images/ap-accountant/60-dashboard.png), [PNG Chief Accountant](../images/chief-accountant/60-dashboard.png), [PNG Entity Admin](../images/entity-admin/60-dashboard.png), [PNG Group Admin](../images/group-admin/60-dashboard.png)

Purpose: the touchless rate and the AI misplacement rate side by side, the backlog, and the Group Admin's per-entity counts (US-27). Default period: the current month (DF-23).

| # | Note |
|---|---|
| 1 | Touchless rate with its counts and formula: 62 of 92 is 67.4% (AC-27.1). Marked "not valid" above 1% misplacement (AC-27.2). |
| 2 | The AI misplacement rate beside it: 1 of 20 sampled is 5.0% (AC-27.2). |
| 3 | The note that the sample is weighted by risk and not random (AC-27.4). |
| 4 | Open exceptions by state (AC-27.3). Each figure opens a list with the same count (AC-27.6). |
| 5 | Open exceptions by age: 0 to 2 days, 3 to 7 days, over 7 days (AC-27.3). |
| 6 | Waiting for Goods as a separate count, not an exception (AC-27.5). |
| 7 | Group Admin: counts and rates for each entity and no invoice-level data (AC-27.7, BR-09). |

| State | Source | Behavior |
|---|---|---|
| default | Initial | Touchless rate marked "not valid". |
| [`valid`](wireframes/60-dashboard.html?state=valid) | Misplacement above 1% (inverse) | Misplacement 0.0%; the touchless rate carries "Valid: misplacement 1% or below". |
| [`loading`](wireframes/60-dashboard.html?state=loading) | Initial loading | Skeleton. |
| [`empty`](wireframes/60-dashboard.html?state=empty) | Empty | "No invoices in this period" (AC-27.9). |
| [`server-error`](wireframes/60-dashboard.html?state=server-error) | Server error | Message with **Retry**. |

### SCR-61 Audit Log — [`61-audit-log.html`](wireframes/61-audit-log.html) · roles `chief`, `entity-admin`, `group-admin` · [PNG Chief Accountant](../images/chief-accountant/61-audit-log.png), [PNG Entity Admin](../images/entity-admin/61-audit-log.png), [PNG Group Admin](../images/group-admin/61-audit-log.png)

| # | Note |
|---|---|
| 1 | Read-only: there is no edit or delete control (AC-28.4). |
| 2 | Filters: date, document, event type, user (AC-28.3). The Group Admin has no Document filter. |
| 3 | An AI entry shows task, method, result, reason, confidence, model version, and prompt version (AC-28.1). Rule Engine, person, and signature entries use their own tags (AC-28.2). The Group Admin sees only group events (AC-28.5). |

| State | Source | Behavior |
|---|---|---|
| default | Initial | Eight entries for the Chief Accountant and the Entity Admin; four group events for the Group Admin. |
| [`loading`](wireframes/61-audit-log.html?state=loading) | Initial loading | Skeleton. |
| [`empty`](wireframes/61-audit-log.html?state=empty) | Empty | "No entries yet". |
| [`no-results`](wireframes/61-audit-log.html?state=no-results) | No results | Filters and **Clear filters**. |
| [`server-error`](wireframes/61-audit-log.html?state=server-error) | Server error | Message with **Retry**. |

## Entity administration

### SCR-70 Users, SCR-71, and SCR-72 — [`70-users.html`](wireframes/70-users.html) · roles `entity-admin`, `group-admin` · [PNG Entity Admin](../images/entity-admin/70-users.png), [PNG Group Admin](../images/group-admin/70-users.png)

| # | Note |
|---|---|
| 1 | **Create user** opens SCR-71. |
| 2 | The Group Admin has an entity filter; the Entity Admin sees only the own entity (AC-02.8). |
| 3 | On the own row the role and status cannot be changed (AC-02.8). |
| 4 | SCR-71: name, unique email, role, entity, initial password of at least 8 characters, ERP user link (DF-32, DF-14). The Entity Admin can choose only AP Accountant, Chief Accountant, or Payment Approver, in the own entity. |
| 5 | SCR-72 states the effect of deactivation. |

| State | Source | Behavior |
|---|---|---|
| default | Initial | Calderwood Foods Co. users; Group Admin also sees Gina and Dina. Other entities have no sample users (DF-12). |
| [`loading`](wireframes/70-users.html?state=loading) | Initial loading | Skeleton. |
| [`no-results`](wireframes/70-users.html?state=no-results) | No results | Entity filter with **Clear filters**. |
| [`server-error`](wireframes/70-users.html?state=server-error) | Server error | Message with **Retry**. |
| [`create`](wireframes/70-users.html?state=create) | SCR-71 | Empty form ([PNG](../images/entity-admin/70b-users-create.png)). |
| [`edit`](wireframes/70-users.html?state=edit) | SCR-71 | Edit Dan; no password field. |
| [`email-error`](wireframes/70-users.html?state=email-error) | Validation error | "Email already in use" (AC-02.7) ([PNG](../images/entity-admin/70c-users-email-error.png)). |
| [`role-error`](wireframes/70-users.html?state=role-error) | Validation error | "A user has one role in one entity in the MVP" (AC-02.3). |
| [`saving`](wireframes/70-users.html?state=saving) | Saving | Button disabled. |
| [`deactivate`](wireframes/70-users.html?state=deactivate) | SCR-72, Destructive confirmation | No login, open sessions end on the next request, earlier decisions and signatures stay (AC-02.5) ([PNG](../images/entity-admin/70d-users-deactivate.png)). |
| [`conflict`](wireframes/70-users.html?state=conflict) | Conflict | Reload message. |

### SCR-73 Entity Policy — [`73-entity-policy.html`](wireframes/73-entity-policy.html) · role `entity-admin` · [PNG](../images/entity-admin/73-entity-policy.png)

| # | Note |
|---|---|
| 1 | Price tolerance 2% with the group maximum of 5% next to it (AC-04.2, DF-13). |
| 2 | Sample rate between 1% and 100% (Step 3). |
| 3 | New values apply to invoices checked afterwards (Step 3). |

| State | Source | Behavior |
|---|---|---|
| default | Initial | Tolerance 2%, batch threshold VND 200,000,000, sample rate 10%, grouping by supplier. |
| [`loading`](wireframes/73-entity-policy.html?state=loading) | Initial loading | Skeleton. |
| [`validation-error`](wireframes/73-entity-policy.html?state=validation-error) | Validation error | "Maximum allowed by the group: 5%" (AC-04.2) and the sample-rate message; first error focused; nothing saved ([PNG](../images/entity-admin/73b-entity-policy-validation-error.png)). |
| [`saving`](wireframes/73-entity-policy.html?state=saving) | Saving | Button disabled. |
| [`saved`](wireframes/73-entity-policy.html?state=saved) | Success | Toast. |
| [`server-error`](wireframes/73-entity-policy.html?state=server-error) | Server error | Message with **Retry**. |
| [`conflict`](wireframes/73-entity-policy.html?state=conflict) | Conflict | Reload message; values kept. |

### SCR-74 Approval Matrix — [`74-approval-matrix.html`](wireframes/74-approval-matrix.html) · role `entity-admin` · [PNG](../images/entity-admin/74-approval-matrix.png)

| # | Note |
|---|---|
| 1 | Tiers: under VND 50,000,000 for the Department Head, VND 50,000,000 and over for the CFO (AC-05.1). |
| 2 | A gap or an overlap lists the uncovered amounts (AC-05.2). |
| 3 | "No approver for VND 50,000,000 and over" (AC-05.3). |
| 4 | Requests not yet signed are recomputed (AC-05.4). |

| State | Source | Behavior |
|---|---|---|
| default | Initial | Two tiers with Dan and Fiona. |
| [`loading`](wireframes/74-approval-matrix.html?state=loading) | Initial loading | Skeleton. |
| [`gap-error`](wireframes/74-approval-matrix.html?state=gap-error) | Validation error | Uncovered range named; nothing saved ([PNG](../images/entity-admin/74b-approval-matrix-gap-error.png)). |
| [`no-approver`](wireframes/74-approval-matrix.html?state=no-approver) | Validation error | The AC-05.3 message ([PNG](../images/entity-admin/74c-approval-matrix-no-approver.png)). |
| [`saving`](wireframes/74-approval-matrix.html?state=saving) | Saving | Button disabled. |
| [`saved`](wireframes/74-approval-matrix.html?state=saved) | Success | Toast. |
| [`server-error`](wireframes/74-approval-matrix.html?state=server-error) | Server error | Message with **Retry**. |
| [`conflict`](wireframes/74-approval-matrix.html?state=conflict) | Conflict | Reload message. |

## Group administration

### SCR-75 Group Overview — [`75-group-overview.html`](wireframes/75-group-overview.html) · role `group-admin` · [PNG](../images/group-admin/75-group-overview.png)

Purpose: the Group Admin's home page, built from US-06 and US-07 (D-39). Counts only.

| # | Note |
|---|---|
| 1 | No invoice, batch, request, or audit entry of an entity is shown (BR-09). |
| 2 | Gate alert with the recommendation to close the gate; the gate stays as it is until the Group Admin acts (AC-06.7, BR-06). |
| 3 | Last ERP sync per entity with a failure marker for Calderwood Retail Co. (US-07, AC-07.7). |
| 4 | Links to SCR-78 and SCR-70. |

| State | Source | Behavior |
|---|---|---|
| default | Initial | Three entities, one gate alert, one failed sync. |
| [`loading`](wireframes/75-group-overview.html?state=loading) | Initial loading | Skeleton. |
| [`no-alerts`](wireframes/75-group-overview.html?state=no-alerts) | Gate alert (inverse) | "No gate alerts." |
| [`server-error`](wireframes/75-group-overview.html?state=server-error) | Server error | Message with **Retry**. |

### SCR-76 Entities and Group Limits and SCR-77 — [`76-entities.html`](wireframes/76-entities.html) · role `group-admin` · [PNG](../images/group-admin/76-entities.png)

| # | Note |
|---|---|
| 1 | **Add entity** opens SCR-77. |
| 2 | Group maximums: price tolerance 5% and batch threshold VND 300,000,000 (DF-13); the sector list (DF-25). |
| 3 | Lowering a maximum below an entity value says that the value will be lowered (Step 3). |
| 4 | SCR-77: entity name and a unique 10-digit tax code (US-03). |

| State | Source | Behavior |
|---|---|---|
| default | Initial | Three entities with their own tolerance and threshold. |
| [`loading`](wireframes/76-entities.html?state=loading) | Initial loading | Skeleton. |
| [`lower-warning`](wireframes/76-entities.html?state=lower-warning) | Validation error | Maximum 3% lowers Calderwood Packaging Co. from 4% ([PNG](../images/group-admin/76b-entities-lower-warning.png)). |
| [`saved`](wireframes/76-entities.html?state=saved) | Success | Toast. |
| [`server-error`](wireframes/76-entities.html?state=server-error) | Server error | Message with **Retry**. |
| [`conflict`](wireframes/76-entities.html?state=conflict) | Conflict | Reload message. |
| [`add`](wireframes/76-entities.html?state=add) | SCR-77 | Form ([PNG](../images/group-admin/76c-entities-add.png)). |
| [`add-duplicate`](wireframes/76-entities.html?state=add-duplicate) | Validation error | Duplicate tax code. Copy proposed. |
| [`add-invalid`](wireframes/76-entities.html?state=add-invalid) | Validation error | Tax code without 10 digits. Copy proposed. |

### SCR-78 Automation Gates and SCR-79 — [`78-automation-gates.html`](wireframes/78-automation-gates.html) · role `group-admin` · [PNG](../images/group-admin/78-automation-gates.png)

Purpose: one gate for each supplier and entity pair, with counts and accuracy and no invoice contents (US-06, DF-49).

| # | Note |
|---|---|
| 1 | Compared invoices; at least 50 are needed before a gate can open (DF-16). |
| 2 | Accuracy next to the 98% threshold, as a number, a meter with a tick, and the words "Below threshold" or "Above threshold" (AC-06.5). |
| 3 | "Simulated history" beside the seeded figures (AC-06.10, DF-33). |
| 4 | Alert: sample errors of 7.7% (2 of 26) above 2% in 30 days; closing is recommended and nothing closes by itself (AC-06.7, DF-16). |
| 5 | SCR-79 opens or closes one gate. |

| State | Source | Behavior |
|---|---|---|
| default | Initial | Five pairs. |
| [`loading`](wireframes/78-automation-gates.html?state=loading) | Initial loading | Skeleton. |
| [`server-error`](wireframes/78-automation-gates.html?state=server-error) | Server error | Message with **Retry**. |
| [`open-ready`](wireframes/78-automation-gates.html?state=open-ready) | Simulated history | Brightfield Paper Ltd and Calderwood Foods Co.: 50 compared, 98.0% (49 of 50), "Simulated history"; **Open gate** enabled ([PNG](../images/group-admin/78b-automation-gates-open-ready.png)). |
| [`open-disabled`](wireframes/78-automation-gates.html?state=open-disabled) | Too few compared invoices | 30 compared: "At least 50 compared invoices are needed"; **Open gate** disabled (AC-06.4) ([PNG](../images/group-admin/78c-automation-gates-open-disabled.png)). |
| [`open-below`](wireframes/78-automation-gates.html?state=open-below) | Gate accuracy below the threshold | 52 compared at 94.2%; a written reason is required (AC-06.5) ([PNG](../images/group-admin/78d-automation-gates-open-below.png)). |
| [`open-below-error`](wireframes/78-automation-gates.html?state=open-below-error) | Validation error | "A reason is required to open a gate below the threshold." Copy proposed. |
| [`close`](wireframes/78-automation-gates.html?state=close) | Destructive confirmation | Later invoices of the pair become exceptions "Gate closed". |
| [`conflict`](wireframes/78-automation-gates.html?state=conflict) | Conflict | Reload message; reason kept. |

## Demo

### SCR-80 ERP Simulator, SCR-81, and SCR-82 — [`80-erp-simulator.html`](wireframes/80-erp-simulator.html) · role `demo` · [PNG](../images/demo-operator/80-erp-simulator.png)

Purpose: the Demo Operator plays the buyer, the warehouse keeper, and the acceptor so that separation of duties (BR-02) can be shown (D-12). "Demo only" is in the top bar, in a banner, and on every card and modal.

| # | Note |
|---|---|
| 1 | Banner "Demo only" (AC-08.7). |
| 2 | Entity selector and persona selector (buyer, warehouse keeper, acceptor). The entity is chosen here and not in the top bar (DF-36). |
| 3 | **New purchase order** for the buyer; **Confirm receipt** for the other personas. |
| 4 | Confirm a receipt from a row of an order. |
| 5 | SCR-81: supplier, kind, lines; the creator is the persona chosen on the page. |
| 6 | SCR-82: order reference (required), quantity, delivery note ("60 of 100 received, 40 outstanding"). No field takes data from an invoice (BR-13). |

| State | Source | Behavior |
|---|---|---|
| default | Initial | Persona buyer; four orders and three receipts. |
| [`warehouse`](wireframes/80-erp-simulator.html?state=warehouse) | Persona | Persona warehouse keeper; **Confirm receipt** on the rows. |
| [`loading`](wireframes/80-erp-simulator.html?state=loading) | Initial loading | Skeleton. |
| [`empty`](wireframes/80-erp-simulator.html?state=empty) | Empty | "No purchase orders yet". |
| [`server-error`](wireframes/80-erp-simulator.html?state=server-error) | Server error | Message with **Retry**. |
| [`po-form`](wireframes/80-erp-simulator.html?state=po-form) | SCR-81 | Form ([PNG](../images/demo-operator/80b-erp-simulator-po-form.png)). |
| [`po-error`](wireframes/80-erp-simulator.html?state=po-error) | Validation error | Missing item. Copy proposed. |
| [`receipt-form`](wireframes/80-erp-simulator.html?state=receipt-form) | SCR-82 | Form ([PNG](../images/demo-operator/80c-erp-simulator-receipt-form.png)). |
| [`receipt-no-order`](wireframes/80-erp-simulator.html?state=receipt-no-order) | Validation error | A receipt needs an order reference (BR-13). Copy proposed. |
| [`receipt-same-persona`](wireframes/80-erp-simulator.html?state=receipt-same-persona) | Validation error | "The receipt must be confirmed by a different person than the order creator" (AC-08.3) ([PNG](../images/demo-operator/80d-erp-simulator-receipt-same-persona.png)). |

**Related:** [Step index](README.md) · [Design system](01-design-system.md) · [Screen inventory](../03-information-architecture/04-screen-inventory.md)
