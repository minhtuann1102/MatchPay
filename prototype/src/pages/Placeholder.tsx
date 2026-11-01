import { PageHeader } from '../components/Bits';
import { t } from '../i18n/vi';
import { Icon } from '../components/Icon';

/** Pages built in phase 2 render this so navigation already works. */
export function Placeholder({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="card">
        <div className="empty">
          <span className="empty-icon"><Icon name="clock" /></span>
          <h2>{t.placeholder.title}</h2>
          <p>{t.placeholder.text}</p>
        </div>
      </div>
    </>
  );
}
