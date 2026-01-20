
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
    { id: 'documents', label: 'GED', icon: FileText, isDevelopment: true },
    { id: 'ai-tools', label: 'IA Jurídica', icon: BrainCircuit },
    { id: 'finance', label: 'Financeiro', icon: DollarSign },
    { id: 'admin', label: 'Administrativo', icon: Briefcase, isDevelopment: true },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-400 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto z-50 border-r border-slate-800">
      <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-900/50 animate-pulse">N</div>
        <span className="font-bold text-xl tracking-tight text-slate-100">Nexus Jurídico</span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item: any) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full group relative flex flex-col items-start gap-1 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                  : 'hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 w-full">
                <Icon size={20} className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="font-medium">{item.label}</span>
              </div>
              
              {item.isDevelopment && (
                <div className="flex items-center gap-1.5 mt-1 ml-8 overflow-hidden">
                   <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
                   <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500/80 animate-pulse transition-colors">
                      Em desenvolvimento
                   </span>
                </div>
              )}
              
              {isActive && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white/20 rounded-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-200 w-full transition-all hover:bg-slate-800 rounded-xl group"
          onClick={() => onChangeView('settings')}
        >
          <Settings size={20} className="group-hover:rotate-45 transition-transform" />
          <span className="font-medium">Configurações</span>
        </button>
      </div>
    </aside>
  );
};
