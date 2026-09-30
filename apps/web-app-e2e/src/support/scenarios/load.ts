import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { SCENARIOS } from './library';
import { buildPairwiseScenarios } from './pairwise';
import type { Scenario } from './types';

const SAVED_DIR = path.resolve(__dirname, '../../scenarios');
const STEP_TYPES = [
  'sale',
  'rental',
  'expense',
  'transfer',
  'payTip',
  'markPaid',
  'delete',
  'edit',
];

function readScenario(file: string, fallbackId: string): Scenario {
  const raw = JSON.parse(readFileSync(file, 'utf8')) as Partial<Scenario>;
  const steps = raw.steps ?? [];
  if (steps.length === 0 || !steps.every((s) => STEP_TYPES.includes(s.type))) {
    throw new Error(`Invalid scenario file: ${file}`);
  }
  return {
    id: raw.id ?? fallbackId,
    titulo: raw.titulo ?? fallbackId,
    area: raw.area ?? 'A la carta',
    intent: raw.intent ?? 'Escenario armado desde el menú.',
    steps,
  };
}

/** Library + pairwise cover + saved JSON scenarios + the one passed in E2E_SCENARIO. */
export function loadScenarios(): Scenario[] {
  const saved = existsSync(SAVED_DIR)
    ? readdirSync(SAVED_DIR)
        .filter((file) => file.endsWith('.json'))
        .map((file) =>
          readScenario(path.join(SAVED_DIR, file), file.replace('.json', ''))
        )
    : [];
  const adHoc = process.env.E2E_SCENARIO
    ? [readScenario(process.env.E2E_SCENARIO, 'a-la-carta')]
    : [];
  return [...SCENARIOS, ...buildPairwiseScenarios(), ...saved, ...adHoc];
}
