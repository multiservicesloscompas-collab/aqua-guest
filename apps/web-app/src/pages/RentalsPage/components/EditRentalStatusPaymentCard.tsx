import { Calendar } from 'lucide-react';
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
  paymentStatus: 'paid' | 'pending';
  onChangePaymentStatus: (value: 'paid' | 'pending') => void;
  isPaid: boolean;
  paidDateLabel: string;
  datePaid: string;
  onChangeDatePaid: (value: string) => void;
  isCalendarOpen: boolean;
  onCalendarOpenChange: (open: boolean) => void;
}

export function EditRentalStatusPaymentCard({
  statusOptions,
  status,
  onChangeStatus,
  paymentStatus,
  onChangePaymentStatus,
  isPaid,
  paidDateLabel,
  datePaid,
  onChangeDatePaid,
  isCalendarOpen,
  onCalendarOpenChange,
}: EditRentalStatusPaymentCardProps) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
            Estado de Entrega
          </Label>
          <Select value={status} onValueChange={onChangeStatus}>
            <SelectTrigger className="h-12 bg-background border-border/50 rounded-xl focus:ring-primary/20 transition-all">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
            Estatus de Pago
          </Label>
          <Select value={paymentStatus} onValueChange={onChangePaymentStatus}>
            <SelectTrigger className="h-12 bg-background border-border/50 rounded-xl focus:ring-primary/20 transition-all">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paid">Pagado</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isPaid ? (
        <div className="space-y-2 pt-3 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
          <Label className="text-[10px] font-bold text-muted-foreground px-1 uppercase tracking-widest">
            Fecha de Pago Registrada
          </Label>
          <Popover open={isCalendarOpen} onOpenChange={onCalendarOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full h-12 justify-between text-left font-medium bg-background border-border/50 rounded-xl px-4 hover:bg-background active:scale-[0.98] transition-all',
                  !datePaid && 'text-muted-foreground'
                )}
              >
                <span className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  {paidDateLabel}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 rounded-2xl shadow-2xl border-border/50"
              align="center"
              sideOffset={8}
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
              />
            </PopoverContent>
          </Popover>
        </div>
      ) : null}
    </div>
  );
}
