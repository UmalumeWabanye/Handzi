import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { homeHref } from '@/lib/routing';

// Entry point: send the user to the right place for their auth + onboarding state.
export default function Index() {
  const { user } = useAuth();
  return <Redirect href={homeHref(user)} />;
}
