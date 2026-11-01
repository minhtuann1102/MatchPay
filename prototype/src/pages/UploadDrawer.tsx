import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { UploadItemResult } from '../api/types';
import { uploadInvoices } from '../api/invoices';
import { Drawer } from '../components/Modal';
import { Icon } from '../components/Icon';
import { InvNo, Notice } from '../components/Bits';
import { StateBadge } from '../components/Chips';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';

// Sample file names for the demo: each name triggers one documented mock result (AC-10.8, AC-10.12, AC-10.13).
const SAMPLES = ['hoa-don-mau.xml', 'doi-chieu.pdf', 'chu-ky-sai-sig.xml', 'trung-dup.xml', 'da-huy-cancel.xml'];

/** SCR-11 Upload XML invoices (right-hand drawer on SCR-10). */
export function UploadDrawer({ onClose }: { onClose: () => void }) {
  const [files, setFiles] = useState<string[]>([]);
  const [results, setResults] = useState<UploadItemResult[] | null>(null);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const up = useAction(uploadInvoices, { onSuccess: (r) => setResults(r) });

  const add = (names: string[]) => setFiles((f) => [...f, ...names.filter((n) => !f.includes(n))]);
  const accepted = results?.filter((r) => r.result === 'ACCEPTED').length ?? 0;

  return (
    <Drawer
      title={t.upload.title}
      onClose={onClose}
      dismissable={!up.pending}
      footer={
        results ? (
          <button type="button" className="btn btn-primary" onClick={onClose}>{t.common.close}</button>
        ) : (
          <>
            <button type="button" className="btn" onClick={onClose} disabled={up.pending}>{t.common.cancel}</button>
            <button type="button" className="btn btn-primary" disabled={!files.length || up.pending} onClick={() => void up.run(files.map((name) => ({ name })))}>
              {up.pending && <span className="spin" />}
              {up.pending ? t.upload.uploading : t.upload.submit.replace('{n}', String(files.length))}
            </button>
          </>
        )
      }
    >
      {!results && (
        <>
          <div
            className={`dropzone${over ? ' over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              add(Array.from(e.dataTransfer.files).map((f) => f.name));
            }}
          >
            <Icon name="upload" />
            <b>{t.upload.drop}</b>
            <span className="small">{t.upload.hint}</span>
            <input ref={input} id="upload-files" type="file" multiple hidden onChange={(e) => { add(Array.from(e.target.files ?? []).map((f) => f.name)); e.target.value = ''; }} />
            <button type="button" className="btn" data-autofocus onClick={() => input.current?.click()}>{t.upload.choose}</button>
          </div>
          <div className="stack-sm">
            <span className="lbl">{t.upload.samples}</span>
            <div className="row">
              {SAMPLES.map((s) => <button key={s} type="button" className="btn btn-sm" onClick={() => add([s])}>{s}</button>)}
            </div>
          </div>
          {files.length > 0 && (
            <div aria-label={t.upload.selected}>
              <span className="lbl">{t.upload.selected} ({files.length})</span>
              {files.map((f) => (
                <div className="file-row" key={f}>
                  <span className="mono">{f}</span>
                  <button type="button" className="btn btn-quiet btn-sm" aria-label={t.upload.remove.replace('{f}', f)} onClick={() => setFiles((l) => l.filter((x) => x !== f))}><Icon name="x" small /></button>
                </div>
              ))}
            </div>
          )}
          {up.error && <Notice kind="err">{up.error}</Notice>}
        </>
      )}
      {results && (
        <>
          <Notice kind={accepted === results.length ? 'ok' : 'info'} title={t.upload.summary.replace('{a}', String(accepted)).replace('{r}', String(results.length - accepted))} />
          <ul aria-label={t.upload.results}>
            {results.map((r) => (
              <li key={r.fileName} className="file-row" style={{ alignItems: 'flex-start' }}>
                <span>
                  <span className="mono">{r.fileName}</span>
                  {r.result === 'REJECTED' && r.reason && <span className="hint hint-err">{t.upload.reason(r.reason.code, r.reason.params)}</span>}
                  {r.result === 'ACCEPTED' && r.invoiceId && <span className="hint"><Link to={`/invoices/${r.invoiceId}`} onClick={onClose}><InvNo value={r.invoiceNumber ?? ''} /></Link></span>}
                </span>
                <span className="row">
                  {r.result === 'ACCEPTED' ? <span className="chip c-ok">{t.upload.accepted}</span> : <span className="chip c-bad">{t.upload.rejected}</span>}
                  {r.state && <StateBadge state={r.state} />}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Drawer>
  );
}
