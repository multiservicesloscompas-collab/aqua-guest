import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Droplet, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useConfigStore } from '@/store/useConfigStore';
import { LiterPricing, DEFAULT_LITER_BREAKPOINTS } from '@/types';

export function WaterPricingConfigPage() {
  const { config, setLiterPricing } = useConfigStore();
  const [literPrices, setLiterPrices] = useState<LiterPricing[]>(
    config.literPricing || DEFAULT_LITER_BREAKPOINTS
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLiterPrices(config.literPricing || DEFAULT_LITER_BREAKPOINTS);
  }, [config.literPricing]);

  const handleLiterPriceChange = (breakpoint: number, newPrice: string) => {
    const price = Number(newPrice);
    if (price < 0) return;
    setLiterPrices((prev) =>
      prev.map((lp) => (lp.breakpoint === breakpoint ? { ...lp, price } : lp))
    );
  };

  const handleSave = async () => {
    const hasInvalidPrice = literPrices.some((lp) => lp.price <= 0);
    if (hasInvalidPrice) {
      toast.error('Todos los precios deben ser mayores a 0');
      return;
    }
    setIsSaving(true);
    try {
      await setLiterPricing(literPrices);
      toast.success('Precios por litros actualizados');
    } catch (err) {
      console.error('Error saving liter prices', err);
      toast.error('Error al guardar los precios. Se guardaron localmente');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
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
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-12 gradient-primary rounded-xl font-semibold"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Guardando...' : 'Guardar Precios'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            El precio se asigna al breakpoint superior más cercano
          </p>
        </div>
      </main>
    </div>
  );
}
