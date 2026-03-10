import { CalendarIcon, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
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

export type TimeFilter = 'dia' | 'semana' | 'mes';

const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
  dia: 'Día específico',
  semana: 'Esta semana',
  mes: 'Este mes',
};

interface DeliveryFiltersCardProps {
  timeFilter: TimeFilter;
  selectedDate: Date;
  isCalendarOpen: boolean;
  onTimeFilterChange: (value: TimeFilter) => void;
  onCalendarOpenChange: (open: boolean) => void;
  onDateChange: (date: Date) => void;
}

export function DeliveryFiltersCard({
  timeFilter,
  selectedDate,
  isCalendarOpen,
  onTimeFilterChange,
  onCalendarOpenChange,
  onDateChange,
}: DeliveryFiltersCardProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary" />
          <span className="font-medium">Filtrar por período</span>
        </div>

        <div className="flex gap-2">
          <Select
            value={timeFilter}
            onValueChange={(v) => onTimeFilterChange(v as TimeFilter)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TIME_FILTER_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {timeFilter === 'dia' && (
            <Popover open={isCalendarOpen} onOpenChange={onCalendarOpenChange}>
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
                  onSelect={(date) => {
                    if (date) {
                      onDateChange(date);
                      onCalendarOpenChange(false);
                    }
                  }}
                  locale={es}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
