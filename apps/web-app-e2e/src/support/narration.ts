import { missingDocParts, type TestDoc } from './testDoc';

/**
 * Pure text formatting for the narrator reporter: how a test is introduced
 * before it runs and how a failure is explained afterwards. No Playwright
 * imports, so it can be checked without a browser.
 */

// Built from the escape character so the pattern has no literal control character.
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

export function stripAnsi(text: string): string {
  return text.replace(ANSI, '');
}

export function formatSeconds(durationMs: number): string {
  return `${(durationMs / 1000).toFixed(1)} s`;
}

export function formatFicha(input: {
  title: string;
  doc: TestDoc;
  position?: { index: number; total: number };
}): string {
  const { title, doc, position } = input;
  const prefix = position ? `[${position.index}/${position.total}] ` : '';
  const lines = [`\n▶ ${prefix}${title}`];

  const missing = missingDocParts(doc);
  if (missing.length > 0) {
    lines.push(
      `   ⚠ Este test no tiene ficha completa (falta: ${missing.join(
        ', '
      )}). Usa documented().`
    );
  }
  if (doc.area) lines.push(`   Área: ${doc.area}`);
  if (doc.intent) lines.push(`   Qué prueba: ${doc.intent}`);
  if (doc.steps.length > 0) {
    lines.push('   Qué hace:');
    doc.steps.forEach((step, i) => lines.push(`     ${i + 1}. ${step}`));
  }
  if (doc.expects.length > 0) {
    lines.push('   Qué espera:');
    doc.expects.forEach((expected) => lines.push(`     · ${expected}`));
  }
  if (doc.data) lines.push(`   Datos: ${doc.data}`);
  return `${lines.join('\n')}\n`;
}

export interface FailureExplanation {
  /** First line of the Playwright message. */
  headline: string;
  locator?: string;
  expected?: string;
  received?: string;
  /** Plain-language reading of the most common failure shapes. */
  hint?: string;
}

function valueAfter(lines: string[], label: string): string | undefined {
  const line = lines.find((candidate) => candidate.startsWith(`${label}:`));
  return line ? line.slice(label.length + 1).trim() : undefined;
}

export function explainFailure(message: string): FailureExplanation {
  const clean = stripAnsi(message);
  const lines = clean.split('\n');
  const headline =
    lines
      .find((line) => line.trim().length > 0)
      ?.replace(/^Error:\s*/, '')
      .trim() ?? 'Error sin mensaje';

  const strict = /strict mode violation.*resolved to (\d+) elements/.exec(
    clean
  );
  const testTimeout = /Test timeout of (\d+)ms exceeded/.exec(clean);

  let hint: string | undefined;
  if (strict) {
    hint =
      'Más de un elemento coincide con el selector, así que Playwright no sabe cuál usar.';
  } else if (testTimeout) {
    hint = `El test superó su tiempo máximo de ${
      Number(testTimeout[1]) / 1000
    } s.`;
  } else if (/Timeout:|waiting for/.test(clean)) {
    hint = 'Se agotó la espera: lo esperado no apareció a tiempo.';
  }

  return {
    headline,
    locator: valueAfter(lines, 'Locator'),
    expected: valueAfter(lines, 'Expected'),
    received: strict
      ? `${strict[1]} elementos coinciden`
      : valueAfter(lines, 'Received'),
    hint,
  };
}

export interface FailureContext {
  durationMs: number;
  message: string;
  location: string;
  evidence: Array<{ name: string; path: string }>;
}

export function formatFailure(failure: FailureContext): string {
  const explanation = explainFailure(failure.message);
  const lines = [`   ✘ Falló en ${formatSeconds(failure.durationMs)}`];
  lines.push(`     Qué falló:  ${explanation.headline}`);
  if (explanation.locator)
    lines.push(`     Buscaba:    ${explanation.locator}`);
  lines.push(
    `     Esperaba:   ${
      explanation.expected ??
      '(no consta en el mensaje; míralo en «Qué espera»)'
    }`
  );
  lines.push(
    `     Encontró:   ${explanation.received ?? '(no consta en el mensaje)'}`
  );
  if (explanation.hint) lines.push(`     Lectura:    ${explanation.hint}`);
  lines.push(`     Dónde:      ${failure.location}`);
  failure.evidence.forEach((item) =>
    lines.push(`     ${item.name.padEnd(11)} ${item.path}`)
  );
  const trace = failure.evidence.find((item) => item.name === 'trace');
  if (trace)
    lines.push(`     Ver traza:  npx playwright show-trace ${trace.path}`);
  return `${lines.join('\n')}\n`;
}

export function formatPassed(durationMs: number): string {
  return `   ✔ Pasó en ${formatSeconds(durationMs)}\n`;
}

export function formatSummary(input: {
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
}): string {
  const { passed, failed, skipped, durationMs } = input;
  const parts = [`${passed} pasaron`];
  if (failed > 0) parts.push(`${failed} fallaron`);
  if (skipped > 0) parts.push(`${skipped} omitidos`);
  return `\n${failed > 0 ? '✘' : '✔'} Resumen: ${parts.join(
    ' · '
  )} en ${formatSeconds(durationMs)}\n`;
}
