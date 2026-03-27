import {
  Calendar,
  Truck,
  Clock,
  CheckCircle2,
  CircleDollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { RentalStatus } from '@/types';

interface StatusOption {
  value: RentalStatus;
  label: string;
}

interface EditRentalStatusPaymentCardProps {
  statusOptions: StatusOption[];
  status: RentalStatus;
  onChangeStatus: (value: RentalStatus) => void;
  statusEditable?: boolean;
  paymentStatus: 'paid' | 'pending';
  onChangePaymentStatus: (value: 'paid' | 'pending') => void;
  isPaid: boolean;
  paidDateLabel: string;
  datePaid: string;
  onChangeDatePaid: (value: string) => void;
  isCalendarOpen: boolean;
  onCalendarOpenChange: (open: boolean) => void;
}

const getStatusDetails = (val: string) => {
  switch (val) {
    case 'agendado':
      return { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' };
    case 'enviado':
      return { icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10' };
    case 'finalizado':
      return {
        icon: CheckCircle2,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
      };
    default:
      return { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' };
  }
};

const STATUS_LABELS: Record<RentalStatus, string> = {
  agendado: 'Agendado',
  enviado: 'Enviado',
  finalizado: 'Finalizado',
};

export function EditRentalStatusPaymentCard({
  statusOptions,
  status,
  onChangeStatus,
  statusEditable = true,
  paymentStatus,
  onChangePaymentStatus,
  isPaid,
  paidDateLabel,
  datePaid,
  onChangeDatePaid,
  isCalendarOpen,
  onCalendarOpenChange,
}: EditRentalStatusPaymentCardProps) {
  const statusDetails = getStatusDetails(status);
  const StatusIcon = statusDetails.icon;
  const statusLabel =
    statusOptions.find((option) => option.value === status)?.label ??
    STATUS_LABELS[status];

  return (
    <div className="bg-card rounded-3xl border border-border/50 p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2.5">
          <Label className="ml-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Estado de Entrega
          </Label>
          {statusEditable ? (
            <Select value={status} onValueChange={onChangeStatus}>
              <SelectTrigger className="h-14 rounded-2xl border-transparent bg-accent/30 shadow-none transition-colors hover:border-border/50 hover:bg-accent focus:ring-primary/20 [&>span]:flex [&>span]:w-full [&>span]:items-center">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {statusOptions.map((option) => {
                  const details = getStatusDetails(option.value);
                  const Icon = details.icon;
                  return (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="rounded-xl my-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 py-0.5">
                        <div
                          className={cn(
                            'p-1.5 rounded-lg flex items-center justify-center',
                            details.bg,
                            details.color
                          )}
                        >
                          <Icon className="w-4 h-4" strokeWidth={2.5} />
                        </div>
                        <span className="font-medium text-[15px]">
                          {option.label}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          ) : (
            <div
              className="min-h-14 rounded-2xl border border-border/40 bg-accent/30 px-3.5 py-2.5"
              data-testid="rental-status-static"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'p-1.5 rounded-lg flex items-center justify-center',
                    statusDetails.bg,
                    statusDetails.color
                  )}
                >
                  <StatusIcon className="w-4 h-4" strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold leading-tight">
                    {statusLabel}
                  </p>
                  <p className="text-[11px] leading-tight text-muted-foreground">
                    Estado inicial del alquiler
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          <Label className="ml-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Estatus de Pago
          </Label>
          <Select value={paymentStatus} onValueChange={onChangePaymentStatus}>
            <SelectTrigger className="h-14 rounded-2xl border-transparent bg-accent/30 shadow-none transition-colors hover:border-border/50 hover:bg-accent focus:ring-primary/20 [&>span]:flex [&>span]:w-full [&>span]:items-center">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem
                value="pending"
                className="rounded-xl my-1 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 py-0.5">
                  <div className="p-1.5 rounded-lg flex items-center justify-center bg-amber-500/10 text-amber-500">
                    <CircleDollarSign className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  <span className="font-medium text-[15px]">Pendiente</span>
                </div>
              </SelectItem>
              <SelectItem
                value="paid"
                className="rounded-xl my-1 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 py-0.5">
                  <div className="p-1.5 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  <span className="font-medium text-[15px]">Pagado</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isPaid ? (
        <div className="space-y-3 pt-5 border-t border-border/30 animate-in fade-in slide-in-from-top-2 duration-300">
          <Label className="text-[11px] font-bold text-muted-foreground px-1 uppercase tracking-widest text-center block w-full">
            Fecha de Pago Registrada
          </Label>
          <Popover open={isCalendarOpen} onOpenChange={onCalendarOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full h-12 justify-center rounded-2xl border-transparent bg-accent/30 text-center text-[15px] font-medium shadow-none transition-colors hover:border-border/50 hover:bg-accent active:scale-[0.98]',
                  !datePaid && 'text-muted-foreground'
                )}
              >
                <span className="flex items-center justify-center gap-2.5">
                  <Calendar
                    className="h-4 w-4 text-emerald-500"
                    strokeWidth={2.5}
                  />
                  {paidDateLabel}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-border/50"
              align="center"
              sideOffset={12}
            >
              <CalendarPicker
                mode="single"
                selected={
                  datePaid ? new Date(datePaid + 'T00:00:00') : undefined
                }
                onSelect={(date) => {
                  if (date) {
                    const iso = date.toISOString().slice(0, 10);
                    onChangeDatePaid(iso);
                    onCalendarOpenChange(false);
                  }
                }}
                initialFocus
                className="p-3"
              />
            </PopoverContent>
          </Popover>
        </div>
      ) : null}
    </div>
  );
}
