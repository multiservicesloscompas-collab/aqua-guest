import { resolveMatrixSeedFromEnv } from './seededRng';

export interface MatrixRunMarker {
  runMarker: string;
  notePrefix: string;
  seed: number;
}

export function createMatrixRunMarker(): MatrixRunMarker {
  const seed = resolveMatrixSeedFromEnv();
  const runMarker = `E2E_TIPS_MATRIX_${Date.now()}_${seed}`;

  return {
    runMarker,
    notePrefix: runMarker,
    seed,
  };
}

export function createScenarioNote(
  runMarker: string,
  scenarioId: string
): string {
  return `${runMarker}::${scenarioId}`;
}
