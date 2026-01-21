
import { createClient } from '@supabase/supabase-js';

// Use environment variables or placeholders to prevent constructor errors
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder';

// Check if we have real credentials
export const isSupabaseConfigured = 
  process.env.SUPABASE_URL !== undefined && 
  process.env.SUPABASE_URL !== '' &&
  process.env.SUPABASE_ANON_KEY !== undefined &&
  process.env.SUPABASE_ANON_KEY !== '';

if (!isSupabaseConfigured) {
  console.warn("Supabase: Credenciais ausentes. O sistema usará o armazenamento local do navegador como fallback.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
