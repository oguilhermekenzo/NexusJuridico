
import { createClient } from '@supabase/supabase-js';

/**
 * Valida se uma string parece ser uma chave técnica real (sem espaços, tamanho mínimo)
 */
const isTechnicalKey = (val: string | null | undefined): boolean => {
  if (!val) return false;
  const s = val.trim();
  // Chaves reais não costumam ter espaços e têm tamanho razoável
  return s.length > 15 && !s.includes(" ") && !s.includes("Quero");
};

export const getSafeEnv = (key: string): string => {
  // 1. Prioridade absoluta: LocalStorage (salvo pelo usuário na interface)
  const saved = localStorage.getItem(`juzk_env_${key}`);
  if (saved && saved.trim() !== "") return saved.trim();

  // 2. Fallback: process.env (Vite Define) - mas só se parecer uma chave válida
  try {
    let envVal = "";
    if (key === 'API_KEY') envVal = process.env.API_KEY || "";
    if (key === 'VITE_SUPABASE_URL') envVal = process.env.VITE_SUPABASE_URL || "";
    if (key === 'VITE_SUPABASE_ANON_KEY') envVal = process.env.VITE_SUPABASE_ANON_KEY || "";

    if (isTechnicalKey(envVal)) return envVal;
  } catch (e) {
    // Silencioso
  }
  
  return "";
};

const supabaseUrl = getSafeEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getSafeEnv('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = 
  isTechnicalKey(supabaseUrl) && 
  supabaseUrl.startsWith('http') && 
  isTechnicalKey(supabaseAnonKey);

/**
 * Inicializa o cliente Supabase.
 */
export const supabase = createClient(
  supabaseUrl || 'https://juzk-placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

if (isSupabaseConfigured) {
  console.info("Juzk SAJ: Conexão Supabase configurada com sucesso.");
} else {
  console.warn("Juzk SAJ: Chaves de conexão inválidas ou ausentes.");
}
