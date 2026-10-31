# MoSCoW Prioritization

> Design status: MVP — Step 2 of 9, draft for review
>
> Implementation status: NOT STARTED

**Every Must and Should story is planned for this MVP.** MoSCoW only sets the build order and shows what to cut first if time runs out.

| Priority | Stories | Count |
|---|---|---|
| **Must**: the core chain cannot work without it (users and policy, source data, intake, the AI checks, the Rule Engine, exceptions, sample check, signing, sending to the ERP) | US-01, US-02, US-04, US-05, US-06, US-07, US-08, US-10, US-12, US-13, US-14, US-15, US-16, US-17, US-18, US-21, US-23, US-24, US-25, US-26 | 20 |
| **Should**: important and planned, but the core chain still works without it | US-03, US-09, US-11, US-19, US-20, US-22, US-27, US-28 | 8 |
| **Could** | None. Every remaining item was either in the brief's Advanced column or explicitly ruled out. | 0 |
| **Won't** (this release) | W-01..W-18, listed below | 18 |

Two priorities differ from the first proposal. **US-06 (automation gates) is a Must** (D-27): without a way to open a gate, condition 5 of BR-05 fails for every supplier and no invoice can join a batch. **US-22 (foreign tax duties) is a Should** (D-32): foreign invoices enter only through US-11, which is a Should, so the two are cut together. No Must story has a Should part inside it.

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
| 3 | US-20 Re-check follow-up invoice | The AP Accountant links a follow-up invoice by hand. |
| 4 | US-19 Correction requests | The AP Accountant writes requests by hand; no AI draft. |
| 5 | US-11 Foreign PDF invoices and US-22 Foreign tax duties, cut together | Foreign invoices and their tax duties (foreign contractor tax, import documents) are not demonstrated. They stay designed in BR-21 and are not built, because foreign suppliers do not issue Vietnamese XML and there is no other way into the flow. |
| 6 | US-09 Recurring profiles | Every recurring invoice, including electricity, becomes an exception. |
| 7 | US-03 Entities and group limits | The three entities, the group limits, and the sector list are fixed in the seed data. |

## Won't (this release)

These are the Advanced items of the brief and of the Step 1 decisions. They are designed and documented as a roadmap in [Future work](../01-research/09-future-work.md), and no use case or story is written for them. A rule that is entirely Advanced (BR-22) is carried by its item here instead of by a story.

| ID | Item | Related rules and decisions |
|---|---|---|
| W-01 | Automatic gate opening and closing | BR-06, D-06 |
| W-02 | Group-control actor | BR-06 |
| W-03 | Medium-trust PDF invoices confirmed by an independent source | BR-17 |
| W-04 | Subscriptions charged to a card (confirm afterwards, refund, card limit) | BR-22 |
| W-05 | Invoice mailbox that fetches XML, and a supplier portal | O-10 |
| W-06 | Real ERP connection for each entity | A-03 |
| W-07 | Anomaly detection and comparison across entities (aggregates only, hidden under 3 entities) | BR-09, D-09 |
| W-08 | Suggested foreign contractor tax type | BR-21, O-07 |
| W-09 | Finding the original XML from a PDF | BR-18 |
| W-10 | Periodic retraining of the signal-fusion model | BR-28 |
| W-11 | Approval on mobile | A-08 |
| W-12 | Mid-period batches by contract deadline | D-10 |
| W-13 | Invoice status lookup through a connection point | O-10 |
| W-14 | Cross-check of customs declarations | BR-21 |
| W-15 | Manual entry of other documents and self-made purchase lists | BR-23 |
| W-16 | Travel and hotel bookings through agents | — |
| W-17 | One person working across entities | D-13, R-16 |
| W-18 | Comparison between entities in reports | BR-09 |

**Related:** [Step index](README.md)
