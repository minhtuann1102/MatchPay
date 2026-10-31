# Similar Products

> Design status: MVP — Step 1 of 9, draft for review
>
> Implementation status: NOT STARTED

Every row below was checked against a page that was opened on 2026-10-31. Most pages are written by the vendor, so their claims are marketing claims. "Not shown" means the page read did not mention it; it is not proof that the product lacks it. Product features and plans change often, so recheck before citing this page externally.

## Verified comparison

| Product | What the page claims | Not shown on the page read | Source |
|---|---|---|---|
| **Rillion** (international) | One view of invoices across companies; each entity can keep its own ERP and ledger structure and apply local approval rules; the AI "predicts the right approval path"; reads and codes invoice data "with over 90% accuracy" (vendor claim); automated three-way matching with purchase orders; syncs with "over 50 leading ERPs". | Vietnam, any country list, hosting region, price. | [Rillion blog, 2026-03-30](https://www.rillion.com/blog/best-invoice-automation-software/) |
| **Tipalti** (international) | Consolidates locations in one tool; payments to over 200 countries in 120 currencies; reads invoices in any format "across 146 languages"; accounts payable plans "starting at $99 /month", unlimited users, per-invoice and per-payment fees extra. Its tax compliance line reads "US, UK, EU, and Canada". | Vietnam; hosting region. | [Tipalti pricing](https://tipalti.com/approve/pricing); also described in the Rillion blog above |
| **MISA meInvoice** | AI sorts invoices into expense groups, warns when a cost exceeds its limit, warns about sellers with tax risk, and detects risks and anomalies. Accountants and leaders "keep control, approval". | Matching to purchase orders, payment approval, and any automatic approval of payment (the page does not claim it). No price. | [MISA meInvoice](https://www.meinvoice.vn/?p=10310) |
| **MISA AVA with AMIS Accounting** | Reads the input invoice after it is fetched, adds new goods and suppliers to the catalogue, and creates the posting voucher automatically. | Matching with purchase order or goods receipt, risk checks, payment approval. It serves posting, not payment control. | [MISA AMIS, 2024-06-18](https://amis.misa.vn/143559/tu-dong-hach-toan-hoa-don-dau-vao-voi-tro-ly-so-misa-ava/) |
| **MISA AMIS group model** | Multi-level data consolidation; master data shared or separate; consolidated financial statements. "Each company in the group must create its own AMIS company and buy its own AMIS Accounting licence." | A shared accounts payable or payment approval across entities. The focus is consolidated reporting. | [MISA help page, updated 2026-06-08](https://helpact.misa.vn/?p=79085) |
| **xCyber BillStore** | "Automates 90% of the work" with no basis given; reads XML, image, and PDF; fetches invoices from the tax authority and email (claim); checks buyer, seller, digital signature, and seller status; risk alerts. A customer testimonial says one login manages invoices of several companies. | Matching to purchase orders, approval workflow, price. | [xCyber](https://xcyber.vn/?p=2672) |
| **Basware** (international) | Its Vietnam compliance map describes the rules: mandatory since 2022, data reported to the Tax Department directly or through an authorised provider, 10-year storage. | Whether Basware itself supports Vietnam. The page does not say. | [Basware compliance map, reviewed 2026-07-31](https://basware.com/en/compliance-map/vietnam) |
| **Microsoft Dynamics 365 Finance** (ERP) | Its Electronic Invoicing Service lists generally available features for Australia, Indonesia, Malaysia, New Zealand, and Singapore in the Asia-Pacific region. | Vietnam is not in that list. The page says it covers only that service and not other built-in approaches, so this is weak evidence. | [Microsoft Learn, updated 2026-09-01](https://learn.microsoft.com/en-us/dynamics365/finance/localizations/global/e-invoicing-country-specific-availability) |
| **BRAVO** (local ERP) | Modules for purchasing (tracking payables by supplier, contract, and order), inventory (receipt and issue notes), and accounting. | E-invoice integration, consolidation of several entities, payment approval, AI. The page does not mention them. | [BRAVO basic modules](https://www.bravo.com.vn/en/product/basic-modules/) |
| **SAP**, **Oracle**, **FAST Accounting Online** | **Unverified.** An SAP store listing for Vietnam e-invoice submission appeared in a search but could not be opened. Oracle was not researched. FAST's brochure could not be read as text. | Everything. | To confirm: the SAP partner catalogue, Oracle localisation documentation, and FAST's product sheets, or a written vendor answer (O-14). |

## Vietnamese ERP landscape

No survey of which ERP a Vietnamese group uses was found; the market-research summaries are paid. The only usable source is a 2025 briefing that lists target clients, not market share.

| Vendor | Target segment | Evidence read about AP automation, multi-entity control, or Vietnam e-invoice | Status |
|---|---|---|---|
| SAP | Mid-sized and large businesses | Listing not opened | Unverified |
| Oracle | Mid-sized and large businesses | Not researched | Unverified |
| Microsoft Dynamics 365 | SMEs (as listed) | Electronic Invoicing Service list excludes Vietnam; weak evidence | Partly checked |
| Odoo | Startups and SMEs | Not researched | Unverified |
| MISA AMIS | Local; a group model exists | Per-entity licence; consolidated reports; no shared payment approval shown | Checked |
| BRAVO | Local | Purchasing, inventory, and accounting modules; no AP automation shown | Partly checked |
| FAST | Local | Brochure unreadable | Unverified |

Source for the segments: [Vietnam Briefing, 2025-07-30](https://www.vietnam-briefing.com/news/vietnam-erp-market-digital-transformation.html). The brief asks Step 1 to check the large ERPs that Vietnamese groups use. That check is only partly done and stays an open item (O-14).

## Why not buy an international product?

The brief requires this question to be answered. The honest answer is that **the gap is still an assumption.** The evidence is below, with its strength.

| Reason | What the evidence shows | Strength |
|---|---|---|
| **Cost** | Tipalti publishes accounts payable plans from $99 a month with no per-user fee, plus per-transaction fees. Rillion's price is not published on the page read. | **The cost argument fails** for at least one international product. It is not a reason to build. |
| **Vietnam e-invoice and tax support** | Tipalti's page lists tax compliance for the US, UK, EU, and Canada; the Rillion, Basware, and Microsoft pages read do not list Vietnam. Vietnam's invoice rules are specific: a coded XML invoice through the Tax Department, adjustment and replacement invoices, a risk list of sellers, a VND 5 million non-cash rule for VAT deduction, foreign contractor tax (see [Regulatory context](10-regulatory-context.md)). | **Weak to moderate.** The pages show absence of published Vietnam support, not proof that support is absent. Some international ERPs reach Vietnam through partners; this was not verified. |
| **Data location** | Law 91/2025/QH15, Art 20, requires an impact assessment when personal data goes to a foreign platform; the text read has no general rule to store data in Vietnam. | **Weak.** It is a compliance step, not a ban. Whether financial data has its own rule is Unverified. |

**What would settle it:** a written questionnaire to two or three vendors (for example Rillion, one large ERP vendor, and one local vendor) asking whether they handle the Vietnam e-invoice XML and signature check, the seller risk list, adjustment and replacement invoices, per-entity approval matrices, price for three entities, and hosting region (O-14). Until the answers arrive, the product claim should be framed as a shared multi-entity approval flow for Vietnam that connects the purchase order, the goods receipt, the e-invoice, and the approval, rather than as a market gap.

## Key learnings

1. **The idea exists internationally; in Vietnam only parts were found.** International products automate approval and matching across entities. The Vietnamese products read cover invoice fetching, risk warnings, classification, and posting. None of the pages read shows the full chain of purchase order, goods receipt, e-invoice, and cross-entity approval together.
2. **Local group products centre on consolidated reporting,** with a separate licence and data per entity, not on shared payment control.
3. **Vendor accuracy claims are not evidence.** "Over 90% accuracy" and "90% automation" come with no method. MatchPay measures its own accuracy first and opens automation only after that (G-01, G-02).
4. **Posting is not payment control.** A tool that posts invoices to the ledger can still let a wrong invoice be paid.

## How MatchPay differs

MatchPay does not compete on breadth. It goes deep on one flow: invoice, AI reading and matching, rules, payment batch, signing.

| # | Differentiator | How |
|---|---|---|
| 1 | **One approval flow across entities** | Every document carries one entity code; each entity configures its own approval matrix and tolerances inside group limits (BR-01, BR-03, BR-16). |
| 2 | **AI provides evidence, rules decide, people sign** | The Rule Engine checks six conditions without an LLM; the AI never signs and never decides admission (D-08). |
| 3 | **Measure before trusting** | Shadow mode measures accuracy per supplier and entity pair before the group opens an automation gate (D-06). |
| 4 | **Cheaper and more automatic over time** | Each pair a person confirms enters the mapping table, so the same lines need no LLM call next time (G-07). |
| 5 | **Entity isolation with group-level insight** | Comparisons across entities show aggregates only, and are hidden when fewer than 3 entities buy an item (BR-09). Cross-entity anomaly detection is Advanced. |
| 6 | **Built for the signer** | The batch screen shows totals by entity and supplier, large invoices, sample-check results, and evidence for each invoice (BR-20). |

**Related:** [Step index](README.md)
