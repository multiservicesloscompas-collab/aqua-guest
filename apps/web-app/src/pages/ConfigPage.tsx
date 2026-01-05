import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DollarSign,
  Save,
  RefreshCw,
  Info,
  Droplet,
  History,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LiterPricing, DEFAULT_LITER_BREAKPOINTS, AppRoute } from '@/types';

interface ConfigPageProps {
  onNavigate?: (route: AppRoute) => void;
}

export function ConfigPage({ onNavigate }: ConfigPageProps) {
  const { config, setExchangeRate, setLiterPricing } = useAppStore();
  const [rate, setRate] = useState(config.exchangeRate.toString());
  const [literPrices, setLiterPrices] = useState<LiterPricing[]>(
    config.literPricing || DEFAULT_LITER_BREAKPOINTS
  );

  useEffect(() => {
    setRate(config.exchangeRate.toString());
  }, [config.exchangeRate]);

  useEffect(() => {
    setLiterPrices(config.literPricing || DEFAULT_LITER_BREAKPOINTS);
  }, [config.literPricing]);

  const handleSaveRate = async () => {
    const newRate = Number(rate);
    if (newRate <= 0) {
      toast.error('Ingresa una tasa válida');
      return;
    }

    try {
      await setExchangeRate(newRate);
      toast.success('Tasa actualizada');
    } catch (err) {
      console.error('Error saving exchange rate', err);
      toast.error('Error al guardar la tasa. Se guardó localmente');
    }
  };

  const handleLiterPriceChange = (breakpoint: number, newPrice: string) => {
    const price = Number(newPrice);
    if (price < 0) return;

    setLiterPrices((prev) =>
      prev.map((lp) => (lp.breakpoint === breakpoint ? { ...lp, price } : lp))
    );
  };

  const handleSaveLiterPrices = async () => {
    // Validar que todos los precios sean positivos
    const hasInvalidPrice = literPrices.some((lp) => lp.price <= 0);
    if (hasInvalidPrice) {
      toast.error('Todos los precios deben ser mayores a 0');
      return;
    }
    try {
      await setLiterPricing(literPrices);
      toast.success('Precios por litros actualizados');
    } catch (err) {
      console.error('Error saving liter prices', err);
      toast.error('Error al guardar los precios. Se guardaron localmente');
    }
  };

  const lastUpdate = new Date(config.lastUpdated);
  const formattedDate = format(lastUpdate, "d 'de' MMMM, HH:mm", {
    locale: es,
  });

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header title="Configuración" subtitle="Ajustes de la app" />

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
                onClick={handleSaveRate}
                className="h-14 w-14 gradient-primary rounded-xl"
              >
                <Save className="w-5 h-5" />
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

        {/* Precios por Litros */}
        <div className="bg-card rounded-xl p-5 border shadow-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500 rounded-xl">
              <Droplet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Precios por Litros
              </h2>
              <p className="text-xs text-muted-foreground">
                Breakpoints de precio según litraje
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {literPrices
              .sort((a, b) => a.breakpoint - b.breakpoint)
              .map((lp) => (
                <div key={lp.breakpoint} className="flex items-center gap-3">
                  <div className="w-16 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-foreground">
                      {lp.breakpoint}L
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        Bs
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={lp.price}
                        onChange={(e) =>
                          handleLiterPriceChange(lp.breakpoint, e.target.value)
                        }
                        className="h-10 pl-10 text-right font-semibold"
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <Button
            onClick={handleSaveLiterPrices}
            className="w-full h-12 gradient-primary rounded-xl font-semibold"
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar Precios
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            El precio se asigna al breakpoint superior más cercano
          </p>
        </div>

        {/* Info */}
        <div className="bg-muted/50 rounded-xl p-4 border">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong className="text-foreground">AquaGest</strong> es una app
                de gestión comercial para negocios de venta de agua.
              </p>
              <p>
                Los datos se guardan localmente en tu dispositivo. Para mayor
                seguridad, realiza copias de seguridad regularmente.
              </p>
            </div>
          </div>
        </div>

        {/* Versión */}
        <div className="text-center text-xs text-muted-foreground py-4">
          <p>AquaGest v1.0.0</p>
          <p>Hecho con 💧 para tu negocio</p>
        </div>
      </main>
    </div>
  );
}
