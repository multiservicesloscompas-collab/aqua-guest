import { red } from './support.mjs';

export function parseArgs(argv) {
  const out = {
    specs: [],
    all: false,
    list: false,
    yes: false,
    help: false,
    print: false,
    check: false,
    scenario: undefined,
    explain: undefined,
    headed: true,
    debug: false,
    slowMo: 300,
    test: undefined,
    after: undefined,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--spec') out.specs.push(...argv[(i += 1)].split(','));
    else if (arg === '--test') out.test = argv[(i += 1)];
    else if (arg === '--slowmo') out.slowMo = Number(argv[(i += 1)]);
    else if (arg === '--after') out.after = argv[(i += 1)];
    else if (arg === '--explain') {
      const next = argv[i + 1];
      out.explain = next && !next.startsWith('--') ? argv[(i += 1)] : 'all';
    } else if (arg === '--check') out.check = true;
    else if (arg === '--all') out.all = true;
    else if (arg === '--list') out.list = true;
    else if (arg === '--scenario') out.scenario = argv[(i += 1)];
    else if (arg === '--yes') out.yes = true;
    else if (arg === '--print') out.print = true;
    else if (arg === '--headless') out.headed = false;
    else if (arg === '--headed') out.headed = true;
    else if (arg === '--debug') out.debug = true;
    else if (arg === '--help' || arg === '-h') out.help = true;
    else {
      console.error(red(`Argumento desconocido: ${arg}`));
      out.help = true;
    }
  }
  return out;
}

export const HELP = `
Uso: npm run e2e:live [-- opciones]

  (sin opciones)          menú interactivo
  --explain [texto|all]   imprime la ficha (qué prueba y qué espera) sin ejecutar
  --check                 falla si algún test no tiene ficha completa
  --list                  lista de tests con su frase de "qué prueba" y la base local
  --all                   toda la suite
  --spec <archivo[,..]>   tests de uno o varios archivos (nombre sin .e2e.spec.ts)
  --test "<texto>"        tests cuyo título contiene el texto
  --headless              sin navegador visible (por defecto se ve)
  --slowmo <ms>           pausa entre acciones con navegador visible (300)
  --debug                 inspector de Playwright, paso a paso
  --yes                   no pedir confirmación (los tests borran la base LOCAL)
  --after reset|purge|none  qué hacer con la base al terminar
  --scenario <archivo>    ejecuta un escenario guardado en JSON (ver menú 5)
  --print                 solo mostrar el comando de Playwright, sin ejecutar
`;
