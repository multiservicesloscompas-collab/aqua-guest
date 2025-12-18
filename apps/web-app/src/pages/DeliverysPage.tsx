import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Truck,
  CalendarIcon,
  MapPin,
  Clock,
  User,
  Phone,
  WashingMachine,
} from 'lucide-react';
import { RentalShiftConfig, RentalStatusLabels } from '@/types';
import { cn } from '@/lib/utils';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';

type TimeFilter = 'dia' | 'semana' | 'mes';

const TimeFilterLabels: Record<TimeFilter, string> = {
  dia: 'Día específico',
  semana: 'Esta semana',
  mes: 'Este mes',
};

export function DeliverysPage() {
  const { rentals, washingMachines } = useAppStore();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('dia');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const filteredRentals = useMemo(() => {
    const now = new Date();

    return rentals
      .filter((rental) => {
        // Only include rentals that have delivery service (deliveryFee > 0)
        if (rental.deliveryFee <= 0) return false;

        const rentalDate = parseISO(rental.date);

        switch (timeFilter) {
          case 'dia':
            return (
              format(rentalDate, 'yyyy-MM-dd') ===
              format(selectedDate, 'yyyy-MM-dd')
            );
          case 'semana':
            const weekStart = startOfWeek(now, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
            return isWithinInterval(rentalDate, {
              start: weekStart,
              end: weekEnd,
            });
          case 'mes':
            const monthStart = startOfMonth(now);
            const monthEnd = endOfMonth(now);
            return isWithinInterval(rentalDate, {
              start: monthStart,
              end: monthEnd,
            });
          default:
            return true;
        }
      })
      .sort((a, b) => {
        // Sort by date descending, then by delivery time
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.deliveryTime.localeCompare(a.deliveryTime);
      });
  }, [rentals, timeFilter, selectedDate]);

  const getMachineName = (machineId: string) => {
    const machine = washingMachines.find((m) => m.id === machineId);
    return machine ? `${machine.name} (${machine.kg}kg)` : 'Desconocida';
  };

  const stats = useMemo(() => {
    const total = filteredRentals.length;
    const completed = filteredRentals.filter(
      (r) => r.status === 'finalizado'
    ).length;
    const inProgress = filteredRentals.filter(
      (r) => r.status === 'enviado'
    ).length;
    const scheduled = filteredRentals.filter(
      (r) => r.status === 'agendado'
    ).length;
    const totalRevenue = filteredRentals.reduce(
      (sum, r) => sum + r.deliveryFee,
      0
    );

    return { total, completed, inProgress, scheduled, totalRevenue };
  }, [filteredRentals]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'enviado':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'finalizado':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="pb-24">
      <Header
        title="Entregas"
        subtitle="Historial de entregas con servicio de delivery"
      />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Filtros */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              <span className="font-medium">Filtrar por período</span>
            </div>

            <div className="flex gap-2">
              <Select
                value={timeFilter}
                onValueChange={(v) => setTimeFilter(v as TimeFilter)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TimeFilterLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {timeFilter === 'dia' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      {format(selectedDate, 'dd/MM/yy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      locale={es}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total entregas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                ${stats.totalRevenue.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">Ingresos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {stats.scheduled}
              </p>
              <p className="text-sm text-muted-foreground">Agendados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {stats.inProgress}
              </p>
              <p className="text-sm text-muted-foreground">En curso</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de entregas */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">
            {timeFilter === 'dia' &&
              `Entregas del ${format(selectedDate, "d 'de' MMMM", {
                locale: es,
              })}`}
            {timeFilter === 'semana' && 'Entregas de esta semana'}
            {timeFilter === 'mes' && 'Entregas de este mes'}
          </h3>

          {filteredRentals.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Truck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  No hay entregas en este período
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRentals.map((rental) => (
              <Card key={rental.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <WashingMachine className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {getMachineName(rental.machineId)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {RentalShiftConfig[rental.shift].label}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        className={cn('border', getStatusColor(rental.status))}
                      >
                        {RentalStatusLabels[rental.status]}
                      </Badge>
                      <p className="text-sm font-semibold text-primary mt-1">
                        ${rental.deliveryFee.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Cliente */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{rental.customerName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{rental.customerPhone}</span>
                    </div>
                  </div>

                  {/* Dirección */}
                  <div className="flex items-start gap-1.5 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      {rental.customerAddress}
                    </span>
                  </div>

                  {/* Horarios */}
                  <div className="flex items-center gap-4 text-sm bg-accent/50 rounded-lg p-2">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>
                        Entrega: <strong>{rental.deliveryTime}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>
                        Recogida: <strong>{rental.pickupTime}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Fecha */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>
                      {format(parseISO(rental.date), "EEEE d 'de' MMMM, yyyy", {
                        locale: es,
                      })}
                    </span>
                    <Badge
                      variant={rental.isPaid ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {rental.isPaid ? 'Pagado' : 'No pagado'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
