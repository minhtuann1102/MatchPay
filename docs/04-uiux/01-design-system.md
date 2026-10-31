# Design System

> Design status: MVP — Step 4 of 9, draft for review
>
> Implementation status: NOT STARTED

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
