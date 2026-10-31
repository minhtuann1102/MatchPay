# Navigation

> Design status: MVP — Step 3 of 9, approved
>
> Implementation status: NOT STARTED

## Global navigation (D-35)

Every role uses the same layout: a **left sidebar** with the pages of the role, and a **top bar**. All six roles are people who work in the system for hours (the Demo Operator only in the demo), so there is no top-bar-only layout as in a customer portal.

**Top bar, for every role:**

| Element | Content |
|---|---|
| Entity name | The name of the entity of the user, read-only: "Calderwood Foods Co." for Alice, Carol, Dan, Fiona, and Evan. The Group Admin sees "Calderwood Group". There is no entity switcher, because one user has one role in one entity (D-13, DF-36). The Demo Operator chooses an entity inside SCR-80, not in the top bar. |
| User | Name and role, for example "Alice, AP Accountant". Not a link, because there is no profile screen (D-38). |
| Log out | Ends the session and shows SCR-01 (AC-01.9). |
| Demo mark | For the Demo Operator the top bar shows "Demo only" next to the entity name. |

**Sidebar, by role.** Only the permitted items are rendered (AC-01.7). The first item is the home page (DF-28).

| Role | Sidebar items (in order) | Badges |
|---|---|---|
| AP Accountant | **Invoices** (SCR-10, home) · Batch (SCR-30) · Recurring profiles (SCR-20) · Dashboard (SCR-60) | Invoices: number of open exceptions |
| Chief Accountant | **Decisions** (SCR-40, home) · Signing queue (SCR-50) · Invoices (SCR-10, read-only) · Dashboard (SCR-60) · Audit log (SCR-61) | Decisions: tax-risk holds waiting. Signing queue: requests waiting for the Chief Accountant |
| Payment Approver | **Signing queue** (SCR-50, home) · Approvals (SCR-40) · Invoices (SCR-10, read-only) · Dashboard (SCR-60) | Signing queue: requests waiting at the approver's turn and level. Approvals: exceptions waiting at the approver's level |
| Entity Admin | **Entity policy** (SCR-73, home) · Approval matrix (SCR-74) · Users (SCR-70) · Dashboard (SCR-60) · Audit log (SCR-61) | None |
| Group Admin | **Group overview** (SCR-75, home) · Automation gates (SCR-78) · Entities and limits (SCR-76) · Users (SCR-70) · Dashboard (SCR-60) · Audit log (SCR-61) | Automation gates: number of gate alerts |
| Demo Operator | **ERP simulator** (SCR-80, home) | None |

Notes:

- The Decision Queue has two labels for one page: "Decisions" for the Chief Accountant and "Approvals" for the Payment Approver (D-40).
- A badge is a number computed on the server for the own entity (or, for the Group Admin, the group). It is text with a number, never only a coloured dot.
- If a Should story is cut, its sidebar item goes with it: "Recurring profiles" (US-09), "Entities and limits" (US-03), "Dashboard" (US-27), and "Audit log" (US-28). No home page is among them (see the [reachability paragraph](04-screen-inventory.md)).
- Roles never see a disabled sidebar item for a page they cannot open; they see no item.

## Local and contextual navigation

- **List → detail:** opening an invoice from SCR-10 opens SCR-12. Filters, sort, and scroll position of the list are kept, and "Back to Invoices" restores them (the filters live in the URL, DF-34).
- **Breadcrumbs** on detail pages: `Invoices / C26TAA-0000123` on SCR-12 opened from SCR-10; `Decisions / C26TAA-0000123` or `Approvals / C26TAA-0000123` when opened from SCR-40; `Signing queue / PR-0042 / C26TAA-0000123` when opened from a request line on SCR-51. SCR-51 shows `Signing queue / PR-0042`.
- **After an upload** (SCR-11): the modal shows the result per file, and closing it leaves the user on SCR-10 with the new rows at the top. The user never leaves the worklist while files are processed in the background.
- **After a decision on SCR-12** (SCR-14 Send, SCR-15, SCR-16, SCR-18, or a resolve action): return to the list the user came from, which is SCR-10 for the AP Accountant and SCR-40 for the Chief Accountant and the Payment Approver (DF-43). If the user came from a request line on SCR-51, the return goes to SCR-51.
- **After signing** (SCR-52): the user stays on SCR-50, or on SCR-51 if signing started there, and the page shows one result per request. Signed requests leave the "To sign" filter.
- **After releasing a batch** (SCR-32): the user stays on SCR-30, which now shows the payment requests and their status.
- **After removing a line or declining a request** (SCR-53, SCR-54): back to SCR-51 for a removed line, to SCR-50 after a declined request.
- **After login:** go to the home page of the role (DF-28). **After log out or session end:** go to SCR-01 (AC-01.9).
- **Conflict:** when a state-changing action is refused because the object changed (BR-37), the user stays where they are, the input is kept, and a Reload action is shown.

## Notifications

There are no notification centre, push messages, or emails to users beyond what Step 2 states (D-41). Step 2 states only these:

- An email from the AP Accountant to a supplier or an internal team, written in SCR-14 and sent only by the AP Accountant (BR-26).
- An internal reminder for the AP Accountant after 5 working days with no reply (DF-21), shown as the "Reminder due" filter and a mark on SCR-10.
- The alert for a failed ERP send (DF-24) and the gate alert (BR-06), shown on screen (DF-40).

New work is shown by the sidebar badges and by the order of the lists. Nothing else interrupts the user.

**Related:** [Step index](README.md) · [Routes and permissions](02-routes-and-permissions.md) · [User flows](05-user-flows.md)
