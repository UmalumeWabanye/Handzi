import { BookingList, useBookingsRefresh } from '@/features/bookings/BookingList';
import { TabPage } from '@/features/shared/TabPage';

export default function ClientBookings() {
  const refresh = useBookingsRefresh('client');
  return (
    <TabPage title="Bookings" {...refresh}>
      <BookingList role="client" />
    </TabPage>
  );
}
