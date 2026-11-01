# MoSCoW Prioritization

> Design status: MVP — Step 2 of 9, approved
>
> Implementation status: NOT STARTED

**Every Must and Should story is planned for this MVP.** MoSCoW only sets the build order and shows what to cut first if time runs out.

| Priority | Stories | Count |
|---|---|---|
| **Must**: the core chain cannot work without it (users and policy, source data, intake, the AI checks, the Rule Engine, exceptions, sample check, signing, sending to the ERP) | US-01, US-02, US-04, US-05, US-06, US-07, US-08, US-10, US-12, US-13, US-14, US-15, US-16, US-17, US-18, US-21, US-23, US-24, US-25, US-26 | 20 |
| **Should**: important and planned, but the core chain still works without it | US-03, US-09, US-19, US-20, US-27, US-28, US-29, US-30, US-31, US-32 | 10 |
| **Could** | None. Every remaining item was either in the brief's Advanced column or explicitly ruled out. | 0 |
| **Won't** (this release) | W-01..W-21, listed below | 21 |
| **Removed (D-33)**: US-11 Upload foreign PDF invoice and confirm fields, US-22 Confirm foreign tax obligations. They are not in the 30 active stories; their numbers are not reused. | Moved to Advanced as W-19 and W-20 | — |

One priority differs from the first proposal: **US-06 (automation gates) is a Must** (D-27), because without a way to open a gate, condition 5 of BR-05 fails for every supplier and no invoice can join a batch. The second move, US-22 as a Should (D-32), no longer applies: the user removed foreign invoices and the cash flag from the MVP (D-33), so US-11 and US-22 are Advanced items W-19 and W-20. The sync to the feature mind map (D-88) added four Should stories: US-29 Confirm service acceptance (D-90), US-30 Delegate signing authority (D-91), US-31 Receive invoices by email (D-92), and US-32 Receive notifications and reminders (D-97). They are Should because the core chain still works without each of them, and no Must story depends on them. The MVP has 30 stories: 20 Must and 10 Should. No Must story has a Should part inside it; the criteria added to Must stories (US-10, US-17, US-18, US-23, US-24, US-25, US-26) belong to those stories and are planned with them.

## Must stories that depend on a Should story

| Must story | Depends on | If the Should story is cut |
|---|---|---|
| US-04 | US-03 | US-04 depends on US-03 for the group limits. The limits (price tolerance 5%, batch threshold VND 300,000,000) and the list of sectors for non-coded invoices are fixed in the seed data (DF-13, DF-25), so US-04 works the same and only the group screen is missing. |

## If time runs short

Cut Should stories in this order, from the first to be cut. The consequence is what the demo loses.

| Order | Story | What the demo loses |
|---|---|---|
| 1 | US-28 View audit log | The decisions are still written to the log; they cannot be read in the application. |
| 2 | US-27 View dashboard | G-01 and G-02 are read from the labelled data set instead of a screen. |
| 3 | US-32 Notifications and reminders | Work shows only in the lists and badges of the screens; reminders for overdue requests and correction requests are not raised (the reminder of DF-21 stays on the exception). |
| 4 | US-31 Receive invoices by email | The AP Accountant uploads each XML file by hand (US-10). |
| 5 | US-30 Delegate signing authority | An absent signer's requests wait; no one signs for them, and the Entity Admin cannot name a replacement. |
| 6 | US-20 Re-check follow-up invoice | The AP Accountant links a follow-up invoice by hand. |
| 7 | US-19 Correction requests | The AP Accountant writes requests by hand; no AI draft. |
| 8 | US-29 Confirm service acceptance | A service acceptance comes from the ERP only, as before; a service invoice with no ERP acceptance stays `Waiting for Goods`. |
| 9 | US-09 Recurring profiles | Every recurring invoice, including electricity, becomes an exception. |
| 10 | US-03 Entities and group limits | The three entities, the group limits, and the sector list are fixed in the seed data. |

## Won't (this release)

These are the Advanced items of the brief and of the Step 1 decisions. W-05 and W-13 were reworded by the sync to the feature mind map: their MVP parts (the simulated mailbox and the simulated status lookup) moved into the MVP, and their numbers stay. They are designed and documented as a roadmap in [Future work](../01-research/09-future-work.md), and no use case or story is written for them. A rule that is entirely Advanced (BR-22, BR-21, BR-32) is carried by its item here instead of by a story. BR-18 and the PDF part of BR-17 are Advanced too, carried by W-19, W-09, and W-03.

| ID | Item | Related rules and decisions |
|---|---|---|
| W-01 | Automatic gate opening and closing | BR-06, D-06 |
| W-02 | Group-control actor | BR-06 |
| W-03 | Medium-trust PDF invoices confirmed by an independent source | BR-17 |
| W-04 | Subscriptions charged to a card (confirm afterwards, refund, card limit) | BR-22 |
| W-05 | Supplier portal where suppliers upload XML invoices themselves (the mailbox part moved into the MVP as UC-31, D-92) | O-10, D-92 |
| W-06 | Real ERP connection for each entity | A-03 |
| W-07 | Anomaly detection and comparison across entities (aggregates only, hidden under 3 entities) | BR-09, D-09 |
| W-08 | Suggested foreign contractor tax type (builds on W-20) | BR-21, O-07 |
| W-09 | Finding the original XML from a PDF (builds on W-19) | BR-18 |
| W-10 | Periodic retraining of the signal-fusion model | BR-28 |
| W-11 | Approval on mobile | A-08 |
| W-12 | Mid-period batches by contract deadline | D-10 |
| W-13 | Real connection point for the invoice status at the tax authority (the MVP uses a simulated lookup, BR-39, D-93) | O-10, BR-39, D-93 |
| W-14 | Cross-check of customs declarations (builds on W-20) | BR-21 |
| W-15 | Manual entry of other documents and self-made purchase lists | BR-23 |
| W-16 | Travel and hotel bookings through agents | — |
| W-17 | One person working across entities | D-13, R-16 |
| W-18 | Comparison between entities in reports | BR-09 |
| W-19 | Foreign invoices from PDF with field confirmation and multimodal reading (UC-11/US-11 as first designed) | BR-17 (PDF part), BR-18, DF-04, D-33 |
| W-20 | Foreign tax duties: foreign contractor tax outcome, customs declaration, and import-stage VAT documents (UC-22/US-22 as first designed) | BR-21, D-32, O-07, D-33 |
| W-21 | Cash payment flag and payment-method recording | BR-32, D-25, DF-26, O-12, D-33 |

**Related:** [Step index](README.md)
