import { documented, test } from '../support/fixtures';
import { computeExpected, emptyLedger } from '../support/ledger/ledger';
import { BASELINE_EXCHANGE_RATE } from '../support/reset/baseline';
import {
  applyStep,
  describeExpected,
  describeStep,
} from '../support/scenarios/apply';
import { loadScenarios } from '../support/scenarios/load';
import { runScenario } from '../support/scenarios/run';
import type { Scenario } from '../support/scenarios/types';

/** The ficha is generated from the steps, so it can never drift from what runs. */
function fichaOf(scenario: Scenario) {
  let ledger = emptyLedger(BASELINE_EXCHANGE_RATE);
  const afterEach = scenario.steps.map((step, index) => {
    ledger = applyStep(ledger, step);
    return `Tras el paso ${index + 1}: ${describeExpected(
      computeExpected(ledger)
    )}.`;
  });
  return documented({
    titulo: scenario.titulo,
    area: scenario.area,
    intent: scenario.intent,
    steps: scenario.steps.map(describeStep),
    expects: [
      `Al terminar: ${describeExpected(computeExpected(ledger))}.`,
      'Antes de empezar el dashboard está en cero.',
      ...afterEach,
    ],
    data: `Tasa ${BASELINE_EXCHANGE_RATE} y base en línea base.`,
  });
}

test.describe('scenarios', () => {
  for (const scenario of loadScenarios()) {
    test(scenario.id, fichaOf(scenario), async ({ page }) => {
      test.setTimeout(240_000);
      await runScenario(page, scenario, BASELINE_EXCHANGE_RATE);
    });
  }
});
