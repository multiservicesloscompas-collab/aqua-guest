# Módulo de Configuración

## Descripción General

El módulo de configuración permite gestionar los parámetros globales del sistema que afectan el funcionamiento de toda la aplicación. Es fundamental para mantener actualizados los precios y tasas de cambio.

## Funcionalidades Principales

### 1. Gestión de Tasa de Cambio (Dólar)

El sistema permite configurar y mantener un historial de la tasa de cambio Bolívares/USD.

#### Características:
- **Actualización de tasa actual**: Permite modificar la tasa de cambio del día
- **Historial de tasas**: Mantiene un registro histórico de todas las tasas configuradas por fecha
- **Tasa por fecha**: El sistema puede recuperar la tasa de cambio específica de cualquier fecha pasada
- **Sincronización con Supabase**: Las tasas se guardan en la base de datos para persistencia

#### Comportamiento:
- Si se actualiza la tasa el mismo día, se sobrescribe la entrada existente
- Si es un día nuevo, se crea una nueva entrada en el historial
- Las ventas y alquileres usan la tasa del día en que se registraron
- La tasa se muestra con 2 decimales (ej: 36.50 Bs/$)

#### Página de Historial de Tasas:
- Muestra todas las tasas registradas ordenadas por fecha (más reciente primero)
- Indica la variación porcentual entre días consecutivos
- Usa íconos para mostrar si la tasa subió (🔺), bajó (🔻) o se mantuvo (➖)
- Colores: rojo para subida (malo para el negocio), verde para bajada (bueno)

### 2. Configuración de Precios por Litros

El sistema permite configurar precios escalonados según la cantidad de litros vendidos.

#### Puntos de Quiebre (Breakpoints):
Los precios se configuran por rangos de litros:
- **1 litro**: Precio base (más caro por litro)
- **2 litros**: Precio reducido
- **5 litros**: Precio más económico
- **12 litros**: Precio mayorista
- **19 litros**: Precio estándar de botellón
- **24 litros**: Precio especial para grandes cantidades

#### Cálculo de Precios:
El sistema calcula automáticamente el precio total según la cantidad de litros:
- Si la cantidad coincide exactamente con un breakpoint, usa ese precio
- Si está entre dos breakpoints, usa el precio del breakpoint inmediatamente inferior
- Ejemplo: 15 litros usaría el precio configurado para 12 litros

#### Validaciones:
- Todos los precios deben ser mayores a 0
- Los precios se guardan en Bolívares
- Se sincronizan con Supabase para persistencia

### 3. Última Actualización

El sistema registra automáticamente:
- Fecha y hora de la última modificación de configuración
- Se muestra en formato legible: "18 de febrero, 14:30"
- Usa la zona horaria de Venezuela (America/Caracas)

## Estructura de Datos

### AppConfig
```typescript
interface AppConfig {
  exchangeRate: number;           // Tasa actual Bs/USD
  lastUpdated: string;            // ISO timestamp
  literPricing: LiterPricing[];   // Precios por litros
  exchangeRateHistory: ExchangeRateHistory[]; // Historial
}
```

### ExchangeRateHistory
```typescript
interface ExchangeRateHistory {
  date: string;      // YYYY-MM-DD
  rate: number;      // Tasa Bs/USD
  updatedAt: string; // ISO timestamp
}
```

### LiterPricing
```typescript
interface LiterPricing {
  breakpoint: number; // Cantidad de litros
  price: number;      // Precio en Bs
}
```

## Flujo de Uso

### Actualizar Tasa de Cambio:
1. Usuario accede a la página de Configuración
2. Ingresa la nueva tasa en el campo correspondiente
3. Presiona "Guardar Tasa"
4. Sistema valida que sea > 0
5. Sistema guarda en estado local y Supabase
6. Sistema actualiza o crea entrada en historial
7. Muestra confirmación al usuario

### Actualizar Precios por Litros:
1. Usuario modifica los precios en los campos correspondientes
2. Presiona "Guardar Precios"
3. Sistema valida que todos sean > 0
4. Sistema guarda en estado local y Supabase
5. Muestra confirmación al usuario

### Ver Historial de Tasas:
1. Usuario presiona "Ver Historial" en Configuración
2. Sistema muestra lista ordenada de tasas
3. Cada entrada muestra: fecha, tasa, variación porcentual
4. Usuario puede ver tendencias y cambios históricos

## Integración con Otros Módulos

- **Ventas**: Usa la tasa del día para calcular montos en USD
- **Alquileres**: Calcula precios en Bs basado en USD y tasa del día
- **Agua Prepagada**: Usa precios por litros para calcular montos
- **Reportes**: Puede mostrar datos en Bs o USD según la tasa

## Consideraciones Técnicas

### Persistencia:
- Estado local: Zustand con persist
- Base de datos: Supabase (tablas `exchange_rates` y `liter_pricing`)
- Fallback: Si falla Supabase, se guarda solo localmente

### Sincronización:
- Al cargar la app, se obtienen datos de Supabase
- Las actualizaciones se intentan guardar en Supabase primero
- Si hay conflicto de fecha en `exchange_rates`, se usa `upsert` con `onConflict: 'date'`

### Zona Horaria:
- Todas las fechas usan zona horaria de Venezuela (America/Caracas)
- Función `getVenezuelaDate()` asegura consistencia

## Validaciones y Errores

### Validaciones:
- Tasa de cambio debe ser > 0
- Precios por litros deben ser > 0
- Fechas deben estar en formato YYYY-MM-DD

### Manejo de Errores:
- Si falla guardado en Supabase, se guarda localmente
- Se muestra toast de error al usuario
- Se registra error en consola para debugging

## Mejoras Futuras

- Importar tasas automáticamente desde API externa
- Alertas cuando la tasa cambia significativamente
- Gráficas de evolución de la tasa
- Exportar historial de tasas a Excel
- Configuración de múltiples monedas
