import React, { useState, useEffect } from 'react';
import { Settings, Check, X } from 'lucide-react';
import { db } from '../lib/database';

interface OccupancyThresholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export const OccupancyThresholdModal: React.FC<OccupancyThresholdModalProps> = ({ isOpen, onClose, onUpdate }) => {
  const [goodThreshold, setGoodThreshold] = useState(70);
  const [mediumThreshold, setMediumThreshold] = useState(50);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadThresholds();
    }
  }, [isOpen]);

  const loadThresholds = async () => {
    setLoading(true);
    try {
      const thresholds = await db.getOccupancyThresholds();
      setGoodThreshold(thresholds.good_threshold);
      setMediumThreshold(thresholds.medium_threshold);
    } catch (err) {
      console.error('Error loading thresholds:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError(null);

    if (mediumThreshold >= goodThreshold) {
      setError('O limite médio deve ser menor que o limite bom');
      return;
    }

    if (mediumThreshold < 0 || goodThreshold > 100) {
      setError('Os limites devem estar entre 0% e 100%');
      return;
    }

    setSaving(true);
    try {
      await db.updateOccupancyThresholds(goodThreshold, mediumThreshold);
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      console.error('Error saving thresholds:', err);
      setError('Erro ao guardar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Configuração de Limites</h3>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limite Bom (Verde)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={goodThreshold}
                      onChange={(e) => setGoodThreshold(Number(e.target.value))}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                    <span className="text-gray-600 font-medium">%</span>
                    <div className="w-8 h-8 bg-green-600 rounded"></div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Ocupação ≥ {goodThreshold}% será considerada boa (verde)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limite Médio (Amarelo)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={mediumThreshold}
                      onChange={(e) => setMediumThreshold(Number(e.target.value))}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                    <span className="text-gray-600 font-medium">%</span>
                    <div className="w-8 h-8 bg-yellow-600 rounded"></div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Ocupação entre {mediumThreshold}% e {goodThreshold - 1}% será considerada média (amarelo)
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700 mb-1">Limite Baixo (Vermelho)</div>
                      <p className="text-xs text-gray-500">
                        Ocupação &lt; {mediumThreshold}% será considerada baixa (vermelho)
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-red-600 rounded"></div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            {saving ? 'A guardar...' : 'Guardar'}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
