import { DollarSign, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function Header({ title, subtitle, showBack, onBack }: HeaderProps) {
  const { config, sales, rentals } = useAppStore();
  // Estado para forzar actualización cuando cambia el día
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return (
      now.getFullYear() +
      '-' +
      String(now.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(now.getDate()).padStart(2, '0')
    );
  });

  // Actualizar la fecha cada minuto y verificar si cambió el día
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const todayStr =
        now.getFullYear() +
        '-' +
        String(now.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(now.getDate()).padStart(2, '0');
      setCurrentDate((prev) => {
        // Solo actualizar si cambió el día
        if (prev !== todayStr) {
          return todayStr;
        }
        return prev;
      });
    }, 60000); // Verificar cada minuto

    return () => clearInterval(interval);
  }, []);

  const todayEarningsUSD = useMemo(() => {
    // Ventas de agua del día
    const todaySales = sales.filter((sale) => sale.date === currentDate);
    const waterToday = todaySales.reduce((sum, sale) => sum + sale.totalBs, 0);
    
    // Alquileres del día (convertir USD a Bs y luego a USD para el total)
    const todayRentals = rentals.filter((rental) => rental.date === currentDate);
    const rentalTodayBs = todayRentals.reduce(
      (sum, rental) => sum + rental.totalUsd * config.exchangeRate,
      0
    );
    
    // Total combinado en Bs, luego convertir a USD
    const totalToday = waterToday + rentalTodayBs;
    return totalToday / config.exchangeRate;
  }, [sales, rentals, config.exchangeRate, currentDate]);

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 safe-top">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {showBack && onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-9 w-9 shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex flex-col min-w-0">
            <h1 className="text-lg font-bold text-foreground leading-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <span className="text-xs text-muted-foreground truncate">{subtitle}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 shrink-0">
          <DollarSign className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-primary">
            ${todayEarningsUSD.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">hoy</span>
        </div>
      </div>
    </header>
  );
}
