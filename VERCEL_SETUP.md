# 🔧 Vercel Production Setup Guide

## Environment Variables для Alpha Edge

### Добавление переменных в Vercel Dashboard

1. Перейди в [Vercel Dashboard](https://vercel.com/dashboard)
2. Выбери проект **alpha-edge**
3. Перейди в **Settings** → **Environment Variables**

### Добавь эти переменные:

#### Supabase Configuration
```
VITE_SUPABASE_URL=https://lwgnyerzimcajauxzowx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z255ZXJ6aW1jYWphdXh6b3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMzU2NjUsImV4cCI6MjA4MTYxMTY2NX0.mhYD-K2YKeNcvgerc5WPWhzuItJDXzqdrCjrK69B2Ng
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z255ZXJ6aW1jYWphdXh6b3d4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAzNTY2NSwiZXhwItoyMDgxNjExNjY1fQ.gSBYUj0nRxmV9vJZBAS8Pg15averueduNWL9p99h4oo
```

#### cTrader Configuration (Client-side)
```
VITE_CTRADER_FULL_CLIENT_ID=19506_ZNLG80oi7Bj6mt9wi4g9KYgRh3OcEbHele1YzBfeOFvKL0A0nF  # FULL public key for ALL cTrader operations (OAuth + WebSocket)
VITE_CTRADER_CLIENT_SECRET=Pr937hf9OaHKwv1xqbDc0u0clPtJAohDqOZA6UABPC7JikagPe
VITE_CTRADER_AUTH_URL=https://id.ctrader.com/my/settings/openapi/grantingaccess
VITE_CTRADER_WS_DEMO=wss://demo.ctraderapi.com:5035
VITE_CTRADER_WS_LIVE=wss://live.ctraderapi.com:5035
```

#### cTrader Server-side (for Vercel serverless functions)
```
CTRADER_FULL_CLIENT_ID=19506_ZNLG80oi7Bj6mt9wi4g9KYgRh3OcEbHele1YzBfeOFvKL0A0nF  # FULL public key for token exchange (same as client-side)
CTRADER_CLIENT_SECRET=Pr937hf9OaHKwv1xqbDc0u0clPtJAohDqOZA6UABPC7JikagPe
CTRADER_TOKEN_URL=https://openapi.ctrader.com/apps/token
```

#### ⚠️ CRITICAL: cTrader ID Formats (Updated!)
**cTrader uses CONSISTENT FULL Client ID for ALL operations!**

**Two identifiers needed:**
1. **Client ID**: FULL public key string `19506_ZNLG80oi7Bj6mt9wi4g9KYgRh3OcEbHele1YzBfeOFvKL0A0nF` (for ALL operations)
2. **Client Secret**: Full long string (for both OAuth and WebSocket)

**Where to use the Client ID:**
- **OAuth flows** (grantingaccess, token exchange): FULL public key string
- **WebSocket ProtoOAApplicationAuthReq**: FULL public key string
- **ProtoOAAccountAuthReq**: Use access_token from OAuth (no client ID needed)

**To find your IDs:**
1. Go to https://connect.spotware.com/apps or https://openapi.ctrader.com/apps
2. Find your "Alpha Edge" app
3. Click "View" or "Credentials"
4. **Client ID/Public Key** = full string (e.g., `19506_ZNLG80oi7Bj6mt9wi4g9KYgRh3OcEbHele1YzBfeOFvKL0A0nF`)
5. **Client Secret** = full long string (keep as-is)

**Critical Error Fixes:**
- "Malformed clientId parameter" in ProtoOAApplicationAuthReq = use FULL public key string
- "Application authentication failed" = wrong WebSocket clientId format
- "429 Too Many Requests" = rate limit exceeded, wait 5-15 minutes before retrying
- HTML response instead of JSON = rate limit or authorization code expired

### Настройки:
- **Environment:** Production
- **Preview:** ✅ (если используешь preview деплойменты)

### После добавления переменных:
1. Перейди в **Deployments**
2. Нажми **Redeploy** на последнем успешном деплое
3. Или сделай новый push в main branch

## Supabase Redirect URLs

### Настройка в Supabase Dashboard

1. Перейди в [Supabase Dashboard](https://supabase.com/dashboard)
2. Выбери проект **Alpha Edge**
3. Перейди в **Authentication** → **Settings**

### В разделе "URL Configuration":

#### Site URL:
```
https://alphaedge.vc
```

#### Additional Redirect URLs:
```
https://alphaedge.vc/*
https://alphaedge.vc/auth/confirm
https://alphaedge.vc/dashboard
https://*.vercel.app/*
https://localhost:3008/*
```

### Сохрани изменения

## Serverless Functions Setup

### cTrader Token Exchange API

Проект включает serverless функцию для безопасного обмена OAuth токенов:

- **Endpoint:** `/api/ctrader/token-exchange`
- **Method:** POST
- **Purpose:** Обмен authorization code на access_token + refresh_token
- **Security:** Client secret хранится только на сервере

### Environment Variables для Serverless

Убедись что на Vercel добавлены server-side переменные (без префикса VITE_):

```
CTRADER_CLIENT_ID=19506_ZNLG80oi7Bj6mt9wi4g9KYgRh3OcEbHele1YzBfeOFvKL0A0nF
CTRADER_CLIENT_SECRET=Pr937hf9OaHKwv1xqbDc0u0clPtJAohDqOZA6UABPC7JikagPe
CTRADER_TOKEN_URL=https://openapi.ctrader.com/apps/token
```

## Проверка работы

### После настройки:

1. **Тестируй регистрацию** на https://alphaedge.vc
2. **Проверь DevTools:**
   - Console: нет ошибок "Load failed"
   - Network: запросы к Supabase успешны (статус 200)
3. **Тестируй cTrader OAuth** на продакшене

### Если проблемы остаются:

- Проверь что переменные добавлены **ТОЧНО** как указано выше
- Убедись что **VITE_** префикс присутствует
- Передеплой проект после добавления переменных
- Проверь логи Vercel в Dashboard → Functions

## 🚀 Готово!

После выполнения всех шагов регистрация и аутентификация должны работать на продакшене без ошибок "Load failed".
