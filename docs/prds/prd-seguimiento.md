# Módulo de Seguimiento

## Descripción General

El módulo de seguimiento proporciona una vista consolidada de todos los alquileres de lavadoras que requieren atención o acción. Permite al personal monitorear el estado de los alquileres activos y gestionar pagos pendientes de manera eficiente.

## Funcionalidades Principales

### 1. Vista de Alquileres No Pagados

Muestra todos los alquileres que aún no han sido pagados, independientemente de su estado.

#### Características:
- **Prioridad alta**: Se muestra primero con fondo rojo/amarillo de alerta
- **Badge doble**: Muestra estado del alquiler + "No pagado"
- **Filtro automático**: Excluye alquileres finalizados
- **Contador visible**: Muestra cantidad de alquileres sin pagar

#### Información Mostrada:
- Nombre de la lavadora y capacidad
- Nombre del cliente
- Teléfono del cliente
- Dirección del cliente
- Horarios de entrega y recogida
- Tipo de jornada (medio/completo/doble turno)
- Monto total en USD
- Fechas de servicio y recogida
- Botón de extensión (si aplica)

### 2. Vista de Lavadoras Agendadas

Muestra alquileres que están programados pero aún no han sido entregados.

#### Características:
- **Estado**: Solo alquileres con status "agendado"
- **Color**: Badge azul/celeste para identificación rápida
- **Propósito**: Preparar entregas del día o próximos días
- **Contador**: Muestra cantidad de lavadoras por entregar

#### Casos de Uso:
- Planificar rutas de entrega
- Verificar disponibilidad de lavadoras
- Confirmar datos del cliente antes de entregar
- Preparar lavadoras para el servicio

### 3. Vista de Lavadoras Enviadas

Muestra alquileres que ya fueron entregados al cliente y están en uso.

#### Características:
- **Estado**: Solo alquileres con status "enviado"
- **Color**: Badge verde para indicar servicio activo
- **Propósito**: Monitorear lavadoras en campo
- **Contador**: Muestra cantidad de lavadoras en uso

#### Casos de Uso:
- Verificar cuántas lavadoras están en servicio
- Planificar recogidas según horarios
- Identificar lavadoras próximas a vencer
- Gestionar extensiones de tiempo

### 4. Extensión de Tiempo

Permite extender el tiempo de alquiler de una lavadora que ya está en servicio.

#### Requisitos:
- Alquiler debe estar en estado "enviado" o "agendado"
- No puede estar en estado "finalizado"
- Función `canExtendRental()` valida elegibilidad

#### Proceso:
1. Usuario presiona botón "Extender" en la tarjeta del alquiler
2. Se abre diálogo de extensión
3. Usuario selecciona tipo de extensión (medio/completo/doble turno)
4. Sistema calcula nueva hora y fecha de recogida
5. Sistema calcula costo adicional
6. Usuario confirma extensión
7. Sistema actualiza alquiler con:
   - Nueva hora de recogida
   - Nueva fecha de recogida
   - Costo adicional agregado al total
   - Registro de extensión en historial
8. Sistema sincroniza con Supabase

#### Información de Extensión:
- Se mantiene hora original de recogida en `originalPickupTime`
- Se mantiene fecha original en `originalPickupDate`
- Array de extensiones en `extensions[]` con:
  - Tipo de extensión
  - Costo adicional
  - Fecha y hora de la extensión

## Estructura de Datos

### Estados de Alquiler
```typescript
type RentalStatus = 'agendado' | 'enviado' | 'finalizado';
```

### WasherRental (campos relevantes)
```typescript
interface WasherRental {
  id: string;
  status: RentalStatus;
  isPaid: boolean;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  machineId: string;
  shift: RentalShift;
  deliveryTime: string;
  pickupTime: string;
  pickupDate: string;
  totalUsd: number;
  date: string;
  extensions?: RentalExtension[];
  originalPickupTime?: string;
  originalPickupDate?: string;
}
```

### RentalExtension
```typescript
interface RentalExtension {
  type: RentalShift;
  additionalCost: number;
  extendedAt: string;
}
```

## Flujo de Uso

### Monitorear Pagos Pendientes:
1. Usuario accede a página de Seguimiento
2. Sistema muestra sección "No Pagados" primero
3. Usuario revisa lista de alquileres sin pagar
4. Usuario puede:
   - Contactar al cliente (ver teléfono)
   - Ir a la dirección (ver ubicación)
   - Marcar como pagado desde la tarjeta
   - Editar el alquiler si es necesario

### Gestionar Entregas Agendadas:
1. Usuario revisa sección "Lavadoras Agendadas"
2. Ve lista de entregas pendientes
3. Puede verificar:
   - Qué lavadora entregar
   - A qué cliente
   - A qué hora
   - Dónde (dirección)
4. Al entregar, cambia estado a "enviado"

### Monitorear Lavadoras en Servicio:
1. Usuario revisa sección "Lavadoras Enviadas"
2. Ve todas las lavadoras actualmente en uso
3. Puede identificar:
   - Cuáles están próximas a vencer
   - Cuáles necesitan recogida hoy
   - Cuáles pueden extenderse
4. Planifica recogidas según horarios

### Extender Tiempo de Alquiler:
1. Usuario identifica alquiler que necesita extensión
2. Presiona botón "Extender" en la tarjeta
3. Selecciona tipo de extensión en diálogo
4. Revisa nueva hora de recogida calculada
5. Revisa costo adicional
6. Confirma extensión
7. Sistema actualiza alquiler
8. Cliente tiene más tiempo con la lavadora

## Integración con Otros Módulos

### Alquileres:
- Obtiene datos de todos los alquileres del store
- Filtra según criterios de cada sección
- Permite cambiar estado de alquileres
- Permite marcar como pagado

### Configuración:
- Usa configuración de jornadas para calcular extensiones
- Usa tasa de cambio para mostrar montos
- Respeta horarios laborales configurados

### Clientes:
- Muestra información del cliente en cada tarjeta
- Permite acceso rápido a datos de contacto
- Útil para comunicación directa

### Lavadoras:
- Obtiene información de lavadoras del store
- Muestra nombre y capacidad en cada tarjeta
- Ayuda a identificar qué lavadora está en servicio

## Consideraciones Técnicas

### Filtrado en Tiempo Real:
- Usa `useMemo` para optimizar filtrado
- Se actualiza automáticamente al cambiar datos
- Contadores se recalculan dinámicamente

### Estados Mutuamente Excluyentes:
- Un alquiler solo puede estar en una sección
- "No Pagados" puede incluir alquileres de cualquier estado activo
- "Agendados" y "Enviados" son mutuamente excluyentes

### Sincronización:
- Cambios de estado sincronizan con Supabase
- Extensiones se guardan en base de datos
- Fallback a estado local si falla sincronización

### Validaciones:
- Solo alquileres activos (no finalizados) en "No Pagados"
- Solo alquileres elegibles pueden extenderse
- Extensiones respetan horarios laborales

## Casos de Uso Comunes

### Caso 1: Cliente No Ha Pagado
1. Alquiler aparece en sección "No Pagados"
2. Personal ve badge rojo de alerta
3. Llama al cliente usando teléfono mostrado
4. Cliente paga
5. Personal marca alquiler como pagado
6. Alquiler sale de la sección "No Pagados"

### Caso 2: Planificar Entregas del Día
1. Personal revisa "Lavadoras Agendadas" por la mañana
2. Ve 3 entregas programadas
3. Organiza ruta según direcciones
4. Prepara las 3 lavadoras
5. Al entregar cada una, cambia estado a "enviado"
6. Lavadoras pasan a sección "Enviadas"

### Caso 3: Cliente Necesita Más Tiempo
1. Cliente llama pidiendo extensión
2. Personal busca alquiler en "Lavadoras Enviadas"
3. Presiona "Extender" en la tarjeta
4. Selecciona "Medio Turno" (8 horas más)
5. Sistema calcula nueva hora: 20:00 → 04:00 (día siguiente)
6. Sistema ajusta a horario laboral: 09:00 día siguiente
7. Sistema agrega costo de medio turno al total
8. Confirma extensión
9. Cliente tiene hasta las 09:00 del día siguiente

### Caso 4: Monitorear Lavadoras en Campo
1. Gerente revisa "Lavadoras Enviadas"
2. Ve 5 lavadoras actualmente en servicio
3. Identifica 2 que vencen hoy
4. Planifica recogida para esas 2
5. Ve 1 que puede necesitar extensión
6. Llama proactivamente al cliente

## Mejoras Futuras

- Notificaciones push para pagos pendientes
- Alertas de lavadoras próximas a vencer (2 horas antes)
- Mapa con ubicaciones de lavadoras en servicio
- Historial de extensiones por cliente
- Estadísticas de pagos tardíos
- Filtro por fecha de vencimiento
- Ordenamiento personalizado (por hora, por cliente, etc.)
- Búsqueda rápida de alquileres
- Exportar lista de pendientes a PDF
- Integración con WhatsApp para recordatorios
