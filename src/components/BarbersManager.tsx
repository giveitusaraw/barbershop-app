import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Save, X, Users, Clock } from 'lucide-react';
import { Barber, Service } from '../types';
import { db } from '../lib/database';

interface BarbersManagerProps {
  onBarbersChange?: () => void;
}

interface BarberCardProps {
  barber: Barber;
  services: Service[];
  onEdit: (barber: Barber) => void;
  onDelete: (barber: Barber) => void;
}

const BarberCard: React.FC<BarberCardProps> = ({ barber, services, onEdit, onDelete }) => {
  const [barberServices, setBarberServices] = useState<Service[]>([]);

  useEffect(() => {
    const loadBarberServices = async () => {
      const serviceIds = await db.getBarberServices(barber.id);
      const filteredServices = services.filter(s => serviceIds.includes(s.id));
      setBarberServices(filteredServices);
    };
    loadBarberServices();
  }, [barber.id, services]);

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center">
          <div className="bg-yellow-100 rounded-full p-2 mr-3">
            <Users className="h-5 w-5 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{barber.name}</h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(barber)}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
            title="Editar"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(barber)}
            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium text-gray-700">Especialidades:</span>
          <p className="text-gray-600">{barber.specialties}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Experiência:</span>
          <p className="text-gray-600">{barber.experience}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Horário:</span>
          <p className="text-gray-600">{barber.work_start_time} - {barber.work_end_time}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Almoço:</span>
          <p className="text-gray-600">{barber.lunch_start_time} - {barber.lunch_end_time}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Antecedência mínima:</span>
          <p className="text-gray-600">{barber.leadtime_minutes} minutos</p>
        </div>
        {barber.has_dinner_break && barber.dinner_start_time && barber.dinner_end_time && (
          <div>
            <span className="font-medium text-gray-700">Jantar:</span>
            <p className="text-gray-600">{barber.dinner_start_time} - {barber.dinner_end_time}</p>
          </div>
        )}
        <div className="pt-2 border-t">
          <span className="font-medium text-gray-700">Serviços:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {barberServices.map((service) => (
              <span
                key={service.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800"
              >
                {service.name}
              </span>
            ))}
            {barberServices.length === 0 && (
              <span className="text-gray-500 text-xs">Nenhum serviço atribuído</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const BarbersManager: React.FC<BarbersManagerProps> = ({ onBarbersChange }) => {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    specialties: '',
    experience: '',
    workStartTime: '09:00',
    workEndTime: '18:00',
    lunchStartTime: '12:30',
    lunchEndTime: '13:30',
    hasDinnerBreak: false,
    dinnerStartTime: '19:00',
    dinnerEndTime: '20:00',
    leadtimeMinutes: 0,
    useShiftRotation: false
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<any[]>([]);
  const [shiftTemplates, setShiftTemplates] = useState<any[]>([]);
  const [shiftRotation, setShiftRotation] = useState<any>({
    isActive: true,
    rotationType: 'weekly',
    startDate: new Date().toISOString().split('T')[0],
    shiftSequence: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await loadBarbers();
      await loadServices();
    };
    loadData();
  }, []);

  const loadBarbers = async () => {
    const data = await db.getBarbers();
    setBarbers(data);
    if (onBarbersChange) {
      onBarbersChange();
    }
  };

  const loadServices = async () => {
    const data = await db.getServices();
    setServices(data);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      specialties: '',
      experience: '',
      workStartTime: '09:00',
      workEndTime: '18:00',
      lunchStartTime: '12:30',
      lunchEndTime: '13:30',
      hasDinnerBreak: false,
      dinnerStartTime: '19:00',
      dinnerEndTime: '20:00',
      leadtimeMinutes: 0,
      useShiftRotation: false
    });
    setSelectedServices([]);
    setWeeklySchedule([]);
    setShiftTemplates([]);
    setShiftRotation({
      isActive: true,
      rotationType: 'weekly',
      startDate: new Date().toISOString().split('T')[0],
      shiftSequence: []
    });
    setShowAddForm(false);
    setEditingBarber(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      const barberData: any = {
        name: formData.name,
        specialties: formData.specialties,
        experience: formData.experience,
        work_start_time: formData.workStartTime,
        work_end_time: formData.workEndTime,
        lunch_start_time: formData.lunchStartTime,
        lunch_end_time: formData.lunchEndTime,
        has_dinner_break: formData.hasDinnerBreak,
        leadtime_minutes: formData.leadtimeMinutes,
        use_shift_rotation: formData.useShiftRotation
      };

      if (formData.hasDinnerBreak) {
        barberData.dinner_start_time = formData.dinnerStartTime;
        barberData.dinner_end_time = formData.dinnerEndTime;
      } else {
        barberData.dinner_start_time = null;
        barberData.dinner_end_time = null;
      }

      let barberId: string;
      if (editingBarber) {
        await db.updateBarber(editingBarber.id, barberData);
        barberId = editingBarber.id;
      } else {
        const beforeBarbers = await db.getBarbers();
        await db.addBarber(barberData);
        const afterBarbers = await db.getBarbers();
        const newBarber = afterBarbers.find(b => !beforeBarbers.some(existing => existing.id === b.id));
        barberId = newBarber?.id || '';
      }

      if (barberId) {
        await db.updateBarberServices(barberId, selectedServices);
        await db.updateBarberWeeklySchedule(barberId, weeklySchedule);

        if (formData.useShiftRotation) {
          await db.saveShiftTemplates(barberId, shiftTemplates);

          const updatedRotation = await db.getShiftRotation(barberId);
          if (updatedRotation && updatedRotation.shift_sequence.length > 0) {
            await db.saveShiftRotation(barberId, {
              is_active: shiftRotation.isActive,
              rotation_type: shiftRotation.rotationType,
              start_date: shiftRotation.startDate,
              shift_sequence: updatedRotation.shift_sequence
            });
          } else {
            const allTemplates = await db.getShiftTemplates(barberId);
            if (allTemplates.length > 0) {
              await db.saveShiftRotation(barberId, {
                is_active: true,
                rotation_type: 'weekly',
                start_date: new Date().toISOString().split('T')[0],
                shift_sequence: allTemplates.map(t => t.id)
              });
            }
          }
        } else {
          await db.deleteShiftRotation(barberId);
        }
      }

      await loadBarbers();
      resetForm();
      alert(editingBarber ? 'Funcionário atualizado com sucesso!' : 'Funcionário adicionado com sucesso!');
    } catch (error) {
      console.error('Error saving barber:', error);
      alert('Erro ao guardar funcionário. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (barber: Barber) => {
    setEditingBarber(barber);
    setFormData({
      name: barber.name,
      specialties: barber.specialties,
      experience: barber.experience,
      workStartTime: barber.work_start_time,
      workEndTime: barber.work_end_time,
      lunchStartTime: barber.lunch_start_time,
      lunchEndTime: barber.lunch_end_time,
      hasDinnerBreak: barber.has_dinner_break,
      dinnerStartTime: barber.dinner_start_time || '19:00',
      dinnerEndTime: barber.dinner_end_time || '20:00',
      leadtimeMinutes: barber.leadtime_minutes || 0,
      useShiftRotation: barber.use_shift_rotation || false
    });

    const barberServices = await db.getBarberServices(barber.id);
    setSelectedServices(barberServices);

    const barberWeeklySchedule = await db.getBarberWeeklySchedule(barber.id);
    setWeeklySchedule(barberWeeklySchedule);

    if (barber.use_shift_rotation) {
      const templates = await db.getShiftTemplates(barber.id);
      setShiftTemplates(templates);

      const rotation = await db.getShiftRotation(barber.id);
      if (rotation) {
        const validShiftIds = rotation.shift_sequence.filter(
          (id: string) => id && !id.startsWith('temp-')
        );
        setShiftRotation({
          isActive: rotation.is_active,
          rotationType: rotation.rotation_type,
          startDate: rotation.start_date,
          shiftSequence: validShiftIds
        });
      }
    }

    setShowAddForm(true);
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const addWeeklyScheduleEntry = (dayOfWeek: number) => {
    setWeeklySchedule(prev => [
      ...prev,
      {
        day_of_week: dayOfWeek,
        is_full_day_off: false,
        block_start_time: '09:00',
        block_end_time: '18:00',
        reason: ''
      }
    ]);
  };

  const removeWeeklyScheduleEntry = (index: number) => {
    setWeeklySchedule(prev => prev.filter((_, i) => i !== index));
  };

  const updateWeeklyScheduleEntry = (index: number, field: string, value: any) => {
    setWeeklySchedule(prev => prev.map((entry, i) => {
      if (i === index) {
        return { ...entry, [field]: value };
      }
      return entry;
    }));
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[dayOfWeek];
  };

  const getSchedulesByDay = (dayOfWeek: number) => {
    return weeklySchedule
      .map((entry, index) => ({ ...entry, originalIndex: index }))
      .filter(entry => entry.day_of_week === dayOfWeek);
  };

  const addShiftTemplate = () => {
    setShiftTemplates(prev => [
      ...prev,
      {
        shift_name: `Turno ${prev.length + 1}`,
        work_start_time: '09:00',
        work_end_time: '18:00',
        lunch_start_time: '12:30',
        lunch_end_time: '13:30',
        has_dinner_break: false,
        dinner_start_time: '19:00',
        dinner_end_time: '20:00'
      }
    ]);
  };

  const removeShiftTemplate = (index: number) => {
    setShiftTemplates(prev => prev.filter((_, i) => i !== index));
  };

  const updateShiftTemplate = (index: number, field: string, value: any) => {
    setShiftTemplates(prev => prev.map((entry, i) => {
      if (i === index) {
        return { ...entry, [field]: value };
      }
      return entry;
    }));
  };

  const handleDelete = async (barber: Barber) => {
    if (window.confirm(`Tem a certeza que deseja eliminar o funcionário "${barber.name}"?`)) {
      await db.deleteBarber(barber.id);
      await loadBarbers();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Gestão de Funcionários</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Funcionário
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingBarber ? 'Editar Funcionário' : 'Adicionar Novo Funcionário'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experiência *
                </label>
                <input
                  type="text"
                  placeholder="ex: 10 anos"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Especialidades *
              </label>
              <input
                type="text"
                placeholder="ex: Cortes clássicos, Barbas, Tratamentos"
                value={formData.specialties}
                onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Início do Trabalho *
                </label>
                <input
                  type="time"
                  value={formData.workStartTime}
                  onChange={(e) => setFormData({ ...formData, workStartTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fim do Trabalho *
                </label>
                <input
                  type="time"
                  value={formData.workEndTime}
                  onChange={(e) => setFormData({ ...formData, workEndTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Início do Almoço *
                </label>
                <input
                  type="time"
                  value={formData.lunchStartTime}
                  onChange={(e) => setFormData({ ...formData, lunchStartTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fim do Almoço *
                </label>
                <input
                  type="time"
                  value={formData.lunchEndTime}
                  onChange={(e) => setFormData({ ...formData, lunchEndTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leadtime (minutos) *
              </label>
              <input
                type="number"
                min="0"
                value={formData.leadtimeMinutes}
                onChange={(e) => setFormData({ ...formData, leadtimeMinutes: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Tempo mínimo, em minutos, com que uma reserva deve ser feita antes do horário escolhido. Por exemplo, se definir 30 minutos, os clientes só poderão reservar até 30 minutos antes do início do serviço.
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="hasDinnerBreak"
                  checked={formData.hasDinnerBreak}
                  onChange={(e) => setFormData({ ...formData, hasDinnerBreak: e.target.checked })}
                  className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-300 rounded"
                />
                <label htmlFor="hasDinnerBreak" className="ml-2 text-sm font-medium text-gray-700">
                  Tem pausa para jantar
                </label>
              </div>

              {formData.hasDinnerBreak && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Início do Jantar *
                    </label>
                    <input
                      type="time"
                      value={formData.dinnerStartTime}
                      onChange={(e) => setFormData({ ...formData, dinnerStartTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      required={formData.hasDinnerBreak}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fim do Jantar *
                    </label>
                    <input
                      type="time"
                      value={formData.dinnerEndTime}
                      onChange={(e) => setFormData({ ...formData, dinnerEndTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      required={formData.hasDinnerBreak}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="useShiftRotation"
                  checked={formData.useShiftRotation}
                  onChange={(e) => setFormData({ ...formData, useShiftRotation: e.target.checked })}
                  className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-300 rounded"
                />
                <label htmlFor="useShiftRotation" className="ml-2 text-sm font-medium text-gray-700">
                  Usar turnos rotativos (horários alternados por semana)
                </label>
              </div>

              {formData.useShiftRotation && (
                <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Templates de Turno</h4>
                      <button
                        type="button"
                        onClick={addShiftTemplate}
                        className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded transition-colors"
                      >
                        + Adicionar Turno
                      </button>
                    </div>

                    {shiftTemplates.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">Nenhum turno configurado. Adicione pelo menos um turno.</p>
                    ) : (
                      <div className="space-y-4">
                        {shiftTemplates.map((template, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start justify-between mb-3">
                              <input
                                type="text"
                                value={template.shift_name}
                                onChange={(e) => updateShiftTemplate(index, 'shift_name', e.target.value)}
                                className="text-lg font-semibold bg-transparent border-b border-gray-300 focus:border-yellow-400 outline-none"
                                placeholder="Nome do turno"
                              />
                              <button
                                type="button"
                                onClick={() => removeShiftTemplate(index)}
                                className="text-red-600 hover:bg-red-100 p-1 rounded transition-colors"
                                title="Remover turno"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Início</label>
                                <input
                                  type="time"
                                  value={template.work_start_time}
                                  onChange={(e) => updateShiftTemplate(index, 'work_start_time', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Fim</label>
                                <input
                                  type="time"
                                  value={template.work_end_time}
                                  onChange={(e) => updateShiftTemplate(index, 'work_end_time', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Almoço Início</label>
                                <input
                                  type="time"
                                  value={template.lunch_start_time}
                                  onChange={(e) => updateShiftTemplate(index, 'lunch_start_time', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Almoço Fim</label>
                                <input
                                  type="time"
                                  value={template.lunch_end_time}
                                  onChange={(e) => updateShiftTemplate(index, 'lunch_end_time', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400"
                                />
                              </div>
                            </div>

                            <div className="mt-3">
                              <div className="flex items-center mb-2">
                                <input
                                  type="checkbox"
                                  id={`shift-dinner-${index}`}
                                  checked={template.has_dinner_break}
                                  onChange={(e) => updateShiftTemplate(index, 'has_dinner_break', e.target.checked)}
                                  className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-300 rounded"
                                />
                                <label htmlFor={`shift-dinner-${index}`} className="ml-2 text-xs text-gray-700">
                                  Tem pausa para jantar
                                </label>
                              </div>

                              {template.has_dinner_break && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Jantar Início</label>
                                    <input
                                      type="time"
                                      value={template.dinner_start_time}
                                      onChange={(e) => updateShiftTemplate(index, 'dinner_start_time', e.target.value)}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Jantar Fim</label>
                                    <input
                                      type="time"
                                      value={template.dinner_end_time}
                                      onChange={(e) => updateShiftTemplate(index, 'dinner_end_time', e.target.value)}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {shiftTemplates.length >= 2 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-3">Configuração de Rotação</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-700 mb-2">Tipo de Rotação</label>
                          <select
                            value={shiftRotation.rotationType}
                            onChange={(e) => setShiftRotation({ ...shiftRotation, rotationType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                          >
                            <option value="weekly">Semanal (alterna toda semana)</option>
                            <option value="biweekly">Quinzenal (alterna a cada 2 semanas)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-700 mb-2">Data de Início</label>
                          <input
                            type="date"
                            value={shiftRotation.startDate}
                            onChange={(e) => setShiftRotation({ ...shiftRotation, startDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm text-gray-700 mb-2">Sequência de Turnos</label>
                        <p className="text-xs text-gray-500 mb-2">Selecione os turnos na ordem em que devem alternar</p>

                        <div className="space-y-2">
                          {shiftTemplates.map((template, index) => {
                            const hasId = template.id && !template.id.startsWith('temp-');
                            return (
                              <div key={index} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`rotation-${index}`}
                                  checked={hasId && shiftRotation.shiftSequence.includes(template.id!)}
                                  disabled={!hasId}
                                  onChange={(e) => {
                                    if (!hasId) return;
                                    if (e.target.checked) {
                                      setShiftRotation({
                                        ...shiftRotation,
                                        shiftSequence: [...shiftRotation.shiftSequence, template.id!]
                                      });
                                    } else {
                                      setShiftRotation({
                                        ...shiftRotation,
                                        shiftSequence: shiftRotation.shiftSequence.filter((id: string) => id !== template.id)
                                      });
                                    }
                                  }}
                                  className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-300 rounded disabled:opacity-50"
                                />
                                <label htmlFor={`rotation-${index}`} className={`ml-2 text-sm ${hasId ? 'text-gray-700' : 'text-gray-400'}`}>
                                  {template.shift_name} {!hasId && '(salve primeiro)'}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Serviços que pode realizar (opcional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`service-${service.id}`}
                      checked={selectedServices.includes(service.id)}
                      onChange={() => toggleService(service.id)}
                      className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-300 rounded"
                    />
                    <label htmlFor={`service-${service.id}`} className="ml-2 text-sm text-gray-700">
                      {service.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Folgas Semanais e Horários Bloqueados (opcional)
              </label>
              <p className="text-xs text-gray-500 mb-4">
                Configure dias inteiros ou horários específicos de folga que se repetem toda semana
              </p>

              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 0].map((dayOfWeek) => {
                  const daySchedules = getSchedulesByDay(dayOfWeek);
                  return (
                    <div key={dayOfWeek} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{getDayName(dayOfWeek)}</h4>
                        <button
                          type="button"
                          onClick={() => addWeeklyScheduleEntry(dayOfWeek)}
                          className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded transition-colors"
                        >
                          + Adicionar Bloqueio
                        </button>
                      </div>

                      {daySchedules.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">Sem bloqueios configurados</p>
                      ) : (
                        <div className="space-y-3">
                          {daySchedules.map((schedule) => (
                            <div key={schedule.originalIndex} className="bg-white rounded p-3 border border-gray-200">
                              <div className="flex items-start gap-3">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`fullday-${schedule.originalIndex}`}
                                      checked={schedule.is_full_day_off}
                                      onChange={(e) => updateWeeklyScheduleEntry(schedule.originalIndex, 'is_full_day_off', e.target.checked)}
                                      className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-300 rounded"
                                    />
                                    <label htmlFor={`fullday-${schedule.originalIndex}`} className="ml-2 text-sm text-gray-700">
                                      Dia inteiro
                                    </label>
                                  </div>

                                  {!schedule.is_full_day_off && (
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-xs text-gray-600 mb-1">Início</label>
                                        <input
                                          type="time"
                                          value={schedule.block_start_time || '09:00'}
                                          onChange={(e) => updateWeeklyScheduleEntry(schedule.originalIndex, 'block_start_time', e.target.value)}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-600 mb-1">Fim</label>
                                        <input
                                          type="time"
                                          value={schedule.block_end_time || '18:00'}
                                          onChange={(e) => updateWeeklyScheduleEntry(schedule.originalIndex, 'block_end_time', e.target.value)}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Motivo (opcional)</label>
                                    <input
                                      type="text"
                                      placeholder="ex: Folga semanal, Reunião"
                                      value={schedule.reason || ''}
                                      onChange={(e) => updateWeeklyScheduleEntry(schedule.originalIndex, 'reason', e.target.value)}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                    />
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeWeeklyScheduleEntry(schedule.originalIndex)}
                                  className="text-red-600 hover:bg-red-100 p-1 rounded transition-colors"
                                  title="Remover bloqueio"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'A guardar...' : (editingBarber ? 'Guardar Alterações' : 'Adicionar Funcionário')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barbers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {barbers.map((barber) => (
          <BarberCard
            key={barber.id}
            barber={barber}
            services={services}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {barbers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhum funcionário disponível. Adicione o primeiro funcionário!</p>
        </div>
      )}
    </div>
  );
};

export default BarbersManager;