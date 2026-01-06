# Especificaciones Técnicas

## Stack

- Backend: NestJS
- Frontend: React
- Base de datos: Sqlite
- Nx manejador de Monorepositorios
- Use CMD en windows en lugar de powershell

## Estructura del proyecto

| apps
|--| backend ( NestJS )
|--| web-app ( React con vite )
| libs
|--| models ( Entidades de dominio )

## Seguimientos

- Siempre que sea posible intenta trabajar código bajo una arquitectura hexagonal
- Usa los principios DDD
- Usa los principios SOLID

## ORM

- Usa TypeORM
- Los nombres de las tablas deben ser en inglés y en plural
- Los nombre de las entidades siempre en camel case
- Los nombres de las columnas camel case para el código y siempre en snake case para la base de datos
