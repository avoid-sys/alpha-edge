import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lwgnyerzimcajauxzowx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z255ZXJ6aW1jYWphdXh6b3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMzU2NjUsImV4cCI6MjA4MTYxMTY2NX0.mhYD-K2YKeNcvgerc5WPWhzuItJDXzqdrCjrK69B2Ng';
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z255ZXJ6aW1jYWphdXh6b3d4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAzNTY2NSwiZXhwItoyMDgxNjExNjY1fQ.gSBYUj0nRxmV9vJZBAS8Pg15averueduNWL9p99h4oo';

// Debug environment variables
console.log('🔍 Environment Variables Check:');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('VITE_SUPABASE_ANON_KEY length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0);

console.log('🔧 Supabase Config:', {
  url: supabaseUrl,
  keySet: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length,
  envUrl: import.meta.env.VITE_SUPABASE_URL,
  envKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
});

// Use proxy URL for localhost to avoid CORS issues
const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const finalUrl = isLocalhost ? 'http://localhost:3008/supabase-api' : supabaseUrl;
console.log('🌐 Using Supabase URL:', finalUrl, '(localhost proxy:', isLocalhost + ')');

export const supabase = createClient(finalUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'alpha-edge-web',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Admin client for server-side operations (use carefully)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
