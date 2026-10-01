import { describe, expect, it } from 'vitest';
import {
  checkMigrationStatus,
  describePendingMigrations,
  findPendingMigrations,
  REGISTRY_MIGRATION_VERSION,
} from './migrationStatus';

describe('findPendingMigrations', () => {
  it('returns the expected versions that are not applied, in order', () => {
    // Arrange
    const expected = ['20260101000000', '20260717120000', '20261001000000'];
    const applied = ['20260101000000'];

    // Act
    const pending = findPendingMigrations(expected, applied);

    // Assert
    expect(pending).toEqual(['20260717120000', '20261001000000']);
  });

  it('returns nothing when every expected version is applied', () => {
    // Arrange
    const expected = ['20260101000000'];
    const applied = ['20260101000000', '20260999000000'];

    // Act / Assert
    expect(findPendingMigrations(expected, applied)).toEqual([]);
  });
});

describe('checkMigrationStatus', () => {
  const expected = ['20260101000000', REGISTRY_MIGRATION_VERSION];

  it('reports up to date when the database has every migration', async () => {
    // Arrange
    const fetchApplied = async () => ({ versions: [...expected], error: null });

    // Act
    const status = await checkMigrationStatus({ expected, fetchApplied });

    // Assert
    expect(status).toEqual({ state: 'up-to-date', pending: [] });
  });

  it('reports the pending versions when the database is behind', async () => {
    // Arrange
    const fetchApplied = async () => ({
      versions: ['20260101000000'],
      error: null,
    });

    // Act
    const status = await checkMigrationStatus({ expected, fetchApplied });

    // Assert
    expect(status).toEqual({ state: 'pending', pending: ['20261001000000'] });
  });

  it('treats only the registry migration and later ones as pending when the registry function does not exist yet', async () => {
    // Arrange: PostgREST answers PGRST202 when the function is missing; earlier
    // migrations cannot be checked without it, so they are not reported
    const withLater = [
      '20260101000000',
      REGISTRY_MIGRATION_VERSION,
      '20270101000000',
    ];
    const fetchApplied = async () => ({
      versions: null,
      error: { code: 'PGRST202', message: 'function not found' },
    });

    // Act
    const status = await checkMigrationStatus({
      expected: withLater,
      fetchApplied,
    });

    // Assert
    expect(status).toEqual({
      state: 'pending',
      pending: [REGISTRY_MIGRATION_VERSION, '20270101000000'],
    });
  });

  it('reports unknown (not pending) on any other error, such as a network failure', async () => {
    // Arrange
    const fetchApplied = async () => ({
      versions: null,
      error: { code: '', message: 'Failed to fetch' },
    });

    // Act
    const status = await checkMigrationStatus({ expected, fetchApplied });

    // Assert
    expect(status).toEqual({ state: 'unknown', pending: [] });
  });

  it('reports unknown when the fetch itself throws', async () => {
    // Arrange
    const fetchApplied = async () => {
      throw new Error('offline');
    };

    // Act
    const status = await checkMigrationStatus({ expected, fetchApplied });

    // Assert
    expect(status.state).toBe('unknown');
  });

  it('reports up to date when the app was built with no migration list', async () => {
    // Arrange
    const fetchApplied = async () => ({ versions: [], error: null });

    // Act
    const status = await checkMigrationStatus({ expected: [], fetchApplied });

    // Assert
    expect(status).toEqual({ state: 'up-to-date', pending: [] });
  });
});

describe('describePendingMigrations', () => {
  it('describes a single pending migration in singular', () => {
    // Arrange / Act
    const message = describePendingMigrations(['20261001000000']);

    // Assert
    expect(message.title).toBe('Base de datos desactualizada');
    expect(message.description).toBe(
      'Falta 1 migración. Ejecuta npm run db:migrate para aplicarla.'
    );
  });

  it('describes several pending migrations in plural', () => {
    // Arrange / Act
    const message = describePendingMigrations(['1', '2', '3']);

    // Assert
    expect(message.description).toBe(
      'Faltan 3 migraciones. Ejecuta npm run db:migrate para aplicarlas.'
    );
  });
});
