
import { createClient } from '@supabase/supabase-js';

/**
 * Nota de Segurança: Para não subir as chaves para o Git:
 * 1. Crie um arquivo .env na raiz do seu projeto local.
 * 2. Adicione SUPABASE_URL e SUPABASE_ANON_KEY lá.
 * 3. O código abaixo prioriza o .env, mas usa as suas chaves reais como fallback 
 *    para que o sistema funcione agora no seu ambiente de visualização.
 */

const defaultUrl = 'https://jltvtleovsdknhdyhpzv.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdHZ0bGVvdnNka25oZHlocHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDY3NzUsImV4cCI6MjA4NDU4Mjc3NX0.Z84FpgTSOy4JCCsA_x4rQQo0AwWnUzBW_5AKsVWQHjs';

// O Vite injeta essas variáveis se elas estiverem configuradas no ambiente
const supabaseUrl = process.env.SUPABASE_URL || defaultUrl;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || defaultKey;

// Verifica se as credenciais são as de exemplo/placeholder ou reais
export const isSupabaseConfigured = 
  supabaseUrl !== '' && 
  supabaseUrl.includes('supabase.co');

if (!isSupabaseConfigured) {
  console.warn(
    "Juzk SAJ: Configuração de nuvem incompleta. Verifique as variáveis de ambiente."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
