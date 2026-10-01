/**
 * Shared by the live runner (e2e-live.mjs) and the bug runner (e2e-bugs.mjs):
 * builds the Playwright runs for a selection, prints the plan, runs it and
 * asks what to do with the local database afterwards.
 */
import {
  displayName,
  estimate,
  formatDuration,
  loadTimings,
  renderFicha,
  selectionArgs,
} from './fichas.mjs';
import {
  MAIN_CONFIG,
  ask,
  bold,
  describeDb,
  dim,
  green,
  maintenance,
  playwright,
  readDbCounts,
  red,
  wasInterrupted,
  yellow,
} from './support.mjs';

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
    if (options.pauseOnFail) args.push('--timeout=0');
    args.push(...paths, '-g', grep);
    const env = { E2E_NARRATE: '1', ...options.extraEnv };
    if (options.slowMo > 0 && (options.headed || options.debug)) {
      env.SLOWMO = String(options.slowMo);
    }
    if (options.pauseOnFail) env.E2E_PAUSE_ON_FAIL = '1';
    return { project, args, env };
  });
}

export function describeMode(options) {
  if (options.debug) return 'con el inspector de Playwright (paso a paso)';
  if (options.headed) {
    const pause = options.pauseOnFail ? ' · se detiene en cada fallo' : '';
    return `con el navegador visible, cámara lenta de ${options.slowMo} ms${pause}`;
  }
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

export async function execute({
  selected,
  options,
  prompter,
  yes,
  printOnly,
  after,
}) {
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
    if (wasInterrupted()) {
      console.log(
        yellow(
          '\nInterrumpido. La base local quedó como la dejó el test (usa la opción 3 del menú o npm run e2e:reset).'
        )
      );
      prompter?.close();
      process.exit(130);
    }
    if (run.project === 'bugs') {
      console.log(
        yellow(
          result === 0
            ? '¡Todo pasó! Si había bugs en la lista, revisa si ya están corregidos.'
            : 'Los bugs fallan a propósito (🔴 = sigue abierto) y los controles deben pasar: mira la tabla «Estado de los bugs» arriba.'
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

export async function databaseMenu(prompter) {
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
