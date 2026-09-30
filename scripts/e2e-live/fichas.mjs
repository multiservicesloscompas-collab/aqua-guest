/**
 * Reads the test documentation (`documented()` annotations) straight from the
 * spec files and renders it: the flat test list, one full "ficha" per test, the
 * selection syntax of the menu and the check that every test is documented.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  MAIN_CONFIG,
  ROOT,
  TESTS_DIR,
  bold,
  dim,
  green,
  playwright,
  red,
  yellow,
} from './support.mjs';

const TIMINGS_FILE = path.join(
  ROOT,
  'node_modules/.cache/aquaguest-e2e/timings.json'
);
const DEFAULT_SECONDS = 15;
const INTERNAL_AREA = 'Herramientas de prueba (internas)';

export const displayName = (test) => test.doc.titulo || test.fullTitle;

function parseDoc(annotations = []) {
  const texts = (type) =>
    annotations
      .filter(
        (annotation) => annotation.type === type && annotation.description
      )
      .map((annotation) => annotation.description);
  return {
    titulo: texts('titulo')[0] ?? '',
    area: texts('area')[0] ?? '',
    intent: texts('intent')[0] ?? '',
    steps: texts('step'),
    expects: texts('expect'),
    data: texts('data').join(' · '),
  };
}

/** Every test of the chromium project with its documentation. */
export function listTests(env = {}) {
  const result = playwright(
    [
      'test',
      '-c',
      MAIN_CONFIG,
      '--project=chromium',
      '--list',
      '--reporter=json',
    ],
    env,
    { capture: true }
  );
  let data;
  try {
    data = JSON.parse(result.stdout);
  } catch {
    return {
      tests: [],
      error: (result.stderr || result.stdout || '').slice(-500),
    };
  }

  const tests = [];
  const walk = (suite, describes) => {
    for (const spec of suite.specs ?? []) {
      const fullTitle = [...describes, spec.title].join(' › ');
      tests.push({
        file: spec.file,
        fileId: spec.file.replace('.e2e.spec.ts', ''),
        line: spec.line,
        title: spec.title,
        fullTitle,
        doc: parseDoc(spec.tests[0]?.annotations),
        timingKey: `${TESTS_DIR}/${spec.file}::${fullTitle}`,
      });
    }
    for (const child of suite.suites ?? [])
      walk(child, [...describes, child.title]);
  };
  data.suites.forEach((fileSuite) => walk(fileSuite, []));
  // Business areas first (in order of appearance), internal tooling checks last.
  const areaOrder = [];
  tests.forEach((test) => {
    if (!areaOrder.includes(test.doc.area)) areaOrder.push(test.doc.area);
  });
  const rank = (test) =>
    test.doc.area === INTERNAL_AREA ? 1000 : areaOrder.indexOf(test.doc.area);
  tests.sort((a, b) => rank(a) - rank(b));
  return {
    tests,
    error: data.errors?.length ? 'Hay errores al listar los tests.' : '',
  };
}

export function loadTimings() {
  if (!existsSync(TIMINGS_FILE)) return {};
  try {
    return JSON.parse(readFileSync(TIMINGS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

const secondsOf = (test, timings) =>
  timings[test.timingKey] === undefined ? null : timings[test.timingKey] / 1000;

/** Seconds for the selection and whether all of them were measured before. */
export function estimate(tests, timings) {
  let total = 0;
  let measured = true;
  for (const test of tests) {
    const seconds = secondsOf(test, timings);
    if (seconds === null) measured = false;
    total += seconds ?? DEFAULT_SECONDS;
  }
  return { seconds: Math.round(total), measured };
}

export function formatDuration(seconds) {
  return seconds < 60 ? `${seconds} s` : `${(seconds / 60).toFixed(1)} min`;
}

export function missingParts(doc) {
  const missing = [];
  if (!doc.titulo) missing.push('titulo');
  if (!doc.area) missing.push('area');
  if (!doc.intent) missing.push('intent');
  if (doc.steps.length === 0) missing.push('steps');
  if (doc.expects.length === 0) missing.push('expects');
  return missing;
}

export function renderFicha(test, timings) {
  const lines = [
    `\n${bold(displayName(test))}`,
    dim(
      `  ${test.doc.area ? `${test.doc.area} · ` : ''}${TESTS_DIR}/${
        test.file
      }:${test.line}`
    ),
  ];
  const missing = missingParts(test.doc);
  if (missing.length > 0) {
    lines.push(
      yellow(
        `  ⚠ Sin ficha completa (falta: ${missing.join(
          ', '
        )}). Usa documented().`
      )
    );
  }
  if (test.doc.intent)
    lines.push(`  ${bold('Qué prueba:')} ${test.doc.intent}`);
  if (test.doc.steps.length > 0) {
    lines.push(`  ${bold('Qué hace:')}`);
    test.doc.steps.forEach((step, i) => lines.push(`    ${i + 1}. ${step}`));
  }
  if (test.doc.expects.length > 0) {
    lines.push(`  ${bold('Qué espera:')}`);
    test.doc.expects.forEach((expected) => lines.push(`    · ${expected}`));
  }
  if (test.doc.data) lines.push(`  ${bold('Datos:')} ${test.doc.data}`);
  const seconds = secondsOf(test, timings);
  lines.push(
    `  ${bold('Duración:')} ${
      seconds === null
        ? 'sin medir todavía'
        : `${seconds.toFixed(1)} s (última corrida)`
    }`
  );
  lines.push(
    `  ${bold(
      'Base local:'
    )} se borra y se siembra la línea base antes de este test.`
  );
  return lines.join('\n');
}

/** Flat numbered list grouped by area, each test with what it expects. */
export function renderList(tests) {
  const lines = [];
  let currentArea = null;
  tests.forEach((test, i) => {
    if (test.doc.area !== currentArea) {
      currentArea = test.doc.area;
      const count = tests.filter(
        (other) => other.doc.area === currentArea
      ).length;
      lines.push(
        `\n  ${bold(currentArea || 'Sin área')} ${dim(
          `(${count} ${count === 1 ? 'test' : 'tests'})`
        )}`
      );
    }
    lines.push(`  ${String(i + 1).padStart(3)}  ${displayName(test)}`);
    const expected = test.doc.expects[0] ?? test.doc.intent;
    lines.push(
      `       ${dim(expected ? `Espera: ${expected}` : '⚠ sin ficha')}`
    );
  });
  return lines.join('\n');
}

/** "3", "3,5", "3-6" or "a" (all) into zero-based indexes, or null if invalid. */
export function parseSelection(text, max) {
  const value = text.trim().toLowerCase();
  if (value === 'a') return Array.from({ length: max }, (_, i) => i);
  const picked = new Set();
  for (const part of value.split(',')) {
    const match = /^(\d+)(?:-(\d+))?$/.exec(part.trim());
    if (!match) return null;
    const from = Number(match[1]);
    const to = match[2] ? Number(match[2]) : from;
    if (from < 1 || to > max || from > to) return null;
    for (let n = from; n <= to; n += 1) picked.add(n - 1);
  }
  return [...picked].sort((a, b) => a - b);
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Playwright arguments that run exactly these tests. */
export function selectionArgs(selected) {
  const args = selected.map((test) => `${TESTS_DIR}/${test.file}:${test.line}`);
  const titles = [...new Set(selected.map((test) => escapeRegExp(test.title)))];
  return { paths: [...new Set(args)], grep: titles.join('|') };
}

export function testsMatching(tests, text) {
  const needle = text.toLowerCase();
  return tests.filter(
    (test) =>
      test.fullTitle.toLowerCase().includes(needle) ||
      displayName(test).toLowerCase().includes(needle) ||
      test.doc.area.toLowerCase().includes(needle) ||
      test.fileId.toLowerCase() === needle
  );
}

/** Prints every test without a complete ficha; returns the exit code. */
export function runCheck(tests) {
  const incomplete = tests.filter((test) => missingParts(test.doc).length > 0);
  incomplete.forEach((test) =>
    console.error(
      red(
        `✘ ${test.file}:${test.line} «${
          test.fullTitle
        }» — falta: ${missingParts(test.doc).join(', ')}`
      )
    )
  );
  if (incomplete.length > 0) {
    console.error(
      `\n${incomplete.length} de ${tests.length} tests sin ficha completa. Usa documented() (ver apps/web-app-e2e/README.md).`
    );
    return 1;
  }
  console.log(green(`✔ ${tests.length} tests, todos con ficha completa.`));
  return 0;
}
