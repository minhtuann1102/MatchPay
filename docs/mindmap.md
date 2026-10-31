# MatchPay Product Mind Map

> Design status: MVP — Step 1 of 9, draft for review
>
> Implementation status: NOT STARTED

The mind map replaces a drawn image. It is written in English, like all documentation (D-01). Solid branches are in the MVP; the branch "Advanced" is designed but not built.

```mermaid
mindmap
  root((MatchPay))
    Problem
      P-01 Manual matching of invoice, order, and receipt
      P-02 Item names and units differ
      P-03 Risky suppliers and wrong buying entity
      P-04 Approval by email and chat with no matrix
    Users
      AP Accountant
      Chief Accountant
      Payment Approver
      Group Admin and Entity Admin
      Demo Operator in the demo only
    Core flow
      Invoice arrives
      AI reads and matches
      Rule Engine checks six conditions
      Batch or exception
      Sample check
      Sign consolidated requests per supplier
      Signed batch to the ERP
    AI tasks
      Classify the flow
      Read the document
      Identify entity and order
      Match lines
      Detect anomalies
      Handle exceptions
      Select the sample
      Prepare the signer
    Controls
      One entity per document
      Separation of duties
      Approval matrix per entity
      Automation gate with shadow mode
      Audit log of every AI decision
      Entity isolation
    Goals
      G-01 Touchless rate
      G-02 AI misplacement rate
      G-03 Split orders caught
      G-04 Duplicates caught
      G-05 One minute per invoice
      G-06 No data leaks
      G-07 Lines matched without the LLM
    Advanced
      Automatic gate switching
      Cross-entity anomalies
      Card subscriptions
      Mid-period batches
      Mobile approval
      Foreign invoices and PDF intake
      Foreign tax duties
      Cash payment flag
    Out of scope
      Real bank payment
      Tax filing
      Replacing the ERP
      AI signing
```

**Related:** [README](../README.md) · [Step 1 index](01-research/README.md)
