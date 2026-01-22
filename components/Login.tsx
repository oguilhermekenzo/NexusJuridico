
import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured, getSafeEnv } from '../lib/supabase';
import { Lock, Mail, Loader2, Scale, Terminal, ShieldCheck, Database, Settings2, X, Save, AlertTriangle, Sparkles, UserPlus, LogIn, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

export const Login: React.FC = () => {
  const { loginAsDev } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [officeName, setOfficeName] = useState('');

  const [showDevPanel, setShowDevPanel] = useState(false);
  const [devPassword, setDevPassword] = useState('');
  const devInputRef = useRef<HTMLInputElement>(null);

  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [sbUrl, setSbUrl] = useState(getSafeEnv('VITE_SUPABASE_URL'));
  const [sbKey, setSbKey] = useState(getSafeEnv('VITE_SUPABASE_ANON_KEY'));
  const [geminiKey, setGeminiKey] = useState(getSafeEnv('API_KEY'));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        setShowDevPanel(prev => !prev);
        setDevPassword('');
      }
      if (e.key === 'Escape') {
        setShowDevPanel(false);
        setShowConnectionModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDevLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (devPassword === 'guijuri123') {
      loginAsDev();
    } else {
      setDevPassword('');
      if (devInputRef.current) {
        devInputRef.current.classList.add('border-red-500', 'animate-pulse');
        setTimeout(() => devInputRef.current?.classList.remove('border-red-500', 'animate-pulse'), 1000);
      }
    }
  };

  const handleSaveConnection = () => {
    localStorage.setItem('juzk_env_VITE_SUPABASE_URL', sbUrl.trim());
    localStorage.setItem('juzk_env_VITE_SUPABASE_ANON_KEY', sbKey.trim());
    localStorage.setItem('juzk_env_API_KEY', geminiKey.trim());
    window.location.reload();
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError("Banco não configurado.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signin') {
        const { error: signInError } = await (supabase.auth as any).signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        // Cadastro completo
        // 1. Criar Escritório
        const { data: office, error: officeError } = await supabase
          .from('offices')
          .insert([{ name: officeName }])
          .select()
          .single();
        
        if (officeError) throw new Error("Erro ao criar escritório: " + officeError.message);

        // 2. Criar Usuário Auth
        const { data: authData, error: signUpError } = await (supabase.auth as any).signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              office_id: office.id
            }
          }
        });

        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error("Erro ao criar usuário.");

        // 3. Criar Perfil
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            email,
            full_name: fullName,
            office_id: office.id,
            role: UserRole.OFFICE_ADMIN // Quem cria o escritório é o Admin
          }]);

        if (profileError) throw profileError;
        
        alert("Cadastro realizado! Verifique seu e-mail ou faça login.");
        setMode('signin');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dev Panel e Connection Modal (omitidos por brevidade, mantêm-se iguais ao original) */}
      
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
                placeholder="Chave mestra..."
                className="bg-transparent border-none outline-none text-white text-sm w-40 placeholder-slate-600 font-mono"
              />
              <button type="submit" className="text-blue-400 hover:text-white transition-colors"><ShieldCheck size={20} /></button>
            </form>
          </div>
        </div>
      )}

      {showConnectionModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-md p-8 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Database className="text-blue-500" />
                <h2 className="text-xl font-bold text-white">Configurar Servidor</h2>
              </div>
              <button onClick={() => setShowConnectionModal(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 ml-1">Supabase API URL</label>
                <input type="text" value={sbUrl} onChange={e => setSbUrl(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none font-mono text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 ml-1">Supabase Anon Key</label>
                <input type="password" value={sbKey} onChange={e => setSbKey(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none font-mono text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-purple-500 uppercase mb-2 ml-1">Gemini API Key</label>
                <input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white outline-none font-mono text-sm" />
              </div>
            </div>
            <button onClick={handleSaveConnection} className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
              <Save size={18} /> SALVAR E REINICIAR
            </button>
          </div>
        </div>
      )}

      <div className="max-w-md w-full animate-scale-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-900/40">
            <Scale size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Juzk SAJ</h1>
          <p className="text-slate-500 mt-2">Gestão Jurídica Inteligente</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
          <div className="flex mb-8 bg-slate-950 p-1 rounded-xl">
            <button onClick={() => setMode('signin')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'signin' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              <LogIn size={16}/> Entrar
            </button>
            <button onClick={() => setMode('signup')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'signup' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              <UserPlus size={16}/> Cadastrar
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1 tracking-wider">Nome Completo</label>
                  <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1 tracking-wider">Nome do Escritório</label>
                  <div className="relative group">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="text" required value={officeName} onChange={e => setOfficeName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-600 outline-none" />
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1 tracking-wider">E-mail Profissional</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1 tracking-wider">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg text-center animate-fade-in font-bold">{error}</div>}

            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={20} /> : (mode === 'signin' ? 'Entrar no Sistema' : 'Criar Conta')}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col items-center gap-4">
            <button onClick={() => setShowConnectionModal(true)} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-400 transition-colors uppercase tracking-wider">
              <Settings2 size={14} /> Configurar Conexão (API)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
