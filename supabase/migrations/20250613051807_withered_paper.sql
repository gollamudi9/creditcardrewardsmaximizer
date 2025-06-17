/*
  # Add Plaid credentials table

  1. New Tables
    - `plaid_credentials`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `encrypted_access_token` (text, encrypted Plaid access token)
      - `item_id` (text, Plaid item identifier)
      - `last_sync_timestamp` (timestamptz, last successful sync)
      - `status` (text, connection status)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `plaid_credentials` table
    - Add policy for users to manage their own credentials
*/

-- Create plaid_credentials table
CREATE TABLE IF NOT EXISTS plaid_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  encrypted_access_token text NOT NULL,
  item_id text NOT NULL,
  last_sync_timestamp timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE plaid_credentials ENABLE ROW LEVEL SECURITY;

-- Create policy for plaid_credentials table
CREATE POLICY "Users can manage own plaid credentials"
  ON plaid_credentials
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_plaid_credentials_user_id ON plaid_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_credentials_item_id ON plaid_credentials(item_id);
CREATE INDEX IF NOT EXISTS idx_plaid_credentials_status ON plaid_credentials(status);

-- Create trigger for updated_at
CREATE TRIGGER update_plaid_credentials_updated_at BEFORE UPDATE ON plaid_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();