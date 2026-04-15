/*
  # Fix shift_sequence data type
  
  1. Changes
    - Change shift_sequence column from text[] to uuid[] in barber_shift_rotations table
    - This ensures proper UUID comparison and validation
*/

ALTER TABLE barber_shift_rotations 
ALTER COLUMN shift_sequence TYPE uuid[] USING shift_sequence::uuid[];
