import React, { useState, useEffect, useCallback } from 'react';
import { AppointmentWithDetails, Barber } from '../types';
import { db } from '../lib/database';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import WeeklyCalendar from './WeeklyCalendar';

const CalendarAdminPage: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [filteredBarbers, setFilteredBarbers] = useState<Barber[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  const loadData = useCallback(async () => {
    try {
      const [appointmentsData, barbersData] = await Promise.all([
        db.getAppointments(),
        db.getBarbers()
      ]);
      setAppointments(appointmentsData);
      setBarbers(barbersData);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const channelId = Math.random().toString(36).substring(7);

    const appointmentsChannel = supabase
      .channel(`calendar-appointments-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('CalendarAdminPage: Appointment change detected:', payload);
          loadData();
        }
      )
      .subscribe((status) => {
        console.log('CalendarAdminPage: Appointments subscription status:', status);
      });

    const barbersChannel = supabase
      .channel(`calendar-barbers-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'barbers'
        },
        () => {
          console.log('CalendarAdminPage: Barbers change detected');
          loadData();
        }
      )
      .subscribe((status) => {
        console.log('CalendarAdminPage: Barbers subscription status:', status);
      });

    const templatesChannel = supabase
      .channel(`calendar-templates-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'barber_shift_templates'
        },
        () => {
          console.log('CalendarAdminPage: Templates change detected');
          loadData();
        }
      )
      .subscribe((status) => {
        console.log('CalendarAdminPage: Templates subscription status:', status);
      });

    const rotationsChannel = supabase
      .channel(`calendar-rotations-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'barber_shift_rotations'
        },
        () => {
          console.log('CalendarAdminPage: Rotations change detected');
          loadData();
        }
      )
      .subscribe((status) => {
        console.log('CalendarAdminPage: Rotations subscription status:', status);
      });

    return () => {
      console.log('CalendarAdminPage: Cleaning up subscriptions');
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(barbersChannel);
      supabase.removeChannel(templatesChannel);
      supabase.removeChannel(rotationsChannel);
    };
  }, [loadData]);

  useEffect(() => {
    if (barbers.length > 0 && currentUser) {
      const accessible = currentUser.role === 'admin'
        ? barbers
        : barbers.filter(barber => currentUser.barber_ids?.includes(barber.id));

      setFilteredBarbers(accessible);

      if (accessible.length > 0 && !selectedBarberId) {
        setSelectedBarberId(accessible[0].id);
      } else if (accessible.length > 0 && selectedBarberId && !accessible.find(b => b.id === selectedBarberId)) {
        setSelectedBarberId(accessible[0].id);
      }
    }
  }, [barbers, currentUser, selectedBarberId]);

  const updateStatus = async (id: string, status: AppointmentWithDetails['status']) => {
    try {
      await db.updateAppointmentStatus(id, status);
      await loadData();
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
  };

  const deleteAppointment = async (id: string) => {
    if (window.confirm('Tem a certeza que deseja eliminar esta reserva?')) {
      try {
        await db.deleteAppointment(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting appointment:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-600">A carregar calendário...</p>
        </div>
      </div>
    );
  }

  if (filteredBarbers.length === 0 && !loading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800 font-medium mb-2">Sem acesso a funcionários</p>
        <p className="text-yellow-700 text-sm">
          Você não tem permissão para visualizar nenhum calendário de funcionário. Entre em contato com um administrador para obter acesso.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calendário de Reservas</h2>
        <p className="text-gray-600">
          {currentUser?.role === 'admin'
            ? 'Visualize e gerencie todas as reservas dos funcionários'
            : `Acesso a ${filteredBarbers.length} funcionário(s)`}
        </p>
      </div>

      <WeeklyCalendar
        appointments={appointments}
        barbers={filteredBarbers}
        selectedBarberId={selectedBarberId}
        onBarberChange={setSelectedBarberId}
        onUpdateStatus={updateStatus}
        onDeleteAppointment={deleteAppointment}
        onRefresh={loadData}
      />
    </div>
  );
};

export default CalendarAdminPage;
