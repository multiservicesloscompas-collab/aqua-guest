# Flujo de Alquileres - AquaGest

## Descripción General

El módulo de alquileres gestiona el alquiler de lavadoras con seguimiento de entregas, devoluciones, pagos y estado de las máquinas. Incluye gestión de clientes y programación de turnos.

## Componentes Principales

### AlquilerPage
Página principal que integra formulario de alquiler, selector de cliente, selector de lavadora y lista de alquileres activos.

### RentalCard
Tarjeta de alquiler con información del cliente, lavadora, fechas, estado y acciones.

### RentalForm
Formulario para crear/editar alquiler con todos los campos necesarios.

## Flujo de Creación de Alquiler

```
Usuario completa formulario
    ↓
Selecciona/crea cliente
    ↓
Selecciona lavadora disponible
    ↓
Define turno y horarios
    ↓
Ingresa costo de delivery
    ↓
Selecciona método de pago
    ↓
Click en "Crear Alquiler"
    ↓
store.addRental(rentalData)
    ↓
Valida disponibilidad de lavadora
    ↓
Si cliente es nuevo: crea cliente primero
    ↓
Guarda alquiler con customer_id
    ↓
Actualiza estado de lavadora
    ↓
Muestra confirmación
```

## Estructura de Datos

### WasherRental (Rentas de lavadoras)
- id: UUID
- date: YYYY-MM-DD
- customerId: UUID del cliente
- customerName: Nombre
- machineId: ID de lavadora
- shift: turno (mañana/tarde/noche)
- deliveryTime: HH:MM
- pickupTime: HH:MM
- pickupDate: YYYY-MM-DD
- deliveryFee: número
- totalUsd: número
- paymentMethod: string
- status: pendiente/en_curso/completado
- isPaid: boolean
- datePaid: YYYY-MM-DD opcional
- notes: string opcional

## Validaciones

- Lavadora debe estar disponible
- Cliente requerido (nombre mínimo)
- Fechas válidas (pickup después de delivery)
- Horarios en formato HH:MM
- Montos mayores a 0
- Método de pago válido

## Estados del Alquiler

- **pendiente**: Creado, esperando entrega
- **en_curso**: Lavadora entregada al cliente
- **completado**: Lavadora devuelta

## Gestión de Pagos

- Marcar como pagado actualiza isPaid y datePaid
- Se puede pagar antes, durante o después del alquiler
- El estado de pago es independiente del estado del alquiler

## Integración con Clientes

- Buscar cliente existente por nombre/teléfono
- Crear nuevo cliente si no existe
- Asociar alquiler con customer_id
- Autocompletar datos del cliente en futuros alquileres
