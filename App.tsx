
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { LegalCases } from './components/LegalCases';
import { AITools } from './components/AITools';
import { Finance } from './components/Finance';
import { Clients } from './components/Clients';
import { Theses } from './components/Theses';
import { Agenda } from './components/Agenda';
import { Admin } from './components/Admin';
import { Login } from './components/Login';
import { AreaDireito, CustomFieldConfig } from './types';
import { DataProvider, useData } from './contexts/DataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Settings, Database, Trash2, Sparkles, LogOut, Loader2, Building2, CheckCircle2, AlertCircle, Info, X, Terminal, Cpu, Save, Cloud, WifiOff } from 'lucide-react';
import { isSupabaseConfigured, getSafeEnv } from './lib/supabase';

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: { icon: <CheckCircle2 size={18} />, bg: 'bg-emerald-600/10', border: 'border-emerald-500/50', text: 'text-emerald-400' },
    error: { icon: <AlertCircle size={18} />, bg: 'bg-red-600/10', border: 'border-red-500/50', text: 'text-red-400' },
    info: { icon: <Info size={18} />, bg: 'bg-blue-600/10', border: 'border-blue-500/50', text: 'text-blue-400' }
  }[type];

  return (
    <div className={`fixed bottom-8 right-8 z-[1000] flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur-md shadow-2xl animate-slide-up ${config.bg} ${config.border} ${config.text}`}>
      {config.icon}
      <span className="text-sm font-bold tracking-tight">{message}</span>
      <button onClick={onClose} className="ml-4 p-1 hover:bg-white/10 rounded-lg transition-colors">
        <X size={14} />
      </button>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, office, loading: authLoading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const { cases, clearAllData, seedDemoData, loading: dataLoading } = useData();
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  
  // Estados de Configuração (Sincronizados com o LocalStorage via getSafeEnv)
  const [sbUrl, setSbUrl] = useState(getSafeEnv('VITE_SUPABASE_URL'));
  const [sbKey, setSbKey] = useState(getSafeEnv('VITE_SUPABASE_ANON_KEY'));
  const [geminiKey, setGeminiKey] = useState(getSafeEnv('API_KEY'));

  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const showNotify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
  };

  const handleSaveConfigs = () => {
    localStorage.setItem('juzk_env_VITE_SUPABASE_URL', sbUrl.trim());
    localStorage.setItem('juzk_env_VITE_SUPABASE_ANON_KEY', sbKey.trim());
    localStorage.setItem('juzk_env_API_KEY', geminiKey.trim());
    showNotify("Configurações salvas! Aplicando alterações...", "success");
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleSeedData = async () => {
    try {
      await seedDemoData();
      showNotify("Dados fakes gerados com sucesso!", "success");
    } catch (e) {
      showNotify("Erro ao gerar dados.", "error");
    }
  };

  const handleClearData = async () => {
    try {
      await clearAllData();
      setIsConfirmingClear(false);
      showNotify("Dados apagados com sucesso!", "info");
    } catch (e) {
      showNotify("Erro ao apagar dados.", "error");
    }
  };

  const [customFields] = useState<CustomFieldConfig[]>([
    { id: 'trab_demissao', area: AreaDireito.TRABALHISTA, label: 'Data da Demissão', type: 'date' },
    { id: 'trib_regime', area: AreaDireito.TRIBUTARIO, label: 'Regime Tributário', type: 'text' },
    { id: 'civ_danos', area: AreaDireito.CIVEL, label: 'Tipo de Dano', type: 'text' }
  ]);

  useEffect(() => { setIsConfirmingClear(false); }, [currentView]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="text-blue-600 animate-spin mb-4" size={48} />
        <p className="text-slate-500 font-medium">Autenticando...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleViewProcess = (processId: string) => {
    setSelectedProcessId(processId);
    setCurrentView('cases');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard cases={cases} />;
      case 'clients': return <Clients showNotify={showNotify} />;
      case 'agenda': return <Agenda onViewProcess={handleViewProcess} />;
      case 'cases': return (
        <LegalCases 
          customFields={customFields} 
          initialProcessId={selectedProcessId || undefined}
          onClearInitialProcess={() => setSelectedProcessId(null)}
          showNotify={showNotify}
        />
      );
      case 'theses': return <Theses showNotify={showNotify} />;
      case 'ai-tools': return <AITools />;
      case 'finance': return <Finance showNotify={showNotify} />;
      case 'admin': return <Admin showNotify={showNotify} />;
      case 'settings': return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
          <header className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-2"><Settings className="text-slate-400" /> Configurações</h1>
            <button 
              onClick={handleSaveConfigs}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/40"
            >
              <Save size={18} /> Salvar Alterações
            </button>
          </header>
          
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-xl text-white mb-6">Escritório Atual</h3>
            <div className="flex items-center gap-6 p-6 bg-slate-950 rounded-xl border border-slate-800">
              <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center">
                <Building2 size={32} />
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-white">{office?.name}</h4>
                <p className="text-slate-500">{user.email}</p>
                <div className="flex items-center gap-4 mt-4">
                  <button onClick={signOut} className="flex items-center gap-2 text-red-500 hover:text-red-400 font-bold text-xs uppercase transition-colors">
                    <LogOut size={14} /> Sair
                  </button>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${isSupabaseConfigured ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {isSupabaseConfigured ? <Cloud size={12} /> : <WifiOff size={12} />}
                    {isSupabaseConfigured ? 'Conectado à Nuvem' : 'Modo Local (Offline)'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
      case 'developer': return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Terminal className="text-blue-500" /> Developer Mode
            </h1>
            <div className="flex items-center gap-2 bg-blue-900/30 text-blue-400 px-4 py-1.5 rounded-full border border-blue-500/30 text-xs font-bold uppercase tracking-widest animate-pulse">
              <Cpu size={14} /> F2 Auth
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 p-8 rounded-2xl border border-blue-500/20 shadow-2xl">
              <h3 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
                <Sparkles size={20} className="text-indigo-500" /> Geração de Massa
              </h3>
              <p className="text-sm text-slate-500 mb-6">Popular banco com clientes e processos fictícios.</p>
              <button 
                onClick={handleSeedData} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-sm transition-all"
              >
                POPULAR DADOS FAKES
              </button>
            </div>

            <div className="bg-slate-900 p-8 rounded-2xl border border-red-500/20 shadow-2xl">
              <h3 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
                <Trash2 size={20} className="text-red-500" /> Hard Reset
              </h3>
              <p className="text-sm text-slate-500 mb-6">Limpar todos os dados deste escritório.</p>
              <button 
                onClick={() => { if(isConfirmingClear) handleClearData(); else setIsConfirmingClear(true); }} 
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all border ${isConfirmingClear ? "bg-red-600 text-white" : "bg-slate-950 text-red-500 border-slate-800"}`}
              >
                {isConfirmingClear ? "CONFIRMAR EXCLUSÃO" : "LIMPAR BANCO"}
              </button>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="text-blue-500" />
                <h3 className="font-bold text-lg text-white">Configuração Global (Persistência)</h3>
              </div>
              <button 
                onClick={handleSaveConfigs}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
              >
                <Save size={16} /> Salvar e Reiniciar
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Supabase URL</label>
                <input 
                  type="text"
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-mono"
                  placeholder="https://sua-url.supabase.co"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Anon Key</label>
                <input 
                  type="password"
                  value={sbKey}
                  onChange={(e) => setSbKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-mono"
                  placeholder="eyJhbGciOiJIUzI1Ni..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-purple-500 uppercase block mb-2">Gemini API Key (Inteligência Artificial)</label>
                <input 
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-purple-600 outline-none transition-all text-sm font-mono"
                  placeholder="AIzaSy..."
                />
              </div>
            </div>
          </div>
        </div>
      );
      default: return <Dashboard cases={cases} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 relative">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      <main className="ml-64 flex-1 p-8 overflow-y-auto h-screen custom-scrollbar">
        {dataLoading && (
          <div className="fixed top-4 right-8 z-[300] bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold animate-pulse shadow-lg">
            Sincronizando...
          </div>
        )}
        {renderContent()}
      </main>
      
      {notification && (
        <Toast 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <DataProvider>
      <AppContent />
    </DataProvider>
  </AuthProvider>
);

export default App;
