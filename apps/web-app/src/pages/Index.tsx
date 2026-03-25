import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useMachineStore } from '@/store/useMachineStore';
import { BottomNav } from '@/components/layout/BottomNav';
import { MenuSheet } from '@/components/layout/MenuSheet';
import { DashboardPage } from '@/pages/DashboardPage';
import { WaterSalesPage } from '@/pages/WaterSalesPage';
import { RentalsPage } from '@/pages/RentalsPage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { ConfigPage } from '@/pages/ConfigPage';
import CustomersPage from '@/pages/CustomersPage';
import WashingMachinesPage from '@/pages/WashingMachinesPage';
import { FollowUpPage } from '@/pages/FollowUpPage';
import { ExchangeHistoryPage } from '@/pages/ExchangeHistoryPage';
import { PrePaysPage } from '@/pages/PrePaysPage';
import { DeliverysPage } from '@/pages/DeliverysPage';
import { WaterMetricsPage } from '@/pages/WaterMetricsPage';
import { PaymentBalancePage } from '@/pages/PaymentBalancePage/index';
import { TransactionsSummaryPage } from '@/pages/TransactionsSummaryPage';
import { PaymentMethodDetailPage } from '@/pages/PaymentMethodDetailPage';
import { UsersPage } from '@/pages/UsersPage';
import { AppRoute, PaymentMethod } from '@/types';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { RefreshCw } from 'lucide-react';

const Index = () => {
  const { loadFromSupabase } = useAppStore();
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('dashboard');
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>('efectivo');
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastLoaded, setLastLoaded] = useState<number>(Date.now());
  const isFirstLoad = useRef(true);

  const handlePaymentMethodClick = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setCurrentRoute('detalle-pago');
  };

  const handleRefresh = async () => {
    await loadFromSupabase();
    useMachineStore.getState().loadWashingMachines();
    await useMachineStore.getState().loadWashingMachines();
    setLastLoaded(Date.now());
  };

  const { containerRef, isPulling, pullDistance, isRefreshing, progress } =
    usePullToRefresh({
      onRefresh: handleRefresh,
      threshold: 80,
    });

  useEffect(() => {
    const minutesSinceLastLoad = (Date.now() - lastLoaded) / (1000 * 60);
    if (isFirstLoad.current || minutesSinceLastLoad >= 5) {
      loadFromSupabase();
      setLastLoaded(Date.now());
      isFirstLoad.current = false;
    }
  }, [loadFromSupabase, currentRoute, lastLoaded]);

  const renderPage = () => {
    switch (currentRoute) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigate={setCurrentRoute}
            onPaymentMethodClick={handlePaymentMethodClick}
          />
        );
      case 'ventas':
        return <WaterSalesPage />;
      case 'alquiler':
        return <RentalsPage />;
      case 'clientes':
        return <CustomersPage />;
      case 'lavadoras':
        return <WashingMachinesPage />;
      case 'egresos':
        return <ExpensesPage />;
      case 'config':
        return <ConfigPage onNavigate={setCurrentRoute} />;
      case 'seguimiento':
        return <FollowUpPage />;
      case 'historial-tasas':
        return <ExchangeHistoryPage onNavigate={setCurrentRoute} />;
      case 'prepagados':
        return <PrePaysPage />;
      case 'deliverys':
        return <DeliverysPage />;
      case 'metricas-agua':
        return <WaterMetricsPage onNavigate={setCurrentRoute} />;
      case 'equilibrio-pagos':
        return <PaymentBalancePage />;
      case 'transacciones-hoy':
        return <TransactionsSummaryPage onNavigate={setCurrentRoute} />;
      case 'detalle-pago':
        return (
          <PaymentMethodDetailPage
            paymentMethod={selectedPaymentMethod}
            onNavigate={setCurrentRoute}
            onPaymentMethodChange={setSelectedPaymentMethod}
          />
        );
      case 'usuarios':
        return <UsersPage onNavigate={setCurrentRoute} />;
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
            opacity: progress,
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
