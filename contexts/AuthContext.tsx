
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AppUser, Office } from '../types';

interface AuthContextType {
  user: AppUser | null;
  office: Office | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  loginAsDev: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// IDs Fixos para o ambiente de desenvolvedor
const DEV_OFFICE_ID = '00000000-0000-0000-0000-000000000000';
const DEV_USER_ID = 'dev-user-master';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [office, setOffice] = useState<Office | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    // 1. Verificar se há um login de desenvolvedor forçado no localStorage
    const isDev = localStorage.getItem('juzk_dev_mode') === 'true';
    if (isDev) {
      setUser({
        id: DEV_USER_ID,
        email: 'dev@juzk.ia',
        officeId: DEV_OFFICE_ID,
        name: 'Desenvolvedor Master'
      });
      setOffice({
        id: DEV_OFFICE_ID,
        name: 'Escritório de Desenvolvimento'
      });
      setLoading(false);
      return;
    }

    try {
      // Cast supabase.auth to any to resolve 'Property getSession does not exist on type SupabaseAuthClient'
      const { data: { session } } = await (supabase.auth as any).getSession();
      if (session) {
        const officeId = session.user.user_metadata.office_id;
        setUser({
          id: session.user.id,
          email: session.user.email!,
          officeId: officeId,
          name: session.user.user_metadata.full_name
        });

        const { data: officeData } = await supabase
          .from('offices')
          .select('*')
          .eq('id', officeId)
          .single();
        
        if (officeData) setOffice(officeData);
      } else {
        setUser(null);
        setOffice(null);
      }
    } catch (error) {
      console.error("Erro ao carregar sessão:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
    // Cast supabase.auth to any to resolve 'Property onAuthStateChange does not exist on type SupabaseAuthClient'
    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange(() => {
      refreshSession();
    });
    return () => subscription.unsubscribe();
  }, []);

  const loginAsDev = () => {
    localStorage.setItem('juzk_dev_mode', 'true');
    refreshSession();
  };

  const signOut = async () => {
    localStorage.removeItem('juzk_dev_mode');
    // Cast supabase.auth to any to resolve 'Property signOut does not exist on type SupabaseAuthClient'
    await (supabase.auth as any).signOut();
    setUser(null);
    setOffice(null);
  };

  return (
    <AuthContext.Provider value={{ user, office, loading, signOut, refreshSession, loginAsDev }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
