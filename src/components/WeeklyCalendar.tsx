import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, User, Phone, X, Lock, Unlock, Clock, CreditCard as Edit2, RefreshCw, Repeat } from 'lucide-react';
import { AppointmentWithDetails, Barber } from '../types';
import { formatDateForDB } from '../lib/dateUtils';
import { db } from '../lib/database';
import { supabase } from '../lib/supabase';
import ManualBookingModal from './ManualBookingModal';
import EditAppointmentModal from './EditAppointmentModal';
import RecurringActionModal from './RecurringActionModal';
import DailyAgendaView from './DailyAgendaView';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
};

interface WeeklyCalendarProps {
  appointments: AppointmentWithDetails[];
  barbers: Barber[];
  selectedBarberId: string | null;
  onBarberChange: (barberId: string | null) => void;
  onUpdateStatus: (id: string, status: AppointmentWithDetails['status']) => void;
  onDeleteAppointment: (id: string) => void;
  onRefresh?: () => void;
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  appointments,
  barbers,
  selectedBarberId,
  onBarberChange,
  onUpdateStatus,
  onDeleteAppointment,
  onRefresh
}) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<AppointmentWithDetails | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockingSlot, setBlockingSlot] = useState<{ date: string; time: string; barberId: string } | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [unblockingSlot, setUnblockingSlot] = useState<{ date: string; time: string; barberId: string; reason: string; isWeekly?: boolean; weeklyScheduleInfo?: any } | null>(null);
  const [blockedSlots, setBlockedSlots] = useState<Map<string, { reason: string; isWeekly?: boolean }>>(new Map());
  const [showManualBookingModal, setShowManualBookingModal] = useState(false);
  const [manualBookingSlot, setManualBookingSlot] = useState<{ date: string; time: string; barberId: string } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentWithDetails | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [weeklySchedules, setWeeklySchedules] = useState<any[]>([]);
  const [weeklyOverrides, setWeeklyOverrides] = useState<Set<string>>(new Set());
  const [showRecurringCancelModal, setShowRecurringCancelModal] = useState(false);
  const [shiftTemplates, setShiftTemplates] = useState<any[]>([]);
  const [shiftRotation, setShiftRotation] = useState<any | null>(null);
  const [activeShiftsForWeek, setActiveShiftsForWeek] = useState<Map<string, any>>(new Map());
  const isMobile = useIsMobile();

  const firstAppointmentIdByEmail = useMemo(() => {
    const earliest = new Map<string, { id: string; dateTime: string }>();
    for (const apt of appointments) {
      if (!apt.customer_email) continue;
      const key = apt.customer_email.toLowerCase();
      const dateTime = `${apt.appointment_date}T${apt.appointment_time}`;
      const current = earliest.get(key);
      if (!current || dateTime < current.dateTime) {
        earliest.set(key, { id: apt.id, dateTime });
      }
    }
    const result = new Map<string, string>();
    earliest.forEach((val, key) => result.set(key, val.id));
    return result;
  }, [appointments]);

  useEffect(() => {
    setWeeklySchedules([]);
    setWeeklyOverrides(new Set());
    loadWeeklySchedules();
    loadShiftRotationData();
  }, [selectedBarberId, currentWeek]);

  useEffect(() => {
    loadBlockedSlots();
  }, [weeklySchedules, weeklyOverrides, currentWeek, selectedBarberId]);

  useEffect(() => {
    const channelName = `appointments-changes-${Math.random().toString(36).substring(7)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('WeeklyCalendar: Appointment change detected:', payload);
          if (onRefresh) {
            onRefresh();
            setLastUpdate(new Date());
          }
        }
      )
      .subscribe((status) => {
        console.log('WeeklyCalendar: Subscription status:', status);
      });

    return () => {
      console.log('WeeklyCalendar: Unsubscribing from channel');
      supabase.removeChannel(channel);
    };
  }, [onRefresh]);

  const normalizeTime = (time: string): string => {
    return time.substring(0, 5);
  };

  const loadWeeklySchedules = async () => {
    if (!selectedBarberId) {
      setWeeklySchedules([]);
      setWeeklyOverrides(new Set());
      return;
    }

    try {
      const schedules = await db.getBarberWeeklySchedule(selectedBarberId);
      setWeeklySchedules(schedules);

      const weekDates = getWeekDates(currentWeek);
      const startDate = formatDateForDB(weekDates[0]);
      const endDate = formatDateForDB(weekDates[6]);

      const overrides = await db.getWeeklyScheduleOverrides(selectedBarberId, startDate, endDate);
      const overrideSet = new Set(overrides.map(o => o.exception_date));
      setWeeklyOverrides(overrideSet);
    } catch (error) {
      console.error('Error loading weekly schedules:', error);
    }
  };

  const loadShiftRotationData = async () => {
    if (!selectedBarberId) {
      setShiftTemplates([]);
      setShiftRotation(null);
      setActiveShiftsForWeek(new Map());
      return;
    }

    try {
      const allBarbers = await db.getBarbers();
      const barber = allBarbers.find(b => b.id === selectedBarberId);

      if (!barber || !barber.use_shift_rotation) {
        setShiftTemplates([]);
        setShiftRotation(null);
        setActiveShiftsForWeek(new Map());
        return;
      }

      const [templates, rotation] = await Promise.all([
        db.getShiftTemplates(selectedBarberId),
        db.getShiftRotation(selectedBarberId)
      ]);

      setShiftTemplates(templates);
      setShiftRotation(rotation);

      const weekDates = getWeekDates(currentWeek);
      const activeShiftsMap = new Map();

      weekDates.forEach(date => {
        const dateStr = formatDateForDB(date);
        const activeShift = db.calculateActiveShift(rotation, templates, dateStr);
        if (activeShift) {
          activeShiftsMap.set(dateStr, activeShift);
        }
      });

      setActiveShiftsForWeek(activeShiftsMap);
    } catch (error) {
      console.error('Error loading shift rotation data:', error);
    }
  };

  const loadBlockedSlots = async () => {
    if (!selectedBarberId) {
      return;
    }

    try {
      const timeBlocks = await db.getTimeBlocks();
      const weekDates = getWeekDates(currentWeek);
      const weekDateStrings = weekDates.map(date => formatDateForDB(date));

      const relevantBlocks = timeBlocks.filter(block =>
        block.barber_id === selectedBarberId &&
        weekDateStrings.includes(block.block_date)
      );

      const blockedMap = new Map();
      relevantBlocks.forEach(block => {
        const normalizedTime = normalizeTime(block.block_time);
        const key = `${block.block_date}-${normalizedTime}`;
        blockedMap.set(key, { reason: block.reason, isWeekly: false });
      });

      weekDates.forEach(date => {
        const dateStr = formatDateForDB(date);
        const dayOfWeek = date.getDay();

        if (weeklyOverrides.has(dateStr)) {
          return;
        }

        const daySchedules = weeklySchedules.filter(s => s.day_of_week === dayOfWeek);

        daySchedules.forEach(schedule => {
          if (schedule.is_full_day_off) {
            const barber = barbers.find(b => b.id === selectedBarberId);
            if (barber) {
              const [workStartHour, workStartMin] = barber.work_start_time.split(':').map(Number);
              const [workEndHour, workEndMin] = barber.work_end_time.split(':').map(Number);
              const workStartMinutes = workStartHour * 60 + workStartMin;
              const workEndMinutes = workEndHour * 60 + workEndMin;

              for (let minutes = workStartMinutes; minutes < workEndMinutes; minutes += 30) {
                const hour = Math.floor(minutes / 60);
                const min = minutes % 60;
                const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                const key = `${dateStr}-${timeStr}`;
                blockedMap.set(key, { reason: schedule.reason || 'Dia de folga', isWeekly: true });
              }
            }
          } else if (schedule.block_start_time && schedule.block_end_time) {
            const [startH, startM] = schedule.block_start_time.split(':').map(Number);
            const [endH, endM] = schedule.block_end_time.split(':').map(Number);
            const startMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;

            for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
              const hour = Math.floor(minutes / 60);
              const min = minutes % 60;
              const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
              const key = `${dateStr}-${timeStr}`;
              blockedMap.set(key, { reason: schedule.reason || 'Folga semanal', isWeekly: true });
            }
          }
        });
      });

      setBlockedSlots(blockedMap);
    } catch (error) {
      console.error('Error loading blocked slots:', error);
    }
  };

  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const weekDates = getWeekDates(currentWeek);

  const getTimeSlots = () => {
    let startHour = 8;
    let endHour = 20;

    if (selectedBarberId) {
      const barber = barbers.find(b => b.id === selectedBarberId);
      if (barber) {
        if (barber.use_shift_rotation && activeShiftsForWeek.size > 0) {
          const shifts = Array.from(activeShiftsForWeek.values());
          const startTimes = shifts.map(s => {
            const [h] = s.template.work_start_time.split(':').map(Number);
            return h;
          });
          const endTimes = shifts.map(s => {
            const [h] = s.template.work_end_time.split(':').map(Number);
            return h;
          });
          startHour = Math.min(...startTimes);
          endHour = Math.max(...endTimes);
        } else {
          const [workStartHour] = barber.work_start_time.split(':').map(Number);
          const [workEndHour] = barber.work_end_time.split(':').map(Number);
          startHour = workStartHour;
          endHour = workEndHour;
        }
      }
    } else {
      const workingHours = barbers.map(barber => {
        const [startH] = barber.work_start_time.split(':').map(Number);
        const [endH] = barber.work_end_time.split(':').map(Number);
        return { start: startH, end: endH };
      });

      if (workingHours.length > 0) {
        startHour = Math.min(...workingHours.map(h => h.start));
        endHour = Math.max(...workingHours.map(h => h.end));
      }
    }

    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  };

  const timeSlots = getTimeSlots();

  const getAppointmentForSlot = (date: Date, time: string) => {
    const dateStr = formatDateForDB(date);

    const relevantAppointments = selectedBarberId
      ? appointments.filter(apt => apt.barber_id === selectedBarberId)
      : appointments;

    const [currentHour, currentMin] = time.split(':').map(Number);
    const currentMinutes = currentHour * 60 + currentMin;

    for (const apt of relevantAppointments) {
      if (apt.appointment_date !== dateStr || apt.status === 'cancelled') {
        continue;
      }

      const aptTime = apt.appointment_time.substring(0, 5);
      const [aptHour, aptMin] = aptTime.split(':').map(Number);
      const aptStartMinutes = aptHour * 60 + aptMin;
      const aptEndMinutes = aptStartMinutes + apt.service_duration;

      if (currentMinutes >= aptStartMinutes && currentMinutes < aptEndMinutes) {
        const isStart = currentMinutes === aptStartMinutes;
        const isEnd = currentMinutes + 30 >= aptEndMinutes;
        const slotPosition = Math.floor((currentMinutes - aptStartMinutes) / 30);
        const totalSlots = Math.ceil(apt.service_duration / 30);

        return {
          ...apt,
          isExtension: !isStart,
          isStart,
          isEnd,
          slotPosition,
          totalSlots
        };
      }
    }

    return null;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const isFirstAppointment = (email?: string, id?: string): boolean => {
    if (!email || !id) return false;
    return firstAppointmentIdByEmail.get(email.toLowerCase()) === id;
  };

  const getStatusColor = (status: string, customerEmail?: string, appointmentId?: string) => {
    if (status === 'confirmed' && isFirstAppointment(customerEmail, appointmentId)) {
      return 'border-emerald-300 text-emerald-800';
    }
    switch (status) {
      case 'confirmed': return 'border-blue-300 text-blue-800';
      case 'completed': return 'border-green-300 text-green-800';
      case 'cancelled': return 'border-red-300 text-red-800';
      default: return 'border-gray-300 text-gray-800';
    }
  };

  const SLOT_HEIGHT_PX = 110;

  const getStatusGradient = (status: string, totalSlots: number = 1, slotPosition: number = 0, customerEmail?: string, appointmentId?: string): React.CSSProperties => {
    const isNew = status === 'confirmed' && isFirstAppointment(customerEmail, appointmentId);
    const gradientColors: Record<string, [string, string]> = {
      confirmed: isNew ? ['#d1fae5', '#a7f3d0'] : ['#dbeafe', '#bfdbfe'],
      completed: ['#dcfce7', '#bbf7d0'],
      cancelled: ['#fee2e2', '#fecaca'],
    };
    const [from, to] = gradientColors[status] ?? ['#f3f4f6', '#e5e7eb'];
    const totalHeight = totalSlots * SLOT_HEIGHT_PX;
    return {
      background: `linear-gradient(to bottom, ${from}, ${to})`,
      backgroundSize: `100% ${totalHeight}px`,
      backgroundPosition: `0 ${-slotPosition * SLOT_HEIGHT_PX}px`,
      backgroundRepeat: 'no-repeat',
    };
  };

  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`;
  };

  const handleCancelClick = async (appointment: AppointmentWithDetails) => {
    setAppointmentToCancel(appointment);

    try {
      const isRecurring = await db.isAppointmentPartOfRecurrence(appointment.id);
      if (isRecurring) {
        setShowRecurringCancelModal(true);
      } else {
        setShowCancelModal(true);
      }
    } catch (error) {
      console.error('Error checking if appointment is recurring:', error);
      setShowCancelModal(true);
    }
  };

  const confirmCancel = () => {
    if (appointmentToCancel) {
      onDeleteAppointment(appointmentToCancel.id);
      setShowCancelModal(false);
      setAppointmentToCancel(null);
    }
  };

  const handleRecurringCancelAction = async (action: 'single' | 'future' | 'all') => {
    if (!appointmentToCancel) return;

    try {
      await db.cancelRecurringAppointments(appointmentToCancel.id, action);
      setShowRecurringCancelModal(false);
      setAppointmentToCancel(null);

      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error canceling recurring appointments:', error);
      alert('Erro ao cancelar marcações. Por favor tente novamente.');
    }
  };

  const cancelModal = () => {
    setShowCancelModal(false);
    setAppointmentToCancel(null);
  };

  const handleSlotClick = async (date: Date, time: string) => {
    if (!selectedBarberId) return;

    const dateStr = formatDateForDB(date);
    const appointment = getAppointmentForSlot(date, time);

    if (appointment) return;

    const blockKey = `${dateStr}-${time}`;
    const isBlocked = blockedSlots.has(blockKey);

    if (isBlocked) {
      const blockInfo = blockedSlots.get(blockKey);

      if (blockInfo?.isWeekly) {
        const dayOfWeek = date.getDay();
        const daySchedules = weeklySchedules.filter(s => s.day_of_week === dayOfWeek);

        let weeklyScheduleInfo = null;
        for (const schedule of daySchedules) {
          if (schedule.is_full_day_off) {
            weeklyScheduleInfo = {
              blockStartTime: undefined,
              blockEndTime: undefined,
              isFullDayOff: true,
              reason: schedule.reason || 'Dia de folga'
            };
            break;
          } else if (schedule.block_start_time && schedule.block_end_time) {
            weeklyScheduleInfo = {
              blockStartTime: schedule.block_start_time,
              blockEndTime: schedule.block_end_time,
              isFullDayOff: false,
              reason: schedule.reason || 'Folga semanal'
            };
            break;
          }
        }

        setUnblockingSlot({
          date: dateStr,
          time,
          barberId: selectedBarberId,
          reason: blockInfo?.reason || 'Folga semanal',
          isWeekly: true,
          weeklyScheduleInfo: weeklyScheduleInfo
        });
        setShowUnblockModal(true);
      } else {
        setUnblockingSlot({
          date: dateStr,
          time,
          barberId: selectedBarberId,
          reason: blockInfo?.reason || 'Bloqueado',
          isWeekly: false
        });
        setShowUnblockModal(true);
      }
    } else {
      setManualBookingSlot({ date: dateStr, time, barberId: selectedBarberId });
      setShowManualBookingModal(true);
    }
  };

  const confirmBlock = async () => {
    if (blockingSlot) {
      try {
        await db.addTimeBlock({
          barber_id: blockingSlot.barberId,
          block_date: blockingSlot.date,
          block_time: blockingSlot.time,
          reason: blockReason.trim() || 'Bloqueado'
        });
        
        await loadBlockedSlots();
      } catch (error) {
        console.error('Error blocking time:', error);
      }
      
      setShowBlockModal(false);
      setBlockingSlot(null);
      setBlockReason('');
    }
  };

  const cancelBlock = () => {
    setShowBlockModal(false);
    setBlockingSlot(null);
    setBlockReason('');
  };

  const confirmUnblock = async () => {
    if (unblockingSlot) {
      try {
        if (unblockingSlot.isWeekly && unblockingSlot.weeklyScheduleInfo) {
          await db.unlockSingleWeeklySlot(
            unblockingSlot.barberId,
            unblockingSlot.date,
            unblockingSlot.time,
            unblockingSlot.weeklyScheduleInfo
          );
          await loadWeeklySchedules();
        } else {
          await db.removeTimeBlock(unblockingSlot.barberId, unblockingSlot.date, unblockingSlot.time);
        }
        await loadBlockedSlots();
      } catch (error) {
        console.error('Error unblocking time:', error);
        alert('Erro ao desbloquear este horário. Por favor tente novamente.');
      }

      setShowUnblockModal(false);
      setUnblockingSlot(null);
    }
  };

  const cancelUnblock = () => {
    setShowUnblockModal(false);
    setUnblockingSlot(null);
  };

  const handleCreateManualBooking = async (
    booking: {
      customer_name: string;
      customer_phone: string;
      customer_email: string;
      service_id: string;
    },
    recurrenceType?: string,
    dates?: string[],
    createWithConflicts?: boolean
  ) => {
    if (!manualBookingSlot) return;

    try {
      let successMessage = '';

      if (recurrenceType && recurrenceType !== 'none' && dates && dates.length > 0) {
        const result = await db.createRecurringAppointments(
          {
            customer_name: booking.customer_name,
            customer_phone: booking.customer_phone,
            customer_email: booking.customer_email,
            service_id: booking.service_id,
            barber_id: manualBookingSlot.barberId,
            appointment_time: manualBookingSlot.time,
            appointment_date: manualBookingSlot.date,
            status: 'confirmed',
          },
          dates,
          recurrenceType as 'weekly' | 'biweekly' | 'monthly',
          createWithConflicts || false
        );

        if (result.success) {
          successMessage = `${result.totalCreated} marcações criadas com sucesso!`;
          if (result.skippedDates.length > 0) {
            successMessage += `\n\n${result.skippedDates.length} datas foram ignoradas por conflitos.`;
          }
        } else {
          alert('Não foi possível criar as marcações. Todas as datas têm conflitos.');
          return;
        }
      } else {
        await db.createAppointment({
          customer_name: booking.customer_name,
          customer_phone: booking.customer_phone,
          customer_email: booking.customer_email,
          service_id: booking.service_id,
          barber_id: manualBookingSlot.barberId,
          appointment_date: manualBookingSlot.date,
          appointment_time: manualBookingSlot.time,
        });
        successMessage = 'Reserva criada com sucesso!';
      }

      if (booking.customer_email) {
        await db.registerCustomerFromBooking(booking.customer_name, booking.customer_email, booking.customer_phone);
      }

      setShowManualBookingModal(false);
      setManualBookingSlot(null);

      await new Promise(resolve => setTimeout(resolve, 300));

      try {
        if (onRefresh) {
          await onRefresh();
        }

        if (successMessage) {
          setTimeout(() => {
            alert(successMessage);
          }, 100);
        }
      } catch (refreshError) {
        console.error('Error refreshing calendar after booking:', refreshError);
        alert('Reservas criadas mas houve um erro ao atualizar o calendário. Por favor, atualize a página.');
      }
    } catch (error) {
      console.error('Error creating manual booking:', error);
      alert('Erro ao criar reserva. Por favor tente novamente.');
    }
  };

  const handleBlockTimeFromModal = async (reason: string) => {
    if (!manualBookingSlot) return;

    try {
      await db.addTimeBlock({
        barber_id: manualBookingSlot.barberId,
        block_date: manualBookingSlot.date,
        block_time: manualBookingSlot.time,
        reason: reason,
      });

      await loadBlockedSlots();
      setShowManualBookingModal(false);
      setManualBookingSlot(null);
    } catch (error) {
      console.error('Error blocking time:', error);
      alert('Erro ao bloquear horário. Por favor tente novamente.');
    }
  };

  const handleEditClick = (appointment: AppointmentWithDetails) => {
    setEditingAppointment(appointment);
    setShowEditModal(true);
  };

  const handleUpdateAppointment = async (
    appointmentId: string,
    updates: {
      customer_name: string;
      customer_phone: string;
      customer_email: string;
      service_id: string;
    },
    action?: 'single' | 'future' | 'all'
  ) => {
    try {
      if (action) {
        await db.updateRecurringAppointments(appointmentId, action, updates);
      } else {
        await db.updateAppointment(appointmentId, updates);
      }

      setShowEditModal(false);
      setEditingAppointment(null);

      await new Promise(resolve => setTimeout(resolve, 300));

      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Erro ao atualizar reserva. Por favor tente novamente.');
    }
  };

  const getSelectedBarberName = () => {
    const barber = barbers.find(b => b.id === selectedBarberId);
    return barber ? barber.name : 'Funcionário não encontrado';
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error refreshing calendar:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUnblockFromMobile = (date: Date, time: string) => {
    handleSlotClick(date, time);
  };

  if (isMobile) {
    return (
      <>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Calendário</h2>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'A atualizar...' : 'Atualizar'}
            </button>
          </div>
          <DailyAgendaView
            appointments={appointments}
            barbers={barbers}
            selectedBarberId={selectedBarberId}
            onBarberChange={onBarberChange}
            blockedSlots={blockedSlots}
            timeSlots={timeSlots}
            activeShiftsForWeek={activeShiftsForWeek}
            weeklySchedules={weeklySchedules}
            onSlotClick={handleSlotClick}
            onEditClick={handleEditClick}
            onCancelClick={handleCancelClick}
            onUnblockClick={handleUnblockFromMobile}
          />
        </div>

        {showCancelModal && appointmentToCancel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 rounded-full p-2 mr-3">
                  <X className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Cancelar Reserva</h3>
              </div>
              <div className="mb-6">
                <p className="text-gray-600 mb-4">Tem a certeza que deseja cancelar esta reserva?</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium text-gray-700">Cliente:</span><p className="text-gray-900">{appointmentToCancel.customer_name}</p></div>
                    <div><span className="font-medium text-gray-700">Serviço:</span><p className="text-gray-900">{appointmentToCancel.service_name}</p></div>
                    <div><span className="font-medium text-gray-700">Data:</span><p className="text-gray-900">{new Date(appointmentToCancel.appointment_date).toLocaleDateString('pt-PT')}</p></div>
                    <div><span className="font-medium text-gray-700">Horário:</span><p className="text-gray-900">{appointmentToCancel.appointment_time}</p></div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button onClick={cancelModal} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
                <button onClick={confirmCancel} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Confirmar</button>
              </div>
            </div>
          </div>
        )}

        {showUnblockModal && unblockingSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 rounded-full p-2 mr-3">
                  <Unlock className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Desbloquear Horário</h3>
              </div>
              <div className="mb-6">
                <p className="text-gray-600 mb-4">Deseja desbloquear este horário?</p>
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <p><strong>Data:</strong> {new Date(unblockingSlot.date).toLocaleDateString('pt-PT')}</p>
                  <p><strong>Horário:</strong> {unblockingSlot.time}</p>
                  <p><strong>Motivo:</strong> {unblockingSlot.reason}</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button onClick={cancelUnblock} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
                <button onClick={confirmUnblock} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Desbloquear</button>
              </div>
            </div>
          </div>
        )}

        {showManualBookingModal && manualBookingSlot && (
          <ManualBookingModal
            date={manualBookingSlot.date}
            time={manualBookingSlot.time}
            barberId={manualBookingSlot.barberId}
            barberName={getSelectedBarberName()}
            onClose={() => { setShowManualBookingModal(false); setManualBookingSlot(null); }}
            onCreateBooking={handleCreateManualBooking}
            onBlockTime={handleBlockTimeFromModal}
          />
        )}

        {showEditModal && editingAppointment && (
          <EditAppointmentModal
            appointment={editingAppointment}
            barberName={barbers.find(b => b.id === editingAppointment.barber_id)?.name || ''}
            onClose={() => { setShowEditModal(false); setEditingAppointment(null); }}
            onUpdate={handleUpdateAppointment}
          />
        )}

        {showRecurringCancelModal && appointmentToCancel && (
          <RecurringActionModal
            appointmentId={appointmentToCancel.id}
            appointmentDate={appointmentToCancel.appointment_date}
            onClose={() => { setShowRecurringCancelModal(false); setAppointmentToCancel(null); }}
            onAction={handleRecurringCancelAction}
            actionType="cancel"
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Calendar Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar Funcionário:
            </label>
            <div className="flex flex-wrap gap-2">
              {barbers.map((barber) => (
                <button
                  key={barber.id}
                  onClick={() => onBarberChange(barber.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
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

          <div className="mb-4 flex items-center gap-4">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'A atualizar...' : 'Atualizar Calendário'}
            </button>
            <span className="text-sm text-gray-500">
              Última atualização: {lastUpdate.toLocaleTimeString('pt-PT')}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Calendário de {getSelectedBarberName()} - {formatWeekRange()}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentWeek(new Date())}
                className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 transition-colors font-medium"
              >
                Hoje
              </button>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Slots Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Days Header */}
            <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="w-20 flex-shrink-0 p-3 bg-gray-100 font-medium text-gray-700 text-center border-r border-gray-200">
                Horário
              </div>
              {weekDates.map((date, index) => {
                const isToday = new Date().toDateString() === date.toDateString();
                const dateStr = formatDateForDB(date);
                const activeShift = activeShiftsForWeek.get(dateStr);

                return (
                  <div key={index} className={`min-w-[160px] flex-1 p-3 text-center ${
                    isToday ? 'bg-yellow-400 text-gray-900' : 'bg-gray-50 text-gray-700'
                  }`}>
                    <div className="font-semibold">
                      {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][index]}
                    </div>
                    <div className="text-sm">
                      {date.getDate()}/{date.getMonth() + 1}
                    </div>
                    {activeShift && (
                      <div className="text-xs mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded inline-block">
                        {activeShift.template.shift_name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Time Slots */}
            {timeSlots.map((time) => (
              <div key={time} className="flex relative">
                <div className="w-20 flex-shrink-0 p-3 bg-gray-50 text-center font-medium text-gray-700 border-r border-gray-200 flex items-center justify-center">
                  {time}
                </div>
                {weekDates.map((date, dayIndex) => {
                  const appointment = getAppointmentForSlot(date, time);
                  const dateStr = formatDateForDB(date);
                  const blockKey = `${dateStr}-${time}`;
                  const isBlocked = blockedSlots.has(blockKey);

                  let isOutsideHours = false;
                  let isLunchTime = false;
                  let isDinnerTime = false;

                  if (selectedBarberId) {
                    const barber = barbers.find(b => b.id === selectedBarberId);
                    if (barber) {
                      const [timeHour, timeMin] = time.split(':').map(Number);
                      const currentMinutes = timeHour * 60 + timeMin;

                      let effectiveSchedule = {
                        work_start_time: barber.work_start_time,
                        work_end_time: barber.work_end_time,
                        lunch_start_time: barber.lunch_start_time,
                        lunch_end_time: barber.lunch_end_time,
                        has_dinner_break: barber.has_dinner_break,
                        dinner_start_time: barber.dinner_start_time,
                        dinner_end_time: barber.dinner_end_time
                      };

                      if (barber.use_shift_rotation) {
                        const activeShift = activeShiftsForWeek.get(dateStr);
                        if (activeShift && activeShift.template) {
                          effectiveSchedule = {
                            work_start_time: activeShift.template.work_start_time,
                            work_end_time: activeShift.template.work_end_time,
                            lunch_start_time: activeShift.template.lunch_start_time,
                            lunch_end_time: activeShift.template.lunch_end_time,
                            has_dinner_break: activeShift.template.has_dinner_break,
                            dinner_start_time: activeShift.template.dinner_start_time,
                            dinner_end_time: activeShift.template.dinner_end_time
                          };
                        } else {
                          isOutsideHours = true;
                        }
                      }

                      if (!isOutsideHours) {
                        const [workStartHour, workStartMin] = effectiveSchedule.work_start_time.split(':').map(Number);
                        const [workEndHour, workEndMin] = effectiveSchedule.work_end_time.split(':').map(Number);
                        const [lunchStartHour, lunchStartMin] = effectiveSchedule.lunch_start_time.split(':').map(Number);
                        const [lunchEndHour, lunchEndMin] = effectiveSchedule.lunch_end_time.split(':').map(Number);

                        const workStartMinutes = workStartHour * 60 + workStartMin;
                        const workEndMinutes = workEndHour * 60 + workEndMin;
                        const lunchStartMinutes = lunchStartHour * 60 + lunchStartMin;
                        const lunchEndMinutes = lunchEndHour * 60 + lunchEndMin;

                        if (currentMinutes < workStartMinutes || currentMinutes >= workEndMinutes) {
                          isOutsideHours = true;
                        } else if (currentMinutes >= lunchStartMinutes && currentMinutes < lunchEndMinutes) {
                          isLunchTime = true;
                        } else if (effectiveSchedule.has_dinner_break && effectiveSchedule.dinner_start_time && effectiveSchedule.dinner_end_time) {
                          const [dinnerStartHour, dinnerStartMin] = effectiveSchedule.dinner_start_time.split(':').map(Number);
                          const [dinnerEndHour, dinnerEndMin] = effectiveSchedule.dinner_end_time.split(':').map(Number);
                          const dinnerStartMinutes = dinnerStartHour * 60 + dinnerStartMin;
                          const dinnerEndMinutes = dinnerEndHour * 60 + dinnerEndMin;

                          if (currentMinutes >= dinnerStartMinutes && currentMinutes < dinnerEndMinutes) {
                            isDinnerTime = true;
                          }
                        }
                      }
                    }
                  }

                  if (appointment && appointment.isExtension) {
                    const isMiddle = !appointment.isStart && !appointment.isEnd;

                    // Slot final - apenas os botões
                    if (appointment.isEnd) {
                      return (
                        <div key={dayIndex} className="min-w-[160px] flex-1 border-r border-gray-100 h-[110px] relative">
                          <div className={`absolute inset-0 ${getStatusColor(appointment.status, appointment.customer_email, appointment.id)} flex items-center justify-center overflow-hidden p-1.5 z-10`} style={getStatusGradient(appointment.status, appointment.totalSlots, appointment.slotPosition, appointment.customer_email, appointment.id)}>
                            <div className="flex gap-1 w-full px-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(appointment);
                                }}
                                className="flex-1 px-1 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center"
                                title="Editar"
                              >
                                <Edit2 className="h-2.5 w-2.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelClick(appointment);
                                }}
                                className="px-1.5 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center"
                                title="Cancelar"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Slots intermediários - apenas continuação visual
                    return (
                      <div key={dayIndex} className="min-w-[160px] flex-1 border-r border-gray-100 h-[110px] relative">
                        <div
                          className={`absolute inset-0 ${getStatusColor(appointment.status, appointment.customer_email, appointment.id)} flex items-center justify-center overflow-hidden z-10`}
                          style={getStatusGradient(appointment.status, appointment.totalSlots, appointment.slotPosition, appointment.customer_email, appointment.id)}
                          title={`${appointment.customer_name} - ${appointment.service_name} (Slot ${appointment.slotPosition + 1}/${appointment.totalSlots})`}
                        >
                          {isMiddle && (
                            <div className="text-[8px] opacity-30">
                              ···
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (isOutsideHours) {
                    return (
                      <div key={dayIndex} className="min-w-[160px] flex-1 border-r border-b border-gray-200 h-[110px] bg-gray-100">
                      </div>
                    );
                  }

                  if (isLunchTime) {
                    return (
                      <div key={dayIndex} className="min-w-[160px] flex-1 border-r border-b border-gray-200 h-[110px] bg-gray-100 flex items-center justify-center">
                        <div className="text-xs text-gray-500 text-center">
                          <Clock className="h-2.5 w-2.5 inline mb-0.5" />
                          <div className="text-[10px]">Almoço</div>
                        </div>
                      </div>
                    );
                  }

                  if (isDinnerTime) {
                    return (
                      <div key={dayIndex} className="min-w-[160px] flex-1 border-r border-b border-gray-200 h-[110px] bg-gray-100 flex items-center justify-center">
                        <div className="text-xs text-gray-500 text-center">
                          <Clock className="h-2.5 w-2.5 inline mb-0.5" />
                          <div className="text-[10px]">Jantar</div>
                        </div>
                      </div>
                    );
                  }

                  if (isBlocked) {
                    return (
                      <div
                        key={dayIndex}
                        className="min-w-[160px] flex-1 border-r border-b border-gray-200 h-[110px] cursor-pointer hover:bg-red-50 transition-colors bg-red-100"
                        onClick={() => handleSlotClick(date, time)}
                      >
                        <div className="h-full flex flex-col justify-center items-center px-1.5 text-red-800">
                          <div className="flex items-center justify-center mb-0.5">
                            <Lock className="h-2.5 w-2.5 mr-1" />
                            <span className="font-semibold text-[10px]">Bloqueado</span>
                          </div>
                          <div className="text-center text-[9px] truncate w-full" title={blockedSlots.get(blockKey)?.reason}>
                            {blockedSlots.get(blockKey)?.reason}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (appointment) {
                    // Verificar se é uma reserva de slot único
                    const isSingleSlot = appointment.totalSlots === 1;

                    if (isSingleSlot) {
                      // Slot único - informações + botões juntos
                      return (
                        <div key={dayIndex} className="min-w-[160px] flex-1 border-r border-gray-100 h-[110px] relative">
                          <div className={`absolute inset-0 ${getStatusColor(appointment.status, appointment.customer_email, appointment.id)} flex flex-col justify-between overflow-hidden p-1.5 z-10`} style={getStatusGradient(appointment.status, appointment.totalSlots, appointment.slotPosition, appointment.customer_email, appointment.id)}>
                            <div className="space-y-0.5 flex-1">
                              <div className="font-semibold truncate text-[10px] flex items-center" title={appointment.customer_name}>
                                <User className="h-2.5 w-2.5 inline mr-0.5 flex-shrink-0" />
                                <span className="truncate">{appointment.customer_name}</span>
                                {appointment.is_part_of_recurrence && (
                                  <Repeat className="h-2.5 w-2.5 ml-1 flex-shrink-0 opacity-60" title="Marcação recorrente" />
                                )}
                              </div>
                              <div className="truncate text-[9px]" title={appointment.service_name}>
                                {appointment.service_name}
                              </div>
                              <div className="flex items-center text-[9px]" title={appointment.customer_phone}>
                                <Phone className="h-2.5 w-2.5 mr-0.5 flex-shrink-0" />
                                <span className="truncate">{appointment.customer_phone}</span>
                              </div>
                            </div>
                            <div className="flex gap-1 w-full mt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(appointment);
                                }}
                                className="flex-1 px-1 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center"
                                title="Editar"
                              >
                                <Edit2 className="h-2.5 w-2.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelClick(appointment);
                                }}
                                className="px-1.5 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center"
                                title="Cancelar"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Slot inicial de reserva multi-slot - apenas informações
                    return (
                      <div key={dayIndex} className="min-w-[160px] flex-1 border-r border-gray-100 h-[110px] relative">
                        <div className={`absolute inset-0 ${getStatusColor(appointment.status, appointment.customer_email, appointment.id)} flex flex-col justify-center overflow-hidden p-1.5 z-10`} style={getStatusGradient(appointment.status, appointment.totalSlots, appointment.slotPosition, appointment.customer_email, appointment.id)}>
                          <div className="space-y-0.5">
                            <div className="font-semibold truncate text-[10px] flex items-center" title={appointment.customer_name}>
                              <User className="h-2.5 w-2.5 inline mr-0.5 flex-shrink-0" />
                              <span className="truncate">{appointment.customer_name}</span>
                              {appointment.is_part_of_recurrence && (
                                <Repeat className="h-2.5 w-2.5 ml-1 flex-shrink-0 opacity-60" title="Marcação recorrente" />
                              )}
                            </div>
                            <div className="truncate text-[9px]" title={appointment.service_name}>
                              {appointment.service_name}
                            </div>
                            <div className="flex items-center text-[9px]" title={appointment.customer_phone}>
                              <Phone className="h-2.5 w-2.5 mr-0.5 flex-shrink-0" />
                              <span className="truncate">{appointment.customer_phone}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={dayIndex}
                      className="min-w-[160px] flex-1 border-r border-b border-gray-200 h-[110px] cursor-pointer hover:bg-gray-50 transition-colors bg-white"
                      onClick={() => handleSlotClick(date, time)}
                    >
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCancelModal && appointmentToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 rounded-full p-2 mr-3">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Cancelar Reserva</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Tem a certeza que deseja cancelar esta reserva?
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Cliente:</span>
                    <p className="text-gray-900">{appointmentToCancel.customer_name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Serviço:</span>
                    <p className="text-gray-900">{appointmentToCancel.service_name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Data:</span>
                    <p className="text-gray-900">
                      {new Date(appointmentToCancel.appointment_date).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Horário:</span>
                    <p className="text-gray-900">{appointmentToCancel.appointment_time}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmCancel}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {showBlockModal && blockingSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 rounded-full p-2 mr-3">
                <Lock className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Bloquear Horário</h3>
            </div>
            
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-sm">
                  <p><strong>Data:</strong> {new Date(blockingSlot.date).toLocaleDateString('pt-PT')}</p>
                  <p><strong>Horário:</strong> {blockingSlot.time}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo (opcional)
                </label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Ex: Reunião, Pausa..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelBlock}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmBlock}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Bloquear
              </button>
            </div>
          </div>
        </div>
      )}

      {showUnblockModal && unblockingSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 rounded-full p-2 mr-3">
                <Unlock className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Desbloquear Horário</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Deseja desbloquear este horário?
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm">
                  <p><strong>Data:</strong> {new Date(unblockingSlot.date).toLocaleDateString('pt-PT')}</p>
                  <p><strong>Horário:</strong> {unblockingSlot.time}</p>
                  <p><strong>Motivo:</strong> {unblockingSlot.reason}</p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelUnblock}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmUnblock}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Desbloquear
              </button>
            </div>
          </div>
        </div>
      )}

      {showManualBookingModal && manualBookingSlot && (
        <ManualBookingModal
          date={manualBookingSlot.date}
          time={manualBookingSlot.time}
          barberId={manualBookingSlot.barberId}
          barberName={getSelectedBarberName()}
          onClose={() => {
            setShowManualBookingModal(false);
            setManualBookingSlot(null);
          }}
          onCreateBooking={handleCreateManualBooking}
          onBlockTime={handleBlockTimeFromModal}
        />
      )}

      {showEditModal && editingAppointment && (
        <EditAppointmentModal
          appointment={editingAppointment}
          barberName={barbers.find(b => b.id === editingAppointment.barber_id)?.name || ''}
          onClose={() => {
            setShowEditModal(false);
            setEditingAppointment(null);
          }}
          onUpdate={handleUpdateAppointment}
        />
      )}

      {showRecurringCancelModal && appointmentToCancel && (
        <RecurringActionModal
          appointmentId={appointmentToCancel.id}
          appointmentDate={appointmentToCancel.appointment_date}
          onClose={() => {
            setShowRecurringCancelModal(false);
            setAppointmentToCancel(null);
          }}
          onAction={handleRecurringCancelAction}
          actionType="cancel"
        />
      )}
    </>
  );
};

export default WeeklyCalendar;