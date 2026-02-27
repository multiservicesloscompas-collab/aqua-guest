# Módulo de Clientes

## Descripción General

El módulo de clientes permite gestionar una base de datos de clientes frecuentes del negocio. Facilita el registro rápido de información de contacto y ubicación, permitiendo autocompletar datos en ventas y alquileres.

## Funcionalidades Principales

### 1. Registro de Clientes

Permite crear nuevos clientes con información básica de contacto.

#### Datos del Cliente:
- **Nombre** (obligatorio): Nombre completo del cliente
- **Teléfono** (opcional): Número de contacto
- **Dirección** (opcional): Ubicación para entregas

#### Características:
- Formulario simple y rápido
- Validación de nombre obligatorio
- Teléfono y dirección opcionales para flexibilidad
- Guardado automático en Supabase
- Sincronización con estado local

### 2. Búsqueda de Clientes

Sistema de búsqueda en tiempo real para localizar clientes rápidamente.

#### Características de Búsqueda:
- **Búsqueda en tiempo real**: Filtra mientras se escribe
- **Búsqueda múltiple**: Busca en nombre, teléfono y dirección simultáneamente
- **Case insensitive**: No distingue mayúsculas/minúsculas
- **Resultados instantáneos**: Sin necesidad de presionar botón

#### Campos de Búsqueda:
- Nombre del cliente
- Número de teléfono
- Dirección completa o parcial

### 3. Visualización de Clientes

Lista completa de clientes con información organizada y accesible.

#### Información Mostrada:
- **Nombre**: Con ícono de usuario
- **Teléfono**: Con ícono de teléfono (si existe)
- **Dirección**: Con ícono de ubicación (si existe)
- **Contador**: Total de clientes registrados

#### Diseño:
- Tarjetas individuales por cliente
- Información jerárquica (nombre destacado)
- Íconos para identificación rápida
- Botones de acción visibles

### 4. Edición de Clientes

Permite actualizar información de clientes existentes.

#### Proceso:
1. Usuario presiona ícono de editar (lápiz)
2. Se abre sheet con datos precargados
3. Usuario modifica campos deseados
4. Sistema valida nombre obligatorio
5. Usuario presiona "Guardar Cambios"
6. Sistema actualiza en Supabase y estado local
7. Lista se actualiza automáticamente

#### Validaciones:
- Nombre no puede quedar vacío
- Teléfono y dirección pueden quedar vacíos
- Cambios se sincronizan inmediatamente

### 5. Eliminación de Clientes

Permite eliminar clientes de la base de datos.

#### Proceso:
1. Usuario presiona ícono de eliminar (basura)
2. Sistema muestra diálogo de confirmación
3. Usuario confirma eliminación
4. Sistema elimina de Supabase y estado local
5. Cliente desaparece de la lista

#### Consideraciones:
- Acción irreversible (requiere confirmación)
- No afecta alquileres o ventas previas
- Cliente puede ser recreado si es necesario

### 6. Integración con Otros Módulos

El módulo de clientes se integra con otros módulos para facilitar el ingreso de datos.

#### Alquileres:
- **Autocompletado**: Al crear alquiler, se puede buscar y seleccionar cliente
- **Datos automáticos**: Nombre, teléfono y dirección se llenan automáticamente
- **Creación rápida**: Opción de crear cliente nuevo desde formulario de alquiler
- **Vinculación**: Alquiler queda vinculado al cliente por `customerId`

#### Búsqueda Inteligente:
- Componente `CustomerSearch` con autocompletado
- Resalta coincidencias de búsqueda
- Permite crear cliente nuevo sin salir del formulario
- Muestra información completa en resultados

## Estructura de Datos

### Customer
```typescript
interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
}
```

## Flujo de Uso

### Agregar Cliente Nuevo:
1. Usuario presiona botón FAB (+) en esquina inferior derecha
2. Se abre sheet desde abajo con formulario
3. Usuario ingresa nombre (obligatorio)
4. Usuario ingresa teléfono (opcional)
5. Usuario ingresa dirección (opcional)
6. Usuario presiona "Guardar Cliente"
7. Sistema valida que nombre no esté vacío
8. Sistema guarda en Supabase y estado local
9. Sistema muestra confirmación
10. Sheet se cierra y cliente aparece en lista

### Buscar Cliente:
1. Usuario escribe en campo de búsqueda
2. Sistema filtra lista en tiempo real
3. Resultados se actualizan instantáneamente
4. Usuario puede ver clientes que coinciden con búsqueda
5. Si no hay resultados, se muestra mensaje "No se encontraron clientes"

### Editar Cliente:
1. Usuario localiza cliente en lista
2. Usuario presiona ícono de editar (lápiz)
3. Sheet se abre con datos precargados
4. Usuario modifica campos deseados
5. Usuario presiona "Guardar Cambios"
6. Sistema valida y guarda cambios
7. Lista se actualiza con nueva información

### Eliminar Cliente:
1. Usuario localiza cliente en lista
2. Usuario presiona ícono de eliminar (basura)
3. Sistema muestra diálogo: "¿Eliminar cliente?"
4. Usuario presiona "Eliminar" para confirmar
5. Sistema elimina de base de datos
6. Cliente desaparece de la lista

### Usar Cliente en Alquiler:
1. Usuario crea nuevo alquiler
2. En campo de cliente, presiona búsqueda
3. Escribe nombre o teléfono del cliente
4. Sistema muestra coincidencias con resaltado
5. Usuario selecciona cliente
6. Nombre, teléfono y dirección se llenan automáticamente
7. Usuario continúa con resto del formulario

## Integración con Otros Módulos

### Alquileres (WasherRental):
- Campo `customerId` vincula alquiler con cliente
- Datos del cliente se copian al alquiler para histórico
- Si se actualiza cliente, alquileres previos mantienen datos originales
- Permite análisis de clientes frecuentes

### Agua Prepagada:
- Actualmente no está vinculado (solo guarda nombre)
- Potencial mejora: vincular prepagados con clientes
- Permitiría historial de compras prepagadas por cliente

### Reportes:
- Análisis de clientes frecuentes
- Historial de alquileres por cliente
- Estadísticas de consumo por cliente
- Identificación de mejores clientes

## Consideraciones Técnicas

### Persistencia:
- Estado local: Zustand con persist
- Base de datos: Supabase (tabla `customers`)
- Fallback: Si falla Supabase, se guarda solo localmente

### Validaciones:
- Nombre es obligatorio (no puede estar vacío)
- Teléfono es opcional (puede ser string vacío)
- Dirección es opcional (puede ser string vacío)
- Espacios en blanco se eliminan con `trim()`

### Búsqueda:
- Usa `toLowerCase()` para búsqueda case-insensitive
- Busca en todos los campos simultáneamente
- Usa `includes()` para coincidencias parciales
- Optimizada con `useMemo` para rendimiento

### Sincronización:
- Operaciones CRUD sincronizan con Supabase
- Si falla sincronización, se mantiene cambio local
- Se muestra mensaje de error al usuario
- Estado local siempre se actualiza para UX fluida

### Componente CustomerSearch:
- Usa Radix UI Command para autocompletado
- Resalta coincidencias con `<mark>` tag
- Permite crear cliente nuevo sin cerrar diálogo
- Optimizado con `useMemo` para filtrado

## Casos de Uso Comunes

### Caso 1: Cliente Frecuente
Un cliente alquila lavadoras regularmente:
1. Primera vez: Se crea cliente con todos sus datos
2. Siguientes veces: Se busca y selecciona de la lista
3. Datos se llenan automáticamente
4. Ahorro de tiempo en cada alquiler
5. Historial de alquileres vinculado al cliente

### Caso 2: Actualizar Teléfono
Cliente cambió de número:
1. Se busca cliente en lista
2. Se presiona editar
3. Se actualiza teléfono
4. Futuros alquileres usarán nuevo teléfono
5. Alquileres previos mantienen teléfono antiguo

### Caso 3: Cliente Nuevo en Alquiler
Cliente nuevo quiere alquilar:
1. Se crea alquiler
2. En búsqueda de cliente, no se encuentra
3. Se presiona "Crear Nuevo Cliente"
4. Se llena formulario de cliente
5. Cliente se guarda
6. Datos se llenan en alquiler automáticamente
7. Todo sin salir del flujo de alquiler

### Caso 4: Buscar por Dirección
Necesitan entregar en cierta zona:
1. Se busca por nombre de calle o sector
2. Sistema muestra todos los clientes de esa zona
3. Útil para planificar rutas de entrega
4. Identificar clientes cercanos

## Mejoras Futuras

- Agregar campo de email
- Agregar notas o comentarios sobre el cliente
- Historial de alquileres directamente en la tarjeta
- Estadísticas por cliente (total gastado, frecuencia, etc.)
- Clientes favoritos o VIP
- Foto o avatar del cliente
- Múltiples números de teléfono
- Dirección con geolocalización
- Exportar lista de clientes a Excel
- Importar clientes desde CSV
- Fusionar clientes duplicados
- Marcar clientes inactivos
- Sistema de puntos o fidelidad
- Recordatorios de cumpleaños
- Integración con WhatsApp para contacto directo
