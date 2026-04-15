import { supabase } from './supabase';

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  created_at?: string;
}

export interface Barber {
  id: string;
  name: string;
  specialties: string;
  experience: string;
  work_start_time: string;
  work_end_time: string;
  lunch_start_time: string;
  lunch_end_time: string;
  has_dinner_break: boolean;
  dinner_start_time?: string;
  dinner_end_time?: string;
  leadtime_minutes: number;
  use_shift_rotation: boolean;
  created_at?: string;
}

export interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  service_id: string;
  barber_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  created_at?: string;
}

export interface AppointmentWithDetails extends Appointment {
  service_name: string;
  service_price: number;
  service_duration: number;
  barber_name: string;
}

export interface TimeBlock {
  id: string;
  barber_id: string;
  block_date: string;
  block_time: string;
  reason: string;
  created_at?: string;
}

export interface HomepageSettings {
  id: string;
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  hero_button_text: string;
  why_choose_title: string;
  why_choose_description: string;
  feature_1_title: string;
  feature_1_description: string;
  feature_1_icon: string;
  feature_2_title: string;
  feature_2_description: string;
  feature_2_icon: string;
  feature_3_title: string;
  feature_3_description: string;
  feature_3_icon: string;
  services_section_title: string;
  services_section_description: string;
  contact_section_title: string;
  contact_section_description: string;
  contact_address: string;
  contact_phone: string;
  contact_email: string;
  hours_weekday: string;
  hours_weekend: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  page_bg_color?: string;
  services_section_bg_color?: string;
  contact_section_bg_color?: string;
  card_bg_color?: string;
  text_heading_color?: string;
  text_body_color?: string;
  logo_text: string;
  logo_image_url?: string;
  use_custom_logo: boolean;
  hero_gradient_from?: string;
  hero_gradient_via?: string;
  hero_gradient_to?: string;
  hero_gradient_direction?: string;
  hero_background_image_url?: string;
  use_background_image?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FeaturedService extends Service {
  display_order: number;
  featured_id?: string;
}

export interface SMSTemplate {
  id: string;
  name: string;
  message_text: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductSale {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sold_at: string;
  created_at?: string;
  product_name?: string;
}

export interface ProductSalesStats {
  total_revenue: number;
  total_units: number;
  sales: ProductSale[];
  by_product: { product_id: string; product_name: string; total_units: number; total_revenue: number }[];
}

class DatabaseService {
  async getServices(): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('id');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  }

  async addService(service: Omit<Service, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase
      .from('services')
      .insert([service]);

    if (error) throw error;
  }

  async updateService(id: string, service: Omit<Service, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase
      .from('services')
      .update(service)
      .eq('id', id);

    if (error) throw error;
  }

  async deleteService(id: string): Promise<void> {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getBarbers(): Promise<Barber[]> {
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .order('id');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching barbers:', error);
      return [];
    }
  }

  async addBarber(barber: Omit<Barber, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase
      .from('barbers')
      .insert([barber]);

    if (error) {
      console.error('Error adding barber:', error);
      throw new Error(`Erro ao adicionar funcionário: ${error.message}`);
    }
  }

  async updateBarber(id: string, barber: Omit<Barber, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase
      .from('barbers')
      .update(barber)
      .eq('id', id);

    if (error) {
      console.error('Error updating barber:', error);
      throw new Error(`Erro ao atualizar funcionário: ${error.message}`);
    }
  }

  async deleteBarber(id: string): Promise<void> {
    const { error } = await supabase
      .from('barbers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getAppointments(): Promise<AppointmentWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services!appointments_service_id_fkey (
            name,
            price,
            duration
          ),
          barbers!appointments_barber_id_fkey (
            name
          )
        `)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: true });

      if (error) throw error;

      const appointments: AppointmentWithDetails[] = (data || []).map((item: any) => ({
        id: item.id,
        customer_name: item.customer_name,
        customer_phone: item.customer_phone,
        customer_email: item.customer_email,
        service_id: item.service_id,
        barber_id: item.barber_id,
        appointment_date: item.appointment_date,
        appointment_time: item.appointment_time,
        status: item.status,
        created_at: item.created_at,
        service_name: item.services?.name || '',
        service_price: item.services?.price || 0,
        service_duration: item.services?.duration || 0,
        barber_name: item.barbers?.name || ''
      }));

      return appointments;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }
  }

  async createAppointment(appointment: Omit<Appointment, 'id' | 'created_at' | 'status'>): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .insert([{
        ...appointment,
        status: 'confirmed'
      }]);

    if (error) throw error;
  }

  async updateAppointmentStatus(id: string, status: Appointment['status']): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  }

  async updateAppointment(id: string, appointment: Partial<Omit<Appointment, 'id' | 'created_at'>>): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .update(appointment)
      .eq('id', id);

    if (error) throw error;
  }

  async deleteAppointment(id: string): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getTimeBlocks(): Promise<TimeBlock[]> {
    try {
      const { data, error } = await supabase
        .from('time_blocks')
        .select('*')
        .order('block_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching time blocks:', error);
      return [];
    }
  }

  async addTimeBlock(timeBlock: Omit<TimeBlock, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase
      .from('time_blocks')
      .insert([timeBlock]);

    if (error) throw error;
  }

  async removeTimeBlock(barberId: string, date: string, time: string): Promise<void> {
    const { error } = await supabase
      .from('time_blocks')
      .delete()
      .eq('barber_id', barberId)
      .eq('block_date', date)
      .eq('block_time', time);

    if (error) throw error;
  }

  async isTimeBlocked(barberId: string, date: string, time: string): Promise<TimeBlock | null> {
    try {
      const { data, error } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('barber_id', barberId)
        .eq('block_date', date)
        .eq('block_time', time)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking time block:', error);
      return null;
    }
  }

  async getBarberServices(barberId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('barber_services')
        .select('service_id')
        .eq('barber_id', barberId);

      if (error) throw error;
      return (data || []).map((item: any) => item.service_id);
    } catch (error) {
      console.error('Error fetching barber services:', error);
      return [];
    }
  }

  async updateBarberServices(barberId: string, serviceIds: string[]): Promise<void> {
    const { error: deleteError } = await supabase
      .from('barber_services')
      .delete()
      .eq('barber_id', barberId);

    if (deleteError) {
      console.error('Error deleting barber services:', deleteError);
      throw new Error(`Erro ao remover serviços anteriores: ${deleteError.message}`);
    }

    if (serviceIds.length > 0) {
      const barberServices = serviceIds.map(serviceId => ({
        barber_id: barberId,
        service_id: serviceId
      }));

      const { error: insertError } = await supabase
        .from('barber_services')
        .insert(barberServices);

      if (insertError) {
        console.error('Error inserting barber services:', insertError);
        throw new Error(`Erro ao adicionar serviços: ${insertError.message}`);
      }
    }
  }

  async getBarbersForService(serviceId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('barber_services')
        .select('barber_id')
        .eq('service_id', serviceId);

      if (error) throw error;
      return (data || []).map((item: any) => item.barber_id);
    } catch (error) {
      console.error('Error fetching barbers for service:', error);
      return [];
    }
  }

  async getShiftTemplates(barberId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('barber_shift_templates')
        .select('*')
        .eq('barber_id', barberId)
        .order('display_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching shift templates:', error);
      return [];
    }
  }

  async saveShiftTemplates(barberId: string, templates: any[]): Promise<void> {
    try {
      const { data: oldTemplates } = await supabase
        .from('barber_shift_templates')
        .select('id, shift_name, display_order')
        .eq('barber_id', barberId)
        .order('display_order');

      const { data: oldRotation } = await supabase
        .from('barber_shift_rotations')
        .select('shift_sequence')
        .eq('barber_id', barberId)
        .maybeSingle();

      const oldIdToName = new Map();
      if (oldTemplates) {
        oldTemplates.forEach(t => oldIdToName.set(t.id, t.shift_name));
      }

      const oldSequenceNames: string[] = [];
      if (oldRotation && oldRotation.shift_sequence) {
        oldRotation.shift_sequence.forEach((id: string) => {
          const name = oldIdToName.get(id);
          if (name) oldSequenceNames.push(name);
        });
      }

      const { error: deleteError } = await supabase
        .from('barber_shift_templates')
        .delete()
        .eq('barber_id', barberId);

      if (deleteError) throw deleteError;

      if (templates.length > 0) {
        const templatesWithBarberId = templates.map((t, index) => ({
          barber_id: barberId,
          shift_name: t.shift_name,
          work_start_time: t.work_start_time,
          work_end_time: t.work_end_time,
          lunch_start_time: t.lunch_start_time,
          lunch_end_time: t.lunch_end_time,
          has_dinner_break: t.has_dinner_break,
          dinner_start_time: t.dinner_start_time || null,
          dinner_end_time: t.dinner_end_time || null,
          display_order: index
        }));

        const { data: newTemplates, error: insertError } = await supabase
          .from('barber_shift_templates')
          .insert(templatesWithBarberId)
          .select('id, shift_name');

        if (insertError) throw insertError;

        if (newTemplates && oldSequenceNames.length > 0) {
          const nameToNewId = new Map();
          newTemplates.forEach(t => nameToNewId.set(t.shift_name, t.id));

          const newSequence: string[] = [];
          oldSequenceNames.forEach(name => {
            const newId = nameToNewId.get(name);
            if (newId) newSequence.push(newId);
          });

          if (newSequence.length > 0) {
            await supabase
              .from('barber_shift_rotations')
              .update({
                shift_sequence: newSequence,
                updated_at: new Date().toISOString()
              })
              .eq('barber_id', barberId);
          }
        }
      }
    } catch (error) {
      console.error('Error saving shift templates:', error);
      throw error;
    }
  }

  async getShiftRotation(barberId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('barber_shift_rotations')
        .select('*')
        .eq('barber_id', barberId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching shift rotation:', error);
      return null;
    }
  }

  async saveShiftRotation(barberId: string, rotation: any): Promise<void> {
    try {
      const existing = await this.getShiftRotation(barberId);

      const rotationData = {
        barber_id: barberId,
        is_active: rotation.is_active,
        rotation_type: rotation.rotation_type,
        start_date: rotation.start_date,
        shift_sequence: rotation.shift_sequence,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        const { error } = await supabase
          .from('barber_shift_rotations')
          .update(rotationData)
          .eq('barber_id', barberId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('barber_shift_rotations')
          .insert(rotationData);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving shift rotation:', error);
      throw error;
    }
  }

  async deleteShiftRotation(barberId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('barber_shift_rotations')
        .delete()
        .eq('barber_id', barberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting shift rotation:', error);
      throw error;
    }
  }

  calculateActiveShift(rotation: any, templates: any[], date: string): any | null {
    if (!rotation || !rotation.is_active || !templates || templates.length === 0) {
      return null;
    }

    const targetDate = new Date(date + 'T00:00:00');
    const startDate = new Date(rotation.start_date + 'T00:00:00');

    if (targetDate < startDate) {
      return null;
    }

    const getMondayOfWeek = (d: Date): Date => {
      const day = d.getDay();
      const diff = (day === 0 ? -6 : 1) - day;
      const monday = new Date(d);
      monday.setDate(d.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      return monday;
    };

    const startMonday = getMondayOfWeek(startDate);
    const targetMonday = getMondayOfWeek(targetDate);

    const daysDiff = Math.floor((targetMonday.getTime() - startMonday.getTime()) / (1000 * 60 * 60 * 24));

    let periodIndex = 0;
    if (rotation.rotation_type === 'weekly') {
      const weeksDiff = Math.floor(daysDiff / 7);
      periodIndex = weeksDiff % rotation.shift_sequence.length;
    } else if (rotation.rotation_type === 'biweekly') {
      const biweeksDiff = Math.floor(daysDiff / 14);
      periodIndex = biweeksDiff % rotation.shift_sequence.length;
    }

    const shiftId = rotation.shift_sequence[periodIndex];
    const template = templates.find(t => t.id === shiftId);

    if (!template) {
      return null;
    }

    const periodDays = rotation.rotation_type === 'weekly' ? 7 : 14;
    const periodStartDays = Math.floor(daysDiff / periodDays) * periodDays;
    const periodStart = new Date(startMonday.getTime() + periodStartDays * 24 * 60 * 60 * 1000);
    const periodEnd = new Date(periodStart.getTime() + (periodDays - 1) * 24 * 60 * 60 * 1000);

    return {
      template,
      weekNumber: periodIndex + 1,
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: periodEnd.toISOString().split('T')[0]
    };
  }

  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  async getAccounts(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('admin_accounts')
        .select('id, username, role, is_active, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return [];
    }
  }

  async validateLogin(username: string, password: string): Promise<any | null> {
    try {
      console.log('[LOGIN] Attempting login for username:', username);
      const passwordHash = await this.hashPassword(password);
      console.log('[LOGIN] Password hash generated:', passwordHash);

      const { data, error } = await supabase
        .from('admin_accounts')
        .select('id, username, role, is_active, created_at, updated_at')
        .eq('username', username)
        .eq('password_hash', passwordHash)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('[LOGIN] Supabase error:', error);
        return null;
      }

      console.log('[LOGIN] Query result:', data ? 'User found' : 'No user found');

      if (data) {
        console.log('[LOGIN] User data:', { id: data.id, username: data.username, role: data.role, is_active: data.is_active });
        const barberIds = await this.getAccountBarberPermissions(data.id);
        console.log('[LOGIN] Barber permissions:', barberIds);
        return { ...data, barber_ids: barberIds };
      }

      console.log('[LOGIN] No matching account found - check username, password, or active status');
      return null;
    } catch (error) {
      console.error('[LOGIN] Exception during login validation:', error);
      return null;
    }
  }

  async createAccount(username: string, password: string, role: 'admin' | 'staff'): Promise<void> {
    const passwordHash = await this.hashPassword(password);

    const { error } = await supabase
      .from('admin_accounts')
      .insert([{
        username,
        password_hash: passwordHash,
        role,
        is_active: true
      }]);

    if (error) {
      console.error('Error creating account:', error);
      throw new Error(`Erro ao criar conta: ${error.message}`);
    }
  }

  async updateAccountStatus(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('admin_accounts')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      console.error('Error updating account status:', error);
      throw new Error(`Erro ao atualizar estado da conta: ${error.message}`);
    }
  }

  async updateAccountPassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await this.hashPassword(newPassword);

    const { error } = await supabase
      .from('admin_accounts')
      .update({ password_hash: passwordHash })
      .eq('id', id);

    if (error) {
      console.error('Error updating account password:', error);
      throw new Error(`Erro ao atualizar password: ${error.message}`);
    }
  }

  async deleteAccount(id: string): Promise<void> {
    const { error } = await supabase
      .from('admin_accounts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting account:', error);
      throw new Error(`Erro ao eliminar conta: ${error.message}`);
    }
  }

  async getAccountBarberPermissions(accountId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('account_barber_permissions')
        .select('barber_id')
        .eq('account_id', accountId);

      if (error) throw error;
      return data?.map(p => p.barber_id) || [];
    } catch (error) {
      console.error('Error fetching account barber permissions:', error);
      return [];
    }
  }

  async updateAccountBarberPermissions(accountId: string, barberIds: string[]): Promise<void> {
    try {
      const { error: deleteError } = await supabase
        .from('account_barber_permissions')
        .delete()
        .eq('account_id', accountId);

      if (deleteError) throw deleteError;

      if (barberIds.length > 0) {
        const permissions = barberIds.map(barberId => ({
          account_id: accountId,
          barber_id: barberId
        }));

        const { error: insertError } = await supabase
          .from('account_barber_permissions')
          .insert(permissions);

        if (insertError) throw insertError;
      }
    } catch (error: any) {
      console.error('Error updating account barber permissions:', error);
      throw new Error(`Erro ao atualizar permissões: ${error.message}`);
    }
  }

  async getAccountsWithPermissions(): Promise<any[]> {
    try {
      const accounts = await this.getAccounts();

      const accountsWithPermissions = await Promise.all(
        accounts.map(async (account) => {
          const barberIds = await this.getAccountBarberPermissions(account.id);
          return { ...account, barber_ids: barberIds };
        })
      );

      return accountsWithPermissions;
    } catch (error) {
      console.error('Error fetching accounts with permissions:', error);
      return [];
    }
  }

  async getMonthlyRevenue(year: number, month: number): Promise<any> {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          barber_id,
          service_id,
          status,
          barbers!appointments_barber_id_fkey (
            id,
            name
          ),
          services!appointments_service_id_fkey (
            id,
            name,
            price
          )
        `)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .in('status', ['completed', 'confirmed']);

      if (error) throw error;

      const barberStatsMap = new Map<string, any>();

      appointments?.forEach((appointment: any) => {
        const barberId = appointment.barber_id;
        const barberName = appointment.barbers?.name || 'Desconhecido';
        const price = appointment.services?.price || 0;

        if (!barberStatsMap.has(barberId)) {
          barberStatsMap.set(barberId, {
            barber_id: barberId,
            barber_name: barberName,
            total_services: 0,
            total_revenue: 0,
            average_per_service: 0
          });
        }

        const stats = barberStatsMap.get(barberId);
        stats.total_services += 1;
        stats.total_revenue += price;
      });

      const barbers = Array.from(barberStatsMap.values()).map(stats => ({
        ...stats,
        average_per_service: stats.total_services > 0 ? stats.total_revenue / stats.total_services : 0
      }));

      const totalServices = barbers.reduce((sum, b) => sum + b.total_services, 0);
      const totalRevenue = barbers.reduce((sum, b) => sum + b.total_revenue, 0);

      return {
        month,
        year,
        barbers: barbers.sort((a, b) => b.total_revenue - a.total_revenue),
        total_services: totalServices,
        total_revenue: totalRevenue,
        active_barbers: barbers.length
      };
    } catch (error) {
      console.error('Error fetching monthly revenue:', error);
      return {
        month,
        year,
        barbers: [],
        total_services: 0,
        total_revenue: 0,
        active_barbers: 0
      };
    }
  }

  async getAvailableSlots(date: string, serviceId: string, barberId: string): Promise<string[]> {
    try {
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('duration')
        .eq('id', serviceId)
        .maybeSingle();

      if (serviceError) throw serviceError;
      if (!service) return [];

      const { data: barber, error: barberError } = await supabase
        .from('barbers')
        .select('work_start_time, work_end_time, lunch_start_time, lunch_end_time, has_dinner_break, dinner_start_time, dinner_end_time, leadtime_minutes, use_shift_rotation')
        .eq('id', barberId)
        .maybeSingle();

      if (barberError) throw barberError;
      if (!barber) return [];

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
        const rotation = await this.getShiftRotation(barberId);
        const templates = await this.getShiftTemplates(barberId);
        const activeShift = this.calculateActiveShift(rotation, templates, date);

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
          return [];
        }
      }

      const { data: overrides, error: overridesError } = await supabase
        .from('weekly_schedule_overrides')
        .select('exception_date')
        .eq('barber_id', barberId)
        .eq('exception_date', date);

      if (overridesError) throw overridesError;

      const hasOverride = overrides && overrides.length > 0;

      if (!hasOverride) {
        const dayOfWeek = new Date(date + 'T00:00:00').getDay();

        const { data: weeklySchedule, error: weeklyScheduleError } = await supabase
          .from('barber_weekly_schedule')
          .select('*')
          .eq('barber_id', barberId)
          .eq('day_of_week', dayOfWeek);

        if (weeklyScheduleError) throw weeklyScheduleError;

        const fullDayOff = weeklySchedule?.some(schedule => schedule.is_full_day_off);
        if (fullDayOff) {
          return [];
        }
      }

      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('appointment_time, service_id')
        .eq('appointment_date', date)
        .eq('barber_id', barberId)
        .neq('status', 'cancelled');

      if (appointmentsError) throw appointmentsError;

      const { data: timeBlocks, error: timeBlocksError } = await supabase
        .from('time_blocks')
        .select('block_time')
        .eq('block_date', date)
        .eq('barber_id', barberId);

      if (timeBlocksError) throw timeBlocksError;

      const blockedSlots = new Set<string>();

      (timeBlocks || []).forEach((block) => {
        const normalizedTime = block.block_time.substring(0, 5) + ':00';
        blockedSlots.add(normalizedTime);
      });

      if (!hasOverride) {
        const dayOfWeek = new Date(date + 'T00:00:00').getDay();

        const { data: weeklySchedule, error: weeklyScheduleError } = await supabase
          .from('barber_weekly_schedule')
          .select('*')
          .eq('barber_id', barberId)
          .eq('day_of_week', dayOfWeek);

        if (!weeklyScheduleError && weeklySchedule) {
          (weeklySchedule || []).forEach((schedule) => {
            if (!schedule.is_full_day_off && schedule.block_start_time && schedule.block_end_time) {
              const [startH, startM] = schedule.block_start_time.split(':').map(Number);
              const [endH, endM] = schedule.block_end_time.split(':').map(Number);
              const startMinutes = startH * 60 + startM;
              const endMinutes = endH * 60 + endM;

              for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
                const h = Math.floor(minutes / 60);
                const m = minutes % 60;
                blockedSlots.add(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`);
              }
            }
          });
        }
      }

      for (const appointment of (appointments || [])) {
        const { data: appointmentService, error: appointmentServiceError } = await supabase
          .from('services')
          .select('duration')
          .eq('id', appointment.service_id)
          .maybeSingle();

        if (appointmentServiceError || !appointmentService) continue;

        const [hours, minutes] = appointment.appointment_time.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;
        const endMinutes = startMinutes + appointmentService.duration;

        for (let time = startMinutes; time < endMinutes; time += 30) {
          const h = Math.floor(time / 60);
          const m = time % 60;
          blockedSlots.add(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`);
        }
      }

      const availableSlots: string[] = [];
      const [workStartH, workStartM] = effectiveSchedule.work_start_time.split(':').map(Number);
      const [workEndH, workEndM] = effectiveSchedule.work_end_time.split(':').map(Number);
      const [lunchStartH, lunchStartM] = effectiveSchedule.lunch_start_time.split(':').map(Number);
      const [lunchEndH, lunchEndM] = effectiveSchedule.lunch_end_time.split(':').map(Number);

      const workStartMinutes = workStartH * 60 + workStartM;
      const workEndMinutes = workEndH * 60 + workEndM;
      const lunchStartMinutes = lunchStartH * 60 + lunchStartM;
      const lunchEndMinutes = lunchEndH * 60 + lunchEndM;

      let dinnerStartMinutes = 0;
      let dinnerEndMinutes = 0;
      if (effectiveSchedule.has_dinner_break && effectiveSchedule.dinner_start_time && effectiveSchedule.dinner_end_time) {
        const [dinnerStartH, dinnerStartM] = effectiveSchedule.dinner_start_time.split(':').map(Number);
        const [dinnerEndH, dinnerEndM] = effectiveSchedule.dinner_end_time.split(':').map(Number);
        dinnerStartMinutes = dinnerStartH * 60 + dinnerStartM;
        dinnerEndMinutes = dinnerEndH * 60 + dinnerEndM;
      }

      for (let minutes = workStartMinutes; minutes < workEndMinutes; minutes += 30) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const timeSlot = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

        if (minutes + service.duration > workEndMinutes) continue;

        const serviceEndMinutes = minutes + service.duration;
        if (minutes < lunchEndMinutes && serviceEndMinutes > lunchStartMinutes) continue;

        if (effectiveSchedule.has_dinner_break && dinnerStartMinutes > 0 && dinnerEndMinutes > 0) {
          if (minutes < dinnerEndMinutes && serviceEndMinutes > dinnerStartMinutes) continue;
        }

        let isBlocked = false;
        for (let checkTime = minutes; checkTime < minutes + service.duration; checkTime += 30) {
          const checkH = Math.floor(checkTime / 60);
          const checkM = checkTime % 60;
          const checkSlot = `${checkH.toString().padStart(2, '0')}:${checkM.toString().padStart(2, '0')}:00`;

          if (blockedSlots.has(checkSlot)) {
            isBlocked = true;
            break;
          }
        }

        if (!isBlocked) {
          availableSlots.push(timeSlot);
        }
      }

      // Filter out past time slots for today
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const isToday = date === today;

      if (isToday) {
        const leadtimeMinutes = barber.leadtime_minutes || 0;
        const thresholdTime = new Date(now.getTime() + leadtimeMinutes * 60000);

        return availableSlots.filter(slot => {
          const [slotHours, slotMinutes] = slot.split(':').map(Number);
          const slotDateTime = new Date(date + 'T00:00:00');
          slotDateTime.setHours(slotHours, slotMinutes, 0, 0);

          return slotDateTime > thresholdTime;
        });
      }

      return availableSlots;
    } catch (error) {
      console.error('Error calculating available slots:', error);
      return [];
    }
  }

  async hasExistingAppointmentConflict(date: string, time: string, serviceId: string, barberId: string): Promise<{ hasConflict: boolean; reason?: string }> {
    try {
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('duration')
        .eq('id', serviceId)
        .maybeSingle();

      if (serviceError) throw serviceError;
      if (!service) return { hasConflict: false };

      const [hours, minutes] = time.split(':').map(Number);
      const requestedStartMinutes = hours * 60 + minutes;
      const requestedEndMinutes = requestedStartMinutes + service.duration;

      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('appointment_time, service_id')
        .eq('appointment_date', date)
        .eq('barber_id', barberId)
        .neq('status', 'cancelled');

      if (appointmentsError) throw appointmentsError;

      for (const appointment of (appointments || [])) {
        const { data: appointmentService, error: appointmentServiceError } = await supabase
          .from('services')
          .select('duration')
          .eq('id', appointment.service_id)
          .maybeSingle();

        if (appointmentServiceError || !appointmentService) continue;

        const [apptH, apptM] = appointment.appointment_time.split(':').map(Number);
        const apptStartMinutes = apptH * 60 + apptM;
        const apptEndMinutes = apptStartMinutes + appointmentService.duration;

        if (
          (requestedStartMinutes >= apptStartMinutes && requestedStartMinutes < apptEndMinutes) ||
          (requestedEndMinutes > apptStartMinutes && requestedEndMinutes <= apptEndMinutes) ||
          (requestedStartMinutes <= apptStartMinutes && requestedEndMinutes >= apptEndMinutes)
        ) {
          return { hasConflict: true, reason: 'Já existe uma marcação neste horário' };
        }
      }

      return { hasConflict: false };
    } catch (error) {
      console.error('Error checking for existing appointment conflict:', error);
      return { hasConflict: false };
    }
  }

  async isSlotAvailable(date: string, time: string, serviceId: string, barberId: string): Promise<{ available: boolean; reason?: string }> {
    try {
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('duration')
        .eq('id', serviceId)
        .maybeSingle();

      if (serviceError) throw serviceError;
      if (!service) return { available: false, reason: 'Serviço não encontrado' };

      const [hours, minutes] = time.split(':').map(Number);
      const requestedStartMinutes = hours * 60 + minutes;
      const requestedEndMinutes = requestedStartMinutes + service.duration;

      const { data: overrides, error: overridesError } = await supabase
        .from('weekly_schedule_overrides')
        .select('exception_date')
        .eq('barber_id', barberId)
        .eq('exception_date', date);

      if (overridesError) throw overridesError;

      const hasOverride = overrides && overrides.length > 0;

      if (!hasOverride) {
        const dayOfWeek = new Date(date + 'T00:00:00').getDay();

        const { data: weeklySchedule, error: weeklyScheduleError } = await supabase
          .from('barber_weekly_schedule')
          .select('*')
          .eq('barber_id', barberId)
          .eq('day_of_week', dayOfWeek);

        if (weeklyScheduleError) throw weeklyScheduleError;

        const fullDayOff = weeklySchedule?.some(schedule => schedule.is_full_day_off);
        if (fullDayOff) {
          return { available: false, reason: 'Funcionário não trabalha neste dia da semana' };
        }

        for (const schedule of (weeklySchedule || [])) {
          if (!schedule.is_full_day_off && schedule.block_start_time && schedule.block_end_time) {
            const [blockStartH, blockStartM] = schedule.block_start_time.split(':').map(Number);
            const [blockEndH, blockEndM] = schedule.block_end_time.split(':').map(Number);
            const blockStartMinutes = blockStartH * 60 + blockStartM;
            const blockEndMinutes = blockEndH * 60 + blockEndM;

            if (requestedStartMinutes < blockEndMinutes && requestedEndMinutes > blockStartMinutes) {
              return { available: false, reason: 'Horário conflita com folga do funcionário' };
            }
          }
        }
      }

      const { data: timeBlocks, error: timeBlocksError } = await supabase
        .from('time_blocks')
        .select('block_time')
        .eq('block_date', date)
        .eq('barber_id', barberId);

      if (timeBlocksError) throw timeBlocksError;

      for (const block of (timeBlocks || [])) {
        const normalizedTime = block.block_time.substring(0, 5);
        const [blockH, blockM] = normalizedTime.split(':').map(Number);
        const blockMinutes = blockH * 60 + blockM;

        if (blockMinutes >= requestedStartMinutes && blockMinutes < requestedEndMinutes) {
          return { available: false, reason: 'Este horário está bloqueado' };
        }
      }

      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('appointment_time, service_id')
        .eq('appointment_date', date)
        .eq('barber_id', barberId)
        .neq('status', 'cancelled');

      if (appointmentsError) throw appointmentsError;

      for (const appointment of (appointments || [])) {
        const { data: appointmentService, error: appointmentServiceError } = await supabase
          .from('services')
          .select('duration')
          .eq('id', appointment.service_id)
          .maybeSingle();

        if (appointmentServiceError || !appointmentService) continue;

        const [apptH, apptM] = appointment.appointment_time.split(':').map(Number);
        const apptStartMinutes = apptH * 60 + apptM;
        const apptEndMinutes = apptStartMinutes + appointmentService.duration;

        if (
          (requestedStartMinutes >= apptStartMinutes && requestedStartMinutes < apptEndMinutes) ||
          (requestedEndMinutes > apptStartMinutes && requestedEndMinutes <= apptEndMinutes) ||
          (requestedStartMinutes <= apptStartMinutes && requestedEndMinutes >= apptEndMinutes)
        ) {
          return { available: false, reason: 'Este horário já foi reservado por outro cliente' };
        }
      }

      return { available: true };
    } catch (error) {
      console.error('Error checking slot availability:', error);
      return { available: false, reason: 'Erro ao verificar disponibilidade' };
    }
  }

  async getBarberWeeklySchedule(barberId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('barber_weekly_schedule')
        .select('*')
        .eq('barber_id', barberId)
        .order('day_of_week');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching barber weekly schedule:', error);
      return [];
    }
  }

  async updateBarberWeeklySchedule(barberId: string, schedules: any[]): Promise<void> {
    try {
      // Buscar folgas antigas antes de deletar
      const oldSchedules = await this.getBarberWeeklySchedule(barberId);

      // Deletar as folgas antigas
      const { error: deleteError } = await supabase
        .from('barber_weekly_schedule')
        .delete()
        .eq('barber_id', barberId);

      if (deleteError) throw deleteError;

      // Identificar dias que foram removidos ou modificados
      const newScheduleKeys = new Set(
        schedules.map(s => `${s.day_of_week}-${s.is_full_day_off}-${s.block_start_time || ''}-${s.block_end_time || ''}`)
      );

      const oldScheduleKeys = new Set(
        oldSchedules.map(s => `${s.day_of_week}-${s.is_full_day_off}-${s.block_start_time || ''}-${s.block_end_time || ''}`)
      );

      // Encontrar dias que foram removidos completamente
      const removedDays = new Set<number>();
      oldSchedules.forEach(oldSchedule => {
        const oldKey = `${oldSchedule.day_of_week}-${oldSchedule.is_full_day_off}-${oldSchedule.block_start_time || ''}-${oldSchedule.block_end_time || ''}`;
        if (!newScheduleKeys.has(oldKey)) {
          removedDays.add(oldSchedule.day_of_week);
        }
      });

      // Limpar exceções (weekly_schedule_overrides) e time_blocks associados para dias removidos
      if (removedDays.size > 0) {
        const daysArray = Array.from(removedDays);

        // Primeiro, buscar os overrides que vamos deletar para saber quais datas têm time_blocks associados
        const { data: overridesToDelete, error: overrideFetchError } = await supabase
          .from('weekly_schedule_overrides')
          .select('exception_date')
          .eq('barber_id', barberId)
          .in('day_of_week', daysArray);

        if (overrideFetchError) {
          console.error('Error fetching weekly schedule overrides:', overrideFetchError);
        }

        // Remover time_blocks para as datas específicas onde houve overrides
        if (overridesToDelete && overridesToDelete.length > 0) {
          const exceptionDates = overridesToDelete.map(o => o.exception_date);

          // Remover TODOS os time_blocks nas datas com overrides
          // (esses blocos só existem porque slots foram desbloqueados na folga semanal)
          const { error: timeBlocksDeleteError } = await supabase
            .from('time_blocks')
            .delete()
            .eq('barber_id', barberId)
            .in('block_date', exceptionDates);

          if (timeBlocksDeleteError) {
            console.error('Error deleting time blocks for overridden dates:', timeBlocksDeleteError);
          }
        }

        // Agora deletar os overrides
        const { error: overrideDeleteError } = await supabase
          .from('weekly_schedule_overrides')
          .delete()
          .eq('barber_id', barberId)
          .in('day_of_week', daysArray);

        if (overrideDeleteError) {
          console.error('Error deleting weekly schedule overrides:', overrideDeleteError);
        }
      }

      // Inserir novas folgas
      if (schedules.length > 0) {
        const schedulesToInsert = schedules.map(schedule => ({
          barber_id: barberId,
          day_of_week: schedule.day_of_week,
          is_full_day_off: schedule.is_full_day_off,
          block_start_time: schedule.is_full_day_off ? null : schedule.block_start_time,
          block_end_time: schedule.is_full_day_off ? null : schedule.block_end_time,
          reason: schedule.reason || ''
        }));

        const { error: insertError } = await supabase
          .from('barber_weekly_schedule')
          .insert(schedulesToInsert);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error updating barber weekly schedule:', error);
      throw error;
    }
  }

  async deleteBarberWeeklyScheduleEntry(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('barber_weekly_schedule')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting barber weekly schedule entry:', error);
      throw error;
    }
  }

  async getWeeklyScheduleOverrides(barberId: string, startDate: string, endDate: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('weekly_schedule_overrides')
        .select('*')
        .eq('barber_id', barberId)
        .gte('exception_date', startDate)
        .lte('exception_date', endDate);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching weekly schedule overrides:', error);
      return [];
    }
  }

  async addWeeklyScheduleOverride(barberId: string, exceptionDate: string): Promise<void> {
    try {
      const date = new Date(exceptionDate + 'T00:00:00');
      const dayOfWeek = date.getDay();

      const { error } = await supabase
        .from('weekly_schedule_overrides')
        .insert([{
          barber_id: barberId,
          exception_date: exceptionDate,
          day_of_week: dayOfWeek
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding weekly schedule override:', error);
      throw error;
    }
  }

  async removeWeeklyScheduleOverride(barberId: string, exceptionDate: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('weekly_schedule_overrides')
        .delete()
        .eq('barber_id', barberId)
        .eq('exception_date', exceptionDate);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing weekly schedule override:', error);
      throw error;
    }
  }

  async unlockSingleWeeklySlot(
    barberId: string,
    exceptionDate: string,
    slotTime: string,
    weeklyScheduleInfo: { blockStartTime?: string; blockEndTime?: string; isFullDayOff: boolean; reason: string }
  ): Promise<void> {
    try {
      const date = new Date(exceptionDate + 'T00:00:00');
      const dayOfWeek = date.getDay();

      const { data: barber, error: barberError } = await supabase
        .from('barbers')
        .select('work_start_time, work_end_time')
        .eq('id', barberId)
        .maybeSingle();

      if (barberError) throw barberError;
      if (!barber) throw new Error('Funcionário não encontrado');

      const { error: overrideError } = await supabase
        .from('weekly_schedule_overrides')
        .insert([{
          barber_id: barberId,
          exception_date: exceptionDate,
          day_of_week: dayOfWeek
        }]);

      if (overrideError) throw overrideError;

      const [workStartHour, workStartMin] = barber.work_start_time.split(':').map(Number);
      const [workEndHour, workEndMin] = barber.work_end_time.split(':').map(Number);
      const workStartMinutes = workStartHour * 60 + workStartMin;
      const workEndMinutes = workEndHour * 60 + workEndMin;

      let blockStartMinutes: number;
      let blockEndMinutes: number;

      if (weeklyScheduleInfo.isFullDayOff) {
        blockStartMinutes = workStartMinutes;
        blockEndMinutes = workEndMinutes;
      } else if (weeklyScheduleInfo.blockStartTime && weeklyScheduleInfo.blockEndTime) {
        const [startH, startM] = weeklyScheduleInfo.blockStartTime.split(':').map(Number);
        const [endH, endM] = weeklyScheduleInfo.blockEndTime.split(':').map(Number);
        blockStartMinutes = startH * 60 + startM;
        blockEndMinutes = endH * 60 + endM;
      } else {
        return;
      }

      const [slotHour, slotMin] = slotTime.split(':').map(Number);
      const slotMinutes = slotHour * 60 + slotMin;

      const timeBlocksToCreate = [];
      for (let minutes = blockStartMinutes; minutes < blockEndMinutes; minutes += 30) {
        if (minutes !== slotMinutes) {
          const hour = Math.floor(minutes / 60);
          const min = minutes % 60;
          const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`;

          timeBlocksToCreate.push({
            barber_id: barberId,
            block_date: exceptionDate,
            block_time: timeStr,
            reason: weeklyScheduleInfo.reason
          });
        }
      }

      if (timeBlocksToCreate.length > 0) {
        const { error: blocksError } = await supabase
          .from('time_blocks')
          .insert(timeBlocksToCreate);

        if (blocksError) throw blocksError;
      }
    } catch (error) {
      console.error('Error unlocking single weekly slot:', error);
      throw error;
    }
  }

  async checkAppointmentConflicts(
    barberId: string,
    dates: string[],
    time: string,
    serviceId: string
  ): Promise<{ date: string; hasConflict: boolean; reason?: string }[]> {
    const results = [];

    for (const date of dates) {
      const result = await this.isSlotAvailable(date, time, serviceId, barberId);
      results.push({
        date,
        hasConflict: !result.available,
        reason: result.reason
      });
    }

    return results;
  }

  async createRecurringAppointments(
    appointmentData: Omit<Appointment, 'id' | 'created_at'>,
    dates: string[],
    recurrenceType: 'weekly' | 'biweekly' | 'monthly',
    createWithConflicts: boolean
  ): Promise<{ success: boolean; totalCreated: number; skippedDates: { date: string; reason: string }[] }> {
    try {
      const recurringGroupId = crypto.randomUUID();
      const skippedDates: { date: string; reason: string }[] = [];
      const appointmentsToCreate: any[] = [];

      for (const date of dates) {
        if (!createWithConflicts) {
          const slotCheck = await this.isSlotAvailable(
            date,
            appointmentData.appointment_time,
            appointmentData.service_id,
            appointmentData.barber_id
          );

          if (!slotCheck.available) {
            skippedDates.push({ date, reason: slotCheck.reason || 'Horário não disponível' });
            continue;
          }
        } else {
          const existingAppointmentCheck = await this.hasExistingAppointmentConflict(
            date,
            appointmentData.appointment_time,
            appointmentData.service_id,
            appointmentData.barber_id
          );

          if (existingAppointmentCheck.hasConflict) {
            skippedDates.push({ date, reason: existingAppointmentCheck.reason || 'Já existe uma marcação' });
            continue;
          }
        }

        appointmentsToCreate.push({
          ...appointmentData,
          appointment_date: date,
          recurring_group_id: recurringGroupId,
          is_part_of_recurrence: true
        });
      }

      if (appointmentsToCreate.length === 0) {
        return { success: false, totalCreated: 0, skippedDates };
      }

      const { data: createdAppointments, error: appointmentError } = await supabase
        .from('appointments')
        .insert(appointmentsToCreate)
        .select();

      if (appointmentError) throw appointmentError;

      const firstAppointmentId = createdAppointments[0].id;

      const { error: recurringError } = await supabase
        .from('recurring_appointments')
        .insert([{
          original_appointment_id: firstAppointmentId,
          recurrence_type: recurrenceType
        }]);

      if (recurringError) throw recurringError;

      return {
        success: true,
        totalCreated: appointmentsToCreate.length,
        skippedDates
      };
    } catch (error) {
      console.error('Error creating recurring appointments:', error);
      throw error;
    }
  }

  async getRecurringGroupAppointments(recurringGroupId: string): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('recurring_group_id', recurringGroupId)
        .order('appointment_date');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recurring group appointments:', error);
      return [];
    }
  }

  async isAppointmentPartOfRecurrence(appointmentId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('is_part_of_recurrence')
        .eq('id', appointmentId)
        .maybeSingle();

      if (error) throw error;
      return data?.is_part_of_recurrence || false;
    } catch (error) {
      console.error('Error checking if appointment is part of recurrence:', error);
      return false;
    }
  }

  async getRecurrenceInfo(appointmentId: string): Promise<any> {
    try {
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('recurring_group_id, is_part_of_recurrence')
        .eq('id', appointmentId)
        .maybeSingle();

      if (appointmentError) throw appointmentError;
      if (!appointment?.recurring_group_id) return null;

      const { data: recurringInfo, error: recurringError } = await supabase
        .from('recurring_appointments')
        .select('*')
        .eq('original_appointment_id', appointmentId)
        .maybeSingle();

      if (recurringError) throw recurringError;

      return {
        recurringGroupId: appointment.recurring_group_id,
        recurrenceType: recurringInfo?.recurrence_type
      };
    } catch (error) {
      console.error('Error fetching recurrence info:', error);
      return null;
    }
  }

  async updateRecurringAppointments(
    appointmentId: string,
    action: 'single' | 'future' | 'all',
    updates: Partial<Appointment>
  ): Promise<void> {
    try {
      if (action === 'single') {
        const { error } = await supabase
          .from('appointments')
          .update(updates)
          .eq('id', appointmentId);

        if (error) throw error;
        return;
      }

      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('recurring_group_id, appointment_date')
        .eq('id', appointmentId)
        .maybeSingle();

      if (appointmentError) throw appointmentError;
      if (!appointment?.recurring_group_id) return;

      let query = supabase
        .from('appointments')
        .update(updates)
        .eq('recurring_group_id', appointment.recurring_group_id);

      if (action === 'future') {
        query = query.gte('appointment_date', appointment.appointment_date);
      }

      const { error } = await query;
      if (error) throw error;
    } catch (error) {
      console.error('Error updating recurring appointments:', error);
      throw error;
    }
  }

  async cancelRecurringAppointments(
    appointmentId: string,
    action: 'single' | 'future' | 'all'
  ): Promise<void> {
    await this.updateRecurringAppointments(appointmentId, action, { status: 'cancelled' });
  }

  async getHomepageSettings(): Promise<HomepageSettings | null> {
    try {
      const { data, error } = await supabase
        .from('homepage_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching homepage settings:', error);
      return null;
    }
  }

  async updateHomepageSettings(settings: Partial<Omit<HomepageSettings, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    try {
      const { data: existingSettings, error: fetchError } = await supabase
        .from('homepage_settings')
        .select('id')
        .maybeSingle();

      if (fetchError) throw fetchError;

      const cleanedSettings = Object.fromEntries(
        Object.entries(settings).filter(([_, value]) => value !== undefined)
      );

      const updatedSettings = {
        ...cleanedSettings,
        updated_at: new Date().toISOString()
      };

      if (existingSettings) {
        const { error } = await supabase
          .from('homepage_settings')
          .update(updatedSettings)
          .eq('id', existingSettings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('homepage_settings')
          .insert([updatedSettings]);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating homepage settings:', error);
      throw error;
    }
  }

  async getFeaturedServices(): Promise<FeaturedService[]> {
    try {
      const { data, error } = await supabase
        .from('homepage_featured_services')
        .select(`
          id,
          service_id,
          display_order,
          created_at,
          services (
            id,
            name,
            price,
            duration,
            description,
            created_at
          )
        `)
        .order('display_order');

      if (error) throw error;

      const featuredServices: FeaturedService[] = (data || []).map((item: any) => ({
        id: item.services.id,
        name: item.services.name,
        price: item.services.price,
        duration: item.services.duration,
        description: item.services.description,
        created_at: item.services.created_at,
        display_order: item.display_order,
        featured_id: item.id
      }));

      return featuredServices;
    } catch (error) {
      console.error('Error fetching featured services:', error);
      return [];
    }
  }

  async updateFeaturedServices(serviceIds: string[]): Promise<void> {
    try {
      const { error: deleteError } = await supabase
        .from('homepage_featured_services')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) throw deleteError;

      if (serviceIds.length > 0) {
        const featuredServices = serviceIds.map((serviceId, index) => ({
          service_id: serviceId,
          display_order: index
        }));

        const { error: insertError } = await supabase
          .from('homepage_featured_services')
          .insert(featuredServices);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error updating featured services:', error);
      throw error;
    }
  }

  async resetHomepageToDefaults(): Promise<void> {
    try {
      const { data: existingSettings, error: fetchError } = await supabase
        .from('homepage_settings')
        .select('id')
        .maybeSingle();

      if (fetchError) throw fetchError;

      const defaultSettings = {
        hero_title: 'Barber',
        hero_subtitle: '',
        hero_description: 'Onde o estilo encontra a perfeição. Mais de 15 anos criando looks únicos e atemporais.',
        hero_button_text: 'Reservar Agora',
        why_choose_title: 'Por que escolher a Barber?',
        why_choose_description: 'Combinamos tradição e modernidade para oferecer a melhor experiência em cuidados masculinos.',
        feature_1_title: 'Profissionais Experientes',
        feature_1_description: 'Equipe altamente qualificada com mais de 15 anos de experiência em cortes clássicos e modernos.',
        feature_2_title: 'Equipamentos Premium',
        feature_2_description: 'Utilizamos apenas os melhores equipamentos e produtos para garantir resultados excepcionais.',
        feature_3_title: 'Atendimento 5 Estrelas',
        feature_3_description: 'Ambiente acolhedor e atendimento personalizado para uma experiência única e memorável.',
        services_section_title: 'Nossos Serviços',
        services_section_description: 'Serviços profissionais para o homem moderno',
        contact_section_title: 'Visite-nos',
        contact_section_description: 'Localização conveniente e horários flexíveis',
        contact_address: 'Rua da Barbearia, 123\n1000-001 Lisboa',
        contact_phone: '+351 210 123 456',
        contact_email: 'info@barber.pt',
        hours_weekday: 'Segunda a Sábado: 9h - 19h',
        hours_weekend: 'Domingo: Fechado',
        primary_color: '#FACC15',
        secondary_color: '#111827',
        accent_color: '#F59E0B',
        page_bg_color: '#F9FAFB',
        services_section_bg_color: '#F3F4F6',
        contact_section_bg_color: '#111827',
        card_bg_color: '#FFFFFF',
        text_heading_color: '#111827',
        text_body_color: '#4B5563',
        updated_at: new Date().toISOString()
      };

      if (existingSettings) {
        const { error } = await supabase
          .from('homepage_settings')
          .update(defaultSettings)
          .eq('id', existingSettings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('homepage_settings')
          .insert([defaultSettings]);

        if (error) throw error;
      }

      const { error: deleteError } = await supabase
        .from('homepage_featured_services')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) throw deleteError;
    } catch (error) {
      console.error('Error resetting homepage to defaults:', error);
      throw error;
    }
  }

  async uploadLogoImage(file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading logo image:', error);
      throw error;
    }
  }

  async deleteLogoImage(imageUrl: string): Promise<void> {
    try {
      const fileName = imageUrl.split('/').pop();
      if (!fileName) return;

      const { error } = await supabase.storage
        .from('logos')
        .remove([fileName]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting logo image:', error);
    }
  }

  async uploadHeroBackgroundImage(file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `hero-bg-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('hero-backgrounds')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('hero-backgrounds')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading hero background image:', error);
      throw error;
    }
  }

  async deleteHeroBackgroundImage(imageUrl: string): Promise<void> {
    try {
      const fileName = imageUrl.split('/').pop();
      if (!fileName) return;

      const { error } = await supabase.storage
        .from('hero-backgrounds')
        .remove([fileName]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting hero background image:', error);
    }
  }

  async getSMSTemplates(): Promise<SMSTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching SMS templates:', error);
      return [];
    }
  }

  async saveSMSTemplate(template: Omit<SMSTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('sms_templates')
        .insert([template]);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving SMS template:', error);
      throw error;
    }
  }

  async updateSMSTemplate(id: string, template: Omit<SMSTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('sms_templates')
        .update(template)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating SMS template:', error);
      throw error;
    }
  }

  async deleteSMSTemplate(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('sms_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting SMS template:', error);
      throw error;
    }
  }

  async setDefaultSMSTemplate(id: string | null): Promise<void> {
    try {
      const { error: clearError } = await supabase
        .from('sms_templates')
        .update({ is_default: false })
        .eq('is_default', true);

      if (clearError) throw clearError;

      if (id) {
        const { error: setError } = await supabase
          .from('sms_templates')
          .update({ is_default: true })
          .eq('id', id);

        if (setError) throw setError;
      }
    } catch (error) {
      console.error('Error setting default SMS template:', error);
      throw error;
    }
  }

  async getOccupancyThresholds(): Promise<{ good_threshold: number; medium_threshold: number }> {
    try {
      const { data, error } = await supabase
        .from('occupancy_thresholds')
        .select('good_threshold, medium_threshold')
        .maybeSingle();

      if (error) throw error;

      return data || { good_threshold: 70, medium_threshold: 50 };
    } catch (error) {
      console.error('Error fetching occupancy thresholds:', error);
      return { good_threshold: 70, medium_threshold: 50 };
    }
  }

  async updateOccupancyThresholds(goodThreshold: number, mediumThreshold: number): Promise<void> {
    try {
      const { data: existing } = await supabase
        .from('occupancy_thresholds')
        .select('id')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('occupancy_thresholds')
          .update({
            good_threshold: goodThreshold,
            medium_threshold: mediumThreshold
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('occupancy_thresholds')
          .insert({
            good_threshold: goodThreshold,
            medium_threshold: mediumThreshold
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating occupancy thresholds:', error);
      throw error;
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    const dayOfMonth = date.getDate();
    return Math.ceil((dayOfMonth + dayOfWeek) / 7);
  }

  private getWeekDatesInMonth(year: number, month: number, weekNumber: number): { start: string; end: string } {
    const firstDay = new Date(year, month - 1, 1);
    const firstDayOfWeek = firstDay.getDay();

    const startDay = (weekNumber - 1) * 7 - firstDayOfWeek + 1;
    const endDay = startDay + 6;

    const startDate = new Date(year, month - 1, Math.max(1, startDay));
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const endDate = new Date(year, month - 1, Math.min(lastDayOfMonth, endDay));

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  }

  private async calculateAvailableMinutes(
    barberId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    try {
      const { data: barber } = await supabase
        .from('barbers')
        .select('*')
        .eq('id', barberId)
        .maybeSingle();

      if (!barber) return 0;

      const { data: weeklySchedule } = await supabase
        .from('barber_weekly_schedule')
        .select('*')
        .eq('barber_id', barberId);

      const { data: timeBlocks } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('barber_id', barberId)
        .gte('block_date', startDate)
        .lte('block_date', endDate);

      const { data: shiftRotation } = await supabase
        .from('barber_shift_rotations')
        .select('*, barber_shift_templates(*)')
        .eq('barber_id', barberId)
        .eq('is_active', true)
        .maybeSingle();

      let totalMinutes = 0;
      const start = new Date(startDate);
      const end = new Date(endDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const currentDate = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay();

        const weeklyBlock = weeklySchedule?.find(s => s.day_of_week === dayOfWeek);
        if (weeklyBlock?.is_full_day_off) continue;

        let workStart: string, workEnd: string, lunchStart: string, lunchEnd: string;
        let hasDinnerBreak = false;
        let dinnerStart: string | null = null, dinnerEnd: string | null = null;

        if (barber.use_shift_rotation && shiftRotation) {
          const daysSinceStart = Math.floor((d.getTime() - new Date(shiftRotation.start_date).getTime()) / (1000 * 60 * 60 * 24));
          const cycleLength = shiftRotation.rotation_type === 'weekly' ? 7 : 14;
          const templateIndex = Math.floor(daysSinceStart / cycleLength) % shiftRotation.shift_sequence.length;
          const templateId = shiftRotation.shift_sequence[templateIndex];

          const template = Array.isArray(shiftRotation.barber_shift_templates)
            ? shiftRotation.barber_shift_templates.find((t: any) => t.id === templateId)
            : null;

          if (template) {
            workStart = template.work_start_time;
            workEnd = template.work_end_time;
            lunchStart = template.lunch_start_time;
            lunchEnd = template.lunch_end_time;
            hasDinnerBreak = template.has_dinner_break;
            dinnerStart = template.dinner_start_time;
            dinnerEnd = template.dinner_end_time;
          } else {
            workStart = barber.work_start_time;
            workEnd = barber.work_end_time;
            lunchStart = barber.lunch_start_time;
            lunchEnd = barber.lunch_end_time;
            hasDinnerBreak = barber.has_dinner_break;
            dinnerStart = barber.dinner_start_time;
            dinnerEnd = barber.dinner_end_time;
          }
        } else {
          workStart = barber.work_start_time;
          workEnd = barber.work_end_time;
          lunchStart = barber.lunch_start_time;
          lunchEnd = barber.lunch_end_time;
          hasDinnerBreak = barber.has_dinner_break;
          dinnerStart = barber.dinner_start_time;
          dinnerEnd = barber.dinner_end_time;
        }

        let dayMinutes = this.timeToMinutes(workEnd) - this.timeToMinutes(workStart);
        dayMinutes -= this.timeToMinutes(lunchEnd) - this.timeToMinutes(lunchStart);

        if (hasDinnerBreak && dinnerStart && dinnerEnd) {
          dayMinutes -= this.timeToMinutes(dinnerEnd) - this.timeToMinutes(dinnerStart);
        }

        if (weeklyBlock && !weeklyBlock.is_full_day_off && weeklyBlock.block_start_time && weeklyBlock.block_end_time) {
          const blockMinutes = this.timeToMinutes(weeklyBlock.block_end_time) - this.timeToMinutes(weeklyBlock.block_start_time);
          dayMinutes -= blockMinutes;
        }

        const dayBlocks = timeBlocks?.filter(tb => tb.block_date === currentDate) || [];
        for (const block of dayBlocks) {
          dayMinutes -= 30;
        }

        totalMinutes += Math.max(0, dayMinutes);
      }

      return totalMinutes;
    } catch (error) {
      console.error('Error calculating available minutes:', error);
      return 0;
    }
  }

  private async calculateOccupiedMinutes(
    barberId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    try {
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          id,
          services!appointments_service_id_fkey (
            duration
          )
        `)
        .eq('barber_id', barberId)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .neq('status', 'cancelled');

      if (!appointments) return 0;

      return appointments.reduce((total, apt) => {
        const duration = (apt.services as any)?.duration || 0;
        return total + duration;
      }, 0);
    } catch (error) {
      console.error('Error calculating occupied minutes:', error);
      return 0;
    }
  }

  async getWeeklyOccupancy(
    year: number,
    month: number,
    weekNumber: number,
    barberId?: string
  ): Promise<any> {
    try {
      const { start, end } = this.getWeekDatesInMonth(year, month, weekNumber);

      if (barberId) {
        const availableMinutes = await this.calculateAvailableMinutes(barberId, start, end);
        const occupiedMinutes = await this.calculateOccupiedMinutes(barberId, start, end);
        const occupancyRate = availableMinutes > 0 ? (occupiedMinutes / availableMinutes) * 100 : 0;

        return {
          occupancy_rate: Math.round(occupancyRate * 10) / 10,
          available_minutes: availableMinutes,
          occupied_minutes: occupiedMinutes,
          period_start: start,
          period_end: end
        };
      } else {
        const { data: barbers } = await supabase.from('barbers').select('id, name');

        let totalAvailable = 0;
        let totalOccupied = 0;

        if (barbers) {
          for (const barber of barbers) {
            const available = await this.calculateAvailableMinutes(barber.id, start, end);
            const occupied = await this.calculateOccupiedMinutes(barber.id, start, end);
            totalAvailable += available;
            totalOccupied += occupied;
          }
        }

        const occupancyRate = totalAvailable > 0 ? (totalOccupied / totalAvailable) * 100 : 0;

        return {
          occupancy_rate: Math.round(occupancyRate * 10) / 10,
          available_minutes: totalAvailable,
          occupied_minutes: totalOccupied,
          period_start: start,
          period_end: end
        };
      }
    } catch (error) {
      console.error('Error getting weekly occupancy:', error);
      return {
        occupancy_rate: 0,
        available_minutes: 0,
        occupied_minutes: 0,
        period_start: '',
        period_end: ''
      };
    }
  }

  async getMonthlyOccupancy(year: number, month: number, barberId?: string): Promise<any> {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

      const firstDay = new Date(year, month - 1, 1);
      const numberOfWeeks = this.getWeekNumber(new Date(year, month - 1, lastDay));

      const weeklyBreakdown = [];
      for (let week = 1; week <= numberOfWeeks; week++) {
        const weekStats = await this.getWeeklyOccupancy(year, month, week, barberId);
        weeklyBreakdown.push({
          week_number: week,
          stats: weekStats
        });
      }

      if (barberId) {
        const availableMinutes = await this.calculateAvailableMinutes(barberId, startDate, endDate);
        const occupiedMinutes = await this.calculateOccupiedMinutes(barberId, startDate, endDate);
        const occupancyRate = availableMinutes > 0 ? (occupiedMinutes / availableMinutes) * 100 : 0;

        return {
          month,
          year,
          overall: {
            occupancy_rate: Math.round(occupancyRate * 10) / 10,
            available_minutes: availableMinutes,
            occupied_minutes: occupiedMinutes,
            period_start: startDate,
            period_end: endDate
          },
          weekly_breakdown: weeklyBreakdown
        };
      } else {
        const { data: barbers } = await supabase.from('barbers').select('id, name');

        let totalAvailable = 0;
        let totalOccupied = 0;
        const byBarber = [];

        if (barbers) {
          for (const barber of barbers) {
            const available = await this.calculateAvailableMinutes(barber.id, startDate, endDate);
            const occupied = await this.calculateOccupiedMinutes(barber.id, startDate, endDate);
            totalAvailable += available;
            totalOccupied += occupied;

            const rate = available > 0 ? (occupied / available) * 100 : 0;
            byBarber.push({
              barber_id: barber.id,
              barber_name: barber.name,
              occupancy_rate: Math.round(rate * 10) / 10,
              available_minutes: available,
              occupied_minutes: occupied,
              period_start: startDate,
              period_end: endDate
            });
          }
        }

        const occupancyRate = totalAvailable > 0 ? (totalOccupied / totalAvailable) * 100 : 0;

        return {
          month,
          year,
          overall: {
            occupancy_rate: Math.round(occupancyRate * 10) / 10,
            available_minutes: totalAvailable,
            occupied_minutes: totalOccupied,
            period_start: startDate,
            period_end: endDate
          },
          weekly_breakdown: weeklyBreakdown,
          by_barber: byBarber.sort((a, b) => b.occupancy_rate - a.occupancy_rate)
        };
      }
    } catch (error) {
      console.error('Error getting monthly occupancy:', error);
      return {
        month,
        year,
        overall: {
          occupancy_rate: 0,
          available_minutes: 0,
          occupied_minutes: 0,
          period_start: '',
          period_end: ''
        },
        weekly_breakdown: [],
        by_barber: []
      };
    }
  }

  async getBarberGoals(): Promise<{ barber_id: string; goal_amount: number }[]> {
    try {
      const { data, error } = await supabase
        .from('barber_monthly_goals')
        .select('barber_id, goal_amount');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting barber goals:', error);
      return [];
    }
  }

  async upsertBarberGoal(barberId: string, goalAmount: number): Promise<void> {
    const { error } = await supabase
      .from('barber_monthly_goals')
      .upsert(
        { barber_id: barberId, goal_amount: goalAmount },
        { onConflict: 'barber_id' }
      );

    if (error) throw error;
  }

  async getProducts(activeOnly = false): Promise<Product[]> {
    try {
      let query = supabase.from('products').select('*').order('name', { ascending: true });
      if (activeOnly) query = query.eq('active', true);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert({ ...product, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateProduct(id: string, product: Partial<Omit<Product, 'id' | 'created_at'>>): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ ...product, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  }

  async recordProductSale(items: { product_id: string; quantity: number; unit_price: number }[]): Promise<void> {
    const records = items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
      sold_at: new Date().toISOString()
    }));
    const { error } = await supabase.from('product_sales').insert(records);
    if (error) throw error;
  }

  async getProductSalesStats(year: number, month: number): Promise<ProductSalesStats> {
    try {
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

      const { data, error } = await supabase
        .from('product_sales')
        .select('*, products(name)')
        .gte('sold_at', startDate)
        .lte('sold_at', endDate)
        .order('sold_at', { ascending: false });

      if (error) throw error;

      const sales: ProductSale[] = (data || []).map((s: any) => ({
        ...s,
        product_name: s.products?.name || 'Produto removido'
      }));

      const total_revenue = sales.reduce((sum, s) => sum + s.total_price, 0);
      const total_units = sales.reduce((sum, s) => sum + s.quantity, 0);

      const byProductMap = new Map<string, { product_id: string; product_name: string; total_units: number; total_revenue: number }>();
      sales.forEach(s => {
        const existing = byProductMap.get(s.product_id);
        if (existing) {
          existing.total_units += s.quantity;
          existing.total_revenue += s.total_price;
        } else {
          byProductMap.set(s.product_id, {
            product_id: s.product_id,
            product_name: s.product_name || 'Produto removido',
            total_units: s.quantity,
            total_revenue: s.total_price
          });
        }
      });

      return {
        total_revenue,
        total_units,
        sales,
        by_product: Array.from(byProductMap.values()).sort((a, b) => b.total_revenue - a.total_revenue)
      };
    } catch (error) {
      console.error('Error fetching product sales stats:', error);
      return { total_revenue: 0, total_units: 0, sales: [], by_product: [] };
    }
  }

  async getAllProductSales(): Promise<ProductSale[]> {
    try {
      const { data, error } = await supabase
        .from('product_sales')
        .select('*, products(name)')
        .order('sold_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((s: any) => ({
        ...s,
        product_name: s.products?.name || 'Produto removido'
      }));
    } catch (error) {
      console.error('Error fetching all product sales:', error);
      return [];
    }
  }

  async updateProductSale(id: string, payload: { quantity: number; unit_price: number; sold_at: string }): Promise<void> {
    const { error } = await supabase
      .from('product_sales')
      .update({
        quantity: payload.quantity,
        unit_price: payload.unit_price,
        total_price: payload.quantity * payload.unit_price,
        sold_at: payload.sold_at
      })
      .eq('id', id);
    if (error) throw error;
  }

  async deleteProductSale(id: string): Promise<void> {
    const { error } = await supabase.from('product_sales').delete().eq('id', id);
    if (error) throw error;
  }

  async registerCustomerFromBooking(name: string, email: string, phone: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .insert([{ name, email, phone }]);

    if (error && error.code !== '23505') {
      console.error('Error registering customer:', error);
    }
  }

  async getCustomers(): Promise<{ id: string; name: string; email: string; phone: string; created_at: string }[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, email, phone, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getCustomersWithLastVisit(): Promise<{ id: string; name: string; email: string; phone: string; created_at: string; last_visit: string | null }[]> {
    const { data, error } = await supabase.rpc('get_customers_with_last_visit');
    if (error) throw error;
    return data || [];
  }
}

export const db = new DatabaseService();
