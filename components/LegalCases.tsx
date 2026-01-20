
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, Filter, FolderOpen, Calendar, User, FileText, Settings, Clock, AlertTriangle, Hammer, Trash2, X, Briefcase, ChevronDown, Check, DollarSign, Hash, AlignLeft, Scale, History, MapPin, Link as LinkIcon, AlertCircle, ExternalLink, Percent, TrendingUp, TrendingDown, Wallet, ShieldAlert, Edit2, List, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import { Processo, ProcessoStatus, AreaDireito, CustomFieldConfig, Andamento, Prazo, Audiencia, TransacaoProcesso } from '../types';
import { useData } from '../contexts/DataContext';
import { CustomDatePicker } from './CustomDatePicker';

// --- COMPONENTS HELPER: CUSTOM DROPDOWN ---
interface CustomDropdownProps {
  label?: string;
  value: string;
  options: { value: string; label: string; icon?: React.ReactNode; colorClass?: string }[];
  onChange: (value: string) => void;
  compact?: boolean;
  className?: string;
  placeholder?: string;
  error?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ label, value, options, onChange, compact = false, className = '', placeholder = 'Selecione...', error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative group ${className}`} ref={dropdownRef}>
      {label && <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-slate-950 text-slate-200 border rounded-xl transition-all
          ${error ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900'}
          ${isOpen && !error ? 'ring-2 ring-blue-600 border-transparent shadow-lg shadow-blue-900/20' : ''}
          ${compact ? 'py-2.5 px-3' : 'p-3.5'}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className={`font-medium truncate ${compact ? 'text-xs md:text-sm' : 'text-sm'} ${!selectedOption ? 'text-slate-500' : ''}`}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-50 w-full min-w-[180px] mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden animate-fade-in-down ring-1 ring-black/50 right-0 max-h-60 overflow-y-auto custom-scrollbar">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setIsOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-all border-b border-slate-800/50 last:border-0
                ${option.value === value ? 'bg-blue-600/10 text-blue-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              <div className="flex items-center gap-3">
                <div className={option.value === value ? 'text-blue-400' : 'text-slate-500'}>{option.icon}</div>
                <span className="font-medium text-sm">{option.label}</span>
              </div>
              {option.value === value && <Check size={14} className="text-blue-400"/>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- HELPER: INPUT WITH ICON ---
interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon: React.ElementType;
  error?: string;
}

const InputWithIcon: React.FC<InputWithIconProps> = ({ label, icon: Icon, className, error, ...props }) => (
  <div>
    {label && <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">{label} {props.required && <span className="text-red-500">*</span>}</label>}
    <div className="relative group">
      <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${error ? 'text-red-500' : 'text-slate-500 group-focus-within:text-blue-500'}`}>
        <Icon size={18} />
      </div>
      <input
        {...props}
        className={`w-full bg-slate-950 text-slate-200 border pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all placeholder-slate-600 text-sm
          ${error ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-slate-800 focus:ring-2 focus:ring-blue-600 hover:border-slate-700'} ${className || ''}`}
      />
    </div>
  </div>
);

export const LegalCases: React.FC<{ customFields: CustomFieldConfig[] }> = ({ customFields }) => {
  const { cases, clients, addCase, updateCase, deleteCase } = useData();
  
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'dados' | 'prazos' | 'audiencias' | 'historico' | 'financeiro'>('dados');
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{ isOpen: boolean; caseId: string | null; isProhibited: boolean; reason?: string }>({ isOpen: false, caseId: null, isProhibited: false });
  const [editingCase, setEditingCase] = useState<Partial<Processo>>({ area: AreaDireito.CIVEL, status: ProcessoStatus.ATIVO, prazos: [], audiencias: [], historicoAndamentos: [] });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ESC Support
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCaseModalOpen(false);
        setConfirmDeleteModal({ isOpen: false, caseId: null, isProhibited: false });
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const getClientName = (id: string) => clients.find(c => c.id === id)?.nome || 'Desconhecido';

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || c.numero.includes(searchTerm) || getClientName(c.clienteId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = selectedArea === 'all' || c.area === selectedArea;
    return matchesSearch && matchesArea;
  });

  const handleOpenCaseModal = (processo?: Processo) => {
    setActiveModalTab('dados');
    setErrors({});
    if (processo) setEditingCase(JSON.parse(JSON.stringify(processo)));
    else setEditingCase({ area: AreaDireito.CIVEL, status: ProcessoStatus.ATIVO, prazos: [], audiencias: [], historicoAndamentos: [], financeiro: { config: { honorariosContratuais: 0, percentualExito: 30, percentualSucumbencia: 10 }, transacoes: [] } });
    setIsCaseModalOpen(true);
  };

  const handleInitiateDelete = (e: React.MouseEvent, processo: Processo) => {
    e.preventDefault(); e.stopPropagation();
    const hasPrazos = processo.prazos?.length > 0;
    const hasAudiencias = processo.audiencias?.length > 0;
    const hasAndamentos = processo.historicoAndamentos?.length > 0;

    if (hasPrazos || hasAudiencias || hasAndamentos) {
      setConfirmDeleteModal({ isOpen: true, caseId: processo.id, isProhibited: true, reason: "Este processo possui históricos (prazos, audiências ou andamentos). Remova-os antes de excluir." });
    } else {
      setConfirmDeleteModal({ isOpen: true, caseId: processo.id, isProhibited: false });
    }
  };

  const handleSaveCase = () => {
    if (!editingCase.numero || !editingCase.titulo || !editingCase.clienteId) {
      setErrors({ numero: !editingCase.numero ? 'Obrigatório' : '', titulo: !editingCase.titulo ? 'Obrigatório' : '', clienteId: !editingCase.clienteId ? 'Obrigatório' : '' });
      return;
    }
    if (editingCase.id) updateCase(editingCase as Processo);
    else addCase({ ...editingCase, id: Date.now().toString(), valorCausa: editingCase.valorCausa || 0 } as Processo);
    setIsCaseModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-100">Gestão de Processos</h1><p className="text-slate-500 text-sm">Controle processual completo</p></div>
        <div className="flex items-center gap-3">
           <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex items-center">
              <button onClick={() => setViewMode('table')} className={`p-2 rounded ${viewMode === 'table' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`} title="Visão em Lista"><List size={18}/></button>
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`} title="Visão em Cards"><LayoutGrid size={18}/></button>
           </div>
           <button onClick={() => handleOpenCaseModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-blue-900/30"><Plus size={18} /> Novo Processo</button>
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} /><input type="text" placeholder="Buscar por número, título ou cliente..." className="w-full bg-slate-950 pl-10 pr-4 py-2.5 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-200" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
        <CustomDropdown compact value={selectedArea} onChange={val => setSelectedArea(val)} options={[{value: 'all', label: 'Todas as Áreas', icon: <Filter size={16}/>}, ...Object.values(AreaDireito).map(a => ({value: a, label: a, icon: <FolderOpen size={16}/>}))]} />
      </div>

      {viewMode === 'table' ? (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left">
            <thead><tr className="bg-slate-950 border-b border-slate-800 text-xs uppercase text-slate-500 font-semibold"><th className="p-4">Processo</th><th className="p-4">Cliente</th><th className="p-4">Área</th><th className="p-4 text-right">Ações</th></tr></thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredCases.map((processo) => (
                <tr key={processo.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                     <div>
                        <p className="font-semibold text-slate-200 text-sm truncate max-w-[300px] cursor-pointer hover:text-blue-400" onClick={() => handleOpenCaseModal(processo)}>{processo.titulo}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{processo.numero}</p>
                     </div>
                  </td>
                  <td className="p-4 text-sm text-slate-400">{getClientName(processo.clienteId)}</td>
                  <td className="p-4">
                    <span className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">{processo.area}</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenCaseModal(processo)} className="p-1.5 text-slate-500 hover:text-blue-400 rounded hover:bg-slate-800 transition-colors"><Edit2 size={16} /></button>
                      <button onClick={(e) => handleInitiateDelete(e, processo)} className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 animate-fade-in">
          {filteredCases.map((processo) => (
            <div key={processo.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm hover:border-slate-700 transition-all group flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white bg-blue-600/20 text-blue-400 border border-blue-500/20`}>
                  <Scale size={20}/>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleOpenCaseModal(processo)} className="p-2 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"><Edit2 size={16}/></button>
                  <button onClick={(e) => handleInitiateDelete(e, processo)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"><Trash2 size={16}/></button>
                </div>
              </div>
              <h3 className="font-bold text-slate-100 text-base mb-1 line-clamp-2 min-h-[3rem] cursor-pointer hover:text-blue-400 transition-colors" onClick={() => handleOpenCaseModal(processo)}>{processo.titulo}</h3>
              <p className="text-[10px] font-mono text-slate-500 mb-4">{processo.numero}</p>
              
              <div className="space-y-3 mb-6 flex-1">
                 <div className="flex items-center gap-2 text-xs text-slate-400"><User size={14} className="text-slate-600 shrink-0"/> <span className="truncate">{getClientName(processo.clienteId)}</span></div>
                 <div className="flex items-center gap-2 text-xs text-slate-400"><FolderOpen size={14} className="text-slate-600 shrink-0"/> {processo.area}</div>
                 <div className="flex items-center gap-2 text-xs text-slate-400"><Calendar size={14} className="text-slate-600 shrink-0"/> Dist: {new Date(processo.dataDistribuicao).toLocaleDateString('pt-BR')}</div>
              </div>
              
              <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                 {/* // Corrected ProcessStatus to ProcessoStatus as defined in types.ts */}
                 <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${processo.status === ProcessoStatus.ATIVO ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>{processo.status}</span>
                 <span className="text-[11px] text-slate-300 font-bold">R$ {processo.valorCausa?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDeleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4" onClick={() => setConfirmDeleteModal({ isOpen: false, caseId: null, isProhibited: false })}>
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md p-8 animate-scale-in text-center" onClick={e => e.stopPropagation()}>
            <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${confirmDeleteModal.isProhibited ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
               {confirmDeleteModal.isProhibited ? <ShieldAlert size={44} /> : <AlertTriangle size={44} />}
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">{confirmDeleteModal.isProhibited ? "Ação Bloqueada" : "Confirmar Exclusão"}</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">{confirmDeleteModal.isProhibited ? confirmDeleteModal.reason : "Tem certeza que deseja excluir este processo? Todos os dados vinculados serão removidos permanentemente."}</p>
            <div className="flex flex-col gap-3">
              {!confirmDeleteModal.isProhibited ? (
                <>
                  <button onClick={() => { deleteCase(confirmDeleteModal.caseId!); setConfirmDeleteModal({ isOpen: false, caseId: null, isProhibited: false }); }} className="w-full py-3.5 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-900/40">SIM, EXCLUIR PROCESSO</button>
                  <button onClick={() => setConfirmDeleteModal({ isOpen: false, caseId: null, isProhibited: false })} className="w-full py-3.5 bg-slate-800 text-slate-300 font-bold rounded-xl">CANCELAR (ESC)</button>
                </>
              ) : (
                <button onClick={() => setConfirmDeleteModal({ isOpen: false, caseId: null, isProhibited: false })} className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl">ENTENDI (ESC)</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULL CASE MODAL */}
      {isCaseModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setIsCaseModalOpen(false)}>
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-800 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 z-10 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Briefcase size={22} className="text-blue-500"/> {editingCase.id ? 'Editar Processo' : 'Novo Processo'}</h2>
              <button onClick={() => setIsCaseModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
            </div>
            <div className="flex border-b border-slate-800 bg-slate-950 px-6 overflow-x-auto no-scrollbar">
               {(['dados', 'prazos', 'audiencias', 'historico', 'financeiro'] as const).map(tab => (
                 <button key={tab} onClick={() => setActiveModalTab(tab)} className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors uppercase tracking-wider whitespace-nowrap ${activeModalTab === tab ? 'border-blue-600 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>{tab}</button>
               ))}
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {activeModalTab === 'dados' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputWithIcon label="Número" required icon={Hash} value={editingCase.numero || ''} onChange={e => setEditingCase({...editingCase, numero: e.target.value})} error={errors.numero} />
                        <CustomDropdown label="Área" value={editingCase.area as string} onChange={(val) => setEditingCase({...editingCase, area: val as AreaDireito})} options={Object.values(AreaDireito).map(area => ({ value: area, label: area, icon: <FolderOpen size={16}/> }))} />
                    </div>
                    <InputWithIcon label="Título" required icon={AlignLeft} value={editingCase.titulo || ''} onChange={e => setEditingCase({...editingCase, titulo: e.target.value})} error={errors.titulo} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <CustomDropdown label="Cliente" value={editingCase.clienteId || ''} onChange={(val) => setEditingCase({...editingCase, clienteId: val})} placeholder="Selecione um Cliente" options={clients.map(client => ({ value: client.id, label: client.nome, icon: <User size={16}/> }))} error={errors.clienteId} />
                        <InputWithIcon label="Valor da Causa (R$)" icon={DollarSign} type="number" value={editingCase.valorCausa || 0} onChange={e => setEditingCase({...editingCase, valorCausa: Number(e.target.value)})} />
                    </div>
                  </div>
              )}
              {activeModalTab === 'prazos' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Prazos e Fatalidades</h4>
                  <div className="space-y-2">
                    {(editingCase.prazos || []).length > 0 ? (editingCase.prazos || []).map((p, i) => (
                      <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center">
                        <div><p className="text-sm font-bold text-slate-200">{p.descricao}</p><p className="text-xs text-slate-600">{new Date(p.data).toLocaleDateString('pt-BR')}</p></div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${p.status === 'CONCLUIDO' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{p.status}</span>
                      </div>
                    )) : (
                      <div className="p-8 text-center text-slate-600 italic text-sm">Nenhum prazo registrado.</div>
                    )}
                  </div>
                </div>
              )}
              {activeModalTab === 'audiencias' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Calendário de Audiências</h4>
                  <div className="space-y-2">
                    {(editingCase.audiencias || []).length > 0 ? (editingCase.audiencias || []).map((a, i) => (
                      <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-bold text-slate-200">{a.tipo}</p>
                          <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">{a.status}</span>
                        </div>
                        <p className="text-xs text-slate-500">{new Date(a.data).toLocaleString('pt-BR')} - {a.local || 'Local não informado'}</p>
                      </div>
                    )) : (
                       <div className="p-8 text-center text-slate-600 italic text-sm">Nenhuma audiência agendada.</div>
                    )}
                  </div>
                </div>
              )}
              {activeModalTab === 'historico' && (
                <div className="space-y-4">
                   <h4 className="text-xs font-bold text-slate-500 uppercase">Linha do Tempo Processual</h4>
                   <div className="space-y-3">
                      {(editingCase.historicoAndamentos || []).length > 0 ? (editingCase.historicoAndamentos || []).map((h, i) => (
                        <div key={i} className="p-3 border-l-2 border-blue-600 bg-slate-950 rounded-r-lg">
                          <div className="flex justify-between mb-1"><span className="text-[10px] font-bold text-blue-400">{h.tipo}</span><span className="text-[10px] text-slate-600">{new Date(h.data).toLocaleDateString('pt-BR')}</span></div>
                          <p className="text-sm text-slate-300">{h.descricao}</p>
                        </div>
                      )) : (
                         <div className="p-8 text-center text-slate-600 italic text-sm">Nenhum andamento registrado.</div>
                      )}
                   </div>
                </div>
              )}
              {activeModalTab === 'financeiro' && editingCase.financeiro && (
                <div className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Pró-labore</p>
                        <p className="text-lg font-bold text-slate-200">R$ {editingCase.financeiro.config.honorariosContratuais.toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Êxito (%)</p>
                        <p className="text-lg font-bold text-blue-400">{editingCase.financeiro.config.percentualExito}%</p>
                      </div>
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Lançamentos</p>
                        <p className="text-lg font-bold text-slate-200">{editingCase.financeiro.transacoes.length}</p>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <h5 className="text-[10px] font-bold text-slate-600 uppercase">Transações Recentes</h5>
                      {(editingCase.financeiro.transacoes || []).length > 0 ? (editingCase.financeiro.transacoes || []).map((t, i) => (
                        <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center">
                          <div><p className="text-sm font-medium text-slate-300">{t.descricao}</p><p className="text-[10px] text-slate-600">{new Date(t.data).toLocaleDateString('pt-BR')}</p></div>
                          <span className={`text-sm font-bold ${t.tipo === 'RECEITA' ? 'text-green-500' : 'text-red-500'}`}>{t.tipo === 'RECEITA' ? '+' : '-'} R$ {t.valor.toLocaleString('pt-BR')}</span>
                        </div>
                      )) : (
                         <div className="p-8 text-center text-slate-600 italic text-sm">Nenhum lançamento financeiro.</div>
                      )}
                   </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 rounded-b-2xl">
              <button onClick={() => setIsCaseModalOpen(false)} className="px-5 py-2.5 text-slate-400 hover:text-white transition-colors">Cancelar (ESC)</button>
              <button onClick={handleSaveCase} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all shadow-lg shadow-blue-500/20">Salvar Processo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
