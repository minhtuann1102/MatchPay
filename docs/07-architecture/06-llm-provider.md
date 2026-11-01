# LLM Provider — Decision Record

> Design status: MVP — Step 7 of 9, draft for review
>
> Implementation status: NOT STARTED

**Status of this record: a recommendation, a call awaiting the user's review (D-181).** It chooses the hosted LLM API that sits behind `LlmPort`, and a second one to switch to. It rests only on the vendor pages listed under [Sources opened](#sources-opened), all opened on 2026-11-01. Every vendor fact below carries the number of its source. Anything not found on an opened page is marked **Unverified**, with what would confirm it. Prices and model identifiers are copied from those pages as they stood on that day; prices change, so read them again before a contract.

**A disclosure.** The worker that wrote this record is itself a Claude model. The recommendation follows the evidence in the table, but the user should weigh that the author is not neutral, and the evaluation in [How to confirm the choice](#how-to-confirm-the-choice) is there so that the choice rests on a measurement, not on this text.

## Needs

| Need | Source | What it asks of the provider |
|---|---|---|
| Output follows a fixed schema; a mismatch becomes an exception | BR-27, AC-14.4 | Strict JSON-schema output, or a schema our code validates |
| Document text is data, never instructions | BR-27, AC-19.8, R-09 | Nothing special from the provider; the prompt keeps text in a delimited field and the schema limits the answer |
| Every AI result stores the model and prompt version | BR-12, DF-08 | A model identifier that names a fixed model, so a stored version means one behaviour |
| The LLM is called only when the mapping table and the embedding model are not sure | BR-28, G-07 | Low volume; at least 60 of 100 held-back lines need no call (AC-14.7) |
| Fast checks: the 95th percentile from receipt to the Rule Engine decision is at most 1 minute | G-05 | A call that answers within the 20-second timeout (DF-08) |
| Cost and availability are bounded; a failure never blocks intake | R-10, DF-08 | A predictable price per token and a service that mostly answers |
| Personal data may reach a foreign provider only after a transfer impact assessment | O-03, R-11, L-17 | Synthetic data only in the MVP; clear data-use and retention terms for the day real data is used |
| Vietnamese item names, units, and short business text | P-02, ES-03 | Good Vietnamese understanding and drafting |

### The eight AI tasks and where an LLM is used

| # | Task | LLM call | Share of the volume |
|---|---|---|---|
| 1 | Classify the flow | Only when the XML fields leave the flow undecided (AC-12.5) | Very low |
| 2 | Read the document | Never: a parser reads the XML (D-57) | None |
| 3 | Identify entity and order | Only when the tax code or the order number is missing (AC-13.8) | Very low |
| 4 | Match lines | Once per line when the fusion probability is from 0.50 to below 0.90 (DF-15); the largest source of calls | High |
| 5 | Detect anomalies | Never: statistics over history | None |
| 6 | Handle exceptions | Explains the difference and drafts the request or the data-fix notice; a person presses Send (AC-19.1) | Low |
| 7 | Select the sample | Never in this design: risk scoring by rules (D-179) | None |
| 8 | Prepare the signer | One summary for each payment request, labelled as AI (AC-25.1) | Low |

So four tasks use an LLM: line matching as a fallback, drafting and explaining exceptions, the batch or request summary, and the flow and identification fallback. Embeddings are not a provider question: they run locally (D-180).

## Criteria

1. Strict JSON-schema output.
2. Vietnamese quality.
3. Data use and retention terms.
4. Regions.
5. Price per 1M tokens.
6. Rate limits.
7. Model versioning, so BR-12 can store a version.
8. Availability.
9. SDK.

## Candidates

Three hosted APIs and one self-hosted option. Each hosted candidate is the smallest model line that its page lists next to a flagship, because the volume is low and the calls are short.

| Candidate | Model identifiers read on the pages | Source |
|---|---|---|
| Anthropic Claude | `claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5` | S2 |
| OpenAI | `gpt-6-astra`, `gpt-6.1-sol`, `gpt-6.1-terra`, `gpt-6-luna` | S8 |
| Google Gemini | `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-3.1-pro-preview`, `gemini-3.8-flash`, `gemini-3.6-flash` | S11 |
| Self-hosted open-weight | `Qwen/Qwen3-32B` (Apache-2.0) | S14 |

## Comparison

| Criterion | Anthropic Claude | OpenAI | Google Gemini | Self-hosted (Qwen3-32B) |
|---|---|---|---|---|
| Strict JSON-schema output | Yes: constrained decoding on all models of the Messages API; `additionalProperties` must be false; no numeric or length constraints in the schema, so our code validates those; a refusal or a cut-off answer may not match the schema (S4) | Yes: strict Structured Outputs from GPT-4o onward; the page recommends `gpt-6-astra` for new projects; refusals can be detected in code; the page does not list the schema limits (S9) | Yes: a JSON Schema in the request; some keywords such as `minLength`, `maxLength`, and `uniqueItems` are ignored by the server, so our code validates them; a very large schema can be rejected with 400 (S12) | The model card describes no native structured-output mode (S14). Whether a serving framework can force a schema is **Unverified**; the vLLM guided-output documentation would confirm it |
| Vietnamese quality | **Unverified.** No opened page gives a Vietnamese result | **Unverified** | **Unverified** | **Unverified.** The card says "100+ languages and dialects" and does not name Vietnamese (S14) |
| Data use | Commercial Terms: "Anthropic may not train models on Customer Content from Services" (S7) | By default API data is not used to train or improve models (S10) | Paid tier: data is not used to improve Google products; the free tier does (S11, S13) | Stays in our deployment |
| Retention | Inputs and outputs deleted from the backend within 30 days, with listed exceptions; zero data retention by agreement; structured outputs are ZDR eligible (S4, S6) | Abuse-monitoring logs up to 30 days by default; zero data retention and modified abuse monitoring need approval (S10; the last part of the page was not read) | **Unverified.** The billing page gives no period; the terms page would confirm it (S13) | Ours to define |
| Regions | `inference_geo` is `us` or `global`; workspace storage is US only (S5). No region in Asia is offered on the page | Regional endpoints per project; the US and the EU support storage and processing; other regions need approval (S10) | **Unverified.** No opened page lists regions | Anywhere we host |
| Price per 1M tokens, input / output | `claude-sonnet-5-5` USD 2 / 10; `claude-haiku-5-5` USD 0.10 / 0.50 for prompts up to 100K tokens; `claude-opus-5-5` USD 4 / 20; batch 50% off; `us` geo 1.1x (S1, S5) | `gpt-6.1-terra` USD 1 / 5; `gpt-6.1-sol` USD 2 / 10; `gpt-6-luna` USD 0.10 / 0.50; `gpt-6-astra` USD 10 / 50 (S8) | `gemini-3.5-flash-lite` USD 0.30 / 2.50; `gemini-3.1-flash-lite` USD 0.25 / 1.50; `gemini-3.1-pro-preview` USD 2 / 12 (prompts up to 200K) (S11) | No per-token price. The cost of a GPU server is **Unverified** (no price page was opened) |
| Rate limits | **Unverified.** The limits page was not opened | **Unverified** | **Unverified** | Set by our hardware |
| Model versioning | From the 4.6 generation on, the dateless identifier "maps to a single, fixed model snapshot"; a new version ships under a new identifier; each identifier has its own retirement schedule (S3) | **Unverified.** The pages opened give identifiers but no statement on pinning | **Unverified.** Some listed models are "preview"; Gemini 4, 3.8 Flash, and 3.6 Flash have scheduled price increases (S11) | We pin the weights |
| Availability | **Unverified.** No status or SLA page was opened | **Unverified** | **Unverified** | Ours to run |
| SDK | A Python SDK with Pydantic parsing: `client.messages.parse(output_format=...)` (S4) | Python SDK with Pydantic (S9) | Python SDK with Pydantic (S12) | OpenAI-compatible serving is **Unverified** |
| Other | Context 1M tokens, output up to 128K (S2). Claude 4.7 and later use a tokenizer that makes about 30% more tokens for the same text (S1) | Data residency adds a 10% uplift on eligible models released on or after 2026-03-05 (S10) | Gemini 4 Argon and the Flash models have price changes dated in the page (S11) | 32,768 tokens native context, serving needs a recent vLLM or SGLang (S14) |

## Cost estimate for the demo volume

**This is an estimate from assumptions, not a measurement.** The numbers will change when ES-03 shows the real share of lines that reach the LLM.

Assumptions: the demo group has three entities and receives 600 invoices a month in total, with 8 lines each, so 4,800 lines. Per G-07, at least 60% of lines are matched with no LLM; the estimate lets 40% reach it. Token counts per call are guesses for short prompts with a few candidate items.

| LLM use | Calls a month | Input tokens a call | Output tokens a call |
|---|---|---|---|
| Line matching fallback | 1,920 | 900 | 150 |
| Flow or identification fallback (5% of invoices, two tasks) | 60 | 1,500 | 200 |
| Draft or explanation for an exception (15% of invoices need one) | 90 | 2,000 | 600 |
| Summary of a payment request (about 120 requests) | 120 | 3,000 | 500 |
| **Total** | **2,190** | **2.36 million in all** | **0.41 million in all** |

| Model | Input USD per 1M | Output USD per 1M | Estimated USD a month |
|---|---|---|---|
| `claude-haiku-5-5` | 0.10 | 0.50 | 0.44 (0.63 with the 1.1x `us` geo and 30% more tokens) |
| `claude-sonnet-5-5` | 2 | 10 | 8.86 (12.67 with the same two adjustments) |
| `claude-opus-5-5` | 4 | 20 | 17.71 (25.32 with the same two adjustments) |
| `gpt-6-luna` | 0.10 | 0.50 | 0.44 |
| `gpt-6.1-terra` | 1 | 5 | 4.43 |
| `gemini-3.5-flash-lite` | 0.30 | 2.50 | 1.74 |
| `gemini-3.1-flash-lite` | 0.25 | 1.50 | 1.21 |

At this volume the price is not the deciding factor: every hosted option costs less than USD 30 a month. The deciding factors are the data terms, the pinned identifier, and the quality on Vietnamese text. The self-hosted cost is not estimated because no hardware price was opened.

## Recommendation

- **Primary: Anthropic, `claude-sonnet-5-5`,** for all four LLM uses at the start. Reasons from the opened pages: a pinned, dateless identifier that fits BR-12 (S3); strict schema output on every model and a Pydantic path in the SDK (S4); a contractual statement that Anthropic may not train on customer content (S7); deletion within 30 days and zero data retention by agreement (S6); a US-only inference option for the day a geography must be fixed (S5).
- **Then test `claude-haiku-5-5` for line matching** on ES-03. It costs a twentieth of the Sonnet price on the page (S1). Switch only if the held-back lines show no loss, because the line fallback is the largest source of calls.
- **Fallback: OpenAI, `gpt-6.1-terra`,** switched on by configuration, not an automatic failover. Reasons: strict Structured Outputs (S9), no training on API data by default and documented retention and regional controls (S10), and a price of the same order (S8). Automatic failover is not designed: an AI failure becomes an exception (DF-08), and sending the same document to a second provider needs its own transfer impact assessment (O-03).
- **Gemini** is the third hosted option. It is not chosen because the opened pages give no retention period, no regions, and a schema subset that needs more of our own validation (S11, S12, S13).
- **Self-hosted `Qwen/Qwen3-32B`** is not used in the MVP. It is the route for the day the transfer impact assessment says that real data must not leave the deployment (O-03, R-11). It needs a GPU server whose cost, the Vietnamese quality, and the schema-forcing support are all Unverified.

**What the recommendation does not say.** No opened page shows how well any model reads Vietnamese item names, how large the rate limits are, or how often the service is down. The recommendation is a start, not a proof.

## How the choice can be reversed

- Only the **LLM Gateway** module names a provider. Every other module calls `LlmPort`, and the provider is a setting (`llm.provider`, `llm.model`) in the deployment file ([tech stack](05-tech-stack.md#server-configuration)). A switch is a restart, not a code change in the business modules.
- Each task has a **prompt version** and a **JSON schema version** kept as named files. The gateway stores the model identifier and the prompt version in `ai_requests` and in the result tables (BR-12), so the evidence of an old decision stays readable after a switch.
- The schemas use only the common subset of the three providers' schema features (objects, arrays, strings, enums, no numeric or length constraints), and our own code validates ranges. A schema that works for one provider then works for the others (S4, S12).
- A new model replaces the old one only after the evaluation sets ES-03 (line matching) and the drafting review give a result at least as good (BR-28).
- The confidence the LLM reports about itself is never the only basis (AC-14.6), so a change of model does not change who decides.

## How to confirm the choice

1. Run ES-03 (100 tuning and 100 held-back lines) with the candidate models and compare the share of lines matched correctly and the share that reach the LLM (G-07, AC-14.7).
2. Have a Vietnamese reader grade 20 drafts and 20 summaries for each candidate on synthetic data.
3. Measure the 95th percentile latency of the call against the 20-second timeout (DF-08, G-05).
4. Read the rate-limit, retention, and region pages of the chosen vendor, and the Anthropic and OpenAI data processing terms, before any real data is used (O-03).
5. Ask a lawyer for the transfer impact assessment named in O-03 and the processor contract named in R-11 before real data reaches any foreign provider.

## Sources opened

All opened on 2026-11-01. A search engine returned only third-party summaries of prices, which were not used. Where a page was long, the part read is stated.

| # | URL | What it said |
|---|---|---|
| S1 | https://platform.claude.com/docs/en/about-claude/pricing | Price table per 1M tokens (Haiku 5.5, Sonnet 5.5, Opus 5.5, and older models); Batch API 50% off; cache multipliers; `inference_geo` `us` 1.1x on Claude 4.6 and later; Claude 4.7 and later tokenizer makes about 30% more tokens. The page lists no API identifiers |
| S2 | https://platform.claude.com/docs/en/models/overview | Identifiers `claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5`; 1M-token context and 128K output; no data residency text |
| S3 | https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions | Dateless identifiers from 4.6 on are fixed snapshots; a new version ships under a new identifier; every identifier has its own deprecation and retirement schedule (the deprecations page itself was not opened) |
| S4 | https://platform.claude.com/docs/en/build-with-claude/structured-outputs | JSON outputs through `output_config.format`; constrained decoding; all models; ZDR eligible; supported and unsupported schema features; refusal and cut-off caveat; Pydantic parsing |
| S5 | https://platform.claude.com/docs/en/build-with-claude/data-residency | `inference_geo` `global` or `us`; workspace geo `us` only; 1.1x for `us` |
| S6 | https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data | API inputs and outputs deleted within 30 days, with exceptions; the page does not say whether data is used for training |
| S7 | https://www.anthropic.com/legal/commercial-terms | Section B: "Anthropic may not train models on Customer Content from Services." |
| S8 | https://developers.openai.com/api/docs/pricing | Standard prices per 1M tokens: `gpt-6-astra` 10 / 50, `gpt-6.1-sol` 2 / 10, `gpt-6.1-terra` 1 / 5, `gpt-6-luna` 0.10 / 0.50 |
| S9 | https://developers.openai.com/api/docs/guides/structured-outputs | Strict schema adherence from GPT-4o on; recommends `gpt-6-astra` for new projects; refusals detectable; schema limits not listed on the page |
| S10 | https://developers.openai.com/api/docs/guides/your-data | Not trained on by default; abuse logs up to 30 days; ZDR and modified abuse monitoring by approval; regional endpoints (US, EU); first 100,000 of 128,880 characters read |
| S11 | https://ai.google.dev/gemini-api/docs/pricing | Standard prices and model codes; "data used to improve products" is Yes on the free tier and No on the paid tier; scheduled price increases; first 100,000 of 143,326 characters read |
| S12 | https://ai.google.dev/gemini-api/docs/structured-output | JSON Schema in the request; supported keywords; some keywords ignored; large schemas can give 400 |
| S13 | https://ai.google.dev/gemini-api/docs/billing | Paid use is not used to improve Google products; points to the terms; no retention period |
| S14 | https://huggingface.co/Qwen/Qwen3-32B | 32.8B parameters; Apache-2.0; "100+ languages and dialects", Vietnamese not named; 32,768-token context; serving with vLLM or SGLang; no structured-output mode described |

The embedding model cards, pgvector, and the PostgreSQL pages are listed in the [tech stack](05-tech-stack.md#sources-opened).

**Previous:** [Tech stack](05-tech-stack.md) · **Next:** [Runtime and deployment](07-runtime-and-deployment.md).
