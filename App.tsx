
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { LegalCases } from './components/LegalCases';
import { AITools } from './components/AITools';
import { Finance } from './components/Finance';
import { Clients } from './components/Clients';
import { Theses } from './components/Theses';
import { AreaDireito, CustomFieldConfig } from './types';
import { DataProvider, useData } from './contexts/DataContext';

// Icons for placeholders
import { Settings, FileText, Briefcase, Database, Trash2, Sparkles, RefreshCcw } from 'lucide-react';

// Wrapper component to use the context
const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const { cases, seedMockData, clearAllData } = useData();
  const [seedSuccess, setSeedSuccess] = useState(false);

  // Settings for Custom Fields (Multi-area requirement)
  const [customFields, setCustomFields] = useState<CustomFieldConfig[]>([
    { id: 'trab_demissao', area: AreaDireito.TRABALHISTA, label: 'Data da Demissão', type: 'date' },
    { id: 'trib_regime', area: AreaDireito.TRIBUTARIO, label: 'Regime Tributário', type: 'text' },
    { id: 'civ_danos', area: AreaDireito.CIVEL, label: 'Tipo de Dano', type: 'text' },
    { id: 'prev_nb', area: AreaDireito.PREVIDENCIARIO, label: 'Número do Benefício (NB)', type: 'number' },
    { id: 'banc_contrato', area: AreaDireito.BANCARIO, label: 'Número do Contrato', type: 'text' },
    { id: 'imob_matricula', area: AreaDireito.IMOBILIARIO, label: 'Matrícula do Imóvel', type: 'text' }
  ]);

  const handleSeed = () => {
    if(confirm("Isso irá substituir seus dados atuais por 10+ dados fictícios de demonstração para Clientes, Processos e Teses. Deseja continuar?")) {
        seedMockData();
        setSeedSuccess(true);
        // Explicit browser alert as requested
        window.alert("Dados de demonstração gerados com sucesso!");
        setTimeout(() => setSeedSuccess(false), 3000);
    }
  };

  const handleClear = () => {
    if(confirm("Tem certeza que deseja apagar TODOS os dados do sistema? Esta ação não pode ser desfeita.")) {
        clearAllData();
        window.alert("Todos os dados foram removidos.");
    }
  };

  const PlaceholderView = ({ title, icon: Icon }: any) => (
    <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-fade-in">
      <div className="bg-slate-900 p-8 rounded-full mb-6 border border-slate-800 shadow-lg">
        <Icon size={48} className="text-slate-600" />
      </div>
      <h2 className="text-xl font-bold text-slate-300">{title}</h2>
      <p className="mt-2 text-slate-600">Módulo disponível na versão completa.</p>
    </div>
  );

  const SettingsView = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
       <header>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="text-slate-400" /> Configurações do Sistema
          </h1>
          <p className="text-slate-500 mt-1">Personalização e gerenciamento de dados</p>
       </header>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Campos Personalizados */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col">
            <h3 className="font-bold text-lg mb-4 text-slate-200 flex items-center gap-2">
               <Database size={20} className="text-blue-500" /> Campos Multiárea
            </h3>
            <div className="space-y-2 flex-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {customFields.map((field, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white min-w-[80px] text-center
                      ${field.area === AreaDireito.TRABALHISTA ? 'bg-orange-600' : 
                        field.area === AreaDireito.TRIBUTARIO ? 'bg-green-600' : 
                        field.area === AreaDireito.PREVIDENCIARIO ? 'bg-emerald-600' :
                        field.area === AreaDireito.BANCARIO ? 'bg-slate-600' :
                        field.area === AreaDireito.IMOBILIARIO ? 'bg-amber-600' :
                        'bg-blue-600'}`}>
                      {field.area}
                    </span>
                    <span className="text-xs font-medium text-slate-300 flex-1 truncate">{field.label}</span>
                    <span className="text-[10px] font-mono bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded border border-slate-800">{field.type}</span>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full py-2 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors border border-slate-700">
               Configurar Novos Campos
            </button>
          </div>

          {/* Card: Dados de Demonstração (Developer Tools) */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col">
            <h3 className="font-bold text-lg mb-4 text-slate-200 flex items-center gap-2">
               <Sparkles size={20} className="text-purple-500" /> Ferramentas de Demo
            </h3>
            <div className="flex-1 space-y-4">
               <p className="text-sm text-slate-500 leading-relaxed">
                  Utilize estas ferramentas para testar a interface do sistema com um conjunto completo de dados (10+ por categoria).
               </p>
               
               <div className="space-y-3">
                  <button 
                    onClick={handleSeed}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg
                    ${seedSuccess ? 'bg-green-600 text-white shadow-green-900/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20'}`}
                  >
                    {seedSuccess ? <RefreshCcw className="animate-spin" size={18}/> : <Database size={18} />}
                    {seedSuccess ? 'Dados Atualizados!' : 'Gerar 40+ Registros Fake'}
                  </button>

                  <button 
                    onClick={handleClear}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-slate-950 border border-slate-800 text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                  >
                    <Trash2 size={18} />
                    Limpar Todos os Dados
                  </button>
               </div>
            </div>
            <p className="mt-6 text-[10px] text-slate-600 text-center uppercase tracking-widest font-bold">
               Atenção: Ações permanentes no banco local
            </p>
          </div>
       </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard cases={cases} />;
      case 'clients': return <Clients />;
      case 'cases': return <LegalCases customFields={customFields} />;
      case 'theses': return <Theses />;
      case 'ai-tools': return <AITools />;
      case 'finance': return <Finance />;
      case 'documents': return <PlaceholderView title="Gestão Eletrônica de Documentos (GED)" icon={FileText} />;
      case 'admin': return <PlaceholderView title="Administrativo & RH" icon={Briefcase} />;
      case 'settings': return <SettingsView />;
      default: return <Dashboard cases={cases} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      <main className="ml-64 flex-1 p-8 overflow-y-auto h-screen scroll-smooth">
        {renderContent()}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
};

export default App;
