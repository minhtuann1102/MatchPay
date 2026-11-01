import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { homeOf } from '../auth/nav';
import { t } from '../i18n/vi';
import { Icon } from '../components/Icon';

/** SCR-90. The text is the same whether or not a record exists (BR-09, G-06). */
export function AccessDeniedBody({ record }: { record?: boolean }) {
  const { session } = useAuth();
  return (
    <div className="empty" role="alert">
      <span className="empty-icon"><Icon name="lock" /></span>
      <h1>{t.denied.title}</h1>
      <p>{record ? t.denied.record : t.denied.text}</p>
      {session && <Link className="btn btn-primary" to={homeOf(session.role)}>{t.denied.home}</Link>}
    </div>
  );
}

export function AccessDenied() {
  return (
    <div className="card">
      <AccessDeniedBody />
    </div>
  );
}
