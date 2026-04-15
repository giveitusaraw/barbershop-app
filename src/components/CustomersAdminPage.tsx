import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { db } from '../lib/database';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  last_visit: string | null;
}

type ActiveTab = 'all' | 'inactive';

const INACTIVE_THRESHOLD_DAYS = 30;
const INACTIVE_RED_DAYS = 60;

const daysSince = (dateStr: string | null): number | null => {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const formatDate = (iso: string | null) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const inactivityLevel = (days: number | null): 'none' | 'yellow' | 'red' => {
  if (days === null || days >= INACTIVE_RED_DAYS) return 'red';
  if (days >= INACTIVE_THRESHOLD_DAYS) return 'yellow';
  return 'none';
};

const InactiveBadge: React.FC<{ days: number | null }> = ({ days }) => {
  if (days === null) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <AlertTriangle className="h-3 w-3" />
        Sem visitas
      </span>
    );
  }
  if (days >= INACTIVE_RED_DAYS) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <AlertTriangle className="h-3 w-3" />
        {days}d sem visita
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
      <Clock className="h-3 w-3" />
      {days}d sem visita
    </span>
  );
};

const CustomerRow: React.FC<{ customer: Customer; showInactivity: boolean }> = ({ customer, showInactivity }) => {
  const days = daysSince(customer.last_visit);
  const level = showInactivity ? inactivityLevel(days) : 'none';

  const nameColor =
    level === 'red' ? 'text-red-600' :
    level === 'yellow' ? 'text-amber-600' :
    'text-gray-900';

  const emailColor =
    level === 'red' ? 'text-red-500' :
    level === 'yellow' ? 'text-amber-500' :
    'text-gray-600';

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${level === 'red' ? 'bg-red-100' : level === 'yellow' ? 'bg-amber-100' : 'bg-gray-100'}`}>
          <span className={`text-sm font-semibold ${level === 'red' ? 'text-red-600' : level === 'yellow' ? 'text-amber-600' : 'text-gray-600'}`}>
            {customer.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className={`font-medium text-sm ${nameColor}`}>{customer.name}</span>
      </div>

      <div className="flex items-center gap-2 text-sm md:pl-0 pl-11">
        <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
        <span className={`truncate ${emailColor}`}>{customer.email || '-'}</span>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600 pl-11 md:pl-0">
        <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
        <span>{customer.phone || '-'}</span>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500 pl-11 md:pl-0">
        <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
        <span>{formatDate(customer.last_visit)}</span>
      </div>

      {showInactivity && (
        <div className="pl-11 md:pl-0 flex items-center">
          <InactiveBadge days={days} />
        </div>
      )}
    </div>
  );
};

const CustomersAdminPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await db.getCustomersWithLastVisit();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const inactiveCustomers = customers.filter(c => {
    const days = daysSince(c.last_visit);
    return days === null || days >= INACTIVE_THRESHOLD_DAYS;
  }).sort((a, b) => {
    const da = daysSince(a.last_visit) ?? 99999;
    const db2 = daysSince(b.last_visit) ?? 99999;
    return db2 - da;
  });

  const applySearch = (list: Customer[]) => {
    const q = search.toLowerCase();
    if (!q) return list;
    return list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q)
    );
  };

  const displayedAll = applySearch(customers);
  const displayedInactive = applySearch(inactiveCustomers);

  const displayed = activeTab === 'all' ? displayedAll : displayedInactive;
  const showInactivity = activeTab === 'inactive';

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Clientes</h2>
        <p className="text-gray-600 mt-1">
          Lista de clientes registados automaticamente através do site
        </p>
      </div>

      <div className="mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4 w-fit">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
            <p className="text-sm text-gray-500">Total de clientes</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex gap-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-amber-500 text-amber-700 bg-amber-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Todos os clientes
            </button>
            <button
              onClick={() => setActiveTab('inactive')}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'inactive'
                  ? 'border-amber-500 text-amber-700 bg-amber-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Clientes inativos
              {inactiveCustomers.length > 0 && (
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold ${
                  activeTab === 'inactive' ? 'bg-amber-200 text-amber-800' : 'bg-gray-200 text-gray-600'
                }`}>
                  {inactiveCustomers.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'inactive' && (
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Clientes sem reservas há mais de <strong>{INACTIVE_THRESHOLD_DAYS} dias</strong>, ordenados do mais inativo.
              {' '}<span className="text-amber-600 font-medium">Amarelo</span> = entre {INACTIVE_THRESHOLD_DAYS} e {INACTIVE_RED_DAYS} dias &nbsp;·&nbsp; <span className="text-red-600 font-medium">Vermelho</span> = mais de {INACTIVE_RED_DAYS} dias ou sem visitas.
            </p>
          </div>
        )}

        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por nome, email ou telefone..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500">
            A carregar...
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Users className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">
              {search
                ? 'Nenhum cliente encontrado para a pesquisa'
                : activeTab === 'inactive'
                ? 'Nenhum cliente inativo de momento'
                : 'Nenhum cliente registado ainda'}
            </p>
            {!search && activeTab === 'all' && (
              <p className="text-xs mt-1 text-gray-400">
                Os clientes aparecem aqui automaticamente quando fazem uma reserva com email
              </p>
            )}
          </div>
        ) : (
          <>
            <div className={`hidden md:grid gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide ${showInactivity ? 'grid-cols-5' : 'grid-cols-4'}`}>
              <span>Nome</span>
              <span>Email</span>
              <span>Telefone</span>
              <span>Última visita</span>
              {showInactivity && <span>Inatividade</span>}
            </div>

            <div className="divide-y divide-gray-100">
              {displayed.map((customer) => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  showInactivity={showInactivity}
                />
              ))}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
              {displayed.length} {displayed.length === 1 ? 'cliente' : 'clientes'}
              {search && ` encontrado${displayed.length === 1 ? '' : 's'}`}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomersAdminPage;
