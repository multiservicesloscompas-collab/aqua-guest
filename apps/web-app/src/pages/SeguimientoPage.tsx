import { useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  Clock,
  Truck,
  Phone,
  MapPin,
  DollarSign,
  WashingMachine,
  Plus,
} from 'lucide-react';
import { RentalShiftConfig, WasherRental } from '@/types';
import { cn } from '@/lib/utils';
import { ExtensionDialog } from '@/components/alquiler/ExtensionDialog';
import { canExtendRental } from '@/utils/rentalExtensions';

export function SeguimientoPage() {
  const { rentals, washingMachines, updateRental } = useAppStore();
  const [extensionDialogOpen, setExtensionDialogOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<WasherRental | null>(null);

  const { noPagados, agendados, enviados } = useMemo(() => {
    const noPagados = rentals.filter(
      (r) => !r.isPaid && r.status !== 'finalizado'
    );
    const agendados = rentals.filter((r) => r.status === 'agendado');
    const enviados = rentals.filter((r) => r.status === 'enviado');
    return { noPagados, agendados, enviados };
  }, [rentals]);

  const getMachineName = (machineId: string) => {
    const machine = washingMachines.find((m) => m.id === machineId);
    return machine ? `${machine.name} (${machine.kg}kg)` : 'Lavadora';
  };

  const handleExtendRental = (rental: WasherRental) => {
    setSelectedRental(rental);
    setExtensionDialogOpen(true);
  };

  const handleExtensionApplied = (updatedRental: WasherRental) => {
    updateRental(updatedRental.id, updatedRental);
  };

  const RentalCard = ({
    rental,
    showPaymentStatus = false,
  }: {
    rental: WasherRental;
    showPaymentStatus?: boolean;
  }) => (
    <Card className="bg-accent/30 border-border/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <WashingMachine className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">
              {getMachineName(rental.machineId)}
            </span>
          </div>
          <div className="flex gap-1">
            <Badge
              variant={rental.status === 'agendado' ? 'secondary' : 'default'}
              className="text-xs"
            >
              {rental.status === 'agendado' ? 'Agendado' : 'Enviado'}
            </Badge>
            {showPaymentStatus && (
              <Badge variant="destructive" className="text-xs">
                No pagado
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-foreground">
            <span className="font-medium">{rental.customerName}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-3.5 h-3.5" />
            <span>{rental.customerPhone}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span className="line-clamp-1">{rental.customerAddress}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {rental.deliveryTime} → {rental.pickupTime}
              </span>
            </div>
            <span>{RentalShiftConfig[rental.shift].label}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm font-semibold text-primary">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{(rental.totalUsd ?? 0).toFixed(2)}</span>
            </div>
            {canExtendRental(rental) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExtendRental(rental)}
                className="h-7 px-2 text-xs"
                title="Extender tiempo"
              >
                <Plus className="w-3 h-3 mr-1" />
                Extender
              </Button>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Fecha:{' '}
          {new Date(rental.date).toLocaleDateString('es-VE', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
          {rental.pickupDate !== rental.date && (
            <span className="ml-2">
              → Recogida:{' '}
              {new Date(rental.pickupDate).toLocaleDateString('es-VE', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const SectionHeader = ({
    icon: Icon,
    title,
    count,
    variant = 'default',
  }: {
    icon: typeof AlertCircle;
    title: string;
    count: number;
    variant?: 'default' | 'warning' | 'info';
  }) => (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl mb-3',
        variant === 'warning' && 'bg-destructive/10',
        variant === 'info' && 'bg-primary/10',
        variant === 'default' && 'bg-accent/50'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-lg',
          variant === 'warning' && 'bg-destructive text-destructive-foreground',
          variant === 'info' && 'bg-primary text-primary-foreground',
          variant === 'default' && 'bg-background'
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{count} registro(s)</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header title="Seguimiento" subtitle="Alquileres pendientes" />

      <main className="flex-1 px-4 py-4 space-y-6 max-w-lg mx-auto w-full">
        {/* No Pagados */}
        <section>
          <SectionHeader
            icon={AlertCircle}
            title="No Pagados"
            count={noPagados.length}
            variant="warning"
          />
          {noPagados.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay alquileres pendientes de pago
            </p>
          ) : (
            <div className="space-y-3">
              {noPagados.map((rental) => (
                <RentalCard key={rental.id} rental={rental} showPaymentStatus />
              ))}
            </div>
          )}
        </section>

        {/* Agendados */}
        <section>
          <SectionHeader
            icon={Clock}
            title="Lavadoras Agendadas"
            count={agendados.length}
            variant="info"
          />
          {agendados.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay lavadoras agendadas
            </p>
          ) : (
            <div className="space-y-3">
              {agendados.map((rental) => (
                <RentalCard key={rental.id} rental={rental} />
              ))}
            </div>
          )}
        </section>

        {/* Enviados */}
        <section>
          <SectionHeader
            icon={Truck}
            title="Lavadoras Enviadas"
            count={enviados.length}
          />
          {enviados.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay lavadoras en proceso
            </p>
          ) : (
            <div className="space-y-3">
              {enviados.map((rental) => (
                <RentalCard key={rental.id} rental={rental} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Extension Dialog */}
      <ExtensionDialog
        rental={selectedRental}
        open={extensionDialogOpen}
        onOpenChange={setExtensionDialogOpen}
        onExtensionApplied={handleExtensionApplied}
      />
    </div>
  );
}
