import type { TestDetails } from '@playwright/test';
import { documented } from '../testDoc';
import { BUG_KNOWLEDGE, type BugId } from './bugKnowledge';
import { BUG_TYPE } from './bugNarration';

export const BUGS_AREA = 'Bugs conocidos (se espera que fallen)';
export const CONTROLS_AREA = 'Controles de los bugs (deben pasar)';

/**
 * Ficha of a known-bug spec. The test asserts the CORRECT behavior, so it is
 * red today; `actual` says what the app does instead. Why it happens, what to
 * fix and where come from `BUG_KNOWLEDGE` by id, so every bug has them. The flow
 * for fixing it is in docs/agents/workflow.md (red e2e, user confirms, then fix).
 */
export function bugDoc(input: {
  id: BugId;
  titulo: string;
  intent: string;
  steps: string[];
  expects: string[];
  actual: string;
  /** A control passes today: it pins the behavior next to the bug. */
  control?: boolean;
}): TestDetails {
  const knowledge = BUG_KNOWLEDGE[input.id];
  const base = documented({
    titulo: `[${input.id}${input.control ? ' control' : ''}] ${input.titulo}`,
    area: input.control ? CONTROLS_AREA : BUGS_AREA,
    intent: input.intent,
    steps: input.steps,
    expects: input.expects,
    data: input.control
      ? 'Debe pasar hoy y seguir pasando después de corregir el bug.'
      : `Hoy falla porque ${input.actual}.`,
  });
  const extra = [
    { type: BUG_TYPE.id, description: input.id },
    { type: BUG_TYPE.kind, description: input.control ? 'control' : 'bug' },
    { type: BUG_TYPE.actual, description: input.actual },
    { type: BUG_TYPE.cause, description: knowledge.cause },
    { type: BUG_TYPE.fix, description: knowledge.fix },
    { type: BUG_TYPE.where, description: knowledge.where },
    // Same annotation the HTML report has always shown for a bug.
    { type: 'bug', description: `${input.id} · ${knowledge.where}` },
  ];
  return {
    annotation: [
      ...(Array.isArray(base.annotation)
        ? base.annotation
        : base.annotation
        ? [base.annotation]
        : []),
      ...extra,
    ],
  };
}
