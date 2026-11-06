# MatchPay

MatchPay is a shared platform for a group of legal entities. AI reads each incoming invoice and checks it against its purchase order and goods receipt, and a Rule Engine admits the invoices that pass six conditions into a payment batch. Authorised people then sign consolidated payment requests per supplier, many in one action, and only exceptions are handled one by one. The MVP reads XML e-invoices; foreign invoices and the cash payment flag are Advanced. The goal is to pay the right amount, to the right entity, on time, without losing tax deductions.

## 1. Requirements — INVEST, Use Cases, and Acceptance Criteria

Requirements define what MatchPay must do, who uses it, the value delivered, and the observable conditions of success. User stories are reviewed with INVEST and mapped to use cases, business rules, and acceptance criteria.

### 1.1 Product mind map

![MatchPay feature mind map](docs/images/source/feature-mind-map.png)

The feature map F01–F12 is described in the [product mind map](docs/mindmap.md).

The research behind the requirements covers four problems (manual matching, inconsistent item names and units, risky suppliers and wrong-entity invoices, and payment approval without a matrix), seven measurable goals, the similar products, the regulatory context, and the risks. See [Research and Problem Analysis](docs/01-research/README.md).

### 1.2 INVEST requirements

The MVP backlog has 30 user stories, one per use case and numbered like it (US-01 is UC-01). US-11 and US-22 were removed with foreign invoices and the cash payment flag, and their numbers are not reused. Before a user story is ready for development, it is checked using the INVEST criteria.

| Criterion | Meaning in MatchPay |
|---|---|
| **Independent** | Each story delivers one clear outcome and names its prerequisites (login, synced source data, the checks before the Rule Engine). |
| **Negotiable** | Screens and technical choices can change as long as the outcome, permissions, and AI guardrails stay the same. |
| **Valuable** | Each story gives value to a named role; system behaviours are written for the role that benefits. |
| **Estimable** | Roles, inputs, limits, and failure cases (including AI failure) are documented, and every story has a size. |
| **Small** | Each story covers one use case; a larger story groups its criteria by part. |
| **Testable** | Every story has Given/When/Then acceptance criteria with concrete values. |

```text
US-01–US-06   Access and configuration
US-07–US-09   Source data
US-10–US-16   Intake and AI understanding (US-11 removed)
US-17–US-23   Exceptions (US-22 removed)
US-24–US-26   Batch and signing
US-27–US-28   Oversight
US-29–US-32   Service acceptance, signing delegation, invoices by email, notifications
```

MoSCoW priority: 20 Must, 10 Should, 0 Could, and 21 Won't (Advanced items W-01..W-21).

- [User Stories (INVEST)](docs/02-usecases-userstories/03-user-stories-invest.md)
- [Acceptance Criteria](docs/02-usecases-userstories/04-acceptance-criteria.md)
- [MoSCoW Prioritization](docs/02-usecases-userstories/05-moscow-prioritization.md)

### 1.3 Use cases

One actor diagram and four use case diagrams, one per group of modules. Purple nodes use an LLM.

```mermaid
flowchart LR
    ap["<span style='font-size:40px'>👤</span><br/><b>AP Accountant</b>"]
    ca["<span style='font-size:40px'>👤</span><br/><b>Chief Accountant</b>"]
    pa["<span style='font-size:40px'>👤</span><br/><b>Payment Approver</b>"]
    rd["<span style='font-size:40px'>👤</span><br/><b>Requesting Department</b>"]
    demo["<span style='font-size:40px'>👤</span><br/><b>Demo Operator</b>"]
    entityAdmin["<span style='font-size:40px'>👤</span><br/><b>Entity Admin</b>"]
    groupAdmin["<span style='font-size:40px'>👤</span><br/><b>Group Admin</b>"]
    admin["<span style='font-size:40px'>👤</span><br/><b>Administrator</b>"]
    user["<span style='font-size:40px'>👤</span><br/><b>User</b>"]

    ap ==>|"«generalize»"| user
    ca ==>|"«generalize»"| user
    pa ==>|"«generalize»"| user
    rd ==>|"«generalize»"| user
    demo ==>|"«generalize»"| user
    entityAdmin ==>|"«generalize»"| admin
    groupAdmin ==>|"«generalize»"| admin
    admin ==>|"«generalize»"| user

    classDef actor fill:none,stroke:none,color:#111
    class ap,ca,pa,rd,demo,entityAdmin,groupAdmin,admin,user actor
```

```mermaid
flowchart LR
    subgraph left["Actors"]
        direction TB
        user["<span style='font-size:40px'>👤</span><br/><b>User</b>"]
        admin["<span style='font-size:40px'>👤</span><br/><b>Administrator</b>"]
        entityAdmin["<span style='font-size:40px'>👤</span><br/><b>Entity Admin</b>"]
        groupAdmin["<span style='font-size:40px'>👤</span><br/><b>Group Admin</b>"]
    end

    subgraph system["System Boundary"]
        direction TB
        subgraph access["Access and configuration"]
            direction TB
            uc01["UC-01 Log In and Out"]
            uc02["UC-02 Manage Users and Roles"]
            uc03["UC-03 Manage Entities and Group Limits"]
            uc04["UC-04 Configure Entity Policy"]
            uc05["UC-05 Configure Approval Matrix"]
            uc06["UC-06 Manage Automation Gates"]
        end
    end

    admin ==>|"«generalize»"| user
    entityAdmin ==>|"«generalize»"| admin
    groupAdmin ==>|"«generalize»"| admin

    user --> uc01
    admin --> uc02
    entityAdmin --> uc04 & uc05
    groupAdmin --> uc03 & uc06

    classDef actor fill:none,stroke:none,color:#111
    classDef usecase fill:#1168bd,color:#fff,stroke:#0b4f9e
    class user,admin,entityAdmin,groupAdmin actor
    class uc01,uc02,uc03,uc04,uc05,uc06 usecase
    style left fill:#fff,stroke:#bbb,stroke-dasharray:5 5
    style system fill:#f8fbff,stroke:#1168bd,stroke-dasharray:5 5
```

```mermaid
flowchart LR
    subgraph left["Actors"]
        direction TB
        demo["<span style='font-size:40px'>👤</span><br/><b>Demo Operator</b>"]
        rd["<span style='font-size:40px'>👤</span><br/><b>Requesting Department</b>"]
        ap["<span style='font-size:40px'>👤</span><br/><b>AP Accountant</b>"]
    end

    subgraph system["System Boundary"]
        direction TB
        subgraph source["Source data"]
            direction TB
            uc07["UC-07 Sync Source Data from ERP"]
            uc08["UC-08 Create PO and Confirm Receipt in ERP Simulator"]
            uc09["UC-09 Manage Recurring Profiles"]
            uc29["UC-29 Confirm Service Acceptance"]
        end
        subgraph intake["Intake and AI understanding"]
            direction TB
            uc10["UC-10 Upload XML Invoice"]
            uc31["UC-31 Receive Invoices by Email"]
            uc12["UC-12 Classify Invoice Flow"]
            uc13["UC-13 Read and Identify Invoice"]
            uc14["UC-14 Match Invoice Lines"]
            uc15["UC-15 Detect Anomalies"]
            uc16["UC-16 Evaluate Batch Conditions and Route"]
        end
    end

    subgraph right["Systems"]
        direction TB
        erp(["Entity ERP"])
        status(["Invoice Status Lookup Service"])
        mail(["Email Service"])
        aiAgent(["AI Agent"])
        rules(["Rule Engine"])
    end

    demo --> uc08
    rd --> uc29
    ap --> uc09 & uc10 & uc31
    uc07 --> erp
    uc07 --> status
    uc10 --> status
    uc31 --> mail
    uc12 & uc13 & uc14 & uc15 --> aiAgent
    uc16 --> rules

    classDef actor fill:none,stroke:none,color:#111
    classDef usecase fill:#1168bd,color:#fff,stroke:#0b4f9e
    classDef ai fill:#7b3fbf,color:#fff,stroke:#5a2d8c
    classDef external fill:#666,color:#fff,stroke:#333
    class demo,rd,ap actor
    class uc07,uc08,uc09,uc10,uc16,uc29,uc31 usecase
    class uc12,uc13,uc14,uc15 ai
    class erp,status,mail,aiAgent,rules external
    style left fill:#fff,stroke:#bbb,stroke-dasharray:5 5
    style right fill:#fff,stroke:#bbb,stroke-dasharray:5 5
    style system fill:#f8fbff,stroke:#1168bd,stroke-dasharray:5 5
```

```mermaid
flowchart LR
    subgraph left["Actors"]
        direction TB
        ap["<span style='font-size:40px'>👤</span><br/><b>AP Accountant</b>"]
        ca["<span style='font-size:40px'>👤</span><br/><b>Chief Accountant</b>"]
        pa["<span style='font-size:40px'>👤</span><br/><b>Payment Approver</b>"]
    end

    subgraph system["System Boundary"]
        direction TB
        subgraph exceptions["Exceptions and decisions"]
            direction TB
            uc18["UC-18 Resolve Exception"]
            uc19["UC-19 Send Correction Request or Data-Fix Notice"]
            uc17["UC-17 View Invoice Worklist and Evidence"]
            uc21["UC-21 Decide on Tax-Risk Hold"]
            uc23["UC-23 Approve Exception Individually"]
            uc20["UC-20 Re-check Follow-up Invoice and Close Exception"]
        end
    end

    subgraph right["Systems"]
        direction TB
        aiAgent(["AI Agent"])
        mail(["Email Service"])
    end

    ap --> uc18 & uc19 & uc17
    ca --> uc17 & uc21
    pa --> uc17 & uc23
    uc19 --> mail
    uc19 --> aiAgent

    classDef actor fill:none,stroke:none,color:#111
    classDef usecase fill:#1168bd,color:#fff,stroke:#0b4f9e
    classDef ai fill:#7b3fbf,color:#fff,stroke:#5a2d8c
    classDef external fill:#666,color:#fff,stroke:#333
    class ap,ca,pa actor
    class uc17,uc18,uc20,uc21,uc23 usecase
    class uc19 ai
    class aiAgent,mail external
    style left fill:#fff,stroke:#bbb,stroke-dasharray:5 5
    style right fill:#fff,stroke:#bbb,stroke-dasharray:5 5
    style system fill:#f8fbff,stroke:#1168bd,stroke-dasharray:5 5
```

```mermaid
flowchart LR
    subgraph left["Actors"]
        direction TB
        ap["<span style='font-size:40px'>👤</span><br/><b>AP Accountant</b>"]
        ca["<span style='font-size:40px'>👤</span><br/><b>Chief Accountant</b>"]
        pa["<span style='font-size:40px'>👤</span><br/><b>Payment Approver</b>"]
        admin["<span style='font-size:40px'>👤</span><br/><b>Administrator</b>"]
        entityAdmin["<span style='font-size:40px'>👤</span><br/><b>Entity Admin</b>"]
    end

    subgraph system["System Boundary"]
        direction TB
        subgraph batch["Batch and signing"]
            direction TB
            uc24["UC-24 Review Batch and Perform Sample Check"]
            uc25["UC-25 Sign Payment Requests"]
            uc30["UC-30 Delegate Signing Authority"]
            uc26["UC-26 Send Signed Batch to ERP"]
        end
        subgraph oversight["Oversight and notifications"]
            direction TB
            uc27["UC-27 View Dashboard"]
            uc28["UC-28 View Audit Log"]
            uc32["UC-32 Receive Notifications and Reminders"]
        end
    end

    subgraph right["Systems"]
        direction TB
        aiAgent(["AI Agent"])
        erp(["Entity ERP"])
    end

    entityAdmin ==>|"«generalize»"| admin

    ap --> uc24 & uc26 & uc27 & uc32
    ca --> uc25 & uc26 & uc27 & uc28 & uc30 & uc32
    pa --> uc25 & uc27 & uc30 & uc32
    admin --> uc27 & uc28
    entityAdmin --> uc30
    uc24 & uc25 --> aiAgent
    uc26 --> erp

    classDef actor fill:none,stroke:none,color:#111
    classDef usecase fill:#1168bd,color:#fff,stroke:#0b4f9e
    classDef ai fill:#7b3fbf,color:#fff,stroke:#5a2d8c
    classDef external fill:#666,color:#fff,stroke:#333
    class ap,ca,pa,admin,entityAdmin actor
    class uc26,uc27,uc28,uc30,uc32 usecase
    class uc24,uc25 ai
    class aiAgent,erp external
    style left fill:#fff,stroke:#bbb,stroke-dasharray:5 5
    style right fill:#fff,stroke:#bbb,stroke-dasharray:5 5
    style system fill:#f8fbff,stroke:#1168bd,stroke-dasharray:5 5
```

For the actors, the role and use case matrix, and the flows, see [Actors and Use Cases](docs/02-usecases-userstories/01-use-cases.md) and [Use Case Specifications](docs/02-usecases-userstories/02-use-case-specifications.md).

### 1.4 Roles and permissions

| Capability | AP Accountant | Chief Accountant | Payment Approver | Requesting Department | Entity Admin | Group Admin |
|---|---|---|---|---|---|---|
| Log in and out | Yes | Yes | Yes | Yes | Yes | Yes |
| Upload XML invoices, manage recurring profiles | Own entity | No | No | No | No | No |
| Resolve exceptions, send requests to suppliers, run the sample check | Own entity | No | No | No | No | No |
| Decide on tax-risk holds | No | Own entity | No | No | No | No |
| Approve a single exception | No | No | Own entity, own level | No | No | No |
| Confirm the acceptance of a service | No | No | No | Own entity | No | No |
| Name a delegate for signing while absent | No | Own delegation | Own delegation | No | Own entity (view, revoke) | No |
| Sign payment requests | No | Own entity, first | Own entity, own level, second | No | No | No |
| Receive notifications and reminders | Own entity | Own entity | Own entity | No | No | No |
| View the invoice worklist and evidence | Own entity | Own entity (read-only) | Own entity (read-only) | No | No | No |
| View the dashboard | Own entity | Own entity | Own entity | No | Own entity | Per-entity counts and rates |
| View the audit log | No | Own entity | No | No | Own entity | Group events only |
| Manage users and roles | No | No | No | No | Own entity | All entities |
| Configure entity policy and approval matrix | No | No | No | No | Own entity | No |
| Manage entities, group limits, and automation gates | No | No | No | No | No | Yes |

The Demo Operator, who plays the buyer and the warehouse keeper in the ERP simulator, appears only in the demo. The server enforces roles and entity scope; hiding a control in the screen serves only the user interface. The Rule Engine alone admits an invoice to a batch, from stored evidence and without an LLM; the AI supplies evidence and never decides. See [Business rules](docs/requirements/business-rules.md).

## 2. Information Architecture, Screen Hierarchy, and UI/UX

The information architecture places the 30 stories on 45 screens: 22 pages and 23 modals. Each role sees only the pages it may open, and decisions, confirmations, and forms are modals on their parent page.

### 2.1 Information architecture

Solid lines connect a parent page to a child page; dashed arrows show which areas each actor uses; purple cards are pages with AI features.

Finance-side roles: the AP Accountant, the Chief Accountant, the Payment Approver, and the Requesting Department, with the areas each one uses. The Delegations area is drawn again in the second diagram because the Entity Admin reads and revokes delegations.

```mermaid
flowchart TB
    ap["<span style='font-size:40px'>👤</span><br/><b>AP Accountant</b>"]
    ca["<span style='font-size:40px'>👤</span><br/><b>Chief Accountant</b>"]
    pa["<span style='font-size:40px'>👤</span><br/><b>Payment Approver</b>"]
    rd["<span style='font-size:40px'>👤</span><br/><b>Requesting Department</b>"]

    subgraph access["Access"]
        direction TB
        scr01["<b>SCR-01 Login</b><br/>• Email, password<br/>• Goes to the role home page"]
    end

    subgraph prep["AP preparation (AP Accountant)"]
        direction TB
        scr20["<b>SCR-20 Recurring Profiles</b><br/>• Profiles, earlier amounts<br/>• Add, deactivate"]
        scr24["<b>SCR-24 Mailbox Log</b><br/>• Messages and attachments with results<br/>• Fetch now<br/>• Last fetch time or failure"]
        scr30["<b>SCR-30 Batch Review</b><br/>• Close batch, AI sample, OK or Error<br/>• Expand sample, reopen for review<br/>• Release for signing<br/>• Request, ERP send status, resend"]
    end

    subgraph acceptance["Service acceptance (Requesting Department)"]
        direction TB
        scr22["<b>SCR-22 Acceptance Queue</b><br/>• Service invoices waiting for acceptance<br/>• Confirm or reject with a note<br/>• Own entity only"]
    end

    subgraph invoices["Invoices (AP: full · Chief Accountant, Payment Approver: read-only)"]
        direction TB
        scr10["<b>SCR-10 Invoice Worklist</b><br/>• Search by number, supplier, total<br/>• Filters by state, Due soon, source<br/>• Last ERP sync, upload XML only (AP)"]
        scr12["<b>SCR-12 Invoice Detail and Evidence</b><br/>• Document, order, receipt, line matches<br/>• Anomalies, six conditions, authority status<br/>• State history, AI text labelled AI<br/>• Action panel for the role that must decide<br/>• Record a cancellation notice (AP)"]
        scr10 --> scr12
    end

    subgraph decisions["Decisions (Chief Accountant, Payment Approver)"]
        direction TB
        scr40["<b>SCR-40 Decision Queue</b><br/>• CA: tax-risk holds<br/>• PA: exceptions at my level<br/>• Each row opens the invoice"]
    end

    subgraph signing["Signing (Chief Accountant, Payment Approver)"]
        direction TB
        scr50["<b>SCR-50 Signing Queue</b><br/>• Requests to sign, select many<br/>• Sign in one action, On behalf of mark<br/>• ERP status"]
        scr51["<b>SCR-51 Payment Request Detail</b><br/>• AI summary labelled AI<br/>• Totals, large invoices, flags<br/>• Lines, remove, decline, resend<br/>• Paid status and reference"]
        scr50 --> scr51
    end

    subgraph delegations["Signing delegations (Chief Accountant, Payment Approver; Entity Admin reads and revokes)"]
        direction TB
        scr55["<b>SCR-55 Signing Delegations</b><br/>• Delegations given and received<br/>• New delegation, revoke<br/>• Scheduled, Active, Ended, Revoked"]
    end

    subgraph notifications["Notifications (AP Accountant, Chief Accountant, Payment Approver)"]
        direction TB
        scr62["<b>SCR-62 Notifications</b><br/>• Own notices and reminders<br/>• Unread count in the top bar<br/>• Each item opens its object"]
    end

    subgraph oversight["Oversight"]
        direction TB
        scr60["<b>SCR-60 Dashboard</b><br/>• Touchless rate and AI misplacement rate<br/>• Exception backlog by state and age<br/>• Group Admin: per-entity figures only"]
        scr61["<b>SCR-61 Audit Log</b><br/>• AI, rule, human, signature entries<br/>• Filters, read-only<br/>• Group Admin: group events only"]
    end

    scr30 --> scr12
    scr40 --> scr12
    scr51 --> scr12
    scr62 --> scr12
    scr62 --> scr30
    scr62 --> scr50
    scr62 --> scr51

    ap -.-> access
    ap -.-> invoices
    ap -.-> prep
    ap -.-> notifications
    ap -.-> oversight
    ca -.-> access
    ca -.-> invoices
    ca -.-> decisions
    ca -.-> signing
    ca -.-> delegations
    ca -.-> notifications
    ca -.-> oversight
    pa -.-> access
    pa -.-> invoices
    pa -.-> decisions
    pa -.-> signing
    pa -.-> delegations
    pa -.-> notifications
    pa -.-> oversight
    rd -.-> access
    rd -.-> acceptance

    classDef actor fill:none,stroke:none,color:#111
    classDef screen fill:#fff,color:#111,stroke:#1168bd,text-align:left
    classDef ai fill:#f3ecfb,color:#111,stroke:#7b3fbf,text-align:left
    class ap,ca,pa,rd actor
    class scr01,scr10,scr20,scr22,scr24,scr40,scr50,scr55,scr60,scr61,scr62 screen
    class scr12,scr30,scr51 ai
```

Administration and demo: the Entity Admin, the Group Admin, and the Demo Operator, with the areas each one uses. Access and Oversight are drawn again because the finance roles share them.

```mermaid
flowchart TB
    entityAdmin["<span style='font-size:40px'>👤</span><br/><b>Entity Admin</b>"]
    groupAdmin["<span style='font-size:40px'>👤</span><br/><b>Group Admin</b>"]
    demo["<span style='font-size:40px'>👤</span><br/><b>Demo Operator</b>"]

    subgraph access["Access"]
        direction TB
        scr01["<b>SCR-01 Login</b><br/>• Email, password<br/>• Goes to the role home page"]
    end

    subgraph oversight["Oversight"]
        direction TB
        scr60["<b>SCR-60 Dashboard</b><br/>• Touchless rate and AI misplacement rate<br/>• Exception backlog by state and age<br/>• Group Admin: per-entity figures only"]
        scr61["<b>SCR-61 Audit Log</b><br/>• AI, rule, human, signature entries<br/>• Filters, read-only<br/>• Group Admin: group events only"]
    end

    subgraph delegations["Signing delegations (Chief Accountant, Payment Approver; Entity Admin reads and revokes)"]
        direction TB
        scr55["<b>SCR-55 Signing Delegations</b><br/>• Delegations given and received<br/>• New delegation, revoke<br/>• Scheduled, Active, Ended, Revoked"]
    end

    subgraph useradmin["User administration"]
        direction TB
        scr70["<b>SCR-70 Users</b><br/>• Users, roles, ERP link<br/>• Create, deactivate<br/>• Group Admin: entity filter"]
    end

    subgraph entityconfig["Entity configuration (Entity Admin)"]
        direction TB
        scr73["<b>SCR-73 Entity Policy</b><br/>• Tolerance, batch threshold<br/>• Sample rate, grouping mode<br/>• Group limit beside each field"]
        scr74["<b>SCR-74 Approval Matrix</b><br/>• Tiers, levels, approvers<br/>• Gap and overlap errors"]
    end

    subgraph groupadmin["Group administration (Group Admin)"]
        direction TB
        scr75["<b>SCR-75 Group Overview</b><br/>• Entities, open and closed gates<br/>• Gate alerts<br/>• Last ERP sync per entity"]
        scr76["<b>SCR-76 Entities and Group Limits</b><br/>• Entities, group maximums<br/>• Non-coded invoice sectors"]
        scr78["<b>SCR-78 Automation Gates</b><br/>• Pair state, compared count<br/>• Accuracy against 98%<br/>• Open or close"]
    end

    subgraph demoarea["Demo only"]
        direction TB
        scr80["<b>SCR-80 ERP Simulator</b><br/>• Entity and persona<br/>• Purchase orders, receipts<br/>• Marked Demo only"]
    end


    entityAdmin -.-> access
    entityAdmin -.-> oversight
    entityAdmin -.-> useradmin
    entityAdmin -.-> entityconfig
    entityAdmin -.-> delegations
    groupAdmin -.-> access
    groupAdmin -.-> oversight
    groupAdmin -.-> useradmin
    groupAdmin -.-> groupadmin
    demo -.-> access
    demo -.-> demoarea

    classDef actor fill:none,stroke:none,color:#111
    classDef screen fill:#fff,color:#111,stroke:#1168bd,text-align:left
    classDef ai fill:#f3ecfb,color:#111,stroke:#7b3fbf,text-align:left
    class entityAdmin,groupAdmin,demo actor
    class scr01,scr55,scr60,scr61,scr70,scr73,scr74,scr75,scr76,scr80 screen
    class scr78 ai
```

### 2.2 Screen hierarchy

| Role | Home page after login | Sidebar pages |
|---|---|---|
| AP Accountant | Invoice Worklist | Invoices, Batch, Mailbox, Recurring profiles, Notifications, Dashboard |
| Chief Accountant | Decision Queue | Decisions, Signing queue, Delegations, Invoices (read-only), Notifications, Dashboard, Audit log |
| Payment Approver | Signing Queue | Signing queue, Approvals, Delegations, Invoices (read-only), Notifications, Dashboard |
| Requesting Department | Acceptance Queue | Acceptance queue |
| Entity Admin | Entity Policy | Entity policy, Approval matrix, Users, Delegations, Dashboard, Audit log |
| Group Admin | Group Overview | Group overview, Automation gates, Entities and limits, Users, Dashboard, Audit log |
| Demo Operator | ERP Simulator (demo only) | ERP simulator |

Login takes each role to its home page; lists open full detail pages, and decisions, forms, and confirmations are modals on their parent page. Screen IDs and the requirement-to-screen mapping are in the [Screen Inventory](docs/03-information-architecture/04-screen-inventory.md), and the flows are in [Primary User Flows](docs/03-information-architecture/05-user-flows.md).

### 2.3 Current UI design

The design concept is "three hands": what the AI proposed, what the Rule Engine decided, and what a person decided or signed are always distinguishable. The full gallery of every screen and state is `docs/04-uiux/wireframes/index.html`; open it in a browser from a local clone.

#### Invoice worklist (AP Accountant, SCR-10)

![Invoice worklist](docs/images/prototype/ap-accountant/10-invoice-worklist.png)

Every state chip, reasons with numbers, "Due soon", and the sync time.

#### Invoice detail with evidence (SCR-12)

![Invoice detail and evidence](docs/images/prototype/ap-accountant/12-invoice-detail.png)

AI evidence, the six conditions with values, line matches, the decision history, and an action panel for the role.

#### Batch review (SCR-30)

![Batch review](docs/images/prototype/ap-accountant/30c-batch-review-sampled.png)

The AI-selected sample that the AP Accountant marks before release.

#### Payment request (Chief Accountant, SCR-51)

![Payment request](docs/images/prototype/chief-accountant/51-payment-request.png)

The AI summary labelled as AI, Rule Engine totals, and the signature records.

## 3. C4 Architecture

This README presents C1–C3. C4 Level 4 is in the architecture documentation.

### C1 — System Context

```mermaid
flowchart LR
    ap(["👤 AP Accountant"])
    ca(["👤 Chief Accountant"])
    pa(["👤 Payment Approver"])
    rd(["👤 Requesting Department"])
    entityAdmin(["👤 Entity Admin"])
    groupAdmin(["👤 Group Admin"])
    demo(["👤 Demo Operator<br/><i>[demo only]</i>"])

    subgraph boundary["MatchPay [Software System Boundary]"]
        direction TB
        matchpay["MatchPay<br/><i>[Software System]</i><br/>Reads and matches invoices with AI, admits clean ones<br/>to a payment batch with the Rule Engine,<br/>and collects signatures on payment requests"]
    end

    erp[("Entity ERP<br/><i>[External System]</i><br/>Orders, receipts, suppliers,<br/>items, and payment status")]
    authority(["Invoice Status Lookup Service<br/><i>[External System]</i><br/>Status of an e-invoice at the tax authority"])
    mailbox(["Entity Invoice Mailbox<br/><i>[External System]</i><br/>Invoices that suppliers send by e-mail"])
    email(["Email Service<br/><i>[External System]</i><br/>Delivers requests and notices"])
    llm(["LLM Provider<br/><i>[External System]</i><br/>Language model API"])
    supplier(["👤 Supplier<br/><i>[outside the system]</i>"])

    ap -- "uploads XML, resolves exceptions, reviews the batch" --> matchpay
    ca -- "decides tax-risk holds, signs first" --> matchpay
    pa -- "approves exceptions, signs second" --> matchpay
    rd -- "confirms service acceptance" --> matchpay
    entityAdmin -- "manages the own entity" --> matchpay
    groupAdmin -- "manages the group and the gates" --> matchpay
    demo -- "creates orders and receipts in the simulator" --> matchpay

    erp -- "master data, orders, receipts" --> matchpay
    matchpay -- "sends signed payment requests" --> erp
    matchpay -- "asks for the status of an invoice" --> authority
    mailbox -- "invoice e-mails with XML attachments" --> matchpay
    matchpay -- "sends the requests the AP Accountant approves" --> email
    matchpay -- "sends a line, a draft task, or a summary task" --> llm
    email -- "delivers a correction request" --> supplier
    supplier -- "sends invoices by e-mail" --> mailbox

    style matchpay fill:#1168bd,color:#fff
    style boundary fill:#f8fbff,stroke:#1168bd,stroke-dasharray:5 5
    style erp fill:#999,color:#fff
    style authority fill:#999,color:#fff
    style mailbox fill:#999,color:#fff
    style email fill:#999,color:#fff
    style llm fill:#7b3fbf,color:#fff
    style supplier fill:#ddd,color:#111
```

### C2 — Container

```mermaid
flowchart TB
    users(["👤 Seven roles<br/>AP Accountant, Chief Accountant, Payment Approver,<br/>Requesting Department, Entity Admin, Group Admin,<br/>Demo Operator"])

    subgraph platform["MatchPay [Software System Boundary]"]
        direction TB
        subgraph edge["Edge"]
            proxy["Reverse Proxy and Web<br/><i>[Container: Caddy, static files of React + TypeScript + Vite]</i><br/>TLS, the web application as static files,<br/>and /api forwarded to the API"]
        end
        subgraph app["Application: one codebase, two processes"]
            direction LR
            api["API<br/><i>[Container: Python 3.12, FastAPI]</i><br/>The OpenAPI contract: sessions, roles,<br/>entity scope, validation, state changes,<br/>and the audit entry in the same transaction"]
            worker["Worker<br/><i>[Container: Python 3.12, same codebase]</i><br/>Job runner, AI checks, Rule Engine, ERP sync,<br/>mailbox fetch, ERP send, reminders;<br/>holds the LLM key"]
            embed["Embedding Model<br/><i>[Library inside the Worker: open multilingual model]</i><br/>Runs locally; no call leaves the deployment"]
        end
        subgraph data["Data"]
            database[("PostgreSQL 16 with pgvector<br/><i>[Container: Database]</i><br/>schema public: business tables of matchpay.dbml<br/>schema sim: ERP simulator tables<br/>schema platform: sessions, idempotency keys,<br/>rate limits, job queue")]
        end
    end

    erp[("Entity ERP<br/><i>[External System: simulated in the demo]</i>")]
    authority(["Invoice Status Lookup Service<br/><i>[External System: simulated in the demo]</i>"])
    mailbox(["Entity Invoice Mailbox<br/><i>[External System: simulated in the demo]</i>"])
    email(["Email Service<br/><i>[External System: simulated in the demo]</i>"])
    llm(["LLM Provider<br/><i>[External System]</i>"])

    users -- "HTTPS" --> proxy
    proxy -- "HTTP, /api/v1" --> api
    api -- "SQL, row-level security on app.entity_id" --> database
    worker -- "SQL, same role and policies" --> database
    api -- "enqueue a job in the same transaction" --> database
    worker -- "claim a job with SKIP LOCKED" --> database
    worker -- "in-process call" --> embed
    worker -- "ErpPort" --> erp
    worker -- "AuthorityStatusPort" --> authority
    worker -- "MailboxPort" --> mailbox
    worker -- "MailerPort" --> email
    worker -- "LlmPort, HTTPS, JSON schema" --> llm

    style proxy fill:#3a7bd5,color:#fff
    style api fill:#1168bd,color:#fff
    style worker fill:#1168bd,color:#fff
    style embed fill:#7b3fbf,color:#fff
    style database fill:#1168bd,color:#fff
    style erp fill:#999,color:#fff
    style authority fill:#999,color:#fff
    style mailbox fill:#999,color:#fff
    style email fill:#999,color:#fff
    style llm fill:#7b3fbf,color:#fff
    style platform fill:#f8fbff,stroke:#1168bd,stroke-dasharray:5 5
```

### C3 — Component

```mermaid
flowchart TB
    web["Reverse Proxy and Web<br/><i>[Container]</i>"]
    db[("PostgreSQL<br/><i>[Container: Database]</i>")]
    ext(["ERP, status service, mailbox, Email Service<br/><i>[External Systems]</i>"])
    llmext(["LLM Provider<br/><i>[External System]</i>"])

    subgraph backend["Backend codebase [Container: API and Worker]"]
        direction TB
        http["HTTP API<br/><i>[Component: FastAPI routers]</i><br/>Session, CSRF, roles, entity scope,<br/>validation, Problem Details"]
        jobs["Job Runner<br/><i>[Component]</i><br/>Queue on PostgreSQL, schedules,<br/>retries, call-and-wait jobs"]

        subgraph config["Access and configuration"]
            direction LR
            identity["Identity and Access"]
            group["Group Configuration"]
            policy["Entity Policy and Approval Matrix"]
            deleg["Delegations"]
            gates["Automation Gates"]
        end

        subgraph source["Source data"]
            direction LR
            erpsync["ERP Sync"]
            sim["ERP Simulator demo"]
            recurring["Recurring Profiles"]
        end

        subgraph intake["Intake"]
            direction LR
            invoice["Invoice Intake"]
            mailboxmod["Mailbox Intake"]
            authority["Authority Status"]
        end

        subgraph understanding["Understanding and decision"]
            direction LR
            ai["AI Understanding"]
            rules["Rule Engine"]
        end

        subgraph exceptions["Exceptions"]
            direction LR
            exc["Exception Handling"]
            corr["Corrections and Follow-ups"]
            tax["Tax-Risk Decisions"]
            indiv["Individual Approval"]
            svc["Service Acceptance"]
        end

        subgraph payment["Batch, signing, and payment"]
            direction LR
            batch["Batch and Sample"]
            signing["Signing"]
            erpsend["ERP Send"]
        end

        subgraph oversight["Oversight"]
            direction LR
            notif["Notifications"]
            dash["Oversight and Dashboard"]
            audit["Audit Log"]
        end

        subgraph shared["Shared services"]
            direction LR
            llm["LLM Gateway"]
            embed["Embedding Service"]
            adapters["Adapters<br/>ErpPort, MailboxPort,<br/>AuthorityStatusPort, MailerPort"]
            persistence["Persistence<br/>Unit of work, row-level security setting"]
        end
    end

    web --> http
    http --> config
    http --> source
    http --> intake
    http --> understanding
    http --> exceptions
    http --> payment
    http --> oversight
    http -- "enqueue and wait" --> jobs
    jobs --> erpsync
    jobs --> mailboxmod
    jobs --> authority
    jobs --> ai
    jobs --> signing
    jobs --> erpsend
    jobs --> notif
    jobs --> sim
    jobs --> corr
    invoice -- "starts a check run" --> jobs
    mailboxmod --> invoice
    ai --> rules
    rules -- "opens an exception" --> exc
    rules -- "admits an invoice" --> batch
    ai --> embed
    ai --> llm
    corr --> llm
    signing --> llm
    batch -- "releases requests" --> signing
    signing -- "signed request starts a send" --> jobs
    erpsync --> adapters
    authority --> adapters
    erpsend --> adapters
    corr --> adapters
    mailboxmod --> adapters
    sim -. "implements the simulated adapters" .-> adapters
    llm --> llmext
    adapters --> ext
    config -. "audit entry in the same transaction" .-> audit
    exceptions -. "audit entry in the same transaction" .-> audit
    payment -. "audit entry in the same transaction" .-> audit
    persistence --> db

    style http fill:#3a7bd5,color:#fff
    style jobs fill:#3a7bd5,color:#fff
    style ai fill:#7b3fbf,color:#fff
    style embed fill:#7b3fbf,color:#fff
    style llm fill:#7b3fbf,color:#fff
    style rules fill:#0b4f9e,color:#fff
    style persistence fill:#3a7bd5,color:#fff
    style adapters fill:#3a7bd5,color:#fff
    style backend fill:#f8fbff,stroke:#1168bd,stroke-dasharray:5 5
```

Complete documentation: [Architecture index](docs/07-architecture/README.md), [Tech stack](docs/07-architecture/05-tech-stack.md), and [LLM provider](docs/07-architecture/06-llm-provider.md).

## 4. Database Diagrams and OpenAPI 3.0 Contract

The database defines the persistence contract, and the API defines the HTTP contract that the web application uses.

### 4.1 Database diagrams

The PostgreSQL 16 model, with the pgvector extension, has 74 tables in twelve groups. Every business row carries its entity, every AI output and every Rule Engine condition is stored with its values and versions, and the audit log is append-only. The diagram shows the tables that carry an invoice from upload to payment.

```mermaid
erDiagram
    entities ||--o{ users : employs
    entities ||--o| entity_policies : "has one"
    entities ||--o{ payment_batches : "has one per month"
    entities ||--o{ invoices : receives
    erp_suppliers ||--o{ invoices : sends
    erp_suppliers ||--o{ supplier_gates : "has a gate per entity"
    erp_purchase_orders |o--o{ invoices : "is billed by"
    erp_purchase_orders ||--o{ erp_receipts : "is received by"
    invoices ||--o| invoice_documents : "keeps the original XML"
    invoices ||--o{ invoice_lines : has
    invoices ||--o{ invoice_check_runs : "is checked in"
    invoice_check_runs ||--o{ rule_evaluations : "ends in"
    rule_evaluations ||--o{ rule_condition_results : "records six"
    invoice_lines ||--o{ invoice_line_matches : "is matched by"
    invoices ||--o{ anomaly_findings : "has findings"
    invoices ||--o{ exceptions : "may open"
    exceptions ||--o{ exception_reasons : lists
    payment_batches ||--o{ batch_items : holds
    invoices ||--o{ batch_items : "is admitted as"
    payment_batches ||--o{ payment_requests : releases
    payment_requests ||--o{ payment_request_lines : covers
    invoices ||--o{ payment_request_lines : "is paid through"
    payment_requests ||--o{ request_signatures : "is signed by"
    users ||--o{ request_signatures : signs
    payment_requests ||--o{ erp_send_attempts : "is sent in"
    invoices |o--o{ audit_log : "is traced in"

    entities {
        bigint id PK
        char tax_code UK
    }
    users {
        bigint id PK
        bigint entity_id FK
        user_role role
    }
    invoices {
        bigint id PK
        bigint entity_id FK
        invoice_state state
        integer version
    }
    exceptions {
        bigint id PK
        exception_state state
        exception_outcome outcome
    }
    payment_batches {
        bigint id PK
        date period_start
        batch_state state
    }
    payment_requests {
        bigint id PK
        varchar request_no
        request_state state
        char content_hash
    }
    request_signatures {
        bigint id PK
        signer_role signer_role
        integer request_version
    }
```

See the [data model](docs/05-database/01-data-model.md), the [full ER diagram](docs/05-database/02-er-diagram.md), and the [DBML schema](docs/05-database/matchpay.dbml).

### 4.2 OpenAPI 3.0 API documentation

The HTTP contract (draft for review) is written first and is the source of truth for paths, bodies, roles, and errors. Every operation names the stories, business rules, screens, and tables it serves.

```text
OpenAPI 3.0.4
121 operations on 104 paths, 24 tags
Cookie session (HttpOnly) with a CSRF header
Errors as Problem Details with a stable errorCode
Idempotency-Key on signing, release, and resend
Optimistic concurrency with version
202 with a run id for work that continues in the background
```

- [OpenAPI 3.0.4 specification](docs/06-api/openapi.yaml)
- [API documentation](docs/06-api/README.md)

## 5. Frontend and Backend Folder Structures

### 5.1 Current repository layout

No source code exists yet. The repository holds documents, the checker script, and the lint configuration.

```text
MatchPay/
├── docs/
│   ├── 01-research/               # Problem, goals, stakeholders, similar products, scope, risks
│   ├── 02-usecases-userstories/   # Use cases, user stories (INVEST), acceptance criteria, MoSCoW
│   ├── 03-information-architecture/  # Sitemap, routes, navigation, screen inventory, flows, UI states
│   ├── 04-uiux/                   # Design system, screen notes, HTML wireframes
│   ├── 05-database/               # Data model, ER diagram, DBML schema
│   ├── 06-api/                    # OpenAPI contract and API traceability
│   ├── 07-architecture/           # C4 levels 1-4, tech stack, LLM provider, runtime
│   ├── requirements/              # Business rules
│   ├── traceability/              # Master traceability matrix
│   ├── images/                    # Role-based wireframe screenshots and the feature mind map
│   ├── handoff/                   # Session handoff and research log
│   └── mindmap.md                 # Product mind map and feature map F01-F12
├── tools/
│   └── check_docs.py              # Documentation checks
├── redocly.yaml                   # OpenAPI lint configuration
└── README.md
```

### 5.2 Target frontend structure

Target, not yet implemented. The web application is React with TypeScript, built with Vite, with React Router in history mode and TanStack Query for server state. API types are generated from `docs/06-api/openapi.yaml`.

```text
web/
├── src/
│   ├── app/            # Routes, providers, role home pages, sidebar
│   ├── features/       # One folder per screen area: invoices, batch, signing, delegations,
│   │                   # decisions, acceptance, mailbox, profiles, notifications,
│   │                   # dashboard, audit, users, entity-config, group-admin, simulator
│   ├── components/     # Shared layout, tables, state chips, AI / rule / person labels
│   ├── api/            # Types generated from openapi.yaml and the shared client
│   └── styles/         # Tokens from the UI/UX design system
└── tests/              # End-to-end tests of the user flows
```

### 5.3 Target backend structure

Target, not yet implemented. The backend is a Python 3.12 FastAPI modular monolith: one codebase run as an `api` process and a `worker` process in front of PostgreSQL 16 with pgvector. There is one module per C3 component, and the module names follow the tags of `openapi.yaml`.

```text
backend/
├── matchpay/
│   ├── http_api/                    # Routers, session and CSRF, Problem Details
│   ├── job_runner/                  # Queue on PostgreSQL, schedules, retries
│   ├── identity_and_access/
│   ├── group_configuration/
│   ├── entity_policy_and_approval_matrix/
│   ├── delegations/
│   ├── automation_gates/
│   ├── erp_sync/
│   ├── erp_simulator/               # Demo only
│   ├── recurring_profiles/
│   ├── invoice_intake/
│   ├── mailbox_intake/
│   ├── authority_status/
│   ├── ai_understanding/
│   ├── rule_engine/
│   ├── exception_handling/
│   ├── corrections_and_follow_ups/
│   ├── tax_risk_decisions/
│   ├── individual_approval/
│   ├── service_acceptance/
│   ├── batch_and_sample/
│   ├── signing/
│   ├── erp_send/
│   ├── notifications/
│   ├── oversight_and_dashboard/
│   ├── audit_log/
│   ├── llm_gateway/
│   ├── embedding_service/
│   ├── adapters/                    # ErpPort, MailboxPort, AuthorityStatusPort, MailerPort
│   └── persistence/                 # Unit of work, row-level security setting
├── migrations/                      # Alembic, written to match matchpay.dbml
└── tests/
```

Dependency rules:

```text
A business module calls another only through its public interface; it never writes another module's tables
Rule Engine -> stored AI evidence, policy, gates, tax-risk data; never the LLM Gateway or the Embedding Service
Only the worker process starts the model, the embedding, and the adapters
Every state-changing path ends in Audit Log inside the caller's transaction
```

The detailed code structure design is still open. See [Component](docs/07-architecture/03-component.md), [Tech stack](docs/07-architecture/05-tech-stack.md), and [Runtime and deployment](docs/07-architecture/07-runtime-and-deployment.md).

## 6. Detailed Class and Sequence Design

Detailed design follows the C4 components and covers the two features where a mistake costs the most, plus the main runtime paths. These are target design views.

### 6.1 C4 Level 4 — Code

#### L4.1 Rule Engine — the six conditions (US-16)

```mermaid
classDiagram
    direction LR
    class RuleEngine {
        +evaluate(invoice_id, check_run_id) RuleEvaluation
    }
    class RoutingGuard {
        +route_before_conditions(evidence) Decision
    }
    class EvidenceReader {
        <<Protocol>>
        +load(invoice_id, check_run_id) Evidence
    }
    class SqlEvidenceReader {
        +load(invoice_id, check_run_id) Evidence
    }
    class Evidence {
        <<frozen dataclass>>
        +invoice
        +independent_source
        +line_matches
        +price_and_quantity_checks
        +entity_policy
        +gate
        +tax_risk_hold
        +open_anomalies
    }
    class Condition {
        <<Protocol>>
        +number int
        +evaluate(evidence) ConditionResult
    }
    class IndependentSourceCondition
    class LineMatchCondition
    class ToleranceAndReceiptCondition
    class BatchThresholdCondition
    class GateAndTaxRiskCondition
    class NoAnomalyCondition
    class ConditionResult {
        <<frozen dataclass>>
        +number
        +result PASS or FAIL or NOT_EVALUATED
        +measured_value
        +limit_value
        +value_text
        +note
    }
    class RuleEvaluation {
        <<frozen dataclass>>
        +invoice_id
        +check_run_id
        +decision ADMITTED or EXCEPTION or WAITING_FOR_GOODS or SEPARATED
        +results
        +engine_version
    }
    class EvaluationRepository {
        <<Protocol>>
        +save(evaluation) None
    }
    class BatchAdmission {
        <<Protocol>>
        +admit(invoice_id) BatchItem
    }
    class ExceptionOpening {
        <<Protocol>>
        +open_for(invoice_id, failed_results) None
    }
    class InvoiceStateChanger {
        <<Protocol>>
        +move(invoice_id, transition) None
    }
    class AuditWriter {
        <<Protocol>>
        +append(entry) None
    }

    RuleEngine --> RoutingGuard
    RuleEngine --> EvidenceReader
    RuleEngine --> Condition : six, in order
    RuleEngine --> EvaluationRepository
    RuleEngine --> BatchAdmission
    RuleEngine --> ExceptionOpening
    RuleEngine --> InvoiceStateChanger
    RuleEngine --> AuditWriter
    SqlEvidenceReader ..|> EvidenceReader
    IndependentSourceCondition ..|> Condition
    LineMatchCondition ..|> Condition
    ToleranceAndReceiptCondition ..|> Condition
    BatchThresholdCondition ..|> Condition
    GateAndTaxRiskCondition ..|> Condition
    NoAnomalyCondition ..|> Condition
    Condition --> Evidence : reads
    Condition --> ConditionResult : returns
    RuleEngine --> RuleEvaluation : returns
```

```mermaid
sequenceDiagram
    autonumber
    participant J as Check run job (AI Understanding)
    participant R as RuleEngine
    participant G as RoutingGuard
    participant E as SqlEvidenceReader
    participant C as Six conditions
    participant S as EvaluationRepository
    participant B as BatchAdmission
    participant X as ExceptionOpening
    participant I as InvoiceStateChanger
    participant A as AuditWriter

    J->>R: evaluate(invoice_id, check_run_id) inside one transaction
    R->>E: load(invoice_id, check_run_id)
    E-->>R: Evidence, with None for a missing part
    R->>G: route_before_conditions(evidence)
    alt no receipt or employee expense
        G-->>R: WAITING_FOR_GOODS or SEPARATED
        R->>S: save(evaluation without admission)
        R->>I: move(invoice, V8 or V7)
    else conditions apply
        loop condition 1 to 6
            R->>C: evaluate(evidence)
            C-->>R: ConditionResult PASS, FAIL, or NOT_EVALUATED
        end
        R->>S: save(evaluation with six results)
        alt all six PASS
            R->>B: admit(invoice_id)
            B-->>R: batch item in the open batch of the entity
            R->>I: move(invoice, V11 or V12)
        else any FAIL or NOT_EVALUATED
            R->>X: open_for(invoice_id, failed results)
            R->>I: move(invoice, V10)
        end
    end
    R->>A: append(decision entry with the six values)
    R-->>J: RuleEvaluation
```

#### L4.2 Signing many payment requests in one action (US-25)

```mermaid
classDiagram
    direction LR
    class SigningRouter {
        +sign_payment_requests(body, idempotency_key) SigningResponse
    }
    class SigningService {
        +sign_many(actor, items, password, idempotency_key) SigningResponse
        -sign_one(actor, item, action) RequestResult
    }
    class IdempotencyStore {
        <<Protocol>>
        +get_or_reserve(key, request_hash) StoredResult
        +complete(key, result) None
    }
    class ReauthVerifier {
        <<Protocol>>
        +verify(actor, password) bool
    }
    class PaymentRequestRepository {
        <<Protocol>>
        +lock(request_id, seen_version) PaymentRequest
        +save_signed(request, new_state) None
    }
    class ContentHasher {
        +hash(request) str
    }
    class SignerGuard {
        +check(actor, request, signer_role) Refusal or None
    }
    class OrderOfSigning {
        +required_role(request) SignerRole
    }
    class ApprovalLevelResolver {
        +level_allows(actor, request) bool
    }
    class SelfSigningGuard {
        +blocks(actor, request) InvoiceReference or None
    }
    class DelegationResolver {
        <<Protocol>>
        +active_for(actor, request, at) Delegation or None
    }
    class CertificateProvider {
        <<Protocol>>
        +certificate_ref(actor) str
    }
    class SignatureRepository {
        <<Protocol>>
        +add(signature) None
        +valid_for(request_id) list
    }
    class JobQueue {
        <<Protocol>>
        +enqueue_in_transaction(kind, payload) None
    }
    class RequestResult {
        <<frozen dataclass>>
        +request_id
        +outcome SIGNED or REFUSED
        +reason_code
        +detail
    }
    class AuditWriter {
        <<Protocol>>
        +append(entry) None
    }

    SigningRouter --> SigningService
    SigningService --> IdempotencyStore
    SigningService --> ReauthVerifier
    SigningService --> PaymentRequestRepository
    SigningService --> ContentHasher
    SigningService --> SignerGuard
    SigningService --> DelegationResolver
    SigningService --> CertificateProvider
    SigningService --> SignatureRepository
    SigningService --> JobQueue
    SigningService --> AuditWriter
    SigningService --> RequestResult : returns one per request
    SignerGuard --> OrderOfSigning
    SignerGuard --> ApprovalLevelResolver
    SignerGuard --> SelfSigningGuard
```

```mermaid
sequenceDiagram
    autonumber
    actor U as Signer
    participant R as SigningRouter
    participant S as SigningService
    participant K as IdempotencyStore
    participant V as ReauthVerifier
    participant P as PaymentRequestRepository
    participant G as SignerGuard
    participant H as ContentHasher
    participant D as DelegationResolver
    participant N as SignatureRepository
    participant Q as JobQueue
    participant A as AuditWriter

    U->>R: POST /payment-requests/sign with requests, password, Idempotency-Key
    R->>S: sign_many(actor, items, password, key)
    S->>K: get_or_reserve(key, request_hash)
    alt key already completed
        K-->>S: first result
        S-->>R: first result, nothing is signed again
    else first use of the key
        S->>V: verify(actor, password)
        alt wrong password
            V-->>S: false
            S->>A: append(LOGIN_FAILED)
            S-->>R: 401 AUTH_INVALID_CREDENTIALS, nothing signed
        else password accepted
            loop each request, own transaction
                S->>P: lock(request_id, seen_version)
                alt version is stale
                    P-->>S: conflict
                    S->>S: RequestResult REFUSED VERSION_CONFLICT
                else version matches
                    S->>D: active_for(actor, request, now)
                    D-->>S: delegation or None
                    S->>G: check(actor, request, signer_role)
                    alt a guard refuses
                        G-->>S: refusal with reason and invoice
                        S->>S: RequestResult REFUSED
                    else all guards pass
                        S->>H: hash(request)
                        H-->>S: content hash now
                        S->>N: add(signature with version, hash, signing_action_id)
                        S->>P: save_signed(request, next state)
                        opt second signature makes it Signed
                            S->>Q: enqueue_in_transaction(erp_send)
                        end
                        S->>A: append(signature entry)
                        S->>S: RequestResult SIGNED
                    end
                end
            end
            S->>K: complete(key, results)
            S-->>R: one result for each request
        end
    end
    R-->>U: 200 with the list of results
```

Source: [C4 Level 4 — Code](docs/07-architecture/04-code.md)

### 6.2 Runtime sequences

#### XML upload to the Rule Engine decision

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

#### Batch release, signing, and sending to the ERP

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

Source: [Runtime and Deployment](docs/07-architecture/07-runtime-and-deployment.md)

## Interactive prototype

A Vietnamese, clickable front end on mock data lives in [`prototype/`](prototype/README.md) (React, TypeScript, Vite, Ant Design 5; the mock API runs in the browser and follows the OpenAPI operation names). It sits next to the English wireframes, which stay the design reference. D-187, D-197, D-205, D-212, D-222, and D-230 are the user's decisions; D-188..D-196, D-198..D-204, D-206..D-211, D-213..D-221, D-223..D-229, and D-231..D-241 are calls that await the user's review (D-212 asks for a neutral enterprise look that sits next to a company ERP, and D-213..D-221 are how it was built; D-222 asks for a Three-way match view on the invoice detail page, and D-223..D-229 are how it was first built; D-230 replaces its table with a popup over the three source documents, and D-231..D-241 are how that was built): see [the UI/UX decisions](docs/04-uiux/00-decisions.md). Screenshots by role are in [`docs/images/prototype/`](docs/images/prototype/).

```bash
cd prototype
npm install
npm run dev
```

## Documentation

- Research: [Context and problem](docs/01-research/01-context-and-problem.md), [Goals and metrics](docs/01-research/02-goals-and-metrics.md), [Stakeholders](docs/01-research/03-stakeholders.md), [Similar products](docs/01-research/04-similar-products.md), [MVP scope](docs/01-research/05-scope.md), [Risks](docs/01-research/06-risks.md), [AI vs rule-based](docs/01-research/07-ai-vs-rule-based.md), [Glossary](docs/01-research/08-glossary.md), [Decisions](docs/01-research/00-decisions.md), [Future work](docs/01-research/09-future-work.md), [Regulatory context](docs/01-research/10-regulatory-context.md), [Invoice flows and data](docs/01-research/11-invoice-flows-and-data.md).
- Requirements: [Actors and use cases](docs/02-usecases-userstories/01-use-cases.md), [Use case specifications](docs/02-usecases-userstories/02-use-case-specifications.md), [User stories (INVEST)](docs/02-usecases-userstories/03-user-stories-invest.md), [Acceptance criteria](docs/02-usecases-userstories/04-acceptance-criteria.md), [MoSCoW](docs/02-usecases-userstories/05-moscow-prioritization.md), [Decisions and defaults](docs/02-usecases-userstories/00-decisions.md).
- Requirements catalogs: [Business rules](docs/requirements/business-rules.md).
- Information architecture: [Information architecture index](docs/03-information-architecture/README.md), [Decisions and defaults](docs/03-information-architecture/00-decisions.md), [Sitemap](docs/03-information-architecture/01-sitemap.md), [Routes and permissions](docs/03-information-architecture/02-routes-and-permissions.md), [Navigation](docs/03-information-architecture/03-navigation.md), [Screen inventory](docs/03-information-architecture/04-screen-inventory.md), [User flows](docs/03-information-architecture/05-user-flows.md), [UI states and accessibility](docs/03-information-architecture/06-ui-states-and-accessibility.md).
- Wireframes: [Wireframe gallery](docs/04-uiux/wireframes/index.html), [UI/UX index](docs/04-uiux/README.md), [Decisions and defaults](docs/04-uiux/00-decisions.md), [Design system](docs/04-uiux/01-design-system.md), [Screen notes and states](docs/04-uiux/02-screen-notes.md).
- Database: [Database index](docs/05-database/README.md), [Decisions and defaults](docs/05-database/00-decisions.md), [Data model](docs/05-database/01-data-model.md), [ER diagram](docs/05-database/02-er-diagram.md), [DBML schema](docs/05-database/matchpay.dbml).
- API: [API index](docs/06-api/README.md), [Decisions and defaults](docs/06-api/00-decisions.md), [OpenAPI contract](docs/06-api/openapi.yaml), [API traceability](docs/06-api/01-api-traceability.md).
- Architecture: [Architecture index](docs/07-architecture/README.md), [Decisions and defaults](docs/07-architecture/00-decisions.md), [System context](docs/07-architecture/01-system-context.md), [Container](docs/07-architecture/02-container.md), [Component](docs/07-architecture/03-component.md), [Code](docs/07-architecture/04-code.md), [Tech stack](docs/07-architecture/05-tech-stack.md), [LLM provider](docs/07-architecture/06-llm-provider.md), [Runtime and deployment](docs/07-architecture/07-runtime-and-deployment.md).
- Traceability: [Master traceability matrix](docs/traceability/master-traceability.md).

## Project Progress

- [x] Define the problem, measurable goals, stakeholders, and user roles (approved)
- [x] Compare similar products, define the MVP scope, risks, and AI vs rule-based reasoning (approved)
- [x] Draw the product mind map (approved)
- [x] Write the use cases and the use case diagram (approved)
- [x] Write user stories following INVEST (approved)
- [x] Write acceptance criteria (Given/When/Then) and business rules (approved)
- [x] Prioritize the backlog with MoSCoW (approved)
- [x] Design the information architecture, sitemap per role, and user flows (approved)
- [x] Design the UI/UX wireframes, including AI states and a design system (approved)
- [x] Design the database (approved)
- [x] Write the API documentation in OpenAPI 3.0 (draft for review)
- [x] Design the C4 model and choose the tech stack and LLM provider (draft for review)
- [ ] Design the code structure
- [ ] Implement the modules

