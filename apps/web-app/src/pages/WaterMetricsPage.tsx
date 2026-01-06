import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { useAppStore } from '@/store/useAppStore';
import { Sale, CartItem, AppRoute } from '@/types';
import {
  Droplets,
  Calendar,
  TrendingUp,
  DollarSign,
  Package,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateSelector } from '@/components/ventas/DateSelector';
import { cn } from '@/lib/utils';

type DateRange = 'day' | 'week' | 'month';

interface WaterMetricsPageProps {
  onNavigate?: (route: AppRoute) => void;
}

interface LiterBreakdown {
  liters: number;
  count: number;
  totalLiters: number;
  totalBs: number;
}

export function WaterMetricsPage({ onNavigate }: WaterMetricsPageProps = {}) {
  const { sales, config, selectedDate, setSelectedDate } = useAppStore();
  const [range, setRange] = useState<DateRange>('day');

  // Calcular rango de fechas según el filtro seleccionado
  const dateRange = useMemo(() => {
    const selected = new Date(selectedDate + 'T12:00:00');
    let startDate: Date;
    let endDate: Date = new Date(selected);

    switch (range) {
      case 'day':
        startDate = new Date(selected);
        endDate = new Date(selected);
        break;
      case 'week':
        startDate = new Date(selected);
        startDate.setDate(selected.getDate() - selected.getDay()); // Domingo
        endDate = new Date(selected);
        endDate.setDate(selected.getDate() + (6 - selected.getDay())); // Sábado
        break;
      case 'month':
        startDate = new Date(selected.getFullYear(), selected.getMonth(), 1);
        endDate = new Date(
          selected.getFullYear(),
          selected.getMonth() + 1,
          0
        );
        break;
    }

    const formatDate = (date: Date) => {
      return (
        date.getFullYear() +
        '-' +
        String(date.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(date.getDate()).padStart(2, '0')
      );
    };

    return {
      start: formatDate(startDate),
      end: formatDate(endDate),
      startDate,
      endDate,
    };
  }, [selectedDate, range]);

  // Filtrar ventas en el rango
  const filteredSales = useMemo(() => {
    return sales.filter((sale: Sale) => {
      return sale.date >= dateRange.start && sale.date <= dateRange.end;
    });
  }, [sales, dateRange]);

  // Calcular métricas
  const metrics = useMemo(() => {
    let totalLiters = 0;
    let totalBs = 0;
    let totalUsd = 0;
    const literBreakdown: Record<number, LiterBreakdown> = {};

    filteredSales.forEach((sale: Sale) => {
      totalBs += sale.totalBs;
      totalUsd += sale.totalUsd;

      sale.items.forEach((item: CartItem) => {
        if (item.liters && item.quantity) {
          const itemLiters = item.liters * item.quantity;
          totalLiters += itemLiters;

          // Agrupar por cantidad de litros
          if (!literBreakdown[item.liters]) {
            literBreakdown[item.liters] = {
              liters: item.liters,
              count: 0,
              totalLiters: 0,
              totalBs: 0,
            };
          }
          literBreakdown[item.liters].count += item.quantity;
          literBreakdown[item.liters].totalLiters += itemLiters;
          literBreakdown[item.liters].totalBs += item.subtotal;
        }
      });
    });

    // Convertir a array y ordenar por litros
    const breakdownArray = Object.values(literBreakdown).sort(
      (a, b) => a.liters - b.liters
    );

    // Calcular botellones equivalentes (litros / 19)
    const equivalentBottles = totalLiters / 19;

    return {
      totalLiters,
      equivalentBottles,
      totalBs,
      totalUsd,
      breakdown: breakdownArray,
      salesCount: filteredSales.length,
    };
  }, [filteredSales]);

  const rangeLabels: Record<DateRange, string> = {
    day: 'Día',
    week: 'Semana',
    month: 'Mes',
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <Header
        title="Métricas de Agua"
        subtitle="Análisis de ventas"
        showBack={!!onNavigate}
        onBack={() => onNavigate?.('dashboard')}
      />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Selector de rango */}
        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={(v) => setRange(v as DateRange)}>
            <SelectTrigger className="h-12 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Por Día</SelectItem>
              <SelectItem value="week">Por Semana</SelectItem>
              <SelectItem value="month">Por Mes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Selector de fecha */}
        {range === 'day' && (
          <DateSelector
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        )}

        {range !== 'day' && (
          <div className="bg-card rounded-xl p-4 border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {dateRange.startDate.toLocaleDateString('es-VE', {
                  day: 'numeric',
                  month: 'short',
                })}{' '}
                -{' '}
                {dateRange.endDate.toLocaleDateString('es-VE', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        )}

        {/* KPIs principales */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  Litros Totales
                </span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {metrics.totalLiters.toLocaleString('es-VE', {
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">L</p>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  Botellones Eq.
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {metrics.equivalentBottles.toLocaleString('es-VE', {
                  maximumFractionDigits: 1,
                })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                (÷ 19 litros)
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  Total en Bs
                </span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                Bs{' '}
                {metrics.totalBs.toLocaleString('es-VE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-purple-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  Total en USD
                </span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                ${' '}
                {metrics.totalUsd.toLocaleString('es-VE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Desglose por cantidad de litros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-5 h-5 text-primary" />
              Desglose por Cantidad de Litros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.breakdown.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Droplets className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No hay ventas con litros en este período</p>
              </div>
            ) : (
              metrics.breakdown.map((item) => (
                <div
                  key={item.liters}
                  className="bg-muted/50 rounded-lg p-4 border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {item.liters}L
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {item.count} {item.count === 1 ? 'venta' : 'ventas'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.totalLiters.toLocaleString('es-VE', {
                            maximumFractionDigits: 0,
                          })}{' '}
                          litros totales
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">
                        Bs{' '}
                        {item.totalBs.toLocaleString('es-VE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        $
                        {(item.totalBs / config.exchangeRate).toLocaleString(
                          'es-VE',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Resumen adicional */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Total de ventas:
              </span>
              <span className="text-lg font-bold text-foreground">
                {metrics.salesCount}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t">
              <span className="text-sm font-medium text-muted-foreground">
                Promedio por venta:
              </span>
              <span className="text-lg font-bold text-foreground">
                {metrics.salesCount > 0
                  ? (metrics.totalLiters / metrics.salesCount).toLocaleString(
                      'es-VE',
                      { maximumFractionDigits: 1 }
                    )
                  : '0'}{' '}
                L
              </span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

