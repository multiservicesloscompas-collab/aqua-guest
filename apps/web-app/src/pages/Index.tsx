import { useState } from 'react';
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
import { AppRoute } from '@/types';

const Index = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  const renderPage = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <DashboardPage />;
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
