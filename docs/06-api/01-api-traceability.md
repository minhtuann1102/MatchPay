# API Traceability and Cross-check

> Design status: MVP — Step 6 of 9, draft for review
>
> Implementation status: NOT STARTED

This page is the Step 6 cross-check of the [OpenAPI contract](openapi.yaml). Every active user story has at least one operation, every operation names stories, business rules, screens, and database tables (`x-stories`, `x-rules`, `x-screens`, `x-tables`, D-134), and every table of the [DBML schema](../05-database/matchpay.dbml) is used by an operation or written by a background job. Work that is not HTTP is listed as a job (D-135). The checker `tools/check_docs.py` compares sections 1, 2, 3, 5, 6, and 7 of this page with `openapi.yaml`, so change both together.

Section 3 cannot say for each operation whether it only reads a table: an operation that changes data lists every table it writes or reads to decide, and is shown in the first column. An operation that is a GET is shown in the second column.

## 1. Stories and their operations

| US | Operations | Jobs |
|---|---|---|
| US-01 | `login`, `logout`, `getSession`, `getInvoice` | — |
| US-02 | `listUsers`, `createUser`, `getUser`, `updateUser`, `deactivateUser`, `listErpUsers` | — |
| US-03 | `getGroup`, `updateGroupLimits`, `listSectors`, `addSector`, `removeSector`, `listEntities`, `createEntity` | — |
| US-04 | `getGroup`, `getEntityPolicy`, `updateEntityPolicy` | — |
| US-05 | `getApprovalMatrix`, `replaceApprovalMatrix` | — |
| US-06 | `listGates`, `getGate`, `openGate`, `closeGate`, `confirmAiResults`, `markSampleItem`, `getGroupOverview` | Demo seed loader |
| US-07 | `getErpSyncStatus`, `listErpSyncRuns`, `startErpSync`, `getErpSyncRun`, `listErpSyncRejections`, `getWorklistSummary`, `getGroupOverview` | Scheduled ERP sync, Authority status lookup, Demo seed loader |
| US-08 | `getSimMasterData`, `listSimPurchaseOrders`, `createSimPurchaseOrder`, `getSimPurchaseOrder`, `listSimReceipts`, `confirmSimReceipt` | Demo seed loader |
| US-09 | `listSuppliers`, `listRecurringProfiles`, `createRecurringProfile`, `getRecurringProfile`, `updateRecurringProfile`, `deactivateRecurringProfile` | — |
| US-10 | `uploadInvoices`, `listInvoices`, `getInvoice`, `downloadInvoiceDocument`, `runAuthorityLookup`, `listAuthorityStatusLookups` | Check run, Authority status lookup |
| US-11 | Removed (D-33) | — |
| US-12 | `getInvoiceEvidence`, `rerunChecks`, `getCheckRun`, `correctFlow`, `rejectInvoice` | Check run |
| US-13 | `getInvoiceEvidence`, `getCheckRun`, `confirmEntity` | Check run |
| US-14 | `listErpItems`, `listInvoiceLines`, `getInvoiceEvidence`, `getCheckRun` | Check run |
| US-15 | `getInvoiceEvidence`, `getCheckRun` | Check run |
| US-16 | `getInvoiceEvidence`, `listCheckRuns`, `rerunChecks`, `getCheckRun`, `getCurrentBatch` | Check run |
| US-17 | `listSuppliers`, `listInvoices`, `getWorklistSummary`, `getInvoice`, `downloadInvoiceDocument`, `listInvoiceLines`, `getInvoiceHistory`, `getInvoiceEvidence`, `listCheckRuns`, `listCancellationNotices`, `listBatchItems`, `getPaymentRequest` | — |
| US-18 | `listErpItems`, `listExceptions`, `getException`, `takeException`, `confirmLineMatch`, `correctFlow`, `confirmEntity`, `reportWrongEntity`, `confirmAiResults`, `rejectInvoice`, `sendForDecision`, `confirmFollowUp`, `recordCancellationNotice`, `listCancellationNotices`, `downloadCancellationNotice` | — |
| US-19 | `listMessageTemplates`, `draftCorrectionRequest`, `listCorrectionRequests`, `getCorrectionRequest`, `updateCorrectionRequest`, `sendCorrectionRequest`, `recordCorrectionReply` | Daily reminder job |
| US-20 | `listFollowUps`, `confirmFollowUp` | Check run |
| US-21 | `getException`, `getDecisionQueue`, `decideTaxRiskHold` | — |
| US-22 | Removed (D-33) | — |
| US-23 | `getException`, `getDecisionQueue`, `sendForDecision`, `decideIndividualApproval` | — |
| US-24 | `getCurrentBatch`, `listBatches`, `getBatch`, `listBatchItems`, `closeBatchForReview`, `getBatchSample`, `markSampleItem`, `expandSample`, `releaseBatch`, `reopenBatch`, `withdrawInvoiceFromBatch`, `listBatchRequests` | — |
| US-25 | `getInvoiceEvidence`, `listPaymentRequests`, `getPaymentRequest`, `signPaymentRequests`, `removeRequestLine`, `declineRequest` | AI payment summary |
| US-26 | `getInvoiceEvidence`, `listBatchRequests`, `listPaymentRequests`, `getPaymentRequest`, `listErpSendAttempts`, `resendToErp` | ERP send worker |
| US-27 | `getDashboard`, `listDashboardFigureInvoices`, `getGroupDashboard` | — |
| US-28 | `listAuditEntries`, `getAuditEntry` | — |
| US-29 | `getInvoiceEvidence`, `listAcceptanceQueue`, `getAcceptanceQueueItem`, `decideServiceAcceptance` | Check run |
| US-30 | `listDelegations`, `createDelegation`, `listDelegateCandidates`, `getDelegation`, `revokeDelegation`, `getInvoiceEvidence`, `listPaymentRequests`, `getPaymentRequest`, `signPaymentRequests` | — |
| US-31 | `listInvoices`, `getMailboxStatus`, `listMailboxMessages`, `getMailboxMessage`, `startMailboxFetch`, `getMailboxFetchRun` | Mailbox fetch |
| US-32 | `recordCorrectionReply`, `listNotifications`, `getUnreadNotificationCount`, `markNotificationRead` | Daily reminder job |

## 2. Operations

`public` means no session is needed. Roles are the values of the DBML enum `user_role`; finer rules (own entity, own level, own delegation, BR-02, BR-36) are in the description of each operation (D-133).

| operationId | Method and path | Roles | Stories | Tables | Screens |
|---|---|---|---|---|---|
| `login` | POST `/auth/login` | public | US-01 | `users`, `audit_log` | SCR-01 |
| `logout` | POST `/auth/logout` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT, PAYMENT_APPROVER, REQUESTING_DEPARTMENT, ENTITY_ADMIN, GROUP_ADMIN, DEMO_OPERATOR | US-01 | `users`, `audit_log` | SCR-01 |
| `getSession` | GET `/auth/session` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT, PAYMENT_APPROVER, REQUESTING_DEPARTMENT, ENTITY_ADMIN, GROUP_ADMIN, DEMO_OPERATOR | US-01 | `users`, `entities` | SCR-01, SCR-90 |
| `listUsers` | GET `/users` | ENTITY_ADMIN, GROUP_ADMIN | US-02 | `users`, `entities`, `erp_users` | SCR-70 |
| `createUser` | POST `/users` | ENTITY_ADMIN, GROUP_ADMIN | US-02 | `users`, `entities`, `erp_users`, `audit_log` | SCR-71 |
| `getUser` | GET `/users/{userId}` | ENTITY_ADMIN, GROUP_ADMIN | US-02 | `users`, `erp_users`, `entities` | SCR-70, SCR-71 |
| `updateUser` | PATCH `/users/{userId}` | ENTITY_ADMIN, GROUP_ADMIN | US-02 | `users`, `erp_users`, `audit_log` | SCR-71 |
| `deactivateUser` | POST `/users/{userId}/deactivate` | ENTITY_ADMIN, GROUP_ADMIN | US-02 | `users`, `audit_log` | SCR-72 |
| `listErpUsers` | GET `/erp-users` | ENTITY_ADMIN, GROUP_ADMIN | US-02 | `erp_users`, `entities` | SCR-71 |
| `getGroup` | GET `/group` | GROUP_ADMIN, ENTITY_ADMIN | US-03, US-04 | `corporate_groups` | SCR-73, SCR-76 |
| `updateGroupLimits` | PATCH `/group/limits` | GROUP_ADMIN | US-03 | `corporate_groups`, `entity_policies`, `entities`, `audit_log` | SCR-76 |
| `listSectors` | GET `/group/sectors` | GROUP_ADMIN | US-03 | `group_sectors` | SCR-76 |
| `addSector` | POST `/group/sectors` | GROUP_ADMIN | US-03 | `group_sectors`, `audit_log` | SCR-76 |
| `removeSector` | DELETE `/group/sectors/{sectorId}` | GROUP_ADMIN | US-03 | `group_sectors`, `audit_log` | SCR-76 |
| `listEntities` | GET `/entities` | GROUP_ADMIN | US-03 | `entities`, `corporate_groups` | SCR-76 |
| `createEntity` | POST `/entities` | GROUP_ADMIN | US-03 | `entities`, `entity_policies`, `corporate_groups`, `audit_log` | SCR-77 |
| `getEntityPolicy` | GET `/entity/policy` | ENTITY_ADMIN | US-04 | `entity_policies`, `corporate_groups` | SCR-73 |
| `updateEntityPolicy` | PUT `/entity/policy` | ENTITY_ADMIN | US-04 | `entity_policies`, `corporate_groups`, `audit_log` | SCR-73 |
| `getApprovalMatrix` | GET `/entity/approval-matrix` | ENTITY_ADMIN | US-05 | `approval_tiers`, `approval_tier_approvers`, `entities`, `users` | SCR-74 |
| `replaceApprovalMatrix` | PUT `/entity/approval-matrix` | ENTITY_ADMIN | US-05 | `approval_tiers`, `approval_tier_approvers`, `entities`, `users`, `payment_requests`, `audit_log` | SCR-74 |
| `listDelegations` | GET `/delegations` | CHIEF_ACCOUNTANT, PAYMENT_APPROVER, ENTITY_ADMIN | US-30 | `signing_delegations`, `users` | SCR-55 |
| `createDelegation` | POST `/delegations` | CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-30 | `signing_delegations`, `users`, `audit_log` | SCR-56 |
| `listDelegateCandidates` | GET `/delegations/candidates` | CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-30 | `users`, `signing_delegations` | SCR-56 |
| `getDelegation` | GET `/delegations/{delegationId}` | CHIEF_ACCOUNTANT, PAYMENT_APPROVER, ENTITY_ADMIN | US-30 | `signing_delegations`, `users` | SCR-55 |
| `revokeDelegation` | POST `/delegations/{delegationId}/revoke` | CHIEF_ACCOUNTANT, PAYMENT_APPROVER, ENTITY_ADMIN | US-30 | `signing_delegations`, `audit_log` | SCR-55 |
| `listGates` | GET `/gates` | GROUP_ADMIN | US-06 | `supplier_gates`, `gate_comparisons`, `gate_alerts`, `erp_suppliers`, `entities` | SCR-78, SCR-75 |
| `getGate` | GET `/gates/{gateId}` | GROUP_ADMIN | US-06 | `supplier_gates`, `gate_comparisons`, `gate_alerts`, `erp_suppliers`, `entities` | SCR-78, SCR-79 |
| `openGate` | POST `/gates/{gateId}/open` | GROUP_ADMIN | US-06 | `supplier_gates`, `gate_comparisons`, `audit_log` | SCR-79 |
| `closeGate` | POST `/gates/{gateId}/close` | GROUP_ADMIN | US-06 | `supplier_gates`, `gate_alerts`, `audit_log` | SCR-79 |
| `getErpSyncStatus` | GET `/erp-sync/status` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-07 | `erp_sync_runs` | SCR-10 |
| `listErpSyncRuns` | GET `/erp-sync/runs` | AP_ACCOUNTANT | US-07 | `erp_sync_runs`, `erp_sync_rejections` | SCR-10 |
| `startErpSync` | POST `/erp-sync/runs` | AP_ACCOUNTANT | US-07 | `erp_sync_runs`, `erp_sync_rejections`, `erp_users`, `erp_suppliers`, `erp_supplier_bank_accounts`, `erp_items`, `erp_unit_conversions`, `erp_purchase_orders`, `erp_po_lines`, `erp_receipts`, `erp_receipt_lines`, `tax_risk_entries`, `authority_status_lookups`, `audit_log` | — |
| `getErpSyncRun` | GET `/erp-sync/runs/{runId}` | AP_ACCOUNTANT | US-07 | `erp_sync_runs` | — |
| `listErpSyncRejections` | GET `/erp-sync/runs/{runId}/rejections` | AP_ACCOUNTANT | US-07 | `erp_sync_rejections`, `erp_sync_runs` | — |
| `listSuppliers` | GET `/suppliers` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-09, US-17 | `erp_suppliers` | SCR-10, SCR-21 |
| `listErpItems` | GET `/erp-items` | AP_ACCOUNTANT | US-14, US-18 | `erp_items`, `erp_unit_conversions` | SCR-12 |
| `listRecurringProfiles` | GET `/recurring-profiles` | AP_ACCOUNTANT | US-09 | `recurring_profiles`, `recurring_profile_periods`, `erp_suppliers` | SCR-20 |
| `createRecurringProfile` | POST `/recurring-profiles` | AP_ACCOUNTANT | US-09 | `recurring_profiles`, `erp_suppliers`, `audit_log` | SCR-21 |
| `getRecurringProfile` | GET `/recurring-profiles/{profileId}` | AP_ACCOUNTANT | US-09 | `recurring_profiles`, `recurring_profile_periods`, `erp_suppliers` | SCR-20, SCR-21 |
| `updateRecurringProfile` | PATCH `/recurring-profiles/{profileId}` | AP_ACCOUNTANT | US-09 | `recurring_profiles`, `audit_log` | SCR-21 |
| `deactivateRecurringProfile` | POST `/recurring-profiles/{profileId}/deactivate` | AP_ACCOUNTANT | US-09 | `recurring_profiles`, `audit_log` | SCR-20 |
| `uploadInvoices` | POST `/invoices/uploads` | AP_ACCOUNTANT | US-10 | `invoices`, `invoice_documents`, `invoice_lines`, `invoice_corrections`, `erp_suppliers`, `group_sectors`, `authority_status_lookups`, `invoice_check_runs`, `audit_log` | SCR-11, SCR-10 |
| `listInvoices` | GET `/invoices` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-10, US-17, US-31 | `invoices`, `erp_suppliers`, `exceptions`, `correction_requests` | SCR-10, SCR-30, SCR-51, SCR-60 |
| `getWorklistSummary` | GET `/invoices/summary` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-17, US-07 | `invoices`, `exceptions`, `correction_requests`, `erp_sync_runs` | SCR-10 |
| `getInvoice` | GET `/invoices/{invoiceId}` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-10, US-17, US-01 | `invoices`, `invoice_documents`, `invoice_corrections`, `payment_request_lines`, `payment_requests` | SCR-12, SCR-10, SCR-30, SCR-40, SCR-51 |
| `downloadInvoiceDocument` | GET `/invoices/{invoiceId}/document` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-10, US-17 | `invoice_documents`, `invoices` | SCR-12 |
| `listInvoiceLines` | GET `/invoices/{invoiceId}/lines` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-14, US-17 | `invoice_lines`, `invoice_line_matches`, `erp_items`, `erp_unit_conversions` | SCR-12 |
| `getInvoiceHistory` | GET `/invoices/{invoiceId}/history` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-17 | `audit_log`, `invoices` | SCR-12 |
| `getInvoiceEvidence` | GET `/invoices/{invoiceId}/evidence` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-13, US-15, US-16, US-17, US-14, US-12, US-26, US-29, US-30, US-25 | `invoices`, `invoice_documents`, `invoice_receipts`, `erp_purchase_orders`, `erp_po_lines`, `erp_receipts`, `erp_receipt_lines`, `erp_users`, `authority_status_lookups`, `ai_flow_classifications`, `ai_identifications`, `invoice_line_matches`, `anomaly_findings`, `anomaly_finding_invoices`, `rule_evaluations`, `rule_condition_results`, `exceptions`, `service_acceptances`, `cancellation_notices`, `payment_request_lines`, `payment_requests`, `request_signatures`, `recurring_profiles`, `recurring_profile_periods` | SCR-12 |
| `listCheckRuns` | GET `/invoices/{invoiceId}/check-runs` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-16, US-17 | `invoice_check_runs`, `rule_evaluations` | SCR-12 |
| `rerunChecks` | POST `/invoices/{invoiceId}/check-runs` | AP_ACCOUNTANT | US-12, US-16 | `invoice_check_runs`, `invoices`, `audit_log` | SCR-10, SCR-12 |
| `getCheckRun` | GET `/invoices/{invoiceId}/check-runs/{runId}` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-12, US-13, US-14, US-15, US-16 | `invoice_check_runs`, `ai_flow_classifications`, `ai_identifications`, `invoice_line_matches`, `anomaly_findings`, `anomaly_finding_invoices`, `rule_evaluations`, `rule_condition_results`, `authority_status_lookups`, `ai_requests`, `price_history` | SCR-12 |
| `runAuthorityLookup` | POST `/invoices/{invoiceId}/authority-status-lookups` | AP_ACCOUNTANT | US-10 | `authority_status_lookups`, `invoices`, `invoice_check_runs`, `audit_log` | SCR-10, SCR-12 |
| `listAuthorityStatusLookups` | GET `/invoices/{invoiceId}/authority-status-lookups` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-10 | `authority_status_lookups` | SCR-12 |
| `getMailboxStatus` | GET `/mailbox` | AP_ACCOUNTANT | US-31 | `mailbox_fetch_runs`, `mailbox_messages` | SCR-24 |
| `listMailboxMessages` | GET `/mailbox/messages` | AP_ACCOUNTANT | US-31 | `mailbox_messages`, `mailbox_attachments`, `invoices` | SCR-24 |
| `getMailboxMessage` | GET `/mailbox/messages/{messageId}` | AP_ACCOUNTANT | US-31 | `mailbox_messages`, `mailbox_attachments`, `invoices` | SCR-24 |
| `startMailboxFetch` | POST `/mailbox/fetch-runs` | AP_ACCOUNTANT | US-31 | `mailbox_fetch_runs`, `mailbox_messages`, `mailbox_attachments`, `invoices`, `invoice_documents`, `invoice_lines`, `invoice_corrections`, `authority_status_lookups`, `audit_log` | SCR-24 |
| `getMailboxFetchRun` | GET `/mailbox/fetch-runs/{runId}` | AP_ACCOUNTANT | US-31 | `mailbox_fetch_runs` | SCR-24 |
| `listExceptions` | GET `/exceptions` | AP_ACCOUNTANT | US-18 | `exceptions`, `exception_reasons`, `invoices`, `erp_suppliers` | SCR-10, SCR-12 |
| `getException` | GET `/exceptions/{exceptionId}` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-18, US-21, US-23 | `exceptions`, `exception_reasons`, `wrong_entity_reports`, `exception_follow_up_links`, `tax_risk_entries`, `individual_approvals`, `erp_purchase_orders`, `users`, `approval_tiers`, `invoices` | SCR-12, SCR-16, SCR-18 |
| `getDecisionQueue` | GET `/decision-queue` | CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-21, US-23 | `exceptions`, `exception_reasons`, `approval_tiers`, `approval_tier_approvers`, `invoices`, `erp_suppliers`, `erp_purchase_orders`, `users` | SCR-40 |
| `takeException` | POST `/exceptions/{exceptionId}/take` | AP_ACCOUNTANT | US-18 | `exceptions`, `audit_log` | SCR-12 |
| `confirmLineMatch` | POST `/exceptions/{exceptionId}/line-match-confirmations` | AP_ACCOUNTANT | US-18 | `exceptions`, `exception_reasons`, `item_mappings`, `invoice_line_matches`, `invoice_lines`, `erp_items`, `invoice_check_runs`, `audit_log` | SCR-12 |
| `correctFlow` | POST `/exceptions/{exceptionId}/flow` | AP_ACCOUNTANT | US-12, US-18 | `exceptions`, `exception_reasons`, `invoices`, `ai_flow_classifications`, `invoice_check_runs`, `audit_log` | SCR-12 |
| `confirmEntity` | POST `/exceptions/{exceptionId}/entity-confirmation` | AP_ACCOUNTANT | US-13, US-18 | `exceptions`, `exception_reasons`, `invoices`, `invoice_check_runs`, `audit_log` | SCR-12 |
| `reportWrongEntity` | POST `/exceptions/{exceptionId}/wrong-entity-report` | AP_ACCOUNTANT | US-18 | `wrong_entity_reports`, `exceptions`, `exception_reasons`, `invoices`, `audit_log` | SCR-12 |
| `confirmAiResults` | POST `/exceptions/{exceptionId}/gate-comparison` | AP_ACCOUNTANT | US-18, US-06 | `gate_comparisons`, `supplier_gates`, `exceptions`, `invoice_check_runs`, `audit_log` | SCR-12 |
| `rejectInvoice` | POST `/exceptions/{exceptionId}/rejection` | AP_ACCOUNTANT | US-18, US-12 | `exceptions`, `exception_reasons`, `invoices`, `audit_log` | SCR-15, SCR-12 |
| `sendForDecision` | POST `/exceptions/{exceptionId}/decision-request` | AP_ACCOUNTANT | US-18, US-23 | `exceptions`, `audit_log` | SCR-12 |
| `listFollowUps` | GET `/exceptions/{exceptionId}/follow-ups` | AP_ACCOUNTANT | US-20 | `exception_follow_up_links`, `invoice_corrections`, `invoices` | SCR-12 |
| `confirmFollowUp` | POST `/invoices/{followUpInvoiceId}/follow-up-confirmation` | AP_ACCOUNTANT | US-20, US-18 | `exception_follow_up_links`, `exceptions`, `invoices`, `audit_log` | SCR-12 |
| `listMessageTemplates` | GET `/message-templates` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT | US-19 | `message_templates` | SCR-14 |
| `draftCorrectionRequest` | POST `/exceptions/{exceptionId}/correction-requests` | AP_ACCOUNTANT | US-19 | `correction_requests`, `message_templates`, `exceptions`, `erp_suppliers`, `ai_requests`, `audit_log` | SCR-14 |
| `listCorrectionRequests` | GET `/exceptions/{exceptionId}/correction-requests` | AP_ACCOUNTANT | US-19 | `correction_requests`, `exceptions` | SCR-14, SCR-12 |
| `getCorrectionRequest` | GET `/correction-requests/{correctionRequestId}` | AP_ACCOUNTANT | US-19 | `correction_requests` | SCR-14 |
| `updateCorrectionRequest` | PATCH `/correction-requests/{correctionRequestId}` | AP_ACCOUNTANT | US-19 | `correction_requests` | SCR-14 |
| `sendCorrectionRequest` | POST `/correction-requests/{correctionRequestId}/send` | AP_ACCOUNTANT | US-19 | `correction_requests`, `exceptions`, `notifications`, `audit_log` | SCR-14 |
| `recordCorrectionReply` | POST `/correction-requests/{correctionRequestId}/reply` | AP_ACCOUNTANT | US-19, US-32 | `correction_requests`, `exceptions`, `audit_log` | SCR-12 |
| `recordCancellationNotice` | POST `/invoices/{invoiceId}/cancellation-notices` | AP_ACCOUNTANT | US-18 | `cancellation_notices`, `invoices`, `exceptions`, `exception_reasons`, `batch_items`, `payment_requests`, `payment_request_lines`, `request_signatures`, `notifications`, `audit_log` | SCR-19, SCR-12 |
| `listCancellationNotices` | GET `/invoices/{invoiceId}/cancellation-notices` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-18, US-17 | `cancellation_notices` | SCR-12 |
| `downloadCancellationNotice` | GET `/cancellation-notices/{noticeId}/file` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-18 | `cancellation_notices` | SCR-12 |
| `decideTaxRiskHold` | POST `/exceptions/{exceptionId}/tax-risk-decision` | CHIEF_ACCOUNTANT | US-21 | `tax_risk_decisions`, `tax_risk_entries`, `exceptions`, `exception_reasons`, `invoices`, `invoice_check_runs`, `audit_log` | SCR-16, SCR-12, SCR-40 |
| `decideIndividualApproval` | POST `/exceptions/{exceptionId}/individual-approval` | PAYMENT_APPROVER | US-23 | `individual_approvals`, `exceptions`, `exception_reasons`, `batch_items`, `payment_batches`, `approval_tiers`, `approval_tier_approvers`, `invoices`, `users`, `erp_users`, `erp_purchase_orders`, `erp_receipts`, `batch_sample_items`, `service_acceptances`, `audit_log` | SCR-18, SCR-12, SCR-40 |
| `listAcceptanceQueue` | GET `/acceptance-queue` | REQUESTING_DEPARTMENT | US-29 | `invoices`, `invoice_receipts`, `service_acceptances`, `erp_purchase_orders`, `erp_po_lines`, `erp_suppliers` | SCR-22 |
| `getAcceptanceQueueItem` | GET `/acceptance-queue/{invoiceId}` | REQUESTING_DEPARTMENT | US-29 | `invoices`, `service_acceptances`, `erp_purchase_orders`, `erp_po_lines`, `users`, `erp_users` | SCR-23 |
| `decideServiceAcceptance` | POST `/invoices/{invoiceId}/service-acceptance` | REQUESTING_DEPARTMENT | US-29 | `service_acceptances`, `invoices`, `invoice_check_runs`, `exceptions`, `exception_reasons`, `invoice_receipts`, `erp_purchase_orders`, `erp_receipts`, `users`, `erp_users`, `notifications`, `audit_log` | SCR-23, SCR-22 |
| `getCurrentBatch` | GET `/batches/current` | AP_ACCOUNTANT | US-24, US-16 | `payment_batches`, `batch_items`, `batch_sample_items` | SCR-30 |
| `listBatches` | GET `/batches` | AP_ACCOUNTANT | US-24 | `payment_batches` | SCR-30 |
| `getBatch` | GET `/batches/{batchId}` | AP_ACCOUNTANT | US-24 | `payment_batches`, `batch_items` | SCR-30 |
| `listBatchItems` | GET `/batches/{batchId}/items` | AP_ACCOUNTANT | US-24, US-17 | `batch_items`, `invoices`, `erp_suppliers`, `payment_batches` | SCR-30 |
| `closeBatchForReview` | POST `/batches/{batchId}/close` | AP_ACCOUNTANT | US-24 | `payment_batches`, `batch_sample_items`, `batch_items`, `entity_policies`, `ai_requests`, `audit_log` | SCR-31, SCR-30 |
| `getBatchSample` | GET `/batches/{batchId}/sample` | AP_ACCOUNTANT | US-24 | `batch_sample_items`, `sample_expansions`, `payment_batches`, `invoices` | SCR-30, SCR-33 |
| `markSampleItem` | POST `/batches/{batchId}/sample/items/{sampleItemId}/mark` | AP_ACCOUNTANT | US-24, US-06 | `batch_sample_items`, `batch_items`, `invoices`, `exceptions`, `exception_reasons`, `supplier_gates`, `gate_alerts`, `payment_batches`, `audit_log` | SCR-30 |
| `expandSample` | POST `/batches/{batchId}/sample/expansions` | AP_ACCOUNTANT | US-24 | `sample_expansions`, `batch_sample_items`, `payment_batches`, `ai_requests`, `audit_log` | SCR-33, SCR-30 |
| `releaseBatch` | POST `/batches/{batchId}/release` | AP_ACCOUNTANT | US-24 | `payment_batches`, `payment_requests`, `payment_request_lines`, `batch_items`, `batch_sample_items`, `entity_policies`, `approval_tiers`, `individual_approvals`, `notifications`, `ai_payment_summaries`, `ai_requests`, `audit_log` | SCR-32, SCR-30 |
| `reopenBatch` | POST `/batches/{batchId}/reopen` | AP_ACCOUNTANT | US-24 | `batch_reopenings`, `payment_batches`, `payment_requests`, `payment_request_lines`, `request_signatures`, `batch_sample_items`, `audit_log` | SCR-34, SCR-30 |
| `withdrawInvoiceFromBatch` | POST `/invoices/{invoiceId}/batch-withdrawal` | AP_ACCOUNTANT | US-24 | `batch_items`, `invoices`, `exceptions`, `exception_reasons`, `payment_request_lines`, `payment_requests`, `request_signatures`, `audit_log` | SCR-12, SCR-30 |
| `listBatchRequests` | GET `/batches/{batchId}/requests` | AP_ACCOUNTANT | US-24, US-26 | `payment_requests`, `payment_request_lines`, `request_signatures`, `erp_send_attempts`, `payment_batches` | SCR-30 |
| `listPaymentRequests` | GET `/payment-requests` | CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-25, US-30, US-26 | `payment_requests`, `payment_request_lines`, `request_signatures`, `signing_delegations`, `approval_tiers`, `approval_tier_approvers`, `anomaly_findings`, `supplier_entity_stats`, `erp_supplier_bank_accounts`, `erp_send_attempts`, `erp_suppliers` | SCR-50 |
| `getPaymentRequest` | GET `/payment-requests/{requestId}` | CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-25, US-30, US-26, US-17 | `payment_requests`, `payment_request_lines`, `request_signatures`, `ai_payment_summaries`, `signing_delegations`, `approval_tiers`, `approval_tier_approvers`, `service_acceptances`, `batch_sample_items`, `exceptions`, `anomaly_findings`, `invoices`, `users`, `erp_users`, `erp_purchase_orders`, `erp_receipts`, `erp_send_attempts`, `supplier_entity_stats`, `erp_supplier_bank_accounts` | SCR-51, SCR-52, SCR-12 |
| `signPaymentRequests` | POST `/payment-requests/sign` | CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-25, US-30 | `request_signatures`, `payment_requests`, `payment_request_lines`, `invoices`, `signing_delegations`, `approval_tiers`, `approval_tier_approvers`, `users`, `erp_users`, `erp_purchase_orders`, `erp_receipts`, `exceptions`, `batch_sample_items`, `service_acceptances`, `erp_send_attempts`, `payment_batches`, `notifications`, `audit_log` | SCR-52, SCR-50, SCR-51 |
| `removeRequestLine` | POST `/payment-requests/{requestId}/lines/{lineId}/removal` | CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-25 | `payment_request_lines`, `payment_requests`, `request_signatures`, `invoices`, `exceptions`, `exception_reasons`, `batch_items`, `notifications`, `audit_log` | SCR-53, SCR-51 |
| `declineRequest` | POST `/payment-requests/{requestId}/decline` | CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-25 | `payment_requests`, `payment_request_lines`, `request_signatures`, `invoices`, `exceptions`, `exception_reasons`, `notifications`, `audit_log` | SCR-54, SCR-51 |
| `listErpSendAttempts` | GET `/payment-requests/{requestId}/erp-send-attempts` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT | US-26 | `erp_send_attempts`, `payment_requests` | SCR-57, SCR-51, SCR-30 |
| `resendToErp` | POST `/payment-requests/{requestId}/erp-resend` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT | US-26 | `erp_send_attempts`, `payment_requests`, `payment_request_lines`, `invoices`, `payment_batches`, `audit_log` | SCR-57, SCR-30, SCR-51 |
| `listNotifications` | GET `/notifications` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-32 | `notifications`, `users` | SCR-62 |
| `getUnreadNotificationCount` | GET `/notifications/unread-count` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-32 | `notifications` | SCR-62 |
| `markNotificationRead` | POST `/notifications/{notificationId}/read` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-32 | `notifications` | SCR-62 |
| `getDashboard` | GET `/dashboard` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT, PAYMENT_APPROVER, ENTITY_ADMIN | US-27 | `invoices`, `exceptions`, `batch_items`, `batch_sample_items`, `payment_batches`, `gate_comparisons` | SCR-60 |
| `listDashboardFigureInvoices` | GET `/dashboard/figures/{figure}/invoices` | AP_ACCOUNTANT, CHIEF_ACCOUNTANT, PAYMENT_APPROVER | US-27 | `invoices`, `exceptions`, `batch_items`, `batch_sample_items` | SCR-60, SCR-10 |
| `getGroupDashboard` | GET `/group/dashboard` | GROUP_ADMIN | US-27 | `invoices`, `exceptions`, `batch_items`, `batch_sample_items`, `entities` | SCR-60 |
| `getGroupOverview` | GET `/group/overview` | GROUP_ADMIN | US-06, US-07 | `entities`, `supplier_gates`, `gate_alerts`, `erp_sync_runs` | SCR-75 |
| `listAuditEntries` | GET `/audit-log` | CHIEF_ACCOUNTANT, ENTITY_ADMIN, GROUP_ADMIN | US-28 | `audit_log`, `users` | SCR-61 |
| `getAuditEntry` | GET `/audit-log/{entryId}` | CHIEF_ACCOUNTANT, ENTITY_ADMIN, GROUP_ADMIN | US-28 | `audit_log` | SCR-61 |
| `getSimMasterData` | GET `/demo/erp-simulator/master-data` | DEMO_OPERATOR | US-08 | `sim_personas`, `entities` | SCR-80, SCR-81, SCR-82 |
| `listSimPurchaseOrders` | GET `/demo/erp-simulator/purchase-orders` | DEMO_OPERATOR | US-08 | `sim_purchase_orders`, `sim_po_lines`, `sim_receipt_lines`, `sim_personas`, `entities` | SCR-80 |
| `createSimPurchaseOrder` | POST `/demo/erp-simulator/purchase-orders` | DEMO_OPERATOR | US-08 | `sim_purchase_orders`, `sim_po_lines`, `sim_personas`, `entities` | SCR-81, SCR-80 |
| `getSimPurchaseOrder` | GET `/demo/erp-simulator/purchase-orders/{poId}` | DEMO_OPERATOR | US-08 | `sim_purchase_orders`, `sim_po_lines`, `sim_receipt_lines`, `sim_personas` | SCR-80, SCR-82 |
| `listSimReceipts` | GET `/demo/erp-simulator/receipts` | DEMO_OPERATOR | US-08 | `sim_receipts`, `sim_receipt_lines`, `sim_purchase_orders`, `sim_personas` | SCR-80 |
| `confirmSimReceipt` | POST `/demo/erp-simulator/receipts` | DEMO_OPERATOR | US-08 | `sim_receipts`, `sim_receipt_lines`, `sim_purchase_orders`, `sim_po_lines`, `sim_personas`, `entities` | SCR-82, SCR-80 |

## 3. Tables and their operations

| Table | Operations that change data (write, or read to decide) | Operations that only read | Jobs that write it |
|---|---|---|---|
| `corporate_groups` | `updateGroupLimits`, `createEntity`, `updateEntityPolicy` | `getGroup`, `listEntities`, `getEntityPolicy` | — |
| `group_sectors` | `addSector`, `removeSector`, `uploadInvoices` | `listSectors` | — |
| `entities` | `createUser`, `updateGroupLimits`, `createEntity`, `replaceApprovalMatrix`, `createSimPurchaseOrder`, `confirmSimReceipt` | `getSession`, `listUsers`, `getUser`, `listErpUsers`, `listEntities`, `getApprovalMatrix`, `listGates`, `getGate`, `getGroupDashboard`, `getGroupOverview`, `getSimMasterData`, `listSimPurchaseOrders` | — |
| `users` | `login`, `logout`, `createUser`, `updateUser`, `deactivateUser`, `replaceApprovalMatrix`, `createDelegation`, `decideIndividualApproval`, `decideServiceAcceptance`, `signPaymentRequests` | `getSession`, `listUsers`, `getUser`, `getApprovalMatrix`, `listDelegations`, `listDelegateCandidates`, `getDelegation`, `getException`, `getDecisionQueue`, `getAcceptanceQueueItem`, `getPaymentRequest`, `listNotifications`, `listAuditEntries` | — |
| `entity_policies` | `updateGroupLimits`, `createEntity`, `updateEntityPolicy`, `closeBatchForReview`, `releaseBatch` | `getEntityPolicy` | — |
| `approval_tiers` | `replaceApprovalMatrix`, `decideIndividualApproval`, `releaseBatch`, `signPaymentRequests` | `getApprovalMatrix`, `getException`, `getDecisionQueue`, `listPaymentRequests`, `getPaymentRequest` | — |
| `approval_tier_approvers` | `replaceApprovalMatrix`, `decideIndividualApproval`, `signPaymentRequests` | `getApprovalMatrix`, `getDecisionQueue`, `listPaymentRequests`, `getPaymentRequest` | — |
| `signing_delegations` | `createDelegation`, `revokeDelegation`, `signPaymentRequests` | `listDelegations`, `listDelegateCandidates`, `getDelegation`, `listPaymentRequests`, `getPaymentRequest` | — |
| `supplier_gates` | `openGate`, `closeGate`, `confirmAiResults`, `markSampleItem` | `listGates`, `getGate`, `getGroupOverview` | — |
| `gate_comparisons` | `openGate`, `confirmAiResults` | `listGates`, `getGate`, `getDashboard` | Demo seed loader |
| `gate_alerts` | `closeGate`, `markSampleItem` | `listGates`, `getGate`, `getGroupOverview` | — |
| `erp_sync_runs` | `startErpSync` | `getErpSyncStatus`, `listErpSyncRuns`, `getErpSyncRun`, `listErpSyncRejections`, `getWorklistSummary`, `getGroupOverview` | Scheduled ERP sync |
| `erp_sync_rejections` | `startErpSync` | `listErpSyncRuns`, `listErpSyncRejections` | Scheduled ERP sync |
| `erp_users` | `createUser`, `updateUser`, `startErpSync`, `decideIndividualApproval`, `decideServiceAcceptance`, `signPaymentRequests` | `listUsers`, `getUser`, `listErpUsers`, `getInvoiceEvidence`, `getAcceptanceQueueItem`, `getPaymentRequest` | Scheduled ERP sync |
| `erp_suppliers` | `startErpSync`, `createRecurringProfile`, `uploadInvoices`, `draftCorrectionRequest` | `listGates`, `getGate`, `listSuppliers`, `listRecurringProfiles`, `getRecurringProfile`, `listInvoices`, `listExceptions`, `getDecisionQueue`, `listAcceptanceQueue`, `listBatchItems`, `listPaymentRequests` | Scheduled ERP sync |
| `erp_supplier_bank_accounts` | `startErpSync` | `listPaymentRequests`, `getPaymentRequest` | Scheduled ERP sync |
| `erp_items` | `startErpSync`, `confirmLineMatch` | `listErpItems`, `listInvoiceLines` | Scheduled ERP sync |
| `erp_unit_conversions` | `startErpSync` | `listErpItems`, `listInvoiceLines` | Scheduled ERP sync |
| `erp_purchase_orders` | `startErpSync`, `decideIndividualApproval`, `decideServiceAcceptance`, `signPaymentRequests` | `getInvoiceEvidence`, `getException`, `getDecisionQueue`, `listAcceptanceQueue`, `getAcceptanceQueueItem`, `getPaymentRequest` | Scheduled ERP sync |
| `erp_po_lines` | `startErpSync` | `getInvoiceEvidence`, `listAcceptanceQueue`, `getAcceptanceQueueItem` | Scheduled ERP sync |
| `erp_receipts` | `startErpSync`, `decideIndividualApproval`, `decideServiceAcceptance`, `signPaymentRequests` | `getInvoiceEvidence`, `getPaymentRequest` | Scheduled ERP sync |
| `erp_receipt_lines` | `startErpSync` | `getInvoiceEvidence` | Scheduled ERP sync |
| `tax_risk_entries` | `startErpSync`, `decideTaxRiskHold` | `getException` | Scheduled ERP sync |
| `sim_personas` | `createSimPurchaseOrder`, `confirmSimReceipt` | `getSimMasterData`, `listSimPurchaseOrders`, `getSimPurchaseOrder`, `listSimReceipts` | Demo seed loader |
| `sim_purchase_orders` | `createSimPurchaseOrder`, `confirmSimReceipt` | `listSimPurchaseOrders`, `getSimPurchaseOrder`, `listSimReceipts` | — |
| `sim_po_lines` | `createSimPurchaseOrder`, `confirmSimReceipt` | `listSimPurchaseOrders`, `getSimPurchaseOrder` | — |
| `sim_receipts` | `confirmSimReceipt` | `listSimReceipts` | — |
| `sim_receipt_lines` | `confirmSimReceipt` | `listSimPurchaseOrders`, `getSimPurchaseOrder`, `listSimReceipts` | — |
| `sim_authority_statuses` | — | — | Demo seed loader |
| `item_mappings` | `confirmLineMatch` | — | — |
| `recurring_profiles` | `createRecurringProfile`, `updateRecurringProfile`, `deactivateRecurringProfile` | `listRecurringProfiles`, `getRecurringProfile`, `getInvoiceEvidence` | — |
| `recurring_profile_periods` | — | `listRecurringProfiles`, `getRecurringProfile`, `getInvoiceEvidence` | Demo seed loader |
| `price_history` | — | `getCheckRun` | ERP send worker, Demo seed loader |
| `supplier_entity_stats` | — | `listPaymentRequests`, `getPaymentRequest` | ERP send worker, Demo seed loader |
| `invoices` | `uploadInvoices`, `rerunChecks`, `runAuthorityLookup`, `startMailboxFetch`, `correctFlow`, `confirmEntity`, `reportWrongEntity`, `rejectInvoice`, `confirmFollowUp`, `recordCancellationNotice`, `decideTaxRiskHold`, `decideIndividualApproval`, `decideServiceAcceptance`, `markSampleItem`, `withdrawInvoiceFromBatch`, `signPaymentRequests`, `removeRequestLine`, `declineRequest`, `resendToErp` | `listInvoices`, `getWorklistSummary`, `getInvoice`, `downloadInvoiceDocument`, `getInvoiceHistory`, `getInvoiceEvidence`, `listMailboxMessages`, `getMailboxMessage`, `listExceptions`, `getException`, `getDecisionQueue`, `listFollowUps`, `listAcceptanceQueue`, `getAcceptanceQueueItem`, `listBatchItems`, `getBatchSample`, `getPaymentRequest`, `getDashboard`, `listDashboardFigureInvoices`, `getGroupDashboard` | Check run, Mailbox fetch, ERP send worker |
| `invoice_documents` | `uploadInvoices`, `startMailboxFetch` | `getInvoice`, `downloadInvoiceDocument`, `getInvoiceEvidence` | Mailbox fetch |
| `invoice_lines` | `uploadInvoices`, `startMailboxFetch`, `confirmLineMatch` | `listInvoiceLines` | Mailbox fetch |
| `invoice_corrections` | `uploadInvoices`, `startMailboxFetch` | `getInvoice`, `listFollowUps` | Mailbox fetch |
| `invoice_receipts` | `decideServiceAcceptance` | `getInvoiceEvidence`, `listAcceptanceQueue` | Check run |
| `mailbox_fetch_runs` | `startMailboxFetch` | `getMailboxStatus`, `getMailboxFetchRun` | Mailbox fetch |
| `mailbox_messages` | `startMailboxFetch` | `getMailboxStatus`, `listMailboxMessages`, `getMailboxMessage` | Mailbox fetch |
| `mailbox_attachments` | `startMailboxFetch` | `listMailboxMessages`, `getMailboxMessage` | Mailbox fetch |
| `authority_status_lookups` | `startErpSync`, `uploadInvoices`, `runAuthorityLookup`, `startMailboxFetch` | `getInvoiceEvidence`, `getCheckRun`, `listAuthorityStatusLookups` | Scheduled ERP sync, Mailbox fetch, Authority status lookup |
| `cancellation_notices` | `recordCancellationNotice` | `getInvoiceEvidence`, `listCancellationNotices`, `downloadCancellationNotice` | Authority status lookup |
| `invoice_check_runs` | `uploadInvoices`, `rerunChecks`, `runAuthorityLookup`, `confirmLineMatch`, `correctFlow`, `confirmEntity`, `confirmAiResults`, `decideTaxRiskHold`, `decideServiceAcceptance` | `listCheckRuns`, `getCheckRun` | Check run |
| `ai_flow_classifications` | `correctFlow` | `getInvoiceEvidence`, `getCheckRun` | Check run |
| `ai_identifications` | — | `getInvoiceEvidence`, `getCheckRun` | Check run |
| `invoice_line_matches` | `confirmLineMatch` | `listInvoiceLines`, `getInvoiceEvidence`, `getCheckRun` | Check run |
| `anomaly_findings` | — | `getInvoiceEvidence`, `getCheckRun`, `listPaymentRequests`, `getPaymentRequest` | Check run |
| `anomaly_finding_invoices` | — | `getInvoiceEvidence`, `getCheckRun` | Check run |
| `rule_evaluations` | — | `getInvoiceEvidence`, `listCheckRuns`, `getCheckRun` | Check run |
| `rule_condition_results` | — | `getInvoiceEvidence`, `getCheckRun` | Check run |
| `ai_requests` | `draftCorrectionRequest`, `closeBatchForReview`, `expandSample`, `releaseBatch` | `getCheckRun` | Check run, AI payment summary |
| `exceptions` | `takeException`, `confirmLineMatch`, `correctFlow`, `confirmEntity`, `reportWrongEntity`, `confirmAiResults`, `rejectInvoice`, `sendForDecision`, `confirmFollowUp`, `draftCorrectionRequest`, `sendCorrectionRequest`, `recordCorrectionReply`, `recordCancellationNotice`, `decideTaxRiskHold`, `decideIndividualApproval`, `decideServiceAcceptance`, `markSampleItem`, `withdrawInvoiceFromBatch`, `signPaymentRequests`, `removeRequestLine`, `declineRequest` | `listInvoices`, `getWorklistSummary`, `getInvoiceEvidence`, `listExceptions`, `getException`, `getDecisionQueue`, `listCorrectionRequests`, `getPaymentRequest`, `getDashboard`, `listDashboardFigureInvoices`, `getGroupDashboard` | Check run |
| `exception_reasons` | `confirmLineMatch`, `correctFlow`, `confirmEntity`, `reportWrongEntity`, `rejectInvoice`, `recordCancellationNotice`, `decideTaxRiskHold`, `decideIndividualApproval`, `decideServiceAcceptance`, `markSampleItem`, `withdrawInvoiceFromBatch`, `removeRequestLine`, `declineRequest` | `listExceptions`, `getException`, `getDecisionQueue` | Check run |
| `wrong_entity_reports` | `reportWrongEntity` | `getException` | — |
| `exception_follow_up_links` | `confirmFollowUp` | `getException`, `listFollowUps` | Check run |
| `message_templates` | `draftCorrectionRequest` | `listMessageTemplates` | Demo seed loader |
| `correction_requests` | `draftCorrectionRequest`, `updateCorrectionRequest`, `sendCorrectionRequest`, `recordCorrectionReply` | `listInvoices`, `getWorklistSummary`, `listCorrectionRequests`, `getCorrectionRequest` | — |
| `tax_risk_decisions` | `decideTaxRiskHold` | — | — |
| `individual_approvals` | `decideIndividualApproval`, `releaseBatch` | `getException` | — |
| `service_acceptances` | `decideIndividualApproval`, `decideServiceAcceptance`, `signPaymentRequests` | `getInvoiceEvidence`, `listAcceptanceQueue`, `getAcceptanceQueueItem`, `getPaymentRequest` | — |
| `payment_batches` | `decideIndividualApproval`, `closeBatchForReview`, `markSampleItem`, `expandSample`, `releaseBatch`, `reopenBatch`, `signPaymentRequests`, `resendToErp` | `getCurrentBatch`, `listBatches`, `getBatch`, `listBatchItems`, `getBatchSample`, `listBatchRequests`, `getDashboard` | Check run, ERP send worker |
| `batch_items` | `recordCancellationNotice`, `decideIndividualApproval`, `closeBatchForReview`, `markSampleItem`, `releaseBatch`, `withdrawInvoiceFromBatch`, `removeRequestLine` | `getCurrentBatch`, `getBatch`, `listBatchItems`, `getDashboard`, `listDashboardFigureInvoices`, `getGroupDashboard` | Check run |
| `batch_sample_items` | `decideIndividualApproval`, `closeBatchForReview`, `markSampleItem`, `expandSample`, `releaseBatch`, `reopenBatch`, `signPaymentRequests` | `getCurrentBatch`, `getBatchSample`, `getPaymentRequest`, `getDashboard`, `listDashboardFigureInvoices`, `getGroupDashboard` | — |
| `payment_requests` | `replaceApprovalMatrix`, `recordCancellationNotice`, `releaseBatch`, `reopenBatch`, `withdrawInvoiceFromBatch`, `signPaymentRequests`, `removeRequestLine`, `declineRequest`, `resendToErp` | `getInvoice`, `getInvoiceEvidence`, `listBatchRequests`, `listPaymentRequests`, `getPaymentRequest`, `listErpSendAttempts` | ERP send worker |
| `payment_request_lines` | `recordCancellationNotice`, `releaseBatch`, `reopenBatch`, `withdrawInvoiceFromBatch`, `signPaymentRequests`, `removeRequestLine`, `declineRequest`, `resendToErp` | `getInvoice`, `getInvoiceEvidence`, `listBatchRequests`, `listPaymentRequests`, `getPaymentRequest` | — |
| `request_signatures` | `recordCancellationNotice`, `reopenBatch`, `withdrawInvoiceFromBatch`, `signPaymentRequests`, `removeRequestLine`, `declineRequest` | `getInvoiceEvidence`, `listBatchRequests`, `listPaymentRequests`, `getPaymentRequest` | — |
| `ai_payment_summaries` | `releaseBatch` | `getPaymentRequest` | AI payment summary |
| `erp_send_attempts` | `signPaymentRequests`, `resendToErp` | `listBatchRequests`, `listPaymentRequests`, `getPaymentRequest`, `listErpSendAttempts` | ERP send worker |
| `sample_expansions` | `expandSample` | `getBatchSample` | — |
| `batch_reopenings` | `reopenBatch` | — | — |
| `notifications` | `sendCorrectionRequest`, `recordCancellationNotice`, `decideServiceAcceptance`, `releaseBatch`, `signPaymentRequests`, `removeRequestLine`, `declineRequest`, `markNotificationRead` | `listNotifications`, `getUnreadNotificationCount` | Check run, ERP send worker, Daily reminder job |
| `audit_log` | `login`, `logout`, `createUser`, `updateUser`, `deactivateUser`, `updateGroupLimits`, `addSector`, `removeSector`, `createEntity`, `updateEntityPolicy`, `replaceApprovalMatrix`, `createDelegation`, `revokeDelegation`, `openGate`, `closeGate`, `startErpSync`, `createRecurringProfile`, `updateRecurringProfile`, `deactivateRecurringProfile`, `uploadInvoices`, `rerunChecks`, `runAuthorityLookup`, `startMailboxFetch`, `takeException`, `confirmLineMatch`, `correctFlow`, `confirmEntity`, `reportWrongEntity`, `confirmAiResults`, `rejectInvoice`, `sendForDecision`, `confirmFollowUp`, `draftCorrectionRequest`, `sendCorrectionRequest`, `recordCorrectionReply`, `recordCancellationNotice`, `decideTaxRiskHold`, `decideIndividualApproval`, `decideServiceAcceptance`, `closeBatchForReview`, `markSampleItem`, `expandSample`, `releaseBatch`, `reopenBatch`, `withdrawInvoiceFromBatch`, `signPaymentRequests`, `removeRequestLine`, `declineRequest`, `resendToErp` | `getInvoiceHistory`, `listAuditEntries`, `getAuditEntry` | Check run, Scheduled ERP sync, Mailbox fetch, Authority status lookup, ERP send worker |

## 4. Background jobs

These jobs are not HTTP (D-135). Their results are read through the operations named in the last column. The link from MatchPay to an ERP, the mailbox, the status feed, the Email Service, and the LLM is a server-side port, not an operation of this contract (D-143).

| Job | Trigger | Stories | Tables written | Operations that start or read it |
|---|---|---|---|---|
| Check run | After intake, after a resolution, after an ERP sync, a risk-list change, an acceptance, a follow-up link, or a re-run (UC-10..UC-16, UC-20) | US-10, US-12, US-13, US-14, US-15, US-16, US-20, US-29 | `invoice_check_runs`, `ai_flow_classifications`, `ai_identifications`, `invoice_receipts`, `invoice_line_matches`, `anomaly_findings`, `anomaly_finding_invoices`, `rule_evaluations`, `rule_condition_results`, `ai_requests`, `invoices`, `exceptions`, `exception_reasons`, `exception_follow_up_links`, `batch_items`, `payment_batches`, `notifications`, `audit_log` | uploadInvoices, rerunChecks, runAuthorityLookup, confirmLineMatch, correctFlow, confirmEntity, confirmAiResults, decideTaxRiskHold, decideServiceAcceptance (start); listCheckRuns, getCheckRun, getInvoiceEvidence (read) |
| Scheduled ERP sync | Every 15 minutes per entity (DF-31), or startErpSync | US-07 | `erp_sync_runs`, `erp_sync_rejections`, `erp_users`, `erp_suppliers`, `erp_supplier_bank_accounts`, `erp_items`, `erp_unit_conversions`, `erp_purchase_orders`, `erp_po_lines`, `erp_receipts`, `erp_receipt_lines`, `tax_risk_entries`, `authority_status_lookups`, `audit_log` | startErpSync (start); getErpSyncStatus, listErpSyncRuns, getErpSyncRun, listErpSyncRejections (read) |
| Mailbox fetch | Every 15 minutes per entity (DF-63), or startMailboxFetch | US-31 | `mailbox_fetch_runs`, `mailbox_messages`, `mailbox_attachments`, `invoices`, `invoice_documents`, `invoice_lines`, `invoice_corrections`, `authority_status_lookups`, `audit_log` | startMailboxFetch (start); getMailboxStatus, listMailboxMessages, getMailboxFetchRun (read) |
| Authority status lookup | At intake after the signature check, on runAuthorityLookup, and at each ERP sync for invoices not yet sent (BR-39, D-93) | US-07, US-10 | `authority_status_lookups`, `cancellation_notices`, `audit_log` | uploadInvoices, runAuthorityLookup, startErpSync (start); listAuthorityStatusLookups, getInvoiceEvidence (read). The simulated feed table sim_authority_statuses is read here and loaded by the seed |
| ERP send worker | A request becomes Signed (first attempt), then up to 3 attempts 5 minutes apart (DF-24), or resendToErp | US-26 | `erp_send_attempts`, `payment_requests`, `payment_batches`, `invoices`, `price_history`, `supplier_entity_stats`, `notifications`, `audit_log` | signPaymentRequests, resendToErp (start); listErpSendAttempts, listBatchRequests, getPaymentRequest (read) |
| Daily reminder job | Once a day (DF-67, DF-80) | US-32, US-19 | `notifications` | listNotifications, getUnreadNotificationCount (read) |
| AI payment summary | After a batch release and after a request changes (AC-25.1, AC-25.13) | US-25 | `ai_payment_summaries`, `ai_requests` | releaseBatch (start); getPaymentRequest (read) |
| Demo seed loader | Once when a demo deployment is created (DF-56, DF-82) | US-06, US-07, US-08 | `sim_authority_statuses`, `sim_personas`, `message_templates`, `price_history`, `supplier_entity_stats`, `gate_comparisons`, `recurring_profile_periods` | none (not an HTTP operation) |

Tables that no operation names and that only a job or the seed writes: `sim_authority_statuses`. `sim_authority_statuses` is the simulated authority feed of D-93; it is loaded by the seed and read by the lookup job, and the ERP simulator screens do not edit it (see the gaps in the [decisions](00-decisions.md#gaps-found-in-approved-steps)).

## 5. Business rules and their operations

BR-09 and BR-12 apply to every operation (D-132, D-144); they appear in `x-rules` only on operations whose acceptance criteria cite them (D-156). A rule that is entirely Advanced or Removed has no operation.

| Rule | Operations |
|---|---|
| BR-01 One entity per document | `listEntities`, `createEntity`, `uploadInvoices`, `getInvoice`, `listMailboxMessages`, `startMailboxFetch`, `confirmEntity`, `reportWrongEntity`, `draftCorrectionRequest` |
| BR-02 Separation of duties | `createUser`, `updateUser`, `listErpUsers`, `createDelegation`, `getException`, `decideIndividualApproval`, `getAcceptanceQueueItem`, `decideServiceAcceptance`, `getPaymentRequest`, `signPaymentRequests`, `createSimPurchaseOrder`, `confirmSimReceipt` |
| BR-03 Approval matrix | `getApprovalMatrix`, `replaceApprovalMatrix`, `getDecisionQueue`, `sendForDecision`, `decideIndividualApproval`, `releaseBatch`, `listPaymentRequests`, `getPaymentRequest`, `signPaymentRequests`, `removeRequestLine` |
| BR-04 Tolerance | `updateEntityPolicy`, `getCheckRun` |
| BR-05 Admission to a batch | `getInvoiceEvidence`, `getCheckRun`, `releaseBatch`, `getDashboard` |
| BR-06 Automation gate | `listGates`, `getGate`, `openGate`, `closeGate`, `getCheckRun`, `confirmAiResults`, `markSampleItem`, `getGroupOverview`, `listAuditEntries` |
| BR-07 Sample check | `updateEntityPolicy`, `closeBatchForReview`, `getBatchSample`, `markSampleItem`, `expandSample`, `releaseBatch`, `getDashboard` |
| BR-08 Tax-risk suppliers | `startErpSync`, `getCheckRun`, `decideTaxRiskHold` |
| BR-09 Entity isolation | `getSession`, `listUsers`, `getUser`, `getEntityPolicy`, `getApprovalMatrix`, `listDelegations`, `getDelegation`, `revokeDelegation`, `listGates`, `getGate`, `listErpSyncRuns`, `getRecurringProfile`, `updateRecurringProfile`, `uploadInvoices`, `listInvoices`, `getInvoice`, `getInvoiceEvidence`, `getCheckRun`, `getMailboxStatus`, `listMailboxMessages`, `getMailboxMessage`, `getMailboxFetchRun`, `getException`, `confirmLineMatch`, `reportWrongEntity`, `listFollowUps`, `draftCorrectionRequest`, `getCorrectionRequest`, `decideIndividualApproval`, `getAcceptanceQueueItem`, `decideServiceAcceptance`, `getCurrentBatch`, `listBatches`, `getBatch`, `listPaymentRequests`, `signPaymentRequests`, `listErpSendAttempts`, `resendToErp`, `listNotifications`, `getGroupDashboard`, `getGroupOverview`, `listAuditEntries`, `getAuditEntry`, `getSimMasterData`, `listSimPurchaseOrders`, `listSimReceipts` |
| BR-10 Split orders | `getCheckRun`, `getException`, `getDecisionQueue`, `decideIndividualApproval` |
| BR-11 No duplicate payment | `uploadInvoices`, `getCheckRun`, `listMailboxMessages`, `startMailboxFetch` |
| BR-12 Audit log | `login`, `updateEntityPolicy`, `createDelegation`, `revokeDelegation`, `uploadInvoices`, `downloadInvoiceDocument`, `getInvoiceHistory`, `getInvoiceEvidence`, `listCheckRuns`, `rerunChecks`, `getCheckRun`, `listAuthorityStatusLookups`, `startMailboxFetch`, `confirmFollowUp`, `decideTaxRiskHold`, `decideServiceAcceptance`, `releaseBatch`, `listErpSendAttempts`, `listAuditEntries`, `getAuditEntry` |
| BR-13 Goods receipt note | `startErpSync`, `listErpSyncRejections`, `confirmSimReceipt` |
| BR-14 Waiting for goods | `startErpSync`, `getInvoiceEvidence`, `getCheckRun`, `listAcceptanceQueue`, `decideServiceAcceptance` |
| BR-15 Quantity paid | `getCheckRun`, `listSimPurchaseOrders`, `getSimPurchaseOrder`, `confirmSimReceipt` |
| BR-16 Group limits | `getGroup`, `updateGroupLimits`, `createEntity`, `getEntityPolicy`, `updateEntityPolicy`, `getCheckRun` |
| BR-17 Independent source | `listSectors`, `addSector`, `removeSector`, `uploadInvoices`, `getCheckRun`, `listMailboxMessages`, `startMailboxFetch`, `correctFlow`, `decideServiceAcceptance` |
| BR-18 PDF and XML of the same invoice (Advanced) | None (Advanced W-19, W-09) |
| BR-19 Received quantity and acceptance | `startErpSync`, `getInvoiceEvidence`, `listAcceptanceQueue`, `decideServiceAcceptance`, `confirmSimReceipt` |
| BR-20 Signing and consolidated payment requests | `updateEntityPolicy`, `getInvoiceEvidence`, `releaseBatch`, `listPaymentRequests`, `getPaymentRequest`, `signPaymentRequests`, `listErpSendAttempts`, `resendToErp` |
| BR-21 Foreign invoices | None (Removed, D-33) |
| BR-22 Subscriptions charged to a card (Advanced) | None (Advanced W-04) |
| BR-23 Employee-expense invoices | `getCheckRun`, `correctFlow`, `getDashboard` |
| BR-24 Recurring invoices | `listRecurringProfiles`, `createRecurringProfile`, `getRecurringProfile`, `updateRecurringProfile`, `deactivateRecurringProfile`, `getCheckRun` |
| BR-25 The Entity ERP is the source of truth | `getErpSyncStatus`, `listErpSyncRuns`, `startErpSync`, `getErpSyncRun`, `listSuppliers`, `listErpItems`, `draftCorrectionRequest`, `listErpSendAttempts`, `resendToErp` |
| BR-26 Correction requests and follow-up invoices | `listFollowUps`, `confirmFollowUp`, `listMessageTemplates`, `draftCorrectionRequest`, `listCorrectionRequests`, `updateCorrectionRequest`, `sendCorrectionRequest`, `recordCorrectionReply`, `listNotifications` |
| BR-27 Document content is data | `listInvoiceLines`, `getInvoiceEvidence`, `getCheckRun`, `listMessageTemplates`, `draftCorrectionRequest` |
| BR-28 Line matching confidence | `listErpItems`, `listInvoiceLines`, `getCheckRun`, `confirmLineMatch` |
| BR-29 Unusual price | `getCheckRun` |
| BR-30 New supplier or changed bank account | `getCheckRun`, `decideIndividualApproval`, `listPaymentRequests`, `getPaymentRequest` |
| BR-31 Adjustment and replacement invoices | `startErpSync`, `uploadInvoices`, `runAuthorityLookup`, `listFollowUps`, `confirmFollowUp`, `draftCorrectionRequest`, `recordCancellationNotice`, `listCancellationNotices` |
| BR-32 Non-cash payment | None (Removed, D-33) |
| BR-33 Invoice lifecycle | `uploadInvoices`, `getInvoice`, `rerunChecks`, `startMailboxFetch`, `rejectInvoice`, `confirmFollowUp`, `recordCancellationNotice`, `decideServiceAcceptance`, `withdrawInvoiceFromBatch`, `resendToErp` |
| BR-34 Exception lifecycle | `listExceptions`, `getException`, `getDecisionQueue`, `takeException`, `confirmLineMatch`, `correctFlow`, `confirmEntity`, `reportWrongEntity`, `confirmAiResults`, `rejectInvoice`, `sendForDecision`, `confirmFollowUp`, `recordCorrectionReply`, `decideTaxRiskHold`, `decideIndividualApproval`, `listNotifications` |
| BR-35 Batch and payment request lifecycle | `recordCancellationNotice`, `decideIndividualApproval`, `getCurrentBatch`, `listBatches`, `getBatch`, `listBatchItems`, `closeBatchForReview`, `expandSample`, `releaseBatch`, `reopenBatch`, `withdrawInvoiceFromBatch`, `listBatchRequests`, `signPaymentRequests`, `removeRequestLine`, `declineRequest`, `resendToErp`, `listNotifications` |
| BR-36 Signer separation | `createUser`, `updateUser`, `createDelegation`, `getException`, `decideIndividualApproval`, `markSampleItem`, `listPaymentRequests`, `getPaymentRequest`, `signPaymentRequests` |
| BR-37 Concurrent-change detection | `takeException`, `confirmLineMatch`, `correctFlow`, `confirmEntity`, `reportWrongEntity`, `confirmAiResults`, `rejectInvoice`, `sendForDecision`, `confirmFollowUp`, `recordCancellationNotice`, `decideTaxRiskHold`, `decideIndividualApproval`, `decideServiceAcceptance`, `closeBatchForReview`, `markSampleItem`, `expandSample`, `releaseBatch`, `reopenBatch`, `withdrawInvoiceFromBatch`, `signPaymentRequests`, `removeRequestLine`, `declineRequest`, `listErpSendAttempts`, `resendToErp` |
| BR-38 Signing delegation | `listDelegations`, `createDelegation`, `listDelegateCandidates`, `getDelegation`, `revokeDelegation`, `getInvoiceEvidence`, `listPaymentRequests`, `getPaymentRequest`, `signPaymentRequests` |
| BR-39 Invoice status at the tax authority | `startErpSync`, `listErpSyncRejections`, `uploadInvoices`, `runAuthorityLookup`, `listAuthorityStatusLookups` |

## 6. Screens and their operations

Fills the placeholder "Screen-to-API mapping" of the [screen inventory](../03-information-architecture/04-screen-inventory.md#screen-to-api-mapping), now filled in the approved Step 3 file by Step 6. SCR-90 Access denied needs no operation of its own: it is the client's reaction to 403 ACCESS_DENIED and to the routes of a role that may not open a page.

| Screen | Operations |
|---|---|
| SCR-01 Login | `login`, `logout`, `getSession` |
| SCR-90 Access denied | `getSession` |
| SCR-10 Invoice Worklist | `getErpSyncStatus`, `listErpSyncRuns`, `listSuppliers`, `uploadInvoices`, `listInvoices`, `getWorklistSummary`, `getInvoice`, `rerunChecks`, `runAuthorityLookup`, `listExceptions`, `listDashboardFigureInvoices` |
| SCR-11 Upload XML Invoices | `uploadInvoices` |
| SCR-12 Invoice Detail and Evidence | `listErpItems`, `getInvoice`, `downloadInvoiceDocument`, `listInvoiceLines`, `getInvoiceHistory`, `getInvoiceEvidence`, `listCheckRuns`, `rerunChecks`, `getCheckRun`, `runAuthorityLookup`, `listAuthorityStatusLookups`, `listExceptions`, `getException`, `takeException`, `confirmLineMatch`, `correctFlow`, `confirmEntity`, `reportWrongEntity`, `confirmAiResults`, `rejectInvoice`, `sendForDecision`, `listFollowUps`, `confirmFollowUp`, `listCorrectionRequests`, `recordCorrectionReply`, `recordCancellationNotice`, `listCancellationNotices`, `downloadCancellationNotice`, `decideTaxRiskHold`, `decideIndividualApproval`, `withdrawInvoiceFromBatch`, `getPaymentRequest` |
| SCR-14 Correction Request Draft | `listMessageTemplates`, `draftCorrectionRequest`, `listCorrectionRequests`, `getCorrectionRequest`, `updateCorrectionRequest`, `sendCorrectionRequest` |
| SCR-15 Reject Invoice | `rejectInvoice` |
| SCR-16 Tax-Risk Hold Decision | `getException`, `decideTaxRiskHold` |
| SCR-18 Approve Exception Individually | `getException`, `decideIndividualApproval` |
| SCR-19 Record Cancellation Notice | `recordCancellationNotice` |
| SCR-20 Recurring Profiles | `listRecurringProfiles`, `getRecurringProfile`, `deactivateRecurringProfile` |
| SCR-21 Recurring Profile Form | `listSuppliers`, `createRecurringProfile`, `getRecurringProfile`, `updateRecurringProfile` |
| SCR-22 Acceptance Queue | `listAcceptanceQueue`, `decideServiceAcceptance` |
| SCR-23 Confirm or Reject Acceptance | `getAcceptanceQueueItem`, `decideServiceAcceptance` |
| SCR-24 Mailbox Log | `getMailboxStatus`, `listMailboxMessages`, `getMailboxMessage`, `startMailboxFetch`, `getMailboxFetchRun` |
| SCR-30 Batch Review | `listInvoices`, `getInvoice`, `getCurrentBatch`, `listBatches`, `getBatch`, `listBatchItems`, `closeBatchForReview`, `getBatchSample`, `markSampleItem`, `expandSample`, `releaseBatch`, `reopenBatch`, `withdrawInvoiceFromBatch`, `listBatchRequests`, `listErpSendAttempts`, `resendToErp` |
| SCR-31 Close Batch | `closeBatchForReview` |
| SCR-32 Release Batch | `releaseBatch` |
| SCR-33 Expand Sample | `getBatchSample`, `expandSample` |
| SCR-34 Reopen for Review | `reopenBatch` |
| SCR-40 Decision Queue | `getInvoice`, `getDecisionQueue`, `decideTaxRiskHold`, `decideIndividualApproval` |
| SCR-50 Signing Queue | `listPaymentRequests`, `signPaymentRequests` |
| SCR-51 Payment Request Detail | `listInvoices`, `getInvoice`, `getPaymentRequest`, `signPaymentRequests`, `removeRequestLine`, `declineRequest`, `listErpSendAttempts`, `resendToErp` |
| SCR-52 Sign with Re-authentication | `getPaymentRequest`, `signPaymentRequests` |
| SCR-53 Remove Line | `removeRequestLine` |
| SCR-54 Decline Request | `declineRequest` |
| SCR-55 Signing Delegations | `listDelegations`, `getDelegation`, `revokeDelegation` |
| SCR-56 New Delegation | `createDelegation`, `listDelegateCandidates` |
| SCR-57 Resend to ERP | `listErpSendAttempts`, `resendToErp` |
| SCR-60 Dashboard | `listInvoices`, `getDashboard`, `listDashboardFigureInvoices`, `getGroupDashboard` |
| SCR-61 Audit Log | `listAuditEntries`, `getAuditEntry` |
| SCR-62 Notifications | `listNotifications`, `getUnreadNotificationCount`, `markNotificationRead` |
| SCR-70 Users | `listUsers`, `getUser` |
| SCR-71 User Form | `createUser`, `getUser`, `updateUser`, `listErpUsers` |
| SCR-72 Deactivate User | `deactivateUser` |
| SCR-73 Entity Policy | `getGroup`, `getEntityPolicy`, `updateEntityPolicy` |
| SCR-74 Approval Matrix | `getApprovalMatrix`, `replaceApprovalMatrix` |
| SCR-75 Group Overview | `listGates`, `getGroupOverview` |
| SCR-76 Entities and Group Limits | `getGroup`, `updateGroupLimits`, `listSectors`, `addSector`, `removeSector`, `listEntities` |
| SCR-77 Entity Form | `createEntity` |
| SCR-78 Automation Gates | `listGates`, `getGate` |
| SCR-79 Open or Close Gate | `getGate`, `openGate`, `closeGate` |
| SCR-80 ERP Simulator | `getSimMasterData`, `listSimPurchaseOrders`, `createSimPurchaseOrder`, `getSimPurchaseOrder`, `listSimReceipts`, `confirmSimReceipt` |
| SCR-81 Purchase Order Form | `getSimMasterData`, `createSimPurchaseOrder` |
| SCR-82 Receipt or Acceptance Form | `getSimMasterData`, `getSimPurchaseOrder`, `confirmSimReceipt` |

## 7. Acceptance criteria and where they are served

Every active acceptance criterion is reachable through an operation (`x-criteria`) or is named here as a job, a test, or a rule that every operation shares. A criterion that is a refusal (for example "Access denied") is served by the operation it names; the shared responses 401, 403, and 409 carry the common cases.

| Criterion | Operations or reason |
|---|---|
| AC-01.1 | `login`, `getSession` |
| AC-01.2 | `login` |
| AC-01.3 | `login` |
| AC-01.4 | `getSession` |
| AC-01.5 | `getSession`, `getInvoice` |
| AC-01.6 | `getSession` |
| AC-01.7 | `getSession` |
| AC-01.8 | `getSession` |
| AC-01.9 | `logout` |
| AC-02.1 | `createUser` |
| AC-02.2 | `createUser`, `updateUser` |
| AC-02.3 | `createUser`, `updateUser` |
| AC-02.4 | `createUser`, `updateUser`, `listErpUsers` |
| AC-02.5 | `getSession`, `deactivateUser` |
| AC-02.6 | `listUsers`, `getUser` |
| AC-02.7 | `createUser` |
| AC-02.8 | `updateUser`, `deactivateUser` |
| AC-02.9 | `createUser` |
| AC-03.1 | `createEntity` |
| AC-03.2 | `createEntity` |
| AC-03.3 | `getGroup`, `updateGroupLimits` |
| AC-03.4 | `updateGroupLimits` |
| AC-03.5 | `updateGroupLimits`, `listEntities` |
| AC-03.6 | `listSectors`, `addSector`, `removeSector` |
| AC-04.1 | `updateEntityPolicy` |
| AC-04.2 | `getGroup`, `updateEntityPolicy` |
| AC-04.3 | `updateEntityPolicy` |
| AC-04.4 | `updateEntityPolicy`, `releaseBatch` |
| AC-04.5 | `updateEntityPolicy` |
| AC-04.6 | `getEntityPolicy` |
| AC-04.7 | `updateEntityPolicy` |
| AC-04.8 | `getEntityPolicy` |
| AC-05.1 | `replaceApprovalMatrix` |
| AC-05.2 | `replaceApprovalMatrix` |
| AC-05.3 | `replaceApprovalMatrix` |
| AC-05.4 | `replaceApprovalMatrix` |
| AC-05.5 | `getApprovalMatrix` |
| AC-05.6 | `replaceApprovalMatrix` |
| AC-06.1 | `listGates`, `getGate`, `getGroupOverview` |
| AC-06.2 | `listGates` |
| AC-06.3 | `listGates`, `getGate`, `confirmAiResults` |
| AC-06.4 | `openGate` |
| AC-06.5 | `openGate` |
| AC-06.6 | `closeGate` |
| AC-06.7 | `listGates`, `closeGate`, `markSampleItem` |
| AC-06.8 | `openGate` |
| AC-06.9 | `listGates`, `getGate`, `getGroupOverview` |
| AC-06.10 | `listGates` |
| AC-07.1 | `listErpSyncRuns`, `startErpSync`, `getErpSyncRun` |
| AC-07.2 | `listErpSyncRuns`, `startErpSync` |
| AC-07.3 | `listErpSyncRuns`, `startErpSync` |
| AC-07.4 | `startErpSync`, `listErpSyncRejections` |
| AC-07.5 | `startErpSync` |
| AC-07.6 | `startErpSync` |
| AC-07.7 | `getErpSyncStatus`, `getErpSyncRun`, `getWorklistSummary`, `getGroupOverview` |
| AC-07.8 | `listErpSyncRuns` |
| AC-07.9 | `startErpSync`, `listErpSyncRejections` |
| AC-07.10 | `startErpSync` |
| AC-07.11 | `startErpSync` |
| AC-07.12 | `startErpSync`, `listErpSyncRejections` |
| AC-08.1 | `getSimMasterData`, `createSimPurchaseOrder` |
| AC-08.2 | `listSimReceipts`, `confirmSimReceipt` |
| AC-08.3 | `confirmSimReceipt` |
| AC-08.4 | `confirmSimReceipt` |
| AC-08.5 | `listSimPurchaseOrders`, `getSimPurchaseOrder`, `confirmSimReceipt` |
| AC-08.6 | `listSimReceipts`, `confirmSimReceipt` |
| AC-08.7 | `getSimMasterData` |
| AC-08.8 | `getSimMasterData`, `listSimPurchaseOrders`, `listSimReceipts` |
| AC-09.1 | `createRecurringProfile` |
| AC-09.2 | `createRecurringProfile`, `updateRecurringProfile` |
| AC-09.3 | `createRecurringProfile`, `updateRecurringProfile` |
| AC-09.4 | `listRecurringProfiles`, `getRecurringProfile` |
| AC-09.5 | `deactivateRecurringProfile` |
| AC-09.6 | `getRecurringProfile`, `updateRecurringProfile` |
| AC-10.1 | `uploadInvoices`, `downloadInvoiceDocument` |
| AC-10.2 | `uploadInvoices`, `downloadInvoiceDocument` |
| AC-10.3 | `uploadInvoices` |
| AC-10.4 | `uploadInvoices` |
| AC-10.5 | `uploadInvoices` |
| AC-10.6 | `uploadInvoices` |
| AC-10.7 | `uploadInvoices` |
| AC-10.8 | `uploadInvoices` |
| AC-10.9 | `uploadInvoices` |
| AC-10.10 | `uploadInvoices` |
| AC-10.11 | `uploadInvoices` |
| AC-10.12 | `uploadInvoices`, `runAuthorityLookup` |
| AC-10.13 | `uploadInvoices`, `runAuthorityLookup` |
| AC-10.14 | `uploadInvoices`, `listAuthorityStatusLookups` |
| AC-10.15 | `uploadInvoices`, `runAuthorityLookup` |
| AC-10.16 | `uploadInvoices`, `getInvoice`, `listAuthorityStatusLookups` |
| AC-12.1 | `getInvoiceEvidence`, `getCheckRun` |
| AC-12.2 | `getCheckRun` |
| AC-12.3 | `getCheckRun` |
| AC-12.4 | `getCheckRun`, `correctFlow` |
| AC-12.5 | `rerunChecks`, `getCheckRun` |
| AC-12.6 | `correctFlow` |
| AC-12.7 | `getCheckRun` |
| AC-12.8 | `getCheckRun` |
| AC-12.9 | `correctFlow`, `rejectInvoice` |
| AC-13.1 | `getInvoiceEvidence`, `getCheckRun` |
| AC-13.2 | `getCheckRun`, `confirmEntity` |
| AC-13.3 | `getCheckRun` |
| AC-13.4 | `getCheckRun` |
| AC-13.5 | `uploadInvoices` |
| AC-13.6 | `getInvoiceEvidence` |
| AC-13.7 | `getCheckRun` |
| AC-13.8 | `getCheckRun` |
| AC-13.9 | `decideServiceAcceptance` |
| AC-14.1 | `getCheckRun` |
| AC-14.2 | `getCheckRun` |
| AC-14.3 | `listErpItems`, `listInvoiceLines`, `getInvoiceEvidence` |
| AC-14.4 | `getCheckRun` |
| AC-14.5 | `getCheckRun` |
| AC-14.6 | `getCheckRun` |
| AC-14.7 | None: Evaluation set ES-03, run by the test suite on the check run job; no user action (G-07). |
| AC-14.8 | `getCheckRun` |
| AC-14.9 | `getCheckRun` |
| AC-14.10 | `getCheckRun` |
| AC-15.1 | `getCheckRun` |
| AC-15.2 | `uploadInvoices` |
| AC-15.3 | `getCheckRun` |
| AC-15.4 | `getCheckRun` |
| AC-15.5 | `getCheckRun` |
| AC-15.6 | `getCheckRun` |
| AC-15.7 | `getCheckRun` |
| AC-15.8 | `getCheckRun` |
| AC-15.9 | `getInvoiceEvidence` |
| AC-15.10 | None: Evaluation sets ES-01 and ES-02, run by the test suite on the check run job (G-03, G-04). |
| AC-15.11 | `getCheckRun` |
| AC-15.12 | `getCheckRun` |
| AC-16.1 | `getInvoiceEvidence`, `getCheckRun` |
| AC-16.2 | `getInvoiceEvidence`, `getCheckRun` |
| AC-16.3 | `getCheckRun` |
| AC-16.4 | `getCheckRun` |
| AC-16.5 | `getCheckRun` |
| AC-16.6 | `getCheckRun` |
| AC-16.7 | `getCheckRun` |
| AC-16.8 | `getCheckRun` |
| AC-16.9 | `getCheckRun` |
| AC-16.10 | `getCheckRun` |
| AC-16.11 | `getCheckRun` |
| AC-16.12 | None: Timing of the check run job on ES-04 (G-05); read afterwards from ai_requests and rule_evaluations, no operation of its own. |
| AC-16.13 | `listCheckRuns`, `rerunChecks`, `getCheckRun` |
| AC-16.14 | `getCurrentBatch` |
| AC-16.15 | `getCheckRun` |
| AC-17.1 | `listSuppliers`, `listInvoices`, `getWorklistSummary` |
| AC-17.2 | `getInvoice`, `downloadInvoiceDocument`, `listInvoiceLines`, `getInvoiceHistory`, `getInvoiceEvidence`, `listCheckRuns` |
| AC-17.3 | `getInvoiceEvidence` |
| AC-17.4 | `getInvoice` |
| AC-17.5 | `listInvoices`, `getInvoice` |
| AC-17.6 | `getInvoiceEvidence` |
| AC-17.7 | `listInvoices` |
| AC-17.8 | `listInvoices` |
| AC-17.9 | `listInvoices` |
| AC-17.10 | `listInvoices` |
| AC-17.11 | `getInvoiceHistory` |
| AC-17.12 | `getInvoice`, `listBatchItems`, `getPaymentRequest` |
| AC-17.13 | `listInvoices` |
| AC-18.1 | `listExceptions`, `getException`, `takeException`, `sendForDecision` |
| AC-18.2 | `listErpItems`, `confirmLineMatch` |
| AC-18.3 | `confirmLineMatch`, `correctFlow`, `confirmEntity` |
| AC-18.4 | `confirmAiResults` |
| AC-18.5 | `confirmFollowUp` |
| AC-18.6 | `rejectInvoice` |
| AC-18.7 | `takeException`, `confirmLineMatch`, `rejectInvoice` |
| AC-18.8 | `confirmLineMatch` |
| AC-18.9 | `getInvoiceEvidence`, `getException`, `listBatchItems`, `withdrawInvoiceFromBatch` |
| AC-18.10 | `listExceptions`, `getException`, `takeException` |
| AC-18.11 | `reportWrongEntity` |
| AC-18.12 | `reportWrongEntity`, `sendForDecision` |
| AC-18.13 | `recordCancellationNotice`, `downloadCancellationNotice` |
| AC-18.14 | `recordCancellationNotice` |
| AC-18.15 | `getInvoiceEvidence`, `recordCancellationNotice`, `listCancellationNotices` |
| AC-18.16 | `recordCancellationNotice` |
| AC-19.1 | `listMessageTemplates`, `draftCorrectionRequest`, `updateCorrectionRequest` |
| AC-19.2 | `updateCorrectionRequest`, `sendCorrectionRequest` |
| AC-19.3 | `draftCorrectionRequest` |
| AC-19.4 | `listCorrectionRequests`, `sendCorrectionRequest`, `recordCorrectionReply` |
| AC-19.5 | `draftCorrectionRequest` |
| AC-19.6 | `sendCorrectionRequest` |
| AC-19.7 | `listMessageTemplates`, `draftCorrectionRequest` |
| AC-19.8 | `draftCorrectionRequest` |
| AC-19.9 | `draftCorrectionRequest`, `getCorrectionRequest` |
| AC-19.10 | `draftCorrectionRequest`, `listCorrectionRequests`, `getCorrectionRequest`, `sendCorrectionRequest` |
| AC-20.1 | `listFollowUps` |
| AC-20.2 | `listFollowUps` |
| AC-20.3 | `listFollowUps`, `confirmFollowUp` |
| AC-20.4 | `listFollowUps`, `confirmFollowUp` |
| AC-20.5 | `listFollowUps` |
| AC-20.6 | `startErpSync` |
| AC-20.7 | `listFollowUps` |
| AC-20.8 | `listFollowUps` |
| AC-20.9 | `confirmFollowUp` |
| AC-21.1 | `getDecisionQueue`, `decideTaxRiskHold` |
| AC-21.2 | `getException`, `decideTaxRiskHold` |
| AC-21.3 | `decideTaxRiskHold` |
| AC-21.4 | `decideTaxRiskHold` |
| AC-21.5 | `decideTaxRiskHold` |
| AC-21.6 | `decideTaxRiskHold` |
| AC-21.7 | `decideTaxRiskHold` |
| AC-21.8 | `decideTaxRiskHold` |
| AC-21.9 | `decideTaxRiskHold` |
| AC-23.1 | `getDecisionQueue` |
| AC-23.2 | `decideIndividualApproval` |
| AC-23.3 | `getDecisionQueue`, `decideIndividualApproval` |
| AC-23.4 | `getException`, `sendForDecision`, `decideIndividualApproval` |
| AC-23.5 | `decideIndividualApproval` |
| AC-23.6 | `getException`, `decideIndividualApproval` |
| AC-23.7 | `decideIndividualApproval` |
| AC-23.8 | `decideIndividualApproval` |
| AC-23.9 | `getException`, `decideIndividualApproval` |
| AC-23.10 | `decideIndividualApproval`, `signPaymentRequests` |
| AC-23.11 | `decideIndividualApproval` |
| AC-23.12 | `getException`, `decideIndividualApproval` |
| AC-23.13 | `getException`, `decideIndividualApproval` |
| AC-24.1 | `getCurrentBatch`, `listBatches`, `closeBatchForReview` |
| AC-24.2 | `closeBatchForReview`, `getBatchSample` |
| AC-24.3 | `closeBatchForReview`, `getBatchSample` |
| AC-24.4 | `markSampleItem` |
| AC-24.5 | `getBatchSample`, `releaseBatch` |
| AC-24.6 | `releaseBatch`, `listBatchRequests` |
| AC-24.7 | `withdrawInvoiceFromBatch` |
| AC-24.8 | `closeBatchForReview`, `getBatchSample` |
| AC-24.9 | `getCurrentBatch`, `getBatch`, `listBatchItems`, `releaseBatch` |
| AC-24.10 | `closeBatchForReview`, `releaseBatch` |
| AC-24.11 | `getCurrentBatch`, `listBatches`, `getBatch` |
| AC-24.12 | `getBatchSample`, `expandSample` |
| AC-24.13 | `getBatchSample`, `expandSample` |
| AC-24.14 | `getBatchSample`, `expandSample` |
| AC-24.15 | `reopenBatch` |
| AC-24.16 | `reopenBatch` |
| AC-24.17 | `expandSample`, `reopenBatch` |
| AC-25.1 | `getPaymentRequest` |
| AC-25.2 | `listPaymentRequests`, `getPaymentRequest`, `signPaymentRequests` |
| AC-25.3 | `signPaymentRequests` |
| AC-25.4 | `signPaymentRequests` |
| AC-25.5 | `removeRequestLine` |
| AC-25.6 | `removeRequestLine` |
| AC-25.7 | `declineRequest` |
| AC-25.8 | `getPaymentRequest`, `signPaymentRequests` |
| AC-25.9 | `getPaymentRequest` |
| AC-25.10 | `signPaymentRequests`, `removeRequestLine` |
| AC-25.11 | `signPaymentRequests` |
| AC-25.12 | `signPaymentRequests` |
| AC-25.13 | `getPaymentRequest` |
| AC-25.14 | `listPaymentRequests`, `signPaymentRequests` |
| AC-25.15 | `getInvoiceEvidence`, `getPaymentRequest` |
| AC-25.16 | `getPaymentRequest`, `signPaymentRequests` |
| AC-25.17 | `getPaymentRequest` |
| AC-26.1 | `listErpSendAttempts` |
| AC-26.2 | `getInvoiceEvidence`, `getPaymentRequest`, `listErpSendAttempts` |
| AC-26.5 | `listErpSendAttempts`, `resendToErp` |
| AC-26.6 | `listErpSendAttempts` |
| AC-26.7 | `listErpSendAttempts` |
| AC-26.8 | `listErpSendAttempts` |
| AC-26.9 | `listErpSendAttempts` |
| AC-26.10 | `listBatchRequests`, `resendToErp` |
| AC-26.11 | `resendToErp` |
| AC-26.12 | `listErpSendAttempts`, `resendToErp` |
| AC-26.13 | `getPaymentRequest`, `resendToErp` |
| AC-26.14 | `resendToErp` |
| AC-27.1 | `getDashboard` |
| AC-27.2 | `getDashboard` |
| AC-27.3 | `getDashboard` |
| AC-27.4 | `getDashboard` |
| AC-27.5 | `getDashboard` |
| AC-27.6 | `listDashboardFigureInvoices` |
| AC-27.7 | `getGroupDashboard` |
| AC-27.8 | `getDashboard` |
| AC-27.9 | `getDashboard` |
| AC-28.1 | `listAuditEntries`, `getAuditEntry` |
| AC-28.2 | `listAuditEntries`, `getAuditEntry` |
| AC-28.3 | `listAuditEntries` |
| AC-28.4 | `listAuditEntries` |
| AC-28.5 | `listAuditEntries`, `getAuditEntry` |
| AC-28.6 | `listAuditEntries` |
| AC-28.7 | None: Every state-changing operation writes its audit entry in its own transaction and fails closed with INTERNAL_ERROR (D-144, DF-30); no single operation. |
| AC-29.1 | `listAcceptanceQueue`, `getAcceptanceQueueItem` |
| AC-29.2 | `getInvoiceEvidence`, `decideServiceAcceptance` |
| AC-29.3 | `decideServiceAcceptance` |
| AC-29.4 | `getInvoiceEvidence`, `listAcceptanceQueue`, `decideServiceAcceptance` |
| AC-29.5 | `listAcceptanceQueue` |
| AC-29.6 | `getAcceptanceQueueItem`, `decideServiceAcceptance` |
| AC-29.7 | `decideServiceAcceptance` |
| AC-29.8 | `getAcceptanceQueueItem`, `decideServiceAcceptance` |
| AC-29.9 | `decideServiceAcceptance` |
| AC-30.1 | `createDelegation` |
| AC-30.2 | `listPaymentRequests`, `signPaymentRequests` |
| AC-30.3 | `signPaymentRequests` |
| AC-30.4 | `listPaymentRequests` |
| AC-30.5 | `getPaymentRequest`, `signPaymentRequests` |
| AC-30.6 | `createDelegation`, `listDelegateCandidates` |
| AC-30.7 | `createDelegation` |
| AC-30.8 | `listDelegations`, `revokeDelegation`, `listPaymentRequests`, `signPaymentRequests` |
| AC-30.9 | `listDelegations`, `revokeDelegation` |
| AC-30.10 | `getInvoiceEvidence`, `getPaymentRequest` |
| AC-30.11 | `listDelegations`, `getDelegation`, `revokeDelegation` |
| AC-31.1 | `listInvoices`, `listMailboxMessages`, `startMailboxFetch` |
| AC-31.2 | `listMailboxMessages`, `startMailboxFetch` |
| AC-31.3 | `listMailboxMessages`, `startMailboxFetch` |
| AC-31.4 | `listMailboxMessages`, `startMailboxFetch` |
| AC-31.5 | `listMailboxMessages`, `startMailboxFetch` |
| AC-31.6 | `listMailboxMessages`, `startMailboxFetch` |
| AC-31.7 | `getMailboxStatus`, `startMailboxFetch`, `getMailboxFetchRun` |
| AC-31.8 | `getMailboxStatus`, `listMailboxMessages`, `getMailboxMessage`, `getMailboxFetchRun` |
| AC-31.9 | `startMailboxFetch` |
| AC-32.1 | `releaseBatch`, `signPaymentRequests`, `listNotifications` |
| AC-32.2 | `listNotifications` |
| AC-32.3 | `removeRequestLine`, `declineRequest`, `listNotifications` |
| AC-32.4 | `recordCorrectionReply`, `listNotifications` |
| AC-32.5 | `listNotifications` |
| AC-32.6 | `listNotifications`, `getUnreadNotificationCount`, `markNotificationRead` |
| AC-32.7 | `listNotifications` |
| AC-32.8 | `listNotifications` |
| AC-32.9 | `releaseBatch`, `listNotifications` |
| AC-32.10 | `listNotifications` |

**Related:** [Step index](README.md) · [Decisions](00-decisions.md) · [OpenAPI contract](openapi.yaml) · [Master traceability](../traceability/master-traceability.md) · [Data model](../05-database/01-data-model.md)
