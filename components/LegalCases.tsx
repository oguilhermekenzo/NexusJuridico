
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, Filter, FolderOpen, Calendar, User, FileText, Settings, Clock, AlertTriangle, Hammer, Trash2, X, Briefcase, ChevronDown, Check, DollarSign, Hash, AlignLeft, Scale, History, MapPin, Link as LinkIcon, AlertCircle, ExternalLink, Percent, TrendingUp, TrendingDown, Wallet, ShieldAlert, Edit2, List, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import { Processo, ProcessoStatus, AreaDireito, CustomFieldConfig } from '../types';
import { useData } from '../contexts/DataContext';

interface CustomDropdownProps {
  label?: string;
  value: string;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  onChange: (value: string) => void;
  compact?: boolean;
  className?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ label, value, options, onChange, compact, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">{label}</label>}
      <button onClick={() => setIsOpen(!isOpen)} className={`w-full flex items-center justify-between bg-slate-950 text-slate-200 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700`}>
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon} <span>{selectedOption?.label || 'Selecione...'}</span>
        </div>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
          {options.map((opt) => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-800 ${opt.value === value ? 'text-blue-400 bg-blue-400/5' : 'text-slate-300'}`}>
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const LegalCases: React.FC<{ customFields: CustomFieldConfig[] }> = () => {
  const { cases, clients, addCase, updateCase, deleteCase } = useData();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'dados' | 'prazos' | 'financeiro'>('dados');
  const [editingCase, setEditingCase] = useState<Partial<Processo>>({ status: ProcessoStatus.ATIVO });

  const getClientName = (id: string) => clients.find(c => c.id === id)?.nome || 'Desconhecido';

  const filteredCases = cases.filter(c => 
    c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.numero.includes(searchTerm) || 
    getClientName(c.clienteId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCaseModal = (processo?: Processo) => {
    setActiveModalTab('dados');
    if (processo) setEditingCase(JSON.parse(JSON.stringify(processo)));
    else setEditingCase({ area: AreaDireito.CIVEL, status: ProcessoStatus.ATIVO, prazos: [], audiencias: [], historicoAndamentos: [] });
    setIsCaseModalOpen(true);
  };

  const handleSave = () => {
    if (editingCase.id) updateCase(editingCase as Processo);
    else addCase({ ...editingCase, id: Date.now().toString() } as Processo);
    setIsCaseModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-slate-100">Gestão de Processos</h1><p className="text-slate-500 text-sm">Controle processual completo</p></div>
        <div className="flex gap-3">
          <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex">
            <button onClick={() => setViewMode('table')} className={`p-2 rounded ${viewMode === 'table' ? 'bg-slate-800 text-blue-400' : 'text-slate-500'}`}><List size={18}/></button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-slate-800 text-blue-400' : 'text-slate-500'}`}><LayoutGrid size={18}/></button>
          </div>
          <button onClick={() => handleOpenCaseModal()} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-lg shadow-blue-900/30"><Plus size={18} /> Novo Processo</button>
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} /><input type="text" placeholder="Buscar processos..." className="w-full bg-slate-950 pl-10 pr-4 py-2.5 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-600 text-sm text-slate-200 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead><tr className="bg-slate-950 border-b border-slate-800 text-slate-500"><th className="p-4">Processo</th><th className="p-4">Cliente</th><th className="p-4 text-right">Ações</th></tr></thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredCases.map((processo) => (
                <tr key={processo.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4"><div><p className="font-semibold text-slate-200">{processo.titulo}</p><p className="text-[10px] text-slate-500 font-mono">{processo.numero}</p></div></td>
                  <td className="p-4 text-slate-400">{getClientName(processo.clienteId)}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleOpenCaseModal(processo)} className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => deleteCase(processo.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredCases.map((processo) => (
            <div key={processo.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col">
              <h3 className="font-bold text-slate-100 mb-1 truncate">{processo.titulo}</h3>
              <p className="text-[10px] font-mono text-slate-500 mb-4">{processo.numero}</p>
              <div className="flex-1 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2"><User size={14}/> {getClientName(processo.clienteId)}</div>
                <div className="flex items-center gap-2"><FolderOpen size={14}/> {processo.area}</div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded font-bold">{processo.status}</span>
                <span className="text-xs font-bold text-slate-200">R$ {processo.valorCausa?.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isCaseModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-800 animate-scale-in">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Editar Processo</h2>
              <button onClick={() => setIsCaseModalOpen(false)}><X className="text-slate-500 hover:text-white"/></button>
            </div>
            <div className="p-6 space-y-4">
              <input value={editingCase.titulo} onChange={e => setEditingCase({...editingCase, titulo: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none" placeholder="Título do Processo" />
              <input value={editingCase.numero} onChange={e => setEditingCase({...editingCase, numero: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none" placeholder="Número do Processo" />
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <button onClick={() => setIsCaseModalOpen(false)} className="px-4 py-2 text-slate-400">Cancelar</button>
              <button onClick={handleSave} className="bg-blue-600 px-6 py-2 rounded-lg text-white font-bold">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
