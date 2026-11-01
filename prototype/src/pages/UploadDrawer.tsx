import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Drawer, List, Space, Tag, Typography, Upload } from 'antd';
import { CloseOutlined, InboxOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { UploadItemResult } from '../api/types';
import { uploadInvoices } from '../api/invoices';
import { InvNo, Notice } from '../components/Bits';
import { StateBadge } from '../components/Tags';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';

// Sample file names for the demo: each name triggers one documented mock result (AC-10.8, AC-10.12, AC-10.13).
const SAMPLES = ['hoa-don-mau.xml', 'doi-chieu.pdf', 'chu-ky-sai-sig.xml', 'trung-dup.xml', 'da-huy-cancel.xml'];

/** SCR-11 Upload XML invoices (right-hand drawer on SCR-10). */
export function UploadDrawer({ onClose }: { onClose: () => void }) {
  const [files, setFiles] = useState<string[]>([]);
  const [results, setResults] = useState<UploadItemResult[] | null>(null);
  const up = useAction(uploadInvoices, { onSuccess: (r) => setResults(r) });

  const add = (names: string[]) => setFiles((f) => [...f, ...names.filter((n) => !f.includes(n))]);
  const accepted = results?.filter((r) => r.result === 'ACCEPTED').length ?? 0;

  return (
    <Drawer
      open
      title={t.upload.title}
      width={480}
      onClose={onClose}
      maskClosable={!up.pending}
      keyboard={!up.pending}
      footer={
        results ? (
          <Button type="primary" onClick={onClose}>{t.common.close}</Button>
        ) : (
          <Space>
            <Button type="primary" disabled={!files.length} loading={up.pending} onClick={() => void up.run(files.map((name) => ({ name })))}>
              {up.pending ? t.upload.uploading : t.upload.submit.replace('{n}', String(files.length))}
            </Button>
            <Button onClick={onClose} disabled={up.pending}>{t.common.cancel}</Button>
          </Space>
        )
      }
    >
      <div className="stack">
        {!results && (
          <>
            <Upload.Dragger
              multiple
              showUploadList={false}
              fileList={[]}
              accept=".xml"
              beforeUpload={(f) => { add([f.name]); return false; }}
            >
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              <p className="ant-upload-text">{t.upload.drop}</p>
              <p className="ant-upload-hint">{t.upload.hint}</p>
            </Upload.Dragger>
            <div>
              <Typography.Text type="secondary">{t.upload.samples}</Typography.Text>
              <div style={{ marginTop: 8 }}>
                <Space wrap>{SAMPLES.map((s) => <Button key={s} size="small" onClick={() => add([s])}>{s}</Button>)}</Space>
              </div>
            </div>
            {files.length > 0 && (
              <List
                size="small"
                bordered
                header={<b>{t.upload.selected} ({files.length})</b>}
                aria-label={t.upload.selected}
                dataSource={files}
                renderItem={(f) => (
                  <List.Item actions={[<Button key="x" type="text" size="small" icon={<CloseOutlined />} aria-label={t.upload.remove.replace('{f}', f)} onClick={() => setFiles((l) => l.filter((x) => x !== f))} />]}>
                    <span className="mono">{f}</span>
                  </List.Item>
                )}
              />
            )}
            {up.error && <Notice kind="err">{up.error}</Notice>}
          </>
        )}
        {results && (
          <>
            <Notice kind={accepted === results.length ? 'ok' : 'info'} title={t.upload.summary.replace('{a}', String(accepted)).replace('{r}', String(results.length - accepted))} />
            <List
              aria-label={t.upload.results}
              dataSource={results}
              renderItem={(r) => (
                <List.Item
                  extra={
                    <Space size={4} wrap style={{ justifyContent: 'flex-end' }}>
                      {r.result === 'ACCEPTED' ? <Tag color="success" icon={<CheckCircleOutlined />}>{t.upload.accepted}</Tag> : <Tag color="error" icon={<CloseCircleOutlined />}>{t.upload.rejected}</Tag>}
                      {r.state && <StateBadge state={r.state} />}
                    </Space>
                  }
                >
                  <List.Item.Meta
                    title={<span className="mono">{r.fileName}</span>}
                    description={
                      r.result === 'REJECTED' && r.reason ? <Typography.Text type="danger">{t.upload.reason(r.reason.code, r.reason.params)}</Typography.Text>
                        : r.result === 'ACCEPTED' && r.invoiceId ? <Link to={`/invoices/${r.invoiceId}`} onClick={onClose}><InvNo value={r.invoiceNumber ?? ''} /></Link> : null
                    }
                  />
                </List.Item>
              )}
            />
          </>
        )}
      </div>
    </Drawer>
  );
}
