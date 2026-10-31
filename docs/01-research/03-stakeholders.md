# Stakeholders

> Design status: MVP — Step 1 of 9, draft for review
>
> Implementation status: NOT STARTED

Each finance user is scoped to one entity in the MVP (D-13). An Administrator is scoped to one entity (Entity Admin) or to the whole group (Group Admin).

| Stakeholder | Relation to the system | Interests and needs | Influence |
|---|---|---|---|
| **AP Accountant** | Actor and main user: uploads XML invoices, creates recurring profiles, resolves exceptions, runs the sample check before signing. One entity. | Fewer manual comparisons, a clear worklist, an explanation of every difference, ready-made drafts for supplier requests. | High: daily user; adoption depends on them. |
| **Chief Accountant** | Actor: decides on invoices from tax-risk suppliers; co-signs payment requests. One entity. | No lost tax deductions, evidence for each decision, a signature they can stand behind. | High: carries the accounting and tax responsibility. |
| **Payment Approver** (department head or CFO) | Actor: signs consolidated payment requests per supplier, many in one action, and approves single exceptions or amounts above a threshold. One entity. | Signing on grounds, not blind and not invoice by invoice; clear totals by supplier; flags on new suppliers and changed bank accounts. | High: the control that stops a wrong payment. |
| **Group Administrator** | Actor: adds entities, sets group limits, manages the AI and the automation gates. | Safe rollout of automation, visible accuracy, limits that entities cannot exceed. | High: decides how far automation goes. |
| **Entity Administrator** | Actor: configures the approval matrix, tolerances, and batch threshold within group limits; manages the entity's users. | Rules that fit the entity's own policy. | Medium. |
| **Group finance leadership** | Sponsor: pays for and approves the product. | Fewer wrong and late payments, lost deductions avoided, a defensible control story for auditors. | High. |
| **Operations staff** (buyers, warehouse keepers, people who accept services) | Data source: keep working in the ERP and warehouse software; their data syncs in. In the demo, the Demo Operator plays these roles (D-12). | No change to their daily tools; data errors reported with a clear request to fix them in the ERP. | Medium: their data quality decides matching quality. |
| **Suppliers** | External: receive correction requests that the AP Accountant sends, and send adjustment or replacement invoices. | Clear, polite requests; one point of contact. | Low. |
| **Auditors** (internal and external) | Reader of the audit log. | Every AI decision with its reason, confidence, and model version; a log that cannot be edited through the application. | Medium. |
| **Tax authority** | External: issues the invoice codes and holds the invoice data; its decisions set the rules for the system. | Correct invoices and correct deductions. | High on the rules, none on the product. |
| **Entity ERP** | External system: source of truth for purchase orders, receipts, acceptances, suppliers, and master data; receives the signed batch. Simulated in the MVP. | A read-only consumer that never edits its data and never creates duplicates on re-sync. | High: the product depends on it. |
| **LLM provider** | External system called for matching lines and drafting. | API use within its terms. | Medium: availability, price, and data-processing terms affect the product. Choice is made in Step 7. |
| **Project team** (BA, SA, developer) | Builds the MVP. | A scope that is deep rather than wide, approved step by step. | High during delivery. |

**Related:** [Step index](README.md)
