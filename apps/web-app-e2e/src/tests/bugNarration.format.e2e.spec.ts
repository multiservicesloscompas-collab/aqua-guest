import { expect, test } from '@playwright/test';
import { BUG_KNOWLEDGE } from '../support/bugs/bugKnowledge';
import {
  assertionDetail,
  classifyBugResult,
  formatBugFicha,
  formatBugOutcome,
  formatBugSummary,
  missingBugParts,
  readBugInfo,
} from '../support/bugs/bugNarration';
import { bugDoc } from '../support/bugs/ficha';
import { documented, readDoc } from '../support/testDoc';

// Pure text checks: no browser and no database.
const VALUE_MESSAGE = `Error: expect(locator).toHaveValue(expected) failed

Locator: getByRole('dialog').locator('input')
Expected: "1500"
Received: "1000"`;

const TIMEOUT_MESSAGE = 'Test timeout of 60000ms exceeded.';

const annotationsOf = (details: ReturnType<typeof bugDoc>) => {
  const { annotation } = details;
  return Array.isArray(annotation)
    ? annotation
    : annotation
    ? [annotation]
    : [];
};

// C12 stays open until the number format is decided, so this sample id is stable.
const BUG = bugDoc({
  id: 'C12',
  titulo: 'Un bug de prueba',
  intent: 'Comprobar algo.',
  steps: ['Hace algo.'],
  expects: ['Ve algo.'],
  actual: 'hace otra cosa',
});

const AREA = 'Herramientas de prueba (internas)';

test.describe('bug narration', () => {
  test(
    'a bug spec carries why it fails, what to fix and where',
    documented({
      titulo: 'Cada bug trae causa, arreglo y lugar',
      area: AREA,
      intent:
        'Comprobar que bugDoc anota la causa, el arreglo y el lugar del bug y que se pueden leer de vuelta.',
      steps: ['Crea la ficha de un bug y lee sus anotaciones.'],
      expects: [
        'Lee id, tipo, lo que pasa hoy, causa, arreglo y lugar del bug.',
        'El título del test sigue empezando por el ID.',
      ],
    }),
    async () => {
      // Act
      const info = readBugInfo(annotationsOf(BUG));

      // Assert
      expect(info).toEqual({
        id: 'C12',
        kind: 'bug',
        actual: 'hace otra cosa',
        ...BUG_KNOWLEDGE.C12,
      });
      expect(readDoc(annotationsOf(BUG)).titulo).toBe('[C12] Un bug de prueba');
    }
  );

  test(
    'every known bug has a cause, a fix and a place',
    documented({
      titulo: 'No hay bugs sin causa ni arreglo documentados',
      area: AREA,
      intent: 'Comprobar que ningún bug de la lista queda con textos vacíos.',
      steps: ['Recorre todos los bugs conocidos.'],
      expects: ['Ninguno tiene causa, arreglo o lugar vacíos.'],
    }),
    async () => {
      // Act
      const incomplete = Object.entries(BUG_KNOWLEDGE).filter(
        ([, knowledge]) =>
          !knowledge.cause.trim() ||
          !knowledge.fix.trim() ||
          !knowledge.where.trim()
      );

      // Assert
      expect(incomplete).toEqual([]);
      expect(
        missingBugParts({
          id: 'X',
          kind: 'bug',
          actual: '',
          cause: 'c',
          fix: '',
          where: 'w',
        })
      ).toEqual(['actual', 'fix']);
    }
  );

  test(
    'a bug introduces itself with objective, cause and fix',
    documented({
      titulo: 'La ficha de un bug explica objetivo, causa y arreglo',
      area: AREA,
      intent: 'Comprobar el texto que se imprime antes de correr un bug.',
      steps: ['Da formato a la ficha de un bug y a la de un control.'],
      expects: [
        'El bug muestra objetivo, por qué falla, qué arreglar y dónde.',
        'El control dice que debe seguir pasando y no pide arreglo.',
      ],
    }),
    async () => {
      // Arrange
      const doc = readDoc(annotationsOf(BUG));
      const info = readBugInfo(annotationsOf(BUG));
      if (!info) throw new Error('bug info missing');

      // Act
      const bugText = formatBugFicha({
        title: 'mi bug',
        doc,
        info,
        position: { index: 1, total: 3 },
      });
      const controlText = formatBugFicha({
        title: 'mi control',
        doc,
        info: { ...info, kind: 'control' },
      });

      // Assert
      expect(bugText).toContain('▶ [1/3] mi bug');
      expect(bugText).toContain('Objetivo: Comprobar algo.');
      expect(bugText).toContain('Por qué falla hoy: hace otra cosa.');
      expect(bugText).toContain(`Qué arreglar:      ${info.fix}`);
      expect(bugText).toContain(`Dónde:             ${info.where}`);
      expect(controlText).toContain('Es un CONTROL');
      expect(controlText).not.toContain('Qué arreglar');
    }
  );

  test(
    'a result is read as open, fixed, other cause, control or regression',
    documented({
      titulo:
        'El resultado de un bug se lee como abierto, corregido o regresión',
      area: AREA,
      intent:
        'Comprobar que un rojo de bug significa «sigue abierto» y que un verde o un rojo inesperado se avisan.',
      steps: ['Clasifica combinaciones de tipo, estado y mensaje.'],
      expects: [
        'Bug rojo por su aserción: abierto.',
        'Bug verde: corregido.',
        'Bug que agota el tiempo: otra causa.',
        'Control verde: en verde; control rojo: regresión.',
      ],
    }),
    async () => {
      // Act
      const open = classifyBugResult({
        kind: 'bug',
        status: 'failed',
        message: VALUE_MESSAGE,
      });
      const fixed = classifyBugResult({ kind: 'bug', status: 'passed' });
      const other = classifyBugResult({
        kind: 'bug',
        status: 'timedOut',
        message: TIMEOUT_MESSAGE,
      });
      const controlOk = classifyBugResult({
        kind: 'control',
        status: 'passed',
      });
      const regression = classifyBugResult({
        kind: 'control',
        status: 'failed',
        message: VALUE_MESSAGE,
      });

      // Assert
      expect([open, fixed, other, controlOk, regression]).toEqual([
        'open',
        'fixed',
        'other-cause',
        'control-ok',
        'regression',
      ]);
    }
  );

  test(
    'an open bug prints what it found and what to change',
    documented({
      titulo: 'Un bug abierto muestra lo encontrado y qué cambiar',
      area: AREA,
      intent: 'Comprobar el texto del veredicto y la tabla final de bugs.',
      steps: ['Da formato al veredicto de un bug abierto y al resumen.'],
      expects: [
        'El veredicto muestra esperaba, encontró, el arreglo y el lugar.',
        'El resumen cuenta abiertos, corregidos y controles.',
      ],
    }),
    async () => {
      // Arrange
      const info = readBugInfo(annotationsOf(BUG));
      if (!info) throw new Error('bug info missing');

      // Act
      const outcome = formatBugOutcome({
        info,
        verdict: 'open',
        durationMs: 2500,
        message: VALUE_MESSAGE,
      });
      const summary = formatBugSummary([
        { id: 'B10', title: 'a', verdict: 'open' },
        { id: 'B9', title: 'b', verdict: 'fixed' },
        { id: 'B9', title: 'c', verdict: 'control-ok' },
      ]);

      // Assert
      expect(outcome).toContain('🔴 Sigue abierto');
      expect(outcome).toContain('Esperaba:   "1500"');
      expect(outcome).toContain('Encontró:   "1000"');
      expect(outcome).toContain(info.fix);
      expect(outcome).toContain(info.where);
      expect(summary).toContain(
        '1 abiertos · 1 corregidos · 1 controles en verde'
      );
    }
  );

  test(
    'a comparison failure without expected/received shows the difference',
    documented({
      titulo: 'Un bug que compara listas muestra la diferencia',
      area: AREA,
      intent:
        'Comprobar que, cuando Playwright no da «Expected/Received» sino una diferencia, el veredicto la muestra.',
      steps: [
        'Da formato al veredicto de un bug con una diferencia de listas.',
      ],
      expects: [
        'El veredicto incluye las líneas de la diferencia y no el registro de llamadas.',
      ],
    }),
    async () => {
      // Arrange
      const message = `Error: expect(received).toEqual(expected)

- Expected  - 1
+ Received  + 1

-   "amountBs": 4000,
+   "amountBs": 3800,

Call Log:
- Timeout 5000ms exceeded`;
      const info = readBugInfo(annotationsOf(BUG));
      if (!info) throw new Error('bug info missing');

      // Act
      const detail = assertionDetail(message);
      const outcome = formatBugOutcome({
        info,
        verdict: 'open',
        durationMs: 1000,
        message,
      });

      // Assert
      expect(detail).toContain('-   "amountBs": 4000,');
      expect(detail.join('\n')).not.toContain('Timeout');
      expect(outcome).toContain('+   "amountBs": 3800,');
    }
  );
});
