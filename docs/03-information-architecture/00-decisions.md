# Decisions and Defaults

> Design status: MVP — Step 3 of 9, approved
>
> Implementation status: NOT STARTED

Numbering continues from Step 2 (decisions end at D-33, the user's scope decision; defaults end at DF-33). The Step 3 decisions are D-34..D-41 and the defaults DF-34..DF-44. The draft was first written on the old scope with the numbers D-33..D-40; after the user's scope decision D-33 they were renumbered by one (old D-33 is D-34, old D-34 is D-35, and so on up to old D-40, now D-41). The defaults kept their numbers, because DF-34 was still free.

The user reviewed Step 3 on 2026-10-31 and said "Step 3 looks good"; the decisions and defaults below are **approved with Step 3**. The rows changed afterwards to apply D-33 stay **Awaiting user review**, as does the section "Changes made to Step 3 because of D-33". Each call can change without changing the meaning of a Step 2 story.

## Decisions made in this step

| ID | Decision | Why | Status |
|---|---|---|---|
| D-34 | **The sitemap shows page cards with their main content only,** grouped in areas. Six actors connect with dashed arrows to the areas they use, and the arrows match the page-permission table. Solid arrows mean parent page → child page. Purple cards are pages with AI features. Modals, the Access denied page, and loading or error states are not cards. Screens carry the IDs SCR-nn. | Follows the sample's notation. Keeping modals off the map keeps the 35 active screens readable (37 numbers, two removed by D-33). | Awaiting user review (text changed for D-33; approved before the change) |
| D-35 | **Every role uses a left sidebar plus a top bar,** including the Demo Operator. The sidebar shows only permitted items (AC-01.7). | All six roles are working roles with several pages each. The sample's top-bar-only layout fits a customer portal with few pages and does not fit this product. | Approved with Step 3 (user, 2026-10-31) |
| D-36 | **Detail views are full pages; short forms, confirmations, and decisions are modals** on their parent page and have no route. The invoice (SCR-12), the payment request (SCR-51), and the batch (SCR-30) are pages because they hold long evidence. The decisions on an invoice (SCR-14 to SCR-18) are modals so the evidence stays behind them. | The same split as the sample. A modal over the evidence lets the decider keep the numbers in view. | Approved with Step 3 (user, 2026-10-31) |
| D-37 | **SCR-12 has a role-dependent action panel.** The AP Accountant sees resolve actions; the Chief Accountant sees the tax-risk hold action; the Payment Approver sees the individual approval action. A panel appears only when the invoice awaits that role. The evidence stays read-only for the Chief Accountant and the Payment Approver. | AC-17.4 says the Chief Accountant and the Payment Approver view the worklist "read-only", yet US-21 and US-23 need them to act on an invoice. The read-only rule is about the evidence and the worklist (US-17); the decisions belong to their own stories and are made from the same page so the decider does not lose the evidence. | Awaiting user review (text changed for D-33; approved before the change) |
| D-38 | **There is no profile screen.** The top bar shows the user's name and role, and a Log out action. No user changes a name, phone, or password in the MVP. | No story asks for a profile or a password change. Adding one would be a new requirement. DF-32 sets the password rule only for creation. | Approved with Step 3 (user, 2026-10-31) |
| D-39 | **The Group Admin's home page is SCR-75 Group Overview, and it is not the Dashboard.** It shows entities with their open and closed gate counts, gate alerts, and the last ERP sync per entity, which come from US-06 and US-07 (both Must). The Dashboard (SCR-60) is US-27, a Should. | Lesson from Step 2: a Must home page must not depend on a Should screen. DF-28 names "the group overview" as the home page, and AC-01.1 requires a home page for the Group Admin even if US-27 is cut. | Approved with Step 3 (user, 2026-10-31) |
| D-40 | **One Decision Queue (SCR-40) serves the Chief Accountant and the Payment Approver,** with different content by role: tax-risk holds for the first, exceptions at the approver level for the second. The sidebar label is "Decisions" for the Chief Accountant and "Approvals" for the Payment Approver. | Both queues are lists of invoices that wait for a decision and open SCR-12. One screen avoids two near-identical pages; the server returns only what the role may decide (AC-23.1). | Awaiting user review (text changed for D-33; approved before the change) |
| D-41 | **There is no notification centre.** Step 2 states only these notices: the AP Accountant's email to a supplier or team, the 5-working-day reminder inside the system (DF-21), the gate alert (BR-06), and the failed-send alert (DF-24). New work shows as sidebar badges and list order. | No story asks for notifications, and the sample says the same about its product. | Approved with Step 3 (user, 2026-10-31) |

## Defaults pending confirmation

| ID | Default | Status |
|---|---|---|
| DF-34 | **Routes are logical paths.** The router mode (history or hash) is chosen in Step 7. Entity scope is enforced by the server on every request (BR-09) and never by the route. | Approved with Step 3 (user, 2026-10-31) |
| DF-35 | **Stories that describe system behaviour have no screen of their own** (US-07, US-12, US-13, US-14, US-15, US-16, US-20, US-26). The requirement-to-screen mapping names the screens where each result is visible, and those screens list the story. | Approved with Step 3 (user, 2026-10-31) |
| DF-36 | **The top bar shows the entity name of the user, read-only, and there is no entity switcher.** The Group Admin sees "Calderwood Group". The Demo Operator picks the entity inside SCR-80. | Approved with Step 3 (user, 2026-10-31) |
| DF-37 | **Display formats:** money as `VND 53,000,000` (code first, comma separator, no decimals for VND), dates and times as `dd/MM/yyyy HH:mm`. | Approved with Step 3 (user, 2026-10-31) |
| DF-38 | **Screen IDs are numbered by area** (01 and 90 access, 10s invoices, 20s recurring profiles, 30s batch, 40 decisions, 50s signing, 60s oversight, 70 to 74 entity administration, 75 to 79 group administration, 80s demo). A new screen takes the next free number in its area, and existing numbers do not change. | Approved with Step 3 (user, 2026-10-31) |
| DF-39 | **"Waiting for AP confirmation" is a tag on an exception in `In Review`,** not a state. Step 2 (AC-20.3) says the exception "stays open" with that wording, while BR-34 has no such state. The tag shows when a legal adjustment or replacement invoice is linked and passes the checks (E6, E12). | Approved with Step 3 (user, 2026-10-31) |
| DF-40 | **A failed ERP send raises an alert on screen** for the AP Accountant (SCR-30) and for the Chief Accountant and the Payment Approver (SCR-50, SCR-51). Step 2 says only "an alert appears" (AC-26.5) and does not say who sees it, and it states no manual retry after the 3 attempts, so none is drawn. | Approved with Step 3 (user, 2026-10-31) |
| DF-41 | **Inline actions on SCR-12 instead of modals:** confirm a line match, correct the entity or flow, withdraw an invoice from the batch (reason required), and send for a decision. Only actions with a form that needs focus are modals (D-36). Step 2 does not list a modal for withdrawal (AC-24.7). | Awaiting user review (text changed for D-33; approved before the change) |
| DF-42 | **The demo seed also holds the price history and the earlier recurring periods.** Step 2 seeds only the gate history (DF-33), but the unusual-price check needs at least 3 purchases in 6 months (DF-20, AC-15.1) and a usage-based recurring check needs earlier periods (BR-24, AC-15.5). Without them every price and recurring check would be skipped or fail in the demo. | Approved with Step 3 (user, 2026-10-31) |
| DF-43 | **After a decision on SCR-12 the user returns to the list they came from** (SCR-10, SCR-40, or SCR-51). After signing the user stays on SCR-50 or SCR-51 with one result per request. | Approved with Step 3 (user, 2026-10-31) |
| DF-44 | **The Entity Admin's home page is SCR-73 Entity Policy,** which is the "entity settings" of DF-28. | Approved with Step 3 (user, 2026-10-31) |

## Differences from Step 2 and from the brief

| Topic | What the sources say | What Step 3 does and why |
|---|---|---|
| "Waiting for AP confirmation" | AC-20.3 says the exception stays open "Waiting for AP confirmation". BR-34 has six states and none by that name. | Shown as a tag on `In Review` (DF-39). BR-34 is not changed. |
| Who sees a failed ERP send | AC-26.5: "an alert appears". UC-26 does not name a recipient. US-26 is the Chief Accountant's story, while the AP Accountant is told of a payment failure (AC-26.6). | Both groups see it (DF-40). A manual retry is not drawn because Step 2 does not state one. |
| Read-only roles | AC-17.4 says the Chief Accountant and the Payment Approver see the worklist read-only. US-21 and US-23 need them to act on an invoice. | The worklist and the evidence are read-only. The decision is a separate action panel (D-37). Step 2 meanings are unchanged. |
| Entity Admin home page | DF-28 says "entity settings". | SCR-73 Entity Policy (DF-44). |
| Withdrawal from a batch | AC-24.7 allows the AP Accountant to withdraw an invoice with a reason. No screen is named. | An inline action on SCR-12 (DF-41), counted under US-24. |
| Demo data | DF-33 seeds the gate history only. The price check and recurring check also need history (DF-20, BR-24). | The seed also holds that history (DF-42). Step 2 is not changed; the call awaits review. |
| Profile and password | The brief and Step 2 have no profile story. | None drawn (D-38). |
| Foreign invoices, PDF intake, and the cash flag | The brief wants foreign invoices from PDF with confirmed fields, foreign tax duties, and a cash flag. D-33 (user decision) moved all three to Advanced (W-19..W-21). | Step 3 draws no screen for them. SCR-13 and SCR-17 are removed (see below). A non-XML file is rejected on SCR-11 (AC-10.8), and an "Unsupported: foreign invoice" exception is resolved only by Reject on SCR-15 (AC-12.9, D-31). |
| The brief | No difference from the brief is introduced in this step. Step 3 only places Step 2's functions on screens. | — |

## Changes made to Step 3 because of D-33

D-33 is the user's own decision (foreign invoices, PDF intake, foreign tax duties, and the cash flag move to Advanced). This section lists what it changed in Step 3. The way each change is applied is a call made by the worker and **awaits user review**.

| Item | Change | Status |
|---|---|---|
| Screens SCR-13 Confirm Foreign PDF Fields and SCR-17 Foreign Tax Outcome | Removed. Their inventory rows stay and read "Removed (D-33)"; the numbers are not reused. They have no route, no sitemap card, no permission row, and no place in any flow. | Awaiting user review |
| Route `/invoices/:id/confirm-fields` | Removed with SCR-13. | Awaiting user review |
| SCR-10 and SCR-11 | The "Upload foreign PDF" button and any PDF upload are removed. SCR-11 rejects a file that is not XML with "Only XML e-invoices are accepted in the MVP" (AC-10.8). | Awaiting user review |
| SCR-12 | Shows the "Unsupported: foreign invoice" exception whose only resolution is Reject (SCR-15; AC-12.9, D-31). The AP "attach foreign tax documents" action and the Chief Accountant's foreign tax outcome action are removed. | Awaiting user review |
| SCR-40 Decision Queue | The Chief Accountant's part holds only tax-risk holds (US-21). | Awaiting user review |
| SCR-51, SCR-30, SCR-61, SCR-12 | Payment method and the cash flag are removed; paid status and payment reference stay (US-26). | Awaiting user review |
| Requirement-to-screen mapping and "if a Should story is cut" table | US-11 and US-22 read "Removed (D-33)" in the mapping and leave the cut table. | Awaiting user review |
| User flows, UI states | The foreign branches, the state Awaiting Field Confirmation, the field-confirmation and cash states are removed. The non-XML rejection and the unsupported-foreign exception are added. | Awaiting user review |
| D-34, D-37, D-40, DF-41 | Text changed for D-33 (screen count, no foreign tax outcome, no foreign tax documents). | Awaiting user review |
| Numbering | Step 3 decisions moved from D-33..D-40 to D-34..D-41 (see the top of this page). | Awaiting user review |

**Related:** [Step index](README.md) · [Step 2 decisions](../02-usecases-userstories/00-decisions.md) · [Session handoff](../handoff/session-handoff.md)
