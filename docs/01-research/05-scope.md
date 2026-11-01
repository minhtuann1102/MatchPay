# MVP Scope

> Design status: MVP — approved
>
> Implementation status: NOT STARTED

The MVP is one core flow built in depth: invoice, AI reads and matches lines, Rule Engine, payment batch, signing. It is 30 user stories (the brief says about 28; the user removed foreign invoices and the cash flag, D-33, and later asked to sync to the feature mind map, which added four stories, D-88). The Advanced column is designed and is the direction for growth ([Future work](09-future-work.md)). The demo uses three fictional entities (D-05, O-02).

**Sync to the feature mind map (D-88, 2026-11-01).** The user attached a feature mind map (F01..F12). It adds to the MVP: the Requesting Department role and service acceptance in MatchPay (D-90), signing delegation while absent (D-91), a simulated entity mailbox for invoices (D-92), a simulated invoice status lookup at the tax authority (D-93), cancelled invoices (D-94), sample expansion and batch reopening (D-95), manual resend to the ERP (D-96), and in-app notifications and reminders (D-97). The supplier portal and the real connection to the tax authority stay Advanced (W-05, W-13). See [Requirements decisions](../02-usecases-userstories/00-decisions.md#sync-to-the-feature-mind-map-user-decision-d-88-2026-11-01); the calls inside it await user review.

**Scope change decided by the user (D-33).** Foreign invoices, their tax duties (foreign contractor tax, customs declaration, import-stage VAT), PDF intake with the multimodal LLM, and the cash payment flag are not in the MVP. They are Advanced items W-19, W-20, and W-21. See [Requirements decisions](../02-usecases-userstories/00-decisions.md#scope-change-decided-by-the-user).

## In scope (MVP)

| # | Module | Capabilities |
|---|---|---|
| M-01 | Access and roles | Login and logout; roles AP Accountant, Chief Accountant, Payment Approver, Requesting Department (D-90), Group Admin, and Entity Admin; every user bound to one entity (D-13); user management; access denied when the role or entity does not allow it. |
| M-02 | Group and entity configuration | Group Admin adds entities and sets group limits (maximum tolerance and batch threshold). Entity Admin sets tolerance, batch threshold, sample-check rate, grouping mode (by supplier, the default, or per invoice), and the approval matrix, all inside the group limits (BR-03, BR-04, BR-16, BR-20). |
| M-03 | Source data sync and recurring profiles | Purchase orders, goods receipts, service acceptances, suppliers, and master data sync from the Entity ERP, read-only, safe to run twice, with a sync time on every record (BR-25); the simulated tax-authority status feed is loaded with them (BR-39). The AP Accountant creates recurring profiles for electricity, water, rent, and fixed-price subscriptions (BR-24). The Requesting Department confirms the acceptance of a service in MatchPay when the ERP holds none (BR-19, D-90). |
| M-04 | ERP simulator (demo only) | Screens to create a purchase order and confirm receipt or acceptance, operated by the Demo Operator (D-12) so that the demo runs the whole loop. Not part of the product. |
| M-05 | Invoice intake | Upload of domestic XML invoices, and XML attachments fetched from a simulated entity mailbox (D-92), with a real signature check using test certificates; a status lookup at the simulated tax authority that stops a cancelled or replaced invoice (BR-39); the original file kept unchanged with a hash; a PDF or any other non-XML file is rejected at upload, and a foreign invoice that still arrives is an "Unsupported: foreign invoice" exception (BR-01, BR-17, D-33). |
| M-06 | AI document understanding | Flow classification, document reading (XML only), identification of entity and order or profile, line matching (mapping table, embedding, signal-fusion model, LLM for the rest), anomaly detection (price against the entity's own history, duplicates, order splitting, recurring jumps), risk-based sample selection, batch summary, and drafts for exception handling (BR-27..BR-30). |
| M-07 | Rule Engine and automation gates | Checks the six batch conditions without an LLM and routes each invoice to the batch or to an exception (BR-05, BR-14, BR-15, BR-17). Measures AI accuracy per supplier and entity pair in shadow mode; the Group Admin opens and closes each gate by hand; a sample-check failure raises an alert (BR-06, D-06). |
| M-08 | Exception handling | Worklist with evidence for each invoice; resolve an exception; draft a correction request that the AP Accountant sends; automatic re-check of a follow-up invoice (D-07); decisions on tax-risk holds by the Chief Accountant; individual approval of an exception by the Payment Approver; confirmed matches feed the mapping table (BR-08, BR-25, BR-26, BR-31). |
| M-09 | Payment batch and signing | One open batch per entity per period (D-10); sample check, with sample expansion and batch reopening when the sample finds an error (D-95); consolidated payment requests per supplier; signing of many requests in one action by the Chief Accountant and the Payment Approver; removal of lines before signing; each invoice traceable to the signature that approved it; no signing of an invoice the signer processed (BR-36); signing delegation for a date range (BR-38); the signed batch sent to the simulated ERP, which returns a paid status (D-11), with a manual resend after the automatic attempts fail (D-96) (BR-05, BR-07, BR-20, BR-30). |
| M-10 | Oversight and audit | Dashboard: touchless rate, AI misplacement rate, exception backlog (G-01, G-02). Audit log of every AI decision with its reason, confidence, and model and prompt version; the log cannot be edited through the application (BR-12). In-app notifications and reminders for the work waiting for each finance role (D-97). |

### Scope by area

| Area | MVP | Advanced | Out of scope |
|---|---|---|---|
| Documents | Purchase orders, goods receipts, acceptances, suppliers, and master data synced from the simulated ERP; service acceptances confirmed by the Requesting Department; recurring profiles created by the AP Accountant; XML invoice upload and a simulated invoice mailbox | PDF invoice upload and reading (W-19); supplier portal (W-05); connection to each entity's real ERP | Replacing the purchasing and warehouse functions of the ERP; direct connection to the tax authority's systems |
| Invoice types | Domestic goods, services, and recurring invoices (electricity, water, rent, fixed-price software subscription); classification and separation of employee expenses | Foreign invoices (W-19) and their tax duties (W-20); subscriptions charged to a card (confirm afterwards, refund, card limit); other documents entered by hand and self-made purchase lists; travel and hotel bookings through agents | Reimbursement and advances for business travel |
| AI | Flow classification; XML reading; identification; line matching; admission evidence; risk-based sample; batch summary; exception routing; supplier request drafts; automatic matching of adjustment invoices; duplicate, order-splitting, and unusual-price detection against the entity's own history | Cross-entity anomalies; PDF reading with a multimodal LLM (W-19); suggested foreign contractor tax type; finding the XML from a PDF; periodic retraining from the accountants' confirmations | The AI signing a voucher; the AI negotiating prices |
| Approval | Payment batch; sample check before signing; consolidated requests per supplier signed in one action; individual approval of exceptions by the approval matrix; signing delegation for a date range while a signer is absent | Approval on mobile; mid-period batches by contract deadline | Payment through a real bank |
| Tax | Signature check on XML; lookup in a simulated list of risky sellers; simulated lookup of the invoice status at the tax authority | Foreign tax duties: foreign contractor tax and import documents, blocking payment until the accountant confirms (W-20); cash payment flag (W-21); the real connection point for the invoice status (W-13); cross-check of customs declarations | Tax filing |
| Control | Entity code on all data; configuration per entity inside group limits; separation of duties; audit log; automation gate switched on and off by hand, with shadow mode | Gate that opens and closes by itself from sample-check results; a group-control actor | None |
| Reporting | Touchless rate; AI misplacement rate; exception backlog; in-app notifications and reminders | Comparison between entities | None |

## Out of scope

- Procurement itself and the reimbursement of employee travel expenses.
- Replacing the ERP's purchasing or warehouse functions.
- Direct connection to the tax authority's systems.
- Real bank payment (D-11).
- Tax filing.
- The AI signing vouchers or negotiating prices.

How these and the Advanced items could be added: [Future work](09-future-work.md).

## Assumptions (apply unless changed)

| ID | Assumption |
|---|---|
| A-01 | All data is simulated: a fictional group, fictional entities, and no data from the internship workplace (O-04). |
| A-02 | The invoices of the MVP are domestic XML e-invoices. Foreign invoices, which arrive as PDF, are Advanced (W-19, D-33). |
| A-03 | Each entity runs its own ERP, which is the source of truth. The MVP reads from a simulated ERP and never edits it (BR-25). |
| A-04 | One finance user belongs to one entity (D-13). |
| A-05 | The LLM is called through an API with synthetic data only (O-03). |
| A-06 | Thresholds and tolerances are parameters set per entity inside group limits. The brief's example values (tolerance of 2%, an approval threshold of VND 50 million, a duplicate window of 7 days, a recurring jump of 30%, a price check of 20% against a 6-month median) are the demo configuration. |
| A-07 | Simulated parts are the ERP, the digital certificates, the risk list, and card transactions. The core is real: line matching, the Rule Engine, the signature check on XML, the batch, and signing (R-08). |
| A-08 | The product is a web application. Approval on a phone is Advanced. |
| A-09 | Removed (D-33). Foreign invoices keep their original currency and exchange rate. (Advanced, W-19.) |
| A-10 | The MVP only designs the 10-year retention of invoice XML and does not implement it (D-22). |
| A-11 | The platform creates no ledger entries; the Entity ERP posts the signed batch (O-06). |

**Related:** [Research index](README.md)
