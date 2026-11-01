import { Card, Empty } from 'antd';
import { PageHeader } from '../components/Bits';
import { t } from '../i18n/vi';

/** A route without a page renders this so navigation still works. */
export function Placeholder({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <Card>
        <Empty description={<><b>{t.placeholder.title}</b><br />{t.placeholder.text}</>} />
      </Card>
    </>
  );
}
