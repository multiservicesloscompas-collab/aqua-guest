import { WifiOff } from 'lucide-react';

export function RentalShiftsOfflineNotice() {
  return (
    <div
      role="status"
      data-testid="shifts-offline-notice"
      className="flex items-start gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-300"
    >
      <WifiOff className="w-4 h-4 mt-0.5 shrink-0" />
      <p>
        Sin conexión. Los turnos solo se pueden crear, editar o eliminar con
        internet. Puedes seguir registrando alquileres con los turnos guardados.
      </p>
    </div>
  );
}
