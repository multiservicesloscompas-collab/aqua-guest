# Especificaciones Técnicas

## Stack

- Frontend: React 19 + TypeScript
- Base de datos / BaaS: Supabase (PostgreSQL)
- Herramientas: Vite, TailwindCSS, Zustand
- Monorepositorio: Nx
- Sistema Operativo: Se recomienda usar CMD en Windows en lugar de PowerShell

## Estructura del proyecto

```text
apps/
└── web-app/          # Aplicación principal (React con Vite)
libs/
└── models/           # Librería compartida (proyectada para entidades de dominio)
```

## Seguimientos

- Seguir el principio de responsabilidad única (SRP).
- Mantener la lógica de negocio en servicios o hooks fuera de los componentes UI.
- Usar tipos estrictos de TypeScript.
- Implementar validaciones en el frontend y apoyarse en las políticas RLS de Supabase.

## Base de Datos (Supabase)

- **Tablas**: Nombres en inglés y plural (`sales`, `customers`, `washer_rentals`).
- **Columnas**: Snake_case en la base de datos (`customer_id`, `total_usd`).
- **Tipado**: Asegurar que las interfaces de TypeScript coincidan con el esquema de la base de datos.
