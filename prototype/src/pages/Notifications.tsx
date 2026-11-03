import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Badge, Button, Card, List, Space, Tabs, Tag, Typography } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import type { Notification } from '../api/types';
import { markAllNotificationsRead, markNotificationRead } from '../api/reporting';
import { useNotifications } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { Async } from '../components/Async';
import { Count, EmptyState, PageHeader } from '../components/Bits';
import { StatusDot } from '../components/Tags';
import { useAction } from '../lib/useAction';
import { fmtDateTime } from '../lib/format';
import { t } from '../i18n/vi';
import { TOKENS } from '../theme/theme';

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
        actions={<Button icon={<CheckOutlined />} disabled={!unread.data?.length} loading={readAll.pending} onClick={() => void readAll.run(undefined)}>{t.notifications.markAll}</Button>}
      />
      <Card styles={{ body: { padding: 0 } }}>
        <Tabs
          className="view-tabs"
          aria-label={t.notifications.savedViews}
          activeKey={tab}
          onChange={(k) => setTab(k as Tab)}
          items={[
            { key: 'unread', label: <span>{t.notifications.unread} <Count n={unread.data?.length} strong={!!unread.data?.length} /></span> },
            { key: 'all', label: <span>{t.notifications.all} <Count n={all.data?.length} /></span> },
          ]}
        />
        <Async
          q={q}
          isEmpty={(d) => d.length === 0}
          empty={<EmptyState title={tab === 'unread' ? t.notifications.emptyUnread : t.notifications.emptyAll} text={t.notifications.emptyText} />}
        >
          {(items) => (
            <List
              aria-label={t.notifications.title}
              style={{ padding: '0 16px' }}
              dataSource={items}
              renderItem={(n) => (
                <List.Item
                  actions={[<Button key="o" size="small" onClick={() => void open(n)} aria-label={`${t.common.open}: ${t.notifications.kinds[n.kind]}`}>{t.common.open}</Button>]}
                >
                  <List.Item.Meta
                    avatar={<Badge dot={!n.read} color={TOKENS.primary}><Avatar icon={<BellOutlined />} style={{ background: n.read ? TOKENS.layout : TOKENS.primaryWash, color: TOKENS.primary }} /></Badge>}
                    title={<Space size={8} wrap><Tag bordered style={{ marginInlineEnd: 0 }}>{t.notifications.kinds[n.kind]}</Tag>{!n.read && <StatusDot tone="primary">{t.notifications.unreadFlag}</StatusDot>}</Space>}
                    description={<><span style={{ color: TOKENS.text }}>{t.notification(n)}</span><br /><Typography.Text type="secondary" className="xs"><time dateTime={n.at}>{fmtDateTime(n.at)}</time></Typography.Text></>}
                  />
                </List.Item>
              )}
            />
          )}
        </Async>
      </Card>
    </>
  );
}
