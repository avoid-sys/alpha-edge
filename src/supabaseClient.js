import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gbomfuzypytpdhajflxc.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdib21mdXp5cHl0cGRoYWpmbHhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMjA5NjEsImV4cCI6MjA4MTU5Njk2MX0.DcRO5jKNILPLvAIoF0d58b9pbJkEYLRaMteJLZWxrlc';

export const supabase = createClient(supabaseUrl, supabaseKey);
