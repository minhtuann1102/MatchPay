import type { KeyboardEvent, ReactNode } from 'react';
import { Card, Col, Row, Statistic, Typography } from 'antd';

export interface KpiProps {
  title: ReactNode;
  value: ReactNode | number;
  icon?: ReactNode;
  color?: string;
  sub?: ReactNode;
  onClick?: () => void;
  suffix?: ReactNode;
  testId?: string;
}

/** A KPI card: antd Statistic with an icon, a colored value, and a small description. Clickable when it filters a list. */
export function Kpi({ title, value, icon, color, sub, onClick, suffix, testId }: KpiProps) {
  const key = (e: KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };
  return (
    <Card
      size="small"
      hoverable={!!onClick}
      className="kpi"
      data-testid={testId}
      onClick={onClick}
      onKeyDown={key}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{ height: '100%', cursor: onClick ? 'pointer' : undefined }}
    >
      <Statistic title={title} value={typeof value === 'number' ? value : undefined} formatter={typeof value === 'number' ? undefined : () => value} prefix={icon} suffix={suffix} valueStyle={{ color, fontWeight: 600 }} />
      {sub && <Typography.Text type="secondary" className="xs">{sub}</Typography.Text>}
    </Card>
  );
}

/** A responsive row of KPI cards. */
export function KpiRow({ children, span = 6 }: { children: ReactNode[]; span?: number }) {
  return (
    <Row gutter={[16, 16]}>
      {children.filter(Boolean).map((c, i) => <Col key={i} xs={24} sm={12} lg={span}>{c}</Col>)}
    </Row>
  );
}
