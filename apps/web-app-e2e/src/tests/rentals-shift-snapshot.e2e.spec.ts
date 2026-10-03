import { todayVe } from '../support/bugs/dates';
import {
  firstMachineId,
  seedCustomer,
  seedRental,
  setExchangeRate,
} from '../support/bugs/dbSeed';
import {
  createWasherRental,
  openRentalsModule,
} from '../support/drivers/rentalDriver';
import { documented, expect, test } from '../support/fixtures';
import { getSupabaseClient } from '../support/supabaseClient';
import { gotoDashboard } from '../support/uiNavigation';
import { bootstrapAtDashboard } from '../support/waterSalesTipsMatrix/uiHelpers';

const SHIFT_COLUMNS =
  'total_usd,shift_label,shift_hours,shift_price_usd,shift_divisa_discount_usd';

async function readRentalShiftColumns(rentalId: string) {
  const { data } = await getSupabaseClient()
    .from('washer_rentals')
    .select(SHIFT_COLUMNS)
    .eq('id', rentalId)
    .single();
  return {
    totalUsd: Number(data?.total_usd),
    label: data?.shift_label as string | null,
    hours: data?.shift_hours === null ? null : Number(data?.shift_hours),
    priceUsd:
      data?.shift_price_usd === null ? null : Number(data?.shift_price_usd),
    divisaDiscountUsd:
      data?.shift_divisa_discount_usd === null
        ? null
        : Number(data?.shift_divisa_discount_usd),
  };
}

test(
  'editing a rental and saving unchanged keeps the terms of its shift',
  documented({
    titulo:
      'Editar y guardar sin cambios un alquiler conserva el precio y el nombre de su turno',
    area: 'Alquileres',
    intent:
      'Comprobar que un alquiler guardado con los términos de su turno (nombre, precio y horas) no cambia de precio al abrir la edición y guardar sin tocar nada.',
    steps: [
      'Siembra un alquiler de turno doble con snapshot «Doble Especial» a $10 (el turno doble actual cuesta $12), pagado en efectivo.',
      'Abre Alquileres y lee la tarjeta.',
      'Abre la edición del alquiler y pulsa guardar sin cambiar nada.',
      'Lee el alquiler en la base.',
    ],
    expects: [
      'La tarjeta muestra «Doble Especial».',
      'El total sigue en $10 y el snapshot del turno no cambia.',
    ],
    data: 'Alquiler doble con snapshot Doble Especial, 8 horas, $10, pagado Bs 400 a tasa 40.',
  }),
  async ({ page }) => {
    // Arrange
    const today = todayVe();
    await setExchangeRate(today, 40);
    const customerId = await seedCustomer({
      name: 'Cliente Snapshot',
      phone: '0414-0000000',
      address: 'Calle Prueba #100',
    });
    const rentalId = await seedRental({
      date: today,
      machineId: await firstMachineId(),
      shift: 'doble',
      customerId,
      deliveryTime: '09:00',
      pickupDate: today,
      pickupTime: '17:00',
      totalUsd: 10,
      isPaid: true,
      datePaid: today,
      shiftSnapshot: {
        label: 'Doble Especial',
        hours: 8,
        priceUsd: 10,
        divisaDiscountUsd: 0,
      },
    });
    const { error } = await getSupabaseClient()
      .from('rental_payment_splits')
      .insert({
        rental_id: rentalId,
        payment_method: 'efectivo',
        amount_bs: 400,
        amount_usd: 10,
        exchange_rate_used: 40,
      });
    expect(error).toBeNull();
    const before = await readRentalShiftColumns(rentalId);
    await gotoDashboard(page);
    await openRentalsModule(page);
    await expect(page.getByText(/Doble Especial/)).toBeVisible();

    // Act
    await page.getByTestId(`rental-edit-${rentalId}`).click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    await sheet.getByTestId('rental-confirm-button').click();
    await expect(sheet).toBeHidden({ timeout: 15_000 });

    // Assert
    expect(before).toEqual({
      totalUsd: 10,
      label: 'Doble Especial',
      hours: 8,
      priceUsd: 10,
      divisaDiscountUsd: 0,
    });
    await expect
      .poll(() => readRentalShiftColumns(rentalId), { timeout: 5_000 })
      .toEqual(before);
  }
);

test(
  'a rental created from the app stores the snapshot of its shift',
  documented({
    titulo: 'Un alquiler nuevo guarda el snapshot de su turno',
    area: 'Alquileres',
    intent:
      'Comprobar que al registrar un alquiler de turno completo la base guarda el nombre, las horas, el precio y el descuento del turno vigente.',
    steps: [
      'Registra un alquiler de turno completo pendiente de pago.',
      'Lee las columnas del snapshot del alquiler en la base.',
    ],
    expects: ['Completo, 24 horas, $6 y $1 de descuento en divisa.'],
    data: 'Alquiler turno completo sin pagar, cliente nuevo.',
  }),
  async ({ page }) => {
    // Arrange
    await bootstrapAtDashboard(page);

    // Act
    await createWasherRental(page, {
      shift: 'completo',
      totalUsd: 6,
      isPaid: false,
      splits: [{ method: 'efectivo', amountBs: 0 }],
      customerName: `Cliente Snapshot ${Date.now()}`,
    });
    const { data } = await getSupabaseClient()
      .from('washer_rentals')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Assert
    const stored = await readRentalShiftColumns(data?.id as string);
    expect(stored).toMatchObject({
      label: 'Completo',
      hours: 24,
      priceUsd: 6,
      divisaDiscountUsd: 1,
    });
  }
);
