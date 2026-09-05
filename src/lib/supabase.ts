import { createClient } from '@supabase/supabase-js';

// Read values from local environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables missing. Please check .env.local'
  );
}

// Global Supabase client instance for client-side and server-side calls
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);