import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Avatar, Badge, Button, Drawer, Dropdown, Grid, Layout, List, Menu, Popover, Space, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { BellOutlined, DownOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SwapOutlined } from '@ant-design/icons';
import { useAuth } from '../auth/AuthContext';
import { NAV, homeOf } from '../auth/nav';
import { getSessionUserId } from '../api/client';
import * as dec from '../api/decisions';
import * as sign from '../api/signing';
import * as acc from '../api/acceptance';
import * as inv from '../api/invoices';
import * as adm from '../api/admin';
import { useNotifications, useUnreadCount } from '../api/hooks';
import { usePersonaSwitch } from '../lib/usePersonaSwitch';
import { fmtDateTime } from '../lib/format';
import { t } from '../i18n/vi';
import { TOKENS } from '../theme/theme';
import { Count } from './Bits';
import { StatusDot } from './Tags';
import { DemoToolbar } from './DemoToolbar';

const { Sider, Header, Content } = Layout;

function useNavCounts(): Record<string, number | undefined> {
  const { session } = useAuth();
  const role = session?.role;
  const sid = getSessionUserId();
  const on = (roles: string[]) => !!role && roles.includes(role);
  const needs = useQuery({ queryKey: ['worklistSummary', sid], queryFn: inv.getWorklistSummary, enabled: on(['AP_ACCOUNTANT']) });
  const decisions = useQuery({ queryKey: ['decisions', sid], queryFn: dec.getDecisionQueue, enabled: on(['CHIEF_ACCOUNTANT', 'PAYMENT_APPROVER']) });
  const requests = useQuery({ queryKey: ['requests', sid], queryFn: () => sign.listPaymentRequests(), enabled: on(['CHIEF_ACCOUNTANT', 'PAYMENT_APPROVER']) });
  const acceptance = useQuery({ queryKey: ['acceptance', sid, {}], queryFn: () => acc.listAcceptanceQueue({}), enabled: on(['REQUESTING_DEPARTMENT']) });
  const gates = useQuery({ queryKey: ['gates', sid], queryFn: adm.listGates, enabled: on(['GROUP_ADMIN']) });
  return {
    needs: needs.data?.views.needs,
    decisions: decisions.data?.length,
    signing: requests.data?.filter((r) => r.sign.canSign).length,
    acceptance: acceptance.data?.totalAll,
    gateAlerts: gates.data?.filter((g) => g.alert).length,
  };
}

function NavMenu({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const { session } = useAuth();
  const { pathname } = useLocation();
  const counts = useNavCounts();
  if (!session) return null;
  const items = NAV[session.role];
  const selected = items
    .filter((it) => pathname === it.to || pathname.startsWith(`${it.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0];
  const home = homeOf(session.role);
  const menuItems: MenuProps['items'] = items.map((it) => {
    const c = it.badge ? counts[it.badge] : undefined;
    // The role's work queue (its home page) is the one count shown strong.
    const strong = it.to === home && !!c && c > 0;
    return {
      key: it.id,
      icon: collapsed && c ? <Badge dot color={TOKENS.primary}>{it.icon}</Badge> : it.icon,
      label: (
        <Link to={it.to} onClick={onNavigate} className="nav-link">
          <span>{it.label}</span>
          {c ? <span title={`${t.shell.count} ${c}`}><Count n={c} strong={strong} /></span> : null}
        </Link>
      ),
    };
  });
  return <Menu mode="inline" aria-label={t.shell.mainNav} selectedKeys={selected ? [selected.id] : []} items={menuItems} className="side-menu" />;
}

function Bell() {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const unread = useUnreadCount();
  const latest = useNotifications(false);
  const n = unread.data ?? 0;
  const items = (latest.data ?? []).slice(0, 5);
  const content = (
    <div className="bell-pop">
      <List
        size="small"
        dataSource={items}
        locale={{ emptyText: t.shell.noNotifications }}
        renderItem={(it) => (
          <List.Item>
            <List.Item.Meta
              avatar={<Badge dot={!it.read} color={TOKENS.primary}><Avatar size="small" icon={<BellOutlined />} /></Badge>}
              title={<span style={{ fontWeight: it.read ? 400 : 600 }}>{t.notifications.kinds[it.kind]}</span>}
              description={<><span>{t.notification(it)}</span><br /><Typography.Text type="secondary" className="xs">{fmtDateTime(it.at)}</Typography.Text></>}
            />
          </List.Item>
        )}
      />
      <Button type="link" block onClick={() => { setOpen(false); nav('/notifications'); }}>{t.shell.viewAll}</Button>
    </div>
  );
  return (
    <Popover open={open} onOpenChange={setOpen} trigger="click" placement="bottomRight" title={t.shell.latest} content={content}>
      <Button type="text" aria-label={n ? t.shell.bellUnread.replace('{n}', String(n)) : t.shell.bell}>
        <Badge count={n} size="small" overflowCount={99} color={TOKENS.primary}><BellOutlined style={{ fontSize: 18 }} /></Badge>
      </Button>
    </Popover>
  );
}

function UserMenu() {
  const { session, signOut } = useAuth();
  const nav = useNavigate();
  const { personas, current, switchTo } = usePersonaSwitch();
  if (!session) return null;
  const items: MenuProps['items'] = [
    {
      key: 'switch',
      icon: <SwapOutlined />,
      label: t.shell.switchPersona,
      children: personas.map((p) => ({
        key: `p-${p.id}`,
        label: `${p.fullName}, ${t.roles[p.role]}${p.approvalLevel ? ` (${t.approvalLevel[p.approvalLevel]})` : ''}`,
        disabled: p.id === current,
        onClick: () => void switchTo(p.id),
      })),
    },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: t.shell.logout, danger: true, onClick: () => { void signOut().then(() => nav('/login')); } },
  ];
  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <Button type="text" className="user-btn" aria-label={`${t.shell.account}: ${session.fullName}`}>
        <Space size={8}>
          <Avatar size="small" shape="square" style={{ background: TOKENS.primary, color: TOKENS.white }}>{session.fullName.slice(0, 1)}</Avatar>
          <span className="who"><b>{session.fullName}</b><span className="who-role">{t.roles[session.role]}{session.approvalLevel ? ` (${t.approvalLevel[session.approvalLevel]})` : ''}</span></span>
          <DownOutlined style={{ fontSize: 10 }} />
        </Space>
      </Button>
    </Dropdown>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const screens = Grid.useBreakpoint();
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  // Collapse to icons under the lg breakpoint, expand again above it; the header button toggles by hand.
  const wide = screens.lg;
  useEffect(() => { if (wide !== undefined) setCollapsed(!wide); }, [wide]);
  if (!session) return null;
  const mobile = screens.md === false;
  const demo = session.role === 'DEMO_OPERATOR';
  const finance = ['AP_ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'PAYMENT_APPROVER'].includes(session.role);
  const entity = (
    <div className="side-entity">
      <b>{session.entityName}</b>
      {session.entityTaxCode && <span>{t.shell.mst} {session.entityTaxCode}</span>}
    </div>
  );
  return (
    <Layout className="shell">
      <a className="skip-link" href="#main">{t.shell.skip}</a>
      {!mobile && (
        <Sider
          className="sider"
          width={232}
          collapsedWidth={64}
          collapsible
          collapsed={collapsed}
          trigger={null}
          theme="light"
        >
          <div className={collapsed ? 'brand brand-collapsed' : 'brand'}>
            <span className="brand-box" {...(collapsed ? { role: 'img', 'aria-label': 'MatchPay' } : { 'aria-hidden': true })}>M</span>
            {!collapsed && <span className="brand-name">MatchPay</span>}
          </div>
          <NavMenu collapsed={collapsed} />
        </Sider>
      )}
      {mobile && (
        <Drawer open={drawer} onClose={() => setDrawer(false)} placement="left" width={280} title="MatchPay" closeIcon={undefined} styles={{ body: { padding: 0 } }} aria-label={t.shell.mainNav}>
          {entity}
          <NavMenu onNavigate={() => setDrawer(false)} />
        </Drawer>
      )}
      <Layout>
        <Header className="topbar">
          <div className="top-left">
            <Button type="text" icon={mobile || collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} aria-label={mobile ? t.shell.menu : t.shell.collapse} aria-expanded={mobile ? drawer : !collapsed} onClick={() => (mobile ? setDrawer(true) : setCollapsed(!collapsed))} />
            <div className="top-entity">
              <span className="entity-name">{session.entityName}</span>
              {session.entityTaxCode && <Typography.Text type="secondary" className="entity-mst">{t.shell.mst} {session.entityTaxCode}</Typography.Text>}
              {demo && <StatusDot tone="warning">{t.shell.demoOnly}</StatusDot>}
            </div>
          </div>
          <Space size={4}>
            {finance && <Bell />}
            <UserMenu />
          </Space>
        </Header>
        <Content id="main" className="page" tabIndex={-1}>{children}</Content>
      </Layout>
      <DemoToolbar />
    </Layout>
  );
}
