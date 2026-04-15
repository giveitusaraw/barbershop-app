import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, Scissors, Lock, Repeat, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Service, RecurrenceType, AppointmentConflict } from '../types';
import { db } from '../lib/database';
import { calculateRecurringDates, formatDateForDisplay } from '../lib/dateUtils';

interface ManualBookingModalProps {
  date: string;
  time: string;
  barberId: string;
  barberName: string;
  onClose: () => void;
  onCreateBooking: (booking: {
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    service_id: string;
  }, recurrenceType?: RecurrenceType, dates?: string[], createWithConflicts?: boolean) => void;
  onBlockTime: (reason: string) => void;
}

const ManualBookingModal: React.FC<ManualBookingModalProps> = ({
  date,
  time,
  barberId,
  barberName,
  onClose,
  onCreateBooking,
  onBlockTime,
}) => {
  const [isBlockMode, setIsBlockMode] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [previewDates, setPreviewDates] = useState<string[]>([]);
  const [conflicts, setConflicts] = useState<AppointmentConflict[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [createWithConflicts, setCreateWithConflicts] = useState(false);

  useEffect(() => {
    loadServices();
  }, [barberId]);

  useEffect(() => {
    if (recurrenceType === 'none' || isBlockMode) {
      setPreviewDates([]);
      setConflicts([]);
      return;
    }

    const dates = calculateRecurringDates(date, recurrenceType);
    setPreviewDates(dates);

    if (dates.length > 0 && selectedServiceId) {
      checkConflicts(dates);
    }
  }, [recurrenceType, date, time, selectedServiceId, isBlockMode]);

  const checkConflicts = async (dates: string[]) => {
    if (!selectedServiceId) return;

    setCheckingConflicts(true);
    try {
      const conflictResults = await db.checkAppointmentConflicts(
        barberId,
        dates,
        time,
        selectedServiceId
      );
      setConflicts(conflictResults);
    } catch (error) {
      console.error('Error checking conflicts:', error);
    } finally {
      setCheckingConflicts(false);
    }
  };

  const loadServices = async () => {
    try {
      const [allServices, barberServiceIds] = await Promise.all([
        db.getServices(),
        db.getBarberServices(barberId)
      ]);

      const filteredServices = allServices.filter(service =>
        barberServiceIds.includes(service.id)
      );

      setServices(filteredServices);
      if (filteredServices.length > 0) {
        setSelectedServiceId(filteredServices[0].id);
      } else {
        setSelectedServiceId(null);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isBlockMode) {
      onBlockTime(blockReason.trim() || 'Bloqueado');
    } else {
      if (!customerName.trim() || !customerPhone.trim() || !selectedServiceId) {
        alert('Por favor preencha todos os campos obrigatórios');
        return;
      }

      const hasConflicts = conflicts.some(c => c.hasConflict);
      if (recurrenceType !== 'none' && hasConflicts && !createWithConflicts) {
        alert('Existem conflitos nas datas selecionadas. Por favor, marque a opção "Ignorar bloqueios" para criar as marcações possíveis (datas com marcações existentes serão sempre ignoradas) ou escolha outra recorrência.');
        return;
      }

      onCreateBooking(
        {
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_email: customerEmail.trim(),
          service_id: selectedServiceId,
        },
        recurrenceType,
        previewDates,
        createWithConflicts
      );
    }
  };

  const formattedDate = new Date(date).toLocaleDateString('pt-PT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center mb-4">
          <div className="bg-yellow-100 rounded-full p-2 mr-3">
            {isBlockMode ? <Lock className="h-6 w-6 text-yellow-600" /> : <Calendar className="h-6 w-6 text-yellow-600" />}
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {isBlockMode ? 'Bloquear Horário' : 'Nova Reserva Manual'}
          </h3>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-600" />
              <span className="font-medium text-gray-700">Funcionário:</span>
              <span className="ml-2 text-gray-900">{barberName}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-600" />
              <span className="font-medium text-gray-700">Data:</span>
              <span className="ml-2 text-gray-900">{formattedDate}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-600" />
              <span className="font-medium text-gray-700">Horário:</span>
              <span className="ml-2 text-gray-900">{time}</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isBlockMode}
              onChange={(e) => setIsBlockMode(e.target.checked)}
              className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-400"
            />
            <span className="text-sm font-medium text-gray-700">
              Bloquear horário (sem criar reserva)
            </span>
          </label>
        </div>

        {isBlockMode ? (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo do Bloqueio <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Ex: Reunião, Pausa, Formação..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              autoFocus
            />
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Nome do Cliente *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nome completo"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="h-4 w-4 inline mr-1" />
                Telefone *
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+351 912 345 678"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-1" />
                Email <span className="text-gray-400">(opcional)</span>
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="cliente@exemplo.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Scissors className="h-4 w-4 inline mr-1" />
                Serviço *
              </label>
              {loading ? (
                <div className="text-sm text-gray-500">A carregar serviços...</div>
              ) : services.length === 0 ? (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  Este funcionário não tem serviços associados. Por favor, configure os serviços na página de administração.
                </div>
              ) : (
                <select
                  value={selectedServiceId || ''}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  required
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {service.duration} min - €{service.price}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedServiceId && !isBlockMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Repeat className="h-4 w-4 inline mr-1" />
                  Recorrência
                </label>
                <select
                  value={recurrenceType}
                  onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                >
                  <option value="none">Sem recorrência</option>
                  <option value="weekly">Semanal (todas as semanas)</option>
                  <option value="biweekly">Bi-semanal (de 2 em 2 semanas)</option>
                  <option value="monthly">Mensal (todos os meses)</option>
                </select>

                {recurrenceType !== 'none' && (
                  <div className="mt-2 text-xs text-gray-500 bg-blue-50 p-2 rounded flex items-start">
                    <Info className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                    <span>As marcações serão criadas até ao final do ano ({new Date().getFullYear()})</span>
                  </div>
                )}
              </div>
            )}

            {recurrenceType !== 'none' && previewDates.length > 0 && !isBlockMode && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    Preview de Marcações
                  </h4>
                  <span className="text-xs text-gray-500">
                    {previewDates.length} marcações
                  </span>
                </div>

                {checkingConflicts ? (
                  <div className="text-sm text-gray-500 py-2">A verificar disponibilidade...</div>
                ) : (
                  <>
                    <div className="max-h-40 overflow-y-auto space-y-1 mb-3">
                      {conflicts.map((conflict, index) => (
                        <div
                          key={conflict.date}
                          className={`flex items-center justify-between text-xs p-2 rounded ${
                            conflict.hasConflict
                              ? 'bg-red-50 text-red-700'
                              : 'bg-green-50 text-green-700'
                          }`}
                        >
                          <span>{formatDateForDisplay(conflict.date)}</span>
                          {conflict.hasConflict ? (
                            <AlertCircle className="h-3 w-3" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                        </div>
                      ))}
                    </div>

                    {conflicts.some(c => c.hasConflict) && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start mb-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-yellow-800">
                            <p className="font-medium mb-1">Conflitos Detectados</p>
                            <p>Algumas datas já têm marcações ou estão bloqueadas.</p>
                          </div>
                        </div>
                        <label className="flex items-center space-x-2 cursor-pointer mt-2">
                          <input
                            type="checkbox"
                            checked={createWithConflicts}
                            onChange={(e) => setCreateWithConflicts(e.target.checked)}
                            className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-400"
                          />
                          <span className="text-xs font-medium text-yellow-800">
                            Ignorar bloqueios (datas com marcações existentes serão sempre ignoradas)
                          </span>
                        </label>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
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
            disabled={loading || (!isBlockMode && services.length === 0)}
            className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
              isBlockMode
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-yellow-500 hover:bg-yellow-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isBlockMode ? 'Bloquear' : 'Criar Reserva'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualBookingModal;
