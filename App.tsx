
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { LegalCases } from './components/LegalCases';
import { AITools } from './components/AITools';
import { Finance } from './components/Finance';
import { Clients } from './components/Clients';
import { Theses } from './components/Theses';
import { Agenda } from './components/Agenda';
import { AreaDireito, CustomFieldConfig } from './types';
import { DataProvider, useData } from './contexts/DataContext';
import { Settings, Database, Trash2, Sparkles, RefreshCcw, AlertTriangle } from 'lucide-react';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const { cases, seedMockData, clearAllData } = useData();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const [customFields] = useState<CustomFieldConfig[]>([
    { id: 'trab_demissao', area: AreaDireito.TRABALHISTA, label: 'Data da Demissão', type: 'date' },
    { id: 'trib_regime', area: AreaDireito.TRIBUTARIO, label: 'Regime Tributário', type: 'text' },
    { id: 'civ_danos', area: AreaDireito.CIVEL, label: 'Tipo de Dano', type: 'text' }
  ]);

  useEffect(() => { setIsConfirmingClear(false); }, [currentView]);

  const handleSeed = () => {
    setIsGenerating(true);
    setTimeout(() => {
      seedMockData();
      setIsGenerating(false);
      setCurrentView('dashboard');
    }, 800);
  };

  const handleViewProcess = (processId: string) => {
    setSelectedProcessId(processId);
    setCurrentView('cases');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard cases={cases} />;
      case 'clients': return <Clients />;
      case 'agenda': return <Agenda onViewProcess={handleViewProcess} />;
      case 'cases': return (
        <LegalCases 
          customFields={customFields} 
          initialProcessId={selectedProcessId || undefined}
          onClearInitialProcess={() => setSelectedProcessId(null)}
        />
      );
      case 'theses': return <Theses />;
      case 'ai-tools': return <AITools />;
      case 'finance': return <Finance />;
      case 'settings': return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-2"><Settings className="text-slate-400" /> Configurações</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-lg mb-4 text-slate-200 flex items-center gap-2"><Sparkles size={20} className="text-purple-500" /> Demonstração</h3>
              <p className="text-sm text-slate-500 mb-6">Popule o sistema com dados de teste para visualização.</p>
              <button onClick={handleSeed} disabled={isGenerating} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50">
                {isGenerating ? <RefreshCcw className="animate-spin" /> : <Database size={18} />} GERAR DADOS FAKES
              </button>
            </div>
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-lg mb-4 text-slate-200 flex items-center gap-2"><Trash2 size={20} className="text-red-500" /> Manutenção</h3>
              <p className="text-sm text-slate-500 mb-6">Limpar todos os dados salvos localmente.</p>
              <button onClick={() => { if(isConfirmingClear) clearAllData(); setIsConfirmingClear(!isConfirmingClear); }} className={`w-full py-4 rounded-xl font-bold text-sm transition-all border ${isConfirmingClear ? "bg-red-600 border-red-500 text-white" : "bg-slate-950 border-slate-800 text-red-500"}`}>
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
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      <main className="ml-64 flex-1 p-8 overflow-y-auto h-screen custom-scrollbar">
        {renderContent()}
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <DataProvider>
    <AppContent />
  </DataProvider>
);

export default App;
