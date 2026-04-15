import React, { useState, useEffect } from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import AdminSidebar from '../components/AdminSidebar';
import CalendarAdminPage from '../components/CalendarAdminPage';
import BarbersAdminPage from '../components/BarbersAdminPage';
import ServicesAdminPage from '../components/ServicesAdminPage';
import AccountsAdminPage from '../components/AccountsAdminPage';
import BillingPage from '../components/BillingPage';
import LayoutAdminPage from '../components/LayoutAdminPage';
import SMTPAdminPage from '../components/SMTPAdminPage';
import SMSPage from '../components/SMSPage';
import NotificationSettings from '../components/NotificationSettings';
import ProductsAdminPage from '../components/ProductsAdminPage';
import MaintenanceAdminPage from '../components/MaintenanceAdminPage';
import CustomersAdminPage from '../components/CustomersAdminPage';

type AdminSubPage =
  | 'calendar'
  | 'barbers'
  | 'services'
  | 'products'
  | 'customers'
  | 'accounts'
  | 'billing'
  | 'layout'
  | 'smtp'
  | 'sms'
  | 'notifications'
  | 'maintenance';

type LayoutSubTab =
  | 'logo'
  | 'hero'
  | 'hero-background'
  | 'features'
  | 'services-info'
  | 'services-selection'
  | 'contact'
  | 'colors';

const PAGE_TITLES: Record<AdminSubPage, string> = {
  calendar: 'Calendário',
  barbers: 'Gestão de Funcionários',
  services: 'Gestão de Serviços',
  products: 'Produtos',
  customers: 'Clientes',
  accounts: 'Contas',
  billing: 'Faturação',
  layout: 'Layout',
  smtp: 'Configurações SMTP',
  sms: 'SMS',
  notifications: 'Notificações',
  maintenance: 'Manutenção',
};

interface AdminPageProps {
  onLogout: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ onLogout }) => {
  const [currentSubPage, setCurrentSubPage] = useState<AdminSubPage>('calendar');
  const [activeLayoutTab, setActiveLayoutTab] = useState<LayoutSubTab>('logo');
  const { currentUser, logout } = useAuth();
  const { unreadCalendarCount, markCalendarAsRead } = useNotifications();

  useEffect(() => {
    if (currentSubPage === 'calendar') {
      markCalendarAsRead();
    }
  }, [currentSubPage, markCalendarAsRead]);

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const handleNavigate = (page: AdminSubPage) => {
    if (currentUser?.role === 'staff' && page !== 'calendar' && page !== 'sms' && page !== 'notifications' && page !== 'products' && page !== 'maintenance') {
      return;
    }
    if (page === 'calendar') {
      markCalendarAsRead();
    }
    setCurrentSubPage(page);
  };

  const handleLayoutTabChange = (tab: LayoutSubTab) => {
    setActiveLayoutTab(tab);
    setCurrentSubPage('layout');
  };

  const renderSubPage = () => {
    if (currentUser?.role === 'staff') {
      switch (currentSubPage) {
        case 'calendar':
          return <CalendarAdminPage />;
        case 'sms':
          return <SMSPage accountRole="staff" barberIds={currentUser?.barber_ids || []} />;
        case 'notifications':
          return <NotificationSettings />;
        case 'products':
          return <ProductsAdminPage />;
        default:
          return <CalendarAdminPage />;
      }
    }

    switch (currentSubPage) {
      case 'calendar':
        return <CalendarAdminPage />;
      case 'billing':
        return <BillingPage />;
      case 'barbers':
        return <BarbersAdminPage />;
      case 'services':
        return <ServicesAdminPage />;
      case 'products':
        return <ProductsAdminPage />;
      case 'customers':
        return <CustomersAdminPage />;
      case 'accounts':
        return <AccountsAdminPage />;
      case 'smtp':
        return <SMTPAdminPage />;
      case 'sms':
        return <SMSPage accountRole="admin" barberIds={[]} />;
      case 'notifications':
        return <NotificationSettings />;
      case 'layout':
        return <LayoutAdminPage activeTab={activeLayoutTab} onTabChange={setActiveLayoutTab} />;
      case 'maintenance':
        return <MaintenanceAdminPage />;
      default:
        return <CalendarAdminPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar
        currentPage={currentSubPage}
        onNavigate={handleNavigate}
        userRole={currentUser?.role || 'staff'}
        activeLayoutTab={activeLayoutTab}
        onLayoutTabChange={handleLayoutTabChange}
        unreadCalendarCount={unreadCalendarCount}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{PAGE_TITLES[currentSubPage]}</h1>
            <p className="text-sm text-gray-500">Painel de Administração</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-500" />
              </div>
              <div className="text-right hidden sm:block">
                <p className="font-medium text-gray-800 leading-none">{currentUser?.username}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {currentUser?.role === 'admin' ? 'Administrador' : 'Funcionário'}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {renderSubPage()}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
