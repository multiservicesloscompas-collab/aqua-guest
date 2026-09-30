#!/usr/bin/env node
/**
 * Interactive runner for the known-bug specs (red on purpose). For every bug it
 * shows the objective, why it fails today and what to fix, runs it with the
 * browser visible, and says afterwards whether the bug is still open.
 *
 *   npm run e2e:bugs                      menu
 *   npm run e2e:bugs -- --explain [B10|all]   print the explanation, run nothing
 *   npm run e2e:bugs -- --id B9,FIN-02 --yes  run those bugs and their controls
 *   npm run e2e:bugs -- --check               fail if a bug has no cause/fix/where
 *   npm run e2e:bugs -- --help
 *
 * Plain non-interactive run (CI, agents): npm run e2e:bugs:ci
 * Every test wipes the LOCAL database first (see apps/web-app-e2e/README.md).
 */
import { listTests, parseSelection } from './e2e-live/fichas.mjs';
import {
  checkBugs,
  onlyBugs,
  renderBugFicha,
  renderBugList,
  testsForIds,
  testsForText,
} from './e2e-live/bugFichas.mjs';
import { bugsSettings, parseBugArgs, BUGS_HELP } from './e2e-live/bugsCli.mjs';
import { databaseMenu, describeMode, execute } from './e2e-live/run.mjs';
import {
  ask,
  bold,
  createPrompter,
  describeDb,
  dim,
  readDbCounts,
  red,
} from './e2e-live/support.mjs';

async function pickBugs(prompter, bugs, title) {
  console.log(`\n${bold(title)}${renderBugList(bugs)}`);
  const text = await ask(
    prompter,
    '\nElige: un número (3), varios (3,5), rango (3-6), a = todos, Enter = volver: '
  );
  if (text === '' || text.toLowerCase() === 'q') return [];
  const indexes = parseSelection(text, bugs.length);
  if (!indexes) {
    console.log(red('Selección no válida.'));
    return [];
  }
  return indexes.map((i) => bugs[i]);
}

async function menu(prompter, bugs, options) {
  const open = bugs.filter((t) => t.doc.bug.kind === 'bug').length;
  for (;;) {
    console.log(
      `\n${bold('AquaGuest · Bugs conocidos')}  ${dim(
        `${open} bugs · ${bugs.length - open} controles · ${describeMode(
          options
        )}`
      )}`
    );
    console.log('  1  Ejecutar bugs (elegir)');
    console.log(
      '  2  Ver qué intenta, por qué falla y qué arreglar (sin ejecutar)'
    );
    console.log('  3  Ejecutar todos los bugs y controles');
    console.log('  4  Ajustes (navegador, cámara lenta, pausar en el fallo)');
    console.log('  5  Base de datos (reiniciar / vaciar)');
    console.log('  q  Salir');
    const choice = (await ask(prompter, '\n> ')).toLowerCase();
    if (choice === 'q') return;
    if (choice === '1') {
      const selected = await pickBugs(
        prompter,
        bugs,
        'Qué bug quieres ejecutar'
      );
      if (selected.length > 0) await execute({ selected, options, prompter });
    } else if (choice === '2') {
      const selected = await pickBugs(
        prompter,
        bugs,
        'De qué bug quieres verla'
      );
      selected.forEach((test) => console.log(renderBugFicha(test)));
    } else if (choice === '3') {
      await execute({ selected: bugs, options, prompter });
    } else if (choice === '4') await bugsSettings(prompter, options);
    else if (choice === '5') await databaseMenu(prompter);
    else if (choice !== '') console.log(red('Opción no válida.'));
  }
}

function select(args, bugs) {
  if (args.ids.length > 0) {
    const selected = testsForIds(bugs, args.ids);
    return selected.length > 0
      ? { selected }
      : { error: `Ningún bug con id ${args.ids.join(', ')}. Usa --list.` };
  }
  return { selected: bugs };
}

async function main() {
  const args = parseBugArgs(process.argv.slice(2));
  if (args.help) return void console.log(BUGS_HELP);

  const { tests, error } = listTests();
  const bugs = onlyBugs(tests);
  if (bugs.length === 0) {
    console.error(red(`No se pudieron listar los bugs. ${error}`));
    process.exitCode = 1;
    return;
  }
  const options = {
    headed: args.headed,
    debug: args.debug,
    slowMo: args.slowMo,
    pauseOnFail: args.pauseOnFail && args.headed && !args.debug,
  };

  if (args.check) {
    process.exitCode = checkBugs(bugs);
    return;
  }
  if (args.explain !== undefined) {
    const shown =
      args.explain === 'all' ? bugs : testsForText(bugs, args.explain);
    if (shown.length === 0)
      console.error(red(`Ningún bug coincide con «${args.explain}».`));
    shown.forEach((test) => console.log(renderBugFicha(test)));
    return;
  }
  if (args.list) {
    console.log(renderBugList(bugs));
    console.log(`\nBase local: ${describeDb(readDbCounts())}`);
    return;
  }

  if (args.ids.length > 0 || args.all) {
    const { selected, error: selectError } = select(args, bugs);
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
    await execute({
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
  await menu(prompter, bugs, options);
  prompter.close();
}

main();
