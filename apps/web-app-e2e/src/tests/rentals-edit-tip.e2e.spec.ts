import { createWasherRental } from '../support/drivers/rentalDriver';
import { documented, expect, test } from '../support/fixtures';
import { getSupabaseClient } from '../support/supabaseClient';
import { bootstrapAtDashboard } from '../support/waterSalesTipsMatrix/uiHelpers';

test(
  'editing a rental with a tip and saving unchanged keeps its splits',
  documented({
    titulo:
      '[B3b corregido] Editar y guardar sin cambios un alquiler con propina no mueve los métodos',
    area: 'Alquileres',
    intent:
      'Comprobar que abrir la edición de un alquiler con propina en otro método y guardar sin tocar nada deja intactos sus pagos.',
    steps: [
      'Registra un alquiler pagado en efectivo con propina de Bs 200 capturada en pago móvil.',
      'Lee cómo quedó repartido el pago en la base.',
      'Abre la edición del alquiler y pulsa guardar sin cambiar nada.',
      'Vuelve a leer el reparto.',
    ],
    expects: [
      'Antes y después el reparto de pagos es el mismo: efectivo y pago móvil Bs 200.',
    ],
    data: 'Alquiler medio turno pagado en efectivo; propina de Bs 200 en pago móvil.',
  }),
  async ({ page }) => {
    // Arrange
    await bootstrapAtDashboard(page);
    await createWasherRental(page, {
      shift: 'medio',
      totalUsd: 0,
      isPaid: true,
      splits: [{ method: 'efectivo', amountBs: 0 }],
      tip: { amountBs: 200, method: 'pago_movil', paid: false },
      customerName: `Cliente B3b ${Date.now()}`,
    });
    const { data: tip } = await getSupabaseClient()
      .from('tips')
      .select('origin_id')
      .eq('origin_type', 'rental')
      .single();
    const rentalId = tip?.origin_id as string;
    const snapshot = async () => {
      const { data } = await getSupabaseClient()
        .from('rental_payment_splits')
        .select('payment_method,amount_bs')
        .eq('rental_id', rentalId);
      return (data ?? [])
        .map((row) => ({
          paymentMethod: row.payment_method as string,
          amountBs: Number(row.amount_bs),
        }))
        .sort((a, b) => a.paymentMethod.localeCompare(b.paymentMethod));
    };
    const before = await snapshot();

    // Act
    await page.getByTestId(`rental-edit-${rentalId}`).click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    await page.waitForTimeout(1_500); // let the tip hydrate into the form
    await sheet.getByTestId('rental-confirm-button').click();
    await expect(sheet).toBeHidden({ timeout: 15_000 });

    // Assert
    expect(before.map((row) => row.paymentMethod)).toEqual([
      'efectivo',
      'pago_movil',
    ]);
    expect(before.find((row) => row.paymentMethod === 'pago_movil')).toEqual({
      paymentMethod: 'pago_movil',
      amountBs: 200,
    });
    await expect.poll(snapshot, { timeout: 5_000 }).toEqual(before);
  }
);
