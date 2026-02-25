import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
export const SUPABASE_URL = 'https://drhkxyhffyndzvsgdufd.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyaGt4eWhmZnluZHp2c2dkdWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNTg3NDgsImV4cCI6MjA3OTczNDc0OH0.l3gV6fDJ0cVnLEly8ujsCoY1pYRAOKcv9ty8GBgCGxA';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase credentials are missing');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
