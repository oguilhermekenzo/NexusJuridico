import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, User, Building2, MapPin, Mail, Phone, Edit2, Trash2, LayoutGrid, List, ChevronLeft, ChevronRight, X, ChevronDown, Check, CreditCard, Users, Briefcase, CheckCircle2, Filter, Circle } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Cliente, ContatoAssociado } from '../types';

// --- COMPONENTS HELPER: CUSTOM DROPDOWN ---
interface CustomDropdownProps {
  label?: string; // Made optional
  value: string;
  options: { value: string; label: string; icon?: React.ReactNode; colorClass?: string }[];
  onChange: (value: string) => void;
  compact?: boolean; // New prop for filter bar sizing
  className?: string;
  error?: string; // Validation
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ label, value, options, onChange, compact = false, className = '', error }) => {
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
          <span className={`font-medium truncate ${compact ? 'text-xs md:text-sm' : 'text-sm'}`}>{selectedOption?.label}</span>
        </div>
        <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
      </button>
      {error && <p className="text-red-500 text-xs mt-1 ml-1 font-medium animate-fade-in">{error}</p>}

      {isOpen && (
        <div className="absolute z-50 w-full min-w-[180px] mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden animate-fade-in-down ring-1 ring-black/50 right-0">
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
  label: string;
  icon: React.ElementType;
  rightElement?: React.ReactNode;
  error?: string; // Validation Error
}

const InputWithIcon: React.FC<InputWithIconProps> = ({ label, icon: Icon, rightElement, className, error, ...props }) => (
  <div>
    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">{label} {props.required && <span className="text-red-500">*</span>}</label>
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

export const Clients: React.FC = () => {
  const { clients, cases, addClient, updateClient, deleteClient } = useData();
  
  // View State
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'PF' | 'PJ'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Ativo' | 'Inativo'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<Cliente>>({});
  const [errors, setErrors] = useState<Record<string, string>>({}); // Errors state
  
  // Contact Expanded State for PJ
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null);

  // Logic
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.documento.includes(searchTerm) ||
                          c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || c.tipo === filterType;
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstItem, indexOfLastItem);

  const handleOpenModal = (client?: Cliente) => {
    setExpandedContactId(null);
    setErrors({});
    if (client) {
      setEditingClient(client);
    } else {
      setEditingClient({
        tipo: 'PF', // Default start as PF
        status: 'Ativo',
        nome: '',
        documento: '',
        email: '',
        telefone: '',
        cidade: '',
        contatos: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!editingClient.nome?.trim()) newErrors.nome = 'Nome é obrigatório.';
    if (!editingClient.documento?.trim()) newErrors.documento = 'CPF/CNPJ é obrigatório.';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (editingClient.id) {
      updateClient(editingClient as Cliente);
    } else {
      addClient({
        ...editingClient,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      } as Cliente);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    const associatedCases = cases.filter(c => c.clienteId === id);
    let confirmationMessage = "Tem certeza que deseja excluir este cliente?";

    if (associatedCases.length > 0) {
      confirmationMessage = `ALERTA: Este cliente possui ${associatedCases.length} processo(s) associado(s). Excluir o cliente NÃO excluirá os processos. Deseja continuar?`;
    }

    if(confirm(confirmationMessage)) {
      deleteClient(id);
    }
  };

  const formatCPFCNPJ = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length <= 11) {
      return v.replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      return v.replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 18);
    }
  };

  const formatPhone = (value: string) => {
    let v = value.replace(/\D/g, '');
    v = v.slice(0, 11);
    if (v.length > 10) return v.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    if (v.length > 5) return v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    if (v.length > 2) return v.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
    return v.replace(/^(\d*)/, '($1');
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    // Auto-detect type based on length (12 digits starts CNPJ)
    const newType = rawValue.length > 11 ? 'PJ' : 'PF';
    
    setEditingClient({ 
      ...editingClient, 
      documento: formatCPFCNPJ(e.target.value),
      tipo: newType 
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingClient({ ...editingClient, telefone: formatPhone(e.target.value) });
  };

  // Contacts Logic
  const handleAddContact = () => {
    // Generate a more robust ID to avoid collisions
    const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newContact: ContatoAssociado = {
      id: newId,
      nome: '',
      cargo: '',
      email: '',
      telefone: ''
    };
    setEditingClient(prev => ({
      ...prev,
      contatos: [...(prev.contatos || []), newContact]
    }));
    setExpandedContactId(newId); // Auto-expand new contact
  };

  const handleRemoveContact = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Remover este contato?")) {
      if (expandedContactId === id) setExpandedContactId(null);
      setEditingClient(prev => ({
        ...prev,
        contatos: prev.contatos?.filter(c => c.id !== id)
      }));
    }
  };

  const handleContactChange = (id: string, field: keyof ContatoAssociado, value: string) => {
    setEditingClient(prev => ({
      ...prev,
      contatos: prev.contatos?.map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  // Stats
  const totalActive = clients.filter(c => c.status === 'Ativo').length;
  const totalPF = clients.filter(c => c.tipo === 'PF').length;
  const totalPJ = clients.filter(c => c.tipo === 'PJ').length;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Gestão de Clientes</h1>
          <p className="text-slate-500 text-sm">Base de dados unificada</p>
        </div>
        <div className="flex gap-2">
            <div className="hidden md:flex bg-slate-900 border border-slate-800 rounded-lg p-1">
                <button 
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded ${viewMode === 'table' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                  title="Visualização em Lista"
                  type="button"
                >
                    <List size={20} />
                </button>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                  title="Visualização em Grade"
                  type="button"
                >
                    <LayoutGrid size={20} />
                </button>
            </div>
            <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-blue-900/30"
            type="button"
            >
            <Plus size={18} />
            Novo Cliente
            </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
            <span className="text-slate-500 text-xs font-semibold uppercase">Total de Clientes</span>
            <p className="text-2xl font-bold text-slate-100">{clients.length}</p>
         </div>
         <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
            <span className="text-green-500 text-xs font-semibold uppercase">Ativos</span>
            <p className="text-2xl font-bold text-slate-100">{totalActive}</p>
         </div>
         <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
            <span className="text-blue-500 text-xs font-semibold uppercase">Pessoa Física</span>
            <p className="text-2xl font-bold text-slate-100">{totalPF}</p>
         </div>
         <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
            <span className="text-indigo-500 text-xs font-semibold uppercase">Pessoa Jurídica</span>
            <p className="text-2xl font-bold text-slate-100">{totalPJ}</p>
         </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="Buscar por nome, CPF/CNPJ ou email..."
            className="w-full bg-slate-950 pl-10 pr-4 py-2.5 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-200 placeholder-slate-600"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="min-w-[180px]">
              <CustomDropdown 
                compact
                value={filterType}
                onChange={(val) => { setFilterType(val as any); setCurrentPage(1); }}
                options={[
                  { value: 'all', label: 'Todos os Tipos', icon: <Users size={16} /> },
                  { value: 'PF', label: 'Pessoa Física', icon: <User size={16} /> },
                  { value: 'PJ', label: 'Pessoa Jurídica', icon: <Building2 size={16} /> }
                ]}
              />
            </div>
            <div className="min-w-[180px]">
              <CustomDropdown 
                compact
                value={filterStatus}
                onChange={(val) => { setFilterStatus(val as any); setCurrentPage(1); }}
                options={[
                  { value: 'all', label: 'Todos Status', icon: <Filter size={16} /> },
                  { value: 'Ativo', label: 'Ativos', icon: <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div> },
                  { value: 'Inativo', label: 'Inativos', icon: <div className="w-2.5 h-2.5 rounded-full bg-slate-500"></div> }
                ]}
              />
            </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {filteredClients.length === 0 ? (
           <div className="text-center py-20 bg-slate-900 rounded-xl border border-dashed border-slate-800">
             <div className="mx-auto w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-500">
               <User size={32} />
             </div>
             <h3 className="text-lg font-medium text-slate-300">Nenhum cliente encontrado</h3>
             <p className="text-slate-500">Tente ajustar os filtros de busca.</p>
           </div>
        ) : (
            <>
                {viewMode === 'table' ? (
                    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-950 border-b border-slate-800 text-xs uppercase text-slate-500 font-semibold">
                                        <th className="p-4">Cliente</th>
                                        <th className="p-4">Documento</th>
                                        <th className="p-4">Contato</th>
                                        <th className="p-4">Cidade</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {currentClients.map((client) => (
                                        <tr key={client.id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs
                                                        ${client.tipo === 'PJ' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                                                        {client.tipo === 'PJ' ? <Building2 size={14} /> : <User size={14} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-200 text-sm">{client.nome}</p>
                                                        <span className="text-xs text-slate-500">{client.tipo}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-slate-400 font-mono">{client.documento}</td>
                                            <td className="p-4">
                                                <div className="text-sm text-slate-400 flex flex-col">
                                                    <span className="flex items-center gap-1"><Mail size={12}/> {client.email}</span>
                                                    <span className="flex items-center gap-1 text-slate-500"><Phone size={12}/> {client.telefone}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-slate-400">{client.cidade}</td>
                                            <td className="p-4">
                                                <span className={`text-xs px-2 py-1 rounded font-medium border ${
                                                    client.status === 'Ativo' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                                                }`}>
                                                    {client.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button type="button" onClick={() => handleOpenModal(client)} className="p-1.5 text-slate-500 hover:text-blue-400 rounded hover:bg-slate-800 transition-colors">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button type="button" onClick={(e) => handleDelete(e, client.id)} className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentClients.map(client => (
                            <div key={client.id} className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white
                                    ${client.tipo === 'PJ' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                                    {client.tipo === 'PJ' ? <Building2 size={20} /> : <User size={20} />}
                                    </div>
                                    <div>
                                    <h3 className="font-bold text-slate-200">{client.nome}</h3>
                                    <p className="text-xs text-slate-500 font-mono">{client.documento}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button type="button" onClick={() => handleOpenModal(client)} className="p-1.5 text-slate-500 hover:text-blue-400 rounded hover:bg-slate-800">
                                        <Edit2 size={16} />
                                    </button>
                                    <button type="button" onClick={(e) => handleDelete(e, client.id)} className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                </div>

                                <div className="space-y-2.5">
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Mail size={14} className="text-slate-600" />
                                    <span className="truncate">{client.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Phone size={14} className="text-slate-600" />
                                    <span>{client.telefone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <MapPin size={14} className="text-slate-600" />
                                    <span>{client.cidade}</span>
                                </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                                <span className={`text-xs px-2 py-1 rounded font-medium border ${
                                    client.status === 'Ativo' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}>
                                    {client.status}
                                </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-6 bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <p className="text-sm text-slate-500">
                        Mostrando <span className="font-bold text-slate-300">{indexOfFirstItem + 1}</span> a <span className="font-bold text-slate-300">{Math.min(indexOfLastItem, filteredClients.length)}</span> de <span className="font-bold text-slate-300">{filteredClients.length}</span> resultados
                    </p>
                    <div className="flex gap-2">
                        <button 
                            type="button"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-slate-700 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="px-4 py-2 text-sm font-medium text-slate-400">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button 
                            type="button"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-slate-700 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </>
        )}
      </div>

      {/* Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl animate-scale-in border border-slate-800 max-h-[90vh] overflow-y-auto">
             <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
               <h2 className="text-xl font-bold text-white">{editingClient.id ? 'Editar Cliente' : 'Novo Cliente'}</h2>
               <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
             </div>
             
             <div className="p-6 space-y-5">
                {/* Row 1: Nome Completo (Largura Total) */}
                <InputWithIcon 
                  label="Nome Completo / Razão Social"
                  icon={User}
                  placeholder="Ex: João da Silva ou Empresa LTDA"
                  value={editingClient.nome}
                  onChange={e => setEditingClient({...editingClient, nome: e.target.value})}
                  required
                  error={errors.nome}
                />

                {/* Row 2: CPF/CNPJ (Com detecção) e Status */}
                <div className="grid grid-cols-2 gap-5">
                    <InputWithIcon 
                      label="CPF / CNPJ"
                      icon={CreditCard}
                      placeholder="000.000.000-00"
                      value={editingClient.documento}
                      onChange={handleDocumentChange}
                      maxLength={18}
                      className="font-mono tracking-wide"
                      required
                      error={errors.documento}
                    />
                    <CustomDropdown 
                      label="Status"
                      value={editingClient.status || 'Ativo'}
                      onChange={(val) => setEditingClient({...editingClient, status: val as any})}
                      options={[
                        { value: 'Ativo', label: 'Ativo', icon: <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> },
                        { value: 'Inativo', label: 'Inativo', icon: <div className="w-2.5 h-2.5 rounded-full bg-slate-500"></div> }
                      ]}
                    />
                </div>

                {/* Row 3: Email (Full Width) */}
                <InputWithIcon 
                  label="Email"
                  icon={Mail}
                  type="email"
                  placeholder="cliente@email.com"
                  value={editingClient.email}
                  onChange={e => setEditingClient({...editingClient, email: e.target.value})}
                />

                {/* Row 4: Telefone & Cidade */}
                <div className="grid grid-cols-2 gap-5">
                  <InputWithIcon 
                      label="Telefone"
                      icon={Phone}
                      placeholder="(00) 0000-0000"
                      value={editingClient.telefone}
                      onChange={handlePhoneChange}
                      maxLength={15}
                    />
                   <InputWithIcon 
                    label="Cidade / Estado"
                    icon={MapPin}
                    placeholder="Ex: São Paulo - SP"
                    value={editingClient.cidade}
                    onChange={e => setEditingClient({...editingClient, cidade: e.target.value})}
                   />
                </div>

                {/* Section for PJ Contacts */}
                {editingClient.tipo === 'PJ' && (
                  <div className="border-t border-slate-800 pt-5 mt-2 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-slate-300 uppercase flex items-center gap-2">
                        <Users size={16} className="text-blue-500"/> Representantes / Contatos
                      </h3>
                      <button 
                        type="button"
                        onClick={handleAddContact}
                        className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1"
                      >
                        <Plus size={12}/> Adicionar Contato
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(!editingClient.contatos || editingClient.contatos.length === 0) && (
                        <div className="text-center py-6 bg-slate-950/50 rounded-lg border border-dashed border-slate-800 text-slate-600 text-sm italic">
                          Nenhum contato associado a esta empresa.
                        </div>
                      )}
                      
                      {editingClient.contatos?.map((contact) => (
                        <div key={contact.id}>
                          {expandedContactId === contact.id ? (
                            <div className="bg-slate-950 p-4 rounded-xl border border-blue-600/30 shadow-lg shadow-blue-900/10 relative animate-fade-in ring-1 ring-blue-500/20">
                                <div className="flex justify-between items-center mb-4">
                                     <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wide">Editando Contato</h4>
                                     <button 
                                       type="button"
                                       onClick={(e) => handleRemoveContact(e, contact.id)}
                                       className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                     >
                                       <Trash2 size={14}/>
                                     </button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                   <div className="col-span-2 md:col-span-1">
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome</label>
                                      <div className="relative">
                                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"/>
                                        <input 
                                          type="text"
                                          className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-2 text-sm text-slate-300 focus:ring-1 focus:ring-blue-500 outline-none"
                                          placeholder="Nome do contato"
                                          value={contact.nome}
                                          onChange={e => handleContactChange(contact.id, 'nome', e.target.value)}
                                          autoFocus
                                        />
                                      </div>
                                   </div>
                                   <div className="col-span-2 md:col-span-1">
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cargo</label>
                                      <div className="relative">
                                        <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"/>
                                        <input 
                                          type="text"
                                          className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-2 text-sm text-slate-300 focus:ring-1 focus:ring-blue-500 outline-none"
                                          placeholder="Ex: Sócio, Gerente"
                                          value={contact.cargo}
                                          onChange={e => handleContactChange(contact.id, 'cargo', e.target.value)}
                                        />
                                      </div>
                                   </div>
                                   <div className="col-span-2 md:col-span-1">
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email</label>
                                      <div className="relative">
                                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"/>
                                        <input 
                                          type="text"
                                          className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-2 text-sm text-slate-300 focus:ring-1 focus:ring-blue-500 outline-none"
                                          placeholder="email@empresa.com"
                                          value={contact.email}
                                          onChange={e => handleContactChange(contact.id, 'email', e.target.value)}
                                        />
                                      </div>
                                   </div>
                                   <div className="col-span-2 md:col-span-1">
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Telefone</label>
                                      <div className="relative">
                                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"/>
                                        <input 
                                          type="text"
                                          className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-2 text-sm text-slate-300 focus:ring-1 focus:ring-blue-500 outline-none"
                                          placeholder="(00) 0000-0000"
                                          value={contact.telefone}
                                          onChange={e => handleContactChange(contact.id, 'telefone', formatPhone(e.target.value))}
                                        />
                                      </div>
                                   </div>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <button 
                                        type="button"
                                        onClick={() => setExpandedContactId(null)}
                                        className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-1"
                                    >
                                        <CheckCircle2 size={14} /> Concluir
                                    </button>
                                </div>
                            </div>
                          ) : (
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center group hover:border-slate-700 transition-all">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                        <User size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-200 text-sm truncate">{contact.nome || <span className="text-slate-600 italic">Novo Contato</span>}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
                                             <span className="flex items-center gap-1"><Briefcase size={10} /> {contact.cargo || 'Cargo não inf.'}</span>
                                             <span className="hidden sm:inline">•</span>
                                             <span className="flex items-center gap-1 truncate"><Mail size={10} /> {contact.email || 'Email não inf.'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <button 
                                      type="button"
                                      onClick={() => setExpandedContactId(contact.id)}
                                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-900 rounded-lg transition-colors"
                                      title="Editar"
                                    >
                                      <Edit2 size={16}/>
                                    </button>
                                </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                 
             </div>
             <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 rounded-b-2xl sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg font-medium transition-colors">Cancelar</button>
                <button type="button" onClick={handleSave} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 font-medium transition-all">Salvar Cliente</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};