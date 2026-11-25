import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { Layout } from './components/Layout';
import { Loading } from './components/ui';
import Login from './pages/Login';

// Each page is its own chunk, so the charts library only loads on the Overview.
const Overview = lazy(() => import('./pages/Overview'));
const Verifications = lazy(() => import('./pages/Verifications'));
const DisputesList = lazy(() => import('./pages/Disputes').then((m) => ({ default: m.DisputesList })));
const DisputeDetail = lazy(() => import('./pages/Disputes').then((m) => ({ default: m.DisputeDetail })));
const Reports = lazy(() => import('./pages/Reports'));
const UsersList = lazy(() => import('./pages/Users').then((m) => ({ default: m.UsersList })));
const UserDetail = lazy(() => import('./pages/Users').then((m) => ({ default: m.UserDetail })));
const Jobs = lazy(() => import('./pages/Jobs'));
const BookingsList = lazy(() => import('./pages/Bookings').then((m) => ({ default: m.BookingsList })));
const BookingDetail = lazy(() => import('./pages/Bookings').then((m) => ({ default: m.BookingDetail })));
const Categories = lazy(() => import('./pages/Categories'));
const Settings = lazy(() => import('./pages/Settings'));
const Audit = lazy(() => import('./pages/Audit'));

const page = (el: React.ReactNode) => <Suspense fallback={<Loading />}>{el}</Suspense>;

export default function App() {
  const { admin, ready } = useAuth();
  if (!ready) return <Loading />;
  if (!admin) return <Login />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={page(<Overview />)} />
        <Route path="verifications" element={page(<Verifications />)} />
        <Route path="disputes" element={page(<DisputesList />)} />
        <Route path="disputes/:id" element={page(<DisputeDetail />)} />
        <Route path="reports" element={page(<Reports />)} />
        <Route path="users" element={page(<UsersList />)} />
        <Route path="users/:id" element={page(<UserDetail />)} />
        <Route path="jobs" element={page(<Jobs />)} />
        <Route path="bookings" element={page(<BookingsList />)} />
        <Route path="bookings/:id" element={page(<BookingDetail />)} />
        <Route path="categories" element={page(<Categories />)} />
        <Route path="settings" element={page(<Settings />)} />
        <Route path="audit" element={page(<Audit />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
