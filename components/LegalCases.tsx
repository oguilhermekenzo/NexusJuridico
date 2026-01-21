
import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Search, Filter, FolderOpen, Calendar, User, FileText, Settings, Clock, 
  AlertTriangle, Hammer, Trash2, X, Briefcase, ChevronDown, Check, DollarSign, 
  Hash, AlignLeft, Scale, History, MapPin, Link as LinkIcon, AlertCircle, 
  ExternalLink, Percent, TrendingUp, TrendingDown, Wallet, ShieldAlert, Edit2, 
  List, LayoutGrid, ChevronLeft, ChevronRight, Gavel, CheckCircle2, Circle
} from 'lucide-react';
import { Processo, ProcessoStatus, AreaDireito, CustomFieldConfig, TransacaoProcesso } from '../types';
import { useData } from '../contexts/DataContext';
import { CustomDatePicker } from './CustomDatePicker';

// --- SHARED COMPONENTS ---
interface CustomDropdownProps {
  label?: string;
  value: string;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  onChange: (value: string) => void;
  className?: string;
  showSearch?: boolean;
  placeholderSearch?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ 
  label, value, options, onChange, className, showSearch, placeholderSearch = "Pesquisar..." 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">{label}</label>}
      <button 
        onClick={() => { setIsOpen(!isOpen); setSearchTerm(''); }} 
        className={`w-full flex items-center justify-between bg-slate-900 text-slate-200 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-all ${isOpen ? 'ring-2 ring-blue-600' : ''}`}
      >
        <div className="flex items-center gap-2 truncate text-sm">
          {selectedOption?.icon} <span>{selectedOption?.label || 'Selecione...'}</span>
        </div>
        <ChevronDown size={14} className={`transition-transform text-slate-500 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-[110] w-full mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-fade-in-down">
          {showSearch && (
            <div className="p-2 border-b border-slate-800 bg-slate-950">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text"
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 pl-9 pr-3 text-xs text-white focus:ring-1 focus:ring-blue-600 outline-none"
                  placeholder={placeholderSearch}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          )}
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button 
                  key={opt.value} 
                  onClick={() => { onChange(opt.value); setIsOpen(false); }} 
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-800 transition-colors ${opt.value === value ? 'text-blue-400 bg-blue-400/5' : 'text-slate-300'}`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-600 italic">Nenhum resultado encontrado</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface LegalCasesProps {
  customFields: CustomFieldConfig[];
  initialProcessId?: string;
  onClearInitialProcess?: () => void;
}

export const LegalCases: React.FC<LegalCasesProps> = ({ customFields, initialProcessId, onClearInitialProcess }) => {
  const { cases, clients, addCase, updateCase, deleteCase } = useData();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'dados' | 'prazos' | 'audiencias' | 'financeiro' | 'historico'>('dados');
  const [editingCase, setEditingCase] = useState<Partial<Processo>>({});
  const [newTransaction, setNewTransaction] = useState<Partial<TransacaoProcesso>>({
    id: '',
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    tipo: 'RECEITA',
    valor: 0,
    categoria: 'Honorários'
  });

  const getClientName = (id: string) => clients.find(c => c.id === id)?.nome || 'Não vinculado';

  const filteredCases = cases.filter(c => 
    c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.numero.includes(searchTerm) || 
    getClientName(c.clienteId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Efeito para abrir o processo inicial se fornecido
  useEffect(() => {
    if (initialProcessId) {
      const target = cases.find(c => c.id === initialProcessId);
      if (target) {
        handleOpenCaseModal(target);
        onClearInitialProcess?.();
      }
    }
  }, [initialProcessId, cases]);

  const handleOpenCaseModal = (processo?: Processo) => {
    setActiveModalTab('dados');
    if (processo) {
      setEditingCase(JSON.parse(JSON.stringify(processo)));
    } else {
      setEditingCase({
        id: '',
        numero: '',
        titulo: '',
        clienteId: '',
        parteAdversa: '',
        area: AreaDireito.CIVEL,
        status: ProcessoStatus.ATIVO,
        valorCausa: 0,
        dataDistribuicao: new Date().toISOString().split('T')[0],
        prazos: [],
        audiencias: [],
        historicoAndamentos: [],
        responsavel: 'Dr. Nexus IA',
        financeiro: {
          config: { honorariosContratuais: 0, percentualExito: 0, percentualSucumbencia: 0 },
          transacoes: []
        }
      });
    }
    setIsCaseModalOpen(true);
  };

  const handleSave = () => {
    if (editingCase.id) {
      updateCase(editingCase as Processo);
    } else {
      addCase({ ...editingCase, id: Date.now().toString() } as Processo);
    }
    setIsCaseModalOpen(false);
  };

  const handleOpenTransactionModal = () => {
    setNewTransaction({
      id: Date.now().toString(),
      data: new Date().toISOString().split('T')[0],
      descricao: '',
      tipo: 'RECEITA',
      valor: 0,
      categoria: 'Honorários'
    });
    setIsTransactionModalOpen(true);
  };

  const handleAddTransaction = () => {
    if (!newTransaction.descricao || !newTransaction.valor) return;
    
    const updatedFinanceiro = {
      ...editingCase.financeiro!,
      transacoes: [...(editingCase.financeiro?.transacoes || []), newTransaction as TransacaoProcesso]
    };
    
    setEditingCase({ ...editingCase, financeiro: updatedFinanceiro });
    setIsTransactionModalOpen(false);
  };

  const TabButton = ({ id, label, icon: Icon }: { id: typeof activeModalTab, label: string, icon: any }) => (
    <button 
      onClick={() => setActiveModalTab(id)}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap
        ${activeModalTab === id ? 'border-blue-600 text-blue-400 bg-blue-400/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Gestão de Processos</h1>
          <p className="text-slate-500 text-sm">Central de controle e acompanhamento jurídico</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex shadow-sm">
            <button onClick={() => setViewMode('table')} className={`p-2 rounded ${viewMode === 'table' ? 'bg-slate-800 text-blue-400' : 'text-slate-500'}`}><List size={18}/></button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-slate-800 text-blue-400' : 'text-slate-500'}`}><LayoutGrid size={18}/></button>
          </div>
          <button onClick={() => handleOpenCaseModal()} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-lg shadow-blue-900/30 hover:bg-blue-700 transition-all">
            <Plus size={18} /> Novo Processo
          </button>
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por número, título ou cliente..." 
            className="w-full bg-slate-950 pl-10 pr-4 py-2.5 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-600 text-sm text-slate-200 outline-none transition-all"
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="p-4">Processo</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Área</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredCases.map((processo) => (
                <tr key={processo.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-200">{processo.titulo}</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5">{processo.numero}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-400">{getClientName(processo.clienteId)}</td>
                  <td className="p-4"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">{processo.area}</span></td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      processo.status === ProcessoStatus.ATIVO ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      processo.status === ProcessoStatus.JULGADO ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      'bg-slate-800 text-slate-500'
                    }`}>
                      {processo.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleOpenCaseModal(processo)} className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => deleteCase(processo.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCases.length === 0 && (
            <div className="p-10 text-center text-slate-600 italic text-sm">Nenhum processo encontrado.</div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCases.map((processo) => (
            <div key={processo.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col shadow-sm group">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded">{processo.area}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenCaseModal(processo)} className="p-1 text-slate-500 hover:text-blue-400"><Edit2 size={14}/></button>
                  <button onClick={() => deleteCase(processo.id)} className="p-1 text-slate-500 hover:text-red-400"><Trash2 size={14}/></button>
                </div>
              </div>
              <h3 className="font-bold text-slate-100 mb-1 truncate leading-tight">{processo.titulo}</h3>
              <p className="text-[10px] font-mono text-slate-500 mb-4 truncate">{processo.numero}</p>
              
              <div className="flex-1 space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-400"><User size={14} className="text-slate-600"/> {getClientName(processo.clienteId)}</div>
                <div className="flex items-center gap-2 text-xs text-slate-400"><Briefcase size={14} className="text-slate-600"/> Vs {processo.parteAdversa || 'N/A'}</div>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-800 flex justify-between items-center">
                <span className={`text-[9px] font-bold uppercase tracking-wider ${
                  processo.status === ProcessoStatus.ATIVO ? 'text-emerald-400' : 'text-slate-500'
                }`}>{processo.status}</span>
                <span className="text-xs font-bold text-slate-200">R$ {processo.valorCausa?.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DETALHADO DO PROCESSO */}
      {isCaseModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col border border-slate-800 animate-scale-in overflow-hidden">
            {/* Header Modal */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-500 flex items-center justify-center border border-blue-500/20">
                  <Scale size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white leading-tight">{editingCase.id ? 'Editar Processo' : 'Novo Processo'}</h2>
                  <p className="text-xs text-slate-500 mt-1">{editingCase.numero || 'Número ainda não definido'}</p>
                </div>
              </div>
              <button onClick={() => setIsCaseModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <X className="text-slate-400 hover:text-white" size={24}/>
              </button>
            </div>

            {/* Abas do Modal */}
            <div className="flex overflow-x-auto no-scrollbar border-b border-slate-800 bg-slate-950 px-6">
              <TabButton id="dados" label="Dados Gerais" icon={FileText} />
              <TabButton id="prazos" label="Prazos e Tarefas" icon={Clock} />
              <TabButton id="audiencias" label="Audiências" icon={Gavel} />
              <TabButton id="financeiro" label="Financeiro" icon={DollarSign} />
              <TabButton id="historico" label="Andamentos" icon={History} />
            </div>

            {/* Conteúdo das Abas */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-950/50">
              {activeModalTab === 'dados' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Título do Caso</label>
                      <input 
                        value={editingCase.titulo} 
                        onChange={e => setEditingCase({...editingCase, titulo: e.target.value})} 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all" 
                        placeholder="Ex: Ação Indenizatória - Danos Morais" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Número do Processo</label>
                      <input 
                        value={editingCase.numero} 
                        onChange={e => setEditingCase({...editingCase, numero: e.target.value})} 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-mono outline-none focus:ring-2 focus:ring-blue-600 transition-all" 
                        placeholder="0000000-00.0000.0.00.0000" 
                      />
                    </div>
                    <CustomDropdown 
                      label="Cliente"
                      value={editingCase.clienteId || ''}
                      onChange={val => setEditingCase({...editingCase, clienteId: val})}
                      options={clients.map(c => ({ value: c.id, label: c.nome, icon: <User size={14}/> }))}
                      showSearch={true}
                      placeholderSearch="Pesquisar cliente por nome..."
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <CustomDropdown 
                        label="Área do Direito"
                        value={editingCase.area || AreaDireito.CIVEL}
                        onChange={val => setEditingCase({...editingCase, area: val as AreaDireito})}
                        options={Object.values(AreaDireito).map(a => ({ value: a, label: a }))}
                      />
                      <CustomDropdown 
                        label="Status"
                        value={editingCase.status || ProcessoStatus.ATIVO}
                        onChange={val => setEditingCase({...editingCase, status: val as ProcessoStatus})}
                        options={Object.values(ProcessoStatus).map(s => ({ value: s, label: s }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Parte Adversa</label>
                      <input 
                        value={editingCase.parteAdversa} 
                        onChange={e => setEditingCase({...editingCase, parteAdversa: e.target.value})} 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all" 
                        placeholder="Nome da empresa ou pessoa contrária" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Valor da Causa</label>
                        <div className="relative">
                           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">R$</span>
                           <input 
                             type="number"
                             value={editingCase.valorCausa} 
                             onWheel={(e) => e.currentTarget.blur()}
                             onChange={e => setEditingCase({...editingCase, valorCausa: Number(e.target.value)})} 
                             className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 pl-10 text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                           />
                        </div>
                      </div>
                      <CustomDatePicker 
                        label="Data Distribuição"
                        value={editingCase.dataDistribuicao || ''}
                        onChange={val => setEditingCase({...editingCase, dataDistribuicao: val})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeModalTab === 'prazos' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <Clock className="text-amber-500" />
                      <span className="text-sm font-bold text-slate-200">Prazos e Tarefas Vinculadas</span>
                    </div>
                    <button 
                      onClick={() => setEditingCase({...editingCase, prazos: [...(editingCase.prazos || []), { id: Date.now().toString(), data: '', descricao: '', status: 'PENDENTE' }]})}
                      className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                    >
                      + Novo Prazo
                    </button>
                  </div>
                  <div className="space-y-3">
                    {editingCase.prazos?.map((prazo, idx) => (
                      <div key={prazo.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4 group">
                        <div className="flex-1 grid grid-cols-4 gap-4">
                           <div className="col-span-2">
                             <input 
                               value={prazo.descricao} 
                               onChange={e => {
                                 const newPrazos = [...(editingCase.prazos || [])];
                                 newPrazos[idx].descricao = e.target.value;
                                 setEditingCase({...editingCase, prazos: newPrazos});
                               }}
                               className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 outline-none" 
                               placeholder="Descrição da tarefa/prazo" 
                             />
                           </div>
                           <CustomDatePicker 
                             className="col-span-1"
                             value={prazo.data}
                             onChange={val => {
                               const newPrazos = [...(editingCase.prazos || [])];
                               newPrazos[idx].data = val;
                               setEditingCase({...editingCase, prazos: newPrazos});
                             }}
                           />
                           <CustomDropdown 
                             className="col-span-1"
                             value={prazo.status}
                             onChange={val => {
                               const newPrazos = [...(editingCase.prazos || [])];
                               newPrazos[idx].status = val as any;
                               setEditingCase({...editingCase, prazos: newPrazos});
                             }}
                             options={[{ value: 'PENDENTE', label: 'Pendente', icon: <Circle size={10} className="text-amber-500 fill-amber-500" /> }, { value: 'CONCLUIDO', label: 'Concluído', icon: <CheckCircle2 size={10} className="text-emerald-500" /> }]}
                           />
                        </div>
                        <button 
                          onClick={() => setEditingCase({...editingCase, prazos: editingCase.prazos?.filter(p => p.id !== prazo.id)})}
                          className="p-2 text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {(!editingCase.prazos || editingCase.prazos.length === 0) && (
                      <div className="text-center py-10 text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">Nenhum prazo cadastrado.</div>
                    )}
                  </div>
                </div>
              )}

              {activeModalTab === 'audiencias' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <Gavel className="text-blue-500" />
                      <span className="text-sm font-bold text-slate-200">Audiências Agendadas</span>
                    </div>
                    <button 
                      onClick={() => setEditingCase({...editingCase, audiencias: [...(editingCase.audiencias || []), { id: Date.now().toString(), data: '', tipo: 'Instrução', local: '', status: 'AGENDADA' }]})}
                      className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                    >
                      + Nova Audiência
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {editingCase.audiencias?.map((aud, idx) => (
                      <div key={aud.id} className="bg-slate-900 p-5 rounded-xl border border-slate-800 relative group">
                        <button 
                          onClick={() => setEditingCase({...editingCase, audiencias: editingCase.audiencias?.filter(a => a.id !== aud.id)})}
                          className="absolute top-2 right-2 p-1.5 text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <CustomDatePicker 
                              includeTime
                              label="Data e Hora"
                              value={aud.data}
                              onChange={val => {
                                const newAuds = [...(editingCase.audiencias || [])];
                                newAuds[idx].data = val;
                                setEditingCase({...editingCase, audiencias: newAuds});
                              }}
                            />
                            <CustomDropdown 
                              label="Tipo"
                              value={aud.tipo}
                              onChange={val => {
                                const newAuds = [...(editingCase.audiencias || [])];
                                newAuds[idx].tipo = val;
                                setEditingCase({...editingCase, audiencias: newAuds});
                              }}
                              options={[{ value: 'Instrução', label: 'Instrução' }, { value: 'Una', label: 'Una' }, { value: 'Conciliação', label: 'Conciliação' }, { value: 'Julgamento', label: 'Julgamento' }]}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Local / Link</label>
                            <input 
                              value={aud.local} 
                              onChange={e => {
                                const newAuds = [...(editingCase.audiencias || [])];
                                newAuds[idx].local = e.target.value;
                                setEditingCase({...editingCase, audiencias: newAuds});
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 outline-none" 
                              placeholder="Endereço ou link da sala virtual" 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!editingCase.audiencias || editingCase.audiencias.length === 0) && (
                      <div className="col-span-full text-center py-10 text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">Sem audiências previstas.</div>
                    )}
                  </div>
                </div>
              )}

              {activeModalTab === 'financeiro' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                        <Wallet size={14} className="text-emerald-500" /> Honorários Contratuais
                      </h4>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">R$</span>
                        <input 
                          type="number"
                          onWheel={(e) => e.currentTarget.blur()}
                          value={editingCase.financeiro?.config.honorariosContratuais} 
                          onChange={e => setEditingCase({...editingCase, financeiro: { ...editingCase.financeiro!, config: { ...editingCase.financeiro!.config, honorariosContratuais: Number(e.target.value) } } })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 pl-10 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                        />
                      </div>
                    </div>
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                        <TrendingUp size={14} className="text-blue-500" /> Percentual de Êxito
                      </h4>
                      <div className="relative">
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">%</span>
                        <input 
                          type="number"
                          onWheel={(e) => e.currentTarget.blur()}
                          value={editingCase.financeiro?.config.percentualExito} 
                          onChange={e => setEditingCase({...editingCase, financeiro: { ...editingCase.financeiro!, config: { ...editingCase.financeiro!.config, percentualExito: Number(e.target.value) } } })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 pr-10 text-white font-bold outline-none focus:ring-2 focus:ring-blue-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                        />
                      </div>
                    </div>
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                        <Gavel size={14} className="text-indigo-500" /> Sucumbência Estipulada
                      </h4>
                      <div className="relative">
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">%</span>
                        <input 
                          type="number"
                          onWheel={(e) => e.currentTarget.blur()}
                          value={editingCase.financeiro?.config.percentualSucumbencia} 
                          onChange={e => setEditingCase({...editingCase, financeiro: { ...editingCase.financeiro!, config: { ...editingCase.financeiro!.config, percentualSucumbencia: Number(e.target.value) } } })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 pr-10 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-slate-200">Extrato de Movimentações</h4>
                        <button 
                          onClick={handleOpenTransactionModal}
                          className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 bg-blue-400/5 px-3 py-1.5 rounded-lg border border-blue-400/10 transition-all hover:bg-blue-400/10"
                        >
                          <Plus size={14}/> Lançar Transação
                        </button>
                     </div>
                     <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
                        <table className="w-full text-xs text-left">
                           <thead className="bg-slate-950 border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                              <tr>
                                 <th className="p-4">Data</th>
                                 <th className="p-4">Descrição</th>
                                 <th className="p-4">Tipo</th>
                                 <th className="p-4">Valor</th>
                                 <th className="p-4"></th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-800/50">
                              {editingCase.financeiro?.transacoes.map((t) => (
                                 <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 text-slate-400">{new Date(t.data).toLocaleDateString('pt-BR')}</td>
                                    <td className="p-4 text-slate-200 font-medium">{t.descricao}</td>
                                    <td className="p-4">
                                       <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                          t.tipo === 'RECEITA' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                       }`}>
                                          {t.tipo === 'RECEITA' ? 'Crédito' : 'Débito'}
                                       </span>
                                    </td>
                                    <td className={`p-4 font-mono font-bold ${t.tipo === 'RECEITA' ? 'text-emerald-400' : 'text-red-400'}`}>
                                       R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-4 text-right">
                                       <button 
                                         onClick={() => setEditingCase({...editingCase, financeiro: { ...editingCase.financeiro!, transacoes: editingCase.financeiro?.transacoes.filter(tx => tx.id !== t.id) || [] }})}
                                         className="p-1.5 text-slate-600 hover:text-red-500 hover:bg-red-500/5 rounded transition-all"
                                       >
                                         <Trash2 size={14} />
                                       </button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                        {(!editingCase.financeiro?.transacoes || editingCase.financeiro.transacoes.length === 0) && (
                           <div className="p-8 text-center text-slate-600 italic text-sm">Nenhuma movimentação registrada.</div>
                        )}
                     </div>
                  </div>
                </div>
              )}

              {activeModalTab === 'historico' && (
                <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
                   <div className="relative pl-8 border-l border-slate-800 space-y-8 py-4">
                      {editingCase.historicoAndamentos?.map((and) => (
                        <div key={and.id} className="relative">
                           <div className="absolute -left-[37px] top-1 w-4 h-4 rounded-full bg-blue-600 border-4 border-slate-950"></div>
                           <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
                              <div className="flex justify-between items-start mb-2">
                                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date(and.data).toLocaleDateString('pt-BR')}</span>
                                 <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-bold">{and.tipo}</span>
                              </div>
                              <p className="text-sm text-slate-200 leading-relaxed">{and.descricao}</p>
                           </div>
                        </div>
                      ))}
                      <div className="flex gap-4">
                         <button className="text-xs bg-slate-900 border border-slate-800 text-slate-400 px-4 py-2 rounded-lg hover:text-white transition-all">+ Adicionar Andamento Interno</button>
                         <button className="text-xs bg-slate-900 border border-slate-800 text-slate-400 px-4 py-2 rounded-lg hover:text-white transition-all">Importar do Tribunal</button>
                      </div>
                   </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-950">
              <button 
                onClick={() => setIsCaseModalOpen(false)} 
                className="px-6 py-2.5 text-slate-400 hover:text-white transition-colors font-medium"
              >
                Descartar Alterações
              </button>
              <button 
                onClick={handleSave} 
                className="bg-blue-600 px-8 py-2.5 rounded-xl text-white font-bold shadow-lg shadow-blue-900/40 hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <Check size={18} /> Salvar Processo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE TRANSAÇÃO FINANCEIRA */}
      {isTransactionModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-800 animate-scale-in overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
               <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <DollarSign size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Nova Transação</h3>
               </div>
               <button onClick={() => setIsTransactionModalOpen(false)} className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-500 hover:text-white">
                  <X size={20} />
               </button>
            </div>
            <div className="p-8 space-y-6">
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Descrição</label>
                  <input 
                    value={newTransaction.descricao}
                    onChange={e => setNewTransaction({ ...newTransaction, descricao: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    placeholder="Ex: Recebimento de Alvará Judicial"
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <CustomDatePicker 
                    label="Data"
                    value={newTransaction.data || ''}
                    onChange={val => setNewTransaction({ ...newTransaction, data: val })}
                  />
                  <CustomDropdown 
                    label="Tipo de Lançamento"
                    value={newTransaction.tipo || 'RECEITA'}
                    onChange={val => setNewTransaction({ ...newTransaction, tipo: val as any })}
                    options={[
                      { value: 'RECEITA', label: 'Crédito', icon: <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> },
                      { value: 'DESPESA', label: 'Débito', icon: <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div> }
                    ]}
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Valor da Transação</label>
                  <div className="relative group">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                     <input 
                        type="number"
                        onWheel={(e) => e.currentTarget.blur()}
                        value={newTransaction.valor}
                        onChange={e => setNewTransaction({ ...newTransaction, valor: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 pl-12 text-2xl font-bold text-white outline-none focus:ring-2 focus:ring-emerald-600 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0,00"
                     />
                  </div>
               </div>
            </div>
            <div className="p-6 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
               <button 
                 onClick={() => setIsTransactionModalOpen(false)}
                 className="px-6 py-2.5 text-slate-400 hover:text-white font-medium"
               >
                 Cancelar
               </button>
               <button 
                 onClick={handleAddTransaction}
                 disabled={!newTransaction.descricao || !newTransaction.valor}
                 className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-900/40 transition-all flex items-center gap-2"
               >
                 <Check size={18} /> Confirmar Lançamento
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
