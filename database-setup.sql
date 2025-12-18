-- Alpha Edge Database Setup
-- Run this entire script in your Supabase SQL Editor

-- =============================================
-- PROFILES TABLE
-- =============================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- TRADES TABLE
-- =============================================

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('Buy', 'Sell')),
  entry_price DECIMAL(20,8),
  exit_price DECIMAL(20,8),
  volume DECIMAL(20,8),
  profit_loss DECIMAL(20,8),
  entry_time TIMESTAMP WITH TIME ZONE,
  exit_time TIMESTAMP WITH TIME ZONE,
  close_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  strategy TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own trades" ON trades;
CREATE POLICY "Users can view their own trades" ON trades
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own trades" ON trades;
CREATE POLICY "Users can insert their own trades" ON trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own trades" ON trades;
CREATE POLICY "Users can update their own trades" ON trades
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own trades" ON trades;
CREATE POLICY "Users can delete their own trades" ON trades
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- LEADERBOARD TABLE
-- =============================================

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  trader_score DECIMAL(10,2) DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  profit_percentage DECIMAL(10,4) DEFAULT 0,
  total_profit DECIMAL(20,8) DEFAULT 0,
  total_loss DECIMAL(20,8) DEFAULT 0,
  best_trade DECIMAL(20,8) DEFAULT 0,
  worst_trade DECIMAL(20,8) DEFAULT 0,
  avg_win DECIMAL(20,8) DEFAULT 0,
  avg_loss DECIMAL(20,8) DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_trade_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON leaderboard;
CREATE POLICY "Anyone can view leaderboard" ON leaderboard
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own leaderboard entry" ON leaderboard;
CREATE POLICY "Users can update their own leaderboard entry" ON leaderboard
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- SECURITY LOGS TABLE
-- =============================================

-- Create security_logs table
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (only service role can insert)
DROP POLICY IF EXISTS "Only service role can insert logs" ON security_logs;
CREATE POLICY "Only service role can insert logs" ON security_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- =============================================
-- FUNCTIONS AND INDEXES
-- =============================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trades_updated_at ON trades;
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leaderboard_updated_at ON leaderboard;
CREATE TRIGGER update_leaderboard_updated_at BEFORE UPDATE ON leaderboard
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_close_time ON trades(close_time);
CREATE INDEX IF NOT EXISTS idx_leaderboard_trader_score ON leaderboard(trader_score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);

-- =============================================
-- TEST DATA (Optional)
-- =============================================

-- Insert some test leaderboard data (optional - remove in production)
INSERT INTO leaderboard (user_id, trader_score, total_trades, win_rate, profit_percentage)
VALUES
  ('00000000-0000-0000-0000-000000000001', 95.2, 1250, 68.5, 45.2),
  ('00000000-0000-0000-0000-000000000002', 92.8, 980, 71.2, 38.9),
  ('00000000-0000-0000-0000-000000000003', 89.5, 1450, 65.8, 52.1)
ON CONFLICT (user_id) DO NOTHING;

-- =============================================
-- SETUP COMPLETE
-- =============================================

-- Verify setup by running these queries:
-- SELECT * FROM profiles LIMIT 1;
-- SELECT * FROM trades LIMIT 1;
-- SELECT * FROM leaderboard LIMIT 1;
-- SELECT * FROM security_logs LIMIT 1;
