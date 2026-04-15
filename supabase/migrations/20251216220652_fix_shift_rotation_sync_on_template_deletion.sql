/*
  # Fix Shift Rotation Synchronization
  
  1. Problem
    - When shift templates are deleted, the rotation keeps invalid template IDs
    - This causes the calendar to appear empty
  
  2. Solution
    - Add trigger to automatically clean rotation when templates are deleted
    - Remove invalid template IDs from shift_sequence
    - Deactivate rotation if no valid templates remain
*/

-- Function to clean rotation when templates are deleted
CREATE OR REPLACE FUNCTION cleanup_rotation_on_template_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Update rotation to remove the deleted template ID from sequence
  UPDATE barber_shift_rotations
  SET 
    shift_sequence = array_remove(shift_sequence, OLD.id),
    updated_at = now()
  WHERE barber_id = OLD.barber_id;
  
  -- Deactivate rotation if sequence becomes empty
  UPDATE barber_shift_rotations
  SET 
    is_active = false,
    updated_at = now()
  WHERE barber_id = OLD.barber_id
    AND array_length(shift_sequence, 1) IS NULL;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_cleanup_rotation_on_template_delete ON barber_shift_templates;
CREATE TRIGGER trigger_cleanup_rotation_on_template_delete
  AFTER DELETE ON barber_shift_templates
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_rotation_on_template_delete();
