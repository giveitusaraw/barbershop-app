/*
  # Enable Realtime on Appointments Table

  1. Changes
    - Enable Realtime publication on appointments table to allow real-time updates
    - This ensures that when appointments are created, updated, or deleted,
      all connected clients receive instant notifications

  2. Important Notes
    - This enables real-time subscriptions on the appointments table
    - Admin calendars will automatically refresh when appointments change
    - No data is modified, only the publication settings are updated
*/

-- Enable realtime for appointments table
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
