import React, { useState, useEffect } from 'react';
import { Edit2, User, Phone, Mail, Scissors, Calendar, Clock } from 'lucide-react';
import { AppointmentWithDetails, Service } from '../types';
import { db } from '../lib/database';
import RecurringActionModal from './RecurringActionModal';

interface EditAppointmentModalProps {
  appointment: AppointmentWithDetails;
  barberName: string;
  onClose: () => void;
  onUpdate: (appointmentId: string, updates: {
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    service_id: string;
  }, action?: 'single' | 'future' | 'all') => void;
}

const EditAppointmentModal: React.FC<EditAppointmentModalProps> = ({
  appointment,
  barberName,
  onClose,
  onUpdate,
}) => {
  const [customerName, setCustomerName] = useState(appointment.customer_name);
  const [customerPhone, setCustomerPhone] = useState(appointment.customer_phone);
  const [customerEmail, setCustomerEmail] = useState(appointment.customer_email || '');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(appointment.service_id);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    loadServices();
    checkIfRecurring();
  }, []);

  const checkIfRecurring = async () => {
    try {
      const recurring = await db.isAppointmentPartOfRecurrence(appointment.id);
      setIsRecurring(recurring);
    } catch (error) {
      console.error('Error checking if appointment is recurring:', error);
    }
  };

  const loadServices = async () => {
    try {
      const servicesData = await db.getServices();
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Por favor preencha todos os campos obrigatórios');
      return;
    }

    if (isRecurring) {
      setShowRecurringModal(true);
    } else {
      onUpdate(appointment.id, {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim(),
        service_id: selectedServiceId,
      });
    }
  };

  const handleRecurringAction = (action: 'single' | 'future' | 'all') => {
    setShowRecurringModal(false);
    onUpdate(
      appointment.id,
      {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim(),
        service_id: selectedServiceId,
      },
      action
    );
  };

  const formattedDate = new Date(appointment.appointment_date).toLocaleDateString('pt-PT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const hasChanges =
    customerName !== appointment.customer_name ||
    customerPhone !== appointment.customer_phone ||
    customerEmail !== (appointment.customer_email || '') ||
    selectedServiceId !== appointment.service_id;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center mb-4">
          <div className="bg-blue-100 rounded-full p-2 mr-3">
            <Edit2 className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Editar Reserva</h3>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="text-xs text-gray-500 mb-2 font-medium uppercase">
            Informação Fixa
          </div>
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
              <span className="ml-2 text-gray-900">{appointment.appointment_time}</span>
            </div>
          </div>
        </div>

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Scissors className="h-4 w-4 inline mr-1" />
              Serviço *
            </label>
            {loading ? (
              <div className="text-sm text-gray-500">A carregar serviços...</div>
            ) : (
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
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
        </div>

        {hasChanges && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              Tem alterações não guardadas
            </p>
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
            disabled={loading || !hasChanges}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Guardar Alterações
          </button>
        </div>
      </div>

      {showRecurringModal && (
        <RecurringActionModal
          appointmentId={appointment.id}
          appointmentDate={appointment.appointment_date}
          onClose={() => setShowRecurringModal(false)}
          onAction={handleRecurringAction}
          actionType="edit"
        />
      )}
    </div>
  );
};

export default EditAppointmentModal;
