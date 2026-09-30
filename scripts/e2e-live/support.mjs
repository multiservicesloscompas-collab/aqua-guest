/**
 * Building blocks of the live runner (scripts/e2e-live.mjs): paths, colors,
 * Playwright and database helpers and the prompt reader.
 */
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);
export const E2E_DIR = 'apps/web-app-e2e';
export const MAIN_CONFIG = `${E2E_DIR}/playwright.config.ts`;
export const MAINTENANCE_CONFIG = `${E2E_DIR}/playwright.maintenance.config.ts`;
export const TESTS_DIR = `${E2E_DIR}/src/tests`;

export const paint = (code, text) =>
  process.stdout.isTTY ? `\u001b[${code}m${text}\u001b[0m` : text;
export const bold = (t) => paint('1', t);
export const dim = (t) => paint('2', t);
export const green = (t) => paint('32', t);
export const red = (t) => paint('31', t);
export const yellow = (t) => paint('33', t);

// ------------------------------------------------------------ playwright

export function playwright(args, env = {}, { capture = false } = {}) {
  const options = { cwd: ROOT, env: { ...process.env, ...env } };
  if (capture) {
    return spawnSync('npx', ['playwright', ...args], {
      ...options,
      encoding: 'utf8',
    });
  }
  return new Promise((resolve) => {
    const child = spawn('npx', ['playwright', ...args], {
      ...options,
      stdio: 'inherit',
    });
    child.on('close', (code) => resolve(code ?? 1));
  });
}

/** Row counts per table without deleting anything, or null if unreachable. */
export function readDbCounts() {
  const result = playwright(
    ['test', '-c', MAINTENANCE_CONFIG, '--reporter=line'],
    { E2E_RESET_MODE: 'reset', DRY_RUN: '1' },
    { capture: true }
  );
  const counts = {};
  for (const match of (result.stdout ?? '').matchAll(
    /^\s{2}([a-z_]+)\s+(\d+)\s+->\s+\d+/gm
  )) {
    counts[match[1]] = Number(match[2]);
  }
  return Object.keys(counts).length > 0 ? counts : null;
}

export function describeDb(counts) {
  if (!counts) {
    return red(
      'no se pudo leer (¿Supabase local encendido? npm run supabase:start)'
    );
  }
  const filled = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([table, n]) => `${table} ${n}`);
  return filled.length > 0 ? filled.join(' · ') : 'vacía';
}

export async function maintenance(mode) {
  return playwright(['test', '-c', MAINTENANCE_CONFIG, '--reporter=line'], {
    E2E_RESET_MODE: mode,
  });
}

/** Reads answers line by line and keeps lines that arrive before they are asked for. */
export function createPrompter() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const queued = [];
  const waiting = [];
  let closed = false;
  rl.on('line', (line) => {
    const resolve = waiting.shift();
    if (resolve) resolve(line.trim());
    else queued.push(line.trim());
  });
  rl.on('close', () => {
    closed = true;
    waiting.splice(0).forEach((resolve) => resolve('q'));
  });
  return {
    ask(question) {
      process.stdout.write(question);
      if (queued.length > 0) return Promise.resolve(queued.shift());
      if (closed) return Promise.resolve('q');
      return new Promise((resolve) => waiting.push(resolve));
    },
    close: () => rl.close(),
  };
}

export function ask(prompter, question) {
  return prompter.ask(question);
}
