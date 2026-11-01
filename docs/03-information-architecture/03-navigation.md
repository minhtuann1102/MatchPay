# Navigation

> Design status: MVP — approved
>
> Implementation status: NOT STARTED

## Global navigation (D-35)

Every role uses the same layout: a **left sidebar** with the pages of the role, and a **top bar**. All seven roles are people who work in the system (the Demo Operator only in the demo, and the Requesting Department only on one page), so there is no top-bar-only layout as in a customer portal. A role with one page, such as the Requesting Department, keeps the same layout so that every user finds the user name and Log out in the same place (D-101).

**Top bar, for every role:**

| Element | Content |
|---|---|
| Entity name | The name of the entity of the user, read-only: "Calderwood Foods Co." for Alice, Carol, Dan, Fiona, Rowan, and Evan. The Group Admin sees "Calderwood Group". There is no entity switcher, because one user has one role in one entity (D-13, DF-36). The Demo Operator chooses an entity inside SCR-80, not in the top bar. |
| User | Name and role, for example "Alice, AP Accountant". Not a link, because there is no profile screen (D-38). |
| Notifications | For the AP Accountant, the Chief Accountant, and the Payment Approver only: the link "Notifications" followed by the number of unread items, for example "Notifications 3", always as text with a number and never only a coloured dot. It opens SCR-62 (D-100, AC-32.6). The other roles do not see it (AC-32.10). |
| Log out | Ends the session and shows SCR-01 (AC-01.9). |
| Demo mark | For the Demo Operator the top bar shows "Demo only" next to the entity name. |

**Sidebar, by role.** Only the permitted items are rendered (AC-01.7). The first item is the home page (DF-28).

| Role | Sidebar items (in order) | Badges |
|---|---|---|
| AP Accountant | **Invoices** (SCR-10, home) · Batch (SCR-30) · Mailbox (SCR-24) · Recurring profiles (SCR-20) · Notifications (SCR-62) · Dashboard (SCR-60) | Invoices: number of open exceptions |
| Chief Accountant | **Decisions** (SCR-40, home) · Signing queue (SCR-50) · Delegations (SCR-55) · Invoices (SCR-10, read-only) · Notifications (SCR-62) · Dashboard (SCR-60) · Audit log (SCR-61) | Decisions: tax-risk holds waiting. Signing queue: requests waiting for the Chief Accountant |
| Payment Approver | **Signing queue** (SCR-50, home) · Approvals (SCR-40) · Delegations (SCR-55) · Invoices (SCR-10, read-only) · Notifications (SCR-62) · Dashboard (SCR-60) | Signing queue: requests waiting at the approver's turn and level. Approvals: exceptions waiting at the approver's level |
| Requesting Department | **Acceptance queue** (SCR-22, home) | Acceptance queue: service invoices of the entity waiting for acceptance |
| Entity Admin | **Entity policy** (SCR-73, home) · Approval matrix (SCR-74) · Users (SCR-70) · Delegations (SCR-55) · Dashboard (SCR-60) · Audit log (SCR-61) | None |
| Group Admin | **Group overview** (SCR-75, home) · Automation gates (SCR-78) · Entities and limits (SCR-76) · Users (SCR-70) · Dashboard (SCR-60) · Audit log (SCR-61) | Automation gates: number of gate alerts |
| Demo Operator | **ERP simulator** (SCR-80, home) | None |

Notes:

- The Decision Queue has two labels for one page: "Decisions" for the Chief Accountant and "Approvals" for the Payment Approver (D-40).
- A badge is a number computed on the server for the own entity (or, for the Group Admin, the group). It is text with a number, never only a coloured dot.
- If a Should story is cut, its sidebar item goes with it: "Recurring profiles" (US-09), "Entities and limits" (US-03), "Dashboard" (US-27), "Audit log" (US-28), "Acceptance queue" (US-29), "Delegations" (US-30), "Mailbox" (US-31), and "Notifications" with the top-bar count (US-32). The only home page among them is the acceptance queue of the Requesting Department, whose role then has no page (see the [reachability paragraph](04-screen-inventory.md)).
- Roles never see a disabled sidebar item for a page they cannot open; they see no item.

## Local and contextual navigation

- **List → detail:** opening an invoice from SCR-10 opens SCR-12. Filters, sort, and scroll position of the list are kept, and "Back to Invoices" restores them (the filters live in the URL, DF-34).
- **Breadcrumbs** on detail pages: `Invoices / C26TAA-0000123` on SCR-12 opened from SCR-10; `Batch / C26TAA-0000123` when opened from an invoice line of SCR-30 (AC-17.12); `Notifications / C26TAA-0000123` when opened from a notification; `Decisions / C26TAA-0000123` or `Approvals / C26TAA-0000123` when opened from SCR-40; `Signing queue / PR-0042 / C26TAA-0000123` when opened from a request line on SCR-51. SCR-51 shows `Signing queue / PR-0042`.
- **After an upload** (SCR-11): the modal shows the result per file, and closing it leaves the user on SCR-10 with the new rows at the top. The user never leaves the worklist while files are processed in the background.
- **After a decision on SCR-12** (SCR-14 Send, SCR-15, SCR-16, SCR-18, SCR-19, or a resolve action): return to the list the user came from, which is SCR-10 or SCR-30 for the AP Accountant and SCR-40 for the Chief Accountant and the Payment Approver (DF-43). If the user came from a request line on SCR-51, the return goes to SCR-51.
- **After signing** (SCR-52): the user stays on SCR-50, or on SCR-51 if signing started there, and the page shows one result per request. Signed requests leave the "To sign" filter.
- **After releasing a batch** (SCR-32): the user stays on SCR-30, which now shows the payment requests and their status. The same holds after Expand sample (SCR-33), Reopen for review (SCR-34), and Resend (SCR-57); SCR-51 is the page after a Resend started there.
- **After confirming or rejecting an acceptance** (SCR-23): the user stays on SCR-22 and the invoice leaves the queue.
- **After saving a delegation** (SCR-56): the user stays on SCR-55, where the new delegation appears as Scheduled or Active.
- **After removing a line or declining a request** (SCR-53, SCR-54): back to SCR-51 for a removed line, to SCR-50 after a declined request.
- **After login:** go to the home page of the role (DF-28). **After log out or session end:** go to SCR-01 (AC-01.9).
- **Conflict:** when a state-changing action is refused because the object changed (BR-37), the user stays where they are, the input is kept, and a Reload action is shown.

## Notifications

There is a notification list, SCR-62, with an unread count in the top bar (D-100). This **reverses D-41** ("There is no notification centre"), which said that no story asked for notifications; US-32 now does (D-97). Notifications are in-app only, and no email goes to staff (AC-32.8). Each item has a recipient, a link to its object, and a read mark (DF-67).

| Recipient | Notification | Opens |
|---|---|---|
| Chief Accountant, then Payment Approver | A batch is released and requests wait for the signature of the user; after the Chief Accountant signs a request, the Payment Approver at its level gets one for it (AC-32.1) | SCR-50 |
| AP Accountant | A new exception, with the invoice and the first reason (AC-32.2) | SCR-12 |
| AP Accountant | A request returned or declined, or cancelled because every line was removed, with the reason (AC-32.3) | SCR-30 (the AP Accountant cannot open SCR-51; the batch page shows the requests) |
| AP Accountant | A service acceptance was rejected by the Requesting Department (AC-29.3) | SCR-12 |
| AP Accountant, Chief Accountant | A request was cancelled after signing because a cancellation notice arrived (AC-18.14) | SCR-30 for the AP Accountant, SCR-51 for the Chief Accountant |
| AP Accountant | Reminder: a correction request past 5 working days with no reply, repeated once a day until a reply is recorded or a follow-up invoice is linked (AC-32.4, DF-21) | SCR-12 of the invoice with the correction request |
| Signer whose signature is awaited | Reminder: a request still waiting for a signature after its due date, repeated once a day until it is signed or cancelled (AC-32.5, DF-67) | SCR-51 |

Other rules:

- An item opens its object and is marked read. The count of unread items falls with it. An item whose work is done no longer reminds (AC-32.6).
- Items of one entity are never created for, or shown to, a user of another entity (AC-32.7, BR-09).
- A notification that cannot be saved never stops the action that caused it; the failure is logged (AC-32.9, DF-67).
- The Entity Admin, the Group Admin, the Demo Operator, and the Requesting Department get no notification list and no top-bar count (AC-32.10). The Requesting Department sees new work as the badge on the acceptance queue.
- Sidebar badges stay as they were (open exceptions, tax-risk holds, requests waiting, gate alerts); they show counts of work, while SCR-62 shows events and reminders.
- Besides the notifications, requirements states the same on-screen alerts as before: the AP Accountant's email to a supplier or an internal team, written in SCR-14 and sent only by the AP Accountant (BR-26); the internal reminder after 5 working days, also shown as the "Reminder due" filter and a mark on SCR-10 (DF-21); the alert for a failed ERP send (DF-24) and the gate alert (BR-06), shown on screen (DF-40, DF-69).

**Related:** [Information architecture index](README.md) · [Routes and permissions](02-routes-and-permissions.md) · [User flows](05-user-flows.md)
