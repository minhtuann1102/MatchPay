# 03 — Information Architecture

> Design status: MVP — Step 3 of 9, approved
>
> Implementation status: NOT STARTED

Step 3 organizes the screens of **MatchPay**: a sitemap by role, routes and page permissions, navigation, the screen inventory (45 active screens: 22 pages and 23 modals; SCR-13 and SCR-17 are removed by D-33 and their numbers are not reused), seven primary user flows, and the UI and AI states. The sync to the feature mind map (D-88, 2026-11-01) added the seventh role, ten screens, three flows, and a notification centre that reverses D-41; those changes are **draft for review** (see [Decisions](00-decisions.md#changes-made-to-step-3-for-the-mind-map-sync-d-88)). Inputs: [02 — Use cases and user stories](../02-usecases-userstories/README.md) and [Business rules](../requirements/business-rules.md). It is the input for Step 4 (UI/UX wireframes) and Step 6 (screen-to-API mapping). The seven roles are the AP Accountant, the Chief Accountant, the Payment Approver, the Requesting Department, the Entity Admin, the Group Admin, and the demo-only Demo Operator.

| File | Content |
|---|---|
| [00-decisions.md](00-decisions.md) | Decisions D-34..D-41 and D-100..D-107; defaults DF-34..DF-44 and DF-69..DF-72; differences from Step 2; changes for D-33 and for the mind map sync |
| [01-sitemap.md](01-sitemap.md) | Sitemap by role (page cards in areas) and screens per role with home pages |
| [02-routes-and-permissions.md](02-routes-and-permissions.md) | Routes and the page-permission table |
| [03-navigation.md](03-navigation.md) | Sidebar and top bar per role, contextual navigation, notifications |
| [04-screen-inventory.md](04-screen-inventory.md) | Screens and modals SCR-xx, requirement-to-screen mapping for US-01..US-32 (US-11 and US-22 removed), reachability of Must stories, screen-to-API mapping |
| [05-user-flows.md](05-user-flows.md) | Demo set-up and invoice intake (with email intake); AP Accountant resolves an exception (with cancellation notices); month-end batch, signing, and payment (with expand sample, reopen, resend); Group Admin opens an automation gate; service acceptance; signing delegation; notification click-through |
| [06-ui-states-and-accessibility.md](06-ui-states-and-accessibility.md) | UI state contract, status chips for BR-33..BR-35, AI and ERP send states, responsive and accessibility rules |

**Related:** [README](../../README.md) · [Previous: Use cases and user stories](../02-usecases-userstories/README.md) · [Next: UI/UX](../04-uiux/README.md) · [Master traceability](../traceability/master-traceability.md)
