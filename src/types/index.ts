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

export type RecurrenceType = 'none' | 'weekly' | 'biweekly' | 'monthly';

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
  recurring_group_id?: string;
  is_part_of_recurrence?: boolean;
  created_at?: string;
}

export interface AppointmentWithDetails extends Appointment {
  service_name: string;
  service_price: number;
  service_duration: number;
  barber_name: string;
}

export interface RecurringAppointment {
  id: string;
  original_appointment_id: string;
  recurrence_type: 'weekly' | 'biweekly' | 'monthly';
  created_at?: string;
}

export interface RecurrenceConfig {
  type: RecurrenceType;
  previewDates: string[];
}

export interface AppointmentConflict {
  date: string;
  hasConflict: boolean;
  reason?: string;
}

export interface TimeBlock {
  id: string;
  barber_id: string;
  block_date: string;
  block_time: string;
  reason: string;
  created_at?: string;
}

export interface BarberWeeklySchedule {
  id: string;
  barber_id: string;
  day_of_week: number;
  is_full_day_off: boolean;
  block_start_time?: string;
  block_end_time?: string;
  reason: string;
  created_at?: string;
}

export interface BarberService {
  barber_id: string;
  service_id: string;
  created_at?: string;
}

export interface AdminAccount {
  id: string;
  username: string;
  role: 'admin' | 'staff';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  barber_ids?: string[];
}

export interface CreateAdminAccount {
  username: string;
  password: string;
  role: 'admin' | 'staff';
}

export interface AccountBarberPermission {
  id: string;
  account_id: string;
  barber_id: string;
  created_at: string;
}

export interface MonthlyBarberStats {
  barber_id: string;
  barber_name: string;
  total_services: number;
  total_revenue: number;
  average_per_service: number;
}

export interface MonthlyRevenue {
  month: number;
  year: number;
  barbers: MonthlyBarberStats[];
  total_services: number;
  total_revenue: number;
  active_barbers: number;
}

export type ShiftRotationType = 'weekly' | 'biweekly';

export interface BarberShiftTemplate {
  id: string;
  barber_id: string;
  shift_name: string;
  work_start_time: string;
  work_end_time: string;
  lunch_start_time: string;
  lunch_end_time: string;
  has_dinner_break: boolean;
  dinner_start_time?: string;
  dinner_end_time?: string;
  display_order: number;
  created_at?: string;
}

export interface BarberShiftRotation {
  id: string;
  barber_id: string;
  is_active: boolean;
  rotation_type: ShiftRotationType;
  start_date: string;
  shift_sequence: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ActiveShift {
  template: BarberShiftTemplate;
  weekNumber: number;
  periodStart: string;
  periodEnd: string;
}

export type OccupancyPeriod = 'weekly' | 'monthly';

export interface OccupancyStats {
  occupancy_rate: number;
  available_minutes: number;
  occupied_minutes: number;
  period_start: string;
  period_end: string;
}

export interface BarberOccupancyStats extends OccupancyStats {
  barber_id: string;
  barber_name: string;
}

export interface WeeklyOccupancy {
  week_number: number;
  stats: OccupancyStats;
}

export interface MonthlyOccupancyData {
  month: number;
  year: number;
  overall: OccupancyStats;
  weekly_breakdown: WeeklyOccupancy[];
  by_barber?: BarberOccupancyStats[];
}

export interface OccupancyThresholds {
  id: string;
  good_threshold: number;
  medium_threshold: number;
  created_at?: string;
  updated_at?: string;
}

export interface BarberMonthlyGoal {
  id: string;
  barber_id: string;
  goal_amount: number;
  created_at?: string;
  updated_at?: string;
}