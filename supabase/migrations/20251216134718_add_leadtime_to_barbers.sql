/*
  # Add Leadtime to Barbers

  ## Changes
  
  1. Barbers Table Updates
    - Add `leadtime_minutes` (integer) - minimum advance time in minutes required for bookings
    - Default value: 0 (no restriction)
    - This allows each barber to have their own minimum booking advance time
  
  ## Important Notes
  - Leadtime of 0 means customers can book up until the current time (if slots are available)
  - Leadtime of 30 means customers must book at least 30 minutes in advance
  - The booking system will filter out slots that fall within the leadtime window
*/

-- Add leadtime_minutes column to barbers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'barbers' AND column_name = 'leadtime_minutes'
  ) THEN
    ALTER TABLE barbers ADD COLUMN leadtime_minutes integer DEFAULT 0 NOT NULL;
  END IF;
END $$;