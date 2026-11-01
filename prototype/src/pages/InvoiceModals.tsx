import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, DatePicker, Descriptions, Form, Input, Select, Space, Spin, Typography, Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import type { CorrectionRequest, InvoiceDetail, MessageTemplate } from '../api/types';
import { draftCorrectionRequest, recordCancellationNotice, sendCorrectionRequest, type CancellationResult } from '../api/invoices';
import { InvNo, Notice } from '../components/Bits';
import { HandTag } from '../components/Tags';
import { ActionModal } from '../components/Dialogs';
import { errorText } from '../lib/errors';
import { useAction } from '../lib/useAction';
import { getDb } from '../mock/db';
import { t } from '../i18n/vi';

const KINDS: MessageTemplate['kind'][] = ['CORRECTION_REQUEST', 'DATA_FIX_NOTICE', 'REISSUE_REQUEST'];

/** SCR-14 Correction request draft. The AI drafts from an approved template; nothing is sent until Send is pressed. */
export function CorrectionModal({ detail, initialKind, onClose }: { detail: InvoiceDetail; initialKind: MessageTemplate['kind']; onClose: () => void }) {
  const [kind, setKind] = useState(initialKind);
  const [draft, setDraft] = useState<CorrectionRequest | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [form] = Form.useForm<{ recipient: string; subject: string; body: string }>();
  const send = useAction((a: { id: string; subject: string; body: string; recipient: string }) => sendCorrectionRequest(a.id, a), { success: t.correction.sent, onSuccess: onClose });

  // The draft is made again whenever the type changes.
  const q = useQuery({
    queryKey: ['draft', detail.invoice.id, kind],
    queryFn: () => draftCorrectionRequest(detail.invoice.id, kind),
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });
  const drafting = q.isPending;
  useEffect(() => {
    if (q.isError) setDraftError(errorText(q.error));
    if (q.data) {
      setDraft(q.data);
      form.setFieldsValue({ recipient: q.data.recipient, subject: q.data.subject, body: q.data.body });
      setDraftError(null);
    }
  }, [q.data, q.isError, q.error, form]);

  const submit = () => {
    void form.validateFields().then((v) => { if (draft) void send.run({ id: draft.id, ...v }); }).catch(() => undefined);
  };

  return (
    <ActionModal
      title={t.correction.title}
      width={640}
      okText={send.error ? t.correction.retry : t.correction.send}
      okDisabled={drafting || !draft}
      pending={send.pending}
      onClose={onClose}
      onOk={submit}
    >
      <Typography.Text type="secondary">{t.correction.intro}</Typography.Text>
      <Form form={form} layout="vertical" requiredMark>
        <Form.Item label={t.correction.type}>
          <Select aria-label={t.correction.type} value={kind} disabled={drafting || send.pending} onChange={setKind} options={KINDS.map((k) => ({ value: k, label: t.correction.kinds[k] }))} />
        </Form.Item>
        {drafting && <div role="status"><Spin tip={t.correction.drafting}><div style={{ height: 80 }} /></Spin></div>}
        {draftError && <Notice kind="err">{draftError}</Notice>}
        {draft && !drafting && (
          <>
            {draft.aiDraft ? (
              <Space style={{ marginBottom: 12 }}><HandTag hand="AI" /><Typography.Text type="secondary">{t.correction.aiDraft}</Typography.Text></Space>
            ) : (
              <Alert type="warning" showIcon message={t.correction.aiUnavailable} description={t.correction.blankTemplate} style={{ marginBottom: 12 }} />
            )}
            <Form.Item name="recipient" label={t.correction.recipient} extra={t.correction.recipientHint} rules={[{ required: true, message: t.correction.recipientInvalid }, { pattern: /^\S+@\S+\.\S+$/, message: t.correction.recipientInvalid }]}>
              <Input />
            </Form.Item>
            <Form.Item name="subject" label={t.correction.subject} rules={[{ required: true, whitespace: true, message: t.correction.required }]}>
              <Input />
            </Form.Item>
            <Form.Item name="body" label={t.correction.body} rules={[{ required: true, whitespace: true, message: t.correction.required }]}>
              <Input.TextArea rows={7} />
            </Form.Item>
            {send.error && <Notice kind="err" title={t.correction.notSent}>{send.error}</Notice>}
          </>
        )}
      </Form>
    </ActionModal>
  );
}

/** SCR-19 Record cancellation notice. */
export function CancellationModal({ detail, onClose, onDone }: { detail: InvoiceDetail; onClose: () => void; onDone: (r: CancellationResult) => void }) {
  const inv = detail.invoice;
  const [form] = Form.useForm<{ reference: string; date: Dayjs }>();
  const [fileName, setFileName] = useState<string | null>(null);
  const rec = useAction((a: { id: string; body: Parameters<typeof recordCancellationNotice>[1] }) => recordCancellationNotice(a.id, a.body), { success: t.cancel.toast, onSuccess: onDone });
  const effect =
    inv.state === 'SIGNED' ? t.cancel.effectSigned
    : inv.state === 'IN_BATCH' && detail.request ? t.cancel.effectInRequest.replace('{r}', detail.request.id)
    : inv.state === 'IN_BATCH' ? t.cancel.effectInBatch
    : inv.state === 'WAITING_FOR_GOODS' ? t.cancel.effectWaiting
    : t.cancel.effectException;
  return (
    <ActionModal
      title={t.cancel.title}
      okText={t.cancel.record}
      pending={rec.pending}
      error={rec.error}
      rawError={rec.rawError}
      onClose={onClose}
      onOk={() => {
        void form.validateFields().then((v) => rec.run({ id: inv.id, body: { reference: v.reference, noticeDate: v.date.format('YYYY-MM-DD'), fileName, version: inv.version } })).catch(() => undefined);
      }}
    >
      <Descriptions size="small" column={1} items={[
        { key: 's', label: t.detail.seller, children: detail.supplierName },
        { key: 'i', label: t.invoices.colInvoice, children: <InvNo value={inv.invoiceNumber} /> },
      ]} />
      <Notice kind="info" title={t.cancel.whatHappens}>{effect}</Notice>
      <Form form={form} layout="vertical" initialValues={{ date: dayjs(getDb().now.slice(0, 10)) }}>
        <Form.Item name="reference" label={t.cancel.reference} rules={[{ required: true, whitespace: true, message: t.cancel.referenceRequired }]}>
          <Input autoFocus />
        </Form.Item>
        <Form.Item name="date" label={t.cancel.date} extra={t.cancel.dateHint} rules={[{ required: true, message: t.cancel.dateInvalid }]}>
          <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} allowClear={false} />
        </Form.Item>
        <Form.Item label={t.cancel.file} extra={fileName ? undefined : t.cancel.fileHint}>
          <Upload maxCount={1} beforeUpload={(f) => { setFileName(f.name); return false; }} onRemove={() => setFileName(null)}>
            <Button icon={<UploadOutlined />}>{t.upload.choose}</Button>
          </Upload>
        </Form.Item>
      </Form>
    </ActionModal>
  );
}
