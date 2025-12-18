import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://gbomfuzypytpdhajflxc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdib21mdXp5cHl0cGRoYWpmbHhjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAyMDk2MSwiZXhwIjoyMDgxNTk2OTYxfQ.sfpVc98CQTSLa-oroi0ie6FbzrQPCbjBFuZWL3ZW_n0';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
