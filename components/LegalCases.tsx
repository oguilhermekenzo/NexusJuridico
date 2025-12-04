import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, Filter, FolderOpen, Calendar, User, FileText, Settings, Clock, AlertTriangle, Hammer, Trash2, X, Briefcase, ChevronDown, Check, DollarSign, Hash, AlignLeft, Scale, History, MapPin, Link as LinkIcon, AlertCircle, ExternalLink, Percent, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
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
  error?: string; // Validation Error
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
  error?: string; // Validation Error
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
        onWheel={(e) => e.currentTarget.type === 'number' && e.currentTarget.blur()} // Prevent scroll value change
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

// --- MAIN COMPONENT ---

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

  // Inner States for Adding Sub-items inside Modal
  const [innerAndamento, setInnerAndamento] = useState<Partial<Andamento>>({ tipo: 'MOVIMENTACAO', data: new Date().toISOString().split('T')[0], descricao: '' });
  const [innerPrazo, setInnerPrazo] = useState<Partial<Prazo>>({ data: new Date().toISOString().split('T')[0], descricao: '', status: 'PENDENTE' });
  const [innerAudiencia, setInnerAudiencia] = useState<Partial<Audiencia>>({ data: new Date().toISOString().split('T')[0], tipo: 'Instrução', status: 'AGENDADA', local: '' });
  
  // Finance States
  const [innerTransacao, setInnerTransacao] = useState<Partial<TransacaoProcesso>>({ data: new Date().toISOString().split('T')[0], tipo: 'RECEITA', valor: 0, categoria: 'Alvará' });
  const [isAddingTransacao, setIsAddingTransacao] = useState(false);

  const [isAddingHistory, setIsAddingHistory] = useState(false);
  const [isAddingPrazo, setIsAddingPrazo] = useState(false);
  const [isAddingAudiencia, setIsAddingAudiencia] = useState(false);

  const [newAndamento, setNewAndamento] = useState<Partial<Andamento>>({
    tipo: 'MOVIMENTACAO',
    data: new Date().toISOString().split('T')[0]
  });
  const [selectedCaseIdForProgress, setSelectedCaseIdForProgress] = useState<string | null>(null);

  const getClientName = (id: string) => {
    return clients.find(c => c.id === id)?.nome || 'Cliente Desconhecido';
  };

  const filteredCases = cases.filter(c => {
    const clientName = getClientName(c.clienteId).toLowerCase();
    const matchesSearch = c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.numero.includes(searchTerm) ||
                          clientName.includes(searchTerm.toLowerCase());
    const matchesArea = selectedArea === 'all' || c.area === selectedArea;
    return matchesSearch && matchesArea;
  });

  const getCustomFieldsForArea = (area: AreaDireito) => {
    return customFields.filter(f => f.area === area);
  };

  const handleOpenCaseModal = (processo?: Processo) => {
    setIsAddingHistory(false);
    setIsAddingPrazo(false);
    setIsAddingAudiencia(false);
    setIsAddingTransacao(false);
    setActiveModalTab('dados');
    setErrors({}); // Clear errors
    setSubItemErrors({}); // Clear sub item errors

    if (processo) {
      const editCase = JSON.parse(JSON.stringify(processo));
      if (!editCase.financeiro) {
        editCase.financeiro = {
          config: { honorariosContratuais: 0, percentualExito: 30, percentualSucumbencia: 10 },
          transacoes: []
        };
      }
      setEditingCase(editCase); 
    } else {
      setEditingCase({ 
        area: AreaDireito.CIVEL, 
        status: ProcessoStatus.ATIVO, 
        customData: {},
        historicoAndamentos: [],
        prazos: [],
        audiencias: [],
        dataDistribuicao: new Date().toISOString().split('T')[0],
        valorCausa: 0,
        financeiro: {
          config: { honorariosContratuais: 0, percentualExito: 30, percentualSucumbencia: 10 },
          transacoes: []
        }
      });
    }
    setIsCaseModalOpen(true);
  };

  // --- Handlers for Sub-items ---
  const handleAddAndamentoInternal = () => {
    const errors: Record<string, string> = {};
    if(!innerAndamento.data) errors.data = "Data obrigatória";
    if(!innerAndamento.descricao?.trim()) errors.descricao = "Descrição obrigatória";

    if(Object.keys(errors).length > 0) {
      setSubItemErrors(errors);
      return;
    }

    const newEntry: Andamento = { id: Date.now().toString(), data: innerAndamento.data, descricao: innerAndamento.descricao || '', tipo: innerAndamento.tipo as any };
    const updatedHistory = [newEntry, ...(editingCase.historicoAndamentos || [])];
    let currentLast = editingCase.ultimoAndamento;
    if (!currentLast || new Date(newEntry.data) >= new Date(currentLast.data)) { currentLast = { data: newEntry.data, descricao: newEntry.descricao || '' }; }
    setEditingCase(prev => ({ ...prev, historicoAndamentos: updatedHistory, ultimoAndamento: currentLast }));
    setInnerAndamento({ tipo: 'MOVIMENTACAO', data: new Date().toISOString().split('T')[0], descricao: '' });
    setIsAddingHistory(false);
    setSubItemErrors({});
  };

  const handleAddPrazoInternal = () => {
    const errors: Record<string, string> = {};
    if(!innerPrazo.data) errors.data = "Data obrigatória";
    if(!innerPrazo.descricao?.trim()) errors.descricao = "Descrição obrigatória";

    if(Object.keys(errors).length > 0) {
      setSubItemErrors(errors);
      return;
    }

    const newEntry: Prazo = { id: Date.now().toString(), data: innerPrazo.data, descricao: innerPrazo.descricao || '', status: 'PENDENTE' };
    setEditingCase(prev => ({ ...prev, prazos: [...(prev.prazos || []), newEntry] }));
    setInnerPrazo({ data: new Date().toISOString().split('T')[0], descricao: '', status: 'PENDENTE' });
    setIsAddingPrazo(false);
    setSubItemErrors({});
  };

  const handleDeletePrazo = (id: string) => { if(confirm('Excluir este prazo?')) { setEditingCase(prev => ({ ...prev, prazos: prev.prazos?.filter(p => p.id !== id) })); } }

  const handleAddAudienciaInternal = () => {
    const errors: Record<string, string> = {};
    if(!innerAudiencia.data) errors.data = "Data obrigatória";
    if(!innerAudiencia.tipo) errors.tipo = "Tipo obrigatório";

    if(Object.keys(errors).length > 0) {
      setSubItemErrors(errors);
      return;
    }

    const newEntry: Audiencia = { id: Date.now().toString(), data: innerAudiencia.data, tipo: innerAudiencia.tipo, local: innerAudiencia.local || '', status: innerAudiencia.status as any, observacao: innerAudiencia.observacao };
    setEditingCase(prev => ({ ...prev, audiencias: [...(prev.audiencias || []), newEntry] }));
    setInnerAudiencia({ data: new Date().toISOString().split('T')[0], tipo: 'Instrução', status: 'AGENDADA', local: '' });
    setIsAddingAudiencia(false);
    setSubItemErrors({});
  }

  const handleDeleteAudiencia = (id: string) => { if(confirm('Excluir esta audiência?')) { setEditingCase(prev => ({ ...prev, audiencias: prev.audiencias?.filter(a => a.id !== id) })); } }

  const handleAddTransacaoInternal = () => {
    const errors: Record<string, string> = {};
    if(!innerTransacao.data) errors.data = "Data obrigatória";
    if(!innerTransacao.descricao?.trim()) errors.descricao = "Descrição obrigatória";
    if(!innerTransacao.valor || Number(innerTransacao.valor) <= 0) errors.valor = "Valor inválido";

    if(Object.keys(errors).length > 0) {
      setSubItemErrors(errors);
      return;
    }

    const newEntry: TransacaoProcesso = { id: Date.now().toString(), data: innerTransacao.data || new Date().toISOString(), descricao: innerTransacao.descricao || '', tipo: innerTransacao.tipo as any, valor: Number(innerTransacao.valor), categoria: innerTransacao.categoria || 'Geral' };
    setEditingCase(prev => ({ ...prev, financeiro: { ...prev.financeiro!, transacoes: [newEntry, ...(prev.financeiro?.transacoes || [])] } }));
    setInnerTransacao({ data: new Date().toISOString().split('T')[0], tipo: 'RECEITA', valor: 0, categoria: 'Alvará', descricao: '' });
    setIsAddingTransacao(false);
    setSubItemErrors({});
  };

  const handleDeleteTransacao = (id: string) => { if(confirm('Excluir esta transação?')) { setEditingCase(prev => ({ ...prev, financeiro: { ...prev.financeiro!, transacoes: prev.financeiro?.transacoes.filter(t => t.id !== id) || [] } })); } };

  const handleOpenLocation = (local: string) => {
    if (!local) return;
    const isUrl = /^(http|https|www\.)/i.test(local);
    if (isUrl) { let url = local; if (!local.startsWith('http')) url = `https://${local}`; window.open(url, '_blank'); } else { const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(local)}`; window.open(mapUrl, '_blank'); }
  };

  // --- SAVE VALIDATION ---
  const handleSaveCase = () => {
    // Validate Required Fields
    const newErrors: Record<string, string> = {};
    if (!editingCase.numero?.trim()) newErrors.numero = 'O número do processo é obrigatório.';
    if (!editingCase.titulo?.trim()) newErrors.titulo = 'O título da ação é obrigatório.';
    if (!editingCase.clienteId) newErrors.clienteId = 'Selecione um cliente.';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setActiveModalTab('dados'); // Jump to main tab to show errors
      return;
    }
    
    const sortedHistory = [...(editingCase.historicoAndamentos || [])].sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    const lastUpdate = sortedHistory.length > 0 ? { data: sortedHistory[0].data, descricao: sortedHistory[0].descricao } : undefined;
    const now = new Date();
    const pendingPrazos = (editingCase.prazos || []).filter(p => p.status === 'PENDENTE' && new Date(p.data) >= now).sort((a,b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const nextPrazoFatal = pendingPrazos.length > 0 ? pendingPrazos[0].data : undefined;
    const pendingAudiencias = (editingCase.audiencias || []).filter(a => a.status === 'AGENDADA' && new Date(a.data) >= now).sort((a,b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const nextAudiencia = pendingAudiencias.length > 0 ? pendingAudiencias[0].data : undefined;

    const caseToSave = { ...editingCase, historicoAndamentos: sortedHistory, ultimoAndamento: lastUpdate, prazoFatal: nextPrazoFatal, proximaAudiencia: nextAudiencia } as Processo;

    if (caseToSave.id) {
      updateCase(caseToSave);
    } else {
      addCase({ ...caseToSave, id: Date.now().toString(), valorCausa: caseToSave.valorCausa || 0, responsavel: 'Usuário Atual', historicoAndamentos: sortedHistory, prazos: editingCase.prazos || [], audiencias: editingCase.audiencias || [], customData: caseToSave.customData || {}, financeiro: caseToSave.financeiro });
    }
    setIsCaseModalOpen(false);
  };

  const handleDeleteCase = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir este processo? Todos os dados serão perdidos.")) {
      deleteCase(id);
    }
  };

  const handleOpenProgressModal = (caseId: string) => {
    setSelectedCaseIdForProgress(caseId);
    setNewAndamento({ tipo: 'MOVIMENTACAO', data: new Date().toISOString().split('T')[0], descricao: '' });
    setSubItemErrors({});
    setIsProgressModalOpen(true);
  };

  const handleSaveProgress = () => {
    const errors: Record<string, string> = {};
    if(!newAndamento.data) errors.data = "Data obrigatória";
    if(!newAndamento.descricao?.trim()) errors.descricao = "Descrição obrigatória";

    if(Object.keys(errors).length > 0) {
      setSubItemErrors(errors);
      return;
    }

    if (selectedCaseIdForProgress && newAndamento.descricao && newAndamento.data) {
       addAndamento(selectedCaseIdForProgress, { id: Date.now().toString(), data: newAndamento.data, descricao: newAndamento.descricao, tipo: newAndamento.tipo as any });
       setIsProgressModalOpen(false);
       setSelectedCaseIdForProgress(null);
       setSubItemErrors({});
    }
  };

  const calculateFinancials = () => {
    if (!editingCase.financeiro) return { totalReceitas: 0, totalDespesas: 0, saldoLiquido: 0, parteCliente: 0, parteEscritorio: 0 };
    const transacoes = editingCase.financeiro.transacoes || [];
    const totalReceitas = transacoes.filter(t => t.tipo === 'RECEITA').reduce((acc, t) => acc + t.valor, 0);
    const totalDespesas = transacoes.filter(t => t.tipo === 'DESPESA').reduce((acc, t) => acc + t.valor, 0);
    const saldoLiquido = totalReceitas - totalDespesas;
    const exitoPercent = editingCase.financeiro.config.percentualExito || 0;
    const parteEscritorio = saldoLiquido * (exitoPercent / 100) + (editingCase.financeiro.config.honorariosContratuais || 0);
    const parteCliente = saldoLiquido - (saldoLiquido * (exitoPercent / 100));
    return { totalReceitas, totalDespesas, saldoLiquido, parteCliente, parteEscritorio };
  };
  const financials = calculateFinancials();

  const renderListView = () => (
    <div className="grid grid-cols-1 gap-4">
      {filteredCases.map((processo) => (
        <div key={processo.id} className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm hover:border-slate-700 transition-all group relative">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0
                ${processo.area === AreaDireito.TRABALHISTA ? 'bg-orange-600' : 
                  processo.area === AreaDireito.PENAL ? 'bg-red-600' : 
                  processo.area === AreaDireito.TRIBUTARIO ? 'bg-green-600' :
                  processo.area === AreaDireito.PREVIDENCIARIO ? 'bg-emerald-600' :
                  processo.area === AreaDireito.BANCARIO ? 'bg-slate-600' :
                  processo.area === AreaDireito.IMOBILIARIO ? 'bg-amber-600' :
                  'bg-blue-600'}`}>
                <FolderOpen size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 text-lg leading-tight cursor-pointer hover:text-blue-400" onClick={() => handleOpenCaseModal(processo)}>{processo.titulo}</h3>
                <span className="text-xs text-slate-500 font-mono mt-1 block">{processo.numero}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border
                ${processo.status === ProcessoStatus.ATIVO ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                  processo.status === ProcessoStatus.SUSPENSO ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                  'bg-slate-800 text-slate-400 border-slate-700'}`}>
                {processo.status}
              </span>
              <button onClick={() => handleOpenCaseModal(processo)} className="text-slate-500 hover:text-blue-400 p-1 rounded hover:bg-slate-800 transition-colors" title="Editar"><Settings size={18} /></button>
              <button onClick={(e) => handleDeleteCase(e, processo.id)} className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-colors" title="Excluir"><Trash2 size={18} /></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <User size={16} className="text-slate-600" />
              <span className="truncate max-w-[150px]" title={getClientName(processo.clienteId)}>{getClientName(processo.clienteId)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Calendar size={16} className="text-slate-600" />
              <span>Dist: {new Date(processo.dataDistribuicao).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <FileText size={16} className="text-slate-600" />
              <span>{processo.area}</span>
            </div>
            <div className="text-right text-sm font-semibold text-slate-300">
              R$ {processo.valorCausa.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
            </div>
          </div>
          <div className="mt-4 bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center group/andamento">
             <div className="flex gap-3">
                <div className="mt-1"><Clock size={16} className="text-blue-500" /></div>
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Último Andamento</p>
                    {processo.ultimoAndamento ? (
                      <><p className="text-sm text-slate-300 leading-snug">{processo.ultimoAndamento.descricao}</p><span className="text-xs text-slate-600 mt-1 block">{new Date(processo.ultimoAndamento.data).toLocaleDateString('pt-BR')}</span></>
                    ) : (
                      <p className="text-sm text-slate-600 italic">Nenhum andamento registrado.</p>
                    )}
                </div>
             </div>
             <button type="button" onClick={() => handleOpenProgressModal(processo.id)} className="bg-slate-800 border border-slate-700 text-slate-400 px-3 py-1 rounded text-xs font-medium hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm opacity-100 md:opacity-0 md:group-hover/andamento:opacity-100">+ Andamento</button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderPrazosView = () => {
    // ... (Keep existing Prazos render logic) ...
    const allDeadlines: {prazo: Prazo, case: Processo}[] = [];
    cases.forEach(c => {
       (c.prazos || []).forEach(p => { if(p.status === 'PENDENTE') allDeadlines.push({prazo: p, case: c}); });
       if(c.prazoFatal && (!c.prazos || c.prazos.length === 0)) {
           allDeadlines.push({ prazo: { id: 'legacy', data: c.prazoFatal, descricao: 'Prazo Fatal (Legado)', status: 'PENDENTE' }, case: c });
       }
    });
    const sorted = allDeadlines.sort((a,b) => new Date(a.prazo.data).getTime() - new Date(b.prazo.data).getTime());

    return (
      <div className="space-y-4">
         {sorted.length === 0 && <div className="p-8 text-center text-slate-500 bg-slate-900 rounded-lg border border-dashed border-slate-800">Nenhum prazo futuro encontrado.</div>}
         {sorted.map(({prazo, case: c}) => {
           const daysLeft = Math.ceil((new Date(prazo.data).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
           const isUrgent = daysLeft <= 3;
           return (
             <div key={`${c.id}-${prazo.id}`} className={`bg-slate-900 p-4 rounded-xl border-l-4 shadow-sm flex items-center justify-between border-slate-800 ${isUrgent ? 'border-l-red-500' : 'border-l-blue-500'}`}>
                <div className="flex items-center gap-4">
                   <div className={`p-3 rounded-full ${isUrgent ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}><AlertTriangle size={20} /></div>
                   <div><h4 className="font-bold text-slate-200">{c.titulo}</h4><p className="text-sm text-slate-300 font-medium mb-1">{prazo.descricao}</p><p className="text-xs text-slate-500">{c.numero} • {getClientName(c.clienteId)}</p></div>
                </div>
                <div className="text-right"><span className={`block font-bold text-lg ${isUrgent ? 'text-red-500' : 'text-slate-300'}`}>{new Date(prazo.data).toLocaleDateString('pt-BR')}</span><span className="text-xs text-slate-500 uppercase font-medium">{daysLeft < 0 ? 'Vencido' : daysLeft === 0 ? 'Vence Hoje' : `Vence em ${daysLeft} dias`}</span></div>
             </div>
           )
         })}
      </div>
    )
  };

  const renderAudienciasView = () => {
    // ... (Keep existing Audiencias render logic) ...
    const allHearings: {audiencia: Audiencia, case: Processo}[] = [];
    cases.forEach(c => {
       (c.audiencias || []).forEach(a => { if(a.status === 'AGENDADA') allHearings.push({audiencia: a, case: c}); });
       if(c.proximaAudiencia && (!c.audiencias || c.audiencias.length === 0)) {
           allHearings.push({ audiencia: { id: 'legacy', data: c.proximaAudiencia, tipo: 'Audiência (Legado)', status: 'AGENDADA' }, case: c });
       }
    });
    const sorted = allHearings.sort((a,b) => new Date(a.audiencia.data).getTime() - new Date(b.audiencia.data).getTime());

    return (
      <div className="space-y-4">
         {sorted.length === 0 && <div className="p-8 text-center text-slate-500 bg-slate-900 rounded-lg border border-dashed border-slate-800">Nenhuma audiência agendada.</div>}
         {sorted.map(({audiencia, case: c}) => {
           const isUrl = audiencia.local ? /^(http|https|www\.)/i.test(audiencia.local) : false;
           return (
             <div key={`${c.id}-${audiencia.id}`} className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="p-3 rounded-full bg-purple-500/10 text-purple-500"><Hammer size={20} /></div>
                   <div>
                      <h4 className="font-bold text-slate-200">{c.titulo}</h4><p className="text-sm text-slate-300 font-medium">{audiencia.tipo}</p><p className="text-xs text-slate-500">{c.numero}</p>
                      {audiencia.local && (<button onClick={() => handleOpenLocation(audiencia.local!)} className="flex items-center gap-1 mt-1 text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors text-left" title={isUrl ? "Abrir Link" : "Ver no Google Maps"}>{isUrl ? <LinkIcon size={10} /> : <MapPin size={10} />} {audiencia.local} <ExternalLink size={8} className="ml-0.5 opacity-70" /></button>)}
                   </div>
                </div>
                <div className="text-right min-w-[120px]"><div className="flex items-center justify-end gap-2 text-slate-300 font-bold text-lg"><Calendar size={18} className="text-purple-500"/>{new Date(audiencia.data).toLocaleDateString('pt-BR')}</div><div className="text-sm text-slate-500 font-medium">{new Date(audiencia.data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</div></div>
             </div>
           )
         })}
      </div>
    )
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-100">Gestão de Processos</h1><p className="text-slate-500 text-sm">Controle de andamentos, prazos e audiências</p></div>
        <button type="button" onClick={() => handleOpenCaseModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-blue-900/30"><Plus size={18} /> Novo Processo</button>
      </div>

      <div className="flex border-b border-slate-800 bg-slate-900 rounded-t-xl px-2">
        <button type="button" onClick={() => setActiveTab('list')} className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'list' ? 'border-blue-600 text-blue-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}><FolderOpen size={18} /> Processos</button>
        <button type="button" onClick={() => setActiveTab('prazos')} className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'prazos' ? 'border-red-500 text-red-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}><AlertTriangle size={18} /> Agenda de Prazos</button>
        <button type="button" onClick={() => setActiveTab('audiencias')} className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'audiencias' ? 'border-purple-500 text-purple-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}><Hammer size={18} /> Agenda de Audiência</button>
      </div>

      {activeTab === 'list' && (
        <div className="bg-slate-900 p-4 rounded-b-xl border border-t-0 border-slate-800 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} /><input type="text" placeholder="Buscar por número, cliente ou título..." className="w-full bg-slate-950 pl-10 pr-4 py-2.5 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-200 placeholder-slate-600" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          <div className="min-w-[220px]"><CustomDropdown compact value={selectedArea} onChange={(val) => setSelectedArea(val)} options={[{ value: 'all', label: 'Todas as Áreas', icon: <Filter size={16} /> }, ...Object.values(AreaDireito).map(area => ({ value: area, label: area, icon: <FolderOpen size={16}/> }))]} /></div>
        </div>
      )}

      <div className="min-h-[400px]">
        {activeTab === 'list' && renderListView()}
        {activeTab === 'prazos' && renderPrazosView()}
        {activeTab === 'audiencias' && renderAudienciasView()}
      </div>

      {/* CASE MODAL */}
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
               <button onClick={() => setActiveModalTab('audiencias')} className={`py-3 px-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeModalTab === 'audiencias' ? 'border-purple-600 text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Audiências</button>
               <button onClick={() => setActiveModalTab('historico')} className={`py-3 px-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeModalTab === 'historico' ? 'border-green-600 text-green-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Andamentos</button>
               <button onClick={() => setActiveModalTab('financeiro')} className={`py-3 px-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeModalTab === 'financeiro' ? 'border-yellow-600 text-yellow-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}><DollarSign size={16}/> Financeiro</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              
              {/* --- TAB: DADOS GERAIS --- */}
              {activeModalTab === 'dados' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputWithIcon label="Número do Processo" required icon={Hash} placeholder="0000000-00.0000.0.00.0000" value={editingCase.numero} onChange={e => setEditingCase({...editingCase, numero: e.target.value})} error={errors.numero} />
                        <CustomDropdown label="Área" value={editingCase.area as string} onChange={(val) => setEditingCase({...editingCase, area: val as AreaDireito})} options={Object.values(AreaDireito).map(area => ({ value: area, label: area, icon: <FolderOpen size={16}/> }))} />
                    </div>
                    <InputWithIcon label="Título da Ação" required icon={AlignLeft} placeholder="Ex: Ação de Cobrança vs Empresa X" value={editingCase.titulo} onChange={e => setEditingCase({...editingCase, titulo: e.target.value})} error={errors.titulo} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <CustomDropdown label="Cliente" value={editingCase.clienteId || ''} onChange={(val) => setEditingCase({...editingCase, clienteId: val})} placeholder="Selecione um Cliente" options={clients.map(client => ({ value: client.id, label: client.nome, icon: <User size={16}/> }))} error={errors.clienteId} />
                        <InputWithIcon label="Valor da Causa (R$)" icon={DollarSign} type="number" value={editingCase.valorCausa} onChange={e => setEditingCase({...editingCase, valorCausa: Number(e.target.value)})} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         <CustomDatePicker label="Distribuição" value={editingCase.dataDistribuicao || ''} onChange={val => setEditingCase({...editingCase, dataDistribuicao: val})} />
                    </div>
                    
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/50 mt-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-800 pb-2"><Settings size={14} className="text-blue-500" /> Campos Específicos ({editingCase.area})</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {getCustomFieldsForArea(editingCase.area as AreaDireito).map(field => (
                            <div key={field.id}>
                            {field.type === 'date' ? (
                                <CustomDatePicker label={field.label} value={(editingCase.customData?.[field.id] as string) || ''} onChange={(val) => setEditingCase(prev => ({ ...prev, customData: { ...prev.customData, [field.id]: val } }))} />
                            ) : (
                                <InputWithIcon label={field.label} icon={AlignLeft} type={field.type} value={editingCase.customData?.[field.id] || ''} onChange={(e) => setEditingCase(prev => ({ ...prev, customData: { ...prev.customData, [field.id]: e.target.value } }))} />
                            )}
                            </div>
                        ))}
                        </div>
                    </div>
                  </div>
              )}

              {/* --- TAB: PRAZOS --- */}
              {activeModalTab === 'prazos' && (
                  <div className="space-y-4 animate-fade-in">
                     <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold text-slate-200 uppercase flex items-center gap-2">Lista de Prazos</h3><button type="button" onClick={() => { setIsAddingPrazo(!isAddingPrazo); setSubItemErrors({}); }} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded border border-slate-700 flex items-center gap-1">{isAddingPrazo ? <X size={12}/> : <Plus size={12}/>} {isAddingPrazo ? 'Cancelar' : 'Novo Prazo'}</button></div>
                     {isAddingPrazo && (<div className="bg-slate-950 p-4 rounded-xl border border-red-500/20 mb-4 animate-fade-in shadow-lg"><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><CustomDatePicker label="Data Fatal" value={innerPrazo.data || ''} onChange={val => setInnerPrazo({...innerPrazo, data: val})} error={subItemErrors.data} /><CustomDropdown label="Status" value={innerPrazo.status || 'PENDENTE'} onChange={val => setInnerPrazo({...innerPrazo, status: val as any})} options={[{value: 'PENDENTE', label: 'Pendente'}, {value: 'CONCLUIDO', label: 'Concluído'}]} /></div><InputWithIcon label="Descrição" icon={AlignLeft} placeholder="Ex: Prazo para contestação" value={innerPrazo.descricao} onChange={e => setInnerPrazo({...innerPrazo, descricao: e.target.value})} error={subItemErrors.descricao} /><div className="flex justify-end mt-4"><button type="button" onClick={handleAddPrazoInternal} className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-700 shadow-md">Adicionar Prazo</button></div></div>)}
                     <div className="space-y-3">{(!editingCase.prazos || editingCase.prazos.length === 0) && <div className="text-center py-8 text-slate-600 italic">Nenhum prazo cadastrado.</div>}{(editingCase.prazos || []).sort((a,b) => new Date(a.data).getTime() - new Date(b.data).getTime()).map((prazo, idx) => (<div key={idx} className={`p-4 rounded-xl border flex justify-between items-center ${prazo.status === 'CONCLUIDO' ? 'bg-slate-950 border-slate-800 opacity-60' : 'bg-slate-900 border-slate-700'}`}><div><p className="text-sm font-bold text-slate-200">{prazo.descricao}</p><p className="text-xs text-slate-500 font-mono mt-1">{new Date(prazo.data).toLocaleDateString('pt-BR')}</p></div><div className="flex items-center gap-3"><span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${prazo.status === 'CONCLUIDO' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{prazo.status}</span><button onClick={() => handleDeletePrazo(prazo.id)} className="text-slate-500 hover:text-red-400 p-1"><Trash2 size={16}/></button></div></div>))}</div>
                  </div>
              )}

              {/* --- TAB: AUDIÊNCIAS --- */}
              {activeModalTab === 'audiencias' && (
                  <div className="space-y-4 animate-fade-in">
                     <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold text-slate-200 uppercase flex items-center gap-2">Agendamento de Audiências</h3><button type="button" onClick={() => { setIsAddingAudiencia(!isAddingAudiencia); setSubItemErrors({}); }} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded border border-slate-700 flex items-center gap-1">{isAddingAudiencia ? <X size={12}/> : <Plus size={12}/>} {isAddingAudiencia ? 'Cancelar' : 'Nova Audiência'}</button></div>
                     {isAddingAudiencia && (<div className="bg-slate-950 p-4 rounded-xl border border-purple-500/20 mb-4 animate-fade-in shadow-lg"><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><CustomDatePicker label="Data e Hora" value={innerAudiencia.data || ''} onChange={val => setInnerAudiencia({...innerAudiencia, data: val})} includeTime error={subItemErrors.data} /><CustomDropdown label="Tipo" value={innerAudiencia.tipo || 'Instrução'} onChange={val => setInnerAudiencia({...innerAudiencia, tipo: val})} options={[{value:'Conciliação', label:'Conciliação'}, {value:'Instrução', label:'Instrução'}, {value:'Una', label:'Una'}, {value:'Julgamento', label:'Julgamento'}]} error={subItemErrors.tipo} /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><InputWithIcon label="Local / Link" icon={LinkIcon} placeholder="Link do Zoom/Meet ou Endereço" value={innerAudiencia.local} onChange={e => setInnerAudiencia({...innerAudiencia, local: e.target.value})} /><CustomDropdown label="Status" value={innerAudiencia.status || 'AGENDADA'} onChange={val => setInnerAudiencia({...innerAudiencia, status: val as any})} options={[{value:'AGENDADA', label:'Agendada'}, {value:'REALIZADA', label:'Realizada'}, {value:'CANCELADA', label:'Cancelada'}]} /></div><div className="flex justify-end mt-4"><button type="button" onClick={handleAddAudienciaInternal} className="bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-purple-700 shadow-md">Agendar Audiência</button></div></div>)}
                     <div className="space-y-3">{(!editingCase.audiencias || editingCase.audiencias.length === 0) && <div className="text-center py-8 text-slate-600 italic">Nenhuma audiência agendada.</div>}{(editingCase.audiencias || []).sort((a,b) => new Date(a.data).getTime() - new Date(b.data).getTime()).map((aud, idx) => { const isUrl = aud.local ? /^(http|https|www\.)/i.test(aud.local) : false; return (<div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex justify-between items-center"><div><div className="flex items-center gap-2 mb-1"><p className="text-sm font-bold text-slate-200">{aud.tipo}</p><span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${aud.status === 'AGENDADA' ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>{aud.status}</span></div><p className="text-xs text-slate-400 font-mono mb-1">{new Date(aud.data).toLocaleDateString('pt-BR')} às {new Date(aud.data).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</p>{aud.local && (<button type="button" onClick={() => handleOpenLocation(aud.local!)} className="flex items-center gap-1 mt-1 text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors text-left" title={isUrl ? "Abrir Link" : "Ver no Google Maps"}>{isUrl ? <LinkIcon size={10}/> : <MapPin size={10}/>} {aud.local}<ExternalLink size={8} className="ml-0.5 opacity-70" /></button>)}</div><button onClick={() => handleDeleteAudiencia(aud.id)} className="text-slate-500 hover:text-red-400 p-1"><Trash2 size={16}/></button></div>)})}</div>
                  </div>
              )}

              {/* --- TAB: HISTÓRICO / ANDAMENTOS --- */}
              {activeModalTab === 'historico' && (
                  <div className="space-y-4 animate-fade-in">
                     <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold text-slate-200 uppercase flex items-center gap-2">Linha do Tempo</h3><button type="button" onClick={() => { setIsAddingHistory(!isAddingHistory); setSubItemErrors({}); }} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded border border-slate-700 flex items-center gap-1">{isAddingHistory ? <X size={12}/> : <Plus size={12}/>} {isAddingHistory ? 'Cancelar' : 'Lançar Andamento'}</button></div>
                     {isAddingHistory && (<div className="bg-slate-950 p-4 rounded-xl border border-blue-500/20 mb-6 shadow-lg"><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><CustomDatePicker label="Data" value={innerAndamento.data || ''} onChange={(val) => setInnerAndamento({...innerAndamento, data: val})} error={subItemErrors.data} /><CustomDropdown label="Tipo" value={innerAndamento.tipo || 'MOVIMENTACAO'} onChange={(val) => setInnerAndamento({...innerAndamento, tipo: val as any})} options={[{ value: 'MOVIMENTACAO', label: 'Movimentação' }, { value: 'PUBLICACAO', label: 'Publicação' }, { value: 'INTERNO', label: 'Nota Interna' }]} /></div><InputWithIcon label="Descrição" icon={AlignLeft} placeholder="Descreva o andamento..." value={innerAndamento.descricao} onChange={(e) => setInnerAndamento({...innerAndamento, descricao: e.target.value})} error={subItemErrors.descricao} /><div className="flex justify-end mt-4"><button type="button" onClick={handleAddAndamentoInternal} className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md">Adicionar</button></div></div>)}
                     <div className="relative pl-4 border-l-2 border-slate-800 ml-2 space-y-6">{(!editingCase.historicoAndamentos || editingCase.historicoAndamentos.length === 0) && <div className="pl-4 text-slate-600 text-sm italic">Nenhum histórico registrado.</div>}{[...(editingCase.historicoAndamentos || [])].sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map((andamento, idx) => (<div key={idx} className="relative pl-6 group"><div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 bg-slate-900 z-10 flex items-center justify-center ${idx === 0 ? 'border-blue-500 shadow-md' : 'border-slate-600'}`}><div className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-blue-500' : 'bg-slate-600'}`}></div></div><div className="p-4 rounded-xl border bg-slate-950 border-slate-800"><div className="flex justify-between items-start mb-2"><span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-slate-800 text-slate-400 border-slate-700">{andamento.tipo}</span><span className="text-xs text-slate-500 font-mono">{new Date(andamento.data).toLocaleDateString('pt-BR')}</span></div><p className="text-sm text-slate-300 leading-relaxed">{andamento.descricao}</p></div></div>))}</div>
                  </div>
              )}

              {/* --- TAB: FINANCEIRO --- */}
              {activeModalTab === 'financeiro' && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Header Config */}
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Configuração de Honorários</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <InputWithIcon label="Contratual (Fixo)" icon={DollarSign} type="number" value={editingCase.financeiro?.config.honorariosContratuais} onChange={(e) => setEditingCase(prev => ({...prev, financeiro: {...prev.financeiro!, config: {...prev.financeiro!.config, honorariosContratuais: Number(e.target.value)}} }))} />
                            <InputWithIcon label="Êxito (%)" icon={Percent} type="number" value={editingCase.financeiro?.config.percentualExito} onChange={(e) => setEditingCase(prev => ({...prev, financeiro: {...prev.financeiro!, config: {...prev.financeiro!.config, percentualExito: Number(e.target.value)}} }))} />
                            <InputWithIcon label="Sucumbência (%)" icon={Percent} type="number" value={editingCase.financeiro?.config.percentualSucumbencia} onChange={(e) => setEditingCase(prev => ({...prev, financeiro: {...prev.financeiro!, config: {...prev.financeiro!.config, percentualSucumbencia: Number(e.target.value)}} }))} />
                        </div>
                    </div>

                    {/* Financial Dashboard Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                           <p className="text-xs text-slate-500 font-bold uppercase mb-1">Total Líquido</p>
                           <h3 className="text-xl font-bold text-white">R$ {financials.saldoLiquido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
                           <p className="text-[10px] text-slate-500 mt-1">Receitas - Despesas</p>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-2 opacity-10"><User size={40} className="text-green-500"/></div>
                           <p className="text-xs text-green-500 font-bold uppercase mb-1">Parte Cliente</p>
                           <h3 className="text-xl font-bold text-slate-200">R$ {financials.parteCliente.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-2 opacity-10"><Briefcase size={40} className="text-blue-500"/></div>
                           <p className="text-xs text-blue-500 font-bold uppercase mb-1">Parte Escritório</p>
                           <h3 className="text-xl font-bold text-slate-200">R$ {financials.parteEscritorio.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
                           <p className="text-[10px] text-slate-500 mt-1">Contratual + Êxito</p>
                        </div>
                    </div>

                    {/* Transactions */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-bold text-slate-200 uppercase flex items-center gap-2">Extrato de Lançamentos</h3>
                            <button type="button" onClick={() => { setIsAddingTransacao(!isAddingTransacao); setSubItemErrors({}); }} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded border border-slate-700 flex items-center gap-1">{isAddingTransacao ? <X size={12}/> : <Plus size={12}/>} {isAddingTransacao ? 'Cancelar' : 'Novo Lançamento'}</button>
                        </div>
                        
                        {isAddingTransacao && (
                            <div className="bg-slate-950 p-4 rounded-xl border border-yellow-500/20 mb-4 animate-fade-in shadow-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <CustomDatePicker label="Data" value={innerTransacao.data || ''} onChange={val => setInnerTransacao({...innerTransacao, data: val})} error={subItemErrors.data} />
                                    <InputWithIcon label="Valor (R$)" icon={DollarSign} type="number" value={innerTransacao.valor} onChange={e => setInnerTransacao({...innerTransacao, valor: Number(e.target.value)})} error={subItemErrors.valor} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <CustomDropdown label="Tipo" value={innerTransacao.tipo || 'RECEITA'} onChange={(val) => setInnerTransacao({...innerTransacao, tipo: val as any})} options={[{value:'RECEITA', label:'Entrada (Receita)', icon: <TrendingUp size={14} className="text-green-500"/>}, {value:'DESPESA', label:'Saída (Despesa)', icon: <TrendingDown size={14} className="text-red-500"/>}]} />
                                    <InputWithIcon label="Categoria" icon={AlignLeft} placeholder="Ex: Alvará, Custas" value={innerTransacao.categoria} onChange={e => setInnerTransacao({...innerTransacao, categoria: e.target.value})} />
                                </div>
                                <InputWithIcon label="Descrição" icon={AlignLeft} placeholder="Detalhes do lançamento" value={innerTransacao.descricao} onChange={e => setInnerTransacao({...innerTransacao, descricao: e.target.value})} error={subItemErrors.descricao} />
                                <div className="flex justify-end mt-4">
                                    <button type="button" onClick={handleAddTransacaoInternal} className="bg-yellow-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-yellow-700 shadow-md">Adicionar Lançamento</button>
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-slate-900 text-xs uppercase font-bold text-slate-500">
                                    <tr>
                                        <th className="p-3">Data</th>
                                        <th className="p-3">Descrição</th>
                                        <th className="p-3">Cat.</th>
                                        <th className="p-3 text-right">Valor</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {(!editingCase.financeiro?.transacoes || editingCase.financeiro.transacoes.length === 0) && (
                                        <tr><td colSpan={5} className="p-4 text-center italic text-slate-600">Nenhum lançamento registrado.</td></tr>
                                    )}
                                    {(editingCase.financeiro?.transacoes || []).sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map(t => (
                                        <tr key={t.id} className="hover:bg-slate-900/50">
                                            <td className="p-3 font-mono text-xs">{new Date(t.data).toLocaleDateString('pt-BR')}</td>
                                            <td className="p-3 text-slate-300 font-medium">{t.descricao}</td>
                                            <td className="p-3 text-xs">{t.categoria}</td>
                                            <td className={`p-3 text-right font-bold ${t.tipo === 'RECEITA' ? 'text-green-500' : 'text-red-500'}`}>
                                                {t.tipo === 'RECEITA' ? '+' : '-'} R$ {t.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                            </td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => handleDeleteTransacao(t.id)} className="text-slate-600 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                  </div>
              )}

            </div>
            
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 rounded-b-2xl sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
              <button type="button" onClick={() => setIsCaseModalOpen(false)} className="px-5 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg font-medium transition-colors">Cancelar</button>
              <button type="button" onClick={handleSaveCase} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 font-medium transition-all">Salvar Processo</button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK PROGRESS MODAL (Legacy/Card Action) */}
      {isProgressModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-800 animate-scale-in">
             <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-2xl">
               <h3 className="font-bold text-slate-200 text-lg flex items-center gap-2"><Clock className="text-blue-500" size={20}/> Novo Andamento</h3>
               <button type="button" onClick={() => setIsProgressModalOpen(false)}><X size={20} className="text-slate-400 hover:text-white"/></button>
             </div>
             <div className="p-6 space-y-5">
               <CustomDatePicker label="Data do Andamento" value={newAndamento.data || ''} onChange={val => setNewAndamento({...newAndamento, data: val})} error={subItemErrors.data} />
               <CustomDropdown label="Tipo de Andamento" value={newAndamento.tipo as string} onChange={(val) => setNewAndamento({...newAndamento, tipo: val as any})} options={[{ value: 'MOVIMENTACAO', label: 'Movimentação Processual' }, { value: 'PUBLICACAO', label: 'Publicação Oficial' }, { value: 'INTERNO', label: 'Nota Interna' }]} />
               <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Descrição</label><textarea className={`w-full bg-slate-950 text-slate-200 border p-3 rounded-xl h-32 resize-none outline-none transition-all text-sm custom-scrollbar placeholder:text-slate-600 ${subItemErrors.descricao ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-slate-800 focus:ring-2 focus:ring-blue-600'}`} placeholder="Descreva o andamento detalhadamente..." value={newAndamento.descricao} onChange={e => setNewAndamento({...newAndamento, descricao: e.target.value})} />{subItemErrors.descricao && <p className="text-red-500 text-xs mt-1 ml-1 font-medium animate-fade-in">{subItemErrors.descricao}</p>}</div>
             </div>
             <div className="p-5 border-t border-slate-800 bg-slate-900 rounded-b-2xl flex justify-end gap-2">
                <button type="button" onClick={() => setIsProgressModalOpen(false)} className="px-5 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors font-medium">Cancelar</button>
                <button type="button" onClick={handleSaveProgress} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 font-medium">Salvar Andamento</button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};