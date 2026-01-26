
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AppUser, Office, UserRole } from '../types';

interface AuthContextType {
  user: AppUser | null;
  office: Office | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  loginAsDev: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const DEV_OFFICE_ID = '00000000-0000-0000-0000-000000000000';
const DEV_USER_ID = 'dev-user-master';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [office, setOffice] = useState<Office | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureDevOfficeExists = async () => {
    if (!isSupabaseConfigured) return;
    try {
      // Usar upsert para garantir que o escritório exista sem dar erro se já existir
      await supabase.from('offices').upsert([{ 
        id: DEV_OFFICE_ID, 
        name: 'Escritório de Desenvolvimento' 
      }], { onConflict: 'id' });
    } catch (e) {
      console.error("Erro ao garantir escritório dev:", e);
    }
  };

  const refreshSession = async () => {
    const isDev = localStorage.getItem('juzk_dev_mode') === 'true';
    
    if (isDev) {
      await ensureDevOfficeExists();
      setUser({
        id: DEV_USER_ID,
        email: 'dev@juzk.ia',
        officeId: DEV_OFFICE_ID,
        name: 'Desenvolvedor Master',
        role: UserRole.SUPER_ADMIN
      });
      setOffice({
        id: DEV_OFFICE_ID,
        name: 'Escritório de Desenvolvimento'
      });
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await (supabase.auth as any).getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, offices(*)')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            officeId: profile.office_id,
            name: profile.full_name,
            role: (profile.role as UserRole) || UserRole.LAWYER
          });
          setOffice(profile.offices);
        } else {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            officeId: session.user.user_metadata?.office_id,
            name: session.user.user_metadata?.full_name,
            role: UserRole.LAWYER
          });
        }
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
