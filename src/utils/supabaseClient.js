import { createClient } from '@supabase/supabase-js';

// Create single Supabase client instance immediately
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lwgnyerzimcajauxzowx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z255ZXJ6aW1jYWphdXh6b3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMzU2NjUsImV4cCI6MjA4MTYxMTY2NX0.mhYD-K2YKeNcvgerc5WPWhzuItJDXzqdrCjrK69B2Ng';

// Always use the main Supabase URL - no proxy needed
console.log('🔧 Creating Supabase client with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token'
  },
  global: {
    headers: {
      'X-Client-Info': 'alpha-edge-web'
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
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z255ZXJ6aW1jYWphdXh6b3d4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAzNTY2NSwiZXhwItoyMDgxNjExNjY1fQ.gSBYUj0nRxmV9vJZBAS8Pg15averueduNWL9p99h4oo';
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
