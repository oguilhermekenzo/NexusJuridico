
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Building2, User, Loader2, Scale, Terminal, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const { loginAsDev } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para formulário padrão
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [officeName, setOfficeName] = useState('');
  const [fullName, setFullName] = useState('');

  // Estados para o Backdoor Dev
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [devPassword, setDevPassword] = useState('');
  const devInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        setShowDevPanel(prev => !prev);
        setDevPassword('');
      }
      if (e.key === 'Escape') {
        setShowDevPanel(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (showDevPanel && devInputRef.current) {
      devInputRef.current.focus();
    }
  }, [showDevPanel]);

  const handleDevLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (devPassword === 'guijuri123') {
      loginAsDev();
    } else {
      setDevPassword('');
      // Feedback visual rápido de erro
      if (devInputRef.current) {
        devInputRef.current.classList.add('border-red-500', 'animate-pulse');
        setTimeout(() => devInputRef.current?.classList.remove('border-red-500', 'animate-pulse'), 1000);
      }
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        const { data: office, error: officeError } = await supabase
          .from('offices')
          .insert([{ name: officeName }])
          .select()
          .single();

        if (officeError) throw officeError;

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              office_id: office.id,
              full_name: fullName
            }
          }
        });

        if (signUpError) throw signUpError;
        setError("Escritório criado! Verifique seu e-mail para confirmar.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dev Panel Overlay */}
      {showDevPanel && (
        <div className="absolute top-0 left-0 right-0 z-[100] animate-fade-in-down">
          <div className="bg-blue-600/10 backdrop-blur-md border-b border-blue-500/30 p-4 flex justify-center">
            <form onSubmit={handleDevLogin} className="flex items-center gap-4 bg-slate-900 border border-blue-500/50 rounded-full px-6 py-2 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <Terminal size={18} className="text-blue-400" />
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest hidden sm:inline">Developer Access</span>
              <input
                ref={devInputRef}
                type="password"
                value={devPassword}
                onChange={e => setDevPassword(e.target.value)}
                placeholder="Insira a chave mestra..."
                className="bg-transparent border-none outline-none text-white text-sm w-48 placeholder-slate-600 font-mono"
              />
              <button type="submit" className="text-blue-400 hover:text-white transition-colors">
                <ShieldCheck size={20} />
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-md w-full animate-scale-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-900/40">
            <Scale size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Juzk SAJ</h1>
          <p className="text-slate-500 mt-2">Sistema de Gestão Jurídica Inteligente</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Nome do Escritório</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input required value={officeName} onChange={e => setOfficeName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Ex: Silva & Advogados" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Seu Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-600 outline-none" placeholder="João da Silva" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">E-mail Profissional</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-600 outline-none" placeholder="advogado@exemplo.com" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-600 outline-none" placeholder="••••••••" />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg text-center animate-fade-in">
                {error}
              </div>
            )}

            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={20} /> : isRegistering ? 'Criar Sistema' : 'Entrar no Sistema'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
              {isRegistering ? 'Já possui um escritório? Entre aqui' : 'Novo por aqui? Crie seu escritório digital'}
            </button>
          </div>
        </div>
        <p className="text-center text-slate-600 text-xs mt-8">© 2024 Juzk - Gestão Jurídica Inteligente em Nuvem</p>
      </div>
    </div>
  );
};
