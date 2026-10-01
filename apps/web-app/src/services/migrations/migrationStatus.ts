export type MigrationState = 'up-to-date' | 'pending' | 'unknown';

export interface MigrationStatus {
  state: MigrationState;
  pending: string[];
}

interface FetchAppliedResult {
  versions: string[] | null;
  error: { code?: string; message: string } | null;
}

interface CheckMigrationStatusInput {
  expected: readonly string[];
  fetchApplied: () => Promise<FetchAppliedResult>;
}

/** Migration that creates `applied_migration_versions()`; without it the registry cannot be read. */
export const REGISTRY_MIGRATION_VERSION = '20261001000000';

/** PostgREST error when `applied_migration_versions()` is not in the database yet. */
const MISSING_FUNCTION_CODE = 'PGRST202';

export function findPendingMigrations(
  expected: readonly string[],
  applied: readonly string[]
): string[] {
  const appliedSet = new Set(applied);
  return expected.filter((version) => !appliedSet.has(version));
}

export async function checkMigrationStatus({
  expected,
  fetchApplied,
}: CheckMigrationStatusInput): Promise<MigrationStatus> {
  if (expected.length === 0) {
    return { state: 'up-to-date', pending: [] };
  }

  try {
    const { versions, error } = await fetchApplied();

    if (error?.code === MISSING_FUNCTION_CODE) {
      return {
        state: 'pending',
        pending: expected.filter((v) => v >= REGISTRY_MIGRATION_VERSION),
      };
    }
    if (error || versions === null) {
      return { state: 'unknown', pending: [] };
    }

    const pending = findPendingMigrations(expected, versions);
    return pending.length > 0
      ? { state: 'pending', pending }
      : { state: 'up-to-date', pending: [] };
  } catch {
    return { state: 'unknown', pending: [] };
  }
}

export function describePendingMigrations(pending: readonly string[]): {
  title: string;
  description: string;
} {
  const count = pending.length;
  const description =
    count === 1
      ? 'Falta 1 migración. Ejecuta npm run db:migrate para aplicarla.'
      : `Faltan ${count} migraciones. Ejecuta npm run db:migrate para aplicarlas.`;
  return { title: 'Base de datos desactualizada', description };
}
