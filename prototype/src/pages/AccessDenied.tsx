import { Link } from 'react-router-dom';
import { Button, Card, Result } from 'antd';
import { useAuth } from '../auth/AuthContext';
import { homeOf } from '../auth/nav';
import { t } from '../i18n/vi';

/** SCR-90. The text is the same whether or not a record exists (BR-09, G-06). */
export function AccessDeniedBody({ record }: { record?: boolean }) {
  const { session } = useAuth();
  return (
    <div role="alert">
      <Result
        status="403"
        title={t.denied.title}
        subTitle={record ? t.denied.record : t.denied.text}
        extra={session && <Link to={homeOf(session.role)}><Button type="primary">{t.denied.home}</Button></Link>}
      />
    </div>
  );
}

export function AccessDenied() {
  return (
    <Card>
      <AccessDeniedBody />
    </Card>
  );
}
