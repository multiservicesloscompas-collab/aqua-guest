# Guía de Capturas de Pantalla - AquaGuest

Este documento describe las capturas de pantalla recomendadas para documentar visualmente cada módulo del sistema.

## Estructura de Carpetas Recomendada

```
docs/
├── screenshots/
│   ├── dashboard/
│   ├── ventas/
│   ├── alquileres/
│   ├── prepagados/
│   ├── seguimiento/
│   ├── clientes/
│   ├── configuracion/
│   └── reportes/
```

---

## 1. Dashboard

### Capturas Principales:

#### 1.1 Vista General del Dashboard
**Archivo**: `dashboard/vista-general.png`
- **Descripción**: Pantalla principal con todas las tarjetas de estadísticas
- **Elementos a capturar**:
  - Tarjetas de ventas (hoy, semana, mes, año)
  - Tarjeta de gastos
  - Tarjeta de litros vendidos
  - Gráfica de ventas por día
  - Navegación inferior

#### 1.2 Selector de Fecha
**Archivo**: `dashboard/selector-fecha.png`
- **Descripción**: Calendario para seleccionar fecha
- **Elementos a capturar**:
  - Calendario desplegado
  - Fecha seleccionada resaltada
  - Botones de navegación

#### 1.3 Gráfica de Ventas
**Archivo**: `dashboard/grafica-ventas.png`
- **Descripción**: Gráfica de barras con ventas de la semana
- **Elementos a capturar**:
  - Barras con diferentes alturas
  - Etiquetas de días
  - Valores en cada barra

---

## 2. Módulo de Ventas

### Capturas Principales:

#### 2.1 Lista de Ventas Vacía
**Archivo**: `ventas/lista-vacia.png`
- **Descripción**: Vista cuando no hay ventas del día
- **Elementos a capturar**:
  - Mensaje "No hay ventas registradas"
  - Botón FAB para agregar venta

#### 2.2 Lista de Ventas con Datos
**Archivo**: `ventas/lista-con-ventas.png`
- **Descripción**: Lista de ventas del día seleccionado
- **Elementos a capturar**:
  - Múltiples tarjetas de ventas
  - Información de cada venta (productos, litros, monto, método)
  - Botones de editar y eliminar
  - Total del día

#### 2.3 Carrito de Compras Vacío
**Archivo**: `ventas/carrito-vacio.png`
- **Descripción**: Sheet de nueva venta sin productos
- **Elementos a capturar**:
  - Título "Nueva Venta"
  - Mensaje "Carrito vacío"
  - Botones de productos disponibles

#### 2.4 Carrito con Productos
**Archivo**: `ventas/carrito-con-productos.png`
- **Descripción**: Carrito con varios productos agregados
- **Elementos a capturar**:
  - Lista de productos en el carrito
  - Cantidad y precio de cada producto
  - Litros totales
  - Subtotal
  - Botones de cantidad (+/-)
  - Botón de eliminar producto

#### 2.5 Selección de Litros
**Archivo**: `ventas/seleccion-litros.png`
- **Descripción**: Diálogo para seleccionar cantidad de litros
- **Elementos a capturar**:
  - Opciones de litros (1, 2, 5, 12, 19, 24)
  - Precio calculado por opción
  - Botones de selección

#### 2.6 Resumen de Venta
**Archivo**: `ventas/resumen-venta.png`
- **Descripción**: Vista final antes de confirmar
- **Elementos a capturar**:
  - Total de litros
  - Método de pago seleccionado
  - Total en Bs
  - Total en USD
  - Tasa de cambio usada
  - Botón "Confirmar Venta"

#### 2.7 Confirmación de Venta
**Archivo**: `ventas/confirmacion-exitosa.png`
- **Descripción**: Toast de confirmación
- **Elementos a capturar**:
  - Mensaje "Venta registrada"
  - Ícono de éxito

---

## 3. Módulo de Alquileres

### Capturas Principales:

#### 3.1 Lista de Alquileres
**Archivo**: `alquileres/lista-alquileres.png`
- **Descripción**: Lista de alquileres del día
- **Elementos a capturar**:
  - Tarjetas de alquileres con diferentes estados
  - Badges de estado (Agendado, Enviado, Finalizado)
  - Badge de pago (Pagado/No pagado)
  - Información del cliente
  - Horarios de entrega y recogida

#### 3.2 Búsqueda de Cliente
**Archivo**: `alquileres/busqueda-cliente.png`
- **Descripción**: Componente de búsqueda de cliente
- **Elementos a capturar**:
  - Campo de búsqueda
  - Lista de resultados
  - Coincidencias resaltadas
  - Botón "Crear Nuevo Cliente"

#### 3.3 Formulario de Nuevo Alquiler
**Archivo**: `alquileres/formulario-nuevo.png`
- **Descripción**: Sheet completo de creación de alquiler
- **Elementos a capturar**:
  - Campos de cliente
  - Selector de lavadora
  - Selector de jornada
  - Hora de entrega
  - Hora de recogida calculada
  - Tarifa de delivery
  - Método de pago
  - Campo de notas

#### 3.4 Selección de Jornada
**Archivo**: `alquileres/seleccion-jornada.png`
- **Descripción**: Selector de tipo de jornada
- **Elementos a capturar**:
  - Opciones: Medio turno, Turno completo, Doble turno
  - Duración de cada opción
  - Precio de cada opción

#### 3.5 Cálculo de Horarios
**Archivo**: `alquileres/calculo-horarios.png`
- **Descripción**: Vista mostrando cálculo automático
- **Elementos a capturar**:
  - Hora de entrega seleccionada
  - Hora de recogida calculada
  - Fecha de recogida (si es diferente)
  - Indicador de ajuste por horario laboral

#### 3.6 Cambio de Estado
**Archivo**: `alquileres/cambio-estado.png`
- **Descripción**: Diálogo de confirmación de cambio de estado
- **Elementos a capturar**:
  - Mensaje de confirmación
  - Estado actual y nuevo estado
  - Botones Cancelar/Confirmar

#### 3.7 Alquiler con Extensión
**Archivo**: `alquileres/alquiler-extendido.png`
- **Descripción**: Tarjeta de alquiler que ha sido extendido
- **Elementos a capturar**:
  - Indicador de extensión
  - Hora original tachada
  - Nueva hora de recogida
  - Costo adicional

---

## 4. Módulo de Agua Prepagada

### Capturas Principales:

#### 4.1 Lista de Prepagados Pendientes
**Archivo**: `prepagados/lista-pendientes.png`
- **Descripción**: Vista de pedidos pendientes de entrega
- **Elementos a capturar**:
  - Filtros (Pendientes/Entregados/Todos)
  - Contador de pendientes
  - Tarjetas con badge amarillo
  - Información de cada pedido

#### 4.2 Lista de Prepagados Entregados
**Archivo**: `prepagados/lista-entregados.png`
- **Descripción**: Vista de pedidos ya entregados
- **Elementos a capturar**:
  - Tarjetas con badge verde
  - Fecha de entrega mostrada
  - Sin botón "Marcar Entregado"

#### 4.3 Formulario de Nuevo Prepago
**Archivo**: `prepagados/formulario-nuevo.png`
- **Descripción**: Sheet de creación de prepago
- **Elementos a capturar**:
  - Campo de nombre del cliente
  - Campo de litros
  - Precio calculado en tiempo real
  - Selector de método de pago
  - Campo de notas

#### 4.4 Confirmación de Entrega
**Archivo**: `prepagados/confirmacion-entrega.png`
- **Descripción**: Diálogo al marcar como entregado
- **Elementos a capturar**:
  - Mensaje de confirmación
  - Datos del pedido (litros, cliente)
  - Botones Cancelar/Confirmar

#### 4.5 Detalle de Prepago
**Archivo**: `prepagados/detalle-prepago.png`
- **Descripción**: Tarjeta expandida con toda la información
- **Elementos a capturar**:
  - Nombre del cliente
  - Cantidad de litros
  - Monto en Bs
  - Fecha de pago
  - Método de pago
  - Notas (si existen)
  - Botones de acción

---

## 5. Módulo de Seguimiento

### Capturas Principales:

#### 5.1 Vista General de Seguimiento
**Archivo**: `seguimiento/vista-general.png`
- **Descripción**: Pantalla completa con las tres secciones
- **Elementos a capturar**:
  - Sección "No Pagados" con fondo rojo
  - Sección "Lavadoras Agendadas" con fondo azul
  - Sección "Lavadoras Enviadas" con fondo verde
  - Contadores de cada sección

#### 5.2 Sección No Pagados
**Archivo**: `seguimiento/no-pagados.png`
- **Descripción**: Detalle de alquileres sin pagar
- **Elementos a capturar**:
  - Header con ícono de alerta
  - Contador de no pagados
  - Tarjetas con doble badge (estado + no pagado)
  - Información de contacto del cliente

#### 5.3 Sección Lavadoras Agendadas
**Archivo**: `seguimiento/agendadas.png`
- **Descripción**: Alquileres programados para entrega
- **Elementos a capturar**:
  - Header con ícono de reloj
  - Contador de agendadas
  - Tarjetas con badge azul
  - Horarios de entrega

#### 5.4 Sección Lavadoras Enviadas
**Archivo**: `seguimiento/enviadas.png`
- **Descripción**: Alquileres actualmente en servicio
- **Elementos a capturar**:
  - Header con ícono de camión
  - Contador de enviadas
  - Tarjetas con badge verde
  - Botón "Extender" (si aplica)

#### 5.5 Diálogo de Extensión
**Archivo**: `seguimiento/dialogo-extension.png`
- **Descripción**: Formulario para extender alquiler
- **Elementos a capturar**:
  - Datos actuales del alquiler
  - Selector de tipo de extensión
  - Nueva hora calculada
  - Costo adicional
  - Total actualizado

---

## 6. Módulo de Clientes

### Capturas Principales:

#### 6.1 Lista de Clientes
**Archivo**: `clientes/lista-clientes.png`
- **Descripción**: Vista completa de clientes registrados
- **Elementos a capturar**:
  - Campo de búsqueda
  - Contador de clientes
  - Tarjetas de clientes con información
  - Botones de editar y eliminar

#### 6.2 Búsqueda de Clientes
**Archivo**: `clientes/busqueda-activa.png`
- **Descripción**: Búsqueda en tiempo real funcionando
- **Elementos a capturar**:
  - Texto en campo de búsqueda
  - Resultados filtrados
  - Coincidencias resaltadas

#### 6.3 Formulario de Nuevo Cliente
**Archivo**: `clientes/formulario-nuevo.png`
- **Descripción**: Sheet de creación de cliente
- **Elementos a capturar**:
  - Campo de nombre (obligatorio)
  - Campo de teléfono (opcional)
  - Campo de dirección (opcional)
  - Botón "Guardar Cliente"

#### 6.4 Edición de Cliente
**Archivo**: `clientes/formulario-edicion.png`
- **Descripción**: Sheet con datos precargados
- **Elementos a capturar**:
  - Título "Editar Cliente"
  - Campos con datos existentes
  - Botón "Guardar Cambios"

#### 6.5 Confirmación de Eliminación
**Archivo**: `clientes/confirmacion-eliminar.png`
- **Descripción**: Diálogo de confirmación
- **Elementos a capturar**:
  - Mensaje de advertencia
  - Texto "Esta acción no se puede deshacer"
  - Botones Cancelar/Eliminar

---

## 7. Módulo de Configuración

### Capturas Principales:

#### 7.1 Vista General de Configuración
**Archivo**: `configuracion/vista-general.png`
- **Descripción**: Pantalla completa de configuración
- **Elementos a capturar**:
  - Sección de tasa de cambio
  - Sección de precios por litros
  - Última actualización
  - Botón "Ver Historial"

#### 7.2 Actualización de Tasa
**Archivo**: `configuracion/actualizar-tasa.png`
- **Descripción**: Formulario de tasa de cambio
- **Elementos a capturar**:
  - Campo de tasa actual
  - Botón "Guardar Tasa"
  - Última actualización
  - Ícono de dólar

#### 7.3 Configuración de Precios por Litros
**Archivo**: `configuracion/precios-litros.png`
- **Descripción**: Formulario de precios escalonados
- **Elementos a capturar**:
  - Lista de breakpoints (1, 2, 5, 12, 19, 24 litros)
  - Campo de precio para cada breakpoint
  - Botón "Guardar Precios"

#### 7.4 Historial de Tasas
**Archivo**: `configuracion/historial-tasas.png`
- **Descripción**: Página de historial de tasas de cambio
- **Elementos a capturar**:
  - Tasa actual destacada
  - Lista de tasas históricas
  - Fechas de cada tasa
  - Variación porcentual
  - Íconos de tendencia (subida/bajada)

#### 7.5 Confirmación de Actualización
**Archivo**: `configuracion/confirmacion-guardado.png`
- **Descripción**: Toast de confirmación
- **Elementos a capturar**:
  - Mensaje "Tasa actualizada" o "Precios actualizados"
  - Ícono de éxito

---

## 8. Navegación y UI General

### Capturas Adicionales:

#### 8.1 Navegación Inferior
**Archivo**: `general/navegacion-inferior.png`
- **Descripción**: Barra de navegación principal
- **Elementos a capturar**:
  - Íconos de todas las secciones
  - Ícono activo resaltado
  - Etiquetas de cada sección

#### 8.2 Header de Página
**Archivo**: `general/header-ejemplo.png`
- **Descripción**: Header típico de una página
- **Elementos a capturar**:
  - Título de la página
  - Subtítulo (si existe)
  - Botón de retroceso (si existe)
  - Botones de acción (si existen)

#### 8.3 Botón FAB
**Archivo**: `general/boton-fab.png`
- **Descripción**: Botón flotante de acción
- **Elementos a capturar**:
  - Botón circular con ícono +
  - Posición en esquina inferior derecha
  - Sombra del botón

#### 8.4 Toast de Error
**Archivo**: `general/toast-error.png`
- **Descripción**: Notificación de error
- **Elementos a capturar**:
  - Mensaje de error
  - Ícono de error
  - Estilo de notificación

#### 8.5 Toast de Éxito
**Archivo**: `general/toast-exito.png`
- **Descripción**: Notificación de éxito
- **Elementos a capturar**:
  - Mensaje de confirmación
  - Ícono de éxito
  - Estilo de notificación

#### 8.6 Diálogo de Confirmación Genérico
**Archivo**: `general/dialogo-confirmacion.png`
- **Descripción**: Diálogo típico de confirmación
- **Elementos a capturar**:
  - Título del diálogo
  - Mensaje descriptivo
  - Botones Cancelar/Confirmar

---

## 9. Estados Especiales

### Capturas de Estados:

#### 9.1 Estado Vacío (Empty State)
**Archivo**: `estados/estado-vacio.png`
- **Descripción**: Vista cuando no hay datos
- **Elementos a capturar**:
  - Ícono ilustrativo
  - Mensaje descriptivo
  - Botón de acción (si aplica)

#### 9.2 Estado de Carga
**Archivo**: `estados/estado-carga.png`
- **Descripción**: Indicador de carga
- **Elementos a capturar**:
  - Spinner o skeleton
  - Mensaje "Cargando..." (si existe)

#### 9.3 Estado de Error
**Archivo**: `estados/estado-error.png`
- **Descripción**: Vista cuando hay un error
- **Elementos a capturar**:
  - Ícono de error
  - Mensaje de error
  - Botón "Reintentar" (si existe)

---

## 10. Responsive y Temas

### Capturas Adicionales:

#### 10.1 Vista Mobile
**Archivo**: `responsive/mobile-portrait.png`
- **Descripción**: Vista en móvil vertical
- **Elementos a capturar**:
  - Layout adaptado a pantalla pequeña
  - Navegación inferior visible

#### 10.2 Tema Claro
**Archivo**: `temas/tema-claro.png`
- **Descripción**: Interfaz con tema claro
- **Elementos a capturar**:
  - Colores claros
  - Contraste adecuado
  - Legibilidad

#### 10.3 Tema Oscuro (si existe)
**Archivo**: `temas/tema-oscuro.png`
- **Descripción**: Interfaz con tema oscuro
- **Elementos a capturar**:
  - Colores oscuros
  - Contraste adecuado
  - Legibilidad

---

## Recomendaciones para Tomar Capturas

### Preparación:
1. **Datos de prueba**: Usar datos realistas pero ficticios
2. **Nombres**: Usar nombres genéricos (Juan Pérez, María González)
3. **Teléfonos**: Usar números ficticios (0414-1234567)
4. **Montos**: Usar cantidades variadas pero realistas

### Técnicas:
1. **Resolución**: Capturar en resolución nativa del dispositivo
2. **Formato**: Preferir PNG para mejor calidad
3. **Recorte**: Eliminar elementos innecesarios (barra de notificaciones del sistema)
4. **Anotaciones**: Agregar flechas o resaltados si es necesario explicar algo

### Organización:
1. **Nombres descriptivos**: Usar nombres claros y consistentes
2. **Numeración**: Mantener orden lógico (1.1, 1.2, etc.)
3. **Carpetas**: Organizar por módulo
4. **Índice**: Mantener este documento actualizado

### Estados a Capturar:
1. **Estado inicial**: Vista al entrar por primera vez
2. **Estado con datos**: Vista con información cargada
3. **Estado de interacción**: Durante una acción del usuario
4. **Estado final**: Después de completar una acción
5. **Estados de error**: Cuando algo falla

---

## Checklist de Capturas

### Por Módulo:
- [ ] Dashboard (3 capturas mínimo)
- [ ] Ventas (7 capturas mínimo)
- [ ] Alquileres (7 capturas mínimo)
- [ ] Agua Prepagada (5 capturas mínimo)
- [ ] Seguimiento (5 capturas mínimo)
- [ ] Clientes (5 capturas mínimo)
- [ ] Configuración (5 capturas mínimo)
- [ ] Navegación General (6 capturas mínimo)
- [ ] Estados Especiales (3 capturas mínimo)
- [ ] Responsive/Temas (3 capturas mínimo)

### Total Estimado: 49 capturas mínimas

---

## Integración en Documentación

### Cómo Insertar en Markdown:

```markdown
![Descripción de la imagen](./screenshots/modulo/nombre-archivo.png)
```

### Ejemplo:
```markdown
## Vista General del Dashboard

![Dashboard principal mostrando estadísticas del día](./screenshots/dashboard/vista-general.png)

La pantalla principal muestra las métricas más importantes del negocio...
```

### Con Tamaño Específico (HTML):
```html
<img src="./screenshots/dashboard/vista-general.png" alt="Dashboard" width="400">
```

---

## Mantenimiento

### Actualización de Capturas:
- Revisar capturas cada vez que cambie la UI
- Actualizar si hay cambios significativos en diseño
- Mantener consistencia en estilo y formato
- Documentar cambios en este archivo

### Versionado:
- Considerar mantener capturas de versiones anteriores
- Usar carpetas con número de versión si es necesario
- Ejemplo: `screenshots/v1.0/`, `screenshots/v2.0/`
