# Decisions and Defaults

> Design status: MVP — Step 4 of 9, draft for review
>
> Implementation status: NOT STARTED

Numbering continues from Step 3 (decisions end at D-41, defaults end at DF-44). The Step 4 decisions are D-42..D-46 and the defaults are DF-45..DF-52. Every row below is a call made while drafting and **awaits user review**. None of them is the user's decision.

**Project rule applied, not a decision:** all wireframe copy is English, including labels, messages, and sample data (CLAUDE.md, "All files are 100% English"). The sample repository's Vietnamese UI copy is not followed. Legal references and sample names are written without diacritics.

## Decisions made in this step

| ID | Decision | Why | Status |
|---|---|---|---|
| D-42 | **Format:** plain static HTML pages with one shared stylesheet (`wireframes/assets/wireframe.css`), one small script (`states.js`) that builds the sidebar and the top bar for the role and switches `?state=` and `?role=`, and an inline icon sprite (`icons.js`). Every key screen and state is exported to PNG under `docs/images/<role>/` with a headless browser at 1440 px, and reduced to 256 colours to keep the folder small. No framework and no network at view time: the fonts are bundled. | Follows the sample repository. Static files can be opened from a local clone and diffed in review. The export script is a one-off tool and is not kept in the repository. | Awaiting user review |
| D-43 | **Fidelity: high-fidelity mockups** with real sample numbers, not grey boxes. Each page file carries yellow annotation numbers that match the tables in [02-screen-notes.md](02-screen-notes.md); `?shot=1` hides them and the control bar for the exports. | The sample does the same, and numbers that add up on each screen let a reviewer catch errors in the rules (for example the six conditions of BR-05 with their values). | Awaiting user review |
| D-44 | **Design concept "Three hands":** every piece of content shows who authored it. *AI proposed* (evidence) uses a dotted left rail and a round dashed tag. *Rule Engine* (transparent checks) uses a double rail, a square outlined tag, and numbered rows with a value and Pass or Fail. *Person* (a decision or a signature) uses a solid rail, a filled dark tag, and a seal with name and time. Document and ERP data use a plain grey tag. This is the one bold element; the rest is quiet. Colour supports the words and never replaces them. | The product rule is "the AI provides evidence, the Rule Engine decides, and a person signs" (README). A signer must be able to tell the three apart at a glance and by text, in a PNG without colour. | Awaiting user review |
| D-45 | **One HTML file per page, and modals are states of their parent page**, named `<nn>-<slug>.html`. The 18 pages cover the 35 active screens (18 pages and 17 modals). SCR-13 and SCR-17 (Removed, D-33) have no file. A modal opens with `?state=<name>` and the control bar lists it as "SCR-nn". | Follows D-36 (modals have no route) and the sample. A modal drawn over its page keeps the evidence behind it, as D-36 intends. | Awaiting user review |
| D-46 | **PNG folders by role:** `common/`, `ap-accountant/`, `chief-accountant/`, `payment-approver/`, `entity-admin/`, `group-admin/`, and `demo-operator/`. A page shared by several roles has one PNG in each role folder that uses it, with the same file name. | The sample groups by role. MatchPay has six roles and several shared pages (SCR-10, SCR-12, SCR-40, SCR-50, SCR-60, SCR-61, SCR-70), so a role folder shows what each person sees. | Awaiting user review |

## Defaults pending confirmation

| ID | Default | Status |
|---|---|---|
| DF-45 | **Desktop first at 1440 px** (A-08: approval on a phone is Advanced). Below 1180 px the two-column layouts stack; below 900 px the sidebar collapses to a "Menu" button; below 760 px the list tables on SCR-10, SCR-30, SCR-40, SCR-50, SCR-51, SCR-70, and SCR-75 become stacked cards, and the signing queue keeps a sticky "Sign selected" bar. Other tables scroll sideways inside their card, so no data is hidden (Step 3 rule). | Awaiting user review |
| DF-46 | **Sample data beyond DF-12.** The demo date is 31/10/2026 and the last ERP sync is 31/10/2026 09:15. Invoice numbers follow the pattern of the Step 2 examples (`C26TAA-0000123`), orders are `PO-CF-nnnn`, receipts `GRN-CF-nnnn`, payment requests `PR-00nn`, payment references `PAY-CF-2026-00nn`, and supplier tax codes are invented 10-digit numbers. Amounts are chosen so that lines, VAT (10%), totals, requests, and batch add up on every screen: the October 2026 batch holds 5 invoices and VND 70,050,000 in three requests (VND 53,000,000, VND 4,400,000, VND 12,650,000). Tempest Marketing GmbH appears only as the "Unsupported: foreign invoice" example; Eastmark Machinery Co is not used. | Awaiting user review |
| DF-47 | **The Payment Approver in the wireframes is CFO Fiona.** The main request (PR-0042, VND 53,000,000) needs the CFO level, and the decision queue shows the exceptions of VND 50,000,000 and over. The view of Department Head Dan (amounts under VND 50,000,000) is described in the notes and not drawn. | Awaiting user review |
| DF-48 | **Fonts:** IBM Plex Sans (400, 500, 600) and IBM Plex Mono (400, 500), Latin subset, SIL Open Font License, bundled in `wireframes/assets/fonts/` with the licence text. A system sans-serif is the fallback. Amounts use tabular numbers; invoice, order, and hash values use the mono face. | Awaiting user review |
| DF-49 | **Sample gate history on SCR-78:** Brightfield Paper Ltd and Calderwood Foods Co. is closed with 50 compared invoices and 98.0% ("Simulated history", AC-06.10); Harbor Cartons Ltd and Calderwood Foods Co. is open with 64 compared (50 simulated, 14 live) and 98.4%; Sunrise Electric Utility and Calderwood Foods Co. is closed with 30 compared (AC-06.4); Brightfield Paper Ltd and Calderwood Packaging Co. is closed below the threshold at 94.2% on 52; CloudDesk Software Ltd and Calderwood Packaging Co. is open with an alert of 7.7% sample errors (2 of 26, DF-16). | Awaiting user review |
| DF-50 | **Dashboard sample:** 100 invoices received in October 2026, 8 employee-expense invoices left out, 92 in the denominator, 62 touchless (67.4%), and 1 of 20 sampled withdrawn (5.0%), so the touchless rate is marked "not valid" (AC-27.1, AC-27.2). The wireframe reads "92 invoices received excluding 8" of AC-27.1 as 100 received less 8. | Awaiting user review |
| DF-51 | **Status chips carry a shape as well as text:** a hollow ring for a start state, a half-filled ring for work in progress, a dotted ring for waiting, a diamond for an exception, a filled dot for a good outcome, and a square for a final state. The names are exactly the states of BR-33, BR-34, and BR-35. | Awaiting user review |
| DF-52 | **Navigation in the wireframes:** links keep the current `?role=`, and the control bar of each page lists only the roles that may open it. The sidebar item that is highlighted is the page of the role, so an invoice opened from the decision queue still highlights "Invoices" in the Chief Accountant's sidebar. The breadcrumb shows where the user came from (Step 3). | Awaiting user review |

## Differences from Steps 1 to 3

None changes a requirement. Each is a place where a wireframe needed a detail that the sources do not give, and the wireframe makes a call. Review them before Step 6 builds the API.

| # | What the source says | What the wireframe does | Why |
|---|---|---|---|
| 1 | SCR-12 lets the AP Accountant "confirm a line match" (Step 3, inventory; AC-18.2). | Next to **Confirm match** it also draws **Choose another item**, for the case where the AI proposal is wrong. | Confirming is meaningless if the person cannot name the right item. Step 2 does not say how a wrong proposal is corrected. Awaiting user review. |
| 2 | SCR-76 lists "the sectors allowed to issue non-coded invoices (default: electricity)" (Step 3; DF-25). | Draws an **Add sector** control. | DF-25 says the list is in group configuration, so someone must edit it. Step 3 shows no edit control. Awaiting user review. |
| 3 | Step 2 says the XML signature check happens (BR-01, AC-10.2) and does not say which kind of actor makes it. | Labels it **Rule Engine** on SCR-12. | It is a deterministic check with no LLM. Awaiting user review. |
| 4 | AC-27.2 says the touchless rate is marked "not valid" above 1% misplacement. | Also draws a "Valid" chip below the limit, and per-entity "Valid" on the Group Admin table. | A figure that is not marked should still say it is valid, otherwise the absence of a mark can be missed. Awaiting user review. |
| 5 | SCR-12 shows "decision history with who or what decided" (Step 3). | Uses the same three tags as the rest of the app, plus a grey "System" and "Entity ERP" tag for intake and ERP events. | Intake, the paid status, and the sync are neither AI, Rule Engine, nor a person. Awaiting user review. |
| 6 | Step 3 (SCR-79) says the Open control is "disabled below 50 compared invoices". | Also shows **Below threshold** in text on SCR-78 for pairs under 98%, with a reason field in SCR-79 when the pair has 50 or more compared invoices. | AC-06.5 requires a written reason only in that case. Awaiting user review. |
| 7 | SCR-50 says the Payment Approver action is disabled until the Chief Accountant signed, "with a hint". | Disables the checkbox and Sign control and writes the reason in the row, and adds a notice above the table. A request that needs another level also shows "Needs the Department Head level". | The reason differs per row (order of signing, level, own signature). Awaiting user review. |
| 8 | The Step 3 state contract lists "Conflict" and "Audit write failure" as general states. | SCR-12 shows both as states (`conflict`, `audit-error`). Other pages with a state-changing action show `conflict` only. | Drawing the audit failure on every page would repeat one pattern. The rule is in the design system. Awaiting user review. |

No error was found in Step 3 while drafting. One ambiguity in Step 2 is recorded as DF-50.

**Related:** [Step index](README.md)
