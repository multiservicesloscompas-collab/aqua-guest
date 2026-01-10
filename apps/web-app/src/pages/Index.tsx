import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { BottomNav } from '@/components/layout/BottomNav';
import { MenuSheet } from '@/components/layout/MenuSheet';
import { DashboardPage } from '@/pages/DashboardPage';
import { VentasPage } from '@/pages/VentasPage';
import { AlquilerPage } from '@/pages/AlquilerPage';
import { EgresosPage } from '@/pages/EgresosPage';
import { ConfigPage } from '@/pages/ConfigPage';
import ClientesPage from '@/pages/ClientesPage';
import LavadorasPage from '@/pages/LavadorasPage';
import { SeguimientoPage } from '@/pages/SeguimientoPage';
import { ExchangeHistoryPage } from '@/pages/ExchangeHistoryPage';
import { PrepagadosPage } from '@/pages/PrepagadosPage';
import { DeliverysPage } from '@/pages/DeliverysPage';
import { WaterMetricsPage } from '@/pages/WaterMetricsPage';
import { PaymentBalancePage } from '@/components/equilibrio-pagos/PaymentBalancePage';
import { AppRoute } from '@/types';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { RefreshCw } from 'lucide-react';

const Index = () => {
  const { loadFromSupabase } = useAppStore();
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleRefresh = async () => {
    await loadFromSupabase();
  };

  const { containerRef, isPulling, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80
  });

  useEffect(() => {
    loadFromSupabase();
  }, [loadFromSupabase]);

  const renderPage = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentRoute} />;
      case 'ventas':
        return <VentasPage />;
      case 'alquiler':
        return <AlquilerPage />;
      case 'clientes':
        return <ClientesPage />;
      case 'lavadoras':
        return <LavadorasPage />;
      case 'egresos':
        return <EgresosPage />;
      case 'config':
        return <ConfigPage onNavigate={setCurrentRoute} />;
      case 'seguimiento':
        return <SeguimientoPage />;
      case 'historial-tasas':
        return <ExchangeHistoryPage onNavigate={setCurrentRoute} />;
      case 'prepagados':
        return <PrepagadosPage />;
      case 'deliverys':
        return <DeliverysPage />;
      case 'metricas-agua':
        return <WaterMetricsPage onNavigate={setCurrentRoute} />;
      case 'equilibrio-pagos':
        return <PaymentBalancePage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background" ref={containerRef}>
      {/* Pull-to-refresh indicator */}
      {(isPulling || isRefreshing) && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm border-b border-border/50 transition-all duration-200"
          style={{ 
            height: `${Math.min(pullDistance, 120)}px`,
            opacity: progress
          }}
        >
          <div className="flex items-center gap-2">
            <RefreshCw 
              className={`w-5 h-5 text-primary transition-transform duration-200 ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              style={{ 
                transform: `rotate(${progress * 360}deg)`,
              }}
            />
            <span className="text-sm text-muted-foreground">
              {isRefreshing ? 'Actualizando...' : 'Suelta para actualizar'}
            </span>
          </div>
        </div>
      )}
      
      {renderPage()}
      <BottomNav
        currentRoute={currentRoute}
        onNavigate={setCurrentRoute}
        onOpenMenu={() => setMenuOpen(true)}
      />
      <MenuSheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        currentRoute={currentRoute}
        onNavigate={setCurrentRoute}
      />
    </div>
  );
};

export default Index;
