import React from 'react';
import { Calendar, Users, List, Shield, TrendingUp, Palette, Mail, MessageSquare, Bell, ShoppingBag } from 'lucide-react';

interface AdminMenuBarProps {
  currentPage: 'calendar' | 'barbers' | 'services' | 'accounts' | 'billing' | 'layout' | 'smtp' | 'sms' | 'notifications' | 'products';
  onNavigate: (page: 'calendar' | 'barbers' | 'services' | 'accounts' | 'billing' | 'layout' | 'smtp' | 'sms' | 'notifications' | 'products') => void;
  userRole: 'admin' | 'staff';
}

const AdminMenuBar: React.FC<AdminMenuBarProps> = ({ currentPage, onNavigate, userRole }) => {
  return (
    <div className="bg-white rounded-lg shadow-md mb-6 p-2">
      <nav className="flex flex-row overflow-x-auto overflow-y-hidden flex-nowrap gap-1 pb-0.5">
        <button
          onClick={() => onNavigate('calendar')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 text-sm ${
            currentPage === 'calendar'
              ? 'bg-yellow-400 text-gray-900'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Calendar className="h-4 w-4 flex-shrink-0" />
          Calendário
        </button>
        <button
          onClick={() => onNavigate('sms')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 text-sm ${
            currentPage === 'sms'
              ? 'bg-yellow-400 text-gray-900'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <MessageSquare className="h-4 w-4 flex-shrink-0" />
          SMS
        </button>
        <button
          onClick={() => onNavigate('notifications')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 text-sm ${
            currentPage === 'notifications'
              ? 'bg-yellow-400 text-gray-900'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Bell className="h-4 w-4 flex-shrink-0" />
          Notificações
        </button>
        <button
          onClick={() => onNavigate('products')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 text-sm ${
            currentPage === 'products'
              ? 'bg-yellow-400 text-gray-900'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <ShoppingBag className="h-4 w-4 flex-shrink-0" />
          Produtos
        </button>
        {userRole === 'admin' && (
          <>
            <button
              onClick={() => onNavigate('barbers')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 text-sm ${
                currentPage === 'barbers'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="h-4 w-4 flex-shrink-0" />
              Funcionários
            </button>
            <button
              onClick={() => onNavigate('services')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 text-sm ${
                currentPage === 'services'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <List className="h-4 w-4 flex-shrink-0" />
              Serviços
            </button>
            <button
              onClick={() => onNavigate('accounts')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 text-sm ${
                currentPage === 'accounts'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Shield className="h-4 w-4 flex-shrink-0" />
              Contas
            </button>
            <button
              onClick={() => onNavigate('billing')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 text-sm ${
                currentPage === 'billing'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="h-4 w-4 flex-shrink-0" />
              Faturação
            </button>
            <button
              onClick={() => onNavigate('smtp')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 text-sm ${
                currentPage === 'smtp'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Mail className="h-4 w-4 flex-shrink-0" />
              SMTP
            </button>
            <button
              onClick={() => onNavigate('layout')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 text-sm ${
                currentPage === 'layout'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Palette className="h-4 w-4 flex-shrink-0" />
              Layout
            </button>
          </>
        )}
      </nav>
    </div>
  );
};

export default AdminMenuBar;
