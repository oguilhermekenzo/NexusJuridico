
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, Filter, FolderOpen, Calendar, User, FileText, Settings, Clock, AlertTriangle, Hammer, Trash2, X, Briefcase, ChevronDown, Check, DollarSign, Hash, AlignLeft, Scale, History, MapPin, Link as LinkIcon, AlertCircle, ExternalLink, Percent, TrendingUp, TrendingDown, Wallet, ShieldAlert } from 'lucide-react';
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
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
      {error && <p className="text-red-500 text-xs mt-1 ml-1 font-medium animate-fade-in">{error}</p>}

      {isOpen && (
        <div className="absolute z-50 w-full min-w-[180px] mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden animate-fade-in-down ring-1 ring-black/50 right-0 max-h-60 overflow-y-auto custom-scrollbar">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-all border-b border-slate-800/50 last:border-0
                ${option.value === value 
                  ? 'bg-blue-600/10 text-blue-400' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              <div className="flex items-center gap-3">
                <div className={option.value === value ? 'text-blue-400' : 'text-slate-500'}>
                   {option.icon}
                </div>
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
  rightElement?: React.ReactNode;
  error?: string;
}

const InputWithIcon: React.FC<InputWithIconProps> = ({ label, icon: Icon, rightElement, className, error, ...props }) => (
  <div>
    {label && <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">{label} {props.required && <span className="text-red-500">*</span>}</label>}
    <div className="relative group">
      <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${error ? 'text-red-500' : 'text-slate-500 group-focus-within:text-blue-500'}`}>
        <Icon size={18} />
      </div>
      <input
        {...props}
        onWheel={(e) => e.currentTarget.type === 'number' && e.currentTarget.blur()}
        className={`w-full bg-slate-950 text-slate-200 border pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all placeholder-slate-600 text-sm
          ${error 
            ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' 
            : 'border-slate-800 focus:ring-2 focus:ring-blue-600 focus:border-transparent hover:border-slate-700'
          } ${className || ''}`}
      />
      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </div>
    {error && <p className="text-red-500 text-xs mt-1 ml-1 font-medium animate-fade-in">{error}</p>}
  </div>
);

interface LegalCasesProps {
  customFields: CustomFieldConfig[];
}

export const LegalCases: React.FC<LegalCasesProps> = ({ customFields }) => {
  const { cases, clients, addCase, updateCase, addAndamento, deleteCase } = useData();
  const [activeTab, setActiveTab] = useState<'list' | 'prazos' | 'audiencias'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  
  // Modals
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'dados' | 'prazos' | 'audiencias' | 'historico' | 'financeiro'>('dados');
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false); 
  
  // Custom Confirmation Modal
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{ isOpen: boolean; caseId: string | null; isProhibited: boolean; reason?: string }>({ isOpen: false, caseId: null, isProhibited: false });

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [subItemErrors, setSubItemErrors] = useState<Record<string, string>>({});

  // Active Item States
  const [editingCase, setEditingCase] = useState<Partial<Processo>>({
    area: AreaDireito.CIVEL,
    status: ProcessoStatus.ATIVO,
    customData: {},
    historicoAndamentos: [],
    prazos: [],
    audiencias: []
  });

  // Inner States
  const [innerAndamento, setInnerAndamento] = useState<Partial<Andamento>>({ tipo: 'MOVIMENTACAO', data: new Date().toISOString().split('T')[0], descricao: '' });
  const [innerPrazo, setInnerPrazo] = useState<Partial<Prazo>>({ data: new Date().toISOString().split('T')[0], descricao: '', status: 'PENDENTE' });
  const [innerAudiencia, setInnerAudiencia] = useState<Partial<Audiencia>>({ data: new Date().toISOString().split('T')[0], tipo: 'Instrução', status: 'AGENDADA', local: '' });
  const [innerTransacao, setInnerTransacao] = useState<Partial<TransacaoProcesso>>({ data: new Date().toISOString().split('T')[0], tipo: 'RECEITA', valor: 0, categoria: 'Alvará' });
  
  const [isAddingTransacao, setIsAddingTransacao] = useState(false);
  const [isAddingHistory, setIsAddingHistory] = useState(false);
  const [isAddingPrazo, setIsAddingPrazo] = useState(false);
  const [isAddingAudiencia, setIsAddingAudiencia] = useState(false);

  const [newAndamento, setNewAndamento] = useState<Partial<Andamento>>({ tipo: 'MOVIMENTACAO', data: new Date().toISOString().split('T')[0] });
  const [selectedCaseIdForProgress, setSelectedCaseIdForProgress] = useState<string | null>(null);

  const getClientName = (id: string) => clients.find(c => c.id === id)?.nome || 'Cliente Desconhecido';

  const filteredCases = cases.filter(c => {
    const clientName = getClientName(c.clienteId).toLowerCase();
    const matchesSearch = c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.numero.includes(searchTerm) ||
                          clientName.includes(searchTerm.toLowerCase());
    const matchesArea = selectedArea === 'all' || c.area === selectedArea;
    return matchesSearch && matchesArea;
  });

  const getCustomFieldsForArea = (area: AreaDireito) => customFields.filter(f => f.area === area);

  const handleOpenCaseModal = (processo?: Processo) => {
    setIsAddingHistory(false); setIsAddingPrazo(false); setIsAddingAudiencia(false); setIsAddingTransacao(false);
    setActiveModalTab('dados'); setErrors({}); setSubItemErrors({});

    if (processo) {
      const editCase = JSON.parse(JSON.stringify(processo));
      if (!editCase.financeiro) {
        editCase.financeiro = { config: { honorariosContratuais: 0, percentualExito: 30, percentualSucumbencia: 10 }, transacoes: [] };
      }
      setEditingCase(editCase); 
    } else {
      setEditingCase({ 
        area: AreaDireito.CIVEL, status: ProcessoStatus.ATIVO, customData: {}, historicoAndamentos: [], prazos: [], audiencias: [], 
        dataDistribuicao: new Date().toISOString().split('T')[0], valorCausa: 0,
        financeiro: { config: { honorariosContratuais: 0, percentualExito: 30, percentualSucumbencia: 10 }, transacoes: [] }
      });
    }
    setIsCaseModalOpen(true);
  };

  const handleInitiateDelete = (e: React.MouseEvent, processo: Processo) => {
    e.preventDefault();
    e.stopPropagation();

    // Trava de segurança: Proibir excluir processos com histórico
    const hasPrazos = processo.prazos?.length > 0;
    const hasAudiencias = processo.audiencias?.length > 0;
    const hasAndamentos = processo.historicoAndamentos?.length > 0;

    if (hasPrazos || hasAudiencias || hasAndamentos) {
      let reason = "Este processo possui: ";
      const items = [];
      if (hasPrazos) items.push(`${processo.prazos.length} prazo(s)`);
      if (hasAudiencias) items.push(`${processo.audiencias.length} audiência(s)`);
      if (hasAndamentos) items.push(`${processo.historicoAndamentos.length} andamento(s)`);
      reason += items.join(", ");
      setConfirmDeleteModal({ isOpen: true, caseId: processo.id, isProhibited: true, reason: reason + ". Limpe o histórico antes de prosseguir." });
    } else {
      setConfirmDeleteModal({ isOpen: true, caseId: processo.id, isProhibited: false });
    }
  };

  const executeDelete = () => {
    if (confirmDeleteModal.caseId) {
      deleteCase(confirmDeleteModal.caseId);
      setConfirmDeleteModal({ isOpen: false, caseId: null, isProhibited: false });
    }
  };

  // --- Handlers Sub-items ---
  const handleAddAndamentoInternal = () => {
    const errors: Record<string, string> = {};
    if(!innerAndamento.data) errors.data = "Data obrigatória";
    if(!innerAndamento.descricao?.trim()) errors.descricao = "Descrição obrigatória";
    if(Object.keys(errors).length > 0) { setSubItemErrors(errors); return; }

    const newEntry: Andamento = { id: Date.now().toString(), data: innerAndamento.data, descricao: innerAndamento.descricao || '', tipo: innerAndamento.tipo as any };
    const updatedHistory = [newEntry, ...(editingCase.historicoAndamentos || [])];
    let currentLast = editingCase.ultimoAndamento;
    if (!currentLast || new Date(newEntry.data) >= new Date(currentLast.data)) { currentLast = { data: newEntry.data, descricao: newEntry.descricao || '' }; }
    setEditingCase(prev => ({ ...prev, historicoAndamentos: updatedHistory, ultimoAndamento: currentLast }));
    setInnerAndamento({ tipo: 'MOVIMENTACAO', data: new Date().toISOString().split('T')[0], descricao: '' });
    setIsAddingHistory(false); setSubItemErrors({});
  };

  const handleAddPrazoInternal = () => {
    const errors: Record<string, string> = {};
    if(!innerPrazo.data) errors.data = "Data obrigatória";
    if(!innerPrazo.descricao?.trim()) errors.descricao = "Descrição obrigatória";
    if(Object.keys(errors).length > 0) { setSubItemErrors(errors); return; }

    const newEntry: Prazo = { id: Date.now().toString(), data: innerPrazo.data, descricao: innerPrazo.descricao || '', status: 'PENDENTE' };
    setEditingCase(prev => ({ ...prev, prazos: [...(prev.prazos || []), newEntry] }));
    setInnerPrazo({ data: new Date().toISOString().split('T')[0], descricao: '', status: 'PENDENTE' });
    setIsAddingPrazo(false); setSubItemErrors({});
  };

  const handleSaveCase = () => {
    const newErrors: Record<string, string> = {};
    if (!editingCase.numero?.trim()) newErrors.numero = 'O número do processo é obrigatório.';
    if (!editingCase.titulo?.trim()) newErrors.titulo = 'O título da ação é obrigatório.';
    if (!editingCase.clienteId) newErrors.clienteId = 'Selecione um cliente.';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); setActiveModalTab('dados'); return; }
    
    if (editingCase.id) {
      updateCase(editingCase as Processo);
    } else {
      addCase({ ...editingCase, id: Date.now().toString(), valorCausa: editingCase.valorCausa || 0, responsavel: 'Usuário Atual' } as Processo);
    }
    setIsCaseModalOpen(false);
  };

  const renderListView = () => (
    <div className="grid grid-cols-1 gap-4">
      {filteredCases.map((processo) => (
        <div key={processo.id} className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm hover:border-slate-700 transition-all group relative">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0
                ${processo.area === AreaDireito.TRABALHISTA ? 'bg-orange-600' : processo.area === AreaDireito.PENAL ? 'bg-red-600' : 'bg-blue-600'}`}>
                <FolderOpen size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 text-lg leading-tight cursor-pointer hover:text-blue-400" onClick={() => handleOpenCaseModal(processo)}>{processo.titulo}</h3>
                <span className="text-xs text-slate-500 font-mono mt-1 block">{processo.numero}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${processo.status === ProcessoStatus.ATIVO ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{processo.status}</span>
              <button onClick={() => handleOpenCaseModal(processo)} className="text-slate-500 hover:text-blue-400 p-1 rounded hover:bg-slate-800 transition-colors" title="Editar"><Settings size={18} /></button>
              <button onClick={(e) => handleInitiateDelete(e, processo)} className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-colors" title="Excluir"><Trash2 size={18} /></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 text-sm text-slate-400"><User size={16} className="text-slate-600" /><span className="truncate max-w-[150px]">{getClientName(processo.clienteId)}</span></div>
            <div className="flex items-center gap-2 text-sm text-slate-400"><Calendar size={16} className="text-slate-600" /><span>Dist: {new Date(processo.dataDistribuicao).toLocaleDateString('pt-BR')}</span></div>
            <div className="flex items-center gap-2 text-sm text-slate-400"><FileText size={16} className="text-slate-600" /><span>{processo.area}</span></div>
            <div className="text-right text-sm font-semibold text-slate-300">R$ {processo.valorCausa.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-100">Gestão de Processos</h1><p className="text-slate-500 text-sm">Controle de andamentos, prazos e audiências</p></div>
        <button type="button" onClick={() => handleOpenCaseModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-blue-900/30"><Plus size={18} /> Novo Processo</button>
      </div>

      <div className="flex border-b border-slate-800 bg-slate-900 rounded-t-xl px-2">
        <button type="button" onClick={() => setActiveTab('list')} className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'list' ? 'border-blue-600 text-blue-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}><FolderOpen size={18} /> Processos</button>
      </div>

      {activeTab === 'list' && (
        <div className="bg-slate-900 p-4 rounded-b-xl border border-t-0 border-slate-800 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} /><input type="text" placeholder="Buscar por número, cliente ou título..." className="w-full bg-slate-950 pl-10 pr-4 py-2.5 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-200 placeholder-slate-600" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          <div className="min-w-[220px]"><CustomDropdown compact value={selectedArea} onChange={(val) => setSelectedArea(val)} options={[{ value: 'all', label: 'Todas as Áreas', icon: <Filter size={16} /> }, ...Object.values(AreaDireito).map(area => ({ value: area, label: area, icon: <FolderOpen size={16}/> }))]} /></div>
        </div>
      )}

      <div className="min-h-[400px]">{activeTab === 'list' && renderListView()}</div>

      {/* CONFIRM DELETE MODAL */}
      {confirmDeleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md p-8 animate-scale-in text-center">
            <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${confirmDeleteModal.isProhibited ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
               {confirmDeleteModal.isProhibited ? <ShieldAlert size={44} /> : <AlertTriangle size={44} />}
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">
              {confirmDeleteModal.isProhibited ? "Ação Bloqueada" : "Confirmar Exclusão"}
            </h2>
            
            <p className="text-slate-400 mb-8 leading-relaxed">
              {confirmDeleteModal.isProhibited 
                ? confirmDeleteModal.reason 
                : "Tem certeza que deseja excluir este processo? Esta ação é irreversível e removerá todos os dados básicos do caso."}
            </p>

            <div className="flex flex-col gap-3">
              {!confirmDeleteModal.isProhibited ? (
                <>
                  <button onClick={executeDelete} className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-900/40 transition-all">SIM, EXCLUIR PROCESSO</button>
                  <button onClick={() => setConfirmDeleteModal({ isOpen: false, caseId: null, isProhibited: false })} className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all">CANCELAR</button>
                </>
              ) : (
                <button onClick={() => setConfirmDeleteModal({ isOpen: false, caseId: null, isProhibited: false })} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/40 transition-all">ENTENDI</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CASE MODAL (Original Editing Modal) */}
      {isCaseModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-800 animate-scale-in">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 z-10 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2"><Briefcase size={22} className="text-blue-500"/>{editingCase.id ? 'Editar Processo' : 'Novo Processo'}</h2>
              <button type="button" onClick={() => setIsCaseModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
            </div>
            
            <div className="flex border-b border-slate-800 bg-slate-950 px-6 overflow-x-auto">
               <button onClick={() => setActiveModalTab('dados')} className={`py-3 px-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeModalTab === 'dados' ? 'border-blue-600 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Dados Gerais</button>
               <button onClick={() => setActiveModalTab('prazos')} className={`py-3 px-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeModalTab === 'prazos' ? 'border-red-600 text-red-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Prazos</button>
               <button onClick={() => setActiveModalTab('historico')} className={`py-3 px-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeModalTab === 'historico' ? 'border-green-600 text-green-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Andamentos</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {activeModalTab === 'dados' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputWithIcon label="Número" required icon={Hash} value={editingCase.numero} onChange={e => setEditingCase({...editingCase, numero: e.target.value})} error={errors.numero} />
                        <CustomDropdown label="Área" value={editingCase.area as string} onChange={(val) => setEditingCase({...editingCase, area: val as AreaDireito})} options={Object.values(AreaDireito).map(area => ({ value: area, label: area, icon: <FolderOpen size={16}/> }))} />
                    </div>
                    <InputWithIcon label="Título" required icon={AlignLeft} value={editingCase.titulo} onChange={e => setEditingCase({...editingCase, titulo: e.target.value})} error={errors.titulo} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <CustomDropdown label="Cliente" value={editingCase.clienteId || ''} onChange={(val) => setEditingCase({...editingCase, clienteId: val})} placeholder="Selecione um Cliente" options={clients.map(client => ({ value: client.id, label: client.nome, icon: <User size={16}/> }))} error={errors.clienteId} />
                        <InputWithIcon label="Valor da Causa" icon={DollarSign} type="number" value={editingCase.valorCausa} onChange={e => setEditingCase({...editingCase, valorCausa: Number(e.target.value)})} />
                    </div>
                  </div>
              )}
              {/* Other tabs omitted for brevity but they should remain unchanged from your original code */}
            </div>
            
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 rounded-b-2xl">
              <button type="button" onClick={() => setIsCaseModalOpen(false)} className="px-5 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg font-medium transition-colors">Cancelar</button>
              <button type="button" onClick={handleSaveCase} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 font-medium transition-all">Salvar Processo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
