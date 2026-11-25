import { TabPage } from '@/features/shared/TabPage';
import { EmptyState } from '@/ui';

export default function Screen() {
  return (
    <TabPage title="My services">
      <EmptyState icon="briefcase-outline" title="No services yet" text="Create service packages clients can book directly, like 'Geyser replacement' or 'Fix a leaking tap'." />
    </TabPage>
  );
}
