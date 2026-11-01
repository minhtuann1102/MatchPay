# Design System

> Design status: MVP — Step 4 of 9, approved
>
> Implementation status: NOT STARTED
>
> Revision R1 (UX redesign, 2026-11-01): draft for review

Source of truth: [`wireframes/assets/wireframe.css`](wireframes/assets/wireframe.css). Step 9 reuses these tokens. The concept is a call awaiting user review (D-44).

## Concept: three hands

MatchPay mixes three kinds of authorship on one page: what the **AI proposed**, what the **Rule Engine decided**, and what a **person decided or signed**. A signer must never confuse them. Every block, tag, and row therefore says who wrote it, in text and in shape:

| Hand | Meaning | Rail on the left edge | Tag | Used for |
|---|---|---|---|---|
| **AI proposed** | Evidence. Never a decision. | Dotted, teal | Round, dashed outline, diamond icon, text "AI proposed" | Flow and reason, entity and order match, line matches with probability, anomaly numbers, the sample, drafts, the signing summary |
| **Rule Engine** | A transparent check. | Double line, steel blue | Square corners, solid outline, checklist icon, text "Rule Engine" | The six conditions with their values, the XML signature check, request totals, sample-check results |
| **Person** | A decision or a signature. | Solid, ink | Filled dark pill, seal icon, the person's name | Resolve actions, decisions, sample marks, signature records |

Document and ERP content (the XML fields, orders, receipts, the paid status) carries a plain grey "Document data", "ERP data", "System", or "Entity ERP" tag. This is the one bold element. Everything else stays quiet: neutral surfaces, thin borders, one font family, shadows only on modals.

Rules:

1. The rail style and the tag always go together, and the tag always carries text, so the meaning survives a black-and-white print.
2. An AI element never looks like it has acted. A draft or a summary appears next to the evidence, and nothing is sent or signed until a person presses the button.
3. The "You decide" tag (Person) heads every action panel. The AI has no signing control (AC-25.9).
4. Teal is used only for the AI hand, steel blue only for the Rule Engine hand. Warning amber and error red are used only for status and never for authorship.

## Tokens

### Color

| Token | Hex | Role |
|---|---|---|
| `--canvas` | `#f3f2ee` | Page background |
| `--surface` | `#ffffff` | Cards, tables, modals |
| `--ink` | `#1b2130` | Text, primary buttons, Person hand |
| `--ink-2` | `#4a5364` | Secondary text |
| `--ink-3` | `#6b7385` | Hints, metadata (4.8:1 on white) |
| `--line` / `--line-2` | `#dcdde2` / `#c3c6cf` | Borders, input borders |
| `--nav` / `--nav-text` | `#1b2133` / `#c9cfdc` | Sidebar |
| `--ai` / `--ai-wash` / `--ai-line` | `#0b6677` / `#e2f1f3` / `#8cc2cb` | AI hand only |
| `--rule` / `--rule-wash` / `--rule-line` | `#3d4f73` / `#eaeef6` / `#aab5cc` | Rule Engine hand, reason tags, "In Check" and "Sent" chips |
| `--person` / `--person-wash` | `#1b2130` / `#f3eee2` | Person hand: signature records and decision rails |
| `--ok` / `--ok-wash` | `#1b7a43` / `#e5f3ea` | Pass, In Batch, Signed, Paid, Active |
| `--warn` / `--warn-wash` | `#965400` / `#fbf0dc` | Exception, Due soon, Below threshold, stale data, Demo only |
| `--err` / `--err-wash` | `#b3261e` / `#fbe9e7` | Fail, Rejected, validation and server errors, destructive actions |
| `--annot` | `#f2b300` | Wireframe annotation numbers and the control bar only. Never product UI. |

### Type

IBM Plex Sans (400, 500, 600) for text and IBM Plex Mono (400, 500) for identifiers, hashes, and condition values. Both are under the SIL Open Font License and bundled in `wireframes/assets/fonts/` with `OFL.txt`; the fallback is `Segoe UI, system-ui, sans-serif`. Amounts use `font-variant-numeric: tabular-nums` and sit right-aligned.

| Use | Size / weight |
|---|---|
| Page title | 24 / 600 |
| Modal title | 20 / 600 |
| Card title | 16 / 600 |
| Body, inputs | 14 / 400, line height 1.5 |
| Table, secondary | 13 / 400–500 |
| Meta, tags, chips | 12 / 500–600 |
| Key figure (dashboard) | 32 / 600 |

Sentence case everywhere; no all-caps labels.

### Space and shape

Spacing steps: 4, 8, 12, 16, 24, 32, 48 px. Radius follows the hands: surfaces 8, controls 5, AI tags fully round, Rule Engine tags 2 (square), chips fully round. Focus ring: 2 px steel blue with a 2 px offset.

## Components

| Component | Notes |
|---|---|
| Sidebar | Dark, brand first, only the permitted items of the role (AC-01.7), current item with a light bar, count badge as white text on a pill ("Count 6" for screen readers). Collapses to a "Menu" button under 900 px. |
| Top bar | Entity name (read-only, no switcher), "Demo only" mark for the Demo Operator, user as "Alice, AP Accountant", Log out. No profile (D-38). |
| Buttons | Primary (ink fill), secondary (outline), quiet (text), danger (red outline), danger solid for the confirming button of a destructive modal. Disabled buttons are dimmed with `aria-disabled` and always have the reason written beside them. |
| AI controls and AI-labelled text | A dashed round tag "AI proposed" in the header of the panel, a dotted rail on the text, and for AI buttons a dashed teal outline. The AI draft in SCR-14 sits in an editable field with the notice "Nothing is sent until you press Send." |
| Rule-check row | Square number box 1 to 6, condition, value in mono, and a result tag with an icon: Pass (green check), Fail (red cross), Not evaluated (grey). A failing row has a faint red wash. |
| Signature record | A seal with the initial, name and role, then time, request version, and content hash. Signed: solid ink border on a warm wash. Pending: dashed grey border. |
| State chips | One chip per state of BR-33, BR-34, BR-35, text first, with a shape (DF-51). Exception state is a second chip or a sub-line ("In Review", "Waiting for Decision: Chief Accountant"). Exception reasons are square steel-blue tags with their numbers ("Price +2.5%, tolerance 2%"). Flags (New supplier, Bank account changed) are amber tags with an alert icon. |
| Probability display | The number, a meter with a black tick at the threshold (0.90 for lines, 98% for gates), and a word: Matched, Doubtful, At threshold, Above threshold, Below threshold. A doubtful bar is hatched, so it is not only amber. |
| Money cell | `VND 53,000,000`: currency code first, comma separator, no decimals, right-aligned, tabular. |
| Due-date mark | `04/11/2026` and, within 7 days, an amber tag "Due soon" with a clock icon (AC-17.8). "Reminder due" is a tag with a clock icon. |
| Sync-time mark | "Last ERP sync: 31/10/2026 09:15" with a refresh icon. When the sync failed the line turns into an amber notice "ERP sync failed. Data shown is from 31/10/2026 09:15." and stays until a sync succeeds. |
| Gate accuracy meter | A 110 px meter, a tick at 98%, the percentage, and the counts ("49 of 50 confirmed unchanged"). A pair below the threshold is hatched and says "Below threshold". "Simulated history" is a grey tag beside the figures that come from the seed. |
| Modal | Title, one consequence sentence, fields, a footer with a quiet Cancel and one primary action named by its effect. It sits over its page, closes with `Escape` unless a submission or signing runs, and returns focus to the control that opened it. Decision modals focus the reason field first. |
| Toast | Dark pill at the bottom right for a success message, with an icon. |
| Notice | Left-ruled box: error (red), warning (amber), success (green), info (grey), AI (dotted teal rail), Rule Engine (double steel rail). Errors and conflicts are announced (`role="alert"`). |
| Empty and error blocks | A dashed round icon, one-line title, one sentence, and the next permitted action. "No results" is a notice that names the active filters and offers **Clear filters**. A server error says what happened in one line and offers **Retry**. |
| Skeleton | Grey bars with a slow shimmer that stops under `prefers-reduced-motion`; the shell and sidebar stay. |
| Tables | Light header, 10 px cell padding, an amber left rule for a row that needs attention, a total row in the footer. Under 760 px the list tables turn into cards with a label for each value. |
| Conflict and audit-write-failure notices | "This item was changed by someone else. Reload to see the change." with **Reload**, and "Action not completed. The audit log could not be written. Try again." with **Retry**. Input is kept. |

## Layout patterns (R1)

Revision R1 (draft for review, D-73..D-81) changes how the pages are laid out, not what they say. The tokens, the three hands, and the components above are kept. The patterns below are in the same stylesheet (`wireframes/assets/wireframe.css`, block "R1") and the same script (`states.js`). Where a value below differs from the one above (the page title is 22 px, not 24 px), the R1 value applies to the redesigned pages.

### Patterns P1 to P11

| ID | Pattern | Class and behavior | Used on |
|---|---|---|---|
| P1 | **Page header** | `.ph`: breadcrumb, title row (title, state chip, key amount on the right), a one-line meta or a row of key facts, and an action group on the right with at most one primary button. Anything else goes into a **More** menu (`<details class="menu">`, works without script, closes on an outside click). | Every page except SCR-01 and SCR-90 |
| P2 | **Summary strip** | `.kpis` with 3 to 5 `.tile`: label, value, one small sub-line. On SCR-10 a tile is a button that jumps to the matching tab (`data-tile-tab`). A warning tile has an amber left rule. | SCR-10, SCR-30, SCR-40, SCR-50, SCR-60, SCR-75, SCR-78 |
| P3 | **View tabs with counts** | `.tabs` with `role="tablist"`, a `.pill` count on each tab, `data-tab` and `data-panel`. On a list the tabs are **saved views** of one table (`data-filter` hides rows, `data-count` and `data-total` feed the footer). On an object page they are sections of the evidence. A tab is a view and not a state: it is not in the control bar and does not use `data-show`. `?tab=<id>` selects one. | SCR-10, SCR-12, SCR-20, SCR-40, SCR-50, SCR-51 |
| P4 | **Toolbar** | `.toolbar`: a search field with an icon, a **Filters** button with the number of active filters, removable `.fchip` chips for the active filters, and the result count on the right. The filter form (`.filter-panel`) is hidden until the button is pressed; `?filters=1` opens it for a PNG. | SCR-10, SCR-40, SCR-50, SCR-61, SCR-70, SCR-80 |
| P5 | **Compact table** | `.tbl.compact`: one line per row (44 to 48 px), sticky header, no wrapping, a muted second line in the first column only, at most one reason tag and a "+N" pill with a tooltip, a chevron or one real action at the right (a text button only when it is an action, never to open), row hover, and a footer (`.tbl-foot`, `.pagin`) with "Showing 1-6 of 6". `.grp-row` and `.sub-row` give a group heading and a subtotal. | Every list |
| P6 | **Object page** | `.stepper` (horizontal lifecycle: done, current, next; the current step may carry a warning mark or an error mark), an **attention card** (`.attn-card`: what blocks the item, in one line each, with a link to the tab that holds the evidence), tabs (P3), and `.obj-grid` with the evidence on the left and the sticky `.obj-act` column on the right. | SCR-12, SCR-51; the stepper alone on SCR-30 |
| P7 | **Action panel** | `.actpanel`: header "You decide" with the Person tag; one `.nextstep` card with one primary button; other resolutions as compact `.alt` rows (title, one-line hint, secondary button); a footer `.ap-foot` with the destructive action as a quiet danger link or in a More menu; a `.tip` mark for explanations (tooltip); `.ro-note` for the read-only roles. Focused forms replace the next-step card. | SCR-12, SCR-51 |
| P8 | **Progressive disclosure** | `<details>`: passed Rule Engine conditions (`.passed`, "N passed"), the AI reasoning (`.why-ai`, "Why the AI proposed this"), history older than the latest three (`.hist-more`), and an expanding audit row (`.rd`). Failed items are open by default. | SCR-12, SCR-51 (the AI summary folds), SCR-61 |
| P9 | **Drawer** | `.drawer-back` and `.drawer`: right side, 480 px, full width under 900 px, a sticky header and footer, `Escape` closes, focus returns to the control that opened it. For forms with more than 3 fields. Short confirmations stay centered modals. | SCR-21, SCR-71, SCR-77, SCR-81, SCR-82 |
| P10 | **Empty, loading, error** | The same blocks as above (empty block, skeleton, error notice with **Retry**), restyled to the new components; the header and the tabs stay while the body loads. | Every page |
| P11 | **Density and width** | Content at most 1320 px wide; page padding 24 px; card padding 16 px; table cells 8 by 12 px; body 14 px, tables 13 px; page title 22 px / 600. Default view of a page fits about one screen at 1440 px (900 px, and 1100 px for SCR-12 and SCR-51). | Every page |

### New components

| Component | Notes |
|---|---|
| Stepper | A row of dots joined by a line. Done: filled dot with a check. Current: ring, bold label, optional sub-line (the exception state, a time, a name). Warning mark for an exception, error mark for a failed send. Next: hollow dot. The label is always text, so the state survives a black-and-white print. A sub-line never repeats its label. |
| KPI tile | A label, a figure (22 to 24 px, tabular), and a sub-line. Counts are links to the list with the same count (AC-27.6). No colour judges a person. |
| Saved-view tabs | Underlined tabs with a count pill. The selected tab is bold with an ink underline; the pill of a tab that needs action is amber. The counts follow the rows that the active role can see. |
| Toolbar and filter chips | A search field, a **Filters** button, and chips such as "State: Exception" or "Reminder due" with a remove control. "No results" still names the chips and offers **Clear filters** (AC-17.7). |
| Menu (overflow) | A quiet "More" button that opens a short list; destructive items in red text. Native `<details>`, so it works without script. |
| Drawer | A panel over a dimmed page, 480 px, title, form, and a footer with a quiet Cancel and one primary action named by its effect. States of the parent page (`form`, `form-error`, `create`, `edit`, `add`, and the like). |
| Sticky action bar | At the foot of the signing queue: "N selected, VND x" and **Sign selected**. It stays at the foot of the view while the table scrolls. |
| Attention card | A left-ruled card (amber for a blocking exception, green for a clean item) with one line per blocker, in plain words, and a link to the tab with the evidence. It holds no action. |
| Settings layout | `.settings`: a sub-navigation of sections on the left, sections on the right, and a sticky save bar ("Unsaved changes", Discard, Save). |
| Tooltip mark | A small "i" mark with a `title` for text that is not needed to act. The text is the Step 4 text. It does not show in a PNG or on a touch screen (D-85). |

### Rules for the layout

1. **One primary action per view.** The header and the panel never repeat an action (D-82). A text button is for a real action; opening a row is a chevron or the link on the first column.
2. **What blocks comes first.** On an object page the first screen shows what the item is, where it is in its life, what blocks it, and the next step.
3. **Hide detail, never remove it.** Folded and tabbed content stays in the page, with a count or a label that says it is there ("3 passed", "Checks 3 failed", "History 5").
4. **Tabs are views.** They never change the state of the item and they are not listed in the control bar. A PNG that is about a tab is exported with `?tab=<id>`.
5. **Three hands survive the new layout.** Every folded block, tab body, drawer, and tile that carries AI or Rule Engine content keeps its rail and its tag (D-44).

## Chart rules (dashboard)

- Counts by state and by age are **single-series horizontal bars** in one neutral ink colour, each bar labelled with its value; categories are text labels, so no categorical palette is needed. Each chart offers a "View as table" link.
- The oldest age group uses a hatched fill, not a different hue.
- The touchless rate is a number with its counts and formula, never a bare gauge. The AI misplacement rate sits beside it with the note that the sample is weighted by risk. Above 1% the touchless rate carries the red text mark "not valid" (AC-27.2); at or below 1% it carries a green "Valid".
- No colour judges a person. The Group Admin table shows counts and rates per entity as text; it ranks nothing and contains no invoice data (BR-09).
- Every figure is a link to the list with the same count (AC-27.6). Waiting for Goods is its own count and is not part of the exception chart (AC-27.5).

## Accessibility and responsiveness

- Visible focus ring on every control; a visible label on every input; icon-only buttons have an accessible name.
- A state, a flag, an AI label, and a result always pair colour with text or shape (WCAG 1.4.1).
- Live regions: upload results, signing results, conflict and error notices.
- Breakpoints: 1180 px (two-column layouts stack; on SCR-12 the order is header, action panel, evidence, history), 900 px (sidebar becomes a "Menu" button), 760 px (list tables become cards; the signing bar sticks to the bottom).
- Colour contrast: body text and tag text are at least 4.5:1 on their background. Not measured with a tool in Step 4: **Unverified**; a contrast audit of the final colours would confirm it.

**Related:** [Step index](README.md)
