/*
  # Create push subscriptions table

  1. New Tables
    - `push_subscriptions`
      - `id` (uuid, primary key) - Unique identifier for the subscription
      - `user_id` (uuid, foreign key) - Reference to admin_accounts table
      - `endpoint` (text) - Push subscription endpoint URL
      - `p256dh_key` (text) - Client public key for encryption
      - `auth_key` (text) - Authentication secret for push messages
      - `user_agent` (text) - Browser/device information
      - `created_at` (timestamptz) - When subscription was created
      - `last_used_at` (timestamptz) - Last time subscription was used
      - `is_active` (boolean) - Whether subscription is active

  2. Security
    - Enable RLS on `push_subscriptions` table
    - Add policy for authenticated users to manage their own subscriptions
    - Add policy for admins to view all subscriptions

  3. Indexes
    - Index on user_id for faster lookups
    - Index on endpoint for uniqueness checks
    - Index on is_active for filtering active subscriptions
*/

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES admin_accounts(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  user_agent text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(endpoint)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own subscriptions
CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_accounts
      WHERE admin_accounts.id = push_subscriptions.user_id
      AND admin_accounts.id = auth.uid()
    )
  );

-- Policy: Users can view their own subscriptions
CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_accounts
      WHERE admin_accounts.id = user_id
      AND admin_accounts.id = auth.uid()
    )
  );

-- Policy: Users can update their own subscriptions
CREATE POLICY "Users can update own push subscriptions"
  ON push_subscriptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_accounts
      WHERE admin_accounts.id = user_id
      AND admin_accounts.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_accounts
      WHERE admin_accounts.id = user_id
      AND admin_accounts.id = auth.uid()
    )
  );

-- Policy: Users can delete their own subscriptions
CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_accounts
      WHERE admin_accounts.id = user_id
      AND admin_accounts.id = auth.uid()
    )
  );

-- Policy: Allow Edge Functions to read active subscriptions (service_role only)
CREATE POLICY "Edge Functions can read active push subscriptions"
  ON push_subscriptions FOR SELECT
  TO service_role
  USING (is_active = true);
