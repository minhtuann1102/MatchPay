# Decisions and Defaults

> Design status: MVP — Step 4 of 9, approved
>
> Implementation status: NOT STARTED
>
> Revision R1 (UX redesign, 2026-11-01): draft for review

Numbering continues from Step 3 (decisions end at D-41, defaults end at DF-44). The Step 4 decisions are D-42..D-46 and the defaults are DF-45..DF-52. The user reviewed Step 4 on 2026-10-31 and said it is OK as it stands ("OK, that's it"); every row below is **approved with Step 4**, including the eight differences from Steps 1 to 3.

**Project rule applied, not a decision:** all wireframe copy is English, including labels, messages, and sample data (CLAUDE.md, "All files are 100% English"). The sample repository's Vietnamese UI copy is not followed. Legal references and sample names are written without diacritics.

## Decisions made in this step

| ID | Decision | Why | Status |
|---|---|---|---|
| D-42 | **Format:** plain static HTML pages with one shared stylesheet (`wireframes/assets/wireframe.css`), one small script (`states.js`) that builds the sidebar and the top bar for the role and switches `?state=` and `?role=`, and an inline icon sprite (`icons.js`). Every key screen and state is exported to PNG under `docs/images/<role>/` with a headless browser at 1440 px, and reduced to 256 colours to keep the folder small. No framework and no network at view time: the fonts are bundled. | Follows the sample repository. Static files can be opened from a local clone and diffed in review. The export script is a one-off tool and is not kept in the repository. | Approved with Step 4 (user, 2026-10-31) |
| D-43 | **Fidelity: high-fidelity mockups** with real sample numbers, not grey boxes. Each page file carries yellow annotation numbers that match the tables in [02-screen-notes.md](02-screen-notes.md); `?shot=1` hides them and the control bar for the exports. | The sample does the same, and numbers that add up on each screen let a reviewer catch errors in the rules (for example the six conditions of BR-05 with their values). | Approved with Step 4 (user, 2026-10-31) |
| D-44 | **Design concept "Three hands":** every piece of content shows who authored it. *AI proposed* (evidence) uses a dotted left rail and a round dashed tag. *Rule Engine* (transparent checks) uses a double rail, a square outlined tag, and numbered rows with a value and Pass or Fail. *Person* (a decision or a signature) uses a solid rail, a filled dark tag, and a seal with name and time. Document and ERP data use a plain grey tag. This is the one bold element; the rest is quiet. Colour supports the words and never replaces them. | The product rule is "the AI provides evidence, the Rule Engine decides, and a person signs" (README). A signer must be able to tell the three apart at a glance and by text, in a PNG without colour. | Approved with Step 4 (user, 2026-10-31) |
| D-45 | **One HTML file per page, and modals are states of their parent page**, named `<nn>-<slug>.html`. The 18 pages cover the 35 active screens (18 pages and 17 modals). SCR-13 and SCR-17 (Removed, D-33) have no file. A modal opens with `?state=<name>` and the control bar lists it as "SCR-nn". | Follows D-36 (modals have no route) and the sample. A modal drawn over its page keeps the evidence behind it, as D-36 intends. | Approved with Step 4 (user, 2026-10-31) |
| D-46 | **PNG folders by role:** `common/`, `ap-accountant/`, `chief-accountant/`, `payment-approver/`, `entity-admin/`, `group-admin/`, and `demo-operator/`. A page shared by several roles has one PNG in each role folder that uses it, with the same file name. | The sample groups by role. MatchPay has six roles and several shared pages (SCR-10, SCR-12, SCR-40, SCR-50, SCR-60, SCR-61, SCR-70), so a role folder shows what each person sees. | Approved with Step 4 (user, 2026-10-31) |

## Defaults pending confirmation

| ID | Default | Status |
|---|---|---|
| DF-45 | **Desktop first at 1440 px** (A-08: approval on a phone is Advanced). Below 1180 px the two-column layouts stack; below 900 px the sidebar collapses to a "Menu" button; below 760 px the list tables on SCR-10, SCR-30, SCR-40, SCR-50, SCR-51, SCR-70, and SCR-75 become stacked cards, and the signing queue keeps a sticky "Sign selected" bar. Other tables scroll sideways inside their card, so no data is hidden (Step 3 rule). | Approved with Step 4 (user, 2026-10-31) |
| DF-46 | **Sample data beyond DF-12.** The demo date is 31/10/2026 and the last ERP sync is 31/10/2026 09:15. Invoice numbers follow the pattern of the Step 2 examples (`C26TAA-0000123`), orders are `PO-CF-nnnn`, receipts `GRN-CF-nnnn`, payment requests `PR-00nn`, payment references `PAY-CF-2026-00nn`, and supplier tax codes are invented 10-digit numbers. Amounts are chosen so that lines, VAT (10%), totals, requests, and batch add up on every screen: the October 2026 batch holds 5 invoices and VND 70,050,000 in three requests (VND 53,000,000, VND 4,400,000, VND 12,650,000). Tempest Marketing GmbH appears only as the "Unsupported: foreign invoice" example; Eastmark Machinery Co is not used. | Approved with Step 4 (user, 2026-10-31) |
| DF-47 | **The Payment Approver in the wireframes is CFO Fiona.** The main request (PR-0042, VND 53,000,000) needs the CFO level, and the decision queue shows the exceptions of VND 50,000,000 and over. The view of Department Head Dan (amounts under VND 50,000,000) is described in the notes and not drawn. | Approved with Step 4 (user, 2026-10-31) |
| DF-48 | **Fonts:** IBM Plex Sans (400, 500, 600) and IBM Plex Mono (400, 500), Latin subset, SIL Open Font License, bundled in `wireframes/assets/fonts/` with the licence text. A system sans-serif is the fallback. Amounts use tabular numbers; invoice, order, and hash values use the mono face. | Approved with Step 4 (user, 2026-10-31) |
| DF-49 | **Sample gate history on SCR-78:** Brightfield Paper Ltd and Calderwood Foods Co. is closed with 50 compared invoices and 98.0% ("Simulated history", AC-06.10); Harbor Cartons Ltd and Calderwood Foods Co. is open with 64 compared (50 simulated, 14 live) and 98.4%; Sunrise Electric Utility and Calderwood Foods Co. is closed with 30 compared (AC-06.4); Brightfield Paper Ltd and Calderwood Packaging Co. is closed below the threshold at 94.2% on 52; CloudDesk Software Ltd and Calderwood Packaging Co. is open with an alert of 7.7% sample errors (2 of 26, DF-16). | Approved with Step 4 (user, 2026-10-31) |
| DF-50 | **Dashboard sample:** 100 invoices received in October 2026, 8 employee-expense invoices left out, 92 in the denominator, 62 touchless (67.4%), and 1 of 20 sampled withdrawn (5.0%), so the touchless rate is marked "not valid" (AC-27.1, AC-27.2). The wireframe reads "92 invoices received excluding 8" of AC-27.1 as 100 received less 8. | Approved with Step 4 (user, 2026-10-31) |
| DF-51 | **Status chips carry a shape as well as text:** a hollow ring for a start state, a half-filled ring for work in progress, a dotted ring for waiting, a diamond for an exception, a filled dot for a good outcome, and a square for a final state. The names are exactly the states of BR-33, BR-34, and BR-35. | Approved with Step 4 (user, 2026-10-31) |
| DF-52 | **Navigation in the wireframes:** links keep the current `?role=`, and the control bar of each page lists only the roles that may open it. The sidebar item that is highlighted is the page of the role, so an invoice opened from the decision queue still highlights "Invoices" in the Chief Accountant's sidebar. The breadcrumb shows where the user came from (Step 3). | Approved with Step 4 (user, 2026-10-31) |

## Differences from Steps 1 to 3

None changes a requirement. Each is a place where a wireframe needed a detail that the sources do not give, and the wireframe makes a call. Review them before Step 6 builds the API.

| # | What the source says | What the wireframe does | Why |
|---|---|---|---|
| 1 | SCR-12 lets the AP Accountant "confirm a line match" (Step 3, inventory; AC-18.2). | Next to **Confirm match** it also draws **Choose another item**, for the case where the AI proposal is wrong. | Confirming is meaningless if the person cannot name the right item. Step 2 does not say how a wrong proposal is corrected. Approved with Step 4 (user, 2026-10-31). |
| 2 | SCR-76 lists "the sectors allowed to issue non-coded invoices (default: electricity)" (Step 3; DF-25). | Draws an **Add sector** control. | DF-25 says the list is in group configuration, so someone must edit it. Step 3 shows no edit control. Approved with Step 4 (user, 2026-10-31). |
| 3 | Step 2 says the XML signature check happens (BR-01, AC-10.2) and does not say which kind of actor makes it. | Labels it **Rule Engine** on SCR-12. | It is a deterministic check with no LLM. Approved with Step 4 (user, 2026-10-31). |
| 4 | AC-27.2 says the touchless rate is marked "not valid" above 1% misplacement. | Also draws a "Valid" chip below the limit, and per-entity "Valid" on the Group Admin table. | A figure that is not marked should still say it is valid, otherwise the absence of a mark can be missed. Approved with Step 4 (user, 2026-10-31). |
| 5 | SCR-12 shows "decision history with who or what decided" (Step 3). | Uses the same three tags as the rest of the app, plus a grey "System" and "Entity ERP" tag for intake and ERP events. | Intake, the paid status, and the sync are neither AI, Rule Engine, nor a person. Approved with Step 4 (user, 2026-10-31). |
| 6 | Step 3 (SCR-79) says the Open control is "disabled below 50 compared invoices". | Also shows **Below threshold** in text on SCR-78 for pairs under 98%, with a reason field in SCR-79 when the pair has 50 or more compared invoices. | AC-06.5 requires a written reason only in that case. Approved with Step 4 (user, 2026-10-31). |
| 7 | SCR-50 says the Payment Approver action is disabled until the Chief Accountant signed, "with a hint". | Disables the checkbox and Sign control and writes the reason in the row, and adds a notice above the table. A request that needs another level also shows "Needs the Department Head level". | The reason differs per row (order of signing, level, own signature). Approved with Step 4 (user, 2026-10-31). |
| 8 | The Step 3 state contract lists "Conflict" and "Audit write failure" as general states. | SCR-12 shows both as states (`conflict`, `audit-error`). Other pages with a state-changing action show `conflict` only. | Drawing the audit failure on every page would repeat one pattern. The rule is in the design system. Approved with Step 4 (user, 2026-10-31). |

No error was found in Step 3 while drafting. One ambiguity in Step 2 is recorded as DF-50.

## Changed by user decision D-68

Step 4 is approved. On 2026-10-31 the user ruled that no invoice moves between entities (D-68, recorded in [Step 5 decisions](../05-database/00-decisions.md#decisions-made-by-the-user)). IDs are unchanged.

| Item | Change | Status |
|---|---|---|
| `12-invoice-detail.html`, action panel | "Correct entity or flow" is replaced by **Correct flow** and **Report wrong entity**. The `correct` state offers the flow only. | Changed by user decision D-68 |
| New state `wrong-entity` | Shows the traced mismatch, a required note, and the reason that will be added. PNG `12i-invoice-detail-wrong-entity.png`. | Changed by user decision D-68 |
| PNGs re-exported | `12-invoice-detail`, `12b-invoice-detail-correction-draft`, `12c-invoice-detail-reject`, `12h-invoice-detail-conflict` (their action panel changed). | Changed by user decision D-68 |
| `02-screen-notes.md` | Note 9 reworded, note 15 and the `wrong-entity` row added. | Changed by user decision D-68 |

## Changed by user decisions D-69 and D-70

On 2026-10-31 the user ruled on the timing of the individual-approval request and on split orders (D-69, D-70, recorded in [Step 5 decisions](../05-database/00-decisions.md#decisions-made-by-the-user)). IDs are unchanged.

| Item | Change | Status |
|---|---|---|
| `12-invoice-detail.html`, individual approval panel (SCR-18 background) | The text no longer says that approving makes the request at once: approving records the approval and puts the invoice In Batch, and the request is created at release. | Changed by user decision D-69 |
| New states `approve-split` and `approve-split-modal` | The split-order set of Harbor Cartons Ltd (C26TAA-0000160, -0161, -0162, combined VND 53,000,000): the linked invoices, the combined amount, and one Approve and one Decline for the three. PNGs `12d-invoice-detail-approve-split.png` and `12e-invoice-detail-approve-split-modal.png`. | Changed by user decision D-70 |
| PNGs re-exported | `12-invoice-detail-approve`, `12b-invoice-detail-approve-modal`, `12c-invoice-detail-approve-blocked` (the panel text changed). | Changed by user decision D-69 |
| `02-screen-notes.md` | Two rows added under SCR-18. | Changed by user decision D-70 |

## UX redesign R1 (requested by the user, 2026-11-01)

After reviewing the approved Step 4 wireframes the user asked for a redesign. In the user's words, translated into English: "the screens only display content, with no UX: too much content, screens too long, messy; make the UX/UI fit an industry environment". Revision R1 changes layout, hierarchy, and disclosure only. Every page file name, `?state=` name, `?role=`, screen ID, sample value (DF-46..DF-50), rule, and the three hands (D-44) are unchanged. D-42..D-46 and DF-45..DF-52 above keep their approved text; the rows below say where R1 adds to them. Every row here is **draft for review**: the user asked for the redesign, but has not yet reviewed the result.

### Decisions D-73 onward

Numbering continues after D-72 (Step 3). The patterns P1..P11 are described in [Layout patterns (R1)](01-design-system.md#layout-patterns-r1).

| ID | Decision | Why | Status |
|---|---|---|---|
| D-73 | **Detail pages are object pages:** a header with the number, the state chip, and the amount on the right; a row of key facts; a lifecycle **stepper**; then evidence in **tabs**; and the action panel in a sticky right column. Used on SCR-12 (Overview, Lines, Checks, Documents, Anomalies, History) and SCR-51 (Invoices, Checks, ERP send). SCR-30 gets a batch stepper (Open, Closed for review, Sample checked, Released, Sent) but no tabs. A **tab is a view, not a state**: it is not in the control bar and does not use `data-show`. `?tab=<id>` opens one tab (for example `12-invoice-detail.html?tab=checks`); the default tab is Overview or Invoices. | The 2534 px page of seven stacked cards made the reader scroll to find the one thing that blocks the invoice. The first screen now shows what the item is, where it is in its life, what blocks it, and what to do. | Draft for review |
| D-74 | **List pages use one pattern:** a header with one primary action, 3 to 5 summary tiles, **saved-view tabs with counts** (they filter the same table), a toolbar (search, a **Filters** button with a count, removable filter chips, result count), and compact one-line rows with a muted second line in the first column only, a chevron to open, and a footer with the range and paging. Used on SCR-10, SCR-20, SCR-40, SCR-50, SCR-61, SCR-70, SCR-75, and SCR-78. On SCR-10 the tabs are Needs action (exceptions, the default), Waiting (Waiting for Goods, In Check, Received), In batch, Completed (Sent, Paid, Rejected), and All. The filter form opens with a click or with `?filters=1`. The tiles on SCR-10 jump to the matching tab. | Every row was 2 to 3 lines and every filter was always open (1515 px). People work a queue by view, so the views come first and the filters are a refinement. | Draft for review |
| D-75 | **The action panel offers one next step.** It is headed "You decide" (Person tag), shows the recommended next step as one card with one primary button, lists the other resolutions as compact rows (title, one-line hint, secondary button), and moves destructive actions (Reject invoice, Report wrong entity, Decline request) to a **More actions** menu or a quiet danger link. Focused forms (confirm line, correct flow, wrong entity) open in the panel and replace the next-step card, so the page does not grow. The detail header carries no action buttons (see D-82). | Equal-weight buttons made every action look equally likely. The AI never gets a primary signing control (AC-25.9), and the destructive action must not be the easiest to hit. | Draft for review |
| D-76 | **Progressive disclosure:** failed Rule Engine conditions are open and passed ones are folded under "N passed" (`<details>`); long AI reasoning is folded under "Why the AI proposed this"; document and ERP field lists sit in their own tab; the history shows the latest three events with "Show all"; an audit-log row expands to its details. Hidden content stays in the DOM and in the notes. | The evidence that decides the case is on top, and the evidence that only confirms it is one click away. Nothing is removed (the rules and values do not change). | Draft for review |
| D-77 | **Forms with more than 3 fields open in a right-side drawer** (480 px, full width under 900 px): SCR-21 (recurring profile), SCR-71 (user), SCR-77 (entity), SCR-81 and SCR-82 (ERP simulator). Short confirmations stay centered modals (SCR-11, SCR-14, SCR-15, SCR-16, SCR-18, SCR-31, SCR-32, SCR-52, SCR-53, SCR-54, SCR-72, SCR-79). A drawer is a state of its parent page with the same state names, so D-45 holds. | A drawer keeps the list visible behind the form and does not lengthen the page. A modal is right for a yes or no with a reason. | Draft for review |
| D-78 | **Density and width:** content width at most 1320 px; page padding 24 px; card padding 16 px; table cells 8 by 12 px; body 14 px, tables 13 px; page title 22 px (24 px in Step 4); one-line rows of 44 to 48 px. The targets for the default view are 1100 px for SCR-12 and SCR-51 and about one screen (900 px) for every other page, at 1440 px wide. | The old pages used the full width with 10 px cells and no limit on height. | Draft for review |
| D-79 | **The batch table is grouped by future payment request:** SCR-30 lists the invoices under their supplier, with a subtotal row per supplier, because the invoices of one supplier become one payment request at release. The payment requests table sits below the invoices. The sample check is a focused panel above the table in the states that have it. | The reviewer must see what will be signed. Grouping shows the three requests (VND 53,000,000, 4,400,000, and 12,650,000) before release. | Draft for review |
| D-80 | **Settings pages (SCR-73, SCR-74)** use a left sub-navigation of sections and a sticky save bar ("Unsaved changes", Discard, Save). The save states (`saving`, `saved`) show in the bar. | A policy form is edited in parts and saved as a whole, so the save control must stay in view. | Draft for review |
| D-81 | **The gallery (`wireframes/index.html`) is grouped by area** (Access, Invoices, Recurring profiles, Batch, Decisions and signing, Oversight, Entity administration, Group administration, Demo), with role filter tabs, and the state links of each card folded under "N states and variants". Every link is kept. The card images are the PNGs of `docs/images/`. | Eighteen cards with up to 28 visible links each were hard to scan. | Draft for review |

### Effect on earlier decisions

| Earlier decision | Effect of R1 | Status |
|---|---|---|
| D-42 | The script still switches `?state=` and `?role=` and `?shot=1`; R1 adds `?tab=<id>` (select a tab) and `?filters=1` (open the filter panel). The PNGs are exported again at 1440 px, full page, 256 colours, with the same one-off script outside the repository. | Draft for review |
| D-43 | The rule holds: every callout number in a page matches the table in [02-screen-notes.md](02-screen-notes.md). R1 keeps the existing numbers and adds one (SCR-10, note 8, the saved-view tabs). Tiles, toolbars, and drawers carry no number of their own; they are described under "Layout (R1)" for each page. | Draft for review |
| D-45 | Unchanged: 18 page files, 35 active screens, modals and drawers are states of the parent page. | Draft for review |
| D-46 | Unchanged: same folders and file names. | Draft for review |
| DF-45 | Below 1180 px the two-column layouts still stack and below 900 px the sidebar still collapses. The compact tables keep one line per row and scroll sideways inside their card under 760 px; the stacked-card variant is kept only where the page file still carries it. The narrow layouts were **not re-tested** in R1: Unverified, a check at 700 px would confirm it. | Draft for review |

### Calls made while building R1

These are choices the worker made alone, not requests of the user. They await the user's review.

| ID | Call | Why | Status |
|---|---|---|---|
| D-82 | **The detail header (SCR-12, SCR-51) has no action buttons.** Every action is in the action panel on the right, so there is one place to act. | A header button and a panel button for the same action would be two places to look, and the header would compete with the panel for "primary". | Call, awaiting user review |
| D-83 | **The SCR-12 stepper keeps the Exception step only while the invoice is an exception.** For an exception the steps are Received, Checked, Exception (current, with a warning mark and the exception state as its sub-line), In Batch, In Request, Sent, Paid. The `in-batch`, `paid`, and `checking` states have no exception, so the step is left out and the stepper reads Received, Checked, In Batch, In Request, Sent, Paid (with the current step marked). A sub-line that repeats its label is dropped on every stepper (for example "Open" under Open on SCR-30). | The plan listed Exception between Checked and In Batch; showing it for an invoice that never had one would be noise. | Call, awaiting user review |
| D-84 | **The attention card ("3 of 6 batch conditions failed") sits inside the Overview tab**, below the key facts, and not above the tabs. It links to the Checks tab. | Above the tabs it pushed the evidence below the first screen. The cost: on another tab the card is not visible. The chip and the tab pill ("Checks 3 failed") still show the count. | Call, awaiting user review |
| D-85 | **Long panel text became tooltips** (`title` on a small "i" mark): the explanation of the tax-code check and the wrong-entity hint on SCR-12, the two approve texts on SCR-12 (the request is created at release), and on SCR-10 the note "Reminder due: request sent 22/10/2026, no reply". The tooltip text is the Step 4 text, unchanged. | The panel text was the longest part of the column and is not needed to act. The cost: tooltip text is not visible in a PNG and not on a touch screen. | Call, awaiting user review |
| D-86 | **Role mapping of the gallery filter tabs:** SCR-01 and SCR-90 appear under every role; SCR-10, SCR-12, SCR-40, SCR-50, SCR-51 under AP Accountant, Chief Accountant, and Payment Approver as the sitemap allows them (SCR-10 and SCR-12: ap, chief, approver; SCR-40, SCR-50, SCR-51: chief, approver); SCR-20 and SCR-30 under ap; SCR-60 under all five roles that open it; SCR-61 under chief, entity-admin, group-admin; SCR-70 under entity-admin and group-admin; SCR-73 and SCR-74 under entity-admin; SCR-75, SCR-76, SCR-78 under group-admin; SCR-80 under demo. | The Step 3 routes decide who opens what; the mapping is read from them, not new. | Call, awaiting user review |
| D-87 | **The PNGs show the default tab of their page.** All 81 PNGs are exported without `?tab=`: in each state the subject of the PNG is on the default tab (checked on `ai-failure`, `in-batch`, `paid`, and `foreign` of SCR-12: the Overview holds the attention card, the batch note, or the signature records). `?tab=<id>` is still available for a reviewer or a later export. The state with the most height is `conflict` of SCR-12 at 1093 px. | A PNG of the Overview shows what a reader sees first, and the folded content is named in its pills ("Checks 5 not evaluated"). | Call, awaiting user review |

**Related:** [Step index](README.md)

## Mind map sync (D-88, draft for review)

The user asked for the project to follow the feature mind map (D-88, recorded in [Step 2](../02-usecases-userstories/00-decisions.md)). Step 3 added ten screens (SCR-19, SCR-22, SCR-23, SCR-24, SCR-33, SCR-34, SCR-55, SCR-56, SCR-57, SCR-62). This pass draws them and updates the six pages that gained states. The user's instruction was to finish the whole sync. Every row below is a call of the worker, not a decision of the user, and awaits review.

The new numbers continue after D-107 and DF-72. Approved text above is unchanged.

### Calls made while syncing

| ID | Call | Why | Status |
|---|---|---|---|
| D-108 | **A seventh role key `dept` (Requesting Department).** Its home page is SCR-22 (the acceptance queue), its sidebar has one item ("Acceptance queue") with a count badge, and it has no notification bell. The persona is Rowan. PNGs go in a new folder `docs/images/requesting-department/`. SCR-90 also lists `dept`. | The role has one page (Step 3). D-46 names six folders, so a seventh folder keeps the rule "one folder per role". | Call, awaiting user review |
| D-109 | **Notification list item** as a component (`.notif`): a mark, a kind tag, one bold line, one line of detail, the time, and a link. Unread rows are marked by a filled dot and a light wash. Read rows use regular weight. | One list item for the whole page keeps SCR-62 plain, and the unread state does not rely on colour alone (DF-51). | Call, awaiting user review |
| D-110 | **SCR-56 (new delegation) is a right-side drawer**, not a centered modal. | The form has more than 3 fields (delegate, from, until, reason), which is the D-77 rule. SCR-52 stays a centered modal because it has one field. | Call, awaiting user review |
| D-111 | **Notifications appear twice for the three finance roles:** as a bell with the unread count in the top bar, and as an ordinary sidebar item without a badge. The sidebar item has no badge so that the count is not shown twice. | The bell is the habit from other tools, and the sidebar item is the place the sitemap (Step 3 sitemap) already lists. Drop one if the user prefers. | Call, awaiting user review |
| D-112 | **Dates are written dd/mm/yyyy**, as in DF-46, though the acceptance criteria quote ISO dates (for example 2026-11-14 in AC-30.8). | One date format across 80 wireframe states. The ACs say what is stored and checked, not how it is shown. | Call, awaiting user review |
| D-113 | **SCR-19 (record a cancellation notice) is one modal.** It names the effect for the current invoice state, and folds the other cases (Received, Exception, In Batch, In Request, Sent, Paid) under "The effect for other states". | Seven modals for one action would multiply states. The AP Accountant needs to see the effect before confirming, and the folded list gives the reviewer all cases. | Call, awaiting user review |
| D-114 | **SCR-12 shows the authority status as a key fact and the source as a tag in the title row.** Every invoice object carries both. A "Record cancellation notice" action is in the action panel (in-batch, paid), and in the More menu (exception). | The authority status (AC-10.16) is a fact to read at a glance, and the source (DF-72) is a label. A third fact would wrap the facts row to two lines. | Call, awaiting user review |
| D-115 | **SCR-10 gets a Source column, a Source filter, a search state, and a lookup-unavailable state.** The unavailable state shows a notice, a **Run lookup again** control, and a sidebar badge of 7 (the extra exception). | The mind map lists these at the list, and one control per state keeps AC-10.16 testable. | Call, awaiting user review |
| D-116 | **Resend (SCR-57) sits in the failure alert** of SCR-30 and SCR-51, after the 3 automatic attempts, and is offered to the Chief Accountant only. On SCR-30 the AP Accountant sees it too. | The alert is where the failure is read. Step 3 allows the Chief Accountant on SCR-51. | Call, awaiting user review |
| D-117 | **The delegate in the wireframes is Fiona** (CFO, Payment Approver), who signs for Carol (Chief Accountant). The delegator sees their own signing disabled with the end date. | Fiona is already the Payment Approver persona (DF-47), so no new person is needed. | Call, awaiting user review |

### Defaults of this sync

| ID | Default | Status |
|---|---|---|
| DF-73 | **Sample data of the new pages.** Rowan is the Requesting Department user of Calderwood Foods Co. SCR-22 lists service invoices that wait for acceptance (for example C26TAA-0000150). SCR-24 lists 5 messages with 8 attachments, of which some were accepted and some rejected with a reason. SCR-55 lists four delegations: Carol to Fiona (30/10 to 14/11/2026, Active), Fiona to Dan (20/11 to 24/11, Scheduled), Carol to Dan (12/10 to 16/10, Ended), and Dan to Fiona (05/10 to 07/10, Revoked). Request numbers keep the form PR-00nn (DF-46). | Default, pending confirmation |
| DF-74 | **The unread count is 3** for the three finance roles. It is omitted in the states `empty` and `all-read` of SCR-62. | Default, pending confirmation |
| DF-75 | **Proposed copy** for the new screens: button names (Accept service, Reject, Record notice, Resend, Reopen for review, Expand sample, New delegation, Revoke), empty-state lines, and error lines are written by the worker from the acceptance criteria. Words that the criteria quote are kept. | Default, pending confirmation |
| DF-76 | **Gallery and PNG naming.** The gallery has a new tab "Requesting Department", and the recurring section is renamed "Recurring profiles and intake" to hold SCR-24. New PNGs follow D-46 (`<nn><letter>-<slug>-<state>.png`). A page shared by several roles has one PNG per role folder. | Default, pending confirmation |

### Effect on earlier decisions

| Earlier decision | Effect | Status |
|---|---|---|
| D-42 | The script builds the top bar for the new role and adds the bell and the per-state sidebar badge (`data-badges-<state>`, `data-unread-zero`). | Draft for review |
| D-45 | Now 22 page files and 45 active screens (22 pages, 23 modals and drawers). Modals and drawers stay states of the parent page. | Draft for review |
| D-46 | A seventh folder `requesting-department/` (D-108). | Draft for review |
| DF-52 | The sidebar highlights the page of the current screen; the new items follow the same rule. Control-bar roles of each new page list only the roles that may open it. | Draft for review |
| D-81 | The gallery has a tab for the new role and four new cards. | Draft for review |

### Differences from Steps 1 to 3

| # | What the source says | What the wireframe does | Why |
|---|---|---|---|
| 1 | The ACs quote ISO dates (AC-30.8). | Draws dd/mm/yyyy. | D-112. |
| 2 | Step 3 does not say where the bell is. | Draws a bell in the top bar and a sidebar item. | D-111. |
| 3 | SCR-33 says the sample can run out of invoices to add, and SCR-18 has a variant for AC-23.13. | Not drawn. The default and error states of both are drawn. | The two variants add no new element. Record if the reviewer wants them. |
| 4 | Step 3 lists six exception states. | The `authority-unavailable` state of SCR-10 shows the sidebar badge as 7, one more than the other states. | AC-10.16 creates a seventh exception reason. |
