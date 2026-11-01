# Screen Notes and States

> Design status: MVP — Step 4 of 9, approved
>
> Implementation status: NOT STARTED
>
> Revision R1 (UX redesign, 2026-11-01): approved

Each page lists its purpose, the yellow annotation numbers shown in the HTML, and its states. The **Source** column names the row of the [UI/UX state contract](../03-information-architecture/06-ui-states-and-accessibility.md) (Step 3) that each state implements, or the rule or acceptance criterion behind it. Open a state with `?state=<name>` and a role with `?role=<name>` (roles: `ap`, `chief`, `approver`, `dept`, `entity-admin`, `group-admin`, `demo`). Modals are states of their parent page and have their own `####` heading. Sample data is the Calderwood Group (DF-12, DF-46). The design language is in the [design system](01-design-system.md).

**Mind map sync (D-88, approved).** Four pages (SCR-22, SCR-24, SCR-55, SCR-62) and six modals or drawers (SCR-19, SCR-23, SCR-33, SCR-34, SCR-56, SCR-57) were added, the seventh role `dept` (Requesting Department, home page SCR-22) joined the control bar and the sidebar, the top bar of the three finance roles shows **Notifications** with the number of unread items, and SCR-10, SCR-12, SCR-30, SCR-50, SCR-51, and SCR-90 gained the states listed under them. The new calls are D-108..D-117 and DF-73..DF-76 in [the decisions](00-decisions.md#mind-map-sync-d-88-approved). Every PNG was exported again because the top bar changed.

**Revision R1 (approved, D-73..D-81).** The pages are laid out as object pages (SCR-12, SCR-51) or as lists with tiles, saved-view tabs, a toolbar, and one-line rows (SCR-10, SCR-20, SCR-40, SCR-50, and others); forms with more than three fields open in a drawer. Each page below has a **Layout (R1)** line that names these parts. The yellow numbers keep their meaning; R1 adds one number (SCR-10, note 8). Two query parameters are new: `?tab=<id>` selects a tab and `?filters=1` opens the filter panel. **A tab is a view of the same page, not a state**: it never changes the item, it is not in the control bar, and it is not a row in the state tables. The state rows and their links are unchanged.

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

Purpose: the one answer to a URL the role may not open or a record of another entity. Roles: any (try `?role=ap`, `chief`, `entity-admin`, `dept`, `demo`). The Requesting Department gets this page on every URL except the acceptance queue (AC-29.8).

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

**Layout (R1):** a header (title "Invoices", the last ERP sync as meta, **Upload XML** as the one primary action); four tiles (Open exceptions 6, Due within 7 days 2, In batch 5 with VND 70,050,000, Waiting for goods 1) that open the matching tab; five saved-view tabs; a toolbar (search, **Filters** with a count, chips such as **Reminder due**); one-line rows with a chevron; and a footer with the range and paging. Tabs: `needs` Needs action 6 (exceptions, the default), `waiting` Waiting 3 (Waiting for Goods, In Check, Received), `batch` In batch 5, `done` Completed 4 (Sent, Paid, Rejected), `all` All 18. The row shows one reason tag and a "+N" pill; the Reminder due note ("request sent 22/10/2026, no reply") is the tooltip of the tag. The Chief Accountant and the Payment Approver get the same layout without **Upload XML** and without re-run.

| # | Note |
|---|---|
| 1 | "Last ERP sync: 31/10/2026 09:15" (US-07). |
| 2 | **Upload XML** opens SCR-11. AP Accountant only. |
| 3 | Filters (behind the **Filters** button, or `?filters=1`): state, supplier, flow, invoice date, and **Reminder due** for correction requests with no reply after 5 working days (AC-17.7, DF-21). The sidebar badge "6" counts the open exceptions. |
| 4 | "No results" names the active filters and offers **Clear filters** (AC-17.7). |
| 5 | An invoice with the reason "AI unavailable" can be re-run from the worklist; there is no automatic retry (DF-08). Rows also show: "Due soon" within 7 days (AC-17.8, DF-18); Waiting for Goods as a non-exception (BR-14); the reason numbers of AC-16.2; and the payment reference once Paid (AC-26.2). |
| 8 | The saved-view tabs (Needs action, Waiting, In batch, Completed, All) with their counts. They are views of one table and not states: `?tab=needs`, `waiting`, `batch`, `done`, or `all` selects one (R1, D-74). |
| 9 | **Source** column: a tag "Upload" or "Email" for each invoice, and a Source filter in the filter panel (DF-72, D-115). |
| 10 | The search box finds an invoice in any state, including Paid, Rejected, and Superseded, by part of the number, part of the supplier name, or the exact total; the result can be narrowed by state (AC-17.10, DF-68). An invoice that exists only in another entity gives "No invoice found" and no hint (AC-17.13, BR-09). |
| 11 | A lookup at the simulated tax authority that does not answer within 10 seconds makes the exception "Authority status unavailable"; the invoice is never admitted with an unknown status and the other files are processed (AC-10.15). |
| 12 | **Run lookup again** (AP Accountant only) repeats the lookup from the list; the Chief Accountant and the Payment Approver see a chevron only (AC-10.15, DF-64). |

| State | Source | Behavior |
|---|---|---|
| default | Initial | 18 invoices with every invoice state except Separated and Superseded, which have no DF-12 sample (they are in the [design system](01-design-system.md)). |
| [`loading`](wireframes/10-invoice-worklist.html?state=loading) | Initial loading | Filters and shell stay; skeleton rows. |
| [`empty`](wireframes/10-invoice-worklist.html?state=empty) | Empty | "No invoices yet" with **Upload XML** for the AP Accountant and a plain sentence for the other roles ([PNG](../images/ap-accountant/10d-invoice-worklist-empty.png)). |
| [`no-results`](wireframes/10-invoice-worklist.html?state=no-results) | No results | The filters and **Clear filters** (AC-17.7). |
| [`stale`](wireframes/10-invoice-worklist.html?state=stale) | Stale data | "ERP sync failed. Data shown is from 31/10/2026 09:15." (AC-07.7) ([PNG](../images/ap-accountant/10e-invoice-worklist-stale.png)). |
| [`server-error`](wireframes/10-invoice-worklist.html?state=server-error) | Server error | A short message and **Retry**. |
| [`authority-unavailable`](wireframes/10-invoice-worklist.html?state=authority-unavailable) | Authority status unavailable (AC-10.15) | C26TAA-0000142 is a seventh open exception with **Run lookup again**; the tile, the Needs action tab, and the sidebar badge read 7 ([PNG](../images/ap-accountant/10h-invoice-worklist-authority-unavailable.png)). |
| [`search`](wireframes/10-invoice-worklist.html?state=search) | Search (AC-17.10) | The search "Harbor" lists eight invoices of Harbor Cartons Ltd in six states, with a **Narrow by state** control ([PNG](../images/ap-accountant/10f-invoice-worklist-search.png)). |
| [`search-none`](wireframes/10-invoice-worklist.html?state=search-none) | No invoice found (AC-17.13) | "No invoice found" for a number that is not in this entity; nothing hints that it exists elsewhere ([PNG](../images/ap-accountant/10g-invoice-worklist-search-none.png)). |

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

**Layout (R1):** an object page. The header shows the number, the state chips, the exception reasons, the amount, and the key facts; the stepper runs Received, Checked, Exception (only while the invoice is an exception), In Batch, In Request, Sent, Paid; the evidence sits in tabs `overview` (default: the attention card with the failed conditions in short form, key facts, flow and identification, anomaly numbers), `lines` (line matches), `checks` (the six conditions; passed ones fold under "N passed"), `documents` (XML fields, order, and receipt with their sync times), `anomalies`, and `history` (the latest three events, "Show all" for the rest). Which tabs exist depends on the state (for example `paid` has `overview` and `history`). The right column is the action panel: one next step with one primary button, other resolutions as compact rows, **Report wrong entity** under **More actions**, and **Reject invoice** as a quiet danger link. The header carries no action button (D-82). `?tab=<id>` opens a tab.

| # | Note |
|---|---|
| 1 | Exception reasons with their numbers, for example "Price +2.5%, tolerance 2%" (AC-16.2). In the header. |
| 2 | Flow with the AI tag; the flow, its reason, and its confidence are stored (AC-12.1). In the key facts of the header. |
| 3 | The order and the receipt each show the time of the sync they came from (US-07, Step 3 sync-time state). On the `documents` tab. |
| 4 | Flow and identification: AI reason, confidence 0.97, model and prompt versions (BR-12). On the `overview` tab; the long reasoning folds under "Why the AI proposed this". |
| 5 | Line matches with the method (mapping table, embedding with signal fusion, LLM) and the probability against the 0.90 threshold; a doubtful line says why (AC-14.1, AC-14.5, DF-15). On the `lines` tab. |
| 6 | Anomaly numbers: price against the 6-month median, near-duplicate, supplier history, period (AC-15.1, AC-15.3, AC-15.7). On the `overview` tab and in full on the `anomalies` tab. |
| 7 | The six conditions of BR-05, each with its value and Pass or Fail, set by the Rule Engine without an LLM (AC-16.2, AC-16.3). The attention card on `overview` lists the failed ones; the `checks` tab lists all six, with the passed ones folded under "N passed". |
| 8 | Decision history: who or what decided, with the three tags (AC-17.3). On the `history` tab; the latest three events show, the rest open with "Show all". |
| 9 | Action panel for the AP Accountant: confirm a line match, correct the flow, report a wrong entity, request a correction, send for a decision, reject (US-18). Chief Accountant and Payment Approver see a notice that nothing waits for them. |
| 10 | In the default invoice: **Request correction** opens SCR-14. In other cases: the hold decision (SCR-16), the individual approval (SCR-18), the only action for a foreign invoice, or **Withdraw from batch** (AC-24.7). |
| 11 | **Reject invoice** opens SCR-15. |
| 12 | **Send for a decision** (state Waiting for Decision) for a reason another role decides. |
| 13 | Conflict: "This item was changed by someone else. Reload to see the change." (BR-37). |
| 14 | Audit write failure: the action is not completed (DF-30). |
| 15 | **Report wrong entity** (D-68): the invoice is never moved to another entity. The page shows the traced mismatch (buyer tax code, buyer name, order reference, ERP supplier, each on the invoice against this entity), a required note, and the reason that will be added: "Wrong buyer tax code" or "Wrong entity reported". Afterwards the exception is resolved by a reissue request (SCR-14) or Reject (SCR-15); no individual approval. |
| 16 | **Record cancellation notice** opens SCR-19. It is a quiet action in the panel of an invoice that is In Batch, in the **More actions** menu of an exception, and a control beside a Paid invoice (AC-18.13 to AC-18.16). |
| 17 | **Authority status** in the key facts of every invoice: the word (Valid, Adjusted, Cancelled, Replaced, or unavailable), and the time of the lookup (AC-10.16, D-114). |
| 18 | **Source** tag beside the state chips: Upload or Email (DF-72, D-114). |
| 19 | The result of a recorded notice: the invoice is Rejected with "Cancelled by the seller", and the total and the level of its request are recomputed (AC-18.13). |
| 20 | A stored cancellation notice is a warning on an invoice that is Sent or Paid: no state changes and the case is handled outside the system (AC-18.15). |
| 21 | The service acceptance record: who confirmed, when, the note, and the source, the Requesting Department or the ERP (AC-29.2, AC-29.4). |

| State | Source | Behavior |
|---|---|---|
| default | Initial | AP Accountant, exception In Review. With `role=chief` or `role=approver` the evidence is the same, read-only, with no action panel. |
| [`loading`](wireframes/12-invoice-detail.html?state=loading) | Initial loading | Skeleton for the header and the panels. |
| [`server-error`](wireframes/12-invoice-detail.html?state=server-error) | Server error | Message with **Retry**. |
| [`checking`](wireframes/12-invoice-detail.html?state=checking) | Classification, reading, matching in progress | Invoice C26TAA-0000165 In Check; AI panels say "Checking…", the page stays usable. |
| [`confirm-line`](wireframes/12-invoice-detail.html?state=confirm-line) | Line match with method (DF-41) | Inline confirmation that saves the pair to the mapping table with name and time (AC-18.2). |
| [`correct`](wireframes/12-invoice-detail.html?state=correct) | Flow unclear (DF-41) | Inline choice of the flow. Entity is no longer offered (D-68). |
| [`wrong-entity`](wireframes/12-invoice-detail.html?state=wrong-entity&role=ap) | Wrong entity reported (D-68) | C26TAA-0000123: the traced mismatch table (the tax code is the same, the buyer name on the XML names another company, the order and the supplier are found), the reason that will be added, a required note, and **Report wrong entity** ([PNG](../images/ap-accountant/12i-invoice-detail-wrong-entity.png)). |
| [`ai-failure`](wireframes/12-invoice-detail.html?state=ai-failure) | AI failure at intake | C26TAA-0000140: reason "AI unavailable"; the Rule Engine conditions read "Not evaluated"; re-run from the worklist; no automatic retry (AC-12.5, DF-08) ([PNG](../images/ap-accountant/12d-invoice-detail-ai-failure.png)). |
| [`foreign`](wireframes/12-invoice-detail.html?state=foreign) | Unsupported: foreign invoice | TM-2026-0415 from Tempest Marketing GmbH: the only action is Reject; individual approval and sending for a decision are not offered (AC-12.9, D-31) ([PNG](../images/ap-accountant/12e-invoice-detail-foreign.png)). |
| [`in-batch`](wireframes/12-invoice-detail.html?state=in-batch) | BR-33 `In Batch` | C26TAA-0000098: all six conditions pass; withdraw with a required reason until the request is fully signed (DF-07) ([PNG](../images/ap-accountant/12f-invoice-detail-in-batch.png)). |
| [`acceptance`](wireframes/12-invoice-detail.html?state=acceptance&role=ap) | Service acceptance (AC-29.2) | C26TAA-0000150 from Lakeside Facility Services Ltd, source Email, In Batch after the Requesting Department confirmed the acceptance: the acceptance card, the state history of four events, and no receipt ([PNG](../images/ap-accountant/12m-invoice-detail-acceptance.png)). |
| [`cancel-recorded`](wireframes/12-invoice-detail.html?state=cancel-recorded&role=ap) | Cancellation recorded (AC-18.13) | C26TAA-0000098 is Rejected with "Cancelled by the seller"; PR-0042 now totals VND 26,600,000 at the Department Head level ([PNG](../images/ap-accountant/12k-invoice-detail-cancel-recorded.png)). |
| [`cancel-stored`](wireframes/12-invoice-detail.html?state=cancel-stored&role=ap) | Notice on a Paid invoice (AC-18.15) | C26TAA-0000081 is Paid; the notice SC-2026-114 is stored as a warning and nothing changes ([PNG](../images/ap-accountant/12l-invoice-detail-cancel-stored.png)). |
| [`paid`](wireframes/12-invoice-detail.html?state=paid) | ERP send states, Paid | C26TAA-0000081: request PR-0038, two signature records, payment reference PAY-CF-2026-0042 (AC-25.15, AC-26.2) ([PNG](../images/ap-accountant/12g-invoice-detail-paid.png)). |
| [`hold`](wireframes/12-invoice-detail.html?state=hold&role=chief) | Tax-risk hold (D-37) | C26TAA-0000188 from Eastbay Trading: list entry with source and date. `role=chief` has **Decide on the hold**; `role=ap` sees "Waiting for the Chief Accountant" ([PNG](../images/chief-accountant/12-invoice-detail-hold.png)). |
| [`approve`](wireframes/12-invoice-detail.html?state=approve&role=approver) | Individual approval (D-37) | C26TAA-0000151, VND 63,800,000, level CFO; `role=approver` has **Review and decide** ([PNG](../images/payment-approver/12-invoice-detail-approve.png)). |
| [`conflict`](wireframes/12-invoice-detail.html?state=conflict) | Conflict | Notice with **Reload**; nothing saved; input kept ([PNG](../images/ap-accountant/12h-invoice-detail-conflict.png)). |
| [`audit-error`](wireframes/12-invoice-detail.html?state=audit-error) | Audit write failure | "Action not completed. The audit log could not be written. Try again." with **Retry**. |

#### SCR-19 Record Cancellation Notice (state of SCR-12)

Purpose: the AP Accountant records a notice from the seller that an invoice is cancelled. The modal says what will happen for the state of the invoice; the other states are folded under "The effect for other states" (D-113).

| State | Source | Behavior |
|---|---|---|
| [`cancel-notice`](wireframes/12-invoice-detail.html?state=cancel-notice&role=ap) | SCR-19 | Reference, date, and the notice as a file; the effect for an invoice that is In Batch in a request that is not yet signed ([PNG](../images/ap-accountant/12j-invoice-detail-cancel-notice.png)). |
| [`cancel-notice-error`](wireframes/12-invoice-detail.html?state=cancel-notice-error&role=ap) | Validation error | "A reference of the notice is required." and "Attach the notice as a file." The copy is proposed. |

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
| [`approve-split`](wireframes/12-invoice-detail.html?state=approve-split&role=approver) | Split orders (BR-10, D-70) | C26TAA-0000160 with its two linked invoices and the combined amount VND 53,000,000 that sets the level (CFO); the action panel says the three exceptions are decided together ([PNG](../images/payment-approver/12d-invoice-detail-approve-split.png)). |
| [`approve-split-modal`](wireframes/12-invoice-detail.html?state=approve-split-modal&role=approver) | Split orders (BR-10, D-70) | The three linked invoices, the combined amount, the level, one **Approve all three** and one **Decline all three** with a reason; no control for a single invoice; a note that a block or a change on one invoice saves nothing for any (AC-23.11, AC-23.12) ([PNG](../images/payment-approver/12e-invoice-detail-approve-split-modal.png)). |

## Recurring profiles

### SCR-20 Recurring Profiles and SCR-21 — [`20-recurring-profiles.html`](wireframes/20-recurring-profiles.html) · role `ap` · [PNG](../images/ap-accountant/20-recurring-profiles.png)

Purpose: the contracts that repeat each period; a matching profile is the independent source for a recurring invoice (BR-17, BR-24).

**Layout (R1):** a header with **Add profile**; tabs `active` Active 3 (default), `inactive` Inactive 1, `all` All 4; a compact table with one line per profile; SCR-21 as a right drawer (states `form`, `form-error`, `form-duplicate`, `form-saving`); the deactivate confirmation stays a centered modal.

| # | Note |
|---|---|
| 1 | **Add profile** opens SCR-21. |
| 2 | Each profile shows the amounts of earlier periods and their average, so the usage-based 30% limit can be checked (AC-09.1, DF-11). |
| 3 | **Deactivate** states that later invoices become exceptions. |
| 4 | SCR-21: supplier, location, contract, period, price type, contract price (required for a fixed price), deviation threshold. SCR-21 opens as a right drawer. |

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

## Acceptance and mailbox

### SCR-22 Acceptance Queue and SCR-23 — [`22-acceptance-queue.html`](wireframes/22-acceptance-queue.html) · role `dept` · [PNG](../images/requesting-department/22-acceptance-queue.png)

Purpose: the one page of the Requesting Department (Rowan, D-90, D-101). It lists the service invoices of Calderwood Foods Co. that wait for an acceptance because the ERP holds none, so that Rowan can confirm that the service was delivered or reject it with a note (AC-29.1 to AC-29.9). A goods invoice is never listed (AC-29.5).

**Layout (R1):** a header with the title and one line of meta (no primary action: each row has its own **Review**); three tiles (Waiting for acceptance 3 with the total, Due within 7 days 1, Oldest 4 days); a toolbar (search, **Filters** with the supplier, the **Due soon** chip, the count); and one-line rows with the invoice and supplier, the order, the service lines, the amount, the due date, and **Review**. SCR-23 is a centered modal because it has one field.

| # | Note |
|---|---|
| 1 | Only service invoices that are Waiting for Goods because the ERP holds no acceptance for the order are listed; an invoice leaves the list when the ERP records an acceptance (AC-29.1, AC-29.4). |
| 2 | **Review** opens SCR-23 for the row. |
| 3 | The "Due soon" mark for a due date within 7 days (AC-29.1, AC-17.8). |
| 4 | The page shows no other invoice data and has no link to SCR-12 (Step 3, SCR-22). |
| 5 | SCR-23: a note, required to reject, optional to confirm. It is saved with the name and the time (AC-29.2, AC-29.9). |
| 6 | "A note is required to reject." The copy is proposed (AC-29.3). |
| 7 | "You created the order for this invoice."; both actions are disabled (AC-29.6, BR-02). |
| 8 | The result says what happened: the invoice is In Batch when all six conditions hold, or it is the exception "Service acceptance rejected" and the AP Accountant is told (AC-29.2, AC-29.3). |

| State | Source | Behavior |
|---|---|---|
| default | Initial | Three service invoices; C26TAA-0000150 (Lakeside Facility Services Ltd, PO-CF-1020, VND 12,000,000) is due soon. |
| [`loading`](wireframes/22-acceptance-queue.html?state=loading) | Acceptance queue loading | Header and toolbar stay; skeleton rows. |
| [`empty`](wireframes/22-acceptance-queue.html?state=empty) | Acceptance queue empty | "No service invoices wait for acceptance" with a plain sentence and no action ([PNG](../images/requesting-department/22g-acceptance-queue-empty.png)). |
| [`no-results`](wireframes/22-acceptance-queue.html?state=no-results) | No results | The filter chips and **Clear filters**. |
| [`server-error`](wireframes/22-acceptance-queue.html?state=server-error) | Acceptance queue error | A short message and **Retry**. |
| [`accepted`](wireframes/22-acceptance-queue.html?state=accepted) | Acceptance saved | C26TAA-0000150 left the queue and is In Batch; the tiles read 2 ([PNG](../images/requesting-department/22e-acceptance-queue-accepted.png)). |
| [`rejected`](wireframes/22-acceptance-queue.html?state=rejected) | Acceptance saved | C26TAA-0000150 left the queue as the exception "Service acceptance rejected" ([PNG](../images/requesting-department/22f-acceptance-queue-rejected.png)). |

#### SCR-23 Confirm or Reject Acceptance (state of SCR-22)

| State | Source | Behavior |
|---|---|---|
| [`confirm`](wireframes/22-acceptance-queue.html?state=confirm) | SCR-23 | Invoice, order, service lines, amount, due date, a note, **Reject acceptance**, and **Confirm acceptance** ([PNG](../images/requesting-department/22b-acceptance-queue-confirm.png)). |
| [`reject-error`](wireframes/22-acceptance-queue.html?state=reject-error) | Rejection without a note | "A note is required to reject." ([PNG](../images/requesting-department/22c-acceptance-queue-reject-error.png)). |
| [`blocked`](wireframes/22-acceptance-queue.html?state=blocked) | Order creator blocked | "You created the order for this invoice."; both actions are disabled ([PNG](../images/requesting-department/22d-acceptance-queue-blocked.png)). |
| [`conflict`](wireframes/22-acceptance-queue.html?state=conflict) | Conflict | The reload message; nothing is saved (AC-29.7, BR-37). |

### SCR-24 Mailbox Log — [`24-mailbox-log.html`](wireframes/24-mailbox-log.html) · role `ap` · [PNG](../images/ap-accountant/24-mailbox-log.png)

Purpose: the log of the simulated mailbox of the entity (invoices-foods@calderwood.example): each message and the result of each attachment (AC-31.1 to AC-31.9). An accepted attachment is an invoice with the source Email (DF-72).

**Layout (R1):** a header with the mailbox address, the time of the last successful fetch, and **Fetch now** as the one primary action; four tiles (Messages, Invoices created, Rejected attachments, No attachment); saved-view tabs `all` All 8 (default), `accepted` Accepted 3, `rejected` Rejected 4, `none` No attachment 1; a toolbar; one-line rows with the message, the time, the attachment, the result chip, and the invoice or the reason.

| # | Note |
|---|---|
| 1 | The time of the last successful fetch; the mailbox is also read every 15 minutes (DF-63). |
| 2 | **Fetch now** starts a fetch at once. |
| 3 | One row for each attachment. Accepted rows link to the invoice on SCR-10; a rejected row names its reason, for example "Only XML e-invoices are accepted in the MVP" or "An invoice with this seller, series, and number already exists"; a message with no attachment reads "No attachment" (AC-31.2 to AC-31.6). |
| 4 | The saved-view tabs filter by result; they are views and not states (`?tab=accepted`, `rejected`, `none`, `all`). |
| 5 | While a fetch runs, **Fetch now** is disabled and shows progress (Step 3, UI states). |
| 6 | A failed fetch shows the failure and the last successful time; earlier data stays and the next scheduled fetch tries again (AC-31.7). |

| State | Source | Behavior |
|---|---|---|
| default | Initial | Eight attachments in five messages, newest first. |
| [`loading`](wireframes/24-mailbox-log.html?state=loading) | Mailbox log loading | Skeleton rows. |
| [`empty`](wireframes/24-mailbox-log.html?state=empty) | Mailbox empty | "No messages have been fetched yet" with **Fetch now**. The copy is proposed ([PNG](../images/ap-accountant/24d-mailbox-log-empty.png)). |
| [`fetching`](wireframes/24-mailbox-log.html?state=fetching) | Fetching | **Fetch now** disabled with "Fetching..." and a notice ([PNG](../images/ap-accountant/24b-mailbox-log-fetching.png)). |
| [`fetch-failed`](wireframes/24-mailbox-log.html?state=fetch-failed) | Fetch failed (AC-31.7) | "The last fetch failed at 09:45: the mailbox did not answer." with the earlier data kept ([PNG](../images/ap-accountant/24c-mailbox-log-fetch-failed.png)). |
| [`server-error`](wireframes/24-mailbox-log.html?state=server-error) | Server error | A short message and **Retry**. |

## Batch

### SCR-30 Batch Review, SCR-31, and SCR-32 — [`30-batch-review.html`](wireframes/30-batch-review.html) · role `ap` · [PNG](../images/ap-accountant/30-batch-review.png)

Purpose: close the October 2026 batch (5 invoices, VND 70,050,000), check the AI-selected sample, release it for signing, and follow the ERP send status.

**Layout (R1):** a header with the batch state chip and the stepper Open, Closed for review, Sample checked, Released, Sent (the current step carries the exact state); the header action is **Close for review** or **Release for signing**; four tiles (Invoices, Total, Payment requests, Due soonest); the **Sample check** as a focused panel above the table while the sample is open; the invoices grouped under their supplier with a subtotal for each, because each supplier becomes one payment request (D-79); after release the **Payment requests** table with the ERP send status. SCR-31 and SCR-32 stay centered modals.

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
| 9 | **Expand sample** (SCR-33) while invoices remain outside the sample; the next invoices by risk, at least the original size again (AC-24.12, AC-24.13). |
| 10 | The expansion is saved with the name, the time, and the reason, and shown as a line in the sample panel; the batch cannot be released until the new items are marked (AC-24.12). |
| 11 | **Reopen for review** (SCR-34) while the batch is In Signing; refused when a request holds a signature (AC-24.15, AC-24.16). |
| 12 | **Resend** (SCR-57) in the failure alert after the 3 automatic attempts; the manual attempt is listed with the name and the time (AC-26.10, AC-26.11, D-116). |

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
| [`expanded`](wireframes/30-batch-review.html?state=expanded) | Sample expanded (AC-24.12) | A second item (C26TAA-0000099) was added with its history line; the first is marked OK and one item is still to mark ([PNG](../images/ap-accountant/30j-batch-review-expanded.png)). |
| [`reopened`](wireframes/30-batch-review.html?state=reopened) | Batch reopened (AC-24.15) | The batch is In Review again with every sample mark kept; the 3 requests were Cancelled ([PNG](../images/ap-accountant/30m-batch-review-reopened.png)). |
| [`sending`](wireframes/30-batch-review.html?state=sending) | ERP send states | PR-0042 Paid, PR-0043 "Retry 2 of 3, next attempt in 5 minutes", PR-0044 Sent ([PNG](../images/ap-accountant/30g-batch-review-erp-retry.png)). |
| [`send-failed`](wireframes/30-batch-review.html?state=send-failed) | ERP send states | "Sending to the ERP failed after 3 attempts." with **Resend** ([PNG](../images/ap-accountant/30h-batch-review-send-failed.png)). |
| [`resent`](wireframes/30-batch-review.html?state=resent) | Resend (AC-26.11) | PR-0043 is Sent again; the attempt reads "Manual attempt by Alice" with the time ([PNG](../images/ap-accountant/30o-batch-review-resent.png)). |

#### SCR-33 Expand Sample (state of SCR-30)

| State | Source | Behavior |
|---|---|---|
| [`expand`](wireframes/30-batch-review.html?state=expand) | SCR-33 | Current sample (1 invoice, none marked Error), 4 not yet in the sample, 1 to be added, a required reason, **Expand sample** ([PNG](../images/ap-accountant/30i-batch-review-expand.png)). When every invoice is already in the sample the action is disabled with "Every invoice is already in the sample" (AC-24.13); that case has no sample page and is not drawn. |

#### SCR-34 Reopen for Review (state of SCR-30)

| State | Source | Behavior |
|---|---|---|
| [`reopen`](wireframes/30-batch-review.html?state=reopen) | SCR-34 | 3 requests will be Cancelled, the invoices stay In Batch, sample marks and recorded approvals are kept, a required reason ([PNG](../images/ap-accountant/30k-batch-review-reopen.png)). |
| [`reopen-refused`](wireframes/30-batch-review.html?state=reopen-refused) | Reopen refused (AC-24.16) | PR-0043 holds the signature of Carol: "A request in this batch is already signed." and the action is disabled ([PNG](../images/ap-accountant/30l-batch-review-reopen-refused.png)). |

#### SCR-57 Resend to ERP (state of SCR-30 and SCR-51)

| State | Source | Behavior |
|---|---|---|
| [`resend`](wireframes/30-batch-review.html?state=resend) | SCR-57 | PR-0043 and its 3 failed automatic attempts; the same request number is the idempotency key, no new signature is asked, and the hash is checked first (AC-26.11, AC-26.12) ([PNG](../images/ap-accountant/30n-batch-review-resend.png)). The same modal on SCR-51 is the state `resend` there. |

## Decisions and signing

### SCR-40 Decision Queue — [`40-decision-queue.html`](wireframes/40-decision-queue.html) · roles `chief`, `approver` · [PNG Chief Accountant](../images/chief-accountant/40-decision-queue.png), [PNG Payment Approver](../images/payment-approver/40-decision-queue.png)

Purpose: one list, two roles (D-40). "Decisions" for the Chief Accountant (tax-risk holds), "Approvals" for the Payment Approver (exceptions at the approver level).

**Layout (R1):** role tiles (Waiting on me, Amount, Oldest); saved-view tabs for each role. Chief Accountant: `mine` Waiting on me, `hold` Tax-risk hold, `all` All. Payment Approver: `mine` Waiting on me, `price` Gate closed, unusual price, `dup` Possible duplicate, `all` All. A toolbar, one line per invoice with its reason tag, amount, and age, and a **Review** button, which is a real action: it opens SCR-12 where the decision is made.

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

**Layout (R1):** tiles (Ready for me, Total to sign, Waiting for others, With a flag); tabs `ready` Ready for me, `waiting` Waiting for others, `signed` Signed (the default is `ready` for the Chief Accountant and `waiting` for the Payment Approver, who has nothing ready until the Chief Accountant signs); a toolbar; a compact table with a checkbox, and a sticky bar "N selected, VND x" with **Sign selected**. SCR-52 stays a centered modal.

| # | Note |
|---|---|
| 1 | Filter by state; the default view is "To sign". |
| 2 | Required level, state chip, flags (New supplier, Bank account changed), and signatures so far (BR-30, AC-25.1). |
| 3 | The Payment Approver's action is disabled until the Chief Accountant has signed, and each row says why (AC-25.2, DF-01). |
| 4 | ERP status per request: "Retry 2 of 3, next attempt in 5 minutes" (DF-24). |
| 5 | After signing, the page stays and gives one result per request, including the refused ones (Step 3). |
| 6 | The sticky bar shows how many requests are selected and their total; it stays visible on a phone. |
| 7 | During an active delegation the delegate also sees the requests that wait for the delegator's level, marked **On behalf of Carol**; the delegate signs with their own password (AC-30.2, D-117). |
| 8 | The delegator's own signing action is disabled with "You delegated signing until 14/11/2026" and a link to the delegations page (AC-30.8, D-112). |
| 9 | SCR-52 for a delegate says "You are signing on behalf of Carol." (AC-30.2). |

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
| [`delegated`](wireframes/50-signing-queue.html?state=delegated&role=chief) | Delegator (AC-30.8) | Carol delegated signing to Fiona: the rows say "You delegated signing until 14/11/2026" and the bar is disabled ([PNG](../images/chief-accountant/50d-signing-queue-delegated.png)). |
| [`delegate`](wireframes/50-signing-queue.html?state=delegate&role=approver) | Delegate (AC-30.2) | Fiona sees PR-0042 and PR-0044 marked "On behalf of Carol" and can sign them; PR-0043 needs the Department Head level ([PNG](../images/payment-approver/50c-signing-queue-delegate.png)). |
| [`sign-delegate`](wireframes/50-signing-queue.html?state=sign-delegate&role=approver) | SCR-52 as a delegate | "You are signing on behalf of Carol." and the delegate's own password; the button names the delegator ([PNG](../images/payment-approver/50d-signing-queue-sign-delegate.png)). |
| [`erp-retry`](wireframes/50-signing-queue.html?state=erp-retry) | ERP send states | Sending and "Retry 2 of 3" rows. |
| [`erp-failed`](wireframes/50-signing-queue.html?state=erp-failed) | ERP send states | "Sending to the ERP failed after 3 attempts." |
| [`conflict`](wireframes/50-signing-queue.html?state=conflict&role=chief) | Conflict | Reload message; nothing signed; selection kept. |

### SCR-51 Payment Request Detail, SCR-53, and SCR-54 — [`51-payment-request.html`](wireframes/51-payment-request.html) · roles `chief`, `approver` · [PNG Chief Accountant](../images/chief-accountant/51-payment-request.png), [PNG Payment Approver](../images/payment-approver/51-payment-request.png)

Purpose: what the signer reads before signing PR-0042 (Harbor Cartons Ltd, VND 53,000,000, level CFO). There is no payment method and no cash flag: the MVP sends a non-cash instruction to the simulated ERP (AC-26.1, D-33).

**Layout (R1):** an object page. The header shows PR-0042, its chip, the amount, and the key facts (supplier, entity, required level, invoices, flags); the stepper runs Awaiting Chief Accountant, Awaiting Payment Approver, Signed, Sent, Paid; the left column holds the AI summary (it folds), the Rule Engine totals as a key-value grid, and tabs `invoices` Invoices 3 (default), `checks` Checks, `erp` ERP send; the right column is the signature panel with the signature records, one next step (**Sign**), and **Decline request** as a quiet danger link. The `paid` state shows the paid request PR-0038 with its paid block. SCR-53 and SCR-54 stay centered modals.

| # | Note |
|---|---|
| 1 | AI summary labelled as AI; it is never a signature (AC-25.1, AC-25.9). |
| 2 | When the summary fails: "The AI summary is unavailable. You can still sign using the evidence." (AC-25.13). |
| 3 | Rule Engine totals by entity and supplier, invoices of VND 50,000,000 or more, and the sample-check result (AC-25.1). The totals are a grid above the tabs; the sample-check result is on the `checks` tab. |
| 4 | Flags for a new supplier or a changed bank account (BR-30). None on this request. |
| 5 | **Remove line** opens SCR-53. On the `invoices` tab. |
| 6 | Signature records: Carol first, Fiona second; pending ones are dashed (DF-01, BR-20). |
| 7 | **Decline request** opens SCR-54. |
| 8 | A failed send raises an alert and the request stays Signed (AC-26.5). |
| 9 | After the ERP replies: Paid status and the payment reference (AC-26.2). |
| 10 | A request signed by a delegate reads "Signed by Fiona on behalf of Carol" with the **On behalf of Carol** marker; the delegate cannot also give the second signature, and the disabled button says why (AC-30.3, AC-30.10). |
| 11 | "You processed an invoice in this request." names the invoice; signing is disabled (AC-25.16, BR-36). A tax-risk release by the Chief Accountant does not block (AC-25.17). |
| 12 | **Resend** in the failure alert, for the Chief Accountant only; the Payment Approver sees the alert only (AC-26.10, D-116). |
| 13 | SCR-57 opened from SCR-51: the same request number is the idempotency key, no new signature, the hash is checked first (AC-26.11). |

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
| [`failed`](wireframes/51-payment-request.html?state=failed) | ERP send states | Alert after 3 attempts, with **Resend** for the Chief Accountant ([PNG](../images/chief-accountant/51f-payment-request-erp-failed.png)). |
| [`resend`](wireframes/51-payment-request.html?state=resend&role=chief) | SCR-57 | The request, the 3 failed attempts, and the three statements of the resend ([PNG](../images/chief-accountant/51h-payment-request-resend.png)). |
| [`hash-mismatch`](wireframes/51-payment-request.html?state=hash-mismatch) | ERP send states | "Not sent: the content differs from the signed hash." (AC-26.7). |
| [`delegate`](wireframes/51-payment-request.html?state=delegate&role=approver) | Delegated signature (AC-30.3, AC-30.10) | The Chief Accountant slot reads "Signed by Fiona on behalf of Carol"; Fiona's own second signature is disabled ([PNG](../images/payment-approver/51b-payment-request-delegate.png)). |
| [`sign-blocked`](wireframes/51-payment-request.html?state=sign-blocked&role=approver) | Separation of duties (AC-25.16) | "You processed an invoice in this request." naming C26TAA-0000102; **Sign** is disabled ([PNG](../images/payment-approver/51c-payment-request-sign-blocked.png)). |
| [`resent`](wireframes/51-payment-request.html?state=resent&role=chief) | Resend (AC-26.11) | PR-0042 is sent again by Carol; the ERP card lists the manual attempt ([PNG](../images/chief-accountant/51i-payment-request-resent.png)). |
| [`paid`](wireframes/51-payment-request.html?state=paid) | ERP send states | PR-0038: Paid, reference PAY-CF-2026-0042, two signature records ([PNG](../images/chief-accountant/51g-payment-request-paid.png)). |

### SCR-55 Signing Delegations and SCR-56 — [`55-signing-delegations.html`](wireframes/55-signing-delegations.html) · roles `chief`, `approver`, `entity-admin` · [PNG Chief Accountant](../images/chief-accountant/55-signing-delegations.png), [PNG Payment Approver](../images/payment-approver/55-signing-delegations.png), [PNG Entity Admin](../images/entity-admin/55-signing-delegations.png)

Purpose: who may sign for whom, and for how long (D-91, BR-38). The Chief Accountant and the Payment Approver see the delegations they gave or received and create or revoke their own; the Entity Admin sees every delegation of the entity and can revoke one, but cannot create one or sign (AC-30.9).

**Layout (R1):** a header with **New delegation** as the one primary action (not for the Entity Admin, who has a "Read and revoke only" tag); a notice that names the active delegation; three tiles (Active, Scheduled, Past); saved-view tabs `current` Current (default; Active and Scheduled), `past` Past (Ended and Revoked), `all`; a compact table (delegator, delegate, first day, last day, reason, state, **Revoke**). SCR-56 is a right drawer because it has four fields (P9, D-110).

| # | Note |
|---|---|
| 1 | The role's view: given or received delegations for the Chief Accountant and the Payment Approver, every delegation of the entity for the Entity Admin (AC-30.9, AC-30.11). |
| 2 | **New delegation** opens SCR-56; the Entity Admin has no such control. |
| 3 | "You delegated signing to Fiona until 14/11/2026." The delegator cannot sign while it is active, and can revoke it to sign again (AC-30.8). |
| 4 | The state of each delegation: Scheduled, Active, Ended, or Revoked, as text with a shape (AC-30.9). |
| 5 | **Revoke** asks for a confirmation on the row: the delegate can no longer sign, and signatures already given stay valid (AC-30.9). The revocation goes to the audit log. |
| 6 | SCR-56: delegate, first day, last day, and reason; the note "You cannot sign while the delegation is active." *(proposed)*; errors from AC-30.6 and AC-30.7. |

| State | Source | Behavior |
|---|---|---|
| default | Initial | Chief Accountant: Carol to Fiona, 30/10/2026 to 14/11/2026, Active; with `role=approver` three delegations; with `role=entity-admin` all four. |
| [`loading`](wireframes/55-signing-delegations.html?state=loading) | Delegations loading | Skeleton rows. |
| [`empty`](wireframes/55-signing-delegations.html?state=empty) | Delegation list empty | "No delegations" with **New delegation** for the Chief Accountant and the Payment Approver only. The copy is proposed. |
| [`server-error`](wireframes/55-signing-delegations.html?state=server-error) | Server error | A short message and **Retry**. |
| [`revoke`](wireframes/55-signing-delegations.html?state=revoke&role=chief) | Destructive confirmation | The row confirms: the delegate can no longer sign and the signatures given stay valid ([PNG](../images/chief-accountant/55d-signing-delegations-revoke.png)). |
| [`revoked`](wireframes/55-signing-delegations.html?state=revoked&role=chief) | Revoked | "Delegation revoked." and the row reads Revoked; Carol can sign again ([PNG](../images/chief-accountant/55e-signing-delegations-revoked.png)). |

#### SCR-56 New Delegation (state of SCR-55)

| State | Source | Behavior |
|---|---|---|
| [`new`](wireframes/55-signing-delegations.html?state=new&role=chief) | SCR-56 | The drawer with sample values: Fiona, 10/11/2026 to 14/11/2026, "Annual leave" ([PNG](../images/chief-accountant/55b-signing-delegations-new.png)). |
| [`new-error`](wireframes/55-signing-delegations.html?state=new-error&role=chief) | Validation error | "A delegate must be an active Chief Accountant or Payment Approver of the same entity." and "Maximum 30 days." next to their fields (AC-30.6, AC-30.7) ([PNG](../images/chief-accountant/55c-signing-delegations-new-error.png)). |

## Oversight

### SCR-60 Dashboard — [`60-dashboard.html`](wireframes/60-dashboard.html) · roles `ap`, `chief`, `approver`, `entity-admin`, `group-admin` · [PNG AP Accountant](../images/ap-accountant/60-dashboard.png), [PNG Chief Accountant](../images/chief-accountant/60-dashboard.png), [PNG Entity Admin](../images/entity-admin/60-dashboard.png), [PNG Group Admin](../images/group-admin/60-dashboard.png)

Purpose: the touchless rate and the AI misplacement rate side by side, the backlog, and the Group Admin's per-entity counts (US-27). Default period: the current month (DF-23).

**Layout (R1):** a row of tiles (Touchless rate with its validity, AI misplacement rate beside it, Open exceptions, Waiting for goods), then the two bar charts side by side. The Group Admin sees tiles (Entities, Received, Open exceptions, Waiting for Goods) and the per-entity table.

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

### SCR-62 Notifications — [`62-notifications.html`](wireframes/62-notifications.html) · roles `ap`, `chief`, `approver` · [PNG AP Accountant](../images/ap-accountant/62-notifications.png), [PNG Chief Accountant](../images/chief-accountant/62-notifications.png), [PNG Payment Approver](../images/payment-approver/62-notifications.png)

Purpose: the events and reminders addressed to the user, newest first (D-97, D-100, US-32). They exist in the system only, and no email goes to staff (AC-32.8). The Entity Admin, the Group Admin, the Demo Operator, and the Requesting Department have no list (AC-32.10).

**Layout (R1):** a header with one line of meta (no action); saved-view tabs `unread` Unread (default, with the count) and `all`; a list of notification items (the notification list item, D-109): a mark, a kind tag, one bold line, one line of detail, the time, the word "Unread" or "Read", and **Open**. The top bar of every page of these roles shows **Notifications** with the number of unread items.

| # | Note |
|---|---|
| 1 | In-app only; each item has a recipient, a link to its object, and a read mark (DF-67). |
| 2 | Unread is told apart by the word "Unread", a filled mark, and a bold line, never by colour alone; the same number is in the top bar (AC-32.6). |
| 3 | **Open** takes the user to the object (SCR-12, SCR-30, SCR-50, or SCR-51) and marks the item read; an item whose work is done no longer reminds (AC-32.4, AC-32.5, AC-32.6). |

| State | Source | Behavior |
|---|---|---|
| default | Initial | Three unread and three read items for the AP Accountant (a new exception, a returned request, a rejected acceptance, and reminders); four items for the Chief Accountant and the Payment Approver. |
| [`loading`](wireframes/62-notifications.html?state=loading) | Notification list loading | Skeleton rows. |
| [`empty`](wireframes/62-notifications.html?state=empty) | Notification list empty | "No notifications"; the top bar shows no number ([PNG](../images/ap-accountant/62c-notifications-empty.png)). The copy is proposed. |
| [`all-read`](wireframes/62-notifications.html?state=all-read) | Unread and read | Every item is read; the Unread tab reads 0 and the top bar shows no number ([PNG](../images/ap-accountant/62b-notifications-all-read.png)). |
| [`server-error`](wireframes/62-notifications.html?state=server-error) | Server error | A short message and **Retry**. |

## Entity administration

### SCR-70 Users, SCR-71, and SCR-72 — [`70-users.html`](wireframes/70-users.html) · roles `entity-admin`, `group-admin` · [PNG Entity Admin](../images/entity-admin/70-users.png), [PNG Group Admin](../images/group-admin/70-users.png)

| # | Note |
|---|---|
| 1 | **Create user** opens SCR-71. |
| 2 | The Group Admin has an entity filter; the Entity Admin sees only the own entity (AC-02.8). |
| 3 | On the own row the role and status cannot be changed (AC-02.8). |
| 4 | SCR-71: name, unique email, role, entity, initial password of at least 8 characters, ERP user link (DF-32, DF-14). The Entity Admin can choose only AP Accountant, Chief Accountant, or Payment Approver, in the own entity. SCR-71 opens as a right drawer. |
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

**Layout (R1):** four tiles (Entities, Open gates, Closed gates, Gate alerts), the gate alert as a notice with **Review the gate**, and a compact table of the entities.

**Layout (R1):** a settings page: the Approval tiers section and the same sticky save bar as SCR-73.

**Layout (R1):** a settings page: a sub-navigation with the sections Limits, Sampling, and Payment request grouping, and a sticky save bar ("Unsaved changes", Discard, Save) that also shows `saving` and `saved` (D-80).

**Layout (R1):** a toolbar (search, **Filters**) and a compact table (name and email in one cell, role, entity, ERP user link, status, actions); SCR-71 as a right drawer (states `create`, `edit`, `email-error`, `role-error`, `saving`); SCR-72 stays a centered modal.

**Layout (R1):** a toolbar (search, **Filters**, chips) and a compact table; a row expands in place to its detail (D-76).

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
| 4 | SCR-77: entity name and a unique 10-digit tax code (US-03). SCR-77 opens as a right drawer. |

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

**Layout (R1):** four tiles (Gates, Open, Closed, With an alert), the alert notice, and a compact table with the accuracy meter kept; **Open** and **Close** stay on the row and open SCR-79 as a centered modal.

**Layout (R1):** a header with **Add entity**; the entities table on the left and the **Group limits** card on the right; SCR-77 as a right drawer (states `add`, `add-duplicate`, `add-invalid`).

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

**Layout (R1):** a header with the actions to create a purchase order and to confirm a receipt, a persona toolbar, and two compact tables (Purchase orders, Receipts and acceptances); SCR-81 and SCR-82 as right drawers (states `po-form`, `po-error`, `receipt-form`, `receipt-no-order`, `receipt-same-persona`).

| # | Note |
|---|---|
| 1 | Banner "Demo only" (AC-08.7). |
| 2 | Entity selector and persona selector (buyer, warehouse keeper, acceptor). The entity is chosen here and not in the top bar (DF-36). |
| 3 | **New purchase order** for the buyer; **Confirm receipt** for the other personas. |
| 4 | Confirm a receipt from a row of an order. |
| 5 | SCR-81 (right drawer): supplier, kind, lines; the creator is the persona chosen on the page. |
| 6 | SCR-82 (right drawer): order reference (required), quantity, delivery note ("60 of 100 received, 40 outstanding"). No field takes data from an invoice (BR-13). |

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
