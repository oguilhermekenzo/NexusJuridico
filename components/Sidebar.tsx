
import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Scale, FileText, BrainCircuit, DollarSign, Settings, Users, Briefcase, BookOpen, Lock, Calendar, Database, Building2, Terminal } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const { office, user } = useAuth();
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const isDev = user?.id === 'dev-user-master';

  useEffect(() => {
    const checkConn = async () => {
      try {
        const { error } = await supabase.from('offices').select('id').limit(1);
        setDbStatus(error ? 'offline' : 'online');
      } catch {
        setDbStatus('offline');
      }
    };
    checkConn();
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'cases', label: 'Processos', icon: Scale },
    { id: 'theses', label: 'Minhas Teses', icon: BookOpen },
    { id: 'documents', label: 'GED', icon: FileText, isDevelopment: true },
    { id: 'ai-tools', label: 'IA Jurídica', icon: BrainCircuit },
    { id: 'finance', label: 'Financeiro', icon: DollarSign },
    { id: 'admin', label: 'Administrativo', icon: Briefcase, isDevelopment: !isDev },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-400 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto z-50 border-r border-slate-800">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3 text-white mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-900/50">J</div>
          <span className="font-bold text-xl tracking-tight text-slate-100">Juzk</span>
        </div>
        
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-blue-500">
            <Building2 size={16} />
          </div>
          <div className="overflow-hidden">
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">Escritório</p>
             <p className="text-xs font-bold text-slate-200 truncate">{office?.name || 'Carregando...'}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item: any) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isDisabled = item.isDevelopment;

          return (
            <button
              key={item.id}
              disabled={isDisabled}
              onClick={() => !isDisabled && onChangeView(item.id)}
              className={`w-full group relative flex flex-col items-start gap-1 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                  : isDisabled
                  ? 'opacity-40 cursor-not-allowed grayscale'
                  : 'hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Icon size={20} className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {isDisabled && <Lock size={12} className="text-slate-600" />}
              </div>
              {isActive && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1 h-4 bg-white/30 rounded-full"></div>
              )}
            </button>
          );
        })}

        {/* Menu Developer condicional */}
        {isDev && (
          <button
            onClick={() => onChangeView('developer')}
            className={`w-full group relative flex flex-col items-start gap-1 px-4 py-3 rounded-xl transition-all duration-300 mt-4 border border-dashed border-blue-500/30 ${
              currentView === 'developer'
                ? 'bg-blue-900/40 text-blue-400 border-blue-500/50'
                : 'hover:bg-blue-900/20 hover:text-blue-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <Terminal size={20} />
              <span className="font-bold tracking-tight">Developer</span>
            </div>
          </button>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <div className="px-4 py-2 flex items-center gap-3">
           <div className={`w-2 h-2 rounded-full ${dbStatus === 'online' ? 'bg-emerald-500 animate-pulse' : dbStatus === 'offline' ? 'bg-red-500' : 'bg-slate-600'}`}></div>
           <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
              <Database size={10} /> Cloud Sync
           </span>
        </div>
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
