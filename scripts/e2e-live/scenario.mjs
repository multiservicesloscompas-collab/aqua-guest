/**
 * Builds a scenario step by step from questions in Spanish. The result is plain
 * JSON (same shape as apps/web-app-e2e/src/support/scenarios/types.ts), so the
 * Playwright spec can run it and print the figures it expects.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { listTests } from './fichas.mjs';
import { E2E_DIR, ROOT, ask, bold, dim, red, yellow } from './support.mjs';

const METHODS = [
  ['efectivo', 'Efectivo'],
  ['pago_movil', 'Pago Móvil'],
  ['punto_venta', 'Punto de Venta'],
  ['divisa', 'Divisa'],
];
const SHIFTS = [
  ['medio', 'Medio turno ($4)'],
  ['completo', 'Turno completo ($6, $5 en divisa)'],
  ['doble', 'Turno doble ($12)'],
];
export const SAVED_DIR = path.join(ROOT, E2E_DIR, 'src/scenarios');
export const AD_HOC_FILE = path.join(
  ROOT,
  'node_modules/.cache/aquaguest-e2e/scenario.json'
);

const label = (list, key) => list.find(([k]) => k === key)?.[1] ?? key;

async function pick(prompter, question, list, fallback) {
  list.forEach(([, text], i) => console.log(`    ${i + 1}  ${text}`));
  for (;;) {
    const answer = await ask(
      prompter,
      `${question}${fallback ? ` [${fallback}]` : ''}: `
    );
    const index = Number(answer || fallback) - 1;
    if (list[index]) return list[index][0];
    console.log(red('    Número no válido.'));
  }
}

async function number(prompter, question, fallback) {
  for (;;) {
    const answer = await ask(prompter, `${question} [${fallback}]: `);
    const value = Number(answer === '' ? fallback : answer);
    if (Number.isFinite(value) && value >= 0) return value;
    console.log(red('    Escribe un número.'));
  }
}

const yes = async (prompter, question, fallback = 'n') =>
  (
    (await ask(
      prompter,
      `${question} [${fallback === 's' ? 'S/n' : 's/N'}]: `
    )) || fallback
  )
    .toLowerCase()
    .startsWith('s');

async function askPayment(prompter, totalText) {
  console.log('  Método de pago principal:');
  const primary = await pick(prompter, '  Elige', METHODS, '1');
  if (!(await yes(prompter, `  ¿Pago mixto (parte en otro método)?`)))
    return { primary };
  console.log('  Método secundario:');
  const others = METHODS.filter(([m]) => m !== primary);
  const method = await pick(prompter, '  Elige', others, '1');
  const amountBs = await number(
    prompter,
    `  ¿Cuántos Bs van en ${label(METHODS, method)}? (${totalText})`,
    500
  );
  return { primary, secondary: { method, amountBs } };
}

async function askTip(prompter) {
  if (!(await yes(prompter, '  ¿Con propina?'))) return undefined;
  const amountBs = await number(prompter, '  Monto de la propina en Bs', 100);
  console.log('  ¿En qué método se cobró la propina?');
  return {
    amountBs,
    captureMethod: await pick(prompter, '  Elige', METHODS, '1'),
  };
}

const editable = (steps) =>
  steps.filter(
    (s) =>
      ['sale', 'rental', 'expense'].includes(s.type) &&
      !s.payment.secondary &&
      !s.tip
  );

async function chooseStep(prompter, question, candidates, describe) {
  if (candidates.length === 0) {
    console.log(red('    No hay ningún paso al que aplicarlo todavía.'));
    return undefined;
  }
  const list = candidates.map((s) => [s.id, describe(s)]);
  return pick(prompter, question, list, '1');
}

/** Returns the new step, or undefined when it could not be built. */
async function askStep(prompter, choice, steps, describe) {
  const id = `${
    {
      1: 'venta',
      2: 'alquiler',
      3: 'egreso',
      4: 'transferencia',
      5: 'propina',
      6: 'pagado',
      7: 'edicion',
      8: 'borrado',
    }[choice]
  }-${steps.length + 1}`;
  if (choice === '1') {
    const baseBs = await number(prompter, '  Monto de la venta en Bs', 1000);
    const payment = await askPayment(prompter, `de ${baseBs}`);
    return { type: 'sale', id, baseBs, payment, tip: await askTip(prompter) };
  }
  if (choice === '2') {
    console.log('  Turno:');
    const shift = await pick(prompter, '  Elige', SHIFTS, '2');
    const deliveryFeeUsd = await number(
      prompter,
      '  Tarifa de entrega en $ (0 a 5)',
      0
    );
    const payment = await askPayment(prompter, 'del total del alquiler');
    const isPaid = await yes(prompter, '  ¿Ya está pagado?', 's');
    return {
      type: 'rental',
      id,
      shift,
      deliveryFeeUsd,
      payment,
      isPaid,
      tip: await askTip(prompter),
    };
  }
  if (choice === '3') {
    const amountBs = await number(prompter, '  Monto del egreso en Bs', 500);
    return {
      type: 'expense',
      id,
      amountBs,
      payment: await askPayment(prompter, `de ${amountBs}`),
    };
  }
  if (choice === '4') {
    console.log('  Sale de:');
    const from = await pick(prompter, '  Elige', METHODS, '2');
    console.log('  Entra en:');
    const to = await pick(
      prompter,
      '  Elige',
      METHODS.filter(([m]) => m !== from),
      '1'
    );
    const outBs = await number(prompter, '  Bs que salen', 2000);
    const inBs = await number(
      prompter,
      '  Bs que entran (igual = equilibrio, distinto = avance)',
      outBs
    );
    return { type: 'transfer', id, from, to, outBs, inBs };
  }
  if (choice === '5') {
    const tipped = steps.filter(
      (s) =>
        s.tip && !steps.some((p) => p.type === 'payTip' && p.originId === s.id)
    );
    const originId = await chooseStep(
      prompter,
      '  ¿La propina de cuál?',
      tipped,
      describe
    );
    if (!originId) return undefined;
    console.log('  Pagarla desde:');
    return {
      type: 'payTip',
      originId,
      method: await pick(prompter, '  Elige', METHODS, '1'),
    };
  }
  if (choice === '6') {
    const pending = steps.filter(
      (s) =>
        s.type === 'rental' &&
        !s.isPaid &&
        !steps.some((p) => p.type === 'markPaid' && p.rentalId === s.id)
    );
    const rentalId = await chooseStep(
      prompter,
      '  ¿Qué alquiler?',
      pending,
      describe
    );
    return rentalId ? { type: 'markPaid', rentalId } : undefined;
  }
  if (choice === '7') {
    const targetId = await chooseStep(
      prompter,
      '  ¿Qué registro? (solo pago simple y sin propina)',
      editable(steps),
      describe
    );
    if (!targetId) return undefined;
    const target = steps.find((s) => s.id === targetId);
    const step = { type: 'edit', targetId };
    if (target.type === 'rental') {
      console.log('  Nuevo turno:');
      step.shift = await pick(prompter, '  Elige', SHIFTS, '3');
    } else {
      step.amountBs = await number(prompter, '  Nuevo monto en Bs', 1500);
    }
    if (await yes(prompter, '  ¿Cambiar también el método de pago?')) {
      step.primary = await pick(prompter, '  Elige', METHODS, '2');
    }
    return step;
  }
  if (choice === '8') {
    const gone = steps
      .filter((s) => s.type === 'delete')
      .map((s) => s.targetId);
    const candidates = steps.filter(
      (s) =>
        ['sale', 'rental', 'expense'].includes(s.type) && !gone.includes(s.id)
    );
    const targetId = await chooseStep(
      prompter,
      '  ¿Qué registro?',
      candidates,
      describe
    );
    return targetId ? { type: 'delete', targetId } : undefined;
  }
  return undefined;
}

const MENU = `
  ${bold('Añadir un movimiento')}
    1  Venta de agua (pago simple o mixto, con propina opcional)
    2  Alquiler de lavadora (turno, entrega, pago simple o mixto, propina)
    3  Egreso (pago simple o mixto)
    4  Equilibrio o avance entre métodos de pago
    5  Pagar una propina pendiente
    6  Marcar un alquiler pendiente como pagado
    7  Editar un registro
    8  Eliminar un registro
    u  Deshacer el último      l  Listo      c  Cancelar`;

/** describe(step) renders a step in Spanish; provided by the caller (needs the TS code). */
export async function buildScenario(prompter, describe) {
  const steps = [];
  for (;;) {
    console.log(
      `\n${bold('Tu escenario hasta ahora:')}${
        steps.length === 0 ? dim(' (vacío)') : ''
      }`
    );
    steps.forEach((s, i) => console.log(`  ${i + 1}. ${describe(s)}`));
    console.log(MENU);
    const choice = (await ask(prompter, '\n> ')).toLowerCase();
    if (choice === 'c') return undefined;
    if (choice === 'u') steps.pop();
    else if (choice === 'l') {
      if (steps.length > 0) return steps;
      console.log(red('Añade al menos un movimiento.'));
    } else if (/^[1-8]$/.test(choice)) {
      const step = await askStep(prompter, choice, steps, describe);
      if (step) steps.push(step);
    } else if (choice !== '') console.log(red('Opción no válida.'));
  }
}

export function writeAdHoc(scenario) {
  mkdirSync(path.dirname(AD_HOC_FILE), { recursive: true });
  writeFileSync(AD_HOC_FILE, JSON.stringify(scenario, null, 2));
  return AD_HOC_FILE;
}

export function saveScenario(scenario, name) {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  mkdirSync(SAVED_DIR, { recursive: true });
  const file = path.join(SAVED_DIR, `${slug}.json`);
  writeFileSync(
    file,
    JSON.stringify({ ...scenario, id: slug, titulo: name }, null, 2)
  );
  return file;
}

/** Short Spanish line used while building; the full ficha comes from the spec. */
export function describeShort(step) {
  const pay = (p) =>
    p.secondary
      ? `mixto ${label(METHODS, p.primary)} + Bs ${
          p.secondary.amountBs
        } en ${label(METHODS, p.secondary.method)}`
      : `en ${label(METHODS, p.primary)}`;
  const tip = (t) =>
    t ? `, propina Bs ${t.amountBs} (${label(METHODS, t.captureMethod)})` : '';
  switch (step.type) {
    case 'sale':
      return `${step.id}: venta de Bs ${step.baseBs}, pago ${pay(
        step.payment
      )}${tip(step.tip)}`;
    case 'rental':
      return `${step.id}: alquiler ${step.shift}${
        step.deliveryFeeUsd ? ` + entrega $${step.deliveryFeeUsd}` : ''
      } (${step.isPaid ? 'pagado' : 'pendiente'}), pago ${pay(
        step.payment
      )}${tip(step.tip)}`;
    case 'expense':
      return `${step.id}: egreso de Bs ${step.amountBs}, pago ${pay(
        step.payment
      )}`;
    case 'transfer':
      return `${step.id}: ${label(METHODS, step.from)} → ${label(
        METHODS,
        step.to
      )} (sale ${step.outBs}, entra ${step.inBs})`;
    case 'payTip':
      return `pagar la propina de ${step.originId} desde ${label(
        METHODS,
        step.method
      )}`;
    case 'markPaid':
      return `marcar pagado ${step.rentalId}`;
    case 'edit':
      return `editar ${step.targetId}`;
    case 'delete':
      return `eliminar ${step.targetId}`;
    default:
      return step.id ?? step.type;
  }
}

export const AD_HOC_TITLE = 'a-la-carta';

/** Finds the ad-hoc test in a listing made with E2E_SCENARIO set. */
export function listAdHoc(file) {
  const { tests, error } = listTests({ E2E_SCENARIO: file });
  const test = tests.find((t) => t.title === AD_HOC_TITLE);
  return { test, tests, error };
}

/**
 * Menu option «Armar un escenario»: build, preview the expected figures
 * (the spec prints them in its ficha), run, and optionally save.
 * `run(test, file)` executes it and returns the Playwright exit code.
 */
export async function scenarioFlow(prompter, run) {
  const steps = await buildScenario(prompter, describeShort);
  if (!steps) return;
  const scenario = {
    titulo: 'Escenario a la carta',
    area: 'A la carta',
    intent: 'Escenario armado desde el menú.',
    steps,
  };
  const file = writeAdHoc(scenario);
  const { test, error } = listAdHoc(file);
  if (!test) {
    console.log(
      red(`No se pudo preparar el escenario: ${error || 'revisa los pasos'}`)
    );
    return;
  }
  console.log(
    yellow(
      '\nLas cifras de «Qué espera» las calcula la calculadora del libro, no la app.'
    )
  );
  const code = await run(test, file);
  if (code === undefined) return;
  const name = await ask(
    prompter,
    '\nPara guardarlo en la biblioteca escribe un nombre (Enter = no guardar): '
  );
  if (name) console.log(`Guardado en ${saveScenario(scenario, name)}`);
}
