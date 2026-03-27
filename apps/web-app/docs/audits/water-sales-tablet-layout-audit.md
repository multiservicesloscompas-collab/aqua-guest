# Water Sales Tablet Layout Audit

## Scope

Auditoría exhaustiva del layout responsive de `WaterSalesPage` para validar que, en viewport tablet, la acción de carrito mantiene prioridad contextual **before records** (antes del bloque de registros en jerarquía de decisión), preservando el guard rail mobile `<768px`.

## Baseline audited

1. `DateSelector` primero.
2. `PaymentFilter` segundo.
3. Bloque de carrito tablet (columna secundaria sticky) evaluado antes de registros.
4. Bloque de registros después de controles y prioridad de carrito.
5. En mobile no debe aparecer estructura split tablet; se mantiene FAB de carrito.

## Evidence correlation matrix

| Rule                                                               | Status | Code evidence                                                                                                                                                                                                           | Test evidence                                                                                         | Domain docs evidence                                                                  | Notes                                                                                 |
| ------------------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| DateSelector primero en jerarquía tablet                           | Pass   | `apps/web-app/src/pages/WaterSalesPage.tsx` (`data-testid="water-sales-tablet-controls"`, `data-audit-order="1"`)                                                                                                       | `apps/web-app/src/pages/WaterSalesPage.responsive.test.tsx` (`enforces tablet baseline hierarchy...`) | `apps/web-app/docs/domain-water-sales.md` sección **Responsive Core (Phase 3)**       | Orden explícito y validado por checkpoints.                                           |
| PaymentFilter después de DateSelector                              | Pass   | `WaterSalesPage.tsx` (`DateSelector` seguido de `TabletControlsCard` + `PaymentFilter`)                                                                                                                                 | `WaterSalesPage.responsive.test.tsx` (`Date` antes de `Filter`)                                       | `domain-water-sales.md` (columna principal: DateSelector + PaymentFilter + SalesList) | Se valida orden por contenido del bloque de controles/columna primaria.               |
| Cart before records como jerarquía de decisión (no adyacencia DOM) | Pass   | `WaterSalesPage.tsx` (`data-audit-order="2"`, `data-audit-priority="cart-before-records"` en columna secundaria) + `apps/web-app/src/lib/responsive/tabletLayoutPatterns.ts` (`TABLET_SECONDARY_PRIORITY_ACTION_CLASS`) | `WaterSalesPage.responsive.test.tsx` (assert de `data-audit-priority` y orden 2 vs 3)                 | `domain-water-sales.md` (columna secundaria fija de carrito)                          | Criterio auditado como prioridad visual-operativa en split layout.                    |
| Registros después de controles/prioridad de carrito                | Pass   | `WaterSalesPage.tsx` (`data-testid="water-sales-records-region"`, `data-audit-order="3"`)                                                                                                                               | `WaterSalesPage.responsive.test.tsx` (assert `data-audit-order="3"`)                                  | `domain-water-sales.md` (registros en columna principal tras controles)               | Mantiene jerarquía incluso con lista vacía/loading.                                   |
| Invariante mobile `<768px` sin split tablet                        | Pass   | `WaterSalesPage.tsx` render condicional `isTabletViewport` + FAB solo cuando `!isTabletViewport`                                                                                                                        | `WaterSalesPage.responsive.test.tsx` (`keeps mobile floating cart button under 768px`)                | `domain-water-sales.md` guard rail mobile estricto                                    | No aparecen `water-sales-primary-column` ni `water-sales-secondary-column` en mobile. |

## Edge scenarios audited

- Carrito vacío + sin registros → jerarquía se mantiene (cart region evaluada antes de records).
- Estado loading sin registros → se mantiene prioridad de carrito y orden de regiones.
- Carrito con ítems y lista vacía → CTA prioritario visible y total correcto.

## Missing-source error-state coverage

- Se agregó clasificación explícita de correlación en `apps/web-app/src/lib/responsive/auditEvidenceCorrelation.ts` para materializar el escenario de spec **"Error state when one evidence source is missing"**.
- Regla de clasificación:
  - `Pass`: hay evidencia en `code`, `test` y `docs`.
  - `Partial`: falta exactamente una fuente.
  - `Gap`: faltan dos o más fuentes.
- La salida incluye `missingSources` y `proposedRemediation` por fuente faltante para trazabilidad y remediación accionable.

### Test evidence for missing-source handling

- `apps/web-app/src/lib/responsive/auditEvidenceCorrelation.test.ts`
  - ✅ `returns Pass when all evidence sources are present`
  - ✅ `returns Partial and remediation when one source is missing`
  - ✅ `returns Gap when two or more sources are missing`

## Gaps and backlog

### Current gap classification

- **Gap:** ninguno bloqueante detectado para baseline responsive tablet/mobile.
- **Partial:** no aplica en baseline actual; triangulación código/pruebas/docs completa para reglas auditadas.

### Recommended backlog (non-blocking hardening)

1. Añadir prueba de accesibilidad enfocada en landmarks/aria-label de regiones auditadas (`Controles de venta`, `Registros de ventas`, `Acciones prioritarias de carrito`).
2. Evaluar inclusión de captura visual (snapshot semántico o visual regression) para proteger jerarquía en futuros refactors de layout.

## Verification command

- `npx vitest run src/pages/WaterSalesPage.responsive.test.tsx`

## Execution evidence (Phase 5)

- Date: 2026-03-09
- Command: `npx vitest run src/pages/WaterSalesPage.responsive.test.tsx`
- Result: ✅ 1 file passed, 6 tests passed (`src/pages/WaterSalesPage.responsive.test.tsx`)

## Execution evidence (missing-source coverage batch)

- Date: 2026-03-09
- Command: `npx vitest run src/lib/responsive/auditEvidenceCorrelation.test.ts`
- Result: ✅ 1 file passed, 3 tests passed (`src/lib/responsive/auditEvidenceCorrelation.test.ts`)
