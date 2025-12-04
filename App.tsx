
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
import { Settings, FileText, Briefcase } from 'lucide-react';

// Wrapper component to use the context
const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const { cases, clients } = useData();

  // Settings for Custom Fields (Multi-area requirement)
  const [customFields, setCustomFields] = useState<CustomFieldConfig[]>([
    { id: 'trab_demissao', area: AreaDireito.TRABALHISTA, label: 'Data da Demissão', type: 'date' },
    { id: 'trib_regime', area: AreaDireito.TRIBUTARIO, label: 'Regime Tributário', type: 'text' },
    { id: 'civ_danos', area: AreaDireito.CIVEL, label: 'Tipo de Dano', type: 'text' },
    { id: 'prev_nb', area: AreaDireito.PREVIDENCIARIO, label: 'Número do Benefício (NB)', type: 'number' },
    { id: 'banc_contrato', area: AreaDireito.BANCARIO, label: 'Número do Contrato', type: 'text' },
    { id: 'imob_matricula', area: AreaDireito.IMOBILIARIO, label: 'Matrícula do Imóvel', type: 'text' }
  ]);

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
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
       <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
         <Settings className="text-slate-400" /> Configurações Multiárea
       </h1>
       <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
         <h3 className="font-semibold text-lg mb-4 text-slate-200">Campos Personalizados por Área</h3>
         <div className="space-y-3">
           {customFields.map((field, idx) => (
             <div key={idx} className="flex items-center gap-4 p-4 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                <span className={`text-xs font-bold px-2 py-1 rounded text-white shadow-sm
                  ${field.area === AreaDireito.TRABALHISTA ? 'bg-orange-600' : 
                    field.area === AreaDireito.TRIBUTARIO ? 'bg-green-600' : 
                    field.area === AreaDireito.PREVIDENCIARIO ? 'bg-emerald-600' :
                    field.area === AreaDireito.BANCARIO ? 'bg-slate-600' :
                    field.area === AreaDireito.IMOBILIARIO ? 'bg-amber-600' :
                    'bg-blue-600'}`}>
                  {field.area}
                </span>
                <span className="font-medium text-slate-300 flex-1">{field.label}</span>
                <span className="text-xs font-mono bg-slate-900 text-slate-500 px-2 py-1 rounded border border-slate-800">{field.type}</span>
             </div>
           ))}
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
