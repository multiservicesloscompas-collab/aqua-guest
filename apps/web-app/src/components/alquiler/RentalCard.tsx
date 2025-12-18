import { useState } from 'react';
import {
  WasherRental,
  RentalShiftConfig,
  RentalStatusLabels,
  RentalStatus,
} from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  WashingMachine,
  MapPin,
  Clock,
  ChevronRight,
  DollarSign,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPickupInfo } from '@/utils/rentalSchedule';
import { useAppStore } from '@/store/useAppStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RentalCardProps {
  rental: WasherRental;
  onStatusChange: (id: string, status: RentalStatus) => void;
  onPaymentToggle: (id: string) => void;
  onEdit?: (rental: WasherRental) => void;
  onDelete?: (id: string) => void;
  onClick?: () => void;
}

const statusColors: Record<RentalStatus, string> = {
  agendado: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  enviado: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  finalizado: 'bg-green-500/10 text-green-600 border-green-500/20',
};

const statusIcons: Record<RentalStatus, string> = {
  agendado: '📅',
  enviado: '🚚',
  finalizado: '✅',
};

export function RentalCard({
  rental,
  onStatusChange,
  onPaymentToggle,
  onEdit,
  onDelete,
  onClick,
}: RentalCardProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<RentalStatus | null>(null);

  const { washingMachines } = useAppStore();
  const machine = washingMachines.find((m) => m.id === rental.machineId);
  const shiftConfig = RentalShiftConfig[rental.shift];

  const getNextStatus = (): RentalStatus | null => {
    if (rental.status === 'agendado') {
      // Only show 'enviado' if there's delivery service
      return rental.deliveryFee > 0 ? 'enviado' : 'finalizado';
    }
    if (rental.status === 'enviado') return 'finalizado';
    return null;
  };

  const nextStatus = getNextStatus();

  const handleStatusClick = (e: React.MouseEvent, status: RentalStatus) => {
    e.stopPropagation();
    setPendingStatus(status);
    setConfirmDialogOpen(true);
  };

  const handleConfirm = () => {
    if (pendingStatus) {
      onStatusChange(rental.id, pendingStatus);
    }
    setConfirmDialogOpen(false);
    setPendingStatus(null);
  };

  const handlePaymentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPaymentDialogOpen(true);
  };

  const handlePaymentConfirm = () => {
    onPaymentToggle(rental.id);
    setPaymentDialogOpen(false);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(rental);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    onDelete?.(rental.id);
    setDeleteDialogOpen(false);
  };

  const getStatusChangeMessage = () => {
    if (pendingStatus === 'enviado') {
      return '¿Confirmar que la lavadora ha sido enviada al cliente?';
    }
    if (pendingStatus === 'finalizado') {
      if (rental.status === 'agendado') {
        return '¿Confirmar que el cliente ha recogido la lavadora?';
      }
      return '¿Confirmar que el alquiler ha finalizado y la lavadora fue recogida?';
    }
    return '¿Confirmar el cambio de estado?';
  };

  return (
    <>
      <Card
        className={cn(
          'p-4 space-y-3 transition-all active:scale-[0.98]',
          rental.status === 'finalizado' && 'opacity-60'
        )}
        onClick={onClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <WashingMachine className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">
                {machine?.name || `Lavadora #${rental.machineId}`}
              </p>
              <p className="text-sm text-muted-foreground">
                {machine ? `${machine.kg}kg ${machine.brand}` : ''} ·{' '}
                {shiftConfig.label}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge className={cn('border', statusColors[rental.status])}>
              {statusIcons[rental.status]} {RentalStatusLabels[rental.status]}
            </Badge>
          </div>
        </div>

        {/* Cliente e Info */}
        <div className="space-y-2">
          <p className="font-medium">{rental.customerName}</p>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{rental.customerAddress}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>
              Entrega: {rental.deliveryTime} → Retiro: {rental.pickupTime}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePaymentClick}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-full text-sm font-medium transition-colors',
                rental.isPaid
                  ? 'bg-green-500/10 text-green-600'
                  : 'bg-red-500/10 text-red-600'
              )}
            >
              {rental.isPaid ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Circle className="w-4 h-4" />
              )}
              {rental.isPaid ? 'Pagado' : 'Pendiente'}
            </button>

            <div className="flex items-center gap-1 font-bold">
              <DollarSign className="w-4 h-4 text-primary" />
              {rental.totalUsd.toFixed(2)}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleEditClick}
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDeleteClick}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            {nextStatus && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => handleStatusClick(e, nextStatus)}
                className="h-8 text-xs ml-1"
              >
                {nextStatus === 'enviado'
                  ? 'Enviado'
                  : nextStatus === 'finalizado' && rental.status === 'agendado'
                  ? 'Recogida'
                  : 'Finalizar'}
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambio de estado</AlertDialogTitle>
            <AlertDialogDescription>
              {getStatusChangeMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Aceptar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambio de pago</AlertDialogTitle>
            <AlertDialogDescription>
              {rental.isPaid
                ? '¿Confirmar que el pago está pendiente?'
                : '¿Confirmar que el alquiler ha sido pagado?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePaymentConfirm}>
              Aceptar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar alquiler?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente
              este registro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
