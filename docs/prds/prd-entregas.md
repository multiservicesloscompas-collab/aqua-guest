# Módulo de Entregas (Alquileres)

## Descripción General

El módulo de entregas gestiona todo el ciclo de vida de los alquileres de lavadoras, desde la agenda inicial hasta la finalización del servicio. Incluye cálculo automático de horarios, gestión de estados, y seguimiento de pagos.

## Funcionalidades Principales

### 1. Creación de Alquileres

Permite agendar nuevos alquileres de lavadoras con cálculo automático de horarios.

#### Datos Requeridos:
- **Cliente**: Nombre, teléfono y dirección (búsqueda o creación rápida)
- **Lavadora**: Selección de lavadora disponible
- **Tipo de jornada**: Medio turno (8h), Turno completo (24h), Doble turno (48h)
- **Hora de entrega**: Hora en que se entregará la lavadora
- **Tarifa de entrega**: Costo adicional por delivery ($0-$5)
- **Método de pago**: Efectivo, Pago Móvil, Punto de Venta, Divisa
- **Notas**: Información adicional opcional

#### Datos Calculados Automáticamente:
- **Hora de recogida**: Basada en hora de entrega + duración de jornada
- **Fecha de recogida**: Puede ser mismo día o día siguiente
- **Ajuste a horario laboral**: Si la recogida cae fuera del horario, se ajusta
- **Precio total**: Precio de jornada + tarifa de entrega
- **Conversión a Bs**: Usando tasa de cambio del día

### 2. Estados del Alquiler

Los alquileres pasan por tres estados durante su ciclo de vida:

#### Agendado (📅)
- **Estado inicial**: Al crear el alquiler
- **Significado**: Lavadora reservada pero aún no entregada
- **Acciones disponibles**:
  - Editar todos los datos
  - Cambiar a "Enviado" al entregar
  - Marcar como pagado
  - Eliminar si se cancela
  - Extender tiempo

#### Enviado (🚚)
- **Estado activo**: Lavadora en poder del cliente
- **Significado**: Servicio en curso
- **Acciones disponibles**:
  - Cambiar a "Finalizado" al recoger
  - Marcar como pagado
  - Extender tiempo
  - Editar datos limitados

#### Finalizado (✅)
- **Estado final**: Servicio completado
- **Significado**: Lavadora devuelta
- **Acciones disponibles**:
  - Solo visualización
  - Marcar como pagado (si falta)
  - No se puede editar ni eliminar

### 3. Cálculo de Horarios

El sistema calcula automáticamente los horarios de recogida respetando el horario laboral.

#### Horario Laboral:
- **Lunes a Sábado**: 9:00 AM - 8:00 PM
- **Domingo**: 9:00 AM - 2:00 PM

#### Duración de Jornadas:
- **Medio turno**: 8 horas
- **Turno completo**: 24 horas
- **Doble turno**: 48 horas

#### Ejemplos de Cálculo:

**Ejemplo 1: Dentro del horario**
- Entrega: Lunes 12:00 PM
- Jornada: Medio turno (8h)
- Recogida calculada: Lunes 8:00 PM ✓
- Resultado: Mismo día, dentro del horario

**Ejemplo 2: Fuera del horario**
- Entrega: Lunes 4:00 PM
- Jornada: Medio turno (8h)
- Recogida calculada: Martes 12:00 AM ✗
- Ajuste: Martes 9:00 AM ✓
- Resultado: Día siguiente, primera hora

**Ejemplo 3: Fin de semana**
- Entrega: Sábado 6:00 PM
- Jornada: Turno completo (24h)
- Recogida calculada: Domingo 6:00 PM ✗ (cierra a 2:00 PM)
- Ajuste: Lunes 9:00 AM ✓
- Resultado: Lunes, primera hora

**Ejemplo 4: Doble turno**
- Entrega: Jueves 10:00 AM
- Jornada: Doble turno (48h)
- Recogida calculada: Sábado 10:00 AM ✓
- Resultado: Dos días después, misma hora

### 4. Gestión de Pagos

Sistema flexible para registrar pagos de alquileres.

#### Estados de Pago:
- **No pagado**: Badge rojo, requiere atención
- **Pagado**: Badge verde, sin pendientes

#### Características:
- **Fecha de pago**: Se registra automáticamente al marcar como pagado
- **Pago anticipado**: Se puede marcar como pagado antes de entregar
- **Pago posterior**: Se puede pagar después de finalizar el servicio
- **Método de pago**: Se registra el método utilizado

#### Proceso de Pago:
1. Usuario presiona botón de pago en la tarjeta
2. Sistema muestra diálogo de confirmación
3. Usuario confirma pago
4. Sistema registra fecha de pago (fecha actual)
5. Estado cambia a "Pagado"
6. Badge se actualiza a verde

### 5. Extensión de Tiempo

Permite extender el tiempo de alquiler mientras está en servicio.

#### Requisitos:
- Alquiler debe estar en estado "Enviado" o "Agendado"
- No puede estar "Finalizado"

#### Tipos de Extensión:
- **Medio turno**: +8 horas
- **Turno completo**: +24 horas
- **Doble turno**: +48 horas

#### Proceso:
1. Usuario presiona "Extender" en la tarjeta
2. Se abre diálogo de extensión
3. Usuario selecciona tipo de extensión
4. Sistema calcula:
   - Nueva hora de recogida
   - Nueva fecha de recogida
   - Costo adicional
5. Sistema muestra resumen
6. Usuario confirma
7. Sistema actualiza:
   - `pickupTime` y `pickupDate`
   - `totalUsd` (suma costo adicional)
   - Agrega entrada a `extensions[]`
   - Guarda `originalPickupTime` y `originalPickupDate`

#### Historial de Extensiones:
```typescript
interface RentalExtension {
  type: RentalShift;
  additionalCost: number;
  extendedAt: string;
}
```

### 6. Edición de Alquileres

Permite modificar datos de alquileres existentes.

#### Datos Editables:
- Cliente (nombre, teléfono, dirección)
- Lavadora
- Tipo de jornada
- Hora de entrega
- Tarifa de entrega
- Método de pago
- Estado
- Estado de pago
- Notas

#### Restricciones:
- No se puede editar alquileres finalizados (solo visualización)
- Cambios recalculan hora de recogida automáticamente
- Cambios de jornada recalculan precio total

### 7. Visualización de Alquileres

Lista de alquileres con información completa y acciones rápidas.

#### Información Mostrada:
- Nombre y capacidad de lavadora
- Estado con badge de color
- Estado de pago
- Nombre del cliente
- Teléfono del cliente
- Dirección del cliente
- Horarios de entrega y recogida
- Tipo de jornada
- Precio total en USD
- Método de pago
- Notas (si existen)
- Fecha del servicio
- Fecha de recogida (si es diferente)

#### Acciones Disponibles:
- Cambiar estado (siguiente en el flujo)
- Marcar/desmarcar como pagado
- Editar alquiler
- Eliminar alquiler
- Extender tiempo (si aplica)

## Estructura de Datos

### WasherRental
```typescript
interface WasherRental {
  id: string;
  date: string;                    // YYYY-MM-DD
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  machineId: string;
  shift: RentalShift;
  deliveryTime: string;            // HH:mm
  pickupTime: string;              // HH:mm
  pickupDate: string;              // YYYY-MM-DD
  deliveryFee: number;             // USD
  totalUsd: number;                // USD
  paymentMethod: PaymentMethod;
  status: RentalStatus;
  isPaid: boolean;
  datePaid?: string;               // YYYY-MM-DD
  notes?: string;
  extensions?: RentalExtension[];
  originalPickupTime?: string;
  originalPickupDate?: string;
  createdAt: string;
  updatedAt: string;
}
```

### RentalShift
```typescript
type RentalShift = 'medio' | 'completo' | 'doble';
```

### RentalStatus
```typescript
type RentalStatus = 'agendado' | 'enviado' | 'finalizado';
```

## Flujo de Uso

### Crear Alquiler:
1. Usuario presiona botón "Nuevo Alquiler"
2. Busca o crea cliente
3. Selecciona lavadora disponible
4. Selecciona tipo de jornada
5. Ajusta hora de entrega (por defecto: hora actual redondeada)
6. Sistema muestra hora de recogida calculada
7. Ingresa tarifa de entrega si aplica
8. Selecciona método de pago
9. Agrega notas si es necesario
10. Presiona "Guardar"
11. Sistema valida datos
12. Sistema calcula horarios finales
13. Sistema guarda en Supabase
14. Alquiler aparece en lista con estado "Agendado"

### Entregar Lavadora:
1. Usuario localiza alquiler agendado
2. Presiona badge "Agendado"
3. Sistema pregunta: "¿Cambiar a Enviado?"
4. Usuario confirma
5. Estado cambia a "Enviado"
6. Badge se actualiza a azul
7. Lavadora está oficialmente en servicio

### Recoger Lavadora:
1. Usuario localiza alquiler enviado
2. Presiona badge "Enviado"
3. Sistema pregunta: "¿Cambiar a Finalizado?"
4. Usuario confirma
5. Estado cambia a "Finalizado"
6. Badge se actualiza a verde
7. Servicio completado

### Registrar Pago:
1. Usuario localiza alquiler sin pagar
2. Presiona botón de pago
3. Sistema pregunta: "¿Marcar como pagado?"
4. Usuario confirma
5. Sistema registra fecha de pago
6. Estado de pago cambia a "Pagado"
7. Badge se actualiza

### Extender Alquiler:
1. Cliente llama pidiendo más tiempo
2. Usuario localiza alquiler en lista
3. Presiona botón "Extender"
4. Selecciona tipo de extensión
5. Revisa nueva hora de recogida
6. Revisa costo adicional
7. Confirma extensión
8. Sistema actualiza alquiler
9. Cliente tiene más tiempo

## Integración con Otros Módulos

### Clientes:
- Búsqueda de clientes existentes
- Creación rápida de clientes nuevos
- Vinculación por `customerId`
- Actualización de datos del cliente

### Lavadoras:
- Selección de lavadoras disponibles
- Validación de disponibilidad
- Información de capacidad y nombre

### Configuración:
- Usa precios de jornadas configurados
- Usa tasa de cambio del día
- Respeta horarios laborales
- Calcula conversión USD/Bs

### Seguimiento:
- Alquileres aparecen en módulo de seguimiento
- Filtrado por estado
- Alertas de pagos pendientes

### Reportes:
- Ingresos por alquileres
- Estadísticas de uso de lavadoras
- Análisis de jornadas más vendidas
- Ingresos por delivery

## Consideraciones Técnicas

### Cálculo de Horarios:
- Usa librería `date-fns` para manipulación de fechas
- Función `calculatePickupTime()` centraliza lógica
- Respeta horarios laborales configurados
- Maneja cambios de día automáticamente

### Validación de Disponibilidad:
- Verifica que lavadora no esté ocupada en el horario
- Considera fecha de entrega y recogida
- Permite reservas futuras

### Sincronización:
- Operaciones CRUD sincronizan con Supabase
- Cache de alquileres por fecha para rendimiento
- Invalidación de cache al modificar datos
- Fallback a estado local si falla sincronización

### Optimizaciones:
- `RentalsDataService` con caching
- Carga por rango de fechas
- Máximo 30 fechas en cache
- Invalidación selectiva de cache

## Casos de Uso Comunes

### Caso 1: Alquiler Estándar
1. Cliente llama para alquilar
2. Se crea alquiler para hoy
3. Turno completo (24h)
4. Entrega: 10:00 AM
5. Recogida: Mañana 10:00 AM
6. Se entrega lavadora → estado "Enviado"
7. Cliente paga → se marca como pagado
8. Mañana se recoge → estado "Finalizado"

### Caso 2: Alquiler con Extensión
1. Cliente alquila medio turno
2. Entrega: 2:00 PM, Recogida: 10:00 PM
3. A las 8:00 PM cliente pide extensión
4. Se extiende medio turno más
5. Nueva recogida: Mañana 6:00 AM → ajustado a 9:00 AM
6. Costo adicional se suma al total
7. Cliente paga todo al final

### Caso 3: Alquiler Fin de Semana
1. Cliente alquila sábado 6:00 PM
2. Turno completo (24h)
3. Recogida calculada: Domingo 6:00 PM
4. Sistema ajusta: Lunes 9:00 AM (domingo cierra a 2:00 PM)
5. Cliente tiene lavadora todo el fin de semana

## Mejoras Futuras

- Notificaciones automáticas de recogida
- Recordatorios por WhatsApp
- Mapa de entregas del día
- Optimización de rutas
- Fotos de entrega/recogida
- Firma digital del cliente
- QR code para tracking
- Historial de mantenimiento de lavadoras
- Alertas de lavadoras próximas a vencer
- Estadísticas por lavadora
- Calendario visual de alquileres
- Bloqueo de fechas/horarios
- Descuentos por cliente frecuente
- Paquetes de alquileres
- Integración con sistema de inventario
