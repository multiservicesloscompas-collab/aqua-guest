import { explainFailure, formatSeconds, stripAnsi } from '../narration';
import type { TestDoc } from '../testDoc';

/**
 * Pure text for the bug runner (`npm run e2e:bugs`): how a known bug introduces
 * itself (objective, why it fails, what to fix) and how its result is read.
 * A bug is RED on purpose, so a red result means "still open", not "broken".
 * No Playwright imports, so it can be checked without a browser.
 */

export const BUG_TYPE = {
  id: 'bug-id',
  kind: 'bug-kind',
  actual: 'bug-actual',
  cause: 'bug-cause',
  fix: 'bug-fix',
  where: 'bug-where',
} as const;

export interface BugInfo {
  id: string;
  kind: 'bug' | 'control';
  actual: string;
  cause: string;
  fix: string;
  where: string;
}

interface AnnotationLike {
  type: string;
  description?: string;
}

/** Rebuilds the bug information from a test's annotations, or null if it is not a bug spec. */
export function readBugInfo(
  annotations: readonly AnnotationLike[]
): BugInfo | null {
  const text = (type: string) =>
    annotations.find((a) => a.type === type)?.description ?? '';
  const id = text(BUG_TYPE.id);
  if (!id) return null;
  return {
    id,
    kind: text(BUG_TYPE.kind) === 'control' ? 'control' : 'bug',
    actual: text(BUG_TYPE.actual),
    cause: text(BUG_TYPE.cause),
    fix: text(BUG_TYPE.fix),
    where: text(BUG_TYPE.where),
  };
}

export function missingBugParts(info: BugInfo): string[] {
  const missing: string[] = [];
  if (!info.actual) missing.push('actual');
  if (!info.cause) missing.push('cause');
  if (!info.fix) missing.push('fix');
  if (!info.where) missing.push('where');
  return missing;
}

/** The ficha block shared by the live run and `--explain`. */
export function formatBugDetails(info: BugInfo): string[] {
  if (info.kind === 'control') {
    return [
      '   Es un CONTROL: hoy pasa y debe seguir pasando cuando se corrija el bug.',
      '   Fija el comportamiento que está al lado del bug para no romperlo al arreglarlo.',
    ];
  }
  return [
    `   Por qué falla hoy: ${info.actual}.`,
    `   Causa:             ${info.cause}`,
    `   Qué arreglar:      ${info.fix}`,
    `   Dónde:             ${info.where}`,
  ];
}

export function formatBugFicha(input: {
  title: string;
  doc: TestDoc;
  info: BugInfo;
  position?: { index: number; total: number };
}): string {
  const { title, doc, info, position } = input;
  const prefix = position ? `[${position.index}/${position.total}] ` : '';
  const lines = [`\n▶ ${prefix}${title}`];
  if (doc.intent) lines.push(`   Objetivo: ${doc.intent}`);
  if (doc.steps.length > 0) {
    lines.push('   Qué hace:');
    doc.steps.forEach((step, i) => lines.push(`     ${i + 1}. ${step}`));
  }
  if (doc.expects.length > 0) {
    lines.push('   Qué debería pasar:');
    doc.expects.forEach((expected) => lines.push(`     · ${expected}`));
  }
  lines.push(...formatBugDetails(info));
  return `${lines.join('\n')}\n`;
}

export type BugVerdict =
  | 'open'
  | 'fixed'
  | 'other-cause'
  | 'control-ok'
  | 'regression';

/** Was the failure the business assertion (good) or something else, like a timeout? */
export function isBusinessAssertion(message: string): boolean {
  const clean = stripAnsi(message);
  if (/strict mode violation|Test timeout of/.test(clean)) return false;
  return /^\s*(Error: )?expect(\.poll)?\(/m.test(clean);
}

/** Lines of a comparison failure (diff of arrays or objects) when it has no Expected/Received pair. */
export function assertionDetail(message: string, maxLines = 10): string[] {
  const lines = stripAnsi(message).split('\n').slice(1);
  const detail: string[] = [];
  for (const line of lines) {
    if (/^\s*(Call log|Call Log):?/.test(line) || /^\s+at /.test(line)) break;
    if (line.trim()) detail.push(line.trimEnd());
    if (detail.length >= maxLines) break;
  }
  return detail;
}

export function classifyBugResult(input: {
  kind: 'bug' | 'control';
  status: 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted';
  message?: string;
}): BugVerdict {
  const passed = input.status === 'passed';
  if (input.kind === 'control') return passed ? 'control-ok' : 'regression';
  if (passed) return 'fixed';
  return isBusinessAssertion(input.message ?? '') ? 'open' : 'other-cause';
}

export const VERDICT_LABEL: Record<BugVerdict, string> = {
  open: '🔴 Sigue abierto (es lo esperado)',
  fixed: '🟢 Pasó: el bug parece corregido',
  'other-cause': '⚠ Falló por otra causa (revisar el test)',
  'control-ok': '🟢 Control en verde',
  regression: '⚠ Regresión: un control debe pasar siempre',
};

export function formatBugOutcome(input: {
  info: BugInfo;
  verdict: BugVerdict;
  durationMs: number;
  message?: string;
  evidence?: Array<{ name: string; path: string }>;
}): string {
  const { info, verdict, durationMs, message, evidence = [] } = input;
  const lines = [`   ${VERDICT_LABEL[verdict]} · ${formatSeconds(durationMs)}`];
  if (verdict === 'open' || verdict === 'other-cause') {
    const explanation = explainFailure(message ?? '');
    if (verdict === 'other-cause') {
      lines.push(`     Error:      ${explanation.headline}`);
      if (explanation.hint) lines.push(`     Lectura:    ${explanation.hint}`);
    } else {
      if (explanation.expected)
        lines.push(`     Esperaba:   ${explanation.expected}`);
      if (explanation.received)
        lines.push(`     Encontró:   ${explanation.received}`);
      if (!explanation.expected && !explanation.received) {
        const detail = assertionDetail(message ?? '');
        if (detail.length > 0) {
          lines.push('     Diferencia (- esperado, + encontrado):');
          detail.forEach((line) => lines.push(`       ${line}`));
        }
      }
      lines.push(`     Para cerrarlo: ${info.fix}`);
      lines.push(`     Dónde:         ${info.where}`);
    }
  }
  if (verdict === 'fixed') {
    lines.push(
      '     Confírmalo con el usuario y mueve el test fuera de bugs/ como prueba normal.'
    );
  }
  if (verdict === 'regression') {
    const explanation = explainFailure(message ?? '');
    lines.push(`     Error:      ${explanation.headline}`);
  }
  evidence.forEach((item) =>
    lines.push(`     ${item.name.padEnd(11)} ${item.path}`)
  );
  return `${lines.join('\n')}\n`;
}

export interface BugSummaryRow {
  id: string;
  title: string;
  verdict: BugVerdict;
}

export function formatBugSummary(rows: BugSummaryRow[]): string {
  if (rows.length === 0) return '';
  const count = (verdict: BugVerdict) =>
    rows.filter((row) => row.verdict === verdict).length;
  const lines = ['\nEstado de los bugs'];
  rows.forEach((row) =>
    lines.push(`  ${VERDICT_LABEL[row.verdict].slice(0, 2)} ${row.title}`)
  );
  const parts = [
    `${count('open')} abiertos`,
    `${count('fixed')} corregidos`,
    `${count('control-ok')} controles en verde`,
  ];
  if (count('other-cause') > 0)
    parts.push(`${count('other-cause')} con otra causa`);
  if (count('regression') > 0) parts.push(`${count('regression')} regresiones`);
  lines.push(`  ${parts.join(' · ')}`);
  return `${lines.join('\n')}\n`;
}
