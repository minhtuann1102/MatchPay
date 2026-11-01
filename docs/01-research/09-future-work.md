# Future Work (after the MVP)

> Design status: MVP — Step 1 of 9, draft for review; nothing here is in the MVP scope
>
> Implementation status: NOT PLANNED for the MVP

Everything on this page is **outside the MVP**. It is the brief's "Advanced" column, plus the places where a decision (D-xx) moved something out of the MVP. It is recorded so that a later release starts from this analysis and so the reasons for leaving things out are visible. Each item has a `W-xx` number; Step 2 reuses these numbers for the "Won't (now)" items in the MoSCoW prioritisation. No use case, user story, or business rule numbers are reserved for them, except that W-05 (portal part) and W-13 (real connection point) stay Advanced after the MVP took over their mailbox and simulated lookup parts (D-92, D-93, BR-39), and that W-19, W-20, and W-21 take over the designs of UC-11, US-11, UC-22, US-22, BR-18, BR-21, and BR-32, which the user's decision D-33 moved out of the MVP.

## Automation roadmap

Automation grows one level at a time. Each level keeps the guardrails of the one before it and moves on only when the measurements of that level show the AI can be trusted.

| Level | What happens | Who decides | Measured before moving on |
|---|---|---|---|
| **MVP** | The AI works in shadow mode and its accuracy is measured per supplier and entity pair. The Group Admin opens and closes each automation gate by hand. A sample-check failure raises an alert and recommends closing the gate (D-06). | Group Admin for the gate; the Rule Engine for each invoice; people sign | Touchless rate (G-01), misplacement rate (G-02), LLM-free match rate (G-07) |
| **Level 1** | The gate opens and closes by itself from shadow-mode accuracy and sample-check results (W-01), with an alert to the Group Admin. A group-control actor supervises (W-02). | The system, inside limits the Group Admin sets | Misplacement rate stays at or below target over a full period; false closings counted |
| **Level 2** | PDFs confirmed by an independent source (a card transaction and a subscription profile) may join a batch without a person viewing each one, with a low amount limit (W-03). Anomaly detection also compares entities (W-07). | The system for confirmed sources; people for everything else | Error rate of the independently confirmed PDFs on a sampled review |

## Candidates

| ID | Item | Idea | Why it waits | Related |
|---|---|---|---|---|
| W-01 | Automatic gate opening and closing | The gate opens when accuracy reaches the threshold in shadow mode and closes when sample checks find errors above the threshold. | The MVP first needs real accuracy numbers; a gate that flips by itself without them is risky. | BR-06, D-06 |
| W-02 | Group-control actor | A role that watches accuracy and gate changes across the group. | Needs W-01. | BR-06 |
| W-03 | Medium-trust PDF invoices | A PDF confirmed by an independent source joins a batch after the gate opens, with a low amount limit. | Needs card transactions and subscription profiles (W-04), and PDF intake (W-19). | BR-17 |
| W-04 | Subscriptions charged to a card | Subscription profile plus card transactions; confirm afterwards; a wrong charge leads to a refund request, fewer seats, or a card block; card limit per profile. | Money leaves before the check; needs a bank statement feed. In the MVP a fixed-price subscription follows a recurring profile. | BR-22, R-04 |
| W-05 | Supplier portal | Suppliers send XML invoices through a portal, with an account for each supplier. The mailbox part of the old item moved into the MVP as a simulated entity mailbox (UC-31, D-92). | The portal needs supplier accounts and onboarding; the MVP takes files by upload and from the simulated mailbox. | O-10, D-92 |
| W-06 | Real ERP per entity | Replace the ERP simulator with each entity's real ERP through the connection point. | Needs real systems and their data. | A-03 |
| W-07 | Cross-entity anomaly detection | Price far above the group median; several orders just under an approval threshold across entities; near-duplicate invoices across entities. Aggregates only, and hidden when fewer than 3 entities buy the item. | Needs data from several entities; the MVP checks only an exact key duplicate across the group. | BR-09, D-09 |
| W-08 | Suggested foreign contractor tax type | The AI proposes the type of tax with a reason; the accountant decides. | Builds on W-20. Needs deep tax expertise; the rules under the new Tax Administration Law are Unverified. | BR-21, O-07 |
| W-09 | Finding the original XML from a PDF | When a PDF arrives, find the XML at the tax portal or the seller. | Builds on W-19. Needs a portal connection (O-10). | BR-18 |
| W-10 | Periodic retraining | Retrain the signal-fusion model from the accountants' confirmations when a new version beats the current one on the test set. | Needs enough confirmations. | BR-28 |
| W-11 | Approval on mobile | Sign and approve from a phone. | The MVP is a web application. | A-08 |
| W-12 | Mid-period batches | Sign during the period when a contract deadline is shorter than the period. | The MVP has one open batch per entity per period and shows due dates. | D-10 |
| W-13 | Real connection point for the invoice status | Ask the tax authority for the status of an invoice through a real connection point, replacing the simulated lookup of the MVP (BR-39, D-93). | No official API found. | O-10, BR-39, D-93 |
| W-14 | Customs declaration cross-check | Compare the declaration with the invoice for imported goods. | Builds on W-20. Needs a customs data feed; W-20 itself only requires the attachments. | BR-21 |
| W-15 | Manual entry of other documents and self-made purchase lists | The accountant enters paper invoices and builds the purchase list (form 02/TNDN, O-08); always through a person. | Rare, low value, legal details open. | BR-23 |
| W-16 | Travel and hotel bookings through agents | Match the invoice with an approved booking request and trip confirmation. | Needs a booking source. | |
| W-17 | One person across entities | A finance user who works in several entities, with a switch of entity. | Weakens isolation; the MVP binds a user to one entity. | D-13, R-16 |
| W-18 | Comparison between entities in reports | Dashboard comparison of entities. | Needs W-07's aggregate rules. | BR-09 |
| W-19 | Foreign invoices from PDF with field confirmation and multimodal reading | The AP Accountant uploads a foreign PDF invoice; a multimodal LLM reads its fields into the common document model; the AP Accountant confirms or corrects every field, including currency and exchange rate; the invoice then always takes the exception path (Low trust). Includes the PDF part of BR-17 and the comparison of PDF and XML (BR-18). Designed as UC-11/US-11 with DF-04. | The user removed it from the MVP to keep the core flow deep (D-33). The MVP reads XML only; this needs a PDF adapter, a multimodal LLM, and a field-confirmation screen. | BR-17, BR-18, DF-04, D-33 |
| W-20 | Foreign tax duties | Block a foreign service until the Chief Accountant records the foreign contractor tax outcome (entity handled it, supplier registered directly, or not applicable); require the customs declaration and the proof of import-stage VAT for imported goods; keep the original currency and exchange rate. Designed as UC-22/US-22. | Removed from the MVP with W-19 (D-33). Needs W-19, because foreign invoices have no other way into the flow. The rules under the new Tax Administration Law are Unverified (O-07). | BR-21, D-32, O-07, D-33 |
| W-21 | Cash payment flag and payment-method recording | Record the payment method returned by the ERP; when a payment is cash at or above VND 5 million including VAT (same seller, same day), flag the invoice with a warning that its VAT deduction is at risk and write the flag to the audit log; never block. Designed as BR-32 with DF-26. | Removed from the MVP (D-33). The MVP sends a non-cash transfer instruction and records only the paid status and payment reference. The threshold stays Unverified for any 2026 amendment (L-12). | BR-32, D-25, DF-26, O-12, D-33 |

## Not planned

Procurement itself and employee travel reimbursement; replacing the ERP's purchasing or warehouse functions; direct connection to the tax authority's systems; real bank payment; tax filing; the AI signing a voucher; the AI negotiating prices.

**Related:** [Step index](README.md) · [MVP scope](05-scope.md)
