import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DollarSign,
  Save,
  RefreshCw,
  History,
  Loader2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useConfigStore } from '@/store/useConfigStore';
import type { AppRoute } from '@/types';

interface ExchangeRateConfigPageProps {
  onNavigate?: (route: AppRoute) => void;
}

export function ExchangeRateConfigPage({
  onNavigate,
}: ExchangeRateConfigPageProps = {}) {
  const { config, setExchangeRate } = useConfigStore();
  const [rate, setRate] = useState(config.exchangeRate.toString());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setRate(config.exchangeRate.toString());
  }, [config.exchangeRate]);

  const handleSave = async () => {
    const newRate = Number(rate);
    if (newRate <= 0) {
      toast.error('Ingresa una tasa válida');
      return;
    }
    setIsSaving(true);
    try {
      await setExchangeRate(newRate);
      toast.success('Tasa actualizada');
    } catch (err) {
      console.error('Error saving exchange rate', err);
      toast.error('Error al guardar la tasa. Se guardó localmente');
    } finally {
      setIsSaving(false);
    }
  };

  const lastUpdate = new Date(config.lastUpdated);
  const formattedDate = format(lastUpdate, "d 'de' MMMM, HH:mm", {
    locale: es,
  });

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Tasa de cambio */}
        <div className="bg-card rounded-xl p-5 border shadow-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 gradient-primary rounded-xl">
              <DollarSign className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Tasa de Cambio
              </h2>
              <p className="text-xs text-muted-foreground">Bs por cada 1 USD</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Tasa Actual (Bs/USD)
            </Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="h-14 text-2xl font-bold text-center flex-1"
              />
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="h-14 w-14 gradient-primary rounded-xl"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="w-3 h-3" />
            <span>Última actualización: {formattedDate}</span>
          </div>

          {onNavigate && (
            <Button
              variant="outline"
              onClick={() => onNavigate('historial-tasas')}
              className="w-full h-11 mt-2"
            >
              <History className="w-4 h-4 mr-2" />
              Ver Historial de Tasas
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="bg-muted/50 rounded-xl p-4 border">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                La tasa de cambio afecta{' '}
                <strong className="text-foreground">todos los módulos</strong>{' '}
                de la aplicación: ventas, alquileres, egresos y métricas.
              </p>
              <p>
                Actualízala diariamente para que los totales en Bs reflejen el
                valor real.
              </p>
            </div>
          </div>
        </div>

        {/* Versión */}
        <div className="text-center text-xs text-muted-foreground py-4">
          <p>AquaGest v1.0.0</p>
        </div>
      </main>
    </div>
  );
}
