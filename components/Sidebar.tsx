import React from 'react';
import { LayoutDashboard, Scale, FileText, BrainCircuit, DollarSign, Settings, Users, Briefcase, BookOpen } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'cases', label: 'Processos', icon: Scale },
    { id: 'theses', label: 'Minhas Teses', icon: BookOpen },
    { id: 'documents', label: 'GED', icon: FileText },
    { id: 'ai-tools', label: 'IA Jurídica', icon: BrainCircuit },
    { id: 'finance', label: 'Financeiro', icon: DollarSign },
    { id: 'admin', label: 'Administrativo', icon: Briefcase },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-400 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto z-50 border-r border-slate-800">
      <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-900/50">N</div>
        <span className="font-bold text-xl tracking-tight text-slate-100">Nexus Jurídico</span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                  : 'hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-200 w-full transition-colors hover:bg-slate-800 rounded-lg"
          onClick={() => onChangeView('settings')}
        >
          <Settings size={20} />
          <span>Configurações</span>
        </button>
      </div>
    </aside>
  );
};