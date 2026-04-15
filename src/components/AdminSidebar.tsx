import React, { useState, useEffect } from 'react';
import { Calendar, Users, List, Shield, TrendingUp, Palette, Mail, MessageSquare, Bell, ChevronLeft, ChevronRight, ChevronDown, Scissors, Image, FileText, MapPin, Image as ImageIcon, ShoppingBag, Wrench } from 'lucide-react';

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

interface AdminSidebarProps {
  currentPage: AdminSubPage;
  onNavigate: (page: AdminSubPage) => void;
  userRole: 'admin' | 'staff';
  activeLayoutTab: LayoutSubTab;
  onLayoutTabChange: (tab: LayoutSubTab) => void;
  unreadCalendarCount?: number;
}

interface NavItem {
  id: AdminSubPage;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  subItems?: { id: LayoutSubTab; label: string; icon: React.ReactNode }[];
}

const layoutSubItems: { id: LayoutSubTab; label: string; icon: React.ReactNode }[] = [
  { id: 'logo', label: 'Logo', icon: <Scissors className="h-4 w-4" /> },
  { id: 'hero', label: 'Secção Hero', icon: <FileText className="h-4 w-4" /> },
  { id: 'hero-background', label: 'Fundo do Hero', icon: <ImageIcon className="h-4 w-4" /> },
  { id: 'features', label: 'Características', icon: <Image className="h-4 w-4" /> },
  { id: 'services-info', label: 'Info Serviços', icon: <FileText className="h-4 w-4" /> },
  { id: 'services-selection', label: 'Serviços em Destaque', icon: <List className="h-4 w-4" /> },
  { id: 'contact', label: 'Contacto', icon: <MapPin className="h-4 w-4" /> },
  { id: 'colors', label: 'Cores e Tema', icon: <Palette className="h-4 w-4" /> },
];

const allNavItems: NavItem[] = [
  { id: 'calendar', label: 'Calendário', icon: <Calendar className="h-5 w-5" /> },
  { id: 'sms', label: 'SMS', icon: <MessageSquare className="h-5 w-5" /> },
  { id: 'notifications', label: 'Notificações', icon: <Bell className="h-5 w-5" /> },
  { id: 'barbers', label: 'Funcionários', icon: <Users className="h-5 w-5" />, adminOnly: true },
  { id: 'services', label: 'Serviços', icon: <List className="h-5 w-5" />, adminOnly: true },
  { id: 'products', label: 'Produtos', icon: <ShoppingBag className="h-5 w-5" />, adminOnly: false },
  { id: 'customers', label: 'Clientes', icon: <Users className="h-5 w-5" />, adminOnly: true },
  { id: 'billing', label: 'Faturação', icon: <TrendingUp className="h-5 w-5" />, adminOnly: true },
  { id: 'accounts', label: 'Contas', icon: <Shield className="h-5 w-5" />, adminOnly: true },
  { id: 'smtp', label: 'SMTP', icon: <Mail className="h-5 w-5" />, adminOnly: true },
  { id: 'maintenance', label: 'Manutenção', icon: <Wrench className="h-5 w-5" />, adminOnly: true },
  {
    id: 'layout',
    label: 'Layout',
    icon: <Palette className="h-5 w-5" />,
    adminOnly: true,
    subItems: layoutSubItems,
  },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentPage,
  onNavigate,
  userRole,
  activeLayoutTab,
  onLayoutTabChange,
  unreadCalendarCount = 0,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(currentPage === 'layout');

  useEffect(() => {
    if (currentPage === 'layout') {
      setLayoutOpen(true);
    }
  }, [currentPage]);

  const visibleItems = allNavItems.filter(i => !i.adminOnly || userRole === 'admin');

  const handleItemClick = (item: NavItem) => {
    if (item.subItems) {
      if (collapsed) {
        setCollapsed(false);
        setLayoutOpen(true);
        onNavigate(item.id);
      } else {
        if (currentPage !== item.id) {
          onNavigate(item.id);
          setLayoutOpen(true);
        } else {
          setLayoutOpen(prev => !prev);
        }
      }
    } else {
      onNavigate(item.id);
    }
  };

  return (
    <aside
      className={`flex flex-col bg-gray-900 text-white transition-all duration-300 ease-in-out flex-shrink-0 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
      style={{ minHeight: '100vh' }}
    >
      <div
        className={`flex items-center h-16 border-b border-gray-700 px-3 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        {!collapsed && (
          <span className="text-sm font-semibold text-gray-100 truncate">Administração</span>
        )}
        <button
          onClick={() => setCollapsed(prev => !prev)}
          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0.5">
        {visibleItems.map(item => {
          const isActive = currentPage === item.id;
          const hasSubItems = !!item.subItems;
          const isExpanded = hasSubItems && layoutOpen && !collapsed;

          return (
            <div key={item.id}>
              <button
                onClick={() => handleItemClick(item)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 rounded-md mx-1 ${
                  collapsed ? 'justify-center w-auto' : 'justify-between w-[calc(100%-8px)]'
                } ${
                  isActive
                    ? 'bg-amber-500 text-gray-900'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="flex-shrink-0 relative">
                    {item.icon}
                    {item.id === 'calendar' && unreadCalendarCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                        {unreadCalendarCount > 99 ? '99+' : unreadCalendarCount}
                      </span>
                    )}
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </span>
                {!collapsed && unreadCalendarCount > 0 && item.id === 'calendar' && (
                  <span className="flex-shrink-0 min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                    {unreadCalendarCount > 99 ? '99+' : unreadCalendarCount}
                  </span>
                )}
                {!collapsed && hasSubItems && (
                  <ChevronDown
                    className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${
                      isExpanded ? 'rotate-0' : '-rotate-90'
                    } ${isActive ? 'text-gray-900' : 'text-gray-500'}`}
                  />
                )}
              </button>

              {isExpanded && item.subItems && (
                <div className="mt-0.5 mb-1 ml-3 pl-3 border-l border-gray-700 space-y-0.5">
                  {item.subItems.map(sub => {
                    const isSubActive = activeLayoutTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => onLayoutTabChange(sub.id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-all duration-150 ${
                          isSubActive
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'text-gray-500 hover:text-gray-200 hover:bg-gray-800'
                        }`}
                      >
                        <span className="flex-shrink-0">{sub.icon}</span>
                        <span className="truncate">{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
