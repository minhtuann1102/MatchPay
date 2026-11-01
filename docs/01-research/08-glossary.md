# Glossary

> Design status: MVP — approved
>
> Implementation status: NOT STARTED

| Term | Meaning |
|---|---|
| Group | The set of companies served by one MatchPay installation. The sample group is the fictional Calderwood Group (D-05). |
| Legal entity / Entity | One company in the group that is a separate legal person. Every document belongs to exactly one entity (BR-01). |
| AP Accountant | The accounts payable accountant of one entity; the main user (D-03). |
| Chief Accountant | The accountant who decides tax-risk holds and signs payment requests first. |
| Payment Approver | A department head or CFO with authority to approve payment; signs consolidated requests and approves single exceptions. |
| Administrator | A user who configures the system. **Group Admin** works across the group (adds entities, sets group limits, manages AI and automation gates). **Entity Admin** works in one entity (approval matrix, tolerance, batch threshold, users) inside the group limits. |
| AI Agent | The AI components that classify, read, match, and detect anomalies. It provides evidence and never decides or signs. |
| Rule Engine | The part of the System that checks the six batch conditions with transparent rules, without an LLM, and decides whether an invoice joins a batch (D-08). |
| Entity ERP | The ERP of one entity; the source of truth for purchase orders, receipts, acceptances, suppliers, and master data. Simulated in the MVP. |
| Requesting Department | The using department of an entity (the mind map's "using department"). Its users confirm or reject the acceptance of a service in MatchPay when the ERP holds none (D-90). |
| Demo Operator | A demo-only role that plays buyer, warehouse keeper, and acceptance personas in the ERP simulator (D-12). |
| Invoice Status Lookup Service | A service that returns the status of an invoice at the tax authority: Valid, Adjusted, Replaced, or Cancelled. Simulated in the MVP (BR-39, D-93); the real connection point is Advanced (W-13). |
| Purchase order, PO | The entity's order to a supplier. |
| Goods receipt note, GRN | The record, made by the warehouse keeper from the quantity actually received, that goods arrived (BR-13). |
| Service acceptance record | A confirmation that a service was delivered, from the acceptor in the ERP or, when the ERP holds none, from the Requesting Department in MatchPay (BR-19, D-90). |
| Signing delegation | A date range in which a named delegate signs with a signer's level while the signer is absent. The signature says "on behalf of". It is not a policy delegation (O-05); its validity is Unverified (O-17, BR-38). |
| Entity mailbox | The simulated mailbox of an entity from which XML attachments are fetched and checked like an upload (UC-31, D-92). |
| Recurring profile | A record of a recurring invoice source (electricity, water, rent, fixed-price subscription): contract, supplier, entity, location, period, and fixed or usage-based price (BR-24). |
| Payment batch | The set of invoices an entity has admitted for payment in a period, awaiting signature. In the MVP there is one open batch per entity per period (D-10). |
| Consolidated payment request | One payment request for one supplier that lists every invoice of that supplier in the batch. It is the platform's own document, not the paper form 05-TT (D-19). The grouping mode (by supplier, or per invoice) is set per entity (BR-20). |
| Common document model | The shared structure for every document: entity code, supplier code, internal item code, converted unit, currency and rate, source and trust level. |
| Source trust | How far a document source is trusted (High and Signed non-coded XML in the MVP; Medium and Low apply to PDF and paper and are Advanced) and therefore how far an invoice can go without a person (see [Invoice flows and data](11-invoice-flows-and-data.md)). |
| Coded e-invoice | An e-invoice that carries a code issued by the tax authority. Under the rules in force since 2026-07-01 it is the general rule (L-03). |
| Non-coded e-invoice | An e-invoice without such a code, allowed for listed sectors that sell directly to consumers (L-03). |
| Signed non-coded XML | The trust level of a non-coded XML invoice that carries the seller's digital signature, from a sector listed in configuration. It needs a matching recurring profile; for a usage-based price the profile gives only a plausibility check (D-24, BR-17). |
| Tax Department | The tax authority under the Ministry of Finance, formerly the General Department of Taxation (D-18). |
| Adjustment invoice / Replacement invoice | An invoice that corrects an earlier invoice. They always go to a person in the MVP (BR-31, D-07). |
| Mapping table | Confirmed pairs of a supplier's item name and the entity's internal item, used for an instant match with no AI call. |
| Embedding | A numeric vector of a text's meaning, used to find the closest candidate items. |
| Signal-fusion model | A trained model (logistic regression) that combines embedding similarity, price match, quantity match, matching history, and the LLM result into one calibrated probability (BR-28). |
| LLM | Large language model. Used for line matching and the other language tasks; reading PDFs with a multimodal model is Advanced (W-19). Its output is evidence and must match a fixed schema (BR-27). |
| Exception | An invoice that failed at least one of the six batch conditions and is handled by a person one by one. |
| Waiting for goods | The state of an invoice for which no matching goods receipt exists yet; it cannot be paid (BR-14). |
| Automation gate | A switch per supplier and entity pair. When open, that supplier's invoices may join a batch without a person viewing each one. In the MVP the Group Admin switches it by hand (D-06, BR-06). |
| Shadow mode | A period in which the AI works but its results are only measured against what people decide, to determine accuracy before a gate opens. |
| Sample check | The AP Accountant's check of part of a batch before signing, with the sample selected by the AI by risk (BR-07). |
| Touchless rate | The share of invoices that join a batch without a person viewing each invoice (G-01). |
| Misplacement rate | The share of sampled invoices that the sample check found wrongly placed (G-02). |
| Tolerance | The allowed difference in price and quantity per entity, inside group limits (BR-04, BR-16). |
| Group policy limits | The maximum tolerance and batch threshold set by the group; an entity cannot exceed them (BR-16). |
| Approval matrix | The rule that maps an amount to the person who may approve it, per entity (BR-03). |
| Foreign contractor tax, FCT | Tax that the buyer withholds and pays for a foreign supplier of services, unless the supplier handled it itself. Not handled in the MVP (D-33); the Advanced item W-20 would flag it and block payment (BR-21, O-07). |
| Tax-risk list | A list of sellers with tax risk. Simulated in the MVP; each entry carries a source and a date (D-21). |
| Employee-expense invoice | An invoice for hotel, restaurant, or taxi with no booking request. It is separated into a list waiting for a reimbursement file and is not an exception (BR-23). |
| Level A (foreign invoices) | The brief's depth for foreign invoices: a person confirms every field, and the system flags foreign tax duties and import documents and blocks payment until the accountant confirms. The user moved it out of the MVP (D-33); it is Advanced (W-19, W-20). |
| Audit log | The record of every AI decision with its reason, confidence, and model version; it cannot be edited through the application (BR-12). |
| Entity isolation | Data of one entity is never shown to another; cross-entity comparisons show aggregates only (BR-09). |

**Related:** [Research index](README.md)
