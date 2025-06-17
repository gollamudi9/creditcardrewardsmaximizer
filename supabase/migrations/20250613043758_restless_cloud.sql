/*
  # Credit Card Rewards App Database Schema

  1. New Tables
    - `categories` - Spending categories (dining, travel, etc.)
    - `users` - User profiles and preferences
    - `credit_cards` - User credit card information
    - `rewards` - Reward rates for card/category combinations
    - `transactions` - Transaction history
    - `offers` - Special offers and promotions
    - `recommendations` - AI-generated recommendations

  2. Security
    - Enable RLS on all tables
    - Add policies for user data isolation
    - Public read access for categories

  3. Performance
    - Add indexes for common queries
    - Triggers for updated_at timestamps
*/

-- Create categories table first (no foreign keys)
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL,
  color text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  avatar_url text,
  preferences jsonb DEFAULT '{"primaryGoal": "cashback", "notifications": true, "darkMode": false}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create credit_cards table
CREATE TABLE IF NOT EXISTS credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  issuer text NOT NULL,
  network text NOT NULL CHECK (network IN ('visa', 'mastercard', 'amex', 'discover', 'other')),
  last_four_digits text NOT NULL,
  expiry_month integer NOT NULL CHECK (expiry_month >= 1 AND expiry_month <= 12),
  expiry_year integer NOT NULL,
  color text NOT NULL,
  cardholder_name text NOT NULL,
  credit_limit decimal(10,2) NOT NULL DEFAULT 0,
  current_balance decimal(10,2) NOT NULL DEFAULT 0,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid REFERENCES credit_cards(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  rate decimal(5,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('cashback', 'points', 'miles')),
  max_amount decimal(10,2),
  min_spend decimal(10,2),
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid REFERENCES credit_cards(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  merchant_name text NOT NULL,
  amount decimal(10,2) NOT NULL,
  transaction_date timestamptz NOT NULL,
  reward_earned_amount decimal(10,2) DEFAULT 0,
  reward_earned_type text CHECK (reward_earned_type IN ('cashback', 'points', 'miles')),
  is_recurring boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create offers table
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid REFERENCES credit_cards(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  merchant_name text,
  discount_percentage decimal(5,2) NOT NULL,
  min_spend decimal(10,2),
  max_discount decimal(10,2),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_activated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  potential_savings decimal(10,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('card_switch', 'new_card', 'spending_habit')),
  card_id uuid REFERENCES credit_cards(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  is_dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for credit_cards table
CREATE POLICY "Users can manage own credit cards"
  ON credit_cards
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create policies for rewards table
CREATE POLICY "Users can manage rewards for own cards"
  ON rewards
  FOR ALL
  TO authenticated
  USING (
    card_id IN (
      SELECT id FROM credit_cards WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    card_id IN (
      SELECT id FROM credit_cards WHERE user_id = auth.uid()
    )
  );

-- Create policies for transactions table
CREATE POLICY "Users can manage transactions for own cards"
  ON transactions
  FOR ALL
  TO authenticated
  USING (
    card_id IN (
      SELECT id FROM credit_cards WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    card_id IN (
      SELECT id FROM credit_cards WHERE user_id = auth.uid()
    )
  );

-- Create policies for offers table
CREATE POLICY "Users can manage offers for own cards"
  ON offers
  FOR ALL
  TO authenticated
  USING (
    card_id IN (
      SELECT id FROM credit_cards WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    card_id IN (
      SELECT id FROM credit_cards WHERE user_id = auth.uid()
    )
  );

-- Create policies for recommendations table
CREATE POLICY "Users can manage own recommendations"
  ON recommendations
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create policies for categories table (public read access)
CREATE POLICY "Anyone can read categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default categories with proper UUIDs
DO $$
DECLARE
  dining_id uuid := gen_random_uuid();
  travel_id uuid := gen_random_uuid();
  groceries_id uuid := gen_random_uuid();
  gas_id uuid := gen_random_uuid();
  entertainment_id uuid := gen_random_uuid();
  shopping_id uuid := gen_random_uuid();
  bills_id uuid := gen_random_uuid();
  other_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO categories (id, name, icon, color) VALUES
    (dining_id, 'Dining', 'utensils', '#FF5722'),
    (travel_id, 'Travel', 'plane', '#2196F3'),
    (groceries_id, 'Groceries', 'shopping-cart', '#4CAF50'),
    (gas_id, 'Gas', 'fuel', '#FFC107'),
    (entertainment_id, 'Entertainment', 'film', '#9C27B0'),
    (shopping_id, 'Shopping', 'shopping-bag', '#F44336'),
    (bills_id, 'Bills & Utilities', 'receipt', '#3F51B5'),
    (other_id, 'Other', 'more-horizontal', '#607D8B')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_card_id ON rewards(card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_card_id ON transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_offers_card_id ON offers(card_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_cards_updated_at BEFORE UPDATE ON credit_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();