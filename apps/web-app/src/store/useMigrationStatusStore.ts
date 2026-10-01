import { create } from 'zustand';
import supabase from '@/lib/supabaseClient';
import {
  checkMigrationStatus,
  type MigrationStatus,
} from '@/services/migrations/migrationStatus';

interface MigrationStatusState extends MigrationStatus {
  /** True once the pending-migrations toast was shown in this session. */
  notified: boolean;
  check: () => Promise<void>;
  markNotified: () => void;
}

const EXPECTED_MIGRATIONS: readonly string[] =
  typeof __EXPECTED_MIGRATIONS__ === 'undefined' ? [] : __EXPECTED_MIGRATIONS__;

export const useMigrationStatusStore = create<MigrationStatusState>()(
  (set) => ({
    state: 'unknown',
    pending: [],
    notified: false,

    markNotified: () => set({ notified: true }),

    check: async () => {
      const status = await checkMigrationStatus({
        expected: EXPECTED_MIGRATIONS,
        fetchApplied: async () => {
          const { data, error } = await supabase.rpc(
            'applied_migration_versions'
          );
          return { versions: (data as string[] | null) ?? null, error };
        },
      });
      set(status);
    },
  })
);
