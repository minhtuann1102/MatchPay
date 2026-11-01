# Why AI Instead of Rule-based

> Design status: MVP — approved
>
> Implementation status: NOT STARTED

Rules handle exact matches well and are still used for them. The AI takes the part that rules cannot do: reading unstructured documents, understanding what an item name means, and weighing several signals at once. The design has two layers: the **understanding layer uses AI**, and the **decision layer uses transparent rules**.

## Where rules break down

| Challenge | Example | Rule-based (string comparison, if/else) | AI |
|---|---|---|---|
| Item names differ between documents | The supplier writes "Brand-X 70gsm copy paper"; the entity's item is "A4 copy paper, grade 1". | Fails unless the exact pair was listed beforehand. | Understands that they are the same item and gives the reason. |
| Units differ | The order is 10 reams; the invoice is 2 cartons; 1 carton = 5 reams. | Needs a conversion table for every item and supplier. | Converts the unit and shows the arithmetic. |
| Unseen layouts (Advanced, W-19) | A foreign supplier's PDF invoice in a layout the system has never seen. | No fixed template to read it with. | A multimodal LLM would read it into the common document model, and a person would confirm every field. This is not in the MVP (D-33), which reads XML only. |
| The buyer's tax code is missing | An invoice names the buyer but leaves out the tax code. | Cannot identify the entity. | Identifies the entity and the order from the other fields; the AP Accountant confirms. |
| Many weak signals together | A price 3% over history, a quantity at the limit, and a new supplier on one invoice. | Each rule passes alone, so nothing is flagged. | The signal-fusion model weighs all signals into one calibrated probability. |
| Recurring invoices that drift | An electricity bill 35% above the average of previous periods. | A fixed limit is either too tight or too loose for each site. | Statistics against the profile's own history, explained in numbers. |
| Explaining a difference | Why does this invoice not match its order? | Cannot write an explanation. | Says where the difference is and drafts the request to the supplier or to the team that must fix the ERP; a person sends it. |
| Subscription seat creep (Advanced) | A software subscription is charged for 55 seats while the profile says 50. | Needs a hand-written rule per supplier. | Compares the charge with the profile and the card transaction. |

## Where rules stay (hybrid design)

Deterministic policies stay in code, so they can be explained and audited. The **six conditions** below decide whether an invoice joins a batch. A missing condition sends the invoice to an exception (BR-05). The Rule Engine does not use an LLM.

| # | Condition | Business rules |
|---|---|---|
| 1 | The key fields (seller, amount, quantity) are confirmed by an independent source. A signed non-coded XML invoice from a configured sector needs a matching recurring profile for this (D-24). | BR-17, BR-19, BR-24 |
| 2 | Every line is matched with confidence above the threshold. | BR-28 |
| 3 | Price and quantity are inside the entity's tolerance, and the quantity does not exceed the quantity received. | BR-04, BR-15 |
| 4 | The total is below the entity's batch threshold. | BR-16 |
| 5 | The supplier has passed the automation gate and is not on the tax-risk list. | BR-06, BR-08, BR-30 |
| 6 | There is no anomaly (BR-10, BR-11, BR-24, BR-29, BR-30). | BR-10, BR-11, BR-24, BR-29, BR-30 |

Other rules that stay as rules: one entity per document (BR-01); separation of duties (BR-02); the approval matrix (BR-03); entity isolation (BR-09); an exact duplicate blocks payment (BR-11); the receipt can only be created by the warehouse keeper (BR-13); an invoice without a receipt waits (BR-14); the signature rule (BR-20); the schema check on every LLM answer (BR-27).

## The eight AI tasks

| # | Task | The accountant did it by | The AI does | When the AI is unsure |
|---|---|---|---|---|
| 1 | Classify the flow | Looking at each invoice | Classifies: purchase with order, subscription, recurring, unsupported (foreign invoice), employee expense, other | Exception, person classifies. An unsupported foreign invoice is an exception that a person can only reject (D-33) |
| 2 | Read the document | Typing the numbers again | Reads XML | Person confirms |
| 3 | Identify | Looking up the entity and order | Identifies the entity, order, or profile, even when the tax code is missing | AP Accountant confirms |
| 4 | Match lines | Checking line by line and converting units | Matches supplier lines to internal items and converts units | Flags the doubtful line |
| 5 | Detect anomalies | Usually not done | Unusual price, duplicate invoice, order splitting, recurring jump, subscription seat creep (Advanced) | AI flags, a person handles |
| 6 | Handle exceptions | Finding the difference and writing the email | Explains the difference; drafts the supplier request or the data-fix notice; tracks reply deadlines; links a follow-up invoice to the old exception. A person presses send. | Not applicable |
| 7 | Select the sample | Random or by feel | Selects by risk: high value, new suppliers opened automatically, items often matched wrongly | Not applicable |
| 8 | Prepare the signer | Building an Excel summary | Summarises the batch: totals by entity and supplier, points to watch, sample-check result | Not applicable |

The task "flag foreign tax duties" (foreign contractor tax, import documents), the reading of foreign PDF with a multimodal LLM, and the suggested tax type are Advanced (W-19, W-20, W-08). D-33 removed them from the MVP.

**The AI does not:** sign a payment voucher; decide to put an invoice in a batch (the Rule Engine decides on the AI's evidence); decide legal questions such as whether a seller falls under the purchase-list rule, or what to do with an invoice from a tax-risk supplier; send anything outside the system.

## AI architecture

| Component | Technique | Why |
|---|---|---|
| Intake and normalisation | An adapter per source (XML and ERP) converts to the common document model. A PDF adapter is Advanced (W-19). | Matching and rules are written once for every source |
| Mapping table | Lookup of supplier item name to internal item, already confirmed by a person | Instant match with no AI call |
| Embedding | A multilingual text-vector model that handles Vietnamese | Finds 3 to 5 candidate items closest in meaning |
| LLM line matching | A large language model that returns JSON in a fixed schema | Called only when the table and embedding are not sure enough; understands the meaning, converts units, and gives a reason |
| Signal-fusion model | A logistic regression trained on a labelled data set. Inputs: embedding similarity, price match, quantity match, matching history, and the LLM result when there is one. | Gives a calibrated probability that is more reliable than the confidence the LLM reports about itself; a new version replaces the old one only when it is better on the test set (BR-28) |
| Anomaly detection | Statistics over history (median, time window) | Can be explained in numbers |
| Rule Engine | Checks the six conditions, no LLM | A decision must be explainable and auditable |

A multimodal LLM that reads a PDF or an image into the common document model is Advanced (W-19) and is not part of the MVP architecture.

### Three principles

1. **The LLM provides evidence, the rules decide, a person signs and is accountable.**
2. **The system becomes cheaper and more automatic over time.** Each time a person confirms a match, the pair enters the mapping table and the LLM is not called for it again (G-07).
3. **Measure before trusting.** Shadow mode measures accuracy, and the Group Admin opens the automation gate for each supplier and entity pair when the threshold is reached. In the MVP the switch is manual and a sample-check failure raises an alert (D-06). Opening and closing by itself is Advanced. Every decision stores the prompt and model version (BR-12).

### Cross-entity comparison

Comparing across entities is an advantage of a shared platform: one entity paying far more than the group's median, several orders just under an approval threshold, an invoice duplicated under a new number or sent to another entity. The AI shows aggregates only (for example the group median price) and never another entity's individual transaction (BR-09). In the MVP an exact key duplicate is checked across the group; the rest of cross-entity detection is Advanced (D-09).

## Costs of using AI, and how they are handled

AI brings a cost per call and latency (R-10), wrong answers (R-01), injection through document content (R-09), and data-privacy duties (R-11). The hybrid design keeps these bounded: an AI failure or a schema mismatch sends the invoice to an exception and never blocks intake (BR-27), the mapping table removes repeated LLM calls (G-07), and the misplacement rate (G-02) makes AI quality visible so that the group can decide with data how far to automate.

**Related:** [Research index](README.md)
