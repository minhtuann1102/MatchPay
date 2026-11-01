# Primary User Flows

> Design status: MVP — Step 3 of 9, approved
>
> Implementation status: NOT STARTED

Seven flows cover the path of an invoice from the demo set-up to payment, the one admin decision that the whole chain depends on, and the three flows added by the mind map sync (D-88): service acceptance, signing delegation, and notifications. Flows 1 to 3 gained branches for email intake, the authority status, cancellation notices, expanding the sample, reopening a batch, and resending to the ERP. In every flow a **purple** step uses the AI, and every purple step has a failure path that leaves a person able to continue (BR-27, DF-08). Each flow starts from the actors who enter it (person icon). A step a person performs begins with 👤 and an abbreviation: **DO** Demo Operator, **AP** AP Accountant, **CA** Chief Accountant, **PA** Payment Approver, **RD** Requesting Department, **EA** Entity Admin, **GA** Group Admin. Steps without a prefix are done by the system or the AI. State names are the exact names of BR-33 (invoice), BR-34 (exception), and BR-35 (batch and payment request).

## Flow 1: Demo set-up and invoice intake

Where the demo data comes from: the Calderwood Group, its three entities, and the sample people are seeded (DF-12). Orders and receipts are created by the Demo Operator in SCR-80 and reach MatchPay only through the sync (US-07). The tax-risk list entry for Eastbay Trading arrives through the same sync as a simulated feed with a source and a date (D-28). The compared history that lets a gate open is seeded (DF-33), and so are the price history and the earlier recurring periods that the price and recurring checks need (DF-42). Nothing in the chain waits for data that no step provides. An invoice also arrives by email: each entity has a simulated mailbox that is read every 15 minutes or at once on "Fetch now" (DF-63, D-92), and every XML attachment goes through the same checks as an upload. Before the checks, the simulated authority status of the invoice is looked up (DF-64, D-93): a cancelled or replaced invoice is rejected, and a lookup that does not answer makes an exception.

```mermaid
flowchart TD
    actDemo["<span style='font-size:40px'>👤</span><br/><b>Demo Operator</b>"]:::actor
    actAp["<span style='font-size:40px'>👤</span><br/><b>AP Accountant</b>"]:::actor
    start(["Seeded demo: Calderwood Group,<br/>3 entities, sample people, histories"]) --> sim["👤 DO: SCR-80 ERP Simulator<br/>picks entity and persona"]
    sim --> po["👤 DO: SCR-81 Purchase Order Form<br/>buyer persona creates the order"]
    po --> grn["👤 DO: SCR-82 Receipt or Acceptance Form<br/>warehouse keeper or acceptor persona"]
    grn --> same{"Same persona as<br/>the order creator?"}
    same -->|"Yes: refused, BR-02"| grn
    same -->|"No"| stored[("Simulated ERP<br/>order and receipt stored")]
    stored --> sync["Sync every 15 minutes, DF-31<br/>records stored with sync time"]
    sync --> erpok{"ERP reachable?"}
    erpok -->|"No"| stale["Earlier data kept<br/>SCR-10 shows last sync time<br/>and a stale warning"]
    erpok -->|"Yes"| fresh["Source data current<br/>tax-risk feed loaded"]
    fresh --> upload
    stale --> upload
    upload["👤 AP: SCR-10 Invoice Worklist<br/>opens SCR-11 Upload XML"] --> files["Per-file result<br/>Accepted or Rejected with reason"]
    mailbox["Entity mailbox read every 15 minutes, DF-63<br/>or 👤 AP: SCR-24 Mailbox Log, Fetch now<br/>each attachment is logged with its result"] --> files
    files -->|"Not XML (PDF, image): Only XML e-invoices<br/>are accepted in the MVP, AC-10.8;<br/>signature fails, buyer tax code of another entity,<br/>exact duplicate; Cancelled or Replaced<br/>at the tax authority, AC-10.12, AC-10.13"| rejected(["Rejected<br/>reason shown, original kept"])
    files -->|"Authority status lookup<br/>does not answer in 10 seconds, AC-10.15"| exc
    files -->|"Stored with hash"| received["Received then In Check"]

    subgraph background["System, in the background, UC-12 to UC-16"]
        direction TB
        classify["AI: classify the flow<br/>and read the document"]:::ai
        identify["AI: identify entity, order<br/>or profile, and receipt"]:::ai
        match["AI: match lines<br/>and detect anomalies"]:::ai
        aifail["AI step failed or slower than 20 s<br/>no retry during intake<br/>exception reason AI unavailable"]
        rules{"Rule Engine, no LLM<br/>six conditions of BR-05"}
        classify --> identify
        identify --> match
        match --> rules
        classify -.->|"failure"| aifail
        identify -.->|"failure"| aifail
        match -.->|"failure"| aifail
    end

    received --> classify
    rules -->|"All six hold"| inbatch(["In Batch<br/>open batch of the entity"])
    rules -->|"A condition fails"| exc(["Exception, state Open<br/>every failed condition with its value"])
    rules -->|"No receipt yet, or a service<br/>with no acceptance"| wait(["Waiting for Goods<br/>checked again when a receipt is synced<br/>or a service acceptance is confirmed, Flow 5"])
    rules -->|"Unsupported: foreign invoice<br/>(AC-12.9, D-31)"| exc
    rules -->|"Employee expense"| sep(["Separated<br/>list Waiting for reimbursement file"])
    rules -->|"Tax code mismatch<br/>or exact duplicate"| rejected2(["Rejected"])
    aifail --> exc
    wait -->|"Receipt synced: back to In Check"| rules

    actDemo --> sim
    actAp --> upload
    actAp --> mailbox

    classDef actor fill:none,stroke:none,color:#111
    classDef ai fill:#7b3fbf,color:#fff,stroke:#5a2d8c
    style background fill:#f8fbff,stroke:#1168bd,stroke-dasharray:5 5
```

## Flow 2: AP Accountant resolves an exception

An exception holds one or more reasons. The AP Accountant resolves them one by one, and after every resolution the Rule Engine checks the invoice again from the stored evidence (UC-16). Two kinds of reason cannot be settled by the AP Accountant and go to other roles: a tax-risk hold to the Chief Accountant, and an individual approval to the Payment Approver. An "Unsupported: foreign invoice" exception (AC-12.9) can only be rejected with a reason on SCR-15; it is never sent for a decision. A reported wrong entity (D-68) never moves the invoice to another entity: the invoice stays where it was uploaded, the page traces the mismatch, and the exception gets the reason "Wrong buyer tax code" or "Wrong entity reported". It is then resolved like a wrong invoice, by a correction or reissue request on SCR-14 or by a rejection on SCR-15, and it is never sent for an individual approval. When a seller sends a cancellation notice, the AP Accountant records it on SCR-19 from the invoice; what happens depends on the state of the invoice (BR-31, D-94). An exception "Authority status unavailable" is cleared by running the lookup again from the worklist.

```mermaid
flowchart TD
    actAp["<span style='font-size:40px'>👤</span><br/><b>AP Accountant</b>"]:::actor
    actCa["<span style='font-size:40px'>👤</span><br/><b>Chief Accountant</b>"]:::actor
    actPa["<span style='font-size:40px'>👤</span><br/><b>Payment Approver</b>"]:::actor
    start(["Exception, state Open<br/>badge on the Invoices item"]) --> list["👤 AP: SCR-10 Invoice Worklist<br/>filter by state Exception"]
    list --> detail["👤 AP: SCR-12 Invoice Detail and Evidence<br/>reasons with numbers, state In Review"]
    detail --> kind{"👤 AP: What does the<br/>reason need?"}

    kind -->|"Doubtful line<br/>or wrong flow"| fix["👤 AP: Confirm or correct in the action panel<br/>confirmed pair enters the mapping table"]
    kind -->|"Invoice seems to belong<br/>to another entity"| wrongent["👤 AP: Report wrong entity with a note<br/>the system traces the mismatch, D-68<br/>the invoice stays in its entity"]
    kind -->|"Supplier must correct"| draft["👤 AP: SCR-14 Correction Request Draft<br/>AI drafts from an approved template"]:::ai
    kind -->|"ERP data is missing"| notice["👤 AP: SCR-14 as a data-fix notice<br/>to the internal team"]:::ai
    kind -->|"Invoice cannot be used,<br/>or Unsupported: foreign invoice"| reject["👤 AP: SCR-15 Reject Invoice<br/>reason required"]
    kind -->|"Needs another role"| route["👤 AP: Send for a decision<br/>state Waiting for Decision"]
    kind -->|"Authority status unavailable"| rerun["👤 AP: SCR-10 Run lookup again<br/>AC-10.15"]
    detail -->|"Seller sent a cancellation notice<br/>for the invoice in any state"| cnote["👤 AP: SCR-19 Record Cancellation Notice<br/>reference, date, file"]

    draft --> aiok{"AI draft available?"}
    notice --> aiok
    aiok -->|"No"| blank["👤 AP: Blank approved template<br/>writes it"]
    aiok -->|"Yes"| edit["👤 AP: Edit the draft<br/>nothing is sent yet"]
    blank --> send
    edit --> send{"👤 AP: Press Send"}
    send -->|"Email fails"| notsent["Status Not sent<br/>state unchanged, retry"]
    notsent --> send
    send -->|"Sent"| waitsup["Waiting for Supplier or<br/>Waiting for Data Fix<br/>reminder after 5 working days"]
    waitsup -->|"Follow-up invoice linked<br/>or ERP data synced"| recheck
    waitsup -->|"Fresh standard invoice passes"| auto(["Closed, outcome Auto-closed<br/>original invoice Superseded"])

    wrongent -->|"Reason Wrong buyer tax code<br/>or Wrong entity reported added"| detail
    fix --> recheck["Rule Engine checks again, UC-16"]
    reject --> rejected(["Closed, outcome Rejected<br/>invoice Rejected"])
    recheck --> pass{"All six conditions hold?"}
    pass -->|"Yes"| admitted(["Closed, outcome Admitted<br/>invoice In Batch"])
    pass -->|"No"| detail

    route --> who{"Which reason?"}
    who -->|"Tax-risk hold"| hold["👤 CA: SCR-40 Decision Queue<br/>SCR-16 Release or Reject, reason required"]
    who -->|"Gate closed, unusual price,<br/>possible duplicate, split orders,<br/>new supplier, changed bank account,<br/>recurring jump"| approver["👤 PA: SCR-40 Decision Queue<br/>SCR-18 at the approver level"]
    hold -->|"Release"| recheck
    hold -->|"Reject"| rejected
    approver -->|"Approve (split orders:<br/>all linked together)"| approved(["Closed, outcome Approved individually<br/>invoice In Batch, request created at release"])
    approver -->|"Decline with reason<br/>(split orders: all linked)"| detail
    approver -->|"Conflict of duty<br/>or amount above the level"| blocked["Approval blocked with the reason<br/>another approver is needed"]

    rerun --> recheck
    cnote --> cstate{"State of the invoice"}
    cstate -->|"Waiting for Goods, exception,<br/>or In Batch in an unsigned request"| crej(["Invoice Rejected: Cancelled by the seller<br/>withdrawn from the batch, request total<br/>and level recomputed, AC-18.13, AC-18.16"])
    cstate -->|"Signed, request not yet sent"| creq(["Request Cancelled, nothing is sent<br/>its invoices become exceptions<br/>AP and CA notified, AC-18.14"])
    cstate -->|"Sent or Paid"| cwarn(["Notice stored as a warning<br/>handled outside the system, AC-18.15"])

    detail -.->|"Object changed meanwhile, BR-37"| reload["Nothing saved, input kept<br/>Reload to see the change"]
    reload --> detail

    actAp --> list
    actCa --> hold
    actPa --> approver

    classDef actor fill:none,stroke:none,color:#111
    classDef ai fill:#7b3fbf,color:#fff,stroke:#5a2d8c
```

## Flow 3: Month-end batch, signing, and payment

The AP Accountant closes the batch, checks a sample, and releases it. The Chief Accountant signs first, the Payment Approver second, and the system sends the signed request to the ERP. The AI selects the sample and writes the summary, and each has a fallback. When the sample finds errors the AP Accountant can expand it, and while no request is signed the AP Accountant can reopen the batch for review (D-95). If the 3 automatic sends fail, the AP Accountant or the Chief Accountant can resend the same signed request (D-96). A delegate signs on behalf of an absent signer (Flow 6). A cancellation notice that arrives before the send cancels the request (Flow 2).

```mermaid
flowchart TD
    actAp["<span style='font-size:40px'>👤</span><br/><b>AP Accountant</b>"]:::actor
    actCa["<span style='font-size:40px'>👤</span><br/><b>Chief Accountant</b>"]:::actor
    actPa["<span style='font-size:40px'>👤</span><br/><b>Payment Approver</b>"]:::actor
    start(["Batch state Open<br/>invoices admitted during the period"]) --> review["👤 AP: SCR-30 Batch Review"]
    review --> close["👤 AP: SCR-31 Close Batch<br/>later invoices go to the next period"]
    close --> inreview["Batch In Review"]
    inreview --> pick["AI selects the sample by risk<br/>sample size rounded up, minimum 1"]:::ai
    pick --> pickok{"AI selected?"}
    pickok -->|"No"| fallback["Highest-value invoices taken<br/>label selected without AI, DF-29"]
    pickok -->|"Yes"| marks
    fallback --> marks["👤 AP: Mark each sample item OK or Error"]
    marks --> err{"Error found?"}
    err -->|"Yes, reason required"| withdraw["Invoice withdrawn into exceptions<br/>counts for misplacement and gate alert"]
    err -->|"No"| all
    withdraw --> more{"👤 AP: Expand the sample?"}
    more -->|"Yes: reason required"| expand["👤 AP: SCR-33 Expand Sample<br/>next invoices by risk, at least the<br/>original size again, DF-65"]
    expand --> marks
    more -->|"No"| all{"Every sample item marked?"}
    all -->|"No"| marks
    all -->|"Yes"| release["👤 AP: SCR-32 Release Batch"]
    release --> insign["Batch In Signing<br/>requests Awaiting Chief Accountant"]

    insign --> notify["Notification to the Chief Accountant<br/>requests wait for your signature<br/>SCR-62, AC-32.1"]
    insign -.->|"AP: no request signed yet"| reopen["👤 AP: SCR-34 Reopen for Review<br/>reason required; requests Cancelled<br/>invoices stay In Batch, marks kept, B7"]
    reopen --> inreview
    notify --> queue["👤 CA: SCR-50 Signing Queue<br/>selects requests"]
    queue --> detail["👤 CA: SCR-51 Payment Request Detail<br/>evidence, flags, links to SCR-12"]
    detail --> summary["AI summary of the batch<br/>labelled as AI"]:::ai
    summary --> sumok{"Summary available?"}
    sumok -->|"No"| nosum["Message: summary unavailable<br/>signing goes on from the evidence"]
    sumok -->|"Yes"| decide
    nosum --> decide{"👤 CA: Sign, remove a line,<br/>or decline?"}
    decide -->|"Remove a line"| removeline["👤 CA: SCR-53 Remove Line<br/>earlier signatures voided<br/>level recomputed"]
    removeline -->|"Lines remain"| again["Request Awaiting Chief Accountant<br/>signatures voided"]
    again --> queue
    removeline -->|"No line left"| cancelled(["Request Cancelled<br/>invoices return to exceptions"])
    decide -->|"Decline"| decline["👤 CA: SCR-54 Decline Request<br/>reason required"]
    decline --> cancelled
    decide -->|"Sign"| reauth["👤 CA: SCR-52 Sign with Re-authentication<br/>password entered again<br/>a delegate signs On behalf of, Flow 6"]
    reauth -->|"Wrong password, outdated view,<br/>conflict of duty, or the signer processed<br/>an invoice of the request, BR-36"| refused["Not signed<br/>reason shown per request"]
    refused --> queue
    reauth -->|"Chief Accountant signed"| awaitpa["Request Awaiting Payment Approver"]
    reauth -->|"Chief Accountant co-signs an<br/>individually approved exception"| signed
    awaitpa --> pasign["👤 PA: at the required level<br/>signs on SCR-50 or SCR-51"]
    pasign --> signed(["Request Signed<br/>invoices Signed"])

    signed --> send["System sends to the Entity ERP<br/>as a non-cash transfer instruction"]
    send --> sendok{"ERP accepted?"}
    sendok -->|"Unavailable"| retry["Retry n of 3, 5 minutes apart, DF-24<br/>request number is the idempotency key"]
    retry -->|"Still failing after 3"| alert["Failed alert on SCR-30, SCR-50, SCR-51<br/>request stays Signed"]
    alert --> resend["👤 AP or CA: SCR-57 Resend to ERP<br/>same request number, no new signature<br/>hash checked first, marked manual, AC-26.10"]
    resend --> sendok
    retry -->|"Accepted"| paidq
    sendok -->|"Failure reply"| payfail["Invoices become exceptions<br/>reason Payment failed<br/>new request needs new signatures"]
    sendok -->|"Yes"| paidq["Invoices Sent"]
    signed -.->|"Cancellation notice before the send<br/>V20, R9, AC-18.14"| cancelled
    paidq --> paid(["ERP returns paid status<br/>invoices Paid, request Paid<br/>payment reference stored<br/>batch Completed when every request is paid"])

    actAp --> review
    actCa --> queue
    actPa --> pasign

    classDef actor fill:none,stroke:none,color:#111
    classDef ai fill:#7b3fbf,color:#fff,stroke:#5a2d8c
```

## Flow 4: Group Admin opens an automation gate

A new supplier and entity pair starts with its gate closed, so every invoice of the pair goes to an exception "Gate closed" and a person decides (D-29). In shadow mode the AI result is stored next to the person's decision, and the accuracy of the pair is the share of invoices where the person confirmed every AI result unchanged (DF-17). Nothing opens or closes by itself (D-06).

```mermaid
flowchart TD
    actGa["<span style='font-size:40px'>👤</span><br/><b>Group Admin</b>"]:::actor
    actAp["<span style='font-size:40px'>👤</span><br/><b>AP Accountant</b>"]:::actor
    start(["👤 GA: logs in<br/>SCR-75 Group Overview"]) --> alerts{"👤 GA: Gate alert<br/>or pair to review?"}
    alerts -->|"Open the gates"| gates["👤 GA: SCR-78 Automation Gates<br/>state, compared count, accuracy vs 98%"]:::ai
    alerts -->|"No"| done1(["Nothing to do"])
    gates --> figs{"Accuracy figure<br/>available?"}
    figs -->|"No compared invoices yet"| noopen["Open disabled<br/>At least 50 compared invoices are needed"]
    figs -->|"Yes"| count{"50 or more<br/>compared invoices?"}
    count -->|"No"| noopen
    count -->|"Yes"| thr{"Accuracy at or above 98%?"}
    thr -->|"Yes"| confirm["👤 GA: SCR-79 Open or Close Gate<br/>confirm"]
    thr -->|"No"| reason["👤 GA: SCR-79 with a written reason<br/>required to open"]
    reason --> confirm
    confirm --> opened(["Gate open for the pair<br/>opening, accuracy, reason in the audit log"])
    noopen --> wait(["Gate stays closed<br/>people keep deciding invoices of the pair"])

    seed[("Demo: seeded history of 50 compared invoices,<br/>49 confirmed unchanged, 98.0%<br/>label Simulated history, DF-33")] -.-> gates

    opened --> later["Later invoices of the pair<br/>can reach condition 5 of BR-05"]
    later --> sample["👤 AP: Sample checks on open pairs<br/>20 or more sampled in 30 days"]
    sample --> rate{"Error rate above 2%?"}
    rate -->|"No"| keep(["Gate stays open"])
    rate -->|"Yes"| warn["Alert recommends closing the gate<br/>gate stays open until the Group Admin acts"]
    warn --> gates
    gates -->|"Close"| closed(["Gate closed<br/>later invoices become exceptions Gate closed<br/>invoices already in a batch stay"])

    actGa --> start
    actAp -.-> sample

    classDef actor fill:none,stroke:none,color:#111
    classDef ai fill:#7b3fbf,color:#fff,stroke:#5a2d8c
```

## Flow 5: Requesting Department confirms a service acceptance

For a service invoice with no acceptance in the ERP, a user of the Requesting Department of the entity confirms or rejects the acceptance with a note (UC-29, D-90). A confirmation counts as the independent acceptance source (BR-19), and the ERP acceptance wins if both exist. A rejection makes the exception "Service acceptance rejected", which is never approved individually (D-31).

```mermaid
flowchart TD
    actRd["<span style='font-size:40px'>👤</span><br/><b>Requesting Department</b>"]:::actor
    actAp["<span style='font-size:40px'>👤</span><br/><b>AP Accountant</b>"]:::actor
    start(["Service invoice for order PO-CF-1020<br/>no acceptance in the ERP<br/>state Waiting for Goods"]) --> queue["👤 RD: SCR-22 Acceptance Queue<br/>service invoices of the own entity"]
    queue --> modal["👤 RD: SCR-23 Confirm or Reject Acceptance<br/>invoice, order, service lines, amount"]
    modal --> creator{"Linked to the ERP user who<br/>created the order?"}
    creator -->|"Yes"| blocked["Blocked: You created the order<br/>for this invoice, BR-02"]
    creator -->|"No"| erp{"ERP acceptance exists now?"}
    erp -->|"Yes"| gone(["ERP acceptance is used<br/>invoice leaves the queue<br/>confirmation stays in the history, AC-29.4"])
    erp -->|"No"| choice{"👤 RD: Confirm or reject?"}
    choice -->|"Confirm with a note"| saved["Acceptance saved with user, time, note<br/>audit log entry, AC-29.9"]
    saved --> recheck["Rule Engine checks again, UC-16"]
    recheck --> pass{"All six conditions hold?"}
    pass -->|"Yes"| inbatch(["In Batch<br/>open batch of the entity"])
    pass -->|"No"| exc(["Exception, state Open<br/>failed conditions with their values"])
    choice -->|"Reject"| hasnote{"Note given?"}
    hasnote -->|"No"| refused["Refused: a note is required"]
    refused --> modal
    hasnote -->|"Yes"| rej(["Exception Service acceptance rejected<br/>cannot be approved individually, D-31"])
    rej --> notice["Notification to the AP Accountant<br/>SCR-62, AC-29.3"]
    modal -.->|"Invoice changed meanwhile, BR-37"| reload["Nothing saved<br/>Reload to see the change"]
    reload --> queue

    actRd --> queue
    actAp -.-> notice

    classDef actor fill:none,stroke:none,color:#111
```

## Flow 6: Signing delegation

A Chief Accountant or Payment Approver who will be absent names a delegate of the same entity for a date range (UC-30, D-91, BR-38). The delegate signs at the level of the delegator only inside the range, and every rule of separation still applies to the delegate. Whether a delegated e-signature is legally valid is Unverified (O-17).

```mermaid
flowchart TD
    actCa["<span style='font-size:40px'>👤</span><br/><b>Chief Accountant</b>"]:::actor
    actPa["<span style='font-size:40px'>👤</span><br/><b>Payment Approver</b>"]:::actor
    actEa["<span style='font-size:40px'>👤</span><br/><b>Entity Admin</b>"]:::actor
    start(["Chief Accountant will be absent<br/>from 2026-11-10 to 2026-11-14"]) --> newd["👤 CA: SCR-55 Signing Delegations<br/>opens SCR-56 New Delegation"]
    newd --> valid{"Delegate is an active CA or PA of the entity,<br/>range up to 30 days, starts today or later,<br/>no overlap with another delegation?"}
    valid -->|"No"| errors["Error shown next to the field<br/>nothing is saved, AC-30.6, AC-30.7"]
    errors --> newd
    valid -->|"Yes"| saved["Delegation saved, audit log entry<br/>state Scheduled, then Active in the range"]
    saved --> active["Active: the delegator's own signing is disabled<br/>You delegated signing until 2026-11-14"]
    active --> queue["👤 PA as delegate: SCR-50 Signing Queue<br/>requests marked On behalf of Carol"]
    queue --> sign["👤 PA as delegate: SCR-52 Sign with Re-authentication<br/>own password entered again"]
    sign --> check{"Also the second signer of the request,<br/>linked to the order creator,<br/>or processed an invoice of it?"}
    check -->|"Yes"| blocked["Blocked, BR-02 and BR-36"]
    check -->|"No"| record(["Signature record: signer Dan on behalf of Carol<br/>version and content hash, AC-30.2, AC-30.10"])
    active -.->|"Last day passes"| ended(["Ended: the delegate can no longer sign"])
    active -.->|"👤 CA revokes, or 👤 EA revokes"| revoked(["Revoked: signatures already given stay valid<br/>AC-30.9"])

    actCa --> newd
    actPa --> queue
    actEa -.-> revoked

    classDef actor fill:none,stroke:none,color:#111
```

## Flow 7: Notification click-through

In-app notifications exist for the AP Accountant, the Chief Accountant, and the Payment Approver (UC-32, D-97). They are never emailed to staff, and a notification that cannot be saved never stops the action that caused it.

```mermaid
flowchart TD
    actAp["<span style='font-size:40px'>👤</span><br/><b>AP Accountant</b>"]:::actor
    actCa["<span style='font-size:40px'>👤</span><br/><b>Chief Accountant</b>"]:::actor
    start(["Event: batch released, new exception,<br/>request returned, or a reminder is due"]) --> create["System creates a notification for the recipient<br/>in the same entity, DF-67"]
    create --> saveok{"Saved?"}
    saveok -->|"No"| logged["The action still completes<br/>the failure is logged, AC-32.9"]
    saveok -->|"Yes"| count["Top bar shows Notifications 1<br/>no email to staff, AC-32.8"]
    count --> list["👤 AP or CA: SCR-62 Notifications<br/>filter Unread only"]
    list --> open["👤 AP or CA: opens an item"]
    open --> object["The object opens: SCR-12, SCR-30,<br/>SCR-50, or SCR-51<br/>item marked read, the count falls, AC-32.6"]
    object --> done{"Work done?"}
    done -->|"No, it is a reminder"| again["Reminder repeats once a day<br/>until the work is done, DF-67"]
    again --> create
    done -->|"Yes"| stop(["No more reminders for this item"])

    actAp --> list
    actCa --> list

    classDef actor fill:none,stroke:none,color:#111
```

**Related:** [Step index](README.md) · [Screen inventory](04-screen-inventory.md) · [UI states](06-ui-states-and-accessibility.md) · [Business rules](../requirements/business-rules.md)
