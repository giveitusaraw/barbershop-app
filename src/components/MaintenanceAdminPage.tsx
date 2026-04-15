import React, { useState, useEffect } from 'react';
import { Wrench, Power, PowerOff, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const MaintenanceAdminPage: React.FC = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('site_settings')
      .select('maintenance_mode')
      .eq('id', 1)
      .maybeSingle();
    if (data) setMaintenanceMode(data.maintenance_mode);
    setLoading(false);
  };

  const toggleMaintenance = async () => {
    setSaving(true);
    setShowConfirm(false);
    const newValue = !maintenanceMode;
    const { data, error } = await supabase
      .from('site_settings')
      .update({ maintenance_mode: newValue, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select('maintenance_mode')
      .maybeSingle();
    if (!error && data) {
      setMaintenanceMode(data.maintenance_mode);
    } else {
      await fetchStatus();
    }
    setSaving(false);
  };

  const handleToggleClick = () => {
    if (!maintenanceMode) {
      setShowConfirm(true);
    } else {
      toggleMaintenance();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          <div className="bg-gray-100 rounded-lg p-2">
            <Wrench className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Modo de Manutenção</h2>
            <p className="text-xs text-gray-500 mt-0.5">Controlo de acesso ao website para utilizadores</p>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${maintenanceMode ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {maintenanceMode ? 'Manutenção Ativa' : 'Site Operacional'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 max-w-xs">
                  {maintenanceMode
                    ? 'O website está em manutenção. Os utilizadores veem apenas a página de manutenção. Administradores com sessão iniciada acedem normalmente.'
                    : 'O website está a funcionar normalmente para todos os utilizadores.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleClick}
              disabled={saving}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 disabled:opacity-60 ${
                maintenanceMode
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : maintenanceMode ? (
                <Power className="w-4 h-4" />
              ) : (
                <PowerOff className="w-4 h-4" />
              )}
              {maintenanceMode ? 'Desativar Manutenção' : 'Ativar Manutenção'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
        <div className="flex gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 space-y-1.5">
            <p className="font-semibold">Como funciona o modo de manutenção:</p>
            <ul className="list-disc list-inside space-y-1 text-amber-700">
              <li>Quando ativo, todos os visitantes veem apenas uma página de manutenção</li>
              <li>A página de login continua acessivel para administradores</li>
              <li>Após iniciar sessao como administrador, o acesso ao painel e total</li>
              <li>Ao desativar, o site volta ao funcionamento normal para todos</li>
            </ul>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Ativar Manutenção?</h3>
                <p className="text-xs text-gray-500 mt-0.5">Esta acao afeta todos os visitantes do site</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              O website ficará inacessivel para os utilizadores comuns. Apenas administradores com sessao iniciada conseguirao aceder ao painel.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={toggleMaintenance}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Ativar Manutenção
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceAdminPage;
