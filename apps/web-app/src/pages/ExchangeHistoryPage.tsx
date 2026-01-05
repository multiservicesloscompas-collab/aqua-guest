import { Header } from '@/components/layout/Header';
import { useAppStore } from '@/store/useAppStore';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { AppRoute } from '@/types';

interface ExchangeHistoryPageProps {
  onNavigate: (route: AppRoute) => void;
}

export function ExchangeHistoryPage({ onNavigate }: ExchangeHistoryPageProps) {
  const { config } = useAppStore();

  // Ordenar historial por fecha descendente
  const sortedHistory = [...(config.exchangeRateHistory || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getTrendIcon = (index: number) => {
    if (index >= sortedHistory.length - 1)
      return <Minus className="w-4 h-4 text-muted-foreground" />;

    const current = sortedHistory[index].rate;
    const previous = sortedHistory[index + 1].rate;

    if (current > previous) {
      return <TrendingUp className="w-4 h-4 text-red-500" />;
    } else if (current < previous) {
      return <TrendingDown className="w-4 h-4 text-green-500" />;
    }
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getVariation = (index: number) => {
    if (index >= sortedHistory.length - 1) return null;

    const current = sortedHistory[index].rate;
    const previous = sortedHistory[index + 1].rate;
    const variation = ((current - previous) / previous) * 100;

    return variation;
  };

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header
        title="Historial de Tasas"
        subtitle="Registro histórico del dólar"
        showBack
        onBack={() => onNavigate('config')}
      />

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Tasa actual */}
        <div className="bg-card rounded-xl p-5 border shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tasa Actual</p>
              <p className="text-3xl font-bold text-foreground">
                Bs {config.exchangeRate.toFixed(2)}
              </p>
            </div>
            <div className="p-4 gradient-primary rounded-xl">
              <span className="text-2xl font-bold text-primary-foreground">
                $
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Última actualización:{' '}
            {format(new Date(config.lastUpdated), "d 'de' MMMM, HH:mm", {
              locale: es,
            })}
          </p>
        </div>

        {/* Lista de historial */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground px-1">
            Historial de Cambios
          </h2>

          {sortedHistory.length === 0 ? (
            <div className="bg-muted/50 rounded-xl p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No hay historial de tasas registrado
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                El historial se generará automáticamente al cambiar la tasa
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedHistory.map((entry, index) => {
                const variation = getVariation(index);
                return (
                  <div
                    key={entry.date}
                    className="bg-card rounded-xl p-4 border shadow-card flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {getTrendIcon(index)}
                      <div>
                        <p className="font-semibold text-foreground">
                          Bs {entry.rate.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(
                            parseISO(entry.date),
                            "EEEE, d 'de' MMMM yyyy",
                            { locale: es }
                          )}
                        </p>
                      </div>
                    </div>
                    {variation !== null && (
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          variation > 0
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : variation < 0
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {variation > 0 ? '+' : ''}
                        {variation.toFixed(2)}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-muted/50 rounded-xl p-4 border text-sm text-muted-foreground">
          <p>
            💡 La tasa de cada día se hereda automáticamente del día anterior, a
            menos que se cambie explícitamente en Configuración.
          </p>
        </div>
      </main>
    </div>
  );
}
