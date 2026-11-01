# 06 — API

> Design status: MVP — Step 6 of 9, draft for review
>
> Implementation status: NOT STARTED

Step 6 turns the [user stories and acceptance criteria](../02-usecases-userstories/README.md), the [screens](../03-information-architecture/README.md), and the [database schema](../05-database/README.md) into one HTTP contract for the web application. The OpenAPI 3.0.4 document has 121 operations on 104 paths in 24 tags, and it is the source of truth for paths, bodies, roles, and errors (D-130). Every operation names the stories, business rules, screens, and tables it serves (`x-stories`, `x-rules`, `x-screens`, `x-tables`), so the cross-check in [API traceability](01-api-traceability.md) can show that every active user story has an operation and every operation uses tables of the schema. Work that is not HTTP (the AI checks, the ERP sync, the mailbox fetch, the status lookups, the ERP send, the reminders) is described as jobs there. This step also fills the API operationId column of the [master traceability matrix](../traceability/master-traceability.md) and the Related API lines of the [business rules](../requirements/business-rules.md). Every decision of this step is a call that awaits the user's review.

| File | Content |
|---|---|
| [00-decisions.md](00-decisions.md) | Decisions D-130..D-164 and defaults DF-83..DF-88, all awaiting review; differences from Steps 1 to 5; gaps found in approved steps; doubts for the user |
| [openapi.yaml](openapi.yaml) | The OpenAPI 3.0.4 contract: 24 tags, 121 operations, shared error responses, and the schemas, with sample data of the fictional Calderwood Group |
| [01-api-traceability.md](01-api-traceability.md) | The cross-check: stories and operations, the operations table, tables and operations, background jobs, business rules, screens, and acceptance criteria |

**Related:** [README](../../README.md) · [Previous: Database](../05-database/README.md) · [Next: Architecture](../07-architecture/README.md) · [Master traceability](../traceability/master-traceability.md)

## API conventions

These conventions apply to every operation. The reasons are in the [decisions](00-decisions.md).

### Base URL

`/api/v1`, relative to the deployment host. There is one API, for the web application only; there is no public partner API in the MVP (D-130). Operations of the ERP simulator live under `/demo/erp-simulator/` (D-143).

### Authentication

`POST /auth/login` checks the email and the password and starts a session that is kept on the server. The response sets an opaque session id in the cookie `mp_session` (HttpOnly, Secure, SameSite=Strict) and returns a CSRF token. Every state-changing request (POST, PUT, PATCH, DELETE) must also send the header `X-CSRF-Token` with that token. The security schemes are `sessionCookie` and `csrfHeader` (D-131).

- The server refuses the next request of a deactivated user, so open sessions end at once (AC-02.5).
- A session ends after 30 minutes without a request, or 12 hours after login (DF-84). An ended session gives 401 `AUTH_SESSION_EXPIRED`, and the client goes to the login page (AC-01.4).
- A wrong password when signing gives 401 `AUTH_INVALID_CREDENTIALS` and signs nothing (D-153). The client tells it apart from an ended session by `errorCode`.
- Where the session is stored and how the cookie is configured in a deployment is decided in Step 7. The browser behaviour of the cookie flags is Unverified here; a reading of the cookie specification (RFC 6265bis) would confirm it.

### Content types

- `application/json` for request and success bodies.
- `application/problem+json` for errors.
- `multipart/form-data` for the XML upload (`uploadInvoices`) and the cancellation notice (`recordCancellationNotice`).
- `application/xml` and `application/octet-stream` for the two file downloads. Both send the header `X-Content-SHA256` with the hash of the stored bytes (D-141, D-157).

### Dates, times, and money

- Dates are `YYYY-MM-DD`. Date-times are ISO 8601 with an offset, for example `2026-10-31T09:15:00+07:00`. Periods (the batch month, the dashboard month) use the server time zone `Asia/Ho_Chi_Minh` (D-138).
- Money is a decimal string in VND, for example `"70050000.00"`, never a JSON number. Quantities, prices per unit, rates, tolerances, probabilities, and percentages are decimal strings too (D-138).
- A field that has no value may be `null` or absent; the examples omit it.

### Pagination

Lists take `page` (one-based, default 1) and `pageSize` (default 25, at most 100) and return `{ "items": [...], "meta": { "page", "pageSize", "totalItems", "totalPages" } }` (D-140, DF-83). The invoice worklist sends `pageSize=50` (DF-68). An empty list returns 200 with `items: []`. A few short lists (sectors, templates, the attempts of one request) return `{ "items": [...] }` without `meta` (D-160). Search and filters are query parameters that match the query string of SCR-10 (the saved-view tabs of the interface are filter presets in the client, not API objects).

### Entity scope

The entity comes from the session, never from a path or a body (D-132, D-13, BR-09). No path carries an entity code. An identifier that the caller's scope cannot see gives 403 `ACCESS_DENIED` with no data, **whether or not the record exists in another entity**, so identifiers cannot be probed across entities (AC-01.5). The only places that name an entity are those of roles that belong to the group, not to one entity: the Group Admin on the user and ERP-user operations (D-147), and the Demo Operator on the simulator operations (`entityId` query parameter or body field). The Group Admin never gets invoice-level data of an entity, only counts and rates (DF-23).

### Roles and extensions

`x-roles` on an operation lists values of the DBML enum `user_role` only: `AP_ACCOUNTANT`, `CHIEF_ACCOUNTANT`, `PAYMENT_APPROVER`, `REQUESTING_DEPARTMENT`, `ENTITY_ADMIN`, `GROUP_ADMIN`, `DEMO_OPERATOR`. The login operation is public and has an empty list. Finer rules (own entity, own approval level, own delegation, separation of duties BR-02 and BR-36) are in the description of the operation and in `x-rules`. The server enforces everything; a hidden control in the interface is for convenience only (D-133).

| Extension | Content |
|---|---|
| `x-roles` | Roles allowed to call the operation |
| `x-stories` | User stories served (at least one) |
| `x-rules` | Business rules enforced. BR-09 and BR-12 apply to every operation and are listed only where an acceptance criterion cites them (D-156) |
| `x-screens` | Screens that use the result. Empty only for a system operation |
| `x-tables` | Database tables the operation reads or writes (at least one) |
| `x-criteria` | Acceptance criteria that the operation serves |
| `x-dbml-enum` | On an enum schema: the DBML enum whose values it repeats |

### Errors

Errors use RFC 7807 Problem Details with the content type `application/problem+json` (D-139). The field names `type`, `title`, `status`, `detail`, and `instance` are taken from memory of that standard and are Unverified; reading RFC 7807 (now replaced by RFC 9457) would confirm them. MatchPay adds `errorCode` (stable, for programs), `traceId` (for the server log), and `errors` (field name to messages, for validation). `detail` is for people; do not branch on it.

| errorCode | HTTP | When |
|---|---|---|
| `AUTH_INVALID_CREDENTIALS` | 401 | Wrong email or password at login (the same answer for both, AC-01.2), or a wrong password when signing |
| `AUTH_ACCOUNT_DEACTIVATED` | 403 | Right credentials, deactivated account (AC-01.3, D-146) |
| `AUTH_SESSION_EXPIRED` | 401 | No session, or the session ended |
| `ACCESS_DENIED` | 403 | The role may not call the operation, the record is outside the caller's scope, or the CSRF token is missing. Written to the audit log (AC-01.8) |
| `SEPARATION_OF_DUTIES` | 403 | BR-02 or BR-36 blocks the actor; `context.invoiceId` names the invoice |
| `VALIDATION_FAILED` | 422 | Invalid body or query, including a duplicate email, tax code, or profile (D-146) |
| `RULE_LIMIT_EXCEEDED` | 422 | A value above a group limit (BR-16) |
| `FILE_REJECTED` | 422 | An unusable upload: no file part, too many files (`rejectionReason`) |
| `RESOURCE_NOT_FOUND` | 404 | Only for lookups with no scope: the demo routes when the demo flag is off |
| `VERSION_CONFLICT` | 409 | The record changed since it was read; `current` holds the current record |
| `STATE_CONFLICT` | 409 | The lifecycle transition is not allowed from the current state; `detail` cites the BR-33, BR-34, or BR-35 transition |
| `DEPENDENCY_UNAVAILABLE` | 503 | The ERP, the mailbox, the status lookup, the Email Service, or the LLM does not answer |
| `RATE_LIMITED` | 429 | Too many requests (DF-88); `Retry-After` gives the seconds |
| `INTERNAL_ERROR` | 500 | Unexpected error, including an audit entry that could not be written (DF-30) |

A file that is not an XML invoice is not an HTTP error: the upload returns 202 with one result per file (D-159).

### Concurrency

A record with a `version` column (invoices, exceptions, batches, payment requests, and the configuration objects of D-56) takes `version` in the body of an action. A stale version gives 409 `VERSION_CONFLICT` with the current record, nothing is saved, and the user is asked to reload (BR-37, D-136). A signature is bound to the request version and its content hash.

### Idempotency

Signing (`signPaymentRequests`), batch release (`releaseBatch`), and the resend to the ERP (`resendToErp`) take the header `Idempotency-Key`, a UUID chosen by the client. A repeat with the same key returns the first result and does nothing twice (D-137, DF-87). Signing many requests in one action returns one result per request, signed or refused with its reason, never a silent partial success. The send to the ERP also uses the payment request number as its own key (DF-24).

### Background work

The AI checks (UC-12 to UC-16), the scheduled ERP sync, the mailbox fetch, the status lookups, the reminders, and the ERP send run as server jobs, not as HTTP calls (D-135). An operation that starts a job returns 202 with a run id, and the result is read with a GET operation (D-145). The list of jobs and the tables they write is in [API traceability](01-api-traceability.md#4-background-jobs).

### Audit

No operation writes the audit log directly. Every state-changing operation appends to `audit_log` in the same transaction, and if the entry cannot be written the action does not complete (D-144). The audit list is read-only and has no edit or delete operation.

## Sample cURL calls

The host and the sample people are fictional. `$TOKEN` is the `csrfToken` returned by login; the cookie jar keeps `mp_session`.

### Log in

```bash
curl --request POST \
  --url https://matchpay.example/api/v1/auth/login \
  --header "Content-Type: application/json" \
  --cookie-jar cookies.txt \
  --data '{
    "email": "alice@calderwood-foods.example",
    "password": "ExamplePassword123!"
  }'
```

### Upload XML invoices

```bash
curl --request POST \
  --url https://matchpay.example/api/v1/invoices/uploads \
  --cookie cookies.txt \
  --header "X-CSRF-Token: $TOKEN" \
  --form "files=@C26TAA-0000123.xml;type=application/xml" \
  --form "files=@C26TAA-0000124.xml;type=application/xml"
```

The answer is 202 with one result per file. A PDF in the same request is rejected with its reason and the XML files are still processed (AC-10.8, AC-10.10).

### Sign payment requests

```bash
curl --request POST \
  --url https://matchpay.example/api/v1/payment-requests/sign \
  --cookie cookies.txt \
  --header "X-CSRF-Token: $TOKEN" \
  --header "Idempotency-Key: 5b0b3c1e-6c3b-4f65-9a31-0d6c8c8f1a11" \
  --header "Content-Type: application/json" \
  --data '{
    "requests": [
      { "requestId": 311, "version": 1 },
      { "requestId": 312, "version": 1 }
    ],
    "password": "correct horse battery"
  }'
```

## View and validate

Paste `openapi.yaml` into Swagger Editor, or serve it with Swagger UI or ReDoc. Validate it locally (needs Node.js):

```bash
npx @redocly/cli lint docs/06-api/openapi.yaml
```

The lint reports no errors and no warnings. The repository root `redocly.yaml` extends the recommended rules and turns off only `info-license`, because the project has not declared a license yet. The documentation checker reads the contract too:

```bash
python -X utf8 tools/check_docs.py
```

Its Step 6 section parses the YAML, checks the extensions of every operation against the DBML, the user stories, the business rules, and the screen inventory, resolves every `$ref`, compares the enums marked `x-dbml-enum` with the DBML, and compares the matrix, the business rules, and [API traceability](01-api-traceability.md) with the contract.

## What the contract does not cover

- Where sessions, idempotency keys, and the XML bytes are stored, and the server configuration (intervals, retry counts, timeouts): answered in Step 7 (draft for review), see the [deferred items](../07-architecture/00-decisions.md#items-deferred-to-step-7-and-their-answers).
- The link from MatchPay to an ERP, the mailbox, the status feed, the Email Service, and the LLM. These are server-side ports, not operations of this contract (D-143).
- A public or partner API, a webhook, a bank connection, password reset, and any PDF or foreign-invoice intake: not in the MVP (D-130, D-33, W-19).
