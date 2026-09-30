import { expect, type Page } from '@playwright/test';
import { captureDashboardSnapshot } from '../drivers/dashboardDriver';
import { createBalanceTransfer } from '../drivers/balanceDriver';
import {
  createExpense,
  deleteExpense,
  editExpense,
  payPendingTip,
} from '../drivers/expenseDriver';
import {
  createWasherRental,
  deleteRental,
  editRental,
  toggleRentalPayment,
} from '../drivers/rentalDriver';
import {
  createWaterSale,
  deleteWaterSale,
  editWaterSale,
} from '../drivers/waterSaleDriver';
import { computeExpected, emptyLedger } from '../ledger/ledger';
import type { Expected, Ledger, Payment } from '../ledger/types';
import { METHODS } from '../ledger/types';
import { getSupabaseClient } from '../supabaseClient';
import { bootstrapAtDashboard } from '../waterSalesTipsMatrix/uiHelpers';
import { METHOD_LABEL, applyStep, describeStep } from './apply';
import type { Scenario, Step } from './types';

const splitsOf = (totalBs: number, payment: Payment) =>
  payment.secondary
    ? [
        {
          method: payment.primary,
          amountBs: totalBs - payment.secondary.amountBs,
        },
        payment.secondary,
      ].map(({ method, amountBs }) => ({ method, amountBs }))
    : [{ method: payment.primary, amountBs: totalBs }];

type Table = 'tips' | 'sales' | 'washer_rentals' | 'expenses';

interface RunState {
  page: Page;
  ledger: Ledger;
  seenIds: Record<Table, Set<string>>;
  /** Database id of what each step created (tips are keyed by their origin step). */
  dbIdByStep: Map<string, string>;
  tipIdByOrigin: Map<string, string>;
  customerByStep: Map<string, string>;
}

async function listIds(table: Table): Promise<string[]> {
  const { data, error } = await getSupabaseClient()
    .from(table)
    .select('id')
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Cannot read ${table}: ${error.message}`);
  return (data ?? []).map((row: { id: string }) => row.id);
}

/** Finds the row the last step created in a table. */
async function newRowId(state: RunState, table: Table): Promise<string> {
  let created: string | undefined;
  await expect
    .poll(
      async () => {
        created = (await listIds(table)).find(
          (id) => !state.seenIds[table].has(id)
        );
        return created;
      },
      { timeout: 20_000, intervals: [250, 500, 1_000] }
    )
    .toBeTruthy();
  if (!created) throw new Error(`No new row appeared in ${table}`);
  state.seenIds[table].add(created);
  return created;
}

async function runStep(state: RunState, step: Step): Promise<void> {
  const { page } = state;
  const marker = `E2E_${step.type}_${Date.now()}`;
  switch (step.type) {
    case 'sale':
      await createWaterSale(page, {
        basePriceBs: step.baseBs,
        splits: splitsOf(step.baseBs, step.payment),
        tip: step.tip
          ? {
              amountBs: step.tip.amountBs,
              method: step.tip.captureMethod,
              paid: false,
            }
          : undefined,
        noteMarker: marker,
      });
      break;
    case 'rental': {
      const customerName = `Cliente ${step.id} ${Date.now()}`;
      state.customerByStep.set(step.id, customerName);
      await createWasherRental(page, {
        shift: step.shift,
        deliveryFeeUsd: step.deliveryFeeUsd,
        totalUsd: 0,
        isPaid: step.isPaid,
        splits: splitsOf(0, step.payment),
        tip: step.tip
          ? {
              amountBs: step.tip.amountBs,
              method: step.tip.captureMethod,
              paid: false,
            }
          : undefined,
        customerName,
      });
      break;
    }
    case 'expense':
      await createExpense(page, {
        description: `Egreso ${step.id} ${Date.now()}`,
        amountBs: step.amountBs,
        category: 'otros',
        splits: splitsOf(step.amountBs, step.payment),
      });
      break;
    case 'transfer':
      await createBalanceTransfer(page, {
        operationType: step.outBs === step.inBs ? 'equilibrio' : 'avance',
        fromMethod: step.from,
        toMethod: step.to,
        amountOutBs: step.outBs,
        amountInBs: step.inBs,
      });
      break;
    case 'markPaid': {
      const customer = state.customerByStep.get(step.rentalId);
      if (!customer) throw new Error(`No rental known for «${step.rentalId}»`);
      await toggleRentalPayment(page, customer, true);
      break;
    }
    case 'delete': {
      const dbId = state.dbIdByStep.get(step.targetId);
      const target = state.ledger.records.find((r) => r.id === step.targetId);
      if (!dbId || !target)
        throw new Error(`Nothing to delete for «${step.targetId}»`);
      if (target.kind === 'sale') await deleteWaterSale(page, dbId);
      else if (target.kind === 'rental') await deleteRental(page, dbId);
      else if (target.kind === 'expense') await deleteExpense(page, dbId);
      else throw new Error(`Cannot delete a ${target.kind} from the app`);
      break;
    }
    case 'edit': {
      const dbId = state.dbIdByStep.get(step.targetId);
      const target = state.ledger.records.find((r) => r.id === step.targetId);
      if (!dbId || !target)
        throw new Error(`Nothing to edit for «${step.targetId}»`);
      if (target.kind === 'sale') {
        await editWaterSale(page, dbId, {
          baseBs: step.amountBs,
          primary: step.primary,
        });
      } else if (target.kind === 'expense') {
        await editExpense(page, dbId, {
          amountBs: step.amountBs,
          primary: step.primary,
        });
      } else {
        await editRental(page, dbId, {
          shift: step.shift,
          primary: step.primary,
        });
      }
      break;
    }
    case 'payTip': {
      const tipId = state.tipIdByOrigin.get(step.originId);
      if (!tipId) throw new Error(`No tip known for «${step.originId}»`);
      await payPendingTip(page, tipId, step.method);
      break;
    }
  }
  const table = CREATED_TABLE[step.type as string];
  if (table && 'id' in step)
    state.dbIdByStep.set(step.id, await newRowId(state, table));
  if ((step.type === 'sale' || step.type === 'rental') && step.tip) {
    state.tipIdByOrigin.set(step.id, await newRowId(state, 'tips'));
  }
}

const CREATED_TABLE: Record<string, Table | undefined> = {
  sale: 'sales',
  rental: 'washer_rentals',
  expense: 'expenses',
};

/** Compares the dashboard with the expected figures, naming the step in every message. */
export async function expectDashboard(
  page: Page,
  expected: Expected,
  label: string
): Promise<void> {
  const snapshot = await captureDashboardSnapshot(page);
  const at = `Después de «${label}»`;
  expect(snapshot.mtdIncomeBs, `${at}: ingresos`).toBe(expected.incomeBs);
  expect(snapshot.dayExpensesBs, `${at}: egresos`).toBe(expected.expenseBs);
  expect(snapshot.dayNetBs, `${at}: neto del día`).toBe(expected.netBs);
  expect(snapshot.transactionsCount, `${at}: transacciones`).toBe(
    expected.transactions
  );
  for (const method of METHODS) {
    expect(
      snapshot.methodTotals[method],
      `${at}: tarjeta de ${METHOD_LABEL[method]}`
    ).toBe(expected.cards[method]);
  }
}

export async function runScenario(
  page: Page,
  scenario: Scenario,
  exchangeRate: number
): Promise<void> {
  const state: RunState = {
    page,
    ledger: emptyLedger(exchangeRate),
    seenIds: {
      tips: new Set(),
      sales: new Set(),
      washer_rentals: new Set(),
      expenses: new Set(),
    },
    dbIdByStep: new Map(),
    tipIdByOrigin: new Map(),
    customerByStep: new Map(),
  };
  await bootstrapAtDashboard(page);
  await expectDashboard(page, computeExpected(state.ledger), 'empezar de cero');

  for (const step of scenario.steps) {
    await runStep(state, step);
    state.ledger = applyStep(state.ledger, step);
    await expectDashboard(
      page,
      computeExpected(state.ledger),
      describeStep(step)
    );
  }
}
