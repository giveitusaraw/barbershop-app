import React, { useState, useEffect } from 'react';
import { Settings, Check, X } from 'lucide-react';
import { db } from '../lib/database';

interface OccupancyThresholdSettingsProps {
  onUpdate?: () => void;
}

export const OccupancyThresholdSettings: React.FC<OccupancyThresholdSettingsProps> = ({ onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [goodThreshold, setGoodThreshold] = useState(70);
  const [mediumThreshold, setMediumThreshold] = useState(50);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadThresholds();
  }, []);

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
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error saving thresholds:', err);
      setError('Erro ao guardar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    loadThresholds();
    setIsEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Configuração de Limites</h3>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
          >
            Editar Limites
          </button>
        )}
      </div>

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
              disabled={!isEditing}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              disabled={!isEditing}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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

      {isEditing && (
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
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
      )}
    </div>
  );
};
