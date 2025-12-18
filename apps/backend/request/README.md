# REST Client - Pruebas de API

Esta carpeta contiene archivos `.http` para probar los endpoints del backend usando la extensión **REST Client** de VS Code.

## 📋 Requisitos

1. Instalar la extensión [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) en VS Code
2. Asegurarse de que el backend esté corriendo en `http://localhost:3100`

## 📁 Archivos disponibles

- **`clients.http`** - Endpoints de clientes (CRUD completo)
- **`sales.http`** - Endpoints de ventas (CRUD completo)
- **`rentals.http`** - Endpoints de alquileres (CRUD completo)
- **`expenses.http`** - Endpoints de gastos (CRUD completo + gastos recurrentes)
- **`rates.http`** - Endpoints de tasas de cambio (CRUD completo)
- **`migration.http`** - Endpoint de migración de datos desde LocalStorage

## 🚀 Cómo usar

1. Abre cualquier archivo `.http`
2. Haz clic en "Send Request" que aparece sobre cada petición HTTP
3. Los resultados aparecerán en un panel a la derecha

## 💡 Tips

- Las variables están definidas al inicio de cada archivo (`@baseUrl`, `@contentType`)
- Puedes modificar los datos de ejemplo según tus necesidades
- Los IDs de ejemplo pueden necesitar ajustarse según los datos en tu base de datos
- Para crear registros, usa primero los endpoints POST
- Para actualizar o eliminar, asegúrate de que el ID exista en la base de datos

## 📝 Orden recomendado de pruebas

1. **Rates** - Crear tasas de cambio primero
2. **Clients** - Crear clientes
3. **Sales** - Crear ventas (requiere tasas de cambio)
4. **Rentals** - Crear alquileres (puede requerir clientes)
5. **Expenses** - Crear gastos (requiere tasas de cambio)
6. **Migration** - Importar datos masivos (opcional)

## ⚙️ Configuración del servidor

El servidor debe estar corriendo en:
- **URL**: `http://localhost:3100`
- **Puerto**: `3100`
- **CORS**: Habilitado para `http://localhost:5173`

Para iniciar el backend:
```bash
cd backend
npm run start:dev
```
