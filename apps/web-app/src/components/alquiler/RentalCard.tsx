import { useState } from 'react';
import {
  WasherRental,
  RentalShiftConfig,
  RentalStatusLabels,
  RentalStatus,
  PaymentMethodLabels,
} from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  WashingMachine,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  Smartphone,
  Banknote,
  CreditCard,
  Plus,
  CalendarDays,
  Copy,
  ChevronDown,
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { canExtendRental } from '@/utils/rentalExtensions';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RentalCardProps {
  rental: WasherRental;
  onStatusChange: (id: string, status: RentalStatus) => void;
  onPaymentToggle: (id: string) => void;
  onEdit?: (rental: WasherRental) => void;
  onDelete?: (id: string) => void;
  onExtend?: (rental: WasherRental) => void;
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

const paymentIcons = {
  pago_movil: Smartphone,
  efectivo: Banknote,
  punto_venta: CreditCard,
};

export function RentalCard({
  rental,
  onStatusChange,
  onPaymentToggle,
  onEdit,
  onDelete,
  onExtend,
  onClick,
}: RentalCardProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<RentalStatus | null>(null);

  const { washingMachines } = useAppStore();
  const machine = washingMachines.find((m) => m.id === rental.machineId);
  const shiftConfig = RentalShiftConfig[rental.shift];

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

  const handleExtendClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExtend?.(rental);
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
          'p-4 space-y-3 transition-all active:scale-[0.98] group relative',
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
              <div className="flex items-center gap-1.5">
                <p className="font-semibold">
                  {machine?.name || `Lavadora #${rental.machineId}`}
                </p>
                <button
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    const textToCopy = rental.id;

                    const handleCopy = async () => {
                      try {
                        if (navigator.clipboard && window.isSecureContext) {
                          await navigator.clipboard.writeText(textToCopy);
                        } else {
                          // Fallback para contextos no seguros (HTTP)
                          const textArea = document.createElement("textarea");
                          textArea.value = textToCopy;
                          textArea.style.position = "fixed";
                          textArea.style.left = "-9999px";
                          textArea.style.top = "0";
                          document.body.appendChild(textArea);
                          textArea.focus();
                          textArea.select();
                          document.execCommand('copy');
                          document.body.removeChild(textArea);
                        }

                        toast.success('ID copiado', {
                          description: textToCopy,
                          duration: 2000,
                        });
                      } catch (err) {
                        console.error('Error al copiar:', err);
                        toast.error('No se pudo copiar el ID');
                      }
                    };

                    handleCopy();
                  }}
                  className="p-1 rounded-md text-muted-foreground/30 hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100"
                  title="Copiar ID de registro"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                {machine ? `${machine.kg}kg ${machine.brand}` : ''} ·{' '}
                {shiftConfig.label}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium transition-all hover:opacity-80',
                    statusColors[rental.status]
                  )}
                >
                  <span>{statusIcons[rental.status]} {RentalStatusLabels[rental.status]}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(RentalStatusLabels) as RentalStatus[]).map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={(e) => handleStatusClick(e as unknown as React.MouseEvent, status)}
                    className={cn(
                      'text-xs flex items-center gap-2',
                      rental.status === status && 'bg-accent font-medium'
                    )}
                    disabled={rental.status === status}
                  >
                    <span>{statusIcons[status]}</span>
                    {RentalStatusLabels[status]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
          {rental.paymentMethod && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {(() => {
                const PaymentIcon =
                  paymentIcons[rental.paymentMethod] || Banknote;
                return <PaymentIcon className="w-4 h-4" />;
              })()}
              <span>{PaymentMethodLabels[rental.paymentMethod]}</span>
            </div>
          )}
          {rental.isPaid && rental.datePaid && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="w-4 h-4" />
              <span>
                Pagado el: {format(parse(rental.datePaid, 'yyyy-MM-dd', new Date()), "EEE d 'de' MMM", { locale: es })}
              </span>
            </div>
          )}
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
              {(rental.totalUsd ?? 0).toFixed(2)}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {canExtendRental(rental) && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleExtendClick}
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                title="Extender tiempo"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
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
