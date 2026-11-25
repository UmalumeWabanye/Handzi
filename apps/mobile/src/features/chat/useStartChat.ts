import { useState } from 'react';
import { router } from 'expo-router';
import { errorMessage } from '@/api/client';
import { chatApi } from '@/api/endpoints';
import { useToast } from '@/ui';

/** Open (or create) the conversation about a job, then navigate to it. */
export function useStartChat() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const start = async (jobId: string, userId?: string) => {
    setBusy(true);
    try {
      const c = await chatApi.start(jobId, userId);
      router.push({ pathname: '/chat/[id]', params: { id: c._id } });
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };
  return { start, busy };
}
