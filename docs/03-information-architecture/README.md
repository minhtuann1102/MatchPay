# 03 — Information Architecture

> Design status: MVP — Step 3 of 9, approved
>
> Implementation status: NOT STARTED

Step 3 organizes the screens of **MatchPay**: a sitemap by role, routes and page permissions, navigation, the screen inventory (35 active screens: 18 pages and 17 modals; SCR-13 and SCR-17 are removed by D-33 and their numbers are not reused), four primary user flows, and the UI and AI states. Inputs: [02 — Use cases and user stories](../02-usecases-userstories/README.md) and [Business rules](../requirements/business-rules.md). It is the input for Step 4 (UI/UX wireframes) and Step 6 (screen-to-API mapping). The six roles are the AP Accountant, the Chief Accountant, the Payment Approver, the Entity Admin, the Group Admin, and the demo-only Demo Operator.

| File | Content |
|---|---|
| [00-decisions.md](00-decisions.md) | Decisions D-34..D-41; defaults DF-34..DF-44; differences from Step 2 |
| [01-sitemap.md](01-sitemap.md) | Sitemap by role (page cards in areas) and screens per role with home pages |
| [02-routes-and-permissions.md](02-routes-and-permissions.md) | Routes and the page-permission table |
| [03-navigation.md](03-navigation.md) | Sidebar and top bar per role, contextual navigation, notifications |
| [04-screen-inventory.md](04-screen-inventory.md) | Screens and modals SCR-xx, requirement-to-screen mapping for US-01..US-28 (US-11 and US-22 removed), reachability of Must stories, screen-to-API mapping |
| [05-user-flows.md](05-user-flows.md) | Demo set-up and invoice intake; AP Accountant resolves an exception; month-end batch, signing, and payment; Group Admin opens an automation gate |
| [06-ui-states-and-accessibility.md](06-ui-states-and-accessibility.md) | UI state contract, status chips for BR-33..BR-35, AI and ERP send states, responsive and accessibility rules |

**Related:** [README](../../README.md) · [Previous: Use cases and user stories](../02-usecases-userstories/README.md) · [Master traceability](../traceability/master-traceability.md)
