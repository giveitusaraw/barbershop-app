import React, { useState, useEffect } from 'react';
import { Repeat, AlertCircle } from 'lucide-react';
import { db } from '../lib/database';

interface RecurringActionModalProps {
  appointmentId: string;
  appointmentDate: string;
  onClose: () => void;
  onAction: (action: 'single' | 'future' | 'all') => void;
  actionType: 'edit' | 'cancel';
}

const RecurringActionModal: React.FC<RecurringActionModalProps> = ({
  appointmentId,
  appointmentDate,
  onClose,
  onAction,
  actionType,
}) => {
  const [selectedAction, setSelectedAction] = useState<'single' | 'future' | 'all'>('single');
  const [appointmentCounts, setAppointmentCounts] = useState({
    single: 1,
    future: 0,
    all: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointmentCounts();
  }, [appointmentId]);

  const loadAppointmentCounts = async () => {
    try {
      const recurrenceInfo = await db.getRecurrenceInfo(appointmentId);
      if (!recurrenceInfo) {
        setLoading(false);
        return;
      }

      const allAppointments = await db.getRecurringGroupAppointments(
        recurrenceInfo.recurringGroupId
      );

      const futureAppointments = allAppointments.filter(
        (apt) => apt.appointment_date >= appointmentDate && apt.status !== 'cancelled'
      );

      const totalAppointments = allAppointments.filter(
        (apt) => apt.status !== 'cancelled'
      );

      setAppointmentCounts({
        single: 1,
        future: futureAppointments.length,
        all: totalAppointments.length,
      });
    } catch (error) {
      console.error('Error loading appointment counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    onAction(selectedAction);
  };

  const actionText = actionType === 'edit' ? 'editar' : 'cancelar';
  const actionTextCap = actionType === 'edit' ? 'Editar' : 'Cancelar';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className="bg-blue-100 rounded-full p-2 mr-3">
            <Repeat className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {actionTextCap} Marcação Recorrente
          </h3>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800">
            Esta marcação faz parte de uma série recorrente. Escolha como deseja {actionText}:
          </p>
        </div>

        {loading ? (
          <div className="text-center py-4 text-gray-500">A carregar...</div>
        ) : (
          <div className="space-y-3 mb-6">
            <label className="flex items-start space-x-3 cursor-pointer p-3 border-2 rounded-lg hover:bg-gray-50 transition-colors border-gray-200">
              <input
                type="radio"
                name="action"
                value="single"
                checked={selectedAction === 'single'}
                onChange={() => setSelectedAction('single')}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Apenas esta marcação</div>
                <div className="text-sm text-gray-500">
                  {actionTextCap} somente a marcação selecionada ({appointmentCounts.single}{' '}
                  marcação)
                </div>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer p-3 border-2 rounded-lg hover:bg-gray-50 transition-colors border-gray-200">
              <input
                type="radio"
                name="action"
                value="future"
                checked={selectedAction === 'future'}
                onChange={() => setSelectedAction('future')}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Esta e todas as futuras</div>
                <div className="text-sm text-gray-500">
                  {actionTextCap} esta marcação e todas as marcações futuras da série (
                  {appointmentCounts.future} marcações)
                </div>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer p-3 border-2 rounded-lg hover:bg-gray-50 transition-colors border-gray-200">
              <input
                type="radio"
                name="action"
                value="all"
                checked={selectedAction === 'all'}
                onChange={() => setSelectedAction('all')}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Todas da série</div>
                <div className="text-sm text-gray-500">
                  {actionTextCap} todas as marcações desta série recorrente (
                  {appointmentCounts.all} marcações)
                </div>
              </div>
            </label>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
              actionType === 'edit'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-red-600 hover:bg-red-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecurringActionModal;
