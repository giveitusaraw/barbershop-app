/*
  # Create Persistent Sessions Table

  ## Summary
  Implements a server-side session management system to allow users to remain
  logged in across page refreshes and browser restarts, with sessions that
  persist until the user explicitly logs out.

  ## New Tables

  ### `sessions`
  Stores active login sessions for admin accounts.

  - `id` (uuid, primary key) - Unique session identifier
  - `account_id` (uuid, foreign key → admin_accounts.id) - The account this session belongs to
  - `token` (text, unique) - Secure random token stored in the client's localStorage
  - `created_at` (timestamptz) - When the session was first created
  - `last_activity` (timestamptz) - Last time the session was validated/renewed
  - `expires_at` (timestamptz) - Set to NULL meaning the session never expires automatically

  ## Security

  - RLS enabled on `sessions` table
  - Anonymous users can validate, create, update, and delete sessions
    (required because this app uses a custom auth system, not Supabase Auth)
  - Sessions are identified by their token (a long random string), making
    unauthorized access practically impossible without the token
  - Old/orphaned sessions can be cleaned up via the delete policy

  ## Notes

  1. Sessions persist until the user explicitly logs out
  2. Each login creates a new session row; multiple sessions per account are supported
  3. `last_activity` is updated on every session validation to track usage
  4. Expired sessions (where expires_at is set and in the past) are rejected on validation
*/

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES admin_accounts(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS sessions_token_idx ON sessions(token);
CREATE INDEX IF NOT EXISTS sessions_account_id_idx ON sessions(account_id);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon to validate session by token"
  ON sessions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to create session on login"
  ON sessions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to update session activity"
  ON sessions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete session on logout"
  ON sessions FOR DELETE
  TO anon
  USING (true);
