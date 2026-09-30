#!/usr/bin/env node
/**
 * Interactive runner for the e2e suite. For every test it shows what it tries
 * to do and what result it expects (the `documented()` fichas that live inside
 * the specs), runs it, and then lets you decide what to do with the local data.
 *
 *   npm run e2e:live                          menu
 *   npm run e2e:live -- --explain [texto|all] print fichas, run nothing
 *   npm run e2e:live -- --check               fail if a test has no complete ficha
 *   npm run e2e:live -- --test "propinas" --headless --yes
 *   npm run e2e:live -- --help
 *
 * Every e2e test wipes the LOCAL database first (see apps/web-app-e2e/README.md).
 * The Playwright support code aborts unless VITE_SUPABASE_URL is local.
 */
import path from 'node:path';
import {
  displayName,
  estimate,
  formatDuration,
  isBugTest,
  listTests,
  loadTimings,
  missingParts,
  parseSelection,
  renderFicha,
  renderList,
  runCheck,
  selectionArgs,
  testsMatching,
} from './e2e-live/fichas.mjs';
import { HELP, parseArgs } from './e2e-live/cli.mjs';
import { listAdHoc, scenarioFlow } from './e2e-live/scenario.mjs';
import {
  MAIN_CONFIG,
  ask,
  bold,
  createPrompter,
  describeDb,
  dim,
  green,
  maintenance,
  playwright,
  readDbCounts,
  red,
  yellow,
} from './e2e-live/support.mjs';

const FULL_FICHAS_UP_TO = 3;

// ------------------------------------------------------------- running

/** One Playwright run per project: the bugs project has its own config and meaning. */
function buildRuns(selected, options) {
  const projects = [...new Set(selected.map((test) => test.project))];
  return projects.map((project) => {
    const group = selected.filter((test) => test.project === project);
    const { paths, grep } = selectionArgs(group);
    const args = [
      'test',
      '-c',
      MAIN_CONFIG,
      `--project=${project}`,
      '--workers=1',
    ];
    if (options.headed) args.push('--headed');
    if (options.debug) args.push('--debug');
    args.push(...paths, '-g', grep);
    const env = { E2E_NARRATE: '1', ...options.extraEnv };
    if (options.slowMo > 0 && (options.headed || options.debug)) {
      env.SLOWMO = String(options.slowMo);
    }
    return { project, args, env };
  });
}

function describeMode(options) {
  if (options.debug) return 'con el inspector de Playwright (paso a paso)';
  if (options.headed)
    return `con el navegador visible, cámara lenta de ${options.slowMo} ms`;
  return 'sin navegador visible (rápido)';
}

function printPlan(selected, options, timings) {
  console.log(`\n${bold(`Vas a ejecutar ${selected.length} test(s)`)}`);
  if (selected.length <= FULL_FICHAS_UP_TO) {
    selected.forEach((test) => console.log(renderFicha(test, timings)));
  } else {
    selected.forEach((test) =>
      console.log(`  · ${displayName(test)}\n    ${dim(test.doc.intent)}`)
    );
    console.log(
      dim(
        '\n  (Con 3 tests o menos se muestra la ficha completa; usa --explain para verlas.)'
      )
    );
  }
  const { seconds, measured } = estimate(selected, timings);
  console.log(`\n  Cómo:      ${describeMode(options)}`);
  console.log(
    `  Duración:  ${measured ? '' : 'aprox. '}${formatDuration(seconds)}${
      measured ? ' (medida en la última corrida)' : ''
    }`
  );
  console.log(
    `  ${yellow(
      'Base local:'
    )} antes de CADA test se borra y se siembra de nuevo (tasa 1000, 19 L = 700, Lavadora 1-5, Cliente Prueba 1-4).`
  );
  console.log(`  Ahora hay: ${describeDb(readDbCounts())}\n`);
}

async function afterRun(prompter, mode) {
  console.log(
    `\n${bold('Base local tras la ejecución:')} ${describeDb(readDbCounts())}`
  );
  let choice = mode;
  if (!choice && prompter) {
    choice = (
      await ask(
        prompter,
        '¿Qué hago con la base? [r] reiniciar a la línea base · [v] vaciar por completo · [Enter] dejarla: '
      )
    ).toLowerCase();
  }
  if (choice === 'r' || choice === 'reset') await maintenance('reset');
  if (choice === 'v' || choice === 'purge') await maintenance('purge');
}

async function execute({ selected, options, prompter, yes, printOnly, after }) {
  const timings = loadTimings();
  const runs = buildRuns(selected, options);
  if (printOnly) {
    for (const { args, env } of runs) {
      const prefix = Object.entries(env)
        .map(([k, v]) => `${k}=${v} `)
        .join('');
      console.log(
        `${prefix}npx playwright ${args
          .map((a) => (/\s/.test(a) ? JSON.stringify(a) : a))
          .join(' ')}`
      );
    }
    return 0;
  }
  printPlan(selected, options, timings);
  if (!yes) {
    const answer = prompter
      ? (await ask(prompter, '¿Ejecutar? [s/N]: ')).toLowerCase()
      : '';
    if (answer !== 's' && answer !== 'y') {
      console.log('Cancelado. No se tocó nada.');
      return 0;
    }
  }
  let code = 0;
  for (const run of runs) {
    const result = await playwright(run.args, run.env);
    if (run.project === 'bugs') {
      console.log(
        yellow(
          result === 0
            ? '¡Todo pasó! Si había bugs en la lista, revisa si ya están corregidos.'
            : 'Los bugs conocidos fallan a propósito y los controles deben pasar: revisa el ✔/✘ de cada test arriba.'
        )
      );
    } else {
      code ||= result;
      console.log(
        result === 0
          ? green('✔ Todo en verde')
          : red(`✘ Falló (código ${result})`)
      );
    }
  }
  await afterRun(yes && !after ? null : prompter, after);
  return code;
}

// ---------------------------------------------------------------- menu

async function pickTests(prompter, tests, title) {
  console.log(`\n${bold(title)}${renderList(tests)}`);
  const text = await ask(
    prompter,
    '\nElige: un número (3), varios (3,5), rango (3-6), a = todos menos los bugs, Enter = volver: '
  );
  if (text === '' || text.toLowerCase() === 'q') return [];
  if (text.toLowerCase() === 'a') return tests.filter((t) => !isBugTest(t));
  const indexes = parseSelection(text, tests.length);
  if (!indexes) {
    console.log(red('Selección no válida.'));
    return [];
  }
  return indexes.map((i) => tests[i]);
}

async function settings(prompter, options) {
  console.log(
    `\n${bold('Ajustes')}  ${dim(`(ahora: ${describeMode(options)})`)}`
  );
  console.log('  1  Navegador visible (sí/no)');
  console.log('  2  Inspector de Playwright, paso a paso (sí/no)');
  console.log('  3  Cámara lenta en milisegundos');
  const choice = await ask(prompter, 'Elige (Enter = volver): ');
  if (choice === '1') options.headed = !options.headed;
  else if (choice === '2') options.debug = !options.debug;
  else if (choice === '3') {
    const value = Number(await ask(prompter, 'Milisegundos (0 = sin pausa): '));
    if (Number.isFinite(value) && value >= 0) options.slowMo = value;
  }
}

async function databaseMenu(prompter) {
  console.log(
    `\n${bold('Base de datos local')}: ${describeDb(readDbCounts())}`
  );
  console.log('  r  Reiniciar a la línea base');
  console.log('  v  Vaciar por completo (cero absoluto)');
  const choice = (
    await ask(prompter, 'Elige (Enter = volver): ')
  ).toLowerCase();
  if (choice !== 'r' && choice !== 'v') return;
  const what =
    choice === 'r' ? 'reiniciar a la línea base' : 'VACIAR por completo';
  const ok = (
    await ask(prompter, `Esto va a ${what} la base LOCAL. ¿Seguro? [s/N]: `)
  ).toLowerCase();
  if (ok === 's') await maintenance(choice === 'r' ? 'reset' : 'purge');
}

async function menu(prompter, tests, options) {
  for (;;) {
    console.log(
      `\n${bold('AquaGuest · E2E en vivo')}  ${dim(
        `${tests.length} tests · ${describeMode(options)}`
      )}`
    );
    console.log('  1  Ejecutar tests');
    console.log('  2  Ver qué prueba cada test (sin ejecutar)');
    console.log('  3  Base de datos (reiniciar / vaciar)');
    console.log('  4  Ajustes (navegador visible, cámara lenta, inspector)');
    console.log(
      '  5  Armar un escenario (por ejemplo: venta mixta + alquiler con propina)'
    );
    console.log('  q  Salir');
    const choice = (await ask(prompter, '\n> ')).toLowerCase();
    if (choice === 'q') return;
    if (choice === '1') {
      const selected = await pickTests(
        prompter,
        tests,
        'Qué test quieres ejecutar'
      );
      if (selected.length > 0) await execute({ selected, options, prompter });
    } else if (choice === '2') {
      const selected = await pickTests(
        prompter,
        tests,
        'De qué test quieres ver la ficha'
      );
      const timings = loadTimings();
      selected.forEach((test) => console.log(renderFicha(test, timings)));
    } else if (choice === '3') await databaseMenu(prompter);
    else if (choice === '4') await settings(prompter, options);
    else if (choice === '5') {
      await scenarioFlow(prompter, async (test, file) =>
        execute({
          selected: [test],
          options: { ...options, extraEnv: { E2E_SCENARIO: file } },
          prompter,
        })
      );
    } else if (choice !== '') console.log(red('Opción no válida.'));
  }
}

// ----------------------------------------------------------------- cli

function selectFromFlags(args, tests) {
  if (args.all) return { selected: tests.filter((t) => !isBugTest(t)) };
  if (args.bugs) return { selected: tests.filter(isBugTest) };
  const byFile = args.specs.length > 0 ? args.specs : null;
  const unknown = (byFile ?? []).filter(
    (id) => !tests.some((t) => t.fileId === id)
  );
  if (unknown.length > 0)
    return { error: `Archivo desconocido: ${unknown.join(', ')}. Usa --list.` };
  let selected = byFile
    ? tests.filter((t) => byFile.includes(t.fileId))
    : tests;
  if (args.test) selected = testsMatching(selected, args.test);
  if (selected.length === 0)
    return { error: 'Ningún test coincide. Usa --list.' };
  return { selected };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return void console.log(HELP);

  const { tests, error } = listTests();
  if (tests.length === 0) {
    console.error(red(`No se pudieron listar los tests. ${error}`));
    process.exitCode = 1;
    return;
  }
  const options = {
    headed: args.headed,
    debug: args.debug,
    slowMo: args.slowMo,
  };

  if (args.check) {
    process.exitCode = runCheck(tests);
    return;
  }
  if (args.explain !== undefined) {
    const shown =
      args.explain === 'all' ? tests : testsMatching(tests, args.explain);
    if (shown.length === 0)
      console.error(red(`Ningún test coincide con «${args.explain}».`));
    const timings = loadTimings();
    shown.forEach((test) => console.log(renderFicha(test, timings)));
    return;
  }
  if (args.list) {
    console.log(renderList(tests));
    console.log(`\nBase local: ${describeDb(readDbCounts())}`);
    return;
  }

  if (args.scenario) {
    const file = path.resolve(args.scenario);
    const { test, error: scenarioError } = listAdHoc(file);
    if (!test) {
      console.error(
        red(`No se pudo leer el escenario ${file}. ${scenarioError}`)
      );
      process.exitCode = 1;
      return;
    }
    const prompter = process.stdin.isTTY ? createPrompter() : null;
    process.exitCode = await execute({
      selected: [test],
      options: { ...options, extraEnv: { E2E_SCENARIO: file } },
      prompter,
      yes: args.yes,
      printOnly: args.print,
      after: args.after === 'none' ? undefined : args.after,
    });
    prompter?.close();
    return;
  }

  const wantsRun = args.all || args.bugs || args.specs.length > 0 || args.test;
  if (wantsRun) {
    const { selected, error: selectError } = selectFromFlags(args, tests);
    if (selectError) {
      console.error(red(selectError));
      process.exitCode = 1;
      return;
    }
    if (!args.yes && !args.print && !process.stdin.isTTY) {
      console.error(
        red(
          'Sin terminal interactiva hay que pasar --yes (los tests borran la base LOCAL).'
        )
      );
      process.exitCode = 1;
      return;
    }
    const prompter = process.stdin.isTTY ? createPrompter() : null;
    process.exitCode = await execute({
      selected,
      options,
      prompter,
      yes: args.yes,
      printOnly: args.print,
      after: args.after === 'none' ? undefined : args.after,
    });
    prompter?.close();
    return;
  }

  const prompter = createPrompter();
  await menu(prompter, tests, options);
  prompter.close();
}

main();
