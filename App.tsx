
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { LegalCases } from './components/LegalCases';
import { AITools } from './components/AITools';
import { Finance } from './components/Finance';
import { Clients } from './components/Clients';
import { Theses } from './components/Theses';
import { Agenda } from './components/Agenda';
import { Login } from './components/Login';
import { AreaDireito, CustomFieldConfig } from './types';
import { DataProvider, useData } from './contexts/DataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Settings, Database, Trash2, Sparkles, LogOut, Loader2, Building2, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

// Componente de Notificação (Toast)
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
  
  // Estado de Notificação
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const showNotify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
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
        <p className="text-slate-500 font-medium">Carregando escritório...</p>
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
      case 'finance': return <Finance />;
      case 'settings': return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-2"><Settings className="text-slate-400" /> Configurações</h1>
          
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-xl text-white mb-6">Escritório Logado</h3>
            <div className="flex items-center gap-6 p-6 bg-slate-950 rounded-xl border border-slate-800">
              <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center">
                <Building2 size={32} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">{office?.name}</h4>
                <p className="text-slate-500">{user.email}</p>
                <button onClick={signOut} className="mt-4 flex items-center gap-2 text-red-500 hover:text-red-400 font-bold text-sm uppercase transition-colors">
                  <LogOut size={16} /> Sair do Sistema
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-lg mb-4 text-slate-200 flex items-center gap-2"><Sparkles size={20} className="text-indigo-500" /> Demonstração</h3>
              <p className="text-sm text-slate-500 mb-6">Popular o banco de dados com dados fictícios para teste de funcionalidades.</p>
              <button onClick={handleSeedData} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2">
                <Database size={16} /> POPULAR DADOS FAKES
              </button>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-lg mb-4 text-slate-200 flex items-center gap-2"><Trash2 size={20} className="text-red-500" /> Manutenção</h3>
              <p className="text-sm text-slate-500 mb-6">Limpar todos os dados deste escritório. Esta ação é irreversível.</p>
              <button onClick={() => { if(isConfirmingClear) handleClearData(); else setIsConfirmingClear(true); }} className={`w-full py-4 rounded-xl font-bold text-sm transition-all border ${isConfirmingClear ? "bg-red-600 border-red-500 text-white" : "bg-slate-950 border-slate-800 text-red-500"}`}>
                {isConfirmingClear ? "CONFIRMAR EXCLUSÃO" : "LIMPAR BANCO DE DADOS"}
              </button>
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
            Sincronizando dados...
          </div>
        )}
        {renderContent()}
      </main>
      
      {/* Exibição Global de Notificação */}
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
