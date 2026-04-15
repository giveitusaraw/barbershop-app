/*
  # Create get_customers_with_last_visit RPC function

  ## Purpose
  Returns all customers enriched with the date of their most recent
  non-cancelled appointment, enabling identification of inactive customers.

  ## Details
  - Joins customers with appointments on email (case-insensitive)
  - Excludes cancelled appointments from the last_visit calculation
  - Returns last_visit as null if the customer has no appointments
  - Results ordered by last_visit ascending (oldest first) so inactive
    customers surface at the top
  - Accessible by the anon role to match the rest of the app's auth model
*/

CREATE OR REPLACE FUNCTION get_customers_with_last_visit()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  phone text,
  created_at timestamptz,
  last_visit date
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.name,
    c.email,
    c.phone,
    c.created_at,
    MAX(a.appointment_date) AS last_visit
  FROM customers c
  LEFT JOIN appointments a
    ON lower(a.customer_email) = lower(c.email)
    AND a.status != 'cancelled'
  GROUP BY c.id, c.name, c.email, c.phone, c.created_at
  ORDER BY last_visit ASC NULLS FIRST, c.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_customers_with_last_visit() TO anon;
