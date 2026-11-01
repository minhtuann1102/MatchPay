# MatchPay Product Mind Map

> Design status: MVP — approved
>
> Implementation status: NOT STARTED

The mind map replaces a drawn image. It is written in English, like all documentation (D-01). Solid branches are in the MVP; the branch "Advanced" is designed but not built. This page has two maps: the product map below, and the [feature map F01..F12](#feature-map-f01f12), which mirrors the feature mind map the user attached on 2026-11-01 (D-88).

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
      Requesting Department confirms service acceptance
      Group Admin and Entity Admin
      Demo Operator in the demo only
    Core flow
      Invoice arrives by upload or by email
      Status checked at the tax authority
      AI reads and matches
      Rule Engine checks six conditions
      Batch or exception
      Sample check
      Sign consolidated requests per supplier
      Signed batch to the ERP
      Notifications and reminders
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
      No signing of invoices you processed
      Signing delegation while absent
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
      Supplier portal
      Real connection to the tax authority
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

## Feature map (F01..F12)

This English Mermaid map mirrors the user's final feature mind map, which the user confirmed on 2026-11-01 (D-88). The original image is [feature-mind-map.png](images/source/feature-mind-map.png) and is embedded below. The image is in Vietnamese because it is a source document, like the brief; it is not translated or edited.

![The user's final feature mind map (Vietnamese source image)](images/source/feature-mind-map.png)

The Mermaid map is the English reading of it. Each leaf carries the use case or story that delivers it. Leaves marked NEW were added by the sync to that mind map (D-88); leaves marked EXTENDED existed and gained behaviour. Everything in this map is in the MVP.

```mermaid
mindmap
  root((MatchPay feature map))
    F01 Log in and permissions
      Log in and log out UC-01
      Permissions by role and entity UC-02
        Accountant
        Approver
        Requesting Department UC-29 NEW
        Administrator
      Block signing invoices you processed BR-36 NEW
    F02 System administration
      Manage users UC-02
      Manage entities UC-03
      Policy and variance threshold UC-04
      Approval matrix UC-05
      Signing delegation while absent UC-30 NEW
    F03 Source data
      Sync documents from the ERP UC-07
      Suppliers and bank accounts UC-07
      Tax risk list UC-07
      Recurring profiles UC-09
    F04 Invoice intake and validation
      Upload XML invoice UC-10
      Receive invoices by email UC-31 NEW
      Extract invoice data UC-13
      Validity checks UC-10
        Digital signature
        Tax code
        Duplicate invoice
        Status at the tax authority BR-39 NEW
      Replacement adjustment and cancelled invoices BR-31 EXTENDED
      Identify the buying entity UC-13
    F05 Classification and matching
      Classify the invoice UC-12
        Goods
        Services
        Recurring
      Match by type UC-14
        Goods three way match
        Services acceptance by the using department UC-29 NEW
        Recurring against the profile
      Anomaly analysis UC-15
        Warn when the bank account changes
      Route to batch or exception UC-16
    F06 Exception handling
      List and evidence UC-17
      Confirm or edit the AI result UC-18
      AI drafts the request and the accountant sends UC-19
      Automatic re-check of a new invoice UC-20
      Remove the invoice from the payment flow with a reason UC-18
    F07 Payment batch
      Close the batch by period and due date UC-24
      AI selects the sample by risk UC-24
      Accountant checks the sample UC-24
      When the sample fails UC-24 EXTENDED
        Remove the invoice
        Reopen the batch
        Expand the sample
      AI summary of the batch for the signer UC-25
    F08 Signing
      Sign the request per supplier UC-25
      Sign many requests at once UC-25
      Approve each exception UC-23
      Reject or return with a reason UC-25
      Send the signed batch to the ERP UC-26
      Track the ERP send UC-26 EXTENDED
        Error
        Resend
        Paid
    F09 Monitoring and automation control
      Accuracy in shadow mode UC-06
      Switch on or off per supplier and entity UC-06
      Warn when the sample finds errors UC-06
      Switch to manual handling UC-06
    F10 Invoice lookup
      List and search all invoices UC-17 EXTENDED
      State and history of each invoice UC-17 EXTENDED
      Open an invoice from a batch or request UC-17 EXTENDED
    F11 Notifications and reminders
      Batch ready and waiting for signature UC-32 NEW
      New exception or returned request UC-32 NEW
      Overdue reminder UC-32 NEW
    F12 Reports and log
      Share of invoices without individual review UC-27
      AI misplacement rate UC-27
      Backlog of exceptions UC-27
      Audit log UC-28
```

Kept in the documents although the feature map does not show them: the ERP simulator and the Demo Operator (UC-08, demo only), the tax-risk hold (UC-21), split-order handling (BR-10), employee-expense invoices (BR-23), and group limits (UC-03). See D-99 in the [Requirements decisions](02-usecases-userstories/00-decisions.md#sync-to-the-feature-mind-map-user-decision-d-88-2026-11-01).

**Related:** [README](../README.md) · [Research index](01-research/README.md)
