import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeftRight } from 'lucide-react';
import { AppRoute } from '@/types';

interface QuickActionsCardsProps {
  onNavigate?: (route: AppRoute) => void;
}

export function QuickActionsCards({ onNavigate }: QuickActionsCardsProps) {
  return (
    <Card
      className="cursor-pointer hover:bg-muted/50 active:scale-95 transition-all border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10"
      onClick={() => onNavigate?.('equilibrio-pagos')}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <ArrowLeftRight className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Equilibrar Pagos
              </h3>
              <p className="text-xs text-muted-foreground">
                Transferir entre métodos de pago
              </p>
            </div>
          </div>
          <ArrowLeftRight className="w-5 h-5 text-green-600" />
        </div>
      </CardContent>
    </Card>
  );
}
