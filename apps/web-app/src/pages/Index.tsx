import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useMachineStore } from '@/store/useMachineStore';
import { useNavStore } from '@/store/useNavStore';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { MenuSheet } from '@/components/layout/MenuSheet';
import { TabletNavigationRail } from '@/components/layout/TabletNavigationRail';
import { ModuleSubMenuSheet } from '@/components/layout/ModuleSubMenuSheet';
import { DashboardPage } from '@/pages/DashboardPage';
import { WaterSalesPage } from '@/pages/WaterSalesPage';
import { RentalsPage } from '@/pages/RentalsPage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { ConfigPage } from '@/pages/ConfigPage';
import { ExchangeRateConfigPage } from '@/pages/ExchangeRateConfigPage';
import { WaterPricingConfigPage } from '@/pages/WaterPricingConfigPage';
import CustomersPage from '@/pages/CustomersPage/index';
import WashingMachinesPage from '@/pages/WashingMachinesPage';
import { FollowUpPage } from '@/pages/FollowUpPage';
import { ExchangeHistoryPage } from '@/pages/ExchangeHistoryPage';
import { PrePaysPage } from '@/pages/PrePaysPage/index';
import { DeliverysPage } from '@/pages/DeliverysPage';
import { WaterMetricsPage } from '@/pages/WaterMetricsPage/index';
import { PaymentBalancePage } from '@/pages/PaymentBalancePage/index';
import { TransactionsSummaryPage } from '@/pages/TransactionsSummaryPage';
import { PaymentMethodDetailPage } from '@/pages/PaymentMethodDetailPage';
import { LavadorasMetricsPage } from '@/pages/LavadorasMetricsPage/index';
import { EntregasMetricsPage } from '@/pages/EntregasMetricsPage/index';
import { ClientesMetricsPage } from '@/pages/ClientesMetricsPage/index';
import { TopClientsPage } from '@/pages/TopClientsPage/index';
import { EgresosMetricsPage } from '@/pages/EgresosMetricsPage/index';
import { TipsPage } from '@/pages/TipsPage';
import { AppRoute, PaymentMethod } from '@/types';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useViewportMode } from '@/hooks/responsive/useViewportMode';
import { TABLET_SHELL_TOKENS } from '@/lib/responsive/layoutTokens';
import { moduleSubItems } from '@/components/layout/navigationItems';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

// Routes that render their own Header (dynamic titles / back navigation)
const SELF_HEADER_ROUTES: AppRoute[] = [
  'transacciones-hoy',
  'detalle-pago',
  'historial-tasas',
];

interface RouteHeader {
  title: string;
  subtitle?: string;
}

const routeHeaderMap: Record<AppRoute, RouteHeader> = {
  dashboard: { title: 'AquaGest', subtitle: 'Panel de Control' },
  ventas: { title: 'Venta de Agua', subtitle: 'Gestión de registros' },
  alquiler: { title: 'Alquiler de Lavadoras' },
  propinas: { title: 'Propinas', subtitle: 'Gestión y pagos' },
  egresos: { title: 'Egresos', subtitle: 'Registro de gastos' },
  clientes: { title: 'Clientes' },
  lavadoras: { title: 'Lavadoras', subtitle: 'Gestión de máquinas' },
  config: { title: 'Configuración', subtitle: 'Ajustes de la app' },
  seguimiento: { title: 'Seguimiento', subtitle: 'Alquileres pendientes' },
  prepagados: { title: 'Agua Prepagada' },
  deliverys: { title: 'Entregas', subtitle: 'Historial de entregas' },
  'metricas-agua': {
    title: 'Métricas de Agua',
    subtitle: 'Análisis de ventas',
  },
  'equilibrio-pagos': {
    title: 'Equilibrio de Pagos',
    subtitle: 'Transferencia entre métodos',
  },
  'lavadoras-metricas': {
    title: 'Métricas Lavadoras',
    subtitle: 'Resumen de alquileres',
  },
  'entregas-metricas': {
    title: 'Métricas Entregas',
    subtitle: 'Resumen de entregas',
  },
  'clientes-metricas': {
    title: 'Métricas Clientes',
    subtitle: 'Resumen de clientes',
  },
  'clientes-top': { title: 'Top Clientes', subtitle: 'Mayor facturación' },
  'egresos-metricas': {
    title: 'Métricas Finanzas',
    subtitle: 'Resumen de egresos',
  },
  'config-precios-agua': {
    title: 'Precios del Agua',
    subtitle: 'Breakpoints por litro',
  },
  'config-tasa-cambio': { title: 'Tasa de Cambio', subtitle: 'Bs por USD' },
  // Self-header routes — values here are fallbacks, never used by shell
  'historial-tasas': { title: 'Historial de Tasas' },
  'transacciones-hoy': { title: 'Transacciones' },
  'detalle-pago': { title: 'Detalle de Pago' },
};

const Index = () => {
  const { loadFromSupabase } = useAppStore();
  const { currentRoute, activeModuleRoute, setRoute } = useNavStore();
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>('efectivo');
  const [menuOpen, setMenuOpen] = useState(false);
  const [subMenuOpen, setSubMenuOpen] = useState(false);
  const [lastLoaded, setLastLoaded] = useState<number>(Date.now());
  const isFirstLoad = useRef(true);
  const { viewportMode, isMobileViewport, isTabletViewport } =
    useViewportMode();

  const handlePaymentMethodClick = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setRoute('detalle-pago');
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

  const activeSubItems = activeModuleRoute
    ? moduleSubItems[activeModuleRoute] ?? []
    : [];

  const hasSelfHeader = SELF_HEADER_ROUTES.includes(currentRoute);
  const { title, subtitle } = routeHeaderMap[currentRoute];

  const renderPage = () => {
    switch (currentRoute) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigate={setRoute}
            onPaymentMethodClick={handlePaymentMethodClick}
          />
        );
      case 'ventas':
        return <WaterSalesPage />;
      case 'alquiler':
        return <RentalsPage />;
      case 'propinas':
        return <TipsPage />;
      case 'clientes':
        return <CustomersPage />;
      case 'lavadoras':
        return <WashingMachinesPage />;
      case 'egresos':
        return <ExpensesPage />;
      case 'config':
        return <ConfigPage onNavigate={setRoute} />;
      case 'seguimiento':
        return <FollowUpPage />;
      case 'historial-tasas':
        return <ExchangeHistoryPage onNavigate={setRoute} />;
      case 'prepagados':
        return <PrePaysPage />;
      case 'deliverys':
        return <DeliverysPage />;
      case 'metricas-agua':
        return <WaterMetricsPage onNavigate={setRoute} />;
      case 'equilibrio-pagos':
        return <PaymentBalancePage />;
      case 'transacciones-hoy':
        return <TransactionsSummaryPage onNavigate={setRoute} />;
      case 'detalle-pago':
        return (
          <PaymentMethodDetailPage
            paymentMethod={selectedPaymentMethod}
            onNavigate={setRoute}
            onPaymentMethodChange={setSelectedPaymentMethod}
          />
        );
      case 'lavadoras-metricas':
        return <LavadorasMetricsPage onNavigate={setRoute} />;
      case 'entregas-metricas':
        return <EntregasMetricsPage onNavigate={setRoute} />;
      case 'clientes-metricas':
        return <ClientesMetricsPage onNavigate={setRoute} />;
      case 'clientes-top':
        return <TopClientsPage onNavigate={setRoute} />;
      case 'egresos-metricas':
        return <EgresosMetricsPage onNavigate={setRoute} />;
      case 'config-precios-agua':
        return <WaterPricingConfigPage />;
      case 'config-tasa-cambio':
        return <ExchangeRateConfigPage onNavigate={setRoute} />;
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
              style={{ transform: `rotate(${progress * 360}deg)` }}
            />
            <span className="text-sm text-muted-foreground">
              {isRefreshing ? 'Actualizando...' : 'Suelta para actualizar'}
            </span>
          </div>
        </div>
      )}

      <div
        data-testid="app-shell-layout"
        data-viewport-mode={viewportMode}
        className={cn(
          'min-h-screen',
          isTabletViewport && 'grid',
          isTabletViewport && TABLET_SHELL_TOKENS[viewportMode]
        )}
      >
        <TabletNavigationRail
          currentRoute={currentRoute}
          onNavigate={setRoute}
        />

        <div className={cn('min-w-0', isMobileViewport && 'pb-24')}>
          {/* Global shell Header — hidden for pages that manage their own */}
          {!hasSelfHeader && (
            <Header
              title={title}
              subtitle={subtitle}
              subItems={activeSubItems.length > 0 ? activeSubItems : undefined}
              onSubMenuOpen={
                activeSubItems.length > 0
                  ? () => setSubMenuOpen(true)
                  : undefined
              }
            />
          )}
          {renderPage()}
        </div>
      </div>

      {/* BottomNav, MenuSheet, ModuleSubMenuSheet: mobile only */}
      {isMobileViewport && (
        <>
          <BottomNav
            currentRoute={currentRoute}
            onNavigate={setRoute}
            onOpenMenu={() => setMenuOpen(true)}
          />
          <MenuSheet
            open={menuOpen}
            onOpenChange={setMenuOpen}
            currentRoute={currentRoute}
            onNavigate={setRoute}
          />
          {activeModuleRoute && activeSubItems.length > 0 && (
            <ModuleSubMenuSheet
              open={subMenuOpen}
              onOpenChange={setSubMenuOpen}
              moduleRoute={activeModuleRoute}
              currentRoute={currentRoute}
              onNavigate={setRoute}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Index;
