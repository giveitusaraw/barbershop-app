import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, User, Phone, CreditCard as Edit2, X, Lock, Unlock, Clock, Repeat } from 'lucide-react';
import { AppointmentWithDetails, Barber } from '../types';

interface DailyAgendaViewProps {
  appointments: AppointmentWithDetails[];
  barbers: Barber[];
  selectedBarberId: string | null;
  onBarberChange: (barberId: string | null) => void;
  blockedSlots: Map<string, { reason: string; isWeekly?: boolean }>;
  timeSlots: string[];
  activeShiftsForWeek: Map<string, any>;
  weeklySchedules: any[];
  onSlotClick: (date: Date, time: string) => void;
  onEditClick: (appointment: AppointmentWithDetails) => void;
  onCancelClick: (appointment: AppointmentWithDetails) => void;
  onUnblockClick: (date: Date, time: string) => void;
}

const SLOT_HEIGHT = 56;

const DailyAgendaView: React.FC<DailyAgendaViewProps> = ({
  appointments,
  barbers,
  selectedBarberId,
  onBarberChange,
  blockedSlots,
  timeSlots,
  activeShiftsForWeek,
  onSlotClick,
  onEditClick,
  onCancelClick,
  onUnblockClick,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const navigateDay = (direction: 'prev' | 'next') => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  const isToday = new Date().toDateString() === currentDate.toDateString();

  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const getSelectedBarberName = () => {
    const barber = barbers.find(b => b.id === selectedBarberId);
    return barber ? barber.name : 'Nenhum';
  };

  const isSlotOutsideHours = (time: string): boolean => {
    if (!selectedBarberId) return false;
    const barber = barbers.find(b => b.id === selectedBarberId);
    if (!barber) return false;

    const [timeHour, timeMin] = time.split(':').map(Number);
    const currentMinutes = timeHour * 60 + timeMin;

    let workStart: string;
    let workEnd: string;

    if (barber.use_shift_rotation) {
      const activeShift = activeShiftsForWeek.get(dateStr);
      if (!activeShift) return true;
      workStart = activeShift.template.work_start_time;
      workEnd = activeShift.template.work_end_time;
    } else {
      workStart = barber.work_start_time;
      workEnd = barber.work_end_time;
    }

    const [wsH, wsM] = workStart.split(':').map(Number);
    const [weH, weM] = workEnd.split(':').map(Number);
    return currentMinutes < wsH * 60 + wsM || currentMinutes >= weH * 60 + weM;
  };

  const isSlotBreak = (time: string): 'lunch' | 'dinner' | null => {
    if (!selectedBarberId) return null;
    const barber = barbers.find(b => b.id === selectedBarberId);
    if (!barber) return null;

    const [timeHour, timeMin] = time.split(':').map(Number);
    const currentMinutes = timeHour * 60 + timeMin;

    let lunchStart: string;
    let lunchEnd: string;
    let hasDinner = false;
    let dinnerStart = '';
    let dinnerEnd = '';

    if (barber.use_shift_rotation) {
      const activeShift = activeShiftsForWeek.get(dateStr);
      if (!activeShift) return null;
      lunchStart = activeShift.template.lunch_start_time;
      lunchEnd = activeShift.template.lunch_end_time;
      hasDinner = activeShift.template.has_dinner_break;
      dinnerStart = activeShift.template.dinner_start_time || '';
      dinnerEnd = activeShift.template.dinner_end_time || '';
    } else {
      lunchStart = barber.lunch_start_time;
      lunchEnd = barber.lunch_end_time;
      hasDinner = barber.has_dinner_break || false;
      dinnerStart = barber.dinner_start_time || '';
      dinnerEnd = barber.dinner_end_time || '';
    }

    const [lsH, lsM] = lunchStart.split(':').map(Number);
    const [leH, leM] = lunchEnd.split(':').map(Number);
    if (currentMinutes >= lsH * 60 + lsM && currentMinutes < leH * 60 + leM) return 'lunch';

    if (hasDinner && dinnerStart && dinnerEnd) {
      const [dsH, dsM] = dinnerStart.split(':').map(Number);
      const [deH, deM] = dinnerEnd.split(':').map(Number);
      if (currentMinutes >= dsH * 60 + dsM && currentMinutes < deH * 60 + deM) return 'dinner';
    }

    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'border-blue-300 text-blue-900';
      case 'completed': return 'border-green-300 text-green-900';
      case 'cancelled': return 'border-red-300 text-red-900';
      default: return 'border-gray-300 text-gray-900';
    }
  };

  const getStatusGradient = (status: string): React.CSSProperties => {
    switch (status) {
      case 'confirmed': return { background: 'linear-gradient(to bottom, #eff6ff, #dbeafe)' };
      case 'completed': return { background: 'linear-gradient(to bottom, #f0fdf4, #dcfce7)' };
      case 'cancelled': return { background: 'linear-gradient(to bottom, #fef2f2, #fee2e2)' };
      default: return { background: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const relevantAppointments = selectedBarberId
    ? appointments.filter(apt => apt.barber_id === selectedBarberId && apt.appointment_date === dateStr && apt.status !== 'cancelled')
    : appointments.filter(apt => apt.appointment_date === dateStr && apt.status !== 'cancelled');

  const dayAppointments = appointments.filter(apt => {
    if (apt.appointment_date !== dateStr || apt.status === 'cancelled') return false;
    if (selectedBarberId) return apt.barber_id === selectedBarberId;
    return true;
  });

  const appointmentStartTimes = new Set(
    relevantAppointments.map(apt => apt.appointment_time.substring(0, 5))
  );

  const occupiedByExtension = new Set<string>();
  relevantAppointments.forEach(apt => {
    const [h, m] = apt.appointment_time.substring(0, 5).split(':').map(Number);
    const startMin = h * 60 + m;
    for (let offset = 30; offset < apt.service_duration; offset += 30) {
      const slotMin = startMin + offset;
      const slotH = Math.floor(slotMin / 60).toString().padStart(2, '0');
      const slotM = (slotMin % 60).toString().padStart(2, '0');
      occupiedByExtension.add(`${slotH}:${slotM}`);
    }
  });

  const visibleSlots = timeSlots.filter(time => {
    if (occupiedByExtension.has(time)) return false;
    const blockKey = `${dateStr}-${time}`;
    const isBlocked = blockedSlots.has(blockKey);
    const outsideHours = isSlotOutsideHours(time);
    const hasAppointment = appointmentStartTimes.has(time);
    if (outsideHours && !isBlocked && !hasAppointment) return false;
    return true;
  });

  return (
    <div className="flex flex-col">
      {/* Barber Selector */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Funcionário:</label>
        <div className="flex flex-wrap gap-2">
          {barbers.map((barber) => (
            <button
              key={barber.id}
              onClick={() => onBarberChange(barber.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                selectedBarberId === barber.id
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {barber.name}
            </button>
          ))}
        </div>
      </div>

      {/* Day Navigation */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDay('prev')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>

          <div className="text-center">
            <div className={`text-lg font-bold ${isToday ? 'text-yellow-600' : 'text-gray-900'}`}>
              {dayNames[currentDate.getDay()]}, {currentDate.getDate()} {monthNames[currentDate.getMonth()]}
            </div>
            <div className="text-xs text-gray-500">{currentDate.getFullYear()}</div>
          </div>

          <button
            onClick={() => navigateDay('next')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {!isToday && (
          <div className="mt-2 text-center">
            <button
              onClick={goToday}
              className="px-4 py-1.5 bg-yellow-400 text-gray-900 rounded-lg text-sm font-medium hover:bg-yellow-500 transition-colors"
            >
              Hoje
            </button>
          </div>
        )}
      </div>

      {/* Agenda Content */}
      <div className="flex-1 overflow-y-auto">
        {!selectedBarberId ? (
          <div className="p-6 text-center text-gray-500">
            <p className="text-sm">Selecione um funcionário para ver o calendário</p>
          </div>
        ) : dayAppointments.length === 0 && timeSlots.every(t => {
          const blockKey = `${dateStr}-${t}`;
          return !blockedSlots.has(blockKey) && isSlotOutsideHours(t);
        }) ? (
          <div className="p-6 text-center">
            <div className="bg-gray-50 rounded-xl p-8">
              <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Sem horário de trabalho</p>
              <p className="text-xs text-gray-400 mt-1">para {getSelectedBarberName()} neste dia</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visibleSlots.map((time) => {
              const blockKey = `${dateStr}-${time}`;
              const isBlocked = blockedSlots.has(blockKey);
              const blockInfo = blockedSlots.get(blockKey);
              const outsideHours = isSlotOutsideHours(time);
              const breakType = isSlotBreak(time);

              const slotAppointments = relevantAppointments.filter(apt => {
                return apt.appointment_time.substring(0, 5) === time;
              });

              const slotHeightMultiplier = slotAppointments.length > 0
                ? Math.ceil(slotAppointments[0].service_duration / 30)
                : 1;

              const rowHeight = slotAppointments.length > 0
                ? slotHeightMultiplier * SLOT_HEIGHT
                : SLOT_HEIGHT;

              return (
                <div key={time} className="flex items-stretch border-b border-gray-100" style={{ minHeight: `${rowHeight}px` }}>
                  <div className="w-14 flex-shrink-0 flex items-start justify-center bg-gray-50 border-r border-gray-100 pt-4">
                    <span className="text-xs font-medium text-gray-500">{time}</span>
                  </div>

                  <div className="flex-1 px-3 py-2">
                    {breakType === 'lunch' && (
                      <div className="flex items-center gap-2 h-full text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Pausa para almoço</span>
                      </div>
                    )}

                    {breakType === 'dinner' && (
                      <div className="flex items-center gap-2 h-full text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Pausa para jantar</span>
                      </div>
                    )}

                    {!breakType && isBlocked && (
                      <div
                        className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-red-100 transition-colors h-full"
                        onClick={() => onUnblockClick(currentDate, time)}
                      >
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-red-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-800">Bloqueado</p>
                            {blockInfo?.reason && (
                              <p className="text-xs text-red-600">{blockInfo.reason}</p>
                            )}
                          </div>
                        </div>
                        <Unlock className="h-4 w-4 text-red-400 flex-shrink-0" />
                      </div>
                    )}

                    {!breakType && !isBlocked && slotAppointments.length === 0 && !outsideHours && (
                      <div
                        className="h-full min-h-[40px] rounded-lg border border-dashed border-gray-200 cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center"
                        onClick={() => onSlotClick(currentDate, time)}
                      >
                        <span className="text-xs text-gray-400">+ Reserva manual</span>
                      </div>
                    )}

                    {!breakType && slotAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className={`rounded-lg border px-3 py-2.5 mb-1 h-full flex flex-col justify-between ${getStatusColor(apt.status)}`}
                        style={getStatusGradient(apt.status)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <User className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="font-semibold text-sm truncate">{apt.customer_name}</span>
                              {apt.is_part_of_recurrence && (
                                <Repeat className="h-3 w-3 flex-shrink-0 opacity-60" title="Recorrente" />
                              )}
                            </div>
                            <p className="text-xs opacity-80 truncate mb-1">{apt.service_name}</p>
                            <div className="flex items-center gap-1 text-xs opacity-70">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span>{apt.customer_phone}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-xs">
                                {apt.appointment_time.substring(0, 5)} · {apt.service_duration}min
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getStatusBadge(apt.status)}`}>
                                {getStatusLabel(apt.status)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); onEditClick(apt); }}
                              className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); onCancelClick(apt); }}
                              className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                              title="Cancelar"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyAgendaView;
