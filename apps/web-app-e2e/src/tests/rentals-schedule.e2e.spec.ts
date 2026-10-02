import { addDays, todayVe } from '../support/bugs/dates';
import { goToDate } from '../support/bugs/setup';
import {
  openRentalsModule,
  pickDeliveryTime,
} from '../support/drivers/rentalDriver';
import { documented, expect, test } from '../support/fixtures';
import { gotoDashboard } from '../support/uiNavigation';

/** Next date (>= from) that falls on the given weekday (0 = Sunday). */
function nextWeekday(from: string, weekday: number): string {
  const [y, m, d] = from.split('-').map(Number);
  const current = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return addDays(from, (weekday - current + 7) % 7);
}

interface ScheduleCase {
  day: 'lunes' | 'viernes' | 'sábado' | 'domingo';
  weekday: number;
  time: string;
  shift: 'medio' | 'completo' | 'doble';
  label: RegExp;
  pickup: string;
  /** Bug tag shown in the title, e.g. 'B9 corregido'. */
  bug?: string;
}

// Business hours 09:00-20:00 (Sunday closes 14:00). A pickup after closing moves
// to the next working day at 09:00. The 13:00/14:00 exception (same-day pickup at
// 20:00) applies Monday to Saturday only; on Sunday it follows the general rule (B9).
const CASES: ScheduleCase[] = [
  {
    day: 'lunes',
    weekday: 1,
    time: '09:00',
    shift: 'medio',
    label: /^Hoy a las 17:00$/,
    pickup: 'el mismo día a las 17:00',
  },
  {
    day: 'lunes',
    weekday: 1,
    time: '12:00',
    shift: 'medio',
    label: /^Hoy a las 20:00$/,
    pickup: 'el mismo día a las 20:00',
  },
  {
    day: 'lunes',
    weekday: 1,
    time: '12:30',
    shift: 'medio',
    label: /^martes \d+ de \w+ a las 09:00$/,
    pickup: 'el día siguiente a las 09:00',
  },
  {
    day: 'lunes',
    weekday: 1,
    time: '13:00',
    shift: 'medio',
    label: /^Hoy a las 20:00$/,
    pickup: 'el mismo día a las 20:00 (excepción de las 13:00)',
  },
  {
    day: 'lunes',
    weekday: 1,
    time: '15:00',
    shift: 'medio',
    label: /^martes \d+ de \w+ a las 09:00$/,
    pickup: 'el día siguiente a las 09:00',
  },
  {
    day: 'lunes',
    weekday: 1,
    time: '19:30',
    shift: 'completo',
    label: /^martes \d+ de \w+ a las 19:30$/,
    pickup: 'el día siguiente a las 19:30',
  },
  {
    day: 'viernes',
    weekday: 5,
    time: '16:00',
    shift: 'doble',
    label: /^lunes \d+ de \w+ a las 09:00$/,
    pickup: 'el lunes a las 09:00 (el retiro cae en domingo)',
  },
  {
    day: 'sábado',
    weekday: 6,
    time: '19:00',
    shift: 'completo',
    label: /^lunes \d+ de \w+ a las 09:00$/,
    pickup: 'el lunes a las 09:00 (el retiro cae en domingo)',
  },
  {
    day: 'domingo',
    weekday: 0,
    time: '09:00',
    shift: 'medio',
    label: /^lunes \d+ de \w+ a las 09:00$/,
    pickup: 'el lunes a las 09:00 (después del cierre del domingo)',
  },
  {
    day: 'domingo',
    weekday: 0,
    time: '10:00',
    shift: 'medio',
    label: /^lunes \d+ de \w+ a las 09:00$/,
    pickup: 'el lunes a las 09:00 (después del cierre del domingo)',
  },
  {
    day: 'domingo',
    weekday: 0,
    time: '13:00',
    shift: 'medio',
    label: /^lunes \d+ de \w+ a las 09:00$/,
    pickup: 'el lunes a las 09:00 (después del cierre del domingo)',
    bug: 'B9 corregido',
  },
  {
    day: 'domingo',
    weekday: 0,
    time: '14:00',
    shift: 'medio',
    label: /^lunes \d+ de \w+ a las 09:00$/,
    pickup: 'el lunes a las 09:00 (después del cierre del domingo)',
    bug: 'B9 corregido',
  },
  {
    day: 'sábado',
    weekday: 6,
    time: '13:00',
    shift: 'medio',
    label: /^Hoy a las 20:00$/,
    pickup: 'el mismo día a las 20:00 (excepción de las 13:00)',
    bug: 'B9-control',
  },
];

const SHIFT_NAME = {
  medio: 'medio turno',
  completo: 'turno completo',
  doble: 'turno doble',
};

test.describe('rental pickup schedule', () => {
  for (const c of CASES) {
    test(
      `${c.day} ${c.time} ${c.shift} pickup`,
      documented({
        titulo: `${c.bug ? `[${c.bug}] ` : ''}Entrega el ${c.day} a las ${
          c.time
        } con ${SHIFT_NAME[c.shift]}: retiro ${c.pickup}`,
        area: 'Alquileres: horario de retiro',
        intent: `Comprobar la hora de retiro que calcula la hoja de nuevo alquiler para ${
          c.day
        } ${c.time} con ${SHIFT_NAME[c.shift]}.`,
        steps: [
          `Abre Lavadoras y navega al próximo ${c.day}.`,
          `Abre un alquiler nuevo, elige ${
            SHIFT_NAME[c.shift]
          } y entrega a las ${c.time}.`,
          'Lee la etiqueta de retiro.',
        ],
        expects: [`El retiro es ${c.pickup}.`],
        data: 'Horario de la tienda: 09:00 a 20:00, domingo hasta las 14:00.',
      }),
      async ({ page }) => {
        // Arrange
        await gotoDashboard(page);
        await openRentalsModule(page);
        await goToDate(page, nextWeekday(todayVe(), c.weekday));

        // Act
        await page.getByTestId('rentals-add-fab').click();
        await page.getByTestId(`rental-shift-option-${c.shift}`).click();
        await pickDeliveryTime(page, c.time);

        // Assert
        await expect(page.getByTestId('rental-pickup-label')).toHaveText(
          c.label
        );
      }
    );
  }
});
