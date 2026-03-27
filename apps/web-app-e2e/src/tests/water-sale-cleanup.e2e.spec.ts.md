# water-sale-cleanup.e2e.spec.ts

Test E2E de Playwright para limpiar ventas de agua de prueba y validar limpieza en la UI.

## Descripción

Este test elimina todas las ventas de agua "descubribles" (creadas en runs anteriores de E2E) y valida que la limpieza se refleja correctamente en la UI.

## Tests Implementados

### 1. Test: Purga de Ventas Descubribles

**Validaciones:**

- ✅ Lista todas las ventas "descubribles" desde Supabase
- ✅ Navega a cada fecha donde hay ventas
- ✅ Elimina cada venta desde la UI (no directamente en BD)
- ✅ Usa el flujo completo: abrir → confirmar eliminación → verificar ausencia
- ✅ poll de Supabase hasta que no queden ventas
- ✅ Verifica que "Transacciones" no muestre ninguna "Venta de Agua"

## Estrategia de Limpieza

1. **No usa cleanup privilegiado:** Elimina desde la UI, no directamente en Supabase
2. **Ciclos de seguridad:** Máximo 50 ciclos para evitar loops infinitos
3. **Poll de verificación:** Espera hasta que Supabase tenga 0 ventas
4. **Validación final:** Verifica en vista de Transacciones

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:4200',
  },
});
```

O asegurar que la variable `E2E_BASE_URL` esté definida antes de ejecutar los tests.

## Comandos de Ejecución

```bash
npx playwright test apps/web-app-e2e/src/tests/water-sale-cleanup.e2e.spec.ts
```

```bash
npx playwright test apps/web-app-e2e/src/tests/water-sale-cleanup.e2e.spec.ts --debug
```

## Casos Borde Cubiertos

- ✅ Múltiples ventas en múltiples fechas
- ✅ Navegación entre fechas distantes
- ✅ Eliminación desde UI
- ✅ Validación de limpieza en BD
- ✅ Validación de limpieza en UI

## Dependencias

- `@playwright/test`
- `supabaseClient.ts` - Función `listDiscoverableSales()`
- `uiNavigation.ts` - Navegación a Dashboard, Ventas, Transacciones
- Funciones internas de navegación de fecha

---

**Última actualización:** 2026-03-23
