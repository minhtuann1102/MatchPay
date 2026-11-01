import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '../api/types';
import { markAllNotificationsRead, markNotificationRead } from '../api/reporting';
import { useNotifications } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { Async } from '../components/Async';
import { EmptyState, PageHeader, Tabs } from '../components/Bits';
import { useAction } from '../lib/useAction';
import { fmtDateTime } from '../lib/format';
import { t } from '../i18n/vi';

type Tab = 'unread' | 'all';

/** SCR-62 Notifications: own items, newest first. An item opens its object and is marked read. */
export function Notifications() {
  const { session } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>('unread');
  const unread = useNotifications(true);
  const all = useNotifications(false);
  const q = tab === 'unread' ? unread : all;
  const readAll = useAction(() => markAllNotificationsRead(), { success: t.notifications.allRead });
  const mark = useAction(markNotificationRead);

  const target = (n: Notification): string => {
    switch (n.objectType) {
      case 'INVOICE': return `/invoices/${n.objectId}`;
      case 'BATCH': return '/batch';
      case 'SIGNING': return '/signing';
      case 'REQUEST': return session?.role === 'AP_ACCOUNTANT' ? '/batch' : `/signing/requests/${n.objectId}`;
    }
  };
  const open = async (n: Notification) => {
    if (!n.read) await mark.run(n.id);
    nav(target(n));
  };

  return (
    <>
      <PageHeader
        title={t.notifications.title}
        meta={t.notifications.intro}
        actions={<button type="button" className="btn" disabled={!unread.data?.length || readAll.pending} onClick={() => void readAll.run(undefined)}>{t.notifications.markAll}</button>}
      />
      <section className="card">
        <Tabs<Tab> label={t.notifications.savedViews} value={tab} onChange={setTab} tabs={[
          { id: 'unread', label: t.notifications.unread, count: unread.data?.length, tone: unread.data?.length ? 'warn' : undefined },
          { id: 'all', label: t.notifications.all, count: all.data?.length },
        ]} />
        <Async
          q={q}
          isEmpty={(d) => d.length === 0}
          empty={<EmptyState icon="bell" title={tab === 'unread' ? t.notifications.emptyUnread : t.notifications.emptyAll} text={t.notifications.emptyText} />}
        >
          {(items) => (
            <ul className="notif-list" aria-label={t.notifications.title}>
              {items.map((n) => (
                <li key={n.id} className={`notif${n.read ? '' : ' is-unread'}`}>
                  <span className="n-mark" aria-hidden="true" />
                  <div className="n-text">
                    <b><span className="n-kind">{t.notifications.kinds[n.kind]}</span></b>
                    <span>{t.notification(n)}</span>
                  </div>
                  <div className="n-meta">
                    <time dateTime={n.at}>{fmtDateTime(n.at)}</time>
                    {!n.read && <span className="n-flag">{t.notifications.unreadFlag}</span>}
                    <button type="button" className="btn btn-sm" onClick={() => void open(n)} aria-label={`${t.common.open}: ${t.notifications.kinds[n.kind]}`}>{t.common.open}</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Async>
      </section>
    </>
  );
}
