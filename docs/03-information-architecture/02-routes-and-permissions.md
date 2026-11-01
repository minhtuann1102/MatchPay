# Routes and Page Permissions

> Design status: MVP — approved
>
> Implementation status: NOT STARTED

## Routes

Routes are logical paths. The router mode (history or hash) is chosen in the architecture (DF-34). Modals have no route of their own: they open on top of their parent page and close back to it (D-36).

| Route | Screen | Notes |
|---|---|---|
| `/login` | SCR-01 Login | Public. Every protected route redirects here when there is no session (AC-01.4). |
| `/invoices` | SCR-10 Invoice Worklist | Search text and filters are kept in the query string, so Back restores them. |
| `/invoices/:id` | SCR-12 Invoice Detail and Evidence | Opened from SCR-10, SCR-30, SCR-40, SCR-51, or a notification (SCR-62). |
| `/recurring-profiles` | SCR-20 Recurring Profiles | |
| `/acceptance` | SCR-22 Acceptance Queue | Requesting Department only (D-90, DF-61). |
| `/mailbox` | SCR-24 Mailbox Log | AP Accountant only (D-92, DF-63). |
| `/batch` | SCR-30 Batch Review | The open batch of the period; the page shows the state of the batch. |
| `/decisions` | SCR-40 Decision Queue | Content depends on the role (D-40). |
| `/signing` | SCR-50 Signing Queue | |
| `/signing/requests/:id` | SCR-51 Payment Request Detail | Also opened from a notification (SCR-62). |
| `/delegations` | SCR-55 Signing Delegations | Chief Accountant and Payment Approver create and revoke their own; the Entity Admin reads and revokes (D-91). |
| `/dashboard` | SCR-60 Dashboard | |
| `/audit-log` | SCR-61 Audit Log | |
| `/notifications` | SCR-62 Notifications | The own notifications of the user (D-97). |
| `/users` | SCR-70 Users | |
| `/entity/policy` | SCR-73 Entity Policy | |
| `/entity/approval-matrix` | SCR-74 Approval Matrix | |
| `/group` | SCR-75 Group Overview | |
| `/group/entities` | SCR-76 Entities and Group Limits | |
| `/group/gates` | SCR-78 Automation Gates | |
| `/demo/erp-simulator` | SCR-80 ERP Simulator | Demo only. |
| `/403` | SCR-90 Access denied | Also shown in place of any page the role may not open. |

- Several roles share a route when they share a screen: `/invoices`, `/invoices/:id`, `/decisions`, `/signing`, `/delegations`, `/dashboard`, `/audit-log`, and `/users`. The server returns only the records and actions the role may use.
- **Entity scope is enforced by the server on every request (BR-09), not by the route.** No route carries an entity code. The entity comes from the account of the user (D-13), so a changed identifier in the URL gives SCR-90 and never another entity's data (AC-01.5).
- A signed-in user who opens `/login` goes to the home page of the role.

## Page permissions

Rows are pages, columns are roles. A dash means the role cannot open the page: the sidebar does not show it, and a direct URL gives SCR-90 (AC-01.6, AC-01.7).

| Screen | AP Accountant | Chief Accountant | Payment Approver | Requesting Department | Entity Admin | Group Admin | Demo Operator |
|---|---|---|---|---|---|---|---|
| SCR-01 Login | Public | Public | Public | Public | Public | Public | Public |
| SCR-10 Invoice Worklist | Own entity | Own entity, read-only | Own entity, read-only | — | — | — | — |
| SCR-12 Invoice Detail and Evidence | Own entity | Own entity, read-only | Own entity, read-only | — | — | — | — |
| SCR-20 Recurring Profiles | Own entity | — | — | — | — | — | — |
| SCR-22 Acceptance Queue | — | — | — | Own entity | — | — | — |
| SCR-24 Mailbox Log | Own entity | — | — | — | — | — | — |
| SCR-30 Batch Review | Own entity | — | — | — | — | — | — |
| SCR-40 Decision Queue | — | Own entity | Own entity, own level | — | — | — | — |
| SCR-50 Signing Queue | — | Own entity | Own entity | — | — | — | — |
| SCR-51 Payment Request Detail | — | Own entity | Own entity | — | — | — | — |
| SCR-55 Signing Delegations | — | Own entity, own delegations | Own entity, own delegations | — | Own entity, read and revoke | — | — |
| SCR-60 Dashboard | Own entity | Own entity | Own entity | — | Own entity | Per-entity aggregates | — |
| SCR-61 Audit Log | — | Own entity | — | — | Own entity | Group events only | — |
| SCR-62 Notifications | Own entity, own items | Own entity, own items | Own entity, own items | — | — | — | — |
| SCR-70 Users | — | — | — | — | Own entity | All entities | — |
| SCR-73 Entity Policy | — | — | — | — | Own entity | — | — |
| SCR-74 Approval Matrix | — | — | — | — | Own entity | — | — |
| SCR-75 Group Overview | — | — | — | — | — | Group, counts only | — |
| SCR-76 Entities and Group Limits | — | — | — | — | — | Group | — |
| SCR-78 Automation Gates | — | — | — | — | — | Group, counts only | — |
| SCR-80 ERP Simulator | — | — | — | — | — | — | Demo only |
| SCR-90 Access denied | All roles | All roles | All roles | All roles | All roles | All roles | All roles |

Notes on the cells:

- **Read-only on SCR-10 and SCR-12** (AC-17.4): the Chief Accountant and the Payment Approver get no upload, edit, or resolve control. SCR-12 shows an action panel to them only when the invoice awaits their own decision (a tax-risk hold for the Chief Accountant, an individual approval at the approver level for the Payment Approver). The evidence itself stays read-only (D-37).
- **Own level on SCR-40** (AC-23.1): a Payment Approver sees only the exceptions whose amount needs the level of that approver, so Department Head Dan sees amounts under VND 50,000,000 and CFO Fiona sees amounts from VND 50,000,000.
- **SCR-50 and SCR-51:** both signers see the requests of the entity. The action to sign needs the level that the request total requires (BR-03), the order of signing (DF-01), and no conflict of duty (BR-36). A signer who lacks it sees the control disabled with the reason, and the server refuses a direct request. During an active delegation (UC-30) the delegate also sees the requests that wait for the delegator's level, marked "On behalf of" (AC-30.2), and the delegator's own signing control is disabled (AC-30.8). The rule of BR-36 now also blocks a signer who processed an invoice of the request (AC-25.16, D-89).
- **Per-entity aggregates, group events only, and counts only for the Group Admin** (BR-09): the Group Admin never sees an invoice, a batch, a payment request, or an audit entry of an entity.
- **SCR-61:** the Payment Approver, the AP Accountant, the Requesting Department, and the Demo Operator get SCR-90 (AC-28.6).
- **SCR-22** (AC-29.8, AC-02.9): only the Requesting Department of the entity opens it. Every other role gets SCR-90, and a Requesting Department user gets SCR-90 on every other page of this table except SCR-01.
- **SCR-24** (AC-31.8): only the AP Accountant of the entity. The Chief Accountant, the Payment Approver, the Requesting Department, both administrators, and an AP Accountant of another entity get SCR-90.
- **SCR-55** (AC-30.9, AC-30.11): the Chief Accountant and the Payment Approver see the delegations they gave or received and create or revoke their own. The Entity Admin sees every delegation of the entity and can revoke one, but cannot create a delegation or sign. The Group Admin, the AP Accountant, the Requesting Department, and any user of another entity get SCR-90.
- **SCR-62** (AC-32.10): the AP Accountant, the Chief Accountant, and the Payment Approver see only notifications addressed to them. The Entity Admin, the Group Admin, the Demo Operator, and the Requesting Department get SCR-90.
- **Resend** (SCR-57, AC-26.10, AC-26.14): offered to the AP Accountant on SCR-30 and to the Chief Accountant on SCR-51, never to the Payment Approver and never for another entity.
- **SCR-80:** every other role gets SCR-90 (AC-08.7). The page is marked "Demo only".
- Modals follow the permission of the page that opens them, plus the role rule stated for each in the [screen inventory](04-screen-inventory.md).
- The seventh role, Requesting Department, was added by the mind map sync (D-90, D-101) as a new column. No existing cell changed.

The numbers SCR-13 and SCR-17 were removed by D-33 (foreign invoices moved to Advanced). They have no route and no permission row, and a request for the old path `/invoices/:id/confirm-fields` finds no page.

## Behaviour when access is missing

| Situation | Result |
|---|---|
| No session, or the session ended | Redirect to SCR-01 with a message; after login, go to the role home page (not back to the old URL, so a role change never lands on a forbidden page). |
| Session valid, page not permitted | SCR-90 with a link to the role home page. The sidebar still shows only permitted items. |
| Record of another entity requested by identifier | SCR-90, with no hint whether the record exists (BR-09, G-06). |
| Direct request without permission (bypassing the interface) | Rejected by the server and written to the audit log (AC-01.8). |

**Related:** [Information architecture index](README.md) · [Sitemap](01-sitemap.md) · [Navigation](03-navigation.md) · [Screen inventory](04-screen-inventory.md)
