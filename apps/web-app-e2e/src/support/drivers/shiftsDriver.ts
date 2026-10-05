import { expect, type Page } from '@playwright/test';
import { getSupabaseClient } from '../supabaseClient';
import { gotoDashboard } from '../uiNavigation';

export interface ShiftFormInput {
  label?: string;
  hours?: string;
  price?: string;
  discount?: string;
}

export interface ShiftRow {
  id: string;
  code: string;
  label: string;
  price_usd: number;
  hours: number;
  divisa_discount_usd: number;
  is_active: boolean;
  deleted_at: string | null;
}

export async function openShiftsPage(page: Page): Promise<void> {
  await gotoDashboard(page);
  await page.getByLabel('Ir a Lavadoras').click();
  await page.getByLabel('Abrir submenú del módulo').click();
  await page.getByLabel('Ir a Turnos de Alquiler').click();
  await expect(page.getByTestId('shifts-add-button')).toBeVisible();
}

export async function fillShiftForm(
  page: Page,
  input: ShiftFormInput
): Promise<void> {
  if (input.label !== undefined) {
    await page.getByTestId('shift-form-label').fill(input.label);
  }
  if (input.hours !== undefined) {
    await page.getByTestId('shift-form-hours').fill(input.hours);
  }
  if (input.price !== undefined) {
    await page.getByTestId('shift-form-price').fill(input.price);
  }
  if (input.discount !== undefined) {
    const toggle = page.getByTestId('shift-form-discount-toggle');
    if ((await toggle.getAttribute('aria-checked')) !== 'true') {
      await toggle.click();
    }
    await page.getByTestId('shift-form-discount').fill(input.discount);
  }
}

export async function createShiftViaUi(
  page: Page,
  input: Required<Pick<ShiftFormInput, 'label' | 'hours' | 'price'>> &
    Pick<ShiftFormInput, 'discount'>
): Promise<ShiftRow> {
  await page.getByTestId('shifts-add-button').click();
  await fillShiftForm(page, input);
  await page.getByTestId('shift-form-submit').click();
  await expect(page.getByTestId('shift-form-submit')).toBeHidden({
    timeout: 15_000,
  });
  return readShiftByLabel(input.label.trim());
}

export async function readAllShifts(): Promise<ShiftRow[]> {
  const { data, error } = await getSupabaseClient()
    .from('rental_shifts')
    .select(
      'id,code,label,price_usd,hours,divisa_discount_usd,is_active,deleted_at'
    )
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Cannot read rental_shifts: ${error.message}`);
  return (data ?? []).map((row) => ({
    ...row,
    price_usd: Number(row.price_usd),
    hours: Number(row.hours),
    divisa_discount_usd: Number(row.divisa_discount_usd),
  })) as ShiftRow[];
}

export async function readShiftByLabel(label: string): Promise<ShiftRow> {
  await expect
    .poll(async () => (await readAllShifts()).some((s) => s.label === label), {
      timeout: 10_000,
    })
    .toBe(true);
  const shift = (await readAllShifts()).find((row) => row.label === label);
  if (!shift) throw new Error(`Shift not found: ${label}`);
  return shift;
}

export async function readShiftById(id: string): Promise<ShiftRow> {
  const shift = (await readAllShifts()).find((row) => row.id === id);
  if (!shift) throw new Error(`Shift not found: ${id}`);
  return shift;
}

export async function seedRentalShift(input: {
  code: string;
  label: string;
  priceUsd: number;
  hours: number;
  divisaDiscountUsd?: number;
}): Promise<string> {
  const { data, error } = await getSupabaseClient()
    .from('rental_shifts')
    .insert({
      code: input.code,
      label: input.label,
      price_usd: input.priceUsd,
      hours: input.hours,
      divisa_discount_usd: input.divisaDiscountUsd ?? 0,
    })
    .select('id')
    .single();
  if (error || !data) {
    throw new Error(`Cannot seed shift: ${error?.message ?? 'no data'}`);
  }
  return data.id as string;
}

export interface RentalShiftRow {
  id: string;
  shift: string;
  totalUsd: number;
  pickupDate: string;
  pickupTime: string;
  label: string | null;
  hours: number | null;
  priceUsd: number | null;
  divisaDiscountUsd: number | null;
}

function toNullableNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

export async function readRentals(): Promise<RentalShiftRow[]> {
  const { data, error } = await getSupabaseClient()
    .from('washer_rentals')
    .select(
      'id,shift,total_usd,pickup_date,pickup_time,shift_label,shift_hours,shift_price_usd,shift_divisa_discount_rule_usd'
    )
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Cannot read rentals: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    shift: row.shift as string,
    totalUsd: Number(row.total_usd),
    pickupDate: row.pickup_date as string,
    pickupTime: String(row.pickup_time).substring(0, 5),
    label: (row.shift_label as string | null) ?? null,
    hours: toNullableNumber(row.shift_hours),
    priceUsd: toNullableNumber(row.shift_price_usd),
    divisaDiscountUsd: toNullableNumber(row.shift_divisa_discount_rule_usd),
  }));
}

export async function readLatestRental(): Promise<RentalShiftRow> {
  await expect
    .poll(async () => (await readRentals()).length, { timeout: 15_000 })
    .toBeGreaterThan(0);
  const rentals = await readRentals();
  return rentals[rentals.length - 1];
}

export async function readRentalById(id: string): Promise<RentalShiftRow> {
  const rental = (await readRentals()).find((row) => row.id === id);
  if (!rental) throw new Error(`Rental not found: ${id}`);
  return rental;
}

export async function updateShiftInDb(
  id: string,
  changes: Record<string, string | number | boolean | null>
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('rental_shifts')
    .update(changes)
    .eq('id', id);
  if (error) throw new Error(`Cannot update shift: ${error.message}`);
}
