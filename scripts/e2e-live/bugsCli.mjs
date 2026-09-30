import { ask, bold, dim, red } from './support.mjs';

export function parseBugArgs(argv) {
  const out = {
    ids: [],
    all: false,
    list: false,
    yes: false,
    help: false,
    print: false,
    check: false,
    explain: undefined,
    headed: true,
    debug: false,
    pauseOnFail: true,
    slowMo: 300,
    after: undefined,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--id') out.ids.push(...argv[(i += 1)].split(','));
    else if (arg === '--slowmo') out.slowMo = Number(argv[(i += 1)]);
    else if (arg === '--after') out.after = argv[(i += 1)];
    else if (arg === '--explain') {
      const next = argv[i + 1];
      out.explain = next && !next.startsWith('--') ? argv[(i += 1)] : 'all';
    } else if (arg === '--check') out.check = true;
    else if (arg === '--all') out.all = true;
    else if (arg === '--list') out.list = true;
    else if (arg === '--yes') out.yes = true;
    else if (arg === '--print') out.print = true;
    else if (arg === '--headless') out.headed = false;
    else if (arg === '--headed') out.headed = true;
    else if (arg === '--debug') out.debug = true;
    else if (arg === '--no-pause') out.pauseOnFail = false;
    else if (arg === '--help' || arg === '-h') out.help = true;
    else {
      console.error(red(`Argumento desconocido: ${arg}`));
      out.help = true;
    }
  }
  return out;
}

export const BUGS_HELP = `
Uso: npm run e2e:bugs [-- opciones]

  (sin opciones)          menú interactivo
  --explain [ID|texto|all]  qué intenta, por qué falla y qué arreglar; no ejecuta
  --list                  lista de bugs y controles
  --id <ID[,ID]>          ejecuta esos bugs y sus controles (B9, FIN-02, ...)
  --all                   ejecuta todos los bugs y controles
  --check                 falla si algún bug no tiene causa, arreglo y lugar
  --headless              sin navegador visible (por defecto se ve)
  --slowmo <ms>           pausa entre acciones con navegador visible (300)
  --no-pause              no detenerse en la pantalla donde falla el bug
  --debug                 inspector de Playwright, paso a paso
  --yes                   no pedir confirmación (los tests borran la base LOCAL)
  --after reset|purge|none  qué hacer con la base al terminar
  --print                 solo mostrar el comando de Playwright, sin ejecutar

Sin menú ni navegador (CI, agentes): npm run e2e:bugs:ci
`;

export async function bugsSettings(prompter, options) {
  console.log(`\n${bold('Ajustes')}`);
  console.log(`  1  Navegador visible: ${options.headed ? 'sí' : 'no'}`);
  console.log(
    `  2  Detenerse en la pantalla donde falla: ${
      options.pauseOnFail ? 'sí' : 'no'
    } ${dim('(el navegador queda abierto hasta pulsar Resume)')}`
  );
  console.log(`  3  Cámara lenta: ${options.slowMo} ms`);
  const choice = await ask(prompter, 'Elige (Enter = volver): ');
  if (choice === '1') options.headed = !options.headed;
  else if (choice === '2') options.pauseOnFail = !options.pauseOnFail;
  else if (choice === '3') {
    const value = Number(await ask(prompter, 'Milisegundos (0 = sin pausa): '));
    if (Number.isFinite(value) && value >= 0) options.slowMo = value;
  }
  if (!options.headed) options.pauseOnFail = false;
}
