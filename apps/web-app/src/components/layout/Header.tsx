import { DollarSign, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function Header({ title, subtitle, showBack, onBack }: HeaderProps) {
  const { config, sales } = useAppStore();

  const todayEarningsUSD = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    const todaySales = sales.filter(sale => sale.date === todayStr);
    
    const totalBs = todaySales.reduce((sum, sale) => sum + sale.totalBs, 0);
    return totalBs / config.exchangeRate;
  }, [sales, config.exchangeRate]);

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
