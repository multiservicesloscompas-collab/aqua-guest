import type { TestDetails } from '@playwright/test';
import { documented } from '../testDoc';

export const BUGS_AREA = 'Bugs conocidos (se espera que fallen)';
export const CONTROLS_AREA = 'Controles de los bugs (deben pasar)';

/**
 * Ficha of a known-bug spec. The test asserts the CORRECT behavior, so it is
 * red today; `actual` says what the app does instead. The flow for fixing it
 * is in docs/agents/workflow.md (red e2e, user confirms, then fix).
 */
export function bugDoc(input: {
  id: string;
  titulo: string;
  intent: string;
  steps: string[];
  expects: string[];
  actual: string;
  /** A control passes today: it pins the behavior next to the bug. */
  control?: boolean;
}): TestDetails {
  return documented({
    titulo: `[${input.id}${input.control ? ' control' : ''}] ${input.titulo}`,
    area: input.control ? CONTROLS_AREA : BUGS_AREA,
    intent: input.intent,
    steps: input.steps,
    expects: input.expects,
    data: input.control
      ? 'Debe pasar hoy y seguir pasando después de corregir el bug.'
      : `Hoy falla porque ${input.actual}.`,
  });
}
