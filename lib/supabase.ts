
import { createClient } from '@supabase/supabase-js';

export const getSafeEnv = (key: string): string => {
  // 1. Tenta LocalStorage (Configurações manuais do usuário no app)
  const saved = localStorage.getItem(`juzk_env_${key}`);
  if (saved && saved.trim() !== "") return saved.trim();

  // 2. Tenta process.env (Injetado pelo Vite/Vercel via vite.config.ts)
  try {
    const envObj = (process as any).env;
    const val = envObj[key];
    if (val && typeof val === 'string' && val.length > 5) {
      // Se for a API_KEY e tiver texto de erro do usuário (com espaços), ignora
      if (key === 'API_KEY' && val.includes(" ") && val.length < 50) return "";
      return val.trim();
    }
  } catch (e) {}
  
  return "";
};

const supabaseUrl = getSafeEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getSafeEnv('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = 
  supabaseUrl.startsWith('http') && 
  supabaseAnonKey.length > 20;

// O cliente é inicializado sempre. Se as chaves forem inválidas, 
// as chamadas retornarão erro, o que é tratado nos contextos.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
