
import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURAÇÃO DO SUPABASE
 * O sistema utiliza exclusivamente as variáveis injetadas via Vite/process.env.
 * Caso as variáveis não sejam encontradas, o sistema operará em modo LocalStorage.
 */

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

// Verificação de configuração mínima para habilitar sincronização em nuvem
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  supabaseUrl.startsWith('http') && 
  !!supabaseAnonKey;

if (isSupabaseConfigured) {
  console.info("Juzk SAJ: Conexão Supabase configurada com sucesso via .env");
} else {
  console.warn("Juzk SAJ: Credenciais de nuvem ausentes. O sistema utilizará LocalStorage (persistência local).");
}

/**
 * Inicialização do cliente Supabase.
 * Se as chaves estiverem vazias, usamos placeholders para não quebrar a compilação,
 * mas as chamadas de API falharão graciosamente enquanto o modo LocalStorage assume o controle.
 */
export const supabase = createClient(
  supabaseUrl || 'https://missing-url-in-env.supabase.co',
  supabaseAnonKey || 'missing-key-in-env'
);
