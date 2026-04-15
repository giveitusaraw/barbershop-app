import React, { useState, useEffect } from 'react';
import { DollarSign, Briefcase, Award, BarChart3, Settings, Target, Pencil, Check, X, Receipt, ShoppingBag } from 'lucide-react';
import { db, ProductSalesStats } from '../lib/database';
import { MonthlyRevenue, Barber, MonthlyOccupancyData, OccupancyPeriod } from '../types';
import { OccupancyStats } from './OccupancyStats';
import { OccupancyThresholdModal } from './OccupancyThresholdModal';
import { useAuth } from '../contexts/AuthContext';

const BillingPage: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [revenueData, setRevenueData] = useState<MonthlyRevenue | null>(null);
  const [loading, setLoading] = useState(true);

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string>('all');
  const [occupancyPeriod, setOccupancyPeriod] = useState<OccupancyPeriod>('monthly');
  const [occupancyData, setOccupancyData] = useState<MonthlyOccupancyData | null>(null);
  const [occupancyLoading, setOccupancyLoading] = useState(true);
  const [thresholds, setThresholds] = useState({ good: 70, medium: 50 });
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);

  const [productSalesStats, setProductSalesStats] = useState<ProductSalesStats | null>(null);

  const [goals, setGoals] = useState<Record<string, number>>({});
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editingGoalValue, setEditingGoalValue] = useState<string>('');
  const [savingGoal, setSavingGoal] = useState<string | null>(null);

  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  const years = Array.from({ length: 4 }, (_, i) => currentDate.getFullYear() - i);

  useEffect(() => {
    loadBarbers();
    loadThresholds();
    loadGoals();
  }, []);

  useEffect(() => {
    loadRevenueData();
    loadOccupancyData();
    loadProductSalesStats();
  }, [selectedMonth, selectedYear, selectedBarber, occupancyPeriod]);

  const loadBarbers = async () => {
    try {
      const barbersList = await db.getBarbers();
      setBarbers(barbersList);
    } catch (error) {
      console.error('Error loading barbers:', error);
    }
  };

  const loadGoals = async () => {
    try {
      const data = await db.getBarberGoals();
      const map: Record<string, number> = {};
      data.forEach(g => { map[g.barber_id] = g.goal_amount; });
      setGoals(map);
    } catch (error) {
      console.error('Error loading barber goals:', error);
    }
  };

  const startEditGoal = (barberId: string) => {
    setEditingGoal(barberId);
    setEditingGoalValue(String(goals[barberId] ?? ''));
  };

  const cancelEditGoal = () => {
    setEditingGoal(null);
    setEditingGoalValue('');
  };

  const saveGoal = async (barberId: string) => {
    const amount = parseFloat(editingGoalValue.replace(',', '.'));
    if (isNaN(amount) || amount < 0) return;
    setSavingGoal(barberId);
    try {
      await db.upsertBarberGoal(barberId, amount);
      setGoals(prev => ({ ...prev, [barberId]: amount }));
      setEditingGoal(null);
      setEditingGoalValue('');
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setSavingGoal(null);
    }
  };

  const loadProductSalesStats = async () => {
    try {
      const data = await db.getProductSalesStats(selectedYear, selectedMonth);
      setProductSalesStats(data);
    } catch (error) {
      console.error('Error loading product sales stats:', error);
    }
  };

  const loadThresholds = async () => {
    try {
      const data = await db.getOccupancyThresholds();
      setThresholds({ good: data.good_threshold, medium: data.medium_threshold });
    } catch (error) {
      console.error('Error loading thresholds:', error);
    }
  };

  const loadRevenueData = async () => {
    setLoading(true);
    try {
      const data = await db.getMonthlyRevenue(selectedYear, selectedMonth);
      setRevenueData(data);
    } catch (error) {
      console.error('Error loading revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOccupancyData = async () => {
    setOccupancyLoading(true);
    try {
      const barberId = selectedBarber === 'all' ? undefined : selectedBarber;
      const data = await db.getMonthlyOccupancy(selectedYear, selectedMonth, barberId);
      setOccupancyData(data);
    } catch (error) {
      console.error('Error loading occupancy data:', error);
    } finally {
      setOccupancyLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('pt-PT').format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-600">A carregar dados de faturação...</p>
        </div>
      </div>
    );
  }

  const topBarber = revenueData?.barbers.reduce((prev, current) =>
    (current.total_revenue > prev.total_revenue) ? current : prev
  , revenueData.barbers[0]);

  const maxServices = Math.max(...(revenueData?.barbers.map(b => b.total_services) || [0]));
  const maxRevenue = Math.max(...(revenueData?.barbers.map(b => b.total_revenue) || [0]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Faturação</h2>
          <p className="text-gray-600">Análise financeira e estatísticas mensais</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm"
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm"
          >
            {years.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            value={selectedBarber}
            onChange={(e) => setSelectedBarber(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white text-sm"
          >
            <option value="all">Estabelecimento Geral</option>
            {barbers.map(barber => (
              <option key={barber.id} value={barber.id}>
                {barber.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-medium text-gray-600">Receita Total</h3>
            <div className="bg-green-100 rounded-full p-1.5 sm:p-2">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-gray-900 break-all">
            {formatCurrency((revenueData?.total_revenue || 0) + (productSalesStats?.total_revenue || 0))}
          </p>
          <p className="text-xs text-gray-400 mt-1">Serviços + produtos</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-medium text-gray-600">Receita de Serviços</h3>
            <div className="bg-blue-100 rounded-full p-1.5 sm:p-2">
              <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-gray-900 break-all">
            {formatCurrency(revenueData?.total_revenue || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{formatNumber(revenueData?.total_services || 0)} serviços</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-medium text-gray-600">Receita de Produtos</h3>
            <div className="bg-amber-100 rounded-full p-1.5 sm:p-2">
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-gray-900 break-all">
            {formatCurrency(productSalesStats?.total_revenue || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{formatNumber(productSalesStats?.total_units || 0)} unidades</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-medium text-gray-600">Ticket Médio</h3>
            <div className="bg-yellow-100 rounded-full p-1.5 sm:p-2">
              <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-gray-900 break-all">
            {formatCurrency(
              (revenueData?.total_services || 0) > 0
                ? ((revenueData?.total_revenue || 0) + (productSalesStats?.total_revenue || 0)) / (revenueData?.total_services || 1)
                : 0
            )}
          </p>
          <p className="text-xs text-gray-400 mt-1">Por reserva</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Taxa de Ocupação</h3>
            <p className="text-xs text-gray-500 mt-0.5">Análise de disponibilidade e utilização de tempo</p>
          </div>
          <button
            onClick={() => setIsThresholdModalOpen(true)}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Configurar limites"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4">
          {occupancyLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">A carregar...</p>
              </div>
            </div>
          ) : occupancyData ? (
            <OccupancyStats
              stats={occupancyData.overall}
              title={selectedBarber === 'all' ? 'Ocupação Geral do Estabelecimento' : `Ocupação de ${barbers.find(b => b.id === selectedBarber)?.name}`}
              barberStats={selectedBarber === 'all' ? occupancyData.by_barber : undefined}
              thresholds={thresholds}
            />
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500">Sem dados de ocupação disponíveis</p>
            </div>
          )}
        </div>
      </div>

      {revenueData && revenueData.barbers.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800 font-medium mb-2">Sem dados disponíveis</p>
          <p className="text-yellow-700 text-sm">
            Não há serviços completados para o período selecionado.
          </p>
        </div>
      ) : (
        <>
          {topBarber && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-yellow-400 rounded-full p-3">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Funcionário Destaque do Mês</h3>
                  <p className="text-sm text-gray-600">Maior receita gerada</p>
                </div>
              </div>
              <div className="ml-16">
                <p className="text-2xl font-bold text-gray-900 mb-1">{topBarber.barber_name}</p>
                <p className="text-lg text-green-600 font-semibold">
                  {formatCurrency(topBarber.total_revenue)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {topBarber.total_services} serviços realizados
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center gap-2">
              <div className="bg-blue-100 rounded-full p-1.5">
                <Target className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Objetivos Mensais</h3>
                <p className="text-xs text-gray-500">Progresso individual face ao objetivo definido</p>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {barbers.map(barber => {
                const stats = revenueData?.barbers.find(b => b.barber_id === barber.id);
                const revenue = stats?.total_revenue ?? 0;
                const goal = goals[barber.id] ?? 0;
                const progress = goal > 0 ? Math.min((revenue / goal) * 100, 100) : 0;
                const isEditing = editingGoal === barber.id;
                const isSaving = savingGoal === barber.id;

                let barColor = 'from-red-400 to-red-500';
                if (progress >= 100) barColor = 'from-emerald-400 to-emerald-500';
                else if (progress >= 60) barColor = 'from-amber-400 to-amber-500';

                return (
                  <div key={barber.id} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-gray-600">
                            {barber.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{barber.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(revenue)}
                        </span>

                        {isAdmin && (
                          isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editingGoalValue}
                                  onChange={e => setEditingGoalValue(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') saveGoal(barber.id);
                                    if (e.key === 'Escape') cancelEditGoal();
                                  }}
                                  className="w-24 pl-6 pr-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                  autoFocus
                                />
                              </div>
                              <button
                                onClick={() => saveGoal(barber.id)}
                                disabled={isSaving}
                                className="p-1 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={cancelEditGoal}
                                disabled={isSaving}
                                className="p-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditGoal(barber.id)}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200 hover:border-blue-200"
                            >
                              <Pencil className="w-3 h-3" />
                              {goal > 0 ? formatCurrency(goal) : 'Definir objetivo'}
                            </button>
                          )
                        )}

                        {!isAdmin && goal > 0 && (
                          <span className="text-xs text-gray-400">Objetivo: {formatCurrency(goal)}</span>
                        )}
                      </div>
                    </div>

                    <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${barColor} rounded-full transition-all duration-700 ease-out`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">
                        {goal > 0
                          ? `${formatCurrency(revenue)} de ${formatCurrency(goal)}`
                          : 'Sem objetivo definido'}
                      </span>
                      {goal > 0 && (
                        <span className={`text-xs font-semibold ${
                          progress >= 100 ? 'text-emerald-600' :
                          progress >= 60 ? 'text-amber-600' : 'text-red-500'
                        }`}>
                          {Math.round(progress)}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {barbers.length === 0 && (
                <div className="px-5 py-6 text-center text-gray-400 text-sm">
                  Sem funcionários registados
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Serviços Realizados por Funcionário
              </h3>
              <div className="space-y-4">
                {revenueData?.barbers.map((barber, index) => {
                  const percentage = maxServices > 0 ? (barber.total_services / maxServices) * 100 : 0;
                  return (
                    <div key={barber.barber_id} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{barber.barber_name}</span>
                        <span className="text-sm font-bold text-blue-600">{barber.total_services}</span>
                      </div>
                      <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out group-hover:from-blue-600 group-hover:to-blue-700"
                          style={{
                            width: `${percentage}%`,
                            animationDelay: `${index * 100}ms`
                          }}
                        >
                          <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {revenueData?.barbers.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">Sem dados disponíveis</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Receita Gerada por Funcionário
              </h3>
              <div className="space-y-4">
                {revenueData?.barbers.map((barber, index) => {
                  const percentage = maxRevenue > 0 ? (barber.total_revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={barber.barber_id} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{barber.barber_name}</span>
                        <span className="text-sm font-bold text-green-600">{formatCurrency(barber.total_revenue)}</span>
                      </div>
                      <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-1000 ease-out group-hover:from-green-600 group-hover:to-emerald-700"
                          style={{
                            width: `${percentage}%`,
                            animationDelay: `${index * 100}ms`
                          }}
                        >
                          <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {revenueData?.barbers.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">Sem dados disponíveis</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Estatísticas Detalhadas</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Funcionário
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serviços
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receita
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Média/Serviço
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {revenueData?.barbers.map((barber) => (
                    <tr key={barber.barber_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{barber.barber_name}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatNumber(barber.total_services)}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(barber.total_revenue)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(barber.average_per_service)}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {revenueData && revenueData.barbers.length > 0 && (
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        Total
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(revenueData.total_services)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">
                        {formatCurrency(revenueData.total_revenue)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(
                          revenueData.total_services > 0
                            ? revenueData.total_revenue / revenueData.total_services
                            : 0
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <OccupancyThresholdModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        onUpdate={() => {
          loadThresholds();
          loadOccupancyData();
        }}
      />
    </div>
  );
};

export default BillingPage;
