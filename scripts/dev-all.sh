#!/usr/bin/env bash

# ==============================================================================
# Script: dev-all.sh
# Propósito: Orquestar el entorno local (Docker Compose cleanup, Supabase y Nx)
# ==============================================================================

set -uo pipefail

NX_PID=""

cleanup() {
  # Desactivar traps para evitar llamadas recursivas durante la limpieza
  trap - SIGINT SIGTERM EXIT
  
  echo ""
  echo "🛑 [AquaGuest] Deteniendo servicios..."
  
  # 1. Detener el proceso del frontend (Nx web-app)
  if [ -n "$NX_PID" ] && kill -0 "$NX_PID" 2>/dev/null; then
    echo "⏹️  Deteniendo web-app (PID: $NX_PID)..."
    kill -TERM "$NX_PID" 2>/dev/null || true
    wait "$NX_PID" 2>/dev/null || true
  fi

  # 2. Detener Supabase local
  echo "⏹️  Deteniendo Supabase local..."
  npx supabase stop 2>/dev/null || true

  echo "✨ Todos los servicios se han detenido correctamente."
  exit 0
}

# Capturar señales de interrupción (Ctrl+C) y terminación
trap cleanup SIGINT SIGTERM

# 1. Verificar si Docker daemon está corriendo
echo "🐳 [1/5] Verificando estado de Docker..."
if ! docker info >/dev/null 2>&1; then
  echo "❌ Error: Docker no está en ejecución. Por favor inicia Docker Desktop y vuelve a intentar."
  exit 1
fi

# 2. Bajar servicios de Docker Compose activos para liberar memoria
echo "🧹 [2/5] Verificando y liberando contenedores de Docker Compose activos..."
COMPOSE_PROJECTS=$(docker compose ls -q 2>/dev/null || true)
if [ -n "$COMPOSE_PROJECTS" ]; then
  for proj in $COMPOSE_PROJECTS; do
    echo "  -> Deteniendo proyecto Docker Compose: $proj"
    docker compose -p "$proj" down 2>/dev/null || true
  done
else
  echo "  -> No hay proyectos de Docker Compose activos."
fi

# 3. Levantar Supabase local
echo "⚡ [3/5] Iniciando Supabase local..."
npx supabase start

# 4. Esperar y verificar que Supabase esté activo
echo "🔍 [4/5] Verificando que Supabase esté listo..."
if ! npx supabase status >/dev/null 2>&1; then
  echo "❌ Error: Supabase no respondió correctamente tras el inicio."
  cleanup
fi
echo "✅ Supabase local está activo y respondiendo."

# 5. Levantar la aplicación web con Nx
echo "🚀 [5/5] Levantando web-app (Nx)..."
npx nx serve web-app &
NX_PID=$!

# Esperar a que el proceso termine o el usuario presione Ctrl+C
wait "$NX_PID"
