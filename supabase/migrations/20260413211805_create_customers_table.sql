/*
  # Create customers table

  ## Summary
  Creates a customers table to store unique customer records registered automatically
  when a booking is made via the public booking page. Email is the unique identifier.

  ## New Tables
  - `customers`
    - `id` (uuid, primary key)
    - `name` (text) - customer's name at time of first booking
    - `email` (text, unique, not null) - primary identifier
    - `phone` (text) - customer's phone number at time of first booking
    - `created_at` (timestamptz) - when first registered

  ## Security
  - RLS enabled
  - Anonymous users can INSERT (to register on booking)
  - Authenticated (admin) users can SELECT all customers
  - No UPDATE or DELETE via RLS (data immutability for customer records)

  ## Notes
  - INSERT uses ON CONFLICT DO NOTHING so duplicate emails are silently ignored
  - Only the first booking for a given email creates a customer record
*/

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  email text UNIQUE NOT NULL,
  phone text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can register customers on booking"
  ON customers
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);
