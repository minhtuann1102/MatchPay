# Tech Stack

> Design status: MVP — draft for review
>
> Implementation status: NOT STARTED

**Purpose:** list the technology for each layer, why it was chosen, and what else was considered. Versions are given as a major line only; a page opened in this document set gives a version only where the table says so. All choices are calls awaiting the user's review (D-166 to D-178). **Unverified for every library row:** the documentation of FastAPI, SQLAlchemy, Alembic, Pydantic, React, Vite, TanStack Query, openapi-typescript, Schemathesis, Playwright, Caddy, and Docker Compose was not opened in this document set; the choices come from the team's usual practice for such a project, and the implementation pins exact versions in lock files and checks that they work together.

## Stack by layer

| Layer | Choice | Version line | Why | Alternatives considered |
|---|---|---|---|---|
| Web application | React, TypeScript, Vite; React Router in history mode; TanStack Query for server state; Ant Design 5 for components (call, awaiting the user's review; the prototype uses it, D-205 and D-206) | React 18 or later (Unverified) | One language across the screens; types generated from the contract keep the 121 operations and the screens in step. History mode gives the clean routes of the information architecture and needs the proxy to return `index.html` for unknown paths (closes DF-34) | Hash-mode routing (works with no proxy rule, but the routes of the information architecture would carry `#`); Next.js (a server runtime the project does not need) |
| API types | `openapi-typescript` run on `docs/06-api/openapi.yaml` | Unverified | The hand-written contract is the source of truth (D-130); the build fails when a screen uses a field that is gone | Hand-written types; a generated client with runtime code |
| Styling | CSS written from the UI/UX tokens in `wireframes/assets/wireframe.css` (D-44) | Not applicable | The wireframes and the application share one design language ("three hands": dotted rail for AI, double rail for the Rule Engine, solid rail for a person) | A component library with its own look |
| Backend language and framework | Python, FastAPI, Pydantic v2 | Python 3.12 | The AI part (embeddings, scikit-learn logistic regression for the signal fusion, `lxml` and `signxml` for the XML signature check) lives in the same language as the API, so there is no second service. Pydantic validates requests and the LLM answers with one tool | Node.js with TypeScript (a second language for the AI part); Java or .NET (heavier for a demo MVP, no advantage for the AI part) |
| Contract handling | Contract first: `openapi.yaml` is written by hand; a Schemathesis contract test compares the running API with it; FastAPI's generated schema is not published (D-130, D-167) | Unverified | The 121-operation contract carries `x-` traceability that a generated schema would lose | Code first with the generated schema as the contract |
| ORM and migrations | SQLAlchemy 2; Alembic migrations written to match `matchpay.dbml` | SQLAlchemy 2 | Composite foreign keys, partial indexes, the exclusion constraint, the trigger, and row-level security of the data model are SQL features that migrations write by hand (Database "Not modelled") | Raw SQL files only; another ORM |
| Database | PostgreSQL with the pgvector extension | PostgreSQL 16 (confirms D-47). pgvector: the README says it supports Postgres 13 and later and lists Docker tags for 13 to 18 | The schema needs partial unique indexes, exclusion constraints, `bytea`, `jsonb`, and row-level security. pgvector stores item embeddings and finds the closest ones with the cosine operator `<=>` and an HNSW or IVFFlat index; an indexed `vector` column holds up to 2,000 dimensions, and both embedding candidates produce 1,024 | A separate vector database (a second store to run and to keep in step); a SQL Server or MySQL database (missing features) |
| Jobs | A queue in the table `platform.jobs`; a worker claims a row with `SELECT ... FOR UPDATE SKIP LOCKED`; no Redis | Not applicable | A job is inserted in the same transaction as the change that causes it, so a committed change never loses its job, and there is no second system to run. The PostgreSQL page says `SKIP LOCKED` "can be used to avoid lock contention with multiple consumers accessing a queue-like table" | Redis with a queue library (loses the single transaction); Celery (needs a broker) |
| Sessions and keys | Tables in schema `platform`: `sessions`, `idempotency_keys`, `rate_limit_counters` | Not applicable | AC-02.5 asks that a deactivated user's next request is refused, which needs a server-side list (D-131). The same database keeps the idempotency keys for 24 hours (DF-87) | Redis; signed tokens (cannot end a session at once) |
| Authentication | Server-side session in `platform.sessions`; cookie `mp_session` (HttpOnly, Secure, SameSite=Strict); CSRF header `X-CSRF-Token`; Argon2id password hashes | Argon2id | Matches D-131. The browser behaviour of the cookie flags is Unverified: the cookie specification (RFC 6265bis) would confirm it. Argon2id parameters are Unverified: the password storage guidance of OWASP would confirm them | bcrypt; JWT in local storage |
| Entity isolation | Server filter on `entity_id` from the session, plus PostgreSQL row-level security keyed on `app.entity_id` | Not applicable | See [the answer below](#answers-to-the-deferred-items) | The filter alone |
| Files | `bytea` in PostgreSQL for the XML original and the cancellation notice, 10 MB limit each | Not applicable | The hash and the bytes stay in one transaction (D-57). Object storage is future work | Object storage or a file system volume |
| Embeddings | A local open multilingual model inside the Worker: default `BAAI/bge-m3`, alternative `intfloat/multilingual-e5-large` (D-180) | Not applicable | See [Embedding model](#embedding-model) | A hosted embedding API (a call per line leaves the deployment) |
| LLM | A hosted API behind `LlmPort`: primary `claude-sonnet-5-5`, fallback `gpt-6.1-terra` (D-181) | See the [record](06-llm-provider.md) | The record gives the evidence and the cost estimate | Self-hosted open-weight model |
| Signal fusion | scikit-learn logistic regression, trained on the labelled set ES-03 and stored with a version (BR-28) | Unverified | The brief's model; small, explainable, and calibrated | A gradient-boosted model (harder to explain) |
| XML signature check | `lxml` and `signxml` | Unverified | Verifies the seller's signature (BR-17) in the language of the API | Calling an external tool |
| Reverse proxy | Caddy serves the built web files and forwards `/api/v1` | Unverified | One small image; the rule "unknown path returns `index.html`" is one line | nginx (equal; the repository should pick one) |
| Deployment | Docker Compose: `proxy`, `api`, `worker`, `postgres` | Unverified | One environment for the demo (D-176) | Kubernetes (more than a demo needs) |
| Tests | pytest; Schemathesis contract tests; Playwright end-to-end tests on the information architecture flows; the evaluation sets ES-01 to ES-04 and the permission suite TS-01 as a separate command | Unverified | Each test kind answers a named acceptance criterion (D-177) | Manual testing |
| Logs | Structured JSON logs carrying `traceId`; one line for each AI call that mirrors `ai_requests` | Not applicable | The `traceId` is the same as in Problem Details (D-139, D-178) | A hosted log service |

## Embedding model

Two candidates were read on their model cards on 2026-11-01.

| | `BAAI/bge-m3` | `intfloat/multilingual-e5-large` |
|---|---|---|
| Source | https://huggingface.co/BAAI/bge-m3 | https://huggingface.co/intfloat/multilingual-e5-large |
| Languages | "More than 100 working languages"; Vietnamese is not named on the page | 100 languages inherited from XLM-RoBERTa (the metadata lists 94); Vietnamese is not named; quality may drop for low-resource languages |
| Embedding size | 1,024 | 1,024 |
| Input length | 8,192 tokens | 512 tokens, longer text is cut |
| License | MIT | MIT |
| Size | Not stated on the page | About 0.6 billion parameters |
| Special input | None stated | Needs the prefix `query: ` or `passage: `, even for non-English text; skipping it loses quality |

Both give 1,024 numbers per text, which fits a pgvector column that can be indexed (up to 2,000). Item names are short, so the input length does not decide. **Default `bge-m3`**, because it needs no prefix, which removes one way to get a wrong result; **the choice is open until ES-03 runs both models on the Vietnamese lines**, because neither page names Vietnamese and neither gives a Vietnamese score (Unverified). The gap this leaves in the schema is in the [decisions](00-decisions.md#gaps-found-in-approved-documents).

## Server configuration

Environment variables hold secrets and deployment facts. One versioned YAML file per deployment (`config/<deployment>.yaml`) holds every other setting and is read once at start by the API and the Worker. The file is checked in for the demo; a production file would not carry secrets. A change takes effect at the next restart. No setting has a screen, which keeps information architecture unchanged (DF-55).

**Environment variables:** `MATCHPAY_DATABASE_URL`, `MATCHPAY_LLM_API_KEY` (Worker only), `MATCHPAY_SESSION_SECRET`, `MATCHPAY_DEMO_MODE` (default off, D-143), `MATCHPAY_CONFIG_FILE`.

**YAML settings and defaults.** Every setting that a database or API document defers to configuration is here.

| Setting | Default | Source |
|---|---|---|
| `sync.interval_minutes` | 15 | DF-31 |
| `mailbox.fetch_interval_minutes` | 15 | DF-63 |
| `mailbox.address` per entity | For example invoices-foods@calderwood.example | DF-55, D-122 |
| `mailbox.max_attachment_mb` | 10 | DF-79, DF-22 |
| `authority.lookup_timeout_seconds` | 10 | DF-64 |
| `llm.timeout_seconds` | 20 | DF-08 |
| `llm.provider`, `llm.model` | `anthropic`, `claude-sonnet-5-5` | D-181 |
| `llm.max_output_tokens` | 1,000 | DF-91 |
| `embedding.model`, `embedding.candidates` | `BAAI/bge-m3`, 5 | D-180, DF-92 |
| `erp_send.max_attempts`, `erp_send.retry_minutes` | 3, 5 | DF-24 |
| `matching.match_threshold`, `matching.llm_threshold` | 0.90, 0.50 | DF-15 |
| `gates.accuracy_threshold_pct` | 98 | DF-11, DF-16 |
| `gates.min_compared_invoices` | 50 | DF-16 |
| `gates.alert_min_sampled`, `gates.alert_window_days` | 20, 30 | DF-16 |
| `gates.alert_error_limit_pct` | 2 | DF-16 |
| `anomaly.near_duplicate_window_days` | 3 | DF-19 |
| `anomaly.split_order_window_days` | 7 | DF-11 |
| `anomaly.price_window_months`, `anomaly.price_min_purchases`, `anomaly.price_deviation_pct` | 6, 3, 20 | DF-11, DF-20 |
| `anomaly.recurring_deviation_pct` | 30 | DF-11 |
| `worklist.due_soon_days` | 7 | DF-18 |
| `corrections.reply_deadline_working_days` | 5 | DF-21 |
| `reminders.run_at` | 07:00 Asia/Ho_Chi_Minh | DF-89 |
| `auth.password_min_length` | 8 | DF-32 |
| `session.idle_minutes`, `session.absolute_hours` | 30, 12 | DF-84 |
| `upload.max_files`, `upload.max_file_mb`, `upload.max_request_mb` | 20, 10, 200 | DF-85 |
| `signing.max_requests_per_action` | 50 | DF-86 |
| `idempotency.retention_hours` | 24 | DF-87 |
| `rate_limit.login_per_minute`, `rate_limit.default_per_minute` | 10, 600 | DF-88 |
| `jobs.lease_seconds`, `jobs.max_attempts`, `jobs.backoff_seconds` | 300, 3, 30 | DF-90 |
| `jobs.call_and_wait_seconds` | 25 | DF-93 |
| `demo.mailbox_folder`, `demo.tax_risk_feed_file` | Paths under the deployment | D-183 |

Values that the entity policy already stores (tolerance, approval thresholds, the sample rate, the grouping mode, the batch threshold) stay in `entity_policies`, not in this file.

## Answers to the deferred items

Each row answers a question that an earlier document left to the architecture. The full list with all sources is in the [decisions](00-decisions.md#items-deferred-to-the-architecture-and-their-answers).

| Item | Answer |
|---|---|
| Router mode (DF-34) | History mode; the proxy returns `index.html` for any path that is not a file or `/api` (D-166) |
| Row-level security (D-48, data model) | Yes, on every table with `entity_id`, keyed on `app.entity_id` set for each transaction with `SET LOCAL`, with `FORCE ROW LEVEL SECURITY` so that the table owner is also subject to the policy. The PostgreSQL page says table owners normally bypass it and superusers and `BYPASSRLS` roles always bypass it, so the application connects as a role that is neither. That `current_setting('app.entity_id', true)` returns NULL when unset, so the comparison hides every row, and that `SET LOCAL` lasts for one transaction, are not on the page and are Unverified; the documentation of those two would confirm them (D-172) |
| Sync advisory lock (data model) | `pg_try_advisory_xact_lock` on a key made of a sync constant and the entity id. A second run for the same entity ends at once with a logged skip. The function names come from general knowledge: the PostgreSQL page opened describes advisory locks but leaves the function list to another section, so the names are Unverified (D-182) |
| XML and notice storage (D-57, DF-81) | `bytea`, with a 10 MB limit; object storage is future work (D-173) |
| Server configuration (DF-55) | The table above (D-174) |
| `sim_*` placement (D-49) | Schema `sim`, same database (D-171) |
| Session store (D-131) | `platform.sessions` (D-175) |
| Idempotency store (DF-87) | `platform.idempotency_keys` (D-175) |
| Mailbox settings (DF-55, D-122) | `mailbox.*` in the YAML file; simulated messages are files in a folder per entity (D-183) |

## Sources opened

Opened on 2026-11-01.

| URL | What it said |
|---|---|
| https://huggingface.co/BAAI/bge-m3 | More than 100 working languages; 1,024 dimensions; 8,192-token input; MIT |
| https://huggingface.co/intfloat/multilingual-e5-large | 100 languages (metadata lists 94); 1,024 dimensions; 512-token input; MIT; about 0.6B parameters; needs `query: ` or `passage: ` prefix |
| https://github.com/pgvector/pgvector | HNSW and IVFFlat indexes; cosine operator `<=>` with `vector_cosine_ops`; indexed `vector` up to 2,000 dimensions; supports Postgres 13 and later |
| https://www.postgresql.org/docs/current/ddl-rowsecurity.html | Row security policies, default deny without a policy, owners and `BYPASSRLS` bypass, `FORCE ROW LEVEL SECURITY`. The page does not discuss `current_setting`; the use of a per-transaction setting is a standard pattern and is Unverified against the documentation |
| https://www.postgresql.org/docs/current/sql-select.html | `SKIP LOCKED` skips locked rows and "can be used to avoid lock contention with multiple consumers accessing a queue-like table" |
| https://www.postgresql.org/docs/current/explicit-locking.html | Advisory locks: session and transaction level, application-defined keys; the function names are in another section that was not opened |

The vendor pages for the LLM are listed in the [LLM provider record](06-llm-provider.md#sources-opened).

**Previous:** [Code level](04-code.md) · **Next:** [LLM provider](06-llm-provider.md).
