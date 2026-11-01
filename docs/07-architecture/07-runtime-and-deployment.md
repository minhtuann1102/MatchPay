# Runtime and Deployment

> Design status: MVP — Step 7 of 9, draft for review
>
> Implementation status: NOT STARTED

**Purpose:** show how the containers of [C2](02-container.md) work together at run time for three important paths, how the demo is deployed, and which security measures sit where. The deployment is one Docker Compose environment for the demo; production hardening (backups, high availability, monitoring service, secrets manager) is future work and is not designed here (D-176).

## (a) XML upload to the Rule Engine decision

The API stores the file and the invoice and inserts one `check_run` job for each accepted invoice in the same transaction. The Worker then runs the chain: authority status lookup, the AI steps, and the Rule Engine. A failure of any AI step becomes an exception and never blocks intake (DF-08, BR-27). Sources: AC-10.1 to AC-10.16, AC-12.5, AC-14.1 to AC-14.8, AC-16.1 to AC-16.15.

```mermaid
sequenceDiagram
    autonumber
    actor U as AP Accountant
    participant API as API
    participant DB as PostgreSQL
    participant W as Worker
    participant AS as Authority Status
    participant AI as AI Understanding
    participant EM as Embedding Service
    participant LG as LLM Gateway
    participant RE as Rule Engine

    U->>API: POST /invoices/uploads, XML files
    API->>API: check size, parse XML, check signature and buyer tax code
    API->>DB: insert invoice, original XML, and a check_run job in one transaction, plus the audit entry
    API-->>U: 202 with one result for each file
    W->>DB: claim the job with SKIP LOCKED
    W->>AS: look up the invoice key through AuthorityStatusPort
    AS-->>W: Valid, Adjusted, Replaced, Cancelled, or unavailable after 10 seconds
    W->>AI: run the check for the invoice
    AI->>AI: classify the flow and identify the entity and order from the XML fields
    opt fields are not enough
        AI->>LG: ask for the flow or the identification as JSON
        LG-->>AI: validated answer or a schema failure
    end
    loop each invoice line
        AI->>DB: look up the mapping table of the entity
        alt a confirmed pair exists
            DB-->>AI: item, no model call
        else no pair
            AI->>EM: embed the line text, find 3 to 5 candidate items
            EM-->>AI: candidates with similarity
            AI->>AI: signal fusion gives a probability
            opt probability from 0.50 to below 0.90
                AI->>LG: ask once for this line as JSON
                LG-->>AI: validated answer, then the probability is recomputed
            end
        end
    end
    AI->>AI: detect anomalies from history
    AI->>DB: store every output with its method, model version, and prompt version
    W->>RE: evaluate the six conditions from stored evidence
    RE->>DB: store the evaluation, admit to the batch or open an exception, write the audit entry
    W->>DB: mark the job done
```

Timing: G-05 asks for the 95th percentile from receipt to decision of at most 1 minute. The model calls are the slow part, so the 20-second timeout and the rule that most lines make no call are what keep that figure (G-07, DF-08).

## (b) Batch release, signing, and sending to the ERP, with a resend

`releaseBatch` and `signPaymentRequests` answer 200 because their records are saved inside the call (D-145). The summary and the send are jobs. Sources: AC-24.6, AC-25.1, AC-25.4, AC-25.11, AC-26.1 to AC-26.14, DF-24, D-67.

```mermaid
sequenceDiagram
    autonumber
    actor AP as AP Accountant
    actor CA as Chief Accountant
    actor PA as Payment Approver
    participant API as API
    participant DB as PostgreSQL
    participant W as Worker
    participant LG as LLM Gateway
    participant ER as ERP through ErpPort

    AP->>API: POST /batches/id/release with Idempotency-Key
    API->>DB: create the payment requests with their hashes, move the batch, add notifications and the audit entry
    API->>DB: insert an ai_payment_summary job for each request
    API-->>AP: 200
    W->>DB: claim a summary job
    W->>LG: ask for the summary as JSON
    LG-->>W: validated summary or a failure
    W->>DB: store the summary labelled AI, or none if it failed
    CA->>API: POST /payment-requests/sign with password
    API->>DB: signature and state change in a transaction for each request
    API-->>CA: 200 with a result for each request
    PA->>API: POST /payment-requests/sign with password
    API->>DB: second signature, the request is Signed, insert an erp_send job in the same transaction
    API-->>PA: 200
    W->>DB: claim the erp_send job
    W->>ER: send the request, the request number is the idempotency key
    alt the ERP accepts
        ER-->>W: payment reference
        W->>DB: record the attempt, the Sent state, and later the Paid state with the reference
    else the ERP fails
        ER-->>W: failure
        W->>DB: record the attempt, schedule the next one 5 minutes later, up to 3 attempts
        W->>DB: after the third failure keep the request Sent, record erp_failed_at, add a notification
        AP->>API: POST /payment-requests/id/erp-resend with Idempotency-Key
        API->>DB: insert a new erp_send job and the audit entry
        API-->>AP: 202
        W->>ER: send again with the same request number
        ER-->>W: payment reference, and no second payment is created
        W->>DB: record the attempt and the Paid state
    end
```

## (c) Mailbox fetch

The scheduled fetch and "Fetch now" use the same job. A message is processed once (unique message identifier per entity), and an XML attachment goes through the same intake path as an upload (US-31, DF-63, DF-79).

```mermaid
sequenceDiagram
    autonumber
    actor AP as AP Accountant
    participant API as API
    participant DB as PostgreSQL
    participant W as Worker
    participant MB as Mailbox through MailboxPort
    participant IN as Invoice Intake

    Note over W,DB: Every 15 minutes the schedule inserts a fetch job for each entity
    AP->>API: POST /mailbox/fetch-runs
    API->>DB: insert a fetch job and the audit entry
    API-->>AP: 202 with the run id
    W->>DB: claim the job, write a fetch run row
    W->>MB: list messages not yet processed
    alt the mailbox does not answer
        MB-->>W: failure
        W->>DB: record the failed run with its reason
    else messages arrive
        MB-->>W: messages with attachments
        loop each message
            W->>DB: skip it if the identifier is already processed, else write the message as PENDING
            loop each attachment
                alt larger than 10 MB
                    W->>DB: record REJECTED_TOO_LARGE without the bytes
                else not XML
                    W->>DB: record the rejection, keep no bytes
                else XML
                    W->>IN: accept the file as source EMAIL
                    IN->>DB: duplicate check, store invoice and original, insert a check_run job
                end
            end
            W->>DB: mark the message processed
        end
        W->>DB: record the run as successful with its time
    end
```

## Deployment for the demo

One host runs Docker Compose with four services. Only the proxy publishes a port. The Worker is the only service allowed to reach the internet, for the LLM call; the simulated ERP, status service, mailbox, and Email Service are code and files inside the deployment, so no outside system is needed to run the demo except the LLM Provider (D-171, D-183).

```mermaid
flowchart TB
    browser(["👤 Browser"])
    llmext(["LLM Provider<br/><i>[External System]</i>"])

    subgraph host["Demo host [Docker Compose]"]
        direction TB
        subgraph edgenet["Public network"]
            proxy["proxy<br/><i>[Caddy]</i><br/>port 443, static web files, /api forwarded"]
        end
        subgraph internal["Internal network"]
            api["api<br/><i>[Python image, command: api]</i><br/>no outside access"]
            worker["worker<br/><i>[same image, command: worker]</i><br/>outside access to the LLM only"]
            postgres[("postgres<br/><i>[PostgreSQL 16 with pgvector]</i>")]
        end
        vol1[("volume: database files")]
        vol2[("volume: embedding model files")]
        cfg["file: config/demo.yaml<br/>and the environment file"]
        seed["folder: demo seed files<br/>mailboxes and tax-risk feed"]
    end

    browser -- "HTTPS" --> proxy
    proxy --> api
    api --> postgres
    worker --> postgres
    worker -- "HTTPS" --> llmext
    postgres --- vol1
    worker --- vol2
    cfg -.-> api
    cfg -.-> worker
    seed -.-> worker

    style proxy fill:#3a7bd5,color:#fff
    style api fill:#1168bd,color:#fff
    style worker fill:#1168bd,color:#fff
    style postgres fill:#1168bd,color:#fff
    style llmext fill:#7b3fbf,color:#fff
    style host fill:#f8fbff,stroke:#1168bd,stroke-dasharray:5 5
```

| Service | Image and command | Notes |
|---|---|---|
| `proxy` | A Caddy image with the built web files | The only service with a published port. Redirects to HTTPS and sets the security headers |
| `api` | The backend image, command `api` | Runs a one-shot migration step first (Alembic) before it accepts requests. Has no key for the LLM |
| `worker` | The same image, command `worker` | Holds `MATCHPAY_LLM_API_KEY`, the embedding model files, and the seed folder. Starts the schedules (sync, mailbox, reminders) |
| `postgres` | PostgreSQL 16 with pgvector | A named volume. Three schemas: `public`, `sim`, `platform` |

A second environment, a production topology, backups, and scaling the Worker to several replicas are not designed. The job claim with `SKIP LOCKED` and the per-entity locks already allow more than one Worker (D-169, D-182), but this is not tested (Unverified).

## Security notes

| Topic | Design | Rule |
|---|---|---|
| Session cookie | `mp_session`: opaque id, HttpOnly, Secure, SameSite=Strict; the database keeps only a hash of the id; a new id is issued at login; idle limit 30 minutes, absolute limit 12 hours | D-131, DF-84 |
| CSRF | Every POST, PUT, PATCH, and DELETE must send `X-CSRF-Token`; a missing or wrong token is 403 `ACCESS_DENIED` | D-131 |
| Entity scope | The API adds the entity of the session to every query. PostgreSQL row-level security on `app.entity_id` is the second layer. The application connects as a role that is not the table owner and has no `BYPASSRLS`; the tables are set to `FORCE ROW LEVEL SECURITY` | BR-09, D-172 |
| Group-level reads | The Group Admin sees counts and rates through database functions that return numbers only, owned by a separate role; no query returns an invoice row of another entity | DF-23, D-184 |
| Audit | The application role has `INSERT` and `SELECT` on `audit_log`, and a trigger refuses `UPDATE` and `DELETE`; the entry is written in the action's transaction | D-55, DF-30, D-144 |
| Secrets | In environment variables: the database URL, the session secret, and the LLM key. The key exists only in the Worker's environment | D-174 |
| LLM data | Document text is passed as data in a delimited field; the answer must match a fixed schema; synthetic data only in the MVP; no document text or prompt is stored in `ai_requests` | BR-27, O-03, R-11 |
| Passwords | Argon2id hashes; a signing action asks for the password again; a wrong password is 401 and a `LOGIN_FAILED` entry | D-175, D-153 |
| Rate limits | Login 10 a minute for one email or address; 600 a minute for one session; counters in `platform.rate_limit_counters` | DF-88 |
| Uploads | At most 20 files, 10 MB each, 200 MB per request; the XML parser must not resolve external entities or fetch network resources. This setting is a standard measure that is not confirmed in the parser documentation (not opened), so it is Unverified and Step 9 tests it with a hostile file | DF-85, BR-17 |
| Logs | JSON lines with the `traceId`; no document text, no password, no session id | D-178 |
| Demo routes | `/demo/erp-simulator/...` answers 404 when `MATCHPAY_DEMO_MODE` is off | D-143 |

**Previous:** [LLM provider](06-llm-provider.md) · **Next:** [Step index](README.md).
