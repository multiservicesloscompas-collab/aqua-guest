import { expect, test } from '@playwright/test';
import {
  explainFailure,
  formatFailure,
  formatFicha,
  formatSummary,
} from '../support/narration';
import { documented, missingDocParts, readDoc } from '../support/testDoc';

// Pure text checks: no browser and no database.
const DOC = {
  titulo: 'Título de prueba',
  area: 'Área de prueba',
  intent: 'Comprobar algo concreto.',
  steps: ['Hace la primera cosa.', 'Hace la segunda cosa.'],
  expects: ['Ve el primer resultado.', 'Ve el segundo resultado.'],
  data: 'Precio Bs 3000.',
};

// Message Playwright produced when two identical toasts were on screen.
const STRICT_MESSAGE = `Error: expect(locator).toBeVisible() failed

Locator: getByText('¡Venta registrada correctamente!')
Expected: visible
Error: strict mode violation: getByText('¡Venta registrada correctamente!') resolved to 2 elements:
    1) <div class="" data-title="">¡Venta registrada correctamente!</div> aka getByText('¡Venta registrada').first()

Call log:
  - Expect "toBeVisible" with timeout 15000ms`;

const VALUE_MESSAGE = `Error: expect(received).toBe(expected) // Object.is equality

Expected: 3000
Received: 0`;

test.describe('narration text', () => {
  test(
    'a test introduces itself with what it does and what it expects',
    documented({
      titulo: 'La ficha se imprime antes de cada test',
      area: 'Herramientas de prueba (internas)',
      intent:
        'Comprobar el texto de la ficha que se imprime antes de cada test.',
      steps: ['Da formato a una ficha completa con su posición.'],
      expects: [
        'Aparecen la posición, el título, la intención, los pasos numerados, lo esperado y los datos.',
      ],
    }),
    async () => {
      // Act
      const text = formatFicha({
        title: 'mi test',
        doc: DOC,
        position: { index: 2, total: 5 },
      });

      // Assert
      expect(text).toContain('▶ [2/5] mi test');
      expect(text).toContain('Área: Área de prueba');
      expect(text).toContain('Qué prueba: Comprobar algo concreto.');
      expect(text).toContain('1. Hace la primera cosa.');
      expect(text).toContain('2. Hace la segunda cosa.');
      expect(text).toContain('· Ve el segundo resultado.');
      expect(text).toContain('Datos: Precio Bs 3000.');
      expect(text).not.toContain('sin ficha');
    }
  );

  test(
    'a test without documentation is flagged',
    documented({
      titulo: 'Un test sin ficha se marca incompleto',
      area: 'Herramientas de prueba (internas)',
      intent: 'Comprobar que un test sin ficha se marca como incompleto.',
      steps: ['Da formato a una ficha vacía.'],
      expects: ['Avisa de que falta la ficha y nombra las partes que faltan.'],
    }),
    async () => {
      // Act
      const text = formatFicha({
        title: 'sin ficha',
        doc: { titulo: '', area: '', intent: '', steps: [], expects: [] },
      });

      // Assert
      expect(text).toContain('no tiene ficha completa');
      expect(text).toContain('titulo, area, intent, steps, expects');
    }
  );

  test(
    'documented annotations can be read back unchanged',
    documented({
      titulo: 'La ficha viaja intacta en las anotaciones',
      area: 'Herramientas de prueba (internas)',
      intent: 'Comprobar que la ficha viaja intacta en las anotaciones.',
      steps: ['Convierte una ficha en anotaciones y la vuelve a leer.'],
      expects: ['La ficha leída es igual a la original y no le falta nada.'],
    }),
    async () => {
      // Arrange
      const details = documented(DOC);
      const annotations = Array.isArray(details.annotation)
        ? details.annotation
        : [];

      // Act
      const doc = readDoc(annotations);

      // Assert
      expect(doc).toEqual(DOC);
      expect(missingDocParts(doc)).toEqual([]);
    }
  );

  test(
    'a strict mode failure is explained in plain words',
    documented({
      titulo: 'El error de avisos duplicados se explica en palabras claras',
      area: 'Herramientas de prueba (internas)',
      intent:
        'Comprobar que el error de los avisos duplicados se explica bien.',
      steps: ['Explica el mensaje real de Playwright de dos avisos iguales.'],
      expects: [
        'Extrae el selector, lo esperado, cuántos elementos coincidían y una lectura en lenguaje llano.',
      ],
    }),
    async () => {
      // Act
      const explanation = explainFailure(STRICT_MESSAGE);

      // Assert
      expect(explanation.headline).toBe('expect(locator).toBeVisible() failed');
      expect(explanation.locator).toBe(
        "getByText('¡Venta registrada correctamente!')"
      );
      expect(explanation.expected).toBe('visible');
      expect(explanation.received).toBe('2 elementos coinciden');
      expect(explanation.hint).toContain('Más de un elemento');
    }
  );

  test(
    'a value mismatch shows expected and received',
    documented({
      titulo: 'Una diferencia de cifras muestra esperado y encontrado',
      area: 'Herramientas de prueba (internas)',
      intent:
        'Comprobar que una diferencia de cifras muestra esperado y encontrado.',
      steps: ['Explica un mensaje de toBe con Expected y Received.'],
      expects: ['Esperaba 3000 y encontró 0, sin lectura adicional.'],
    }),
    async () => {
      // Act
      const explanation = explainFailure(VALUE_MESSAGE);

      // Assert
      expect(explanation.expected).toBe('3000');
      expect(explanation.received).toBe('0');
      expect(explanation.hint).toBeUndefined();
    }
  );

  test(
    'a test timeout is explained and a message without data is tolerated',
    documented({
      titulo: 'El tiempo agotado se explica y un mensaje sin datos se tolera',
      area: 'Herramientas de prueba (internas)',
      intent:
        'Comprobar el caso de tiempo agotado y el de un mensaje sin datos.',
      steps: [
        'Explica «Test timeout of 60000ms exceeded».',
        'Explica un mensaje vacío.',
      ],
      expects: [
        'El tiempo agotado indica el máximo en segundos.',
        'El mensaje vacío no rompe la explicación.',
      ],
    }),
    async () => {
      // Act
      const timeout = explainFailure('Test timeout of 60000ms exceeded.');
      const empty = explainFailure('');

      // Assert
      expect(timeout.hint).toContain('60 s');
      expect(empty.headline).toBe('Error sin mensaje');
      expect(empty.expected).toBeUndefined();
    }
  );

  test(
    'a failure lists where it failed, the evidence and how to open the trace',
    documented({
      titulo: 'Un fallo indica dónde, la evidencia y cómo abrir la traza',
      area: 'Herramientas de prueba (internas)',
      intent:
        'Comprobar el bloque completo que se imprime cuando un test falla.',
      steps: ['Da formato a un fallo con ubicación y evidencias.'],
      expects: [
        'Muestra el tiempo, lo que falló, la ubicación, cada evidencia y el comando de la traza.',
        'El resumen final cuenta pasados y fallidos.',
      ],
    }),
    async () => {
      // Act
      const failure = formatFailure({
        durationMs: 9000,
        message: STRICT_MESSAGE,
        location: 'apps/web-app-e2e/src/tests/x.spec.ts:255',
        evidence: [
          { name: 'screenshot', path: 'test-results/x/test-failed-1.png' },
          { name: 'trace', path: 'test-results/x/trace.zip' },
        ],
      });
      const summary = formatSummary({
        passed: 10,
        failed: 2,
        skipped: 0,
        durationMs: 78000,
      });

      // Assert
      expect(failure).toContain('✘ Falló en 9.0 s');
      expect(failure).toContain('x.spec.ts:255');
      expect(failure).toContain('test-results/x/test-failed-1.png');
      expect(failure).toContain(
        'npx playwright show-trace test-results/x/trace.zip'
      );
      expect(summary).toContain('10 pasaron · 2 fallaron');
    }
  );
});
