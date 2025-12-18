# Настройка Supabase в проекте Alpha Edge

## 📋 Шаги настройки

### 1. Установка зависимостей
```bash
npm install @supabase/supabase-js
```
✅ **Уже установлено** в `package.json`

### 2. Настройка переменных окружения

**ВАЖНО:** Создайте файл `.env` в корне проекта со следующими переменными:

```bash
# В терминале выполните:
echo 'VITE_SUPABASE_URL=https://lwgnyerzimcajauxzowx.supabase.co' > .env
echo 'VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z255ZXJ6aW1jYWphdXh6b3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMzU2NjUsImV4cCI6MjA4MTYxMTY2NX0.mhYD-K2YKeNcvgerc5WPWhzuItJDXzqdrCjrK69B2Ng' >> .env
```

Или создайте файл вручную с содержимым:

```bash
# В терминале выполните:
cd /Users/a00013/Alpha\ Edge
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://lwgnyerzimcajauxzowx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z255ZXJ6aW1jYWphdXh6b3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMzU2NjUsImV4cCI6MjA4MTYxMTY2NX0.mhYD-K2YKeNcvgerc5WPWhzuItJDXzqdrCjrK69B2Ng
EOF
```

Или создайте файл вручную с содержимым:

```env
# Для Vite (рекомендуется)
VITE_SUPABASE_URL=https://lwgnyerzimcajauxzowx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z255ZXJ6aW1jYWphdXh6b3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMzU2NjUsImV4cCI6MjA4MTYxMTY2NX0.mhYD-K2YKeNcvgerc5WPWhzuItJDXzqdrCjrK69B2Ng

# Для Next.js (если будете мигрировать)
NEXT_PUBLIC_SUPABASE_URL=https://lwgnyerzimcajauxzowx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z255ZXJ6aW1jYWphdXh6b3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMzU2NjUsImV4cCI6MjA4MTYxMTY2NX0.mhYD-K2YKeNcvgerc5WPWhzuItJDXzqdrCjrK69B2Ng
```

### 3. Настройка Vercel (для продакшена)

В Vercel Dashboard добавьте переменные окружения:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 4. Структура кода

#### ✅ Supabase Client (`src/utils/supabase.js`)
```javascript
import { createClient } from '@supabase/supabase-js'

if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error("Missing Supabase env");
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

#### ✅ Auth Service (`src/services/authService.js`)
```javascript
import { supabase, auth, db } from '@/utils/supabase';

export class AuthService {
  async signUp(email, password, fullName) {
    const { data, error } = await auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          full_name: fullName,
          display_name: fullName
        }
      }
    });
    return { user: data.user, session: data.session, error };
  }

  async signIn(email, password) {
    const { data, error } = await auth.signIn({
      email: email.trim(),
      password: password
    });
    return { user: data.user, session: data.session, error };
  }
}
```

#### ✅ Форма регистрации (`src/pages/Home.jsx`)
```jsx
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [fullName, setFullName] = useState('');

const handleSignup = async (e) => {
  e.preventDefault();

  const { user, error } = await authService.signUp(
    email.trim(),
    password.trim(),
    fullName.trim()
  );

  if (error) {
    console.error('Signup error:', error.message);
    return;
  }

  console.log('Signup success:', user);
};
```

#### ✅ Форма входа
```jsx
const handleLogin = async (e) => {
  e.preventDefault();

  const { user, error } = await authService.signIn(
    email.trim(),
    password.trim()
  );

  if (error) {
    console.error('Login error:', error.message);
    return;
  }

  console.log('Login success:', user);
};
```

#### ✅ Проверка авторизации (`src/App.jsx`)
```jsx
function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const user = authService.getCurrentUser();
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        navigate('/');
      }
    };

    checkAuth();

    const unsubscribe = authService.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        navigate('/');
      }
    });

    return () => unsubscribe?.();
  }, [navigate]);

  return isAuthenticated ? children : null;
}
```

### 5. Проверка работы

1. **Запустите проект:**
```bash
npm run dev
```

2. **Проверьте консоль браузера** на ошибки связанные с Supabase

3. **Протестируйте регистрацию:**
   - Введите email, пароль и имя
   - Нажмите "Create Account"
   - Проверьте email на подтверждение

4. **Протестируйте вход:**
   - Введите email и пароль
   - Нажмите "Sign In"
   - Должны перейти на Dashboard

### 6. Возможные проблемы

#### ❌ "Cannot unmarshal object into Go struct field SignupParams.email"
**Причина:** Email передается как объект вместо строки
**Решение:** Используйте `email.trim()` и убедитесь что `email` - строка

#### ❌ "Missing Supabase environment variables"
**Причина:** Нет файла `.env` или переменных
**Решение:** Создайте `.env` файл с переменными

#### ❌ "Failed to fetch" или сетевые ошибки
**Причина:** CORS или проблемы с интернетом
**Решение:** Проверьте URL Supabase и интернет соединение

---

## Prerequisites

- Supabase account and project created
- Project URL and API keys (already configured)

## Quick Setup

### Option 1: Run the Setup Script (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Copy and paste the entire contents of `database-setup.sql`
4. Click **Run** to execute all the SQL commands

### Option 2: Manual Setup

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
