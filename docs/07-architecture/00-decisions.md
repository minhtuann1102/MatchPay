# Decisions and Defaults

> Design status: MVP — Step 7 of 9, draft for review
>
> Implementation status: NOT STARTED

Numbering continues from Step 6 (decisions end at D-164, defaults end at DF-88). The Step 7 decisions are D-165..D-186 and the defaults are DF-89..DF-93. **Every row in "Decisions made in this step" and "Defaults pending confirmation" is a call made while designing the architecture. Each one awaits the user's review and none is the user's own decision.** The LLM provider (D-181) is a recommendation on evidence from vendor pages opened on 2026-11-01; the evidence and what stayed Unverified are in the [decision record](06-llm-provider.md).

The user's message of 2026-11-01 ("hoan thien not buoc 6 buoc 7, toi da review xong") asked to finish Steps 6 and 7. Step 7 builds on Step 6 as a draft: if the user changes a Step 6 call, the items that depend on it are named in the "Depends on" notes below.

## Decisions made in this step

| ID | Decision | Why | Status |
|---|---|---|---|
| D-165 | **Architecture style: a modular monolith.** One backend codebase is deployed as two processes: `api` (HTTP, the OpenAPI contract) and `worker` (the background jobs of Step 6). Modules follow the OpenAPI tags (24 tags, 30 components in [C3](03-component.md)). | One team and a demo MVP; the transactions of Step 5 need one database; modules keep a later split possible. | Call, awaiting user review |
| D-166 | **Web application.** React, TypeScript, Vite; React Router in **history mode** (closes DF-34); TanStack Query for server state; API types generated from `openapi.yaml` with `openapi-typescript`; styling from the Step 4 tokens in `wireframe.css` (D-44). Served as static files by the reverse proxy, which returns `index.html` for any path that is not a file or `/api`. | One language across the screens; types from the contract keep screens and API in step; history mode gives the clean routes of Step 3. | Call, awaiting user review |
| D-167 | **Backend.** Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2, Alembic migrations written to match `matchpay.dbml`. **Contract first:** the hand-written `openapi.yaml` is the source of truth, a Schemathesis contract test compares the running API with it, and FastAPI's generated schema is not published (D-130). | The AI part (embeddings, scikit-learn logistic regression for the signal fusion, `lxml` and `signxml` for the XML signature check) is in Python, so it lives in the same codebase as the API. | Call, awaiting user review |
| D-168 | **Database.** PostgreSQL 16 (confirms D-47) with the pgvector extension for item-text embeddings. `matchpay.dbml` has **no column or table for vectors**; this is a gap (see below). Step 8 or 9 adds a table `erp_item_embeddings` (entity, item, model, a 1,024-dimension vector, time) with an HNSW cosine index, owned by the Embedding Service. | The schema needs partial indexes, exclusion constraints, `bytea`, and row-level security. The pgvector page opened says it supports Postgres 13 and later and indexes up to 2,000 dimensions. | Call, awaiting user review |
| D-169 | **Jobs: a PostgreSQL-backed queue** in `platform.jobs`, claimed with `SELECT ... FOR UPDATE SKIP LOCKED`; no Redis. A job is inserted in the same transaction as the change that causes it. Schedules (sync, mailbox, reminders) insert jobs. **Two operations that answer at once need an outside system** (`draftCorrectionRequest` needs the LLM, `sendCorrectionRequest` needs the Email Service): the API inserts a job and **waits for its result up to 25 seconds** (DF-93). On a timeout the draft returns the blank template (AC-19.7) and the send returns `NOT_SENT` (AC-19.6). | Keeps one system to run and one transaction (D-135, DF-08). The wait keeps the LLM key and every outside connection in the Worker while `openapi.yaml` keeps its synchronous answers (D-158). | Call, awaiting user review |
| D-170 | **A separate schema `platform`** holds infrastructure: `sessions`, `idempotency_keys`, `rate_limit_counters`, and `jobs`. It is not part of the business schema of `matchpay.dbml` and not in the ER diagrams (a difference from Step 5, row 1 below). | These tables hold no business fact, change by the second, and are cleared by time; mixing them with the audited business tables would blur what the 74 tables mean. | Call, awaiting user review |
| D-171 | **ERP simulator and ports.** The simulator is the module `demo_erp` of the same backend; its six `sim_*` tables live in the PostgreSQL schema `sim`. MatchPay reaches an ERP only through `ErpPort`; the demo binds `SimulatedErpAdapter`. The simulated status lookup is `AuthorityStatusPort` with `SimulatedAuthorityAdapter` (reads `sim_authority_statuses`, D-93, D-120); the simulated mailbox is `MailboxPort` with `SimulatedMailboxAdapter` (D-92); the delivery of requests is `MailerPort` with `SimulatedMailerAdapter` (US-19). The simulator routes and adapters exist only when the demo flag is on (D-143). | A real ERP, status service, mailbox, or mail service replaces an adapter and no business module changes. D-49 allowed Step 7 to place the `sim_*` tables in a separate schema. | Call, awaiting user review |
| D-172 | **Entity isolation in two layers.** (1) The server filter on `entity_id` from the session (D-48, D-132). (2) PostgreSQL row-level security on every table that has `entity_id`, keyed on a per-transaction setting `app.entity_id` set by the Persistence unit of work; the tables are `FORCE ROW LEVEL SECURITY`, and the application role is neither a superuser nor `BYPASSRLS`. | A forgotten filter returns nothing instead of another entity's rows (D-48). Answers the Step 5 item. The permission suite TS-01 tests both layers. | Call, awaiting user review |
| D-173 | **Files stay in PostgreSQL.** The XML original and the cancellation notice are `bytea` columns, at most 10 MB each (DF-85, DF-79, DF-81), with the hash beside them. Object storage is future work. | The hash and the bytes stay in one transaction (D-57). The volume of a demo is small. | Call, awaiting user review |
| D-174 | **Server configuration:** environment variables for secrets and deployment facts, and one versioned YAML file per deployment, read at start. The full list with defaults is in the [tech stack](05-tech-stack.md#server-configuration). No setting has a screen. | Answers DF-55 without a screen that Step 3 does not have. | Call, awaiting user review |
| D-175 | **Authentication.** Server-side sessions in `platform.sessions`, the cookie `mp_session` (D-131), Argon2id password hashes (minimum length 8, DF-32). Idempotency keys live in `platform.idempotency_keys` for 24 hours (DF-87), including the key of `releaseBatch`, which has no column of its own. Password reset stays out of scope (no story). | Answers D-131 and DF-87. | Call, awaiting user review |
| D-176 | **Deployment for the demo:** Docker Compose with `proxy` (Caddy, static web files and `/api`), `api`, `worker`, and `postgres`. One environment. Production hardening is future work. | A demo needs one command to start. | Call, awaiting user review |
| D-177 | **Tests.** pytest for the code; Schemathesis contract tests against `openapi.yaml`; Playwright end-to-end tests on the Step 3 flows; the evaluation sets ES-01 to ES-04 and the permission suite TS-01 run as a separate command, not with the unit tests. | Each kind answers a named acceptance criterion (G-03, G-04, G-06, AC-14.7). | Call, awaiting user review |
| D-178 | **Observability.** Structured JSON logs that carry `traceId`, the same id as in Problem Details (D-139); one log line for each AI call that mirrors `ai_requests`. No document text, password, or session id in a log. | A user who reports an error gives the `traceId`, and support finds the line. | Call, awaiting user review |
| D-179 | **AI architecture inside the Worker**, following the two layers (the AI gives evidence, the Rule Engine decides). Line matching goes: mapping table first, then embedding similarity (pgvector, top 3 to 5 candidates), then the logistic-regression signal fusion, and the LLM only when those are not confident (from 0.50 to below 0.90, DF-15; G-07, BR-28). Every LLM output is validated against a fixed JSON schema, and a schema failure becomes an exception (BR-27). Document text is passed as data in a delimited field, never as instructions. Every AI result stores the model and prompt version (BR-12). An `LlmPort` and an `EmbeddingPort` hide the provider. The flow, the identification, and the sample selection are rules and statistics first; the LLM is only a fallback for the first two, and none is used for sample selection and anomalies. | Follows BR-12, BR-27, BR-28, G-07 and the [AI architecture](../01-research/07-ai-vs-rule-based.md#ai-architecture). The choice that no LLM selects the sample is a reading: Step 1 does not say. | Call, awaiting user review |
| D-180 | **Embeddings run locally** with an open multilingual model inside the Worker. Default `BAAI/bge-m3`, alternative `intfloat/multilingual-e5-large`; both cards opened say 1,024 dimensions and the MIT license, and neither names Vietnamese. The choice is open until ES-03 compares them on Vietnamese lines. The most frequent AI call never leaves the deployment and costs nothing per call. One `ai_requests` row is still written for each embedding call (`call_kind` EMBEDDING). | Cost, privacy (R-11), and speed (G-05). The brief asks for a multilingual vector model that supports Vietnamese. | Call, awaiting user review |
| D-181 | **LLM provider (recommendation).** Primary Anthropic `claude-sonnet-5-5` for the four LLM uses, with `claude-haiku-5-5` to be tested for line matching on ES-03. Fallback OpenAI `gpt-6.1-terra`, switched by configuration and not as an automatic failover. A self-hosted open-weight model is the route for real data. The evidence, the cost estimate (about USD 9 to 13 a month for `claude-sonnet-5-5` at the assumed demo volume), and everything Unverified are in [the decision record](06-llm-provider.md). Synthetic data only in the MVP (O-03). | The pinned identifier, strict schema output, and the no-training clause of the pages opened. No page opened showed Vietnamese quality, rate limits, or availability. The author of this record is a Claude model, which is disclosed there. | Call, awaiting user review |
| D-182 | **Sync lock.** One ERP sync for an entity at a time: the sync takes a transaction-level advisory lock (`pg_try_advisory_xact_lock`) on a key made of a sync constant and the entity id; a second run ends at once with a logged skip. Upserts are by `(entity_id, erp_ref)`. The function name is from general knowledge and is Unverified. | Answers the Step 5 item "a second run waits for the first (advisory lock, Step 7)". A skip is simpler than a wait and the next interval retries. | Call, awaiting user review |
| D-183 | **Simulated feeds are seed files.** The simulated mailbox of an entity is a folder of message files read by `SimulatedMailboxAdapter`; the simulated tax-risk list is a file (D-49); `SimulatedMailerAdapter` marks a request sent and delivers nothing. The demo seed loader copies them into place. | D-49 keeps master data as seed files, and Step 5 has no table for mailbox content (the body and the non-XML bytes are not stored, D-122). | Call, awaiting user review |
| D-184 | **Database roles and group-level reads.** Three roles: an owner for migrations, the application role (used by `api` and `worker`, no `BYPASSRLS`), and a read role for aggregate functions. The Group Admin's counts and rates (DF-23, AC-06.9, AC-27.7) come from `SECURITY DEFINER` functions that return numbers only. Rows with a NULL `entity_id` (`users` of the group, `audit_log` group events) have a policy branch for group scope. | Row-level security would otherwise stop the group figures; the functions give them without a read path to rows. | Call, awaiting user review |
| D-185 | **One owner module for each table.** The module named in the catalog is the only one whose code inserts or updates the table; others call its interface. Every one of the 74 tables has one owner in [C3](03-component.md#component-catalog). | Keeps the modular monolith splittable and gives a rule that a reviewer can check. | Call, awaiting user review |
| D-186 | **Prompt and schema versions are named files** kept with the code, one pair per LLM task. The gateway stores the model identifier and the prompt version in `ai_requests` and in the result tables. | BR-12 needs the version of the prompt to explain an old decision, and a reversal of D-181 needs prompts that are not hidden in code. | Call, awaiting user review |

## Defaults pending confirmation

Values that no earlier step fixes. Change any without changing the structure.

| ID | Default | Status |
|---|---|---|
| DF-89 | **Reminder time.** The daily reminder job runs at 07:00 in the server time zone `Asia/Ho_Chi_Minh` (D-138). | Default, pending confirmation |
| DF-90 | **Job queue.** A claimed job holds a lease of 300 seconds; a failed job is tried at most 3 times with 30 seconds between tries. The ERP send keeps its own rule of 3 attempts 5 minutes apart (DF-24). | Default, pending confirmation |
| DF-91 | **LLM answer size.** At most 1,000 output tokens for each call, and the lowest randomness the provider allows. | Default, pending confirmation |
| DF-92 | **Candidates.** The embedding search returns 5 candidate items for a line (Step 1 says 3 to 5). | Default, pending confirmation |
| DF-93 | **Call-and-wait.** The API waits up to 25 seconds for the result of a job that backs a synchronous operation (D-169); the LLM timeout inside it stays 20 seconds (DF-08). | Default, pending confirmation |

## Items deferred to Step 7 and their answers

Every place that defers something to Step 7 (found with a search for "Step 7" in the repository) is answered here.

| # | Where it was deferred | The question | Answer |
|---|---|---|---|
| 1 | Step 3 DF-34, routes page | Router mode: history or hash | History mode; the proxy returns `index.html` for unknown paths (D-166) |
| 2 | Step 5 D-47, DBML header | Confirm PostgreSQL | PostgreSQL 16 with pgvector (D-168) |
| 3 | Step 5 D-48, data model "Entity isolation" item 4 | Row-level security as a second layer | Yes, keyed on `app.entity_id`, forced on the owner (D-172, D-184) |
| 4 | Step 5 D-49, handoff | Place the `sim_*` tables in a separate schema or service | Schema `sim` in the same database and the same codebase (D-171) |
| 5 | Step 5 data model "Concurrency" | The advisory lock for a second sync run | Transaction-level advisory lock, skip on conflict (D-182) |
| 6 | Step 5 D-57 and data model "Not modelled" | XML bytes in PostgreSQL or file storage | `bytea`, 10 MB limit (D-173) |
| 7 | Step 5 DF-81, DBML note on `cancellation_notices` | The same for the cancellation notice | `bytea`, 10 MB limit (D-173) |
| 8 | Step 5 DF-55, data model "Not modelled", DBML note on `mailbox_messages` | Server configuration: thresholds, intervals, retry counts, timeouts, the mailbox address, fetch interval, and lookup timeout | Environment plus one YAML file; the list with defaults is in the tech stack (D-174) |
| 9 | Step 5 data model "Not modelled", Step 6 D-131 and difference 2 | Where login sessions are stored; password reset | `platform.sessions` (D-175). Password reset is not designed: no story asks for it |
| 10 | Step 6 DF-87 and gap 4 | The short-lived key store for idempotency, including `releaseBatch` | `platform.idempotency_keys`, 24 hours (D-175) |
| 11 | Step 6 README "Authentication" | How the cookie is configured in a deployment | HttpOnly, Secure, SameSite=Strict, set by the API behind the TLS proxy ([security notes](07-runtime-and-deployment.md#security-notes)). The browser behaviour of the flags stays Unverified |
| 12 | Step 6 D-143 and README "What the contract does not cover" | The link from MatchPay to an ERP, the mailbox, the status feed, the Email Service, and the LLM | Four ports and an `LlmPort` with simulated adapters in the demo (D-171, D-179) |
| 13 | Step 6 DF-88 | Where the rate-limit counters live | `platform.rate_limit_counters` (D-170) |
| 14 | Step 1 stakeholders, O-03, R-11 | The LLM provider | Recommendation in D-181 and the [record](06-llm-provider.md); O-03 stays "synthetic data only" |
| 15 | Step 1 brief, AI architecture | Which embedding model | Local open model, default `BAAI/bge-m3` (D-180) |

## Differences from Steps 1 to 6

Each row says what the source says, what Step 7 does, and why. None changes a requirement.

| # | What the source says | What Step 7 does | Why |
|---|---|---|---|
| 1 | Step 5 (74 tables, D-47): the database has the tables of `matchpay.dbml`; sessions are "not modelled" | Four more tables exist in the schema `platform` and are not in the DBML or the ER diagrams (D-170) | They are infrastructure, not business facts. The 74 tables and the checker's DBML comparison stay as they are |
| 2 | Step 5 D-49: the `sim_*` tables are in the schema of the DBML | They are created in the schema `sim` by the migration (D-171); the DBML is not edited | D-49 left the placement to Step 7 |
| 3 | Step 5 D-48: row-level security "recommended" | It is decided: on every table with `entity_id` (D-172) | Step 5 left the decision to this step |
| 4 | Step 6: `draftCorrectionRequest` and `sendCorrectionRequest` answer at once | They stay synchronous for the caller, but the API waits for a job that the Worker runs (D-169) | The LLM key and every outside connection stay in the Worker |
| 5 | Step 6 jobs table listed eight jobs | Step 7 added two call-and-wait jobs, the draft and the send of a request, to that table and to the operation descriptions of Step 6 (still a draft); the API starts and awaits them (D-169) | They back the two synchronous operations |
| 6 | Step 1 and the brief: embedding is a multilingual vector model | It is a local model, so the embedding call does not leave the deployment (D-180) | Cost, privacy, and speed. The brief's open question on "LLM through an API or on own servers" (O-03) is answered for the LLM only |
| 7 | Step 5 `ai_requests` note: "one row per embedding or LLM call, for time and cost" | A local embedding call still writes a row, with no token counts and no cost | The row measures time (G-05) |

## Gaps found in approved steps

Approved steps were not edited. Each gap names the step and what would close it.

1. **No vector storage in the schema (Step 5).** `matchpay.dbml` has no column or table for item embeddings, so the candidate search of AC-14.2 has nowhere to read. Closing it: a table `erp_item_embeddings` added in Step 8 or 9, with a migration, and a note in the Step 5 data model. The DBML is approved, so the user decides whether Step 5 is reopened for it or the migration adds it.
2. **No way to put a message into the simulated mailbox (Steps 3 and 4).** The simulated mailbox is a folder of seed files (D-183); no screen or operation lets a demo add a message at run time, so "Fetch now" can show only the seeded messages. This is the same kind of gap as the simulated status feed in Step 6 gap 1.
3. **Row-level security and the group-wide unique index (Step 5).** The exact-duplicate check relies on a unique index that sees every entity (D-51). The PostgreSQL page opened says that referential integrity checks bypass row security; it says nothing about unique indexes. That a duplicate in another entity is still detected is Unverified and is a Step 9 test.
4. **Rows with a NULL entity (Step 5).** `users` and `audit_log` may have a NULL `entity_id`; the policy needs a group-scope branch (D-184). Step 5 does not say who may read those rows besides the Group Admin's listed events.
5. **Unverified standards from Step 6 remain.** RFC 7807 and the cookie flags were not opened in this step either.
6. **Resource size of the embedding model (Step 1).** The model cards opened do not state the size of the files or the memory needed, so the size of the Worker image and the host is Unverified.

## Doubts for the user

- **The LLM provider (D-181).** The author of the recommendation is a Claude model. The Vietnamese quality of every candidate is Unverified. Do you want the choice made only after ES-03 and a Vietnamese reader have compared the candidates?
- **The LLM key and the call-and-wait (D-169).** Keeping the key only in the Worker costs a wait on two operations. If you prefer a simpler API that calls the LLM and the Email Service itself, the key goes to both processes.
- **The embedding model (D-180).** Which of the two models, or a different one, after the Vietnamese test.
- **A new table for vectors (gap 1).** Should Step 5 be reopened, or may the migration add it?
- **The stack (D-167).** Python for the whole backend is a call made because of the AI part. A team that prefers another language would split the AI part into a second service.
- **A queue in PostgreSQL (D-169)** is simple and right for the demo volume; it is not a design for high volume.
- **Caddy or nginx (D-176).** The documentation of neither was opened.

**Related:** [Step index](README.md) · [Step 6 decisions](../06-api/00-decisions.md) · [Step 5 decisions](../05-database/00-decisions.md) · [Step 3 decisions](../03-information-architecture/00-decisions.md)
