
import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, User, Building2, MapPin, Mail, Phone, Edit2, Trash2, LayoutGrid, List, ChevronLeft, ChevronRight, X, ChevronDown, Check, CreditCard, Users, Briefcase, CheckCircle2, Filter, Circle, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Cliente, ContatoAssociado } from '../types';

// --- COMPONENTS HELPER: CUSTOM DROPDOWN ---
interface CustomDropdownProps {
  label?: string;
  value: string;
  options: { value: string; label: string; icon?: React.ReactNode; colorClass?: string }[];
  onChange: (value: string) => void;
  compact?: boolean;
  className?: string;
  error?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ label, value, options, onChange, compact = false, className = '', error }) => {
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
          <span className={`font-medium truncate ${compact ? 'text-xs md:text-sm' : 'text-sm'}`}>{selectedOption?.label}</span>
        </div>
        <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {error && <p className="text-red-500 text-xs mt-1 ml-1 font-medium animate-fade-in">{error}</p>}

      {isOpen && (
        <div className="absolute z-50 w-full min-w-[180px] mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden animate-fade-in-down ring-1 ring-black/50 right-0">
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
  label: string;
  icon: React.ElementType;
  error?: string;
}

const InputWithIcon: React.FC<InputWithIconProps> = ({ label, icon: Icon, className, error, ...props }) => (
  <div>
    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">{label} {props.required && <span className="text-red-500">*</span>}</label>
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
    {error && <p className="text-red-500 text-xs mt-1 ml-1 font-medium animate-fade-in">{error}</p>}
  </div>
);

interface ClientsProps {
  showNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const Clients: React.FC<ClientsProps> = ({ showNotify }) => {
  const { clients, cases, addClient, updateClient, deleteClient } = useData();
  
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'PF' | 'PJ'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<Cliente>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{ isOpen: boolean; clientId: string | null; isProhibited: boolean }>({ isOpen: false, clientId: null, isProhibited: false });
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null);

  // ESC Support
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setConfirmDeleteModal({ isOpen: false, clientId: null, isProhibited: false });
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || c.documento.includes(searchTerm);
    const matchesType = filterType === 'all' || c.tipo === filterType;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstItem, indexOfLastItem);

  const handleOpenModal = (client?: Cliente) => {
    setErrors({});
    setExpandedContactId(null);
    if (client) setEditingClient(client);
    else setEditingClient({ tipo: 'PF', status: 'Ativo', nome: '', documento: '', email: '', telefone: '', cidade: '', contatos: [] });
    setIsModalOpen(true);
  };

  const handleInitiateDelete = (e: React.MouseEvent, clientId: string) => {
    e.preventDefault(); e.stopPropagation();
    const hasProcesses = cases.some(c => c.clienteId === clientId);
    setConfirmDeleteModal({ isOpen: true, clientId, isProhibited: hasProcesses });
  };

  const executeDelete = async () => {
    if (confirmDeleteModal.clientId) {
      try {
        await deleteClient(confirmDeleteModal.clientId);
        setConfirmDeleteModal({ isOpen: false, clientId: null, isProhibited: false });
        showNotify("Cliente excluído com sucesso!", "info");
      } catch (e) {
        showNotify("Erro ao excluir cliente.", "error");
      }
    }
  };

  const formatCPFCNPJ = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length <= 11) return v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return v.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 18);
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const newType = rawValue.length > 11 ? 'PJ' : 'PF';
    setEditingClient({ ...editingClient, documento: formatCPFCNPJ(e.target.value), tipo: newType });
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!editingClient.nome?.trim()) newErrors.nome = 'Nome é obrigatório.';
    if (!editingClient.documento?.trim()) newErrors.documento = 'Documento é obrigatório.';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    
    try {
      if (editingClient.id && !editingClient.id.toString().includes('.')) {
        await updateClient(editingClient as Cliente);
        showNotify("Cliente atualizado!");
      } else {
        await addClient({ ...editingClient });
        showNotify("Cliente cadastrado com sucesso!");
      }
      setIsModalOpen(false);
    } catch (e: any) {
      showNotify(`Falha ao salvar: ${e.message}`, "error");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-100">Gestão de Clientes</h1><p className="text-slate-500 text-sm">Base de dados unificada</p></div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex items-center">
            <button onClick={() => setViewMode('table')} className={`p-2 rounded ${viewMode === 'table' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}><List size={18}/></button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}><LayoutGrid size={18}/></button>
          </div>
          <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-blue-900/30"><Plus size={18} /> Novo Cliente</button>
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} /><input type="text" placeholder="Buscar por nome ou CPF/CNPJ..." className="w-full bg-slate-950 pl-10 pr-4 py-2.5 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-200" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} /></div>
        <CustomDropdown compact value={filterType} onChange={(val) => { setFilterType(val as any); setCurrentPage(1); }} options={[{ value: 'all', label: 'Todos os Tipos', icon: <Users size={16} /> }, { value: 'PF', label: 'Pessoa Física', icon: <User size={16} /> }, { value: 'PJ', label: 'Pessoa Jurídica', icon: <Building2 size={16} /> }]} />
      </div>

      {viewMode === 'table' ? (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left">
            <thead><tr className="bg-slate-950 border-b border-slate-800 text-xs uppercase text-slate-500 font-semibold"><th className="p-4">Cliente</th><th className="p-4">Documento</th><th className="p-4">Cidade</th><th className="p-4 text-right">Ações</th></tr></thead>
            <tbody className="divide-y divide-slate-800/50">
              {currentClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${client.tipo === 'PJ' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>{client.tipo === 'PJ' ? <Building2 size={14} /> : <User size={14} />}</div><div><p className="font-semibold text-slate-200 text-sm">{client.nome}</p></div></div></td>
                  <td className="p-4 text-sm text-slate-400 font-mono">{client.documento}</td>
                  <td className="p-4 text-sm text-slate-400">{client.cidade}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(client)} className="p-1.5 text-slate-500 hover:text-blue-400 rounded hover:bg-slate-800 transition-colors"><Edit2 size={16} /></button>
                      <button onClick={(e) => handleInitiateDelete(e, client.id)} className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 animate-fade-in">
          {currentClients.map((client) => (
            <div key={client.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm hover:border-slate-700 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${client.tipo === 'PJ' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20'}`}>
                  {client.tipo === 'PJ' ? <Building2 size={24}/> : <User size={24}/>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleOpenModal(client)} className="p-2 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"><Edit2 size={16}/></button>
                  <button onClick={(e) => handleInitiateDelete(e, client.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"><Trash2 size={16}/></button>
                </div>
              </div>
              <h3 className="font-bold text-slate-100 text-lg mb-1 truncate">{client.nome}</h3>
              <p className="text-sm font-mono text-slate-500 mb-4">{client.documento}</p>
              <div className="space-y-2 mb-4">
                 <div className="flex items-center gap-2 text-xs text-slate-400"><Mail size={14} className="text-slate-600"/> {client.email || 'Não informado'}</div>
                 <div className="flex items-center gap-2 text-xs text-slate-400"><Phone size={14} className="text-slate-600"/> {client.telefone || 'Não informado'}</div>
                 <div className="flex items-center gap-2 text-xs text-slate-400"><MapPin size={14} className="text-slate-600"/> {client.cidade || 'Não informado'}</div>
              </div>
              <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                 <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${client.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>{client.status}</span>
                 <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">{client.tipo}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 bg-slate-900 p-4 rounded-xl border border-slate-800">
           <p className="text-sm text-slate-500">Página {currentPage} de {totalPages}</p>
           <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-2 border border-slate-700 rounded-lg text-slate-400 disabled:opacity-30 hover:bg-slate-800"><ChevronLeft size={18}/></button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-2 border border-slate-700 rounded-lg text-slate-400 disabled:opacity-30 hover:bg-slate-800"><ChevronRight size={18}/></button>
           </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDeleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4" onClick={() => setConfirmDeleteModal({ isOpen: false, clientId: null, isProhibited: false })}>
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md p-8 animate-scale-in text-center" onClick={e => e.stopPropagation()}>
            <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${confirmDeleteModal.isProhibited ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
               {confirmDeleteModal.isProhibited ? <ShieldAlert size={44} /> : <AlertTriangle size={44} />}
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">{confirmDeleteModal.isProhibited ? "Ação Bloqueada" : "Confirmar Exclusão"}</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              {confirmDeleteModal.isProhibited 
                ? "Este cliente possui processos ativos. Encerre ou transfira os processos antes de excluí-lo." 
                : "Tem certeza que deseja excluir este cliente? Esta ação removerá permanentemente o cadastro."}
            </p>
            <div className="flex flex-col gap-3">
              {!confirmDeleteModal.isProhibited ? (
                <>
                  <button onClick={executeDelete} className="w-full py-3.5 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-900/40 transition-all">SIM, EXCLUIR CLIENTE</button>
                  <button onClick={() => setConfirmDeleteModal({ isOpen: false, clientId: null, isProhibited: false })} className="w-full py-3.5 bg-slate-800 text-slate-300 font-bold rounded-xl">CANCELAR (ESC)</button>
                </>
              ) : (
                <button onClick={() => setConfirmDeleteModal({ isOpen: false, clientId: null, isProhibited: false })} className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl">ENTENDI (ESC)</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl animate-scale-in border border-slate-800 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
             <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
               <h2 className="text-xl font-bold text-white">{editingClient.id && !editingClient.id.toString().includes('.') ? 'Editar Cliente' : 'Novo Cliente'}</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
             </div>
             <div className="p-6 space-y-5">
                <InputWithIcon label="Nome / Razão Social" icon={User} placeholder="Ex: João Silva" value={editingClient.nome} onChange={e => setEditingClient({...editingClient, nome: e.target.value})} required error={errors.nome} />
                <div className="grid grid-cols-2 gap-5">
                    <InputWithIcon label="CPF / CNPJ" icon={CreditCard} placeholder="000.000.000-00" value={editingClient.documento} onChange={handleDocumentChange} required error={errors.documento} />
                    <CustomDropdown label="Status" value={editingClient.status || 'Ativo'} onChange={(val) => setEditingClient({...editingClient, status: val as any})} options={[{ value: 'Ativo', label: 'Ativo', icon: <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> }, { value: 'Inativo', label: 'Inativo', icon: <div className="w-2.5 h-2.5 rounded-full bg-slate-500"></div> }]} />
                </div>
                <InputWithIcon label="Email" icon={Mail} type="email" placeholder="cliente@email.com" value={editingClient.email} onChange={e => setEditingClient({...editingClient, email: e.target.value})} />
                <div className="grid grid-cols-2 gap-5">
                  <InputWithIcon label="Telefone" icon={Phone} placeholder="(00) 00000-0000" value={editingClient.telefone} onChange={e => setEditingClient({...editingClient, telefone: e.target.value})} />
                  <InputWithIcon label="Cidade / Estado" icon={MapPin} placeholder="São Paulo - SP" value={editingClient.cidade} onChange={e => setEditingClient({...editingClient, cidade: e.target.value})} />
                </div>
                {editingClient.tipo === 'PJ' && (
                  <div className="border-t border-slate-800 pt-5 mt-2">
                    <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold text-slate-300 uppercase flex items-center gap-2"><Users size={16} className="text-blue-500"/> Contatos</h3><button onClick={() => { const id = Date.now().toString(); setEditingClient(p => ({...p, contatos: [...(p.contatos||[]), {id, nome: '', cargo: '', email: '', telefone: ''}]})); setExpandedContactId(id); }} className="text-xs bg-slate-800 px-2 py-1 rounded hover:bg-slate-700 transition-colors">+ Adicionar</button></div>
                    <div className="space-y-3">
                      {(editingClient.contatos || []).map(contact => (
                        <div key={contact.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center group">
                            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-500"><User size={14}/></div><p className="font-bold text-slate-200 text-sm truncate max-w-[150px]">{contact.nome || "Novo Contato"}</p></div>
                            <button onClick={() => setExpandedContactId(contact.id)} className="text-slate-500 hover:text-blue-400"><Edit2 size={14}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
             </div>
             <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 rounded-b-2xl">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-400 hover:text-white transition-colors font-medium">Cancelar (ESC)</button>
                <button onClick={handleSave} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all shadow-lg shadow-blue-500/30">Salvar Cliente</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
