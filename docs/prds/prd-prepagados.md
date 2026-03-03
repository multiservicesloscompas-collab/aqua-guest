# Módulo de Agua Prepagada

## Descripción General

El módulo de agua prepagada permite gestionar pedidos de agua que los clientes pagan por adelantado pero que serán entregados posteriormente. Es útil para clientes que compran grandes cantidades o que prefieren pagar antes de recibir el producto.

## Funcionalidades Principales

### 1. Registro de Pedidos Prepagados

Permite crear nuevos pedidos de agua prepagada con toda la información necesaria.

#### Datos Requeridos:
- **Nombre del cliente** (obligatorio)
- **Cantidad de litros** (obligatorio)
- **Método de pago** (obligatorio)
- **Notas** (opcional)

#### Datos Calculados Automáticamente:
- **Monto en Bs**: Se calcula según los precios por litros configurados
- **Monto en USD**: Se calcula dividiendo el monto en Bs entre la tasa del día
- **Tasa de cambio**: Se registra la tasa vigente al momento del pago
- **Fecha de pago**: Se registra automáticamente (fecha actual)
- **Estado inicial**: Siempre se crea como "Pendiente"

### 2. Estados de Pedidos

Los pedidos prepagados tienen dos estados posibles:

#### Pendiente
- Estado inicial al crear el pedido
- Indica que el agua aún no ha sido entregada al cliente
- Se muestra con badge amarillo
- Permite marcar como entregado

#### Entregado
- Estado final después de entregar el agua
- Se registra automáticamente la fecha de entrega
- Se muestra con badge verde
- No permite cambios de estado

### 3. Filtrado de Pedidos

La interfaz permite filtrar pedidos por estado:
- **Pendientes**: Muestra solo pedidos sin entregar (vista por defecto)
- **Entregados**: Muestra solo pedidos ya entregados
- **Todos**: Muestra todos los pedidos sin filtro

El contador de pendientes se muestra en el botón de filtro para visibilidad rápida.

### 4. Gestión de Pedidos

#### Marcar como Entregado:
- Disponible solo para pedidos en estado "Pendiente"
- Requiere confirmación del usuario
- Actualiza el estado a "Entregado"
- Registra la fecha de entrega automáticamente
- Sincroniza con Supabase

#### Editar Pedido:
- Permite modificar: nombre, litros, método de pago, notas
- Recalcula automáticamente los montos si cambian los litros
- Mantiene el estado actual del pedido
- Sincroniza cambios con Supabase

#### Eliminar Pedido:
- Disponible para cualquier estado
- Requiere confirmación del usuario
- Elimina permanentemente el registro
- Sincroniza con Supabase

### 5. Visualización de Información

Cada pedido muestra:
- **Nombre del cliente** con ícono de gota de agua
- **Estado** con badge de color (amarillo/verde)
- **Litros**: Cantidad con sufijo "L"
- **Monto**: En Bolívares con 2 decimales
- **Fecha de pago**: Formato legible (ej: "18 feb 2024")
- **Método de pago**: Etiqueta descriptiva
- **Notas**: Si existen, se muestran en área destacada
- **Fecha de entrega**: Solo si está entregado

## Estructura de Datos

### PrepaidOrder
```typescript
interface PrepaidOrder {
  id: string;
  customerName: string;
  customerPhone?: string;
  liters: number;
  amountBs: number;
  amountUsd: number;
  exchangeRate: number;
  paymentMethod: PaymentMethod;
  status: PrepaidStatus;
  datePaid: string;        // YYYY-MM-DD
  dateDelivered?: string;  // YYYY-MM-DD
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### PrepaidStatus
```typescript
type PrepaidStatus = 'pendiente' | 'entregado';
```

## Flujo de Uso

### Crear Pedido Prepagado:
1. Usuario presiona botón FAB (+) en la esquina inferior derecha
2. Se abre sheet desde abajo con formulario
3. Usuario ingresa nombre del cliente (obligatorio)
4. Usuario ingresa cantidad de litros (obligatorio)
5. Sistema muestra precio calculado en tiempo real
6. Usuario selecciona método de pago (por defecto: Pago Móvil)
7. Usuario puede agregar notas opcionales
8. Usuario presiona "Registrar Prepago"
9. Sistema valida datos
10. Sistema calcula montos y registra tasa actual
11. Sistema guarda en Supabase y estado local
12. Sistema muestra confirmación
13. Sheet se cierra y lista se actualiza

### Marcar como Entregado:
1. Usuario localiza pedido pendiente en la lista
2. Usuario presiona botón "Marcar Entregado"
3. Sistema muestra diálogo de confirmación
4. Usuario confirma la acción
5. Sistema actualiza estado a "Entregado"
6. Sistema registra fecha de entrega (fecha actual)
7. Sistema sincroniza con Supabase
8. Pedido se mueve al filtro de "Entregados"

### Editar Pedido:
1. Usuario presiona ícono de editar (lápiz) en el pedido
2. Se abre sheet con datos precargados
3. Usuario modifica los campos deseados
4. Sistema recalcula montos si cambian los litros
5. Usuario presiona "Guardar Cambios"
6. Sistema valida y guarda en Supabase
7. Lista se actualiza con cambios

### Eliminar Pedido:
1. Usuario presiona ícono de eliminar (basura) en el pedido
2. Sistema muestra diálogo de confirmación
3. Usuario confirma eliminación
4. Sistema elimina de Supabase y estado local
5. Pedido desaparece de la lista

## Integración con Otros Módulos

### Configuración:
- Usa los precios por litros configurados para calcular montos
- Usa la tasa de cambio actual para conversión Bs/USD
- Función `getPriceForLiters()` del store

### Clientes:
- Aunque registra nombre del cliente, no está vinculado a la tabla de clientes
- Permite registro rápido sin crear cliente formal
- Campo de teléfono disponible pero opcional

### Reportes:
- Los pedidos prepagados NO se cuentan como ventas hasta que se entregan
- Pueden incluirse en reportes de ingresos anticipados
- Útil para análisis de flujo de caja

## Consideraciones Técnicas

### Persistencia:
- Estado local: Zustand con persist
- Base de datos: Supabase (tabla `prepaid_orders`)
- Fallback: Si falla Supabase, se guarda solo localmente

### Validaciones:
- Nombre del cliente no puede estar vacío
- Litros debe ser un número mayor a 0
- Método de pago debe ser válido
- Montos calculados deben ser mayores a 0

### Sincronización:
- Operaciones CRUD sincronizan con Supabase
- Si falla la sincronización, se mantiene cambio local
- Se muestra mensaje de error al usuario

### Zona Horaria:
- Fechas usan zona horaria de Venezuela
- Función `getVenezuelaDate()` para consistencia
- Formato de almacenamiento: YYYY-MM-DD

## Casos de Uso Comunes

### Caso 1: Cliente Compra Botellones por Mayor
Un cliente compra 10 botellones (190 litros) y paga por adelantado:
1. Se registra pedido con 190 litros
2. Sistema calcula precio según configuración
3. Cliente paga con Pago Móvil
4. Se registra como pendiente
5. Cuando se entregan los botellones, se marca como entregado

### Caso 2: Pedido para Entrega Futura
Cliente paga hoy pero quiere la entrega el fin de semana:
1. Se registra pedido con nota: "Entregar sábado 10am"
2. Queda en estado pendiente
3. El sábado, al entregar, se marca como entregado
4. Fecha de entrega refleja el sábado, no el día del pago

### Caso 3: Cliente Regular con Crédito
Cliente habitual paga mensualidad adelantada:
1. Se registra pedido grande (ej: 500 litros)
2. En notas: "Mensualidad marzo - retirar según necesidad"
3. Se va marcando como entregado cuando completa los retiros

## Mejoras Futuras

- Vincular pedidos con tabla de clientes
- Permitir entregas parciales (ej: entregar 50 de 200 litros)
- Notificaciones de pedidos pendientes antiguos
- Reportes de pedidos prepagados por período
- Búsqueda de pedidos por nombre de cliente
- Exportar lista de pendientes a PDF
- Historial de entregas por cliente
- Integración con sistema de inventario
