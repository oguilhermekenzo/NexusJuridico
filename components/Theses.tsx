import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, BookOpen, Edit2, Trash2, X, Sparkles, Send, Bot, MessageSquare, Loader2, ChevronDown, Check, FolderOpen, AlignLeft, Filter, FileText, Calendar } from 'lucide-react';
import { Tese, AreaDireito } from '../types';
import { askThesisAI, generateThesisContent } from '../services/geminiService';
import { useData } from '../contexts/DataContext';

// --- SHARED UI COMPONENTS (Adapted for local use) ---
interface CustomDropdownProps {
  label?: string;
  value: string;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  onChange: (value: string) => void;
  compact?: boolean;
  className?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ label, value, options, onChange, compact = false, className = '' }) => {
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
        className={`w-full flex items-center justify-between bg-slate-950 text-slate-200 border border-slate-800 rounded-xl transition-all ${isOpen ? 'ring-2 ring-blue-600' : 'hover:border-slate-700'} ${compact ? 'py-2.5 px-3' : 'p-3.5'}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {selectedOption?.icon}
          <span className="font-medium truncate">{selectedOption?.label}</span>
        </div>
        <ChevronDown size={16} className={`text-slate-500 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden animate-fade-in-down">
          {options.map(option => (
            <button key={option.value} type="button" onClick={() => { onChange(option.value); setIsOpen(false); }} className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm ${option.value === value ? 'bg-blue-600/10 text-blue-400' : 'text-slate-300 hover:bg-slate-800'}`}>
              <div className="flex items-center gap-3">{option.icon} {option.label}</div>
              {option.value === value && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: React.ElementType;
  error?: string; // Validation
}
const InputWithIcon: React.FC<InputWithIconProps> = ({ label, icon: Icon, error, ...props }) => (
  <div>
    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">{label} {props.required && <span className="text-red-500">*</span>}</label>
    <div className="relative group">
      <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${error ? 'text-red-500' : 'text-slate-500 group-focus-within:text-blue-500'}`}><Icon size={18} /></div>
      <input 
        {...props} 
        onWheel={(e) => e.currentTarget.type === 'number' && e.currentTarget.blur()}
        className={`w-full bg-slate-950 text-slate-200 border pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all placeholder:text-slate-600
        ${error ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-slate-800 focus:ring-2 focus:ring-blue-600 hover:border-slate-700'}`} 
      />
    </div>
    {error && <p className="text-red-500 text-xs mt-1 ml-1 font-medium animate-fade-in">{error}</p>}
  </div>
);

// --- MAIN COMPONENT ---
interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export const Theses: React.FC = () => {
  const { theses, addThesis, updateThesis, deleteThesis } = useData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'reader' | 'editor' | 'notebook'>('reader');
  
  const [editingTese, setEditingTese] = useState<Partial<Tese>>({ area: AreaDireito.CIVEL });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const filteredTheses = theses.filter(t => {
    const matchesSearch = t.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = selectedArea === 'all' || t.area === selectedArea;
    return matchesSearch && matchesArea;
  });

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [chatHistory, activeTab]);

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!editingTese.titulo?.trim()) newErrors.titulo = 'Título é obrigatório.';
    if (!editingTese.descricao?.trim()) newErrors.descricao = 'Resumo é obrigatório.';

    if(Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setActiveTab('editor');
      return;
    }

    if (editingTese.id) updateThesis(editingTese as Tese);
    else addThesis({ ...editingTese, id: Date.now().toString(), dataCriacao: new Date().toISOString() } as Tese);
    setIsModalOpen(false);
    setEditingTese({ area: AreaDireito.CIVEL });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta tese?')) deleteThesis(id);
  };

  const openModal = (tese?: Tese, initialTab: 'reader' | 'editor' = 'editor') => {
    setErrors({});
    if (tese) {
      setEditingTese(tese);
      setChatHistory([{ id: '1', role: 'ai', text: `Olá! Sou o Notebook AI. Estou analisando a tese "${tese.titulo}". Como posso ajudar?`, timestamp: new Date() }]);
    } else {
      setEditingTese({ area: AreaDireito.CIVEL, titulo: '', descricao: '', conteudo: '' });
      setChatHistory([]);
    }
    setActiveTab(initialTab);
    setIsModalOpen(true);
  };

  const handleGenerateContent = async () => {
    if (!editingTese.titulo || !editingTese.descricao) {
      setErrors({ titulo: !editingTese.titulo ? 'Obrigatório' : '', descricao: !editingTese.descricao ? 'Obrigatório' : '' });
      return;
    }
    setIsAiLoading(true);
    try {
      const generated = await generateThesisContent(editingTese.titulo, editingTese.descricao, editingTese.area || 'Cível');
      setEditingTese(prev => ({ ...prev, conteudo: generated }));
      setActiveTab('editor'); 
    } catch (error) {
      alert("Erro ao gerar conteúdo.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !editingTese.conteudo) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: chatInput, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsAiLoading(true);
    try {
      const apiHistory = chatHistory.map(h => ({ role: h.role, text: h.text }));
      const responseText = await askThesisAI(editingTese.conteudo, userMsg.text, apiHistory);
      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'ai', text: responseText, timestamp: new Date() };
      setChatHistory(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = { id: Date.now().toString(), role: 'ai', text: "Desculpe, tive um erro ao processar sua solicitação.", timestamp: new Date() };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Minhas Teses</h1>
          <p className="text-slate-500 text-sm">Biblioteca de conhecimento jurídico do escritório</p>
        </div>
        <button onClick={() => openModal(undefined, 'editor')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-blue-900/30">
          <Plus size={18} /> Nova Tese
        </button>
      </div>

      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input type="text" placeholder="Buscar teses por título ou assunto..." className="w-full bg-slate-950 pl-10 pr-4 py-2.5 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-200" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="min-w-[220px]">
          <CustomDropdown 
            compact
            value={selectedArea}
            onChange={(val) => setSelectedArea(val)}
            options={[
              { value: 'all', label: 'Todas as Áreas', icon: <Filter size={16} /> },
              ...Object.values(AreaDireito).map(area => ({ value: area, label: area, icon: <FolderOpen size={16} /> }))
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTheses.map(tese => (
          <div key={tese.id} className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-sm hover:border-slate-700 transition-all group flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <span className={`text-xs font-bold px-2 py-1 rounded text-white shadow-sm
                ${tese.area === AreaDireito.TRABALHISTA ? 'bg-orange-600' : 
                  tese.area === AreaDireito.TRIBUTARIO ? 'bg-green-600' : 
                  tese.area === AreaDireito.PENAL ? 'bg-red-600' : 
                  tese.area === AreaDireito.PREVIDENCIARIO ? 'bg-emerald-600' :
                  tese.area === AreaDireito.BANCARIO ? 'bg-slate-600' :
                  tese.area === AreaDireito.IMOBILIARIO ? 'bg-amber-600' :
                  'bg-blue-600'}`}>
                {tese.area}
              </span>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(tese, 'editor')} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded" title="Editar"> <Edit2 size={16} /> </button>
                <button onClick={() => handleDelete(tese.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded" title="Excluir"> <Trash2 size={16} /> </button>
              </div>
            </div>
            <h3 className="font-bold text-slate-200 text-lg mb-2 leading-tight">{tese.titulo}</h3>
            <p className="text-sm text-slate-400 line-clamp-3 mb-4 flex-1">{tese.descricao}</p>
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between mt-auto">
              <span className="text-xs text-slate-500">Criado em {new Date(tese.dataCriacao).toLocaleDateString('pt-BR')}</span>
              <button onClick={() => openModal(tese, 'reader')} className="text-sm font-medium text-blue-500 hover:text-blue-400 flex items-center gap-1 bg-blue-500/10 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors"> <BookOpen size={16} /> Ler Tese </button>
            </div>
          </div>
        ))}
        {filteredTheses.length === 0 && (
          <div className="col-span-full text-center py-12 bg-slate-900 rounded-xl border border-dashed border-slate-800">
             <BookOpen className="mx-auto h-12 w-12 text-slate-700 mb-3" />
             <p className="text-slate-500 font-medium">Nenhuma tese encontrada com estes filtros.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border border-slate-800 animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 truncate pr-4">
                <BookOpen className="text-blue-500 shrink-0" size={24} />
                <span className="truncate">{editingTese.titulo || 'Nova Tese'}</span>
              </h2>
              <div className="flex items-center gap-3">
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-200 p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-800 px-6 bg-slate-950 shrink-0">
              <button onClick={() => setActiveTab('reader')} className={`py-3 px-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'reader' ? 'border-green-500 text-green-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}><BookOpen size={16} /> Leitor</button>
              <button onClick={() => setActiveTab('editor')} className={`py-3 px-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'editor' ? 'border-blue-600 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}><Edit2 size={16} /> Editor</button>
              <button onClick={() => setActiveTab('notebook')} className={`py-3 px-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'notebook' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}><Sparkles size={16} /> Notebook AI</button>
            </div>
            
            <div className="flex-1 overflow-hidden relative">
              
              {/* --- READER MODE --- */}
              {activeTab === 'reader' && (
                 <div className="h-full overflow-y-auto p-8 bg-slate-950 custom-scrollbar">
                    <div className="max-w-3xl mx-auto space-y-8">
                       <div className="space-y-4 pb-6 border-b border-slate-800">
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-bold px-3 py-1 rounded text-white shadow-sm uppercase tracking-wide
                              ${editingTese.area === AreaDireito.TRABALHISTA ? 'bg-orange-600' : 
                                editingTese.area === AreaDireito.TRIBUTARIO ? 'bg-green-600' : 
                                editingTese.area === AreaDireito.PENAL ? 'bg-red-600' : 
                                editingTese.area === AreaDireito.PREVIDENCIARIO ? 'bg-emerald-600' :
                                editingTese.area === AreaDireito.BANCARIO ? 'bg-slate-600' :
                                editingTese.area === AreaDireito.IMOBILIARIO ? 'bg-amber-600' :
                                'bg-blue-600'}`}>
                              {editingTese.area}
                            </span>
                            {editingTese.dataCriacao && (
                              <div className="flex items-center gap-1 text-slate-500 text-xs font-mono">
                                <Calendar size={12}/> {new Date(editingTese.dataCriacao).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                          </div>
                          <h1 className="text-3xl font-bold text-slate-100 leading-tight font-serif">{editingTese.titulo}</h1>
                          <p className="text-slate-400 text-lg leading-relaxed italic border-l-4 border-slate-800 pl-4">{editingTese.descricao}</p>
                       </div>
                       
                       {editingTese.conteudo ? (
                          <div className="prose prose-invert max-w-none font-serif text-slate-300 leading-relaxed whitespace-pre-wrap text-lg">
                             {editingTese.conteudo}
                          </div>
                       ) : (
                          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                             <FileText size={48} className="mb-4 opacity-20"/>
                             <p>Esta tese ainda não possui conteúdo.</p>
                             <button onClick={() => setActiveTab('editor')} className="mt-4 text-blue-500 hover:text-blue-400 font-medium text-sm">Adicionar Conteúdo</button>
                          </div>
                       )}
                    </div>
                    {/* Floating Edit Action */}
                    <button onClick={() => setActiveTab('editor')} className="absolute bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-transform hover:scale-105 z-10" title="Editar Tese">
                       <Edit2 size={24} />
                    </button>
                 </div>
              )}

              {/* --- EDITOR MODE --- */}
              {activeTab === 'editor' && (
                <div className="h-full overflow-y-auto p-6 space-y-5 bg-slate-900 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-2">
                      <InputWithIcon label="Título" required icon={AlignLeft} placeholder="Ex: Tese de defesa para..." value={editingTese.titulo} onChange={e => setEditingTese({...editingTese, titulo: e.target.value})} error={errors.titulo} />
                    </div>
                    <CustomDropdown label="Área" value={editingTese.area || ''} onChange={(val) => setEditingTese({...editingTese, area: val as AreaDireito})} options={Object.values(AreaDireito).map(a => ({ value: a, label: a, icon: <FolderOpen size={16} /> }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Resumo / Descrição <span className="text-red-500">*</span></label>
                    <div className="relative group">
                      <MessageSquare size={18} className="absolute left-4 top-4 text-slate-500 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                      <textarea className={`w-full bg-slate-950 border pl-12 pr-4 py-3.5 rounded-xl text-sm text-slate-200 h-24 resize-none outline-none placeholder:text-slate-600 hover:border-slate-700
                      ${errors.descricao ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-slate-800 focus:ring-2 focus:ring-blue-600'}`} placeholder="Um breve resumo da tese..." value={editingTese.descricao} onChange={e => setEditingTese({...editingTese, descricao: e.target.value})} />
                    </div>
                    {errors.descricao && <p className="text-red-500 text-xs mt-1 ml-1 font-medium animate-fade-in">{errors.descricao}</p>}
                  </div>
                  <div className="flex flex-col h-[400px]">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-400 uppercase ml-1 tracking-wider">Conteúdo da Tese</label>
                      {!editingTese.conteudo && (<button onClick={handleGenerateContent} disabled={isAiLoading} className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300 font-medium disabled:opacity-50 transition-colors">{isAiLoading ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />} Gerar com IA</button>)}
                    </div>
                    <textarea className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-sm text-slate-300 font-serif leading-relaxed flex-1 resize-none focus:ring-2 focus:ring-blue-600 outline-none custom-scrollbar placeholder:text-slate-600 hover:border-slate-700" placeholder="Cole aqui o texto completo da tese..." value={editingTese.conteudo} onChange={e => setEditingTese({...editingTese, conteudo: e.target.value})} />
                  </div>
                </div>
              )}

              {/* --- NOTEBOOK AI MODE --- */}
              {activeTab === 'notebook' && (
                <div className="h-full flex flex-col bg-slate-950">
                  {!editingTese.conteudo ? (
                     <div className="flex-1 flex flex-col items-center justify-center p-8 text-center"><div className="bg-slate-900 p-6 rounded-full shadow-lg border border-slate-800 mb-4"><Sparkles size={40} className="text-purple-500" /></div><h3 className="text-lg font-bold text-slate-200 mb-2">A tese está vazia</h3><p className="text-slate-500 max-w-md mb-6">Para usar o Notebook AI, você precisa ter conteúdo na tese. Você pode escrever manualmente ou pedir para a IA criar um rascunho.</p><button onClick={handleGenerateContent} disabled={isAiLoading || !editingTese.titulo} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 shadow-lg shadow-purple-900/40 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">{isAiLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}Gerar Conteúdo Automaticamente</button></div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                         {chatHistory.map(msg => (<div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl p-4 shadow-md ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-900 text-slate-300 border border-slate-800 rounded-bl-none'}`}>{msg.role === 'ai' && (<div className="flex items-center gap-2 mb-2 text-xs font-bold text-purple-400 uppercase tracking-wide"><Sparkles size={12} /> Notebook AI</div>)}<p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p></div></div>))}
                         {isAiLoading && (<div className="flex justify-start"><div className="bg-slate-900 p-4 rounded-2xl rounded-bl-none border border-slate-800 shadow-md flex items-center gap-2"><Loader2 className="animate-spin text-purple-500" size={16} /><span className="text-sm text-slate-500">Analisando tese...</span></div></div>)}
                         <div ref={chatEndRef} />
                      </div>
                      <div className="p-4 bg-slate-900 border-t border-slate-800">
                        <div className="relative flex items-center">
                          <input type="text" className="w-full bg-slate-950 border border-slate-800 p-4 pr-14 rounded-xl text-sm text-slate-200 focus:ring-2 focus:ring-purple-600 outline-none transition-all shadow-inner" placeholder="Faça uma pergunta sobre esta tese..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} disabled={isAiLoading} />
                          <button onClick={handleSendMessage} disabled={!chatInput.trim() || isAiLoading} className="absolute right-2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:bg-slate-700 transition-colors"><Send size={18} /></button>
                        </div>
                        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                           {['Resuma esta tese', 'Quais os pontos fracos?', 'Melhore a conclusão', 'Cite jurisprudência relacionada'].map(suggestion => (<button key={suggestion} onClick={() => setChatInput(suggestion)} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-3 py-1.5 rounded-full whitespace-nowrap transition-colors border border-slate-700">{suggestion}</button>))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Modal Footer (Hidden in Reader/Notebook Mode to reduce clutter) */}
            {activeTab === 'editor' && (
              <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 shrink-0 rounded-b-2xl">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg font-medium transition-colors">Cancelar</button>
                <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 font-medium transition-all">Salvar Tese</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};