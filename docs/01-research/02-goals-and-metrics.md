# Goals and Success Metrics

> Design status: MVP — approved
>
> Implementation status: NOT STARTED

The targets below are **proposed values for the demo on simulated data**, to be confirmed later. There is no real baseline, so the results are not comparable with published benchmarks (see "Benchmarks" below). **G-01 and G-02 are always reported together:** a high automation rate with many wrong placements has no value, so a G-01 figure is never shown without the G-02 figure beside it, and it is marked invalid when G-02 is above its target.

| ID | Goal | Solves | Metric (formula) | Target | How it is measured |
|---|---|---|---|---|---|
| G-01 | Most invoices join a batch without a person viewing each one. | P-01, P-04 | **Touchless rate** = invoices that joined a batch with no person acting on that invoice before the sample check, divided by all invoices received in the period, excluding employee-expense invoices (D-14). Rejected invoices (for example a wrong buyer) stay in the denominator. | At least 50% | Dashboard and the labelled demo data set. Reported with G-02. |
| G-02 | The AI does not misplace invoices into a batch. | P-01, P-02, P-03 | **Misplacement rate** = invoices withdrawn because the sample check found an error, divided by invoices sampled, in the period. | At most 1% | Sample-check results. Also reported on the labelled data set, where the correct answer is known. |
| G-03 | Order splitting is caught. | P-03, P-04 | **Split-order detection** = seeded split-order cases flagged, divided by seeded split-order cases. | At least 90% | Evaluation set of seeded demo cases. No user feature measures it. |
| G-04 | Duplicate invoices are caught. | P-03 | **Exact duplicates** (same supplier, series, and number, checked across the whole group, D-09) caught, divided by seeded exact duplicates. **Variant duplicates** (near-duplicate content within one entity) caught, divided by seeded variants. | 100% exact; at least 90% variants | Evaluation set of seeded demo cases. No user feature measures it. |
| G-05 | The AI check is fast. | P-01 | Time from invoice received to the Rule Engine decision (admitted or exception), at the 95th percentile (D-23); the median is also reported. | At most 1 minute | Server-side timestamps per invoice. |
| G-06 | No data leaks between entities. | P-04 | Count of cross-entity data exposures in the permissions test suite, including cross-entity comparisons that must show only aggregates and stay hidden when fewer than 3 entities buy the item (BR-09). | 0 | Automated permissions test suite: every role against every entity and resource. No user feature measures it. |
| G-07 | Most lines are matched without calling the LLM. | P-02 | **LLM-free match rate** = invoice lines matched by the mapping table, or by embedding plus the signal-fusion model, with no LLM call, divided by all invoice lines processed. | At least 60% | AI decision log (each decision records its method). |

## Reading the results honestly

- **G-02 is measured on a risk-weighted sample, not a random one.** The AI selects invoices to check by risk (large amounts, new suppliers, items often matched wrongly; BR-07). The result therefore estimates the error rate. It is probably higher than the rate across all invoices, but that is not proven, and errors in unsampled invoices go unseen. The labelled demo data set gives the exact rate on known cases.
- **The demo data is simulated.** Item names come from public procurement sources, and a second person writes the hard variants, so the data is not graded by its own author (R-07). Part of the data is held back and used only for reporting.
- **G-03, G-04, and G-06 have no user story.** They are measured against seeded demo cases or a permissions test suite and are not invented as features.

## Benchmarks

None of the published figures can be compared directly with the demo. The brief's reference for G-01 and G-05 did not survive checking (D-20).

| Measure | Figure | Source | Note |
|---|---|---|---|
| Touchless rate, all buyers | About 33% (32.6%) | Ardent Partners, "AP Metrics that Matter in 2025", as quoted on two vendor pages: [Sista AI, 2026-06-17](https://sista.ai/tr/insights/touchless-ap-reconciliation-case-study) and [Tungsten Automation](https://www.tungstenautomation.com/learn/blog/ai-in-accounts-payable-metrics-that-matter) | The report is paid and could not be read. [Ardent's page](https://ardentpartners.com/ap-metrics-that-matter-in-2025/) confirms the title and shows no numbers. **Unverified at the primary source.** |
| Touchless rate, best-in-class | 49.2% | Same two vendor pages | Same limit. |
| Touchless rate, average | 60% | The Hackett Group 2025, as quoted by [Corpay](https://www.corpay.com/resources/blog/ap-team-productivity-benchmarks), updated 2026-07-31 | A different definition and sample, so the sources disagree. The range 33% to 60% depends on source and definition. |
| Trend | Ardent's January 2026 post says the average touchless rate is "also trending up" and that best-in-class teams process "more than 1.8 times as many" invoices straight through as their peers. It gives no absolute figure. | [Ardent Partners, Payables Place, 2026-01-22](https://payablesplace.ardentpartners.com/2026/01/state-of-epayables-part-nine-ap-benchmarks-and-best-in-class-performance/) | The 1.8 ratio is not converted into a percentage here. |
| Whole-process cycle time (receipt to payment) | 8.2 days average in 2025; 15 days median in another source | Ardent post above; Corpay page above (APQC) | The brief's 3.1 and 10.9 days are not on the Corpay page cited. G-05 measures only the AI check, which is a small part of this cycle. |
| Exception rate | 18.4% average in 2025 (Ardent); about 5% median (APQC, via Corpay) | Same pages | Shows the same definition problem. |

The brief proposed a target of at least 50% for G-01 against "about one third on average, about 49% for the best group". That target is kept as a proposal for the demo, with the caveat that a simulated data set built for the demo is not comparable with any of these figures.

**Related:** [Research index](README.md)
