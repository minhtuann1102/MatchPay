# MVP Scope

> Design status: MVP — Step 1 of 9, draft for review
>
> Implementation status: NOT STARTED

The MVP is one core flow built in depth: invoice, AI reads and matches lines, Rule Engine, payment batch, signing. It is about 28 user stories. The Advanced column is designed and is the direction for growth ([Future work](09-future-work.md)). The demo uses three fictional entities (D-05, O-02).

## In scope (MVP)

| # | Module | Capabilities |
|---|---|---|
| M-01 | Access and roles | Login and logout; roles AP Accountant, Chief Accountant, Payment Approver, Group Admin, and Entity Admin; every finance user bound to one entity (D-13); user management; access denied when the role or entity does not allow it. |
| M-02 | Group and entity configuration | Group Admin adds entities and sets group limits (maximum tolerance and batch threshold). Entity Admin sets tolerance, batch threshold, sample-check rate, grouping mode (by supplier, the default, or per invoice), and the approval matrix, all inside the group limits (BR-03, BR-04, BR-16, BR-20). |
| M-03 | Source data sync and recurring profiles | Purchase orders, goods receipts, service acceptances, suppliers, and master data sync from the Entity ERP, read-only, safe to run twice, with a sync time on every record (BR-25). The AP Accountant creates recurring profiles for electricity, water, rent, and fixed-price subscriptions (BR-24). |
| M-04 | ERP simulator (demo only) | Screens to create a purchase order and confirm receipt or acceptance, operated by the Demo Operator (D-12) so that the demo runs the whole loop. Not part of the product. |
| M-05 | Invoice intake | Upload of domestic XML invoices with a real signature check using test certificates; upload of foreign PDF invoices with the AP Accountant confirming every field; the original file kept unchanged with a hash; PDF and XML of one invoice compared (BR-01, BR-17, BR-18, BR-21). |
| M-06 | AI document understanding | Flow classification, document reading (XML, and PDF through a multimodal LLM), identification of entity and order or profile, line matching (mapping table, embedding, signal-fusion model, LLM for the rest), anomaly detection (price against the entity's own history, duplicates, order splitting, recurring jumps), risk-based sample selection, batch summary, and drafts for exception handling (BR-27..BR-30). |
| M-07 | Rule Engine and automation gates | Checks the six batch conditions without an LLM and routes each invoice to the batch or to an exception (BR-05, BR-14, BR-15, BR-17). Measures AI accuracy per supplier and entity pair in shadow mode; the Group Admin opens and closes each gate by hand; a sample-check failure raises an alert (BR-06, D-06). |
| M-08 | Exception handling | Worklist with evidence for each invoice; resolve an exception; draft a correction request that the AP Accountant sends; automatic re-check of a follow-up invoice (D-07); decisions on tax-risk holds and foreign tax duties by the Chief Accountant; individual approval of an exception by the Payment Approver; confirmed matches feed the mapping table (BR-08, BR-21, BR-25, BR-26, BR-31). |
| M-09 | Payment batch and signing | One open batch per entity per period (D-10); sample check; consolidated payment requests per supplier; signing of many requests in one action by the Chief Accountant and the Payment Approver; removal of lines before signing; each invoice traceable to the signature that approved it; the signed batch sent to the simulated ERP, which returns a paid status (D-11) (BR-05, BR-07, BR-20, BR-30). |
| M-10 | Oversight and audit | Dashboard: touchless rate, AI misplacement rate, exception backlog (G-01, G-02). Audit log of every AI decision with its reason, confidence, and model and prompt version; the log cannot be edited through the application (BR-12). |

### Scope by area

| Area | MVP | Advanced | Out of scope |
|---|---|---|---|
| Documents | Purchase orders, goods receipts, acceptances, suppliers, and master data synced from the simulated ERP; recurring profiles created by the AP Accountant; XML invoice upload; foreign PDF invoices | Invoice mailbox that fetches XML by itself; supplier portal; connection to each entity's real ERP | Replacing the purchasing and warehouse functions of the ERP; direct connection to the tax authority's systems |
| Invoice types | Domestic goods, services, and recurring invoices (electricity, water, rent, fixed-price software subscription); foreign invoices (level A); classification and separation of employee expenses | Subscriptions charged to a card (confirm afterwards, refund, card limit); other documents entered by hand and self-made purchase lists; travel and hotel bookings through agents | Reimbursement and advances for business travel |
| AI | Flow classification; XML and PDF reading; identification; line matching; admission evidence; risk-based sample; batch summary; exception routing; supplier request drafts; automatic matching of adjustment invoices; duplicate, order-splitting, and unusual-price detection against the entity's own history | Cross-entity anomalies; suggested foreign contractor tax type; finding the XML from a PDF; periodic retraining from the accountants' confirmations | The AI signing a voucher; the AI negotiating prices |
| Approval | Payment batch; sample check before signing; consolidated requests per supplier signed in one action; individual approval of exceptions by the approval matrix | Approval on mobile; mid-period batches by contract deadline | Payment through a real bank |
| Tax | Signature check on XML; for foreign invoices, flag foreign contractor tax and import documents and block payment until the accountant confirms; lookup in a simulated list of risky sellers | Invoice status lookup through a connection point; cross-check of customs declarations | Tax filing |
| Control | Entity code on all data; configuration per entity inside group limits; separation of duties; audit log; automation gate switched on and off by hand, with shadow mode | Gate that opens and closes by itself from sample-check results; a group-control actor | None |
| Reporting | Touchless rate; AI misplacement rate; exception backlog | Comparison between entities | None |

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
| A-02 | Domestic invoices are mostly XML e-invoices; foreign invoices are PDF. |
| A-03 | Each entity runs its own ERP, which is the source of truth. The MVP reads from a simulated ERP and never edits it (BR-25). |
| A-04 | One finance user belongs to one entity (D-13). |
| A-05 | The LLM is called through an API with synthetic data only (O-03). |
| A-06 | Thresholds and tolerances are parameters set per entity inside group limits. The brief's example values (tolerance of 2%, an approval threshold of VND 50 million, a duplicate window of 7 days, a recurring jump of 30%, a price check of 20% against a 6-month median) are the demo configuration. |
| A-07 | Simulated parts are the ERP, the digital certificates, the risk list, and card transactions. The core is real: line matching, the Rule Engine, the signature check on XML, the batch, and signing (R-08). |
| A-08 | The product is a web application. Approval on a phone is Advanced. |
| A-09 | Foreign invoices keep their original currency and exchange rate. |
| A-10 | The MVP only designs the 10-year retention of invoice XML and does not implement it (D-22). |
| A-11 | The platform creates no ledger entries; the Entity ERP posts the signed batch (O-06). |

**Related:** [Step index](README.md)
