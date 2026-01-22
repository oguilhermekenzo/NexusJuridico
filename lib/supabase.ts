import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURAÇÃO DO SUPABASE
 * Utiliza o padrão import.meta.env (nativo do Vite) para ler variáveis prefixadas com VITE_.
 */

// Acesso seguro ao import.meta.env para evitar erros de runtime
// Fixed TypeScript errors by explicitly typing 'env' as 'any' to allow access to VITE_ properties
const env: any = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

const supabaseUrl = env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || "";

// Verificação de configuração mínima para habilitar sincronização em nuvem
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  supabaseUrl.startsWith('http') && 
  !!supabaseAnonKey;

if (isSupabaseConfigured) {
  console.info("Juzk SAJ: Conexão Supabase estabelecida via import.meta.env");
} else {
  console.warn("Juzk SAJ: Variáveis VITE_SUPABASE não encontradas. O sistema operará em modo LocalStorage.");
}

/**
 * Inicialização do cliente Supabase.
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
