import React, { useState, useEffect } from 'react';
import { Shield, Plus, CreditCard as Edit2, Trash2, Lock, Eye, EyeOff, Check, X, Key, Users } from 'lucide-react';
import { db } from '../lib/database';
import { AdminAccount, Barber } from '../types';

const AccountsAdminPage: React.FC = () => {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AdminAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'staff' as 'admin' | 'staff',
    selectedBarberIds: [] as string[]
  });

  const [permissionBarberIds, setPermissionBarberIds] = useState<string[]>([]);

  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [accountsData, barbersData] = await Promise.all([
        db.getAccountsWithPermissions(),
        db.getBarbers()
      ]);
      setAccounts(accountsData);
      setBarbers(barbersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('As passwords não coincidem!');
      return;
    }

    if (formData.password.length < 8) {
      alert('A password deve ter pelo menos 8 caracteres!');
      return;
    }

    if (!/[A-Za-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      alert('A password deve conter letras e números!');
      return;
    }

    if (formData.role === 'staff' && formData.selectedBarberIds.length === 0) {
      alert('Funcionários devem ter acesso a pelo menos um funcionário!');
      return;
    }

    try {
      await db.createAccount(formData.username, formData.password, formData.role);

      if (formData.role === 'staff' && formData.selectedBarberIds.length > 0) {
        const newAccounts = await db.getAccounts();
        const newAccount = newAccounts.find(a => a.username === formData.username);
        if (newAccount) {
          await db.updateAccountBarberPermissions(newAccount.id, formData.selectedBarberIds);
        }
      }

      alert('Conta criada com sucesso!');
      setShowCreateModal(false);
      setFormData({ username: '', password: '', confirmPassword: '', role: 'staff', selectedBarberIds: [] });
      loadData();
    } catch (error: any) {
      alert(error.message || 'Erro ao criar conta');
    }
  };

  const handleToggleStatus = async (account: AdminAccount) => {
    try {
      await db.updateAccountStatus(account.id, !account.is_active);
      alert(`Conta ${!account.is_active ? 'ativada' : 'desativada'} com sucesso!`);
      loadData();
    } catch (error: any) {
      alert(error.message || 'Erro ao atualizar estado da conta');
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedAccount) return;

    if (selectedAccount.role === 'staff' && permissionBarberIds.length === 0) {
      alert('Funcionários devem ter acesso a pelo menos um funcionário!');
      return;
    }

    try {
      await db.updateAccountBarberPermissions(selectedAccount.id, permissionBarberIds);
      alert('Permissões atualizadas com sucesso!');
      setShowPermissionsModal(false);
      setSelectedAccount(null);
      setPermissionBarberIds([]);
      loadData();
    } catch (error: any) {
      alert(error.message || 'Erro ao atualizar permissões');
    }
  };

  const openPermissionsModal = (account: AdminAccount) => {
    setSelectedAccount(account);
    setPermissionBarberIds(account.barber_ids || []);
    setShowPermissionsModal(true);
  };

  const toggleBarberSelection = (barberId: string) => {
    if (formData.selectedBarberIds.includes(barberId)) {
      setFormData({
        ...formData,
        selectedBarberIds: formData.selectedBarberIds.filter(id => id !== barberId)
      });
    } else {
      setFormData({
        ...formData,
        selectedBarberIds: [...formData.selectedBarberIds, barberId]
      });
    }
  };

  const togglePermissionBarber = (barberId: string) => {
    if (permissionBarberIds.includes(barberId)) {
      setPermissionBarberIds(permissionBarberIds.filter(id => id !== barberId));
    } else {
      setPermissionBarberIds([...permissionBarberIds, barberId]);
    }
  };

  const getBarberNames = (barberIds: string[] | undefined): string => {
    if (!barberIds || barberIds.length === 0) return 'Nenhum';
    const names = barberIds.map(id => {
      const barber = barbers.find(b => b.id === id);
      return barber?.name || 'Desconhecido';
    });
    return names.join(', ');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccount) return;

    if (resetPassword !== resetConfirmPassword) {
      alert('As passwords não coincidem!');
      return;
    }

    if (resetPassword.length < 8) {
      alert('A password deve ter pelo menos 8 caracteres!');
      return;
    }

    if (!/[A-Za-z]/.test(resetPassword) || !/[0-9]/.test(resetPassword)) {
      alert('A password deve conter letras e números!');
      return;
    }

    try {
      await db.updateAccountPassword(selectedAccount.id, resetPassword);
      alert('Password redefinida com sucesso!');
      setShowResetPasswordModal(false);
      setSelectedAccount(null);
      setResetPassword('');
      setResetConfirmPassword('');
    } catch (error: any) {
      alert(error.message || 'Erro ao redefinir password');
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;

    try {
      await db.deleteAccount(selectedAccount.id);
      alert('Conta eliminada com sucesso!');
      setShowDeleteModal(false);
      setSelectedAccount(null);
      loadData();
    } catch (error: any) {
      alert(error.message || 'Erro ao eliminar conta');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'staff':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'staff':
        return 'Funcionário';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">A carregar contas...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Contas</p>
              <p className="text-3xl font-bold text-gray-900">{accounts.length}</p>
            </div>
            <Shield className="h-12 w-12 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Contas Ativas</p>
              <p className="text-3xl font-bold text-green-600">
                {accounts.filter(a => a.is_active).length}
              </p>
            </div>
            <Check className="h-12 w-12 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Contas Inativas</p>
              <p className="text-3xl font-bold text-red-600">
                {accounts.filter(a => !a.is_active).length}
              </p>
            </div>
            <X className="h-12 w-12 text-red-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Gestão de Contas</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 transition-colors font-medium"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nova Conta
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acesso
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criada em
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{account.username}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(account.role)}`}>
                      {getRoleLabel(account.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">
                      {account.role === 'admin' ? (
                        <span className="text-green-600 font-medium">Todos</span>
                      ) : (
                        <span className="text-gray-600">
                          {account.barber_ids && account.barber_ids.length > 0
                            ? `${account.barber_ids.length} func.`
                            : 'Nenhum'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      account.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {account.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {new Date(account.created_at).toLocaleDateString('pt-PT')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleToggleStatus(account)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          account.is_active
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={account.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {account.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => openPermissionsModal(account)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Gerir Permissões"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAccount(account);
                          setShowResetPasswordModal(true);
                        }}
                        className="p-1.5 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Redefinir Password"
                      >
                        <Lock className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAccount(account);
                          setShowDeleteModal(true);
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {accounts.length === 0 && (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma conta criada ainda.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-yellow-600 hover:text-yellow-700 font-medium"
              >
                Criar primeira conta
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="bg-yellow-100 rounded-full p-2 mr-3">
                <Plus className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Criar Nova Conta</h3>
            </div>

            <form onSubmit={handleCreateAccount}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    required
                    minLength={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent pr-10"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres, com letras e números</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent pr-10"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Função
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any, selectedBarberIds: [] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  >
                    <option value="staff">Funcionário</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                {formData.role === 'staff' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permissões de Acesso aos Funcionários
                    </label>
                    <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                      {barbers.length === 0 ? (
                        <p className="text-sm text-gray-500">Nenhum funcionário disponível</p>
                      ) : (
                        <div className="space-y-2">
                          {barbers.map((barber) => (
                            <label key={barber.id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                              <input
                                type="checkbox"
                                checked={formData.selectedBarberIds.includes(barber.id)}
                                onChange={() => toggleBarberSelection(barber.id)}
                                className="w-4 h-4 text-yellow-400 border-gray-300 rounded focus:ring-yellow-400"
                              />
                              <span className="ml-2 text-sm text-gray-700">{barber.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Selecione pelo menos um funcionário
                    </p>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ username: '', password: '', confirmPassword: '', role: 'staff', selectedBarberIds: [] });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 transition-colors font-medium"
                >
                  Criar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResetPasswordModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 rounded-full p-2 mr-3">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Redefinir Password</h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Definir nova password para: <strong>{selectedAccount.username}</strong>
            </p>

            <form onSubmit={handleResetPassword}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nova Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent pr-10"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres, com letras e números</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Nova Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent pr-10"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPasswordModal(false);
                    setSelectedAccount(null);
                    setResetPassword('');
                    setResetConfirmPassword('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Redefinir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 rounded-full p-2 mr-3">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Eliminar Conta</h3>
            </div>

            <p className="text-gray-600 mb-4">
              Tem a certeza que deseja eliminar a conta <strong>{selectedAccount.username}</strong>? Esta ação não pode ser desfeita.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedAccount(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showPermissionsModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 rounded-full p-2 mr-3">
                <Key className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Gerir Permissões</h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Definir permissões de acesso para: <strong>{selectedAccount.username}</strong>
              <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(selectedAccount.role)}`}>
                {getRoleLabel(selectedAccount.role)}
              </span>
            </p>

            {selectedAccount.role === 'admin' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  Administradores têm acesso automático a todos os funcionários.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Funcionários Acessíveis
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-64 overflow-y-auto">
                  {barbers.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhum funcionário disponível</p>
                  ) : (
                    <div className="space-y-2">
                      {barbers.map((barber) => (
                        <label key={barber.id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={permissionBarberIds.includes(barber.id)}
                            onChange={() => togglePermissionBarber(barber.id)}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{barber.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {permissionBarberIds.length} funcionário(s) selecionado(s)
                </p>
              </div>
            )}

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedAccount(null);
                  setPermissionBarberIds([]);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdatePermissions}
                disabled={selectedAccount.role === 'admin'}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Atualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsAdminPage;
