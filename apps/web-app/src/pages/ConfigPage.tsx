import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Info,
  Save,
  History,
  Loader2,
  DollarSign,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useConfigStore } from '@/store/useConfigStore';
import { clearLocalAppCache } from '@/services/cache/clearLocalAppCache';
import { AppRoute } from '@/types';

interface ConfigPageProps {
  onNavigate?: (route: AppRoute) => void;
}

export function ConfigPage({ onNavigate }: ConfigPageProps) {
  const { config, setExchangeRate } = useConfigStore();
  const [rate, setRate] = useState(config.exchangeRate.toString());
  const [isSavingRate, setIsSavingRate] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  useEffect(() => {
    setRate(config.exchangeRate.toString());
  }, [config.exchangeRate]);

  const handleSaveRate = async () => {
    const newRate = Number(rate);
    if (newRate <= 0) {
      toast.error('Ingresa una tasa válida');
      return;
    }

    setIsSavingRate(true);
    try {
      await setExchangeRate(newRate);
      toast.success('Tasa actualizada');
    } catch (err) {
      console.error('Error saving exchange rate', err);
      toast.error('Error al guardar la tasa. Se guardó localmente');
    } finally {
      setIsSavingRate(false);
    }
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      await clearLocalAppCache();
      toast.success('Cache local limpiada. Recargando la app...');
      window.location.reload();
    } catch (err) {
      console.error('Error clearing local cache', err);
      toast.error('No se pudo limpiar la cache local');
    } finally {
      setIsClearingCache(false);
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
                onClick={handleSaveRate}
                disabled={isSavingRate}
                className="h-14 w-14 gradient-primary rounded-xl"
              >
                {isSavingRate ? (
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

        <div className="bg-card rounded-xl p-5 border shadow-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Más opciones
              </h2>
              <p className="text-xs text-muted-foreground">
                Herramientas de mantenimiento local
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground">
            Esta acción limpia solo datos locales de AquaGest (cache,
            almacenamiento local y datos temporales). No elimina información del
            servidor.
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
                disabled={isClearingCache}
              >
                {isClearingCache ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Limpiar cache
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Limpiar cache local de AquaGest
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará datos locales temporales y reiniciará la
                  aplicación. Los datos guardados en servidor no se borran.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isClearingCache}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(event) => {
                    event.preventDefault();
                    void handleClearCache();
                  }}
                  disabled={isClearingCache}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isClearingCache ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  Confirmar limpieza
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
          <p>
            Hecho con{' '}
            <span role="img" aria-label="gota de agua">
              💧
            </span>{' '}
            para tu negocio
          </p>
        </div>
      </main>
    </div>
  );
}
