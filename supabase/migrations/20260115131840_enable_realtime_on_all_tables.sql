/*
  # Enable Realtime on All Core Tables

  1. Changes
    - Enable Realtime publication on all core tables to allow real-time updates
    - This ensures that changes in any table are immediately reflected in all clients

  2. Tables Enabled
    - barbers: Real-time updates when barbers are added, edited, or removed
    - services: Real-time updates when services change
    - barber_services: Real-time updates when barber-service assignments change
    - barber_weekly_schedule: Real-time updates when schedules change
    - weekly_schedule_overrides: Real-time updates when schedule exceptions change
    - barber_shift_templates: Real-time updates when shift templates change
    - barber_shift_rotations: Real-time updates when shift rotations change
    - recurring_appointments: Real-time updates when recurring appointments change
    - homepage_settings: Real-time updates when homepage settings change

  3. Important Notes
    - This enables comprehensive real-time functionality across the application
    - Admin dashboards and calendars will automatically reflect all changes
    - No data is modified, only publication settings are updated
*/

-- Enable realtime for all core tables
DO $$
BEGIN
  -- Barbers and related tables
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE barbers;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE services;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE barber_services;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  -- Schedule-related tables
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE barber_weekly_schedule;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE weekly_schedule_overrides;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE barber_shift_templates;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE barber_shift_rotations;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  -- Appointments and recurring
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE recurring_appointments;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  -- Homepage settings
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE homepage_settings;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
