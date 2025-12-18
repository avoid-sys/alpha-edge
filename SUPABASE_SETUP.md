# Supabase Setup Guide

This guide will help you set up the Supabase database schema for the Alpha Edge trading platform.

## Prerequisites

- Supabase account and project created
- Project URL and API keys (already configured)

## Database Schema

### 1. Profiles Table

```sql
-- Create profiles table
CREATE TABLE profiles (
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
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### 2. Trades Table

```sql
-- Create trades table
CREATE TABLE trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('Buy', 'Sell')),
  entry_price DECIMAL(20,8),
  exit_price DECIMAL(20,8),
  volume DECIMAL(20,8),
  net_profit DECIMAL(20,8),
  balance DECIMAL(20,8),
  open_time TIMESTAMP WITH TIME ZONE,
  close_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own trades" ON trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades" ON trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades" ON trades
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades" ON trades
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_close_time ON trades(close_time);
CREATE INDEX idx_trades_symbol ON trades(symbol);
```

### 3. Leaderboard Table

```sql
-- Create leaderboard table
CREATE TABLE leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  trader_score DECIMAL(10,2) DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  profit_factor DECIMAL(10,2) DEFAULT 0,
  total_profit DECIMAL(20,8) DEFAULT 0,
  total_loss DECIMAL(20,8) DEFAULT 0,
  best_trade DECIMAL(20,8) DEFAULT 0,
  worst_trade DECIMAL(20,8) DEFAULT 0,
  avg_win DECIMAL(20,8) DEFAULT 0,
  avg_loss DECIMAL(20,8) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view leaderboard" ON leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own leaderboard entry" ON leaderboard
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leaderboard entry" ON leaderboard
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_leaderboard_score ON leaderboard(trader_score DESC);
CREATE INDEX idx_leaderboard_user_id ON leaderboard(user_id);
```

## Authentication Settings

### 1. Site URL
Set your site URL in Supabase Dashboard:
- Go to Authentication > Settings
- Set Site URL to your production domain (e.g., `https://yourdomain.com`)

### 2. Redirect URLs
Configure redirect URLs for email confirmation and password reset:
- Email Confirmations: `https://yourdomain.com`
- Password Reset: `https://yourdomain.com/reset-password`

### 3. Email Templates (Optional)
Customize email templates in Authentication > Email Templates for:
- Confirm signup
- Invite user
- Reset password

## Environment Variables

Make sure your environment has:
```env
SUPABASE_URL=https://lwgnyerzimcajauxzowx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z255ZXJ6aW1jYWphdXh6b3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMzU2NjUsImV4cCI6MjA4MTYxMTY2NX0.mhYD-K2YKeNcvgerc5WPWhzuItJDXzqdrCjrK69B2Ng
```

## Testing the Setup

1. **Sign Up**: Test user registration
2. **Email Verification**: Check that confirmation emails are sent
3. **Sign In**: Test user login
4. **Profile Creation**: Verify user profiles are created automatically
5. **Trade Upload**: Test uploading trade data
6. **Leaderboard**: Check leaderboard functionality

## Security Notes

- Row Level Security (RLS) is enabled on all tables
- Users can only access their own data
- Leaderboard is publicly readable for competition
- All database operations are authenticated through Supabase

## Troubleshooting

1. **Authentication Issues**: Check Supabase logs in the dashboard
2. **RLS Errors**: Verify policies are correctly applied
3. **Email Issues**: Check SMTP settings in Supabase
4. **CORS Issues**: Ensure your domain is whitelisted in Supabase
