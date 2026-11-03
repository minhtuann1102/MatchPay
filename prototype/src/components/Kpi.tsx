import type { KeyboardEvent, ReactNode } from 'react';
import { Card, Col, Row } from 'antd';

export interface KpiProps {
  title: ReactNode;
  value: ReactNode | number;
  /** Accepted for compatibility and ignored: the neutral look has no KPI icons (D-219). */
  icon?: ReactNode;
  /** An attention marker: when given, an 8 px dot in this color is drawn before the label. The value stays in the text color. */
  color?: string;
  sub?: ReactNode;
  onClick?: () => void;
  suffix?: ReactNode;
  testId?: string;
}

/** A flat KPI card (D-219): uppercase label, value, caption, optional attention dot. Clickable when it filters a list. */
export function Kpi({ title, value, color, sub, onClick, suffix, testId }: KpiProps) {
  const key = (e: KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };
  return (
    <Card
      size="small"
      className={onClick ? 'kpi kpi-click' : 'kpi'}
      data-testid={testId}
      onClick={onClick}
      onKeyDown={key}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{ height: '100%' }}
    >
      <div className="kpi-label">
        {color && <span className="kpi-dot" style={{ background: color }} aria-hidden="true" />}
        <span>{title}</span>
      </div>
      {/* Numbers use Vietnamese grouping (dot), the same as money. */}
      <div className="kpi-value">{typeof value === 'number' ? value.toLocaleString('vi-VN') : value}{suffix && <span className="kpi-suffix">{suffix}</span>}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </Card>
  );
}

/** A responsive row of KPI cards. */
export function KpiRow({ children, span = 6 }: { children: ReactNode[]; span?: number }) {
  return (
    <Row gutter={[16, 16]}>
      {children.filter(Boolean).map((c, i) => <Col key={i} xs={12} sm={12} lg={span}>{c}</Col>)}
    </Row>
  );
}
