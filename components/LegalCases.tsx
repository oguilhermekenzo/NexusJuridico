
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Filter, FolderOpen, Calendar, User, FileText, Settings, Clock, 
  AlertTriangle, Hammer, Trash2, X, Briefcase, ChevronDown, Check, DollarSign, 
  Hash, AlignLeft, Scale, History, MapPin, Link as LinkIcon, AlertCircle, 
  ExternalLink, Percent, TrendingUp, TrendingDown, Wallet, ShieldAlert, Edit2, 
  List, LayoutGrid, ChevronLeft, ChevronRight, Gavel, CheckCircle2, Circle
} from 'lucide-react';
import { Processo, ProcessoStatus, AreaDireito, CustomFieldConfig, TransacaoProcesso, TimesheetEntry, Prazo, Audiencia, Andamento } from '../types';
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
      {label && <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1 tracking-wider">{label}</label>}
      <button 
        onClick={() => { setIsOpen(!isOpen); setSearchTerm(''); }} 
        className={`w-full flex items-center justify-between bg-slate-900 text-slate-200 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-all ${isOpen ? 'ring-2 ring-blue-600' : 'hover:bg-slate-800/50'}`}
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
  showNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const LegalCases: React.FC<LegalCasesProps> = ({ customFields, initialProcessId, onClearInitialProcess, showNotify }) => {
  const { cases, clients, timesheet, addCase, updateCase, deleteCase, addTimesheetEntry, deleteTimesheetEntry } = useData();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  
  const [activeModalTab, setActiveModalTab] = useState<'dados' | 'prazos' | 'audiencias' | 'financeiro' | 'timesheet' | 'historico'>('dados');
  const [editingCase, setEditingCase] = useState<Partial<Processo>>({});
  
  // States for new items in tabs
  const [isTimesheetFormOpen, setIsTimesheetFormOpen] = useState(false);
  const [newTimesheet, setNewTimesheet] = useState<Partial<TimesheetEntry>>({
    id: '', advogado: 'Dr. Juzk IA', descricao: '', data: new Date().toISOString().split('T')[0], horas: 1, faturavel: true
  });

  const [newPrazo, setNewPrazo] = useState<Partial<Prazo>>({ data: new Date().toISOString().split('T')[0], descricao: '', status: 'PENDENTE' });
  const [newAudiencia, setNewAudiencia] = useState<Partial<Audiencia>>({ data: new Date().toISOString().split('T')[0] + 'T09:00', tipo: 'Conciliação', local: '', status: 'AGENDADA' });
  const [newAndamento, setNewAndamento] = useState<Partial<Andamento>>({ data: new Date().toISOString().split('T')[0], descricao: '', tipo: 'MOVIMENTACAO' });
  const [newTransaction, setNewTransaction] = useState<Partial<TransacaoProcesso>>({
    id: '', data: new Date().toISOString().split('T')[0], descricao: '', tipo: 'RECEITA', valor: 0, categoria: 'Honorários'
  });

  const getClientName = (id: string) => clients.find(c => c.id === id)?.nome || 'Não vinculado';

  const filteredCases = cases.filter(c => 
    c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.numero.includes(searchTerm) || 
    getClientName(c.clienteId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const processTimesheet = useMemo(() => {
    if (!editingCase.id) return [];
    return timesheet.filter(e => e.processoId === editingCase.id);
  }, [timesheet, editingCase.id]);

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
        id: '', numero: '', titulo: '', clienteId: '', parteAdversa: '', area: AreaDireito.CIVEL, status: ProcessoStatus.ATIVO,
        valorCausa: 0, dataDistribuicao: new Date().toISOString().split('T')[0], prazos: [], audiencias: [], historicoAndamentos: [],
        responsavel: 'Dr. Juzk IA', financeiro: { config: { honorariosContratuais: 0, percentualExito: 0, percentualSucumbencia: 0 }, transacoes: [] }, customData: {}
      });
    }
    setIsCaseModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingCase.id && !editingCase.id.startsWith('demo-')) {
        await updateCase(editingCase as Processo);
        showNotify("Processo atualizado com sucesso!");
      } else {
        await addCase({ ...editingCase, id: Date.now().toString() } as Processo);
        showNotify("Processo cadastrado com sucesso!");
      }
      setIsCaseModalOpen(false);
    } catch (e) {
      showNotify("Erro ao salvar processo.", "error");
    }
  };

  const handleDeleteCase = async (id: string) => {
    if (window.confirm("Deseja realmente excluir este processo?")) {
      try {
        await deleteCase(id);
        showNotify("Processo removido!", "info");
      } catch (e) {
        showNotify("Erro ao excluir processo.", "error");
      }
    }
  };

  // HANDLERS FOR NEW ITEMS
  const handleAddPrazo = () => {
    if (!newPrazo.descricao || !newPrazo.data) return;
    const item = { ...newPrazo, id: Date.now().toString() } as Prazo;
    setEditingCase({ ...editingCase, prazos: [...(editingCase.prazos || []), item] });
    setNewPrazo({ data: new Date().toISOString().split('T')[0], descricao: '', status: 'PENDENTE' });
    showNotify("Prazo adicionado!");
  };

  const handleAddAudiencia = () => {
    if (!newAudiencia.data) return;
    const item = { ...newAudiencia, id: Date.now().toString() } as Audiencia;
    setEditingCase({ ...editingCase, audiencias: [...(editingCase.audiencias || []), item] });
    setNewAudiencia({ data: new Date().toISOString().split('T')[0] + 'T09:00', tipo: 'Conciliação', local: '', status: 'AGENDADA' });
    showNotify("Audiência agendada!");
  };

  const handleAddAndamento = () => {
    if (!newAndamento.descricao) return;
    const item = { ...newAndamento, id: Date.now().toString() } as Andamento;
    setEditingCase({ 
      ...editingCase, 
      historicoAndamentos: [item, ...(editingCase.historicoAndamentos || [])],
      ultimoAndamento: { data: item.data, descricao: item.descricao }
    });
    setNewAndamento({ data: new Date().toISOString().split('T')[0], descricao: '', tipo: 'MOVIMENTACAO' });
    showNotify("Andamento registrado!");
  };

  const handleAddTransaction = () => {
    if (!newTransaction.descricao || !newTransaction.valor) return;
    const item = { ...newTransaction, id: Date.now().toString() } as TransacaoProcesso;
    const financeiro = editingCase.financeiro || { config: { honorariosContratuais: 0, percentualExito: 0, percentualSucumbencia: 0 }, transacoes: [] };
    setEditingCase({ 
      ...editingCase, 
      financeiro: { ...financeiro, transacoes: [item, ...financeiro.transacoes] } 
    });
    setNewTransaction({ data: new Date().toISOString().split('T')[0], descricao: '', tipo: 'RECEITA', valor: 0, categoria: 'Honorários' });
    showNotify("Lançamento financeiro realizado!");
  };

  const handleAddTimesheet = async () => {
    if (!newTimesheet.descricao || !newTimesheet.horas) return;
    try {
      await addTimesheetEntry({
        ...newTimesheet,
        id: Date.now().toString(),
        processoId: editingCase.id!
      } as TimesheetEntry);
      setNewTimesheet({ ...newTimesheet, descricao: '', horas: 1 });
      setIsTimesheetFormOpen(false);
      showNotify("Horas lançadas com sucesso!");
    } catch (e) {
      showNotify("Erro ao lançar horas.", "error");
    }
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
            <button onClick={() => setViewMode('table')} className={`p-2 rounded ${viewMode === 'table' ? 'bg-slate-800 text-blue-400 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}><List size={18}/></button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-slate-800 text-blue-400 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}><LayoutGrid size={18}/></button>
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
            className="w-full bg-slate-950 pl-10 pr-4 py-2.5 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-200 outline-none transition-all"
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm animate-fade-in">
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
                <tr key={processo.id} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">{processo.titulo}</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5">{processo.numero}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-400">{getClientName(processo.clienteId)}</td>
                  <td className="p-4"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold uppercase">{processo.area}</span></td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      processo.status === ProcessoStatus.ATIVO ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      processo.status === ProcessoStatus.JULGADO ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-slate-800 text-slate-500 border-slate-700'
                    }`}>
                      {processo.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleOpenCaseModal(processo)} className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteCase(processo.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCases.length === 0 && (
            <div className="p-10 text-center text-slate-600 text-sm italic">Nenhum processo encontrado.</div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
          {filteredCases.map((processo) => (
            <div key={processo.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-900/10 transition-all group flex flex-col min-h-[220px]">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                   <Scale size={20} />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleOpenCaseModal(processo)} className="p-2 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"><Edit2 size={16}/></button>
                  <button onClick={() => handleDeleteCase(processo.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"><Trash2 size={16}/></button>
                </div>
              </div>
              
              <h3 className="font-bold text-slate-100 text-sm mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">{processo.titulo}</h3>
              <p className="text-[10px] font-mono text-slate-500 mb-4">{processo.numero}</p>
              
              <div className="space-y-2 mb-4 flex-1">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <User size={14} className="text-slate-600 shrink-0"/> 
                  <span className="truncate">{getClientName(processo.clienteId)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <FolderOpen size={14} className="text-slate-600 shrink-0"/> 
                  <span className="truncate">{processo.area}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/50 flex justify-between items-center">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                  processo.status === ProcessoStatus.ATIVO ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  processo.status === ProcessoStatus.JULGADO ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  'bg-slate-800 text-slate-500 border-slate-700'
                }`}>
                  {processo.status}
                </span>
                <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                   <DollarSign size={10} className="text-emerald-500" /> 
                   <span className="text-slate-300">{(processo.valorCausa || 0).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>
          ))}
          {filteredCases.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-600 border-2 border-dashed border-slate-800 rounded-3xl">
              <FolderOpen size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm italic">Nenhum processo encontrado na busca.</p>
            </div>
          )}
        </div>
      )}

      {isCaseModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col border border-slate-800 animate-scale-in overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-500 flex items-center justify-center border border-blue-500/20"><Scale size={24} /></div>
                <div>
                  <h2 className="text-xl font-bold text-white leading-tight">{editingCase.titulo || 'Novo Processo'}</h2>
                  <p className="text-xs text-slate-500 mt-1">{editingCase.numero || 'Número ainda não definido'}</p>
                </div>
              </div>
              <button onClick={() => setIsCaseModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><X className="text-slate-400 hover:text-white" size={24}/></button>
            </div>

            <div className="flex overflow-x-auto no-scrollbar border-b border-slate-800 bg-slate-950 px-6">
              <TabButton id="dados" label="Dados Gerais" icon={FileText} />
              <TabButton id="prazos" label="Prazos" icon={CheckCircle2} />
              <TabButton id="audiencias" label="Audiências" icon={Gavel} />
              <TabButton id="timesheet" label="Horas (Timesheet)" icon={Clock} />
              <TabButton id="financeiro" label="Financeiro" icon={DollarSign} />
              <TabButton id="historico" label="Andamentos" icon={History} />
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-950/50">
              {activeModalTab === 'dados' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                  <div className="space-y-4">
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1 tracking-wider">Título do Caso</label><input value={editingCase.titulo} onChange={e => setEditingCase({...editingCase, titulo: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all" /></div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1 tracking-wider">Número</label><input value={editingCase.numero} onChange={e => setEditingCase({...editingCase, numero: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-mono outline-none focus:ring-2 focus:ring-blue-600 transition-all" /></div>
                    <div className="grid grid-cols-2 gap-4">
                       <CustomDropdown label="Área" value={editingCase.area || AreaDireito.CIVEL} onChange={val => setEditingCase({...editingCase, area: val as AreaDireito})} options={Object.values(AreaDireito).map(a => ({ value: a, label: a }))} />
                       <CustomDropdown label="Status" value={editingCase.status || ProcessoStatus.ATIVO} onChange={val => setEditingCase({...editingCase, status: val as ProcessoStatus})} options={Object.values(ProcessoStatus).map(s => ({ value: s, label: s }))} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <CustomDropdown 
                      label="Cliente" 
                      value={editingCase.clienteId || ''} 
                      onChange={val => setEditingCase({...editingCase, clienteId: val})} 
                      options={clients.map(c => ({ value: c.id, label: c.nome }))}
                      showSearch
                      placeholderSearch="Buscar cliente..."
                    />
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1 tracking-wider">Parte Adversa</label><input value={editingCase.parteAdversa} onChange={e => setEditingCase({...editingCase, parteAdversa: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all" /></div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1 tracking-wider">Valor da Causa</label><input type="number" value={editingCase.valorCausa} onChange={e => setEditingCase({...editingCase, valorCausa: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all" /></div>
                  </div>
                </div>
              )}

              {activeModalTab === 'prazos' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Descrição do Prazo</label>
                       <input value={newPrazo.descricao} onChange={e => setNewPrazo({...newPrazo, descricao: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white" placeholder="Ex: Protocolar Recurso" />
                    </div>
                    <div>
                       <CustomDatePicker label="Data Vencimento" value={newPrazo.data || ''} onChange={val => setNewPrazo({...newPrazo, data: val})} />
                    </div>
                    <div className="md:col-span-3 flex justify-end">
                      <button onClick={handleAddPrazo} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors">
                        <Plus size={14} /> Adicionar Prazo
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {editingCase.prazos?.map((p, idx) => (
                      <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center group">
                         <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-lg ${p.status === 'CONCLUIDO' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}><Clock size={16}/></div>
                           <div><p className="text-sm font-semibold text-slate-200">{p.descricao}</p><p className="text-[10px] text-slate-500">{new Date(p.data).toLocaleDateString('pt-BR')}</p></div>
                         </div>
                         <button onClick={() => setEditingCase({...editingCase, prazos: editingCase.prazos?.filter((_, i) => i !== idx)})} className="p-2 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeModalTab === 'audiencias' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomDropdown label="Tipo de Audiência" value={newAudiencia.tipo || ''} onChange={val => setNewAudiencia({...newAudiencia, tipo: val})} options={['Conciliação', 'Instrução', 'Una', 'Julgamento'].map(t => ({ value: t, label: t }))} />
                    <CustomDatePicker label="Data e Hora" includeTime value={newAudiencia.data || ''} onChange={val => setNewAudiencia({...newAudiencia, data: val})} />
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Local / Link</label>
                      <input value={newAudiencia.local} onChange={e => setNewAudiencia({...newAudiencia, local: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white" placeholder="Fórum ou link da videochamada" />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <button onClick={handleAddAudiencia} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors">
                        <Plus size={14} /> Adicionar Audiência
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {editingCase.audiencias?.map((a, idx) => (
                      <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center group">
                         <div className="flex items-center gap-3">
                           <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500"><Gavel size={16}/></div>
                           <div><p className="text-sm font-semibold text-slate-200">{a.tipo}</p><p className="text-[10px] text-slate-500">{new Date(a.data).toLocaleString('pt-BR')}</p></div>
                         </div>
                         <button onClick={() => setEditingCase({...editingCase, audiencias: editingCase.audiencias?.filter((_, i) => i !== idx)})} className="p-2 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeModalTab === 'timesheet' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <Clock className="text-blue-500" />
                      <div>
                        <span className="text-sm font-bold text-slate-200 block">Lançamentos de Horas</span>
                        <span className="text-[10px] text-slate-500">Total acumulado: {processTimesheet.reduce((a, b) => a + b.horas, 0).toFixed(1)}h</span>
                      </div>
                    </div>
                    <button onClick={() => setIsTimesheetFormOpen(true)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition-colors">+ Lançar Horas</button>
                  </div>

                  {isTimesheetFormOpen && (
                    <div className="bg-slate-900 p-6 rounded-xl border border-blue-500/30 animate-slide-up space-y-4 shadow-xl">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descrição do Trabalho</label>
                          <input value={newTimesheet.descricao} onChange={e => setNewTimesheet({...newTimesheet, descricao: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200" placeholder="O que foi feito?" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Horas</label>
                          <input type="number" step="0.1" value={newTimesheet.horas} onChange={e => setNewTimesheet({...newTimesheet, horas: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 font-mono" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setIsTimesheetFormOpen(false)} className="text-xs text-slate-500 font-bold px-4">Cancelar</button>
                        <button onClick={handleAddTimesheet} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-xs font-bold">Salvar Lançamento</button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {processTimesheet.map((entry) => (
                      <div key={entry.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs uppercase">{entry.advogado.substring(0, 2)}</div>
                           <div>
                              <p className="text-sm font-semibold text-slate-200">{entry.descricao}</p>
                              <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                                 <span className="flex items-center gap-1"><Calendar size={10}/> {new Date(entry.data).toLocaleDateString('pt-BR')}</span>
                                 <span className="flex items-center gap-1"><User size={10}/> {entry.advogado}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="text-right"><span className="block font-mono font-bold text-blue-500 text-base">{entry.horas.toFixed(1)}h</span><span className="text-[9px] text-slate-600 uppercase font-bold">{entry.faturavel ? 'Faturável' : 'Não Faturável'}</span></div>
                           <button onClick={async () => { try { await deleteTimesheetEntry(entry.id); showNotify("Lançamento de horas removido."); } catch(e) { showNotify("Erro ao remover horas.", "error"); } }} className="p-2 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                    {processTimesheet.length === 0 && <div className="text-center py-10 text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">Nenhum registro de horas.</div>}
                  </div>
                </div>
              )}

              {activeModalTab === 'financeiro' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Honorários Contratuais</label>
                      <input type="number" value={editingCase.financeiro?.config.honorariosContratuais} onChange={e => setEditingCase({...editingCase, financeiro: {...editingCase.financeiro!, config: {...editingCase.financeiro!.config, honorariosContratuais: Number(e.target.value)}}})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">% Êxito</label>
                      <input type="number" value={editingCase.financeiro?.config.percentualExito} onChange={e => setEditingCase({...editingCase, financeiro: {...editingCase.financeiro!, config: {...editingCase.financeiro!.config, percentualExito: Number(e.target.value)}}})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">% Sucumbência</label>
                      <input type="number" value={editingCase.financeiro?.config.percentualSucumbencia} onChange={e => setEditingCase({...editingCase, financeiro: {...editingCase.financeiro!, config: {...editingCase.financeiro!.config, percentualSucumbencia: Number(e.target.value)}}})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center"><h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Transações do Processo</h3><button onClick={handleAddTransaction} className="text-xs bg-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">+ Nova Transação</button></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
                      <input value={newTransaction.descricao} onChange={e => setNewTransaction({...newTransaction, descricao: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white" placeholder="Descrição" />
                      <input type="number" value={newTransaction.valor} onChange={e => setNewTransaction({...newTransaction, valor: Number(e.target.value)})} className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white" placeholder="Valor R$" />
                      <CustomDropdown value={newTransaction.tipo || 'RECEITA'} onChange={val => setNewTransaction({...newTransaction, tipo: val as any})} options={[{ value: 'RECEITA', label: 'Receita' }, { value: 'DESPESA', label: 'Despesa' }]} />
                      <button onClick={handleAddTransaction} className="bg-blue-600 text-white rounded-lg text-xs font-bold">Lançar</button>
                    </div>
                    <div className="space-y-2">
                       {editingCase.financeiro?.transacoes.map((t, idx) => (
                         <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                               <div className={`p-2 rounded-lg ${t.tipo === 'RECEITA' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{t.tipo === 'RECEITA' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}</div>
                               <div><p className="text-sm font-semibold text-slate-200">{t.descricao}</p><p className="text-[10px] text-slate-500">{new Date(t.data).toLocaleDateString('pt-BR')}</p></div>
                            </div>
                            <span className={`font-mono font-bold ${t.tipo === 'RECEITA' ? 'text-emerald-500' : 'text-red-500'}`}>R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              )}

              {activeModalTab === 'historico' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Descrição do Andamento</label>
                        <textarea value={newAndamento.descricao} onChange={e => setNewAndamento({...newAndamento, descricao: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white h-24 resize-none" placeholder="O que aconteceu no processo hoje?" />
                     </div>
                     <div className="flex justify-between items-center">
                        <CustomDatePicker value={newAndamento.data || ''} onChange={val => setNewAndamento({...newAndamento, data: val})} />
                        <button onClick={handleAddAndamento} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-xs font-bold">Registrar Andamento</button>
                     </div>
                  </div>
                  <div className="relative pl-8 space-y-6 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
                    {editingCase.historicoAndamentos?.map((h, idx) => (
                      <div key={idx} className="relative">
                         <div className="absolute -left-[23px] top-1.5 w-4 h-4 rounded-full bg-slate-950 border-2 border-blue-600 z-10"></div>
                         <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block mb-1">{new Date(h.data).toLocaleDateString('pt-BR')}</span>
                            <p className="text-sm text-slate-200 leading-relaxed">{h.descricao}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-950">
              <button onClick={() => setIsCaseModalOpen(false)} className="px-6 py-2.5 text-slate-400 hover:text-white font-medium">Cancelar</button>
              <button onClick={handleSave} className="bg-blue-600 px-8 py-2.5 rounded-xl text-white font-bold shadow-lg shadow-blue-900/40 hover:bg-blue-700 transition-all flex items-center gap-2"><Check size={18} /> Salvar Processo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
