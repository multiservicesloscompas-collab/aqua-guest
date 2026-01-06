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
import { AppRoute } from '@/types';

const Index = () => {
  const { loadFromSupabase } = useAppStore();
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

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
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
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
