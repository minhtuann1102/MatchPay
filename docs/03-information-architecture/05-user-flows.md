# Primary User Flows

> Design status: MVP — Step 3 of 9, draft for review
>
> Implementation status: NOT STARTED

Four flows cover the path of an invoice from the demo set-up to payment, and the one admin decision that the whole chain depends on. In every flow a **purple** step uses the AI, and every purple step has a failure path that leaves a person able to continue (BR-27, DF-08). State names are the exact names of BR-33 (invoice), BR-34 (exception), and BR-35 (batch and payment request).

## Flow 1: Demo set-up and invoice intake

Where the demo data comes from: the Calderwood Group, its three entities, and the sample people are seeded (DF-12). Orders and receipts are created by the Demo Operator in SCR-80 and reach MatchPay only through the sync (US-07). The tax-risk list entry for Eastbay Trading arrives through the same sync as a simulated feed with a source and a date (D-28). The compared history that lets a gate open is seeded (DF-33), and so are the price history and the earlier recurring periods that the price and recurring checks need (DF-42). Nothing in the chain waits for data that no step provides.

```mermaid
flowchart TD
    start(["Seeded demo: Calderwood Group,<br/>3 entities, sample people, histories"]) --> sim["SCR-80 ERP Simulator<br/>Demo Operator picks entity and persona"]
    sim --> po["SCR-81 Purchase Order Form<br/>buyer persona creates the order"]
    po --> grn["SCR-82 Receipt or Acceptance Form<br/>warehouse keeper or acceptor persona"]
    grn --> same{"Same persona as<br/>the order creator?"}
    same -->|"Yes: refused, BR-02"| grn
    same -->|"No"| stored[("Simulated ERP<br/>order and receipt stored")]
    stored --> sync["Sync every 15 minutes, DF-31<br/>records stored with sync time"]
    sync --> erpok{"ERP reachable?"}
    erpok -->|"No"| stale["Earlier data kept<br/>SCR-10 shows last sync time<br/>and a stale warning"]
    erpok -->|"Yes"| fresh["Source data current<br/>tax-risk feed loaded"]
    fresh --> upload
    stale --> upload
    upload["SCR-10 Invoice Worklist<br/>AP Accountant opens SCR-11 Upload XML"] --> files["Per-file result<br/>Accepted or Rejected with reason"]
    files -->|"Signature fails, XML not supported,<br/>buyer tax code of another entity,<br/>exact duplicate"| rejected(["Rejected<br/>reason shown, original kept"])
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
    rules -->|"No receipt yet"| wait(["Waiting for Goods<br/>checked again when a receipt is synced"])
    rules -->|"Employee expense"| sep(["Separated<br/>list Waiting for reimbursement file"])
    rules -->|"Tax code mismatch<br/>or exact duplicate"| rejected2(["Rejected"])
    aifail --> exc
    wait -->|"Receipt synced: back to In Check"| rules

    classDef ai fill:#7b3fbf,color:#fff,stroke:#5a2d8c
    style background fill:#f8fbff,stroke:#1168bd,stroke-dasharray:5 5
```

## Flow 2: AP Accountant resolves an exception

An exception holds one or more reasons. The AP Accountant resolves them one by one, and after every resolution the Rule Engine checks the invoice again from the stored evidence (UC-16). Three reasons cannot be settled by the AP Accountant and go to other roles: a tax-risk hold and foreign tax duties to the Chief Accountant, and an individual approval to the Payment Approver.

```mermaid
flowchart TD
    start(["Exception, state Open<br/>badge on the Invoices item"]) --> list["SCR-10 Invoice Worklist<br/>filter by state Exception"]
    list --> detail["SCR-12 Invoice Detail and Evidence<br/>reasons with numbers, state In Review"]
    detail --> kind{"What does the<br/>reason need?"}

    kind -->|"Doubtful line, wrong entity,<br/>or wrong flow"| fix["Confirm or correct in the action panel<br/>confirmed pair enters the mapping table"]
    kind -->|"Supplier must correct"| draft["SCR-14 Correction Request Draft<br/>AI drafts from an approved template"]:::ai
    kind -->|"ERP data is missing"| notice["SCR-14 as a data-fix notice<br/>to the internal team"]:::ai
    kind -->|"Invoice cannot be used"| reject["SCR-15 Reject Invoice<br/>reason required"]
    kind -->|"Needs another role"| route["Send for a decision<br/>state Waiting for Decision"]

    draft --> aiok{"AI draft available?"}
    notice --> aiok
    aiok -->|"No"| blank["Blank approved template<br/>AP Accountant writes it"]
    aiok -->|"Yes"| edit["Edit the draft<br/>nothing is sent yet"]
    blank --> send
    edit --> send{"Press Send"}
    send -->|"Email fails"| notsent["Status Not sent<br/>state unchanged, retry"]
    notsent --> send
    send -->|"Sent"| waitsup["Waiting for Supplier or<br/>Waiting for Data Fix<br/>reminder after 5 working days"]
    waitsup -->|"Follow-up invoice linked<br/>or ERP data synced"| recheck
    waitsup -->|"Fresh standard invoice passes"| auto(["Closed, outcome Auto-closed<br/>original invoice Superseded"])

    fix --> recheck["Rule Engine checks again, UC-16"]
    reject --> rejected(["Closed, outcome Rejected<br/>invoice Rejected"])
    recheck --> pass{"All six conditions hold?"}
    pass -->|"Yes"| admitted(["Closed, outcome Admitted<br/>invoice In Batch"])
    pass -->|"No"| detail

    route --> who{"Which reason?"}
    who -->|"Tax-risk hold"| hold["SCR-40 Decision Queue, Chief Accountant<br/>SCR-16 Release or Reject, reason required"]
    who -->|"Foreign tax duty"| foreign["AP attaches documents on SCR-12<br/>SCR-17 Chief Accountant records the outcome"]
    who -->|"Gate closed, unusual price,<br/>possible duplicate, split orders,<br/>new supplier, changed bank account,<br/>recurring jump"| approver["SCR-40 Decision Queue, Payment Approver<br/>SCR-18 at the approver level"]
    hold -->|"Release"| recheck
    hold -->|"Reject"| rejected
    foreign -->|"Outcome saved"| recheck
    approver -->|"Approve"| approved(["Closed, outcome Approved individually<br/>single-invoice request, invoice In Batch"])
    approver -->|"Decline with reason"| detail
    approver -->|"Conflict of duty<br/>or amount above the level"| blocked["Approval blocked with the reason<br/>another approver is needed"]

    detail -.->|"Object changed meanwhile, BR-37"| reload["Nothing saved, input kept<br/>Reload to see the change"]
    reload --> detail

    classDef ai fill:#7b3fbf,color:#fff,stroke:#5a2d8c
```

## Flow 3: Month-end batch, signing, and payment

The AP Accountant closes the batch, checks a sample, and releases it. The Chief Accountant signs first, the Payment Approver second, and the system sends the signed request to the ERP. The AI selects the sample and writes the summary, and each has a fallback.

```mermaid
flowchart TD
    start(["Batch state Open<br/>invoices admitted during the period"]) --> review["SCR-30 Batch Review<br/>AP Accountant"]
    review --> close["SCR-31 Close Batch<br/>later invoices go to the next period"]
    close --> inreview["Batch In Review"]
    inreview --> pick["AI selects the sample by risk<br/>sample size rounded up, minimum 1"]:::ai
    pick --> pickok{"AI selected?"}
    pickok -->|"No"| fallback["Highest-value invoices taken<br/>label selected without AI, DF-29"]
    pickok -->|"Yes"| marks
    fallback --> marks["Mark each sample item OK or Error"]
    marks --> err{"Error found?"}
    err -->|"Yes, reason required"| withdraw["Invoice withdrawn into exceptions<br/>counts for misplacement and gate alert"]
    err -->|"No"| all
    withdraw --> all{"Every sample item marked?"}
    all -->|"No"| marks
    all -->|"Yes"| release["SCR-32 Release Batch"]
    release --> insign["Batch In Signing<br/>requests Awaiting Chief Accountant"]

    insign --> queue["SCR-50 Signing Queue<br/>Chief Accountant selects requests"]
    queue --> detail["SCR-51 Payment Request Detail<br/>evidence, flags, links to SCR-12"]
    detail --> summary["AI summary of the batch<br/>labelled as AI"]:::ai
    summary --> sumok{"Summary available?"}
    sumok -->|"No"| nosum["Message: summary unavailable<br/>signing goes on from the evidence"]
    sumok -->|"Yes"| decide
    nosum --> decide{"Sign, remove a line,<br/>or decline?"}
    decide -->|"Remove a line"| removeline["SCR-53 Remove Line<br/>earlier signatures voided<br/>level recomputed"]
    removeline -->|"Lines remain"| again["Request Awaiting Chief Accountant<br/>signatures voided"]
    again --> queue
    removeline -->|"No line left"| cancelled(["Request Cancelled<br/>invoices return to exceptions"])
    decide -->|"Decline"| decline["SCR-54 Decline Request<br/>reason required"]
    decline --> cancelled
    decide -->|"Sign"| reauth["SCR-52 Sign with Re-authentication<br/>password entered again"]
    reauth -->|"Wrong password,<br/>outdated view, conflict of duty"| refused["Not signed<br/>reason shown per request"]
    refused --> queue
    reauth -->|"Chief Accountant signed"| awaitpa["Request Awaiting Payment Approver"]
    reauth -->|"Chief Accountant co-signs an<br/>individually approved exception"| signed
    awaitpa --> pasign["Payment Approver at the required level<br/>signs on SCR-50 or SCR-51"]
    pasign --> signed(["Request Signed<br/>invoices Signed"])

    signed --> send["System sends to the Entity ERP<br/>as a non-cash transfer instruction"]
    send --> sendok{"ERP accepted?"}
    sendok -->|"Unavailable"| retry["Retry n of 3, 5 minutes apart, DF-24<br/>request number is the idempotency key"]
    retry -->|"Still failing after 3"| alert["Failed alert on SCR-30, SCR-50, SCR-51<br/>request stays Signed"]
    retry -->|"Accepted"| paidq
    sendok -->|"Failure reply"| payfail["Invoices become exceptions<br/>reason Payment failed<br/>new request needs new signatures"]
    sendok -->|"Yes"| paidq["Invoices Sent"]
    paidq --> paid(["ERP returns paid status<br/>invoices Paid, request Paid<br/>method and reference stored<br/>batch Completed when every request is paid"])

    classDef ai fill:#7b3fbf,color:#fff,stroke:#5a2d8c
```

## Flow 4: Group Admin opens an automation gate

A new supplier and entity pair starts with its gate closed, so every invoice of the pair goes to an exception "Gate closed" and a person decides (D-29). In shadow mode the AI result is stored next to the person's decision, and the accuracy of the pair is the share of invoices where the person confirmed every AI result unchanged (DF-17). Nothing opens or closes by itself (D-06).

```mermaid
flowchart TD
    start(["Group Admin logs in<br/>SCR-75 Group Overview"]) --> alerts{"Gate alert<br/>or pair to review?"}
    alerts -->|"Open the gates"| gates["SCR-78 Automation Gates<br/>state, compared count, accuracy vs 98%"]:::ai
    alerts -->|"No"| done1(["Nothing to do"])
    gates --> figs{"Accuracy figure<br/>available?"}
    figs -->|"No compared invoices yet"| noopen["Open disabled<br/>At least 50 compared invoices are needed"]
    figs -->|"Yes"| count{"50 or more<br/>compared invoices?"}
    count -->|"No"| noopen
    count -->|"Yes"| thr{"Accuracy at or above 98%?"}
    thr -->|"Yes"| confirm["SCR-79 Open or Close Gate<br/>confirm"]
    thr -->|"No"| reason["SCR-79 with a written reason<br/>required to open"]
    reason --> confirm
    confirm --> opened(["Gate open for the pair<br/>opening, accuracy, reason in the audit log"])
    noopen --> wait(["Gate stays closed<br/>people keep deciding invoices of the pair"])

    seed[("Demo: seeded history of 50 compared invoices,<br/>49 confirmed unchanged, 98.0%<br/>label Simulated history, DF-33")] -.-> gates

    opened --> later["Later invoices of the pair<br/>can reach condition 5 of BR-05"]
    later --> sample["Sample checks on open pairs, AP Accountant<br/>20 or more sampled in 30 days"]
    sample --> rate{"Error rate above 2%?"}
    rate -->|"No"| keep(["Gate stays open"])
    rate -->|"Yes"| warn["Alert recommends closing the gate<br/>gate stays open until the Group Admin acts"]
    warn --> gates
    gates -->|"Close"| closed(["Gate closed<br/>later invoices become exceptions Gate closed<br/>invoices already in a batch stay"])

    classDef ai fill:#7b3fbf,color:#fff,stroke:#5a2d8c
```

**Related:** [Step index](README.md) · [Screen inventory](04-screen-inventory.md) · [UI states](06-ui-states-and-accessibility.md) · [Business rules](../requirements/business-rules.md)
