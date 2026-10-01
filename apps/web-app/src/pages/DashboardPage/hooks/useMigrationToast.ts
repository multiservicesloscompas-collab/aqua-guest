import { describePendingMigrations } from '@/services/migrations/migrationStatus';
import { useMigrationStatusStore } from '@/store/useMigrationStatusStore';
import { useEffect } from 'react';
import { toast } from 'sonner';

const TOAST_DURATION_MS = 15_000;

export function useMigrationToast(): void {
  const state = useMigrationStatusStore((s) => s.state);
  const pending = useMigrationStatusStore((s) => s.pending);
  const notified = useMigrationStatusStore((s) => s.notified);
  const check = useMigrationStatusStore((s) => s.check);
  const markNotified = useMigrationStatusStore((s) => s.markNotified);

  useEffect(() => {
    if (window.navigator.onLine) {
      void check();
    }
  }, [check]);

  useEffect(() => {
    if (state !== 'pending' || notified) return;
    const { title, description } = describePendingMigrations(pending);
    toast.warning(title, { description, duration: TOAST_DURATION_MS });
    markNotified();
  }, [state, pending, notified, markNotified]);
}
