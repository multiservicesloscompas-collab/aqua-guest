/**
 * Text of the bug runner: the list of known bugs and the full explanation of
 * each one (objective, why it fails today, what to fix, where).
 */
import { displayName, loadTimings } from './fichas.mjs';
import { bold, dim, green, red, yellow } from './support.mjs';

const AUDIT_DOC = 'docs/audit/production-bugs.md';

export const isControl = (test) => test.doc.bug?.kind === 'control';

/** Bug specs (and their controls) only, bugs first, in id order of appearance. */
export const onlyBugs = (tests) =>
  tests
    .filter((test) => test.doc.bug)
    .sort((a, b) => Number(isControl(a)) - Number(isControl(b)));

/** Tests that belong to the ids given, e.g. "b9,fin-02" (controls included). */
export function testsForIds(tests, ids) {
  const wanted = ids.map((id) => id.trim().toLowerCase());
  return tests.filter((test) => wanted.includes(test.doc.bug.id.toLowerCase()));
}

export function testsForText(tests, text) {
  const needle = text.toLowerCase();
  const byId = tests.filter((t) => t.doc.bug.id.toLowerCase() === needle);
  if (byId.length > 0) return byId;
  return tests.filter(
    (t) =>
      displayName(t).toLowerCase().includes(needle) ||
      t.doc.bug.cause.toLowerCase().includes(needle)
  );
}

export function renderBugList(tests) {
  const lines = [];
  let section = null;
  tests.forEach((test, i) => {
    const name = isControl(test) ? 'Controles (deben pasar)' : 'Bugs abiertos';
    if (name !== section) {
      section = name;
      lines.push(`\n  ${bold(section)}`);
    }
    lines.push(`  ${String(i + 1).padStart(3)}  ${displayName(test)}`);
    lines.push(`       ${dim(test.doc.expects[0] ?? test.doc.intent)}`);
  });
  return lines.join('\n');
}

export function renderBugFicha(test) {
  const { bug } = test.doc;
  const lines = [
    `\n${bold(displayName(test))}`,
    dim(`  ${test.file}:${test.line}`),
    `  ${bold('Objetivo:')} ${test.doc.intent}`,
    `  ${bold('Qué hace:')}`,
    ...test.doc.steps.map((step, i) => `    ${i + 1}. ${step}`),
    `  ${bold('Qué debería pasar:')}`,
    ...test.doc.expects.map((expected) => `    · ${expected}`),
  ];
  if (isControl(test)) {
    lines.push(
      `  ${green(
        'Es un control:'
      )} hoy pasa y debe seguir pasando cuando se corrija el bug.`
    );
  } else {
    lines.push(
      `  ${red('Por qué falla hoy:')} ${bug.actual}.`,
      `  ${yellow('Causa:')} ${bug.cause}`,
      `  ${bold('Qué arreglar:')} ${bug.fix}`,
      `  ${bold('Dónde:')} ${bug.where}`,
      dim(`  Más detalle: ${AUDIT_DOC}`)
    );
  }
  const seconds = loadTimings()[test.timingKey];
  if (seconds !== undefined) {
    lines.push(`  ${bold('Duración:')} ${(seconds / 1000).toFixed(1)} s`);
  }
  return lines.join('\n');
}

/** Prints every bug that lacks an explanation; returns the exit code. */
export function checkBugs(tests) {
  const incomplete = tests.filter(
    (test) =>
      !isControl(test) &&
      (!test.doc.bug.actual ||
        !test.doc.bug.cause ||
        !test.doc.bug.fix ||
        !test.doc.bug.where)
  );
  incomplete.forEach((test) =>
    console.error(
      red(
        `✘ ${test.file}:${test.line} «${displayName(
          test
        )}» sin causa, arreglo o lugar`
      )
    )
  );
  if (incomplete.length > 0) return 1;
  console.log(green(`✔ ${tests.length} tests de bugs, todos explicados.`));
  return 0;
}
