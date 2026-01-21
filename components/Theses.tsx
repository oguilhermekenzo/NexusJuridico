
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, BookOpen, Edit2, Trash2, X, Sparkles, Send, Bot, MessageSquare, Loader2, ChevronDown, Check, FolderOpen, AlignLeft, Filter, FileText, Calendar, AlertTriangle } from 'lucide-react';
import { Tese, AreaDireito } from '../types';
import { askThesisAI, generateThesisContent } from '../services/geminiService';
import { useData } from '../contexts/DataContext';

interface ThesesProps {
  showNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const Theses: React.FC<ThesesProps> = ({ showNotify }) => {
  const { theses, addThesis, updateThesis, deleteThesis } = useData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'reader' | 'editor' | 'notebook'>('reader');
  
  const [editingTese, setEditingTese] = useState<Partial<Tese>>({ area: AreaDireito.CIVEL, titulo: '', descricao: '', conteudo: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Confirmation Modal State
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{ isOpen: boolean; thesisId: string | null }>({ isOpen: false, thesisId: null });

  // ESC Support
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
        setConfirmDeleteModal({ isOpen: false, thesisId: null });
      }
    };
    if (isModalOpen || confirmDeleteModal.isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isModalOpen, confirmDeleteModal.isOpen]);

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const filteredTheses = theses.filter(t => {
    const matchesSearch = t.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = selectedArea === 'all' || t.area === selectedArea;
    return matchesSearch && matchesArea;
  });

  const handleInitiateDelete = (id: string) => {
    setConfirmDeleteModal({ isOpen: true, thesisId: id });
  };

  const executeDelete = async () => {
    if (confirmDeleteModal.thesisId) {
      try {
        await deleteThesis(confirmDeleteModal.thesisId);
        setConfirmDeleteModal({ isOpen: false, thesisId: null });
        showNotify("Tese removida!", "info");
      } catch (e) {
        showNotify("Erro ao remover tese.", "error");
      }
    }
  };

  const handleSaveTese = async () => {
    const newErrors: Record<string, string> = {};
    if (!editingTese.titulo?.trim()) newErrors.titulo = 'Título é obrigatório';
    if (!editingTese.conteudo?.trim()) newErrors.conteudo = 'Conteúdo é obrigatório';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setActiveTab('editor');
      return;
    }

    try {
      if (editingTese.id && !editingTese.id.toString().startsWith('demo-')) {
        await updateThesis(editingTese as Tese);
        showNotify("Tese atualizada com sucesso!");
      } else {
        await addThesis({
          ...editingTese,
          id: Date.now().toString(),
          dataCriacao: new Date().toISOString()
        } as Tese);
        showNotify("Nova tese cadastrada!");
      }
      setIsModalOpen(false);
    } catch (e) {
      showNotify("Erro ao salvar tese.", "error");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Minhas Teses</h1>
          <p className="text-slate-500 text-sm">Biblioteca de conhecimento jurídico</p>
        </div>
        <button onClick={() => { setEditingTese({ area: AreaDireito.CIVEL, titulo: '', descricao: '', conteudo: '' }); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-blue-900/30">
          <Plus size={18} /> Nova Tese
        </button>
      </div>

      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center mb-6">
        <div className="relative flex-1 w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} /><input type="text" placeholder="Buscar teses..." className="w-full bg-slate-950 pl-10 pr-4 py-2.5 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-200 placeholder-slate-600" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTheses.map(tese => (
          <div key={tese.id} className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-sm hover:border-slate-700 transition-all flex flex-col group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold px-2 py-1 rounded bg-blue-600/20 text-blue-400 border border-blue-500/20">{tese.area}</span>
              <div className="flex gap-2">
                <button onClick={() => { setEditingTese(tese); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors"><Edit2 size={16} /></button>
                <button onClick={() => handleInitiateDelete(tese.id)} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
            <h3 className="font-bold text-slate-200 text-lg mb-2 line-clamp-2">{tese.titulo}</h3>
            <p className="text-sm text-slate-400 line-clamp-3 mb-4 flex-1">{tese.descricao}</p>
            <div className="mt-auto pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-mono">
               <span>CRIADA EM: {new Date(tese.dataCriacao).toLocaleDateString('pt-BR')}</span>
               <button onClick={() => { setEditingTese(tese); setIsModalOpen(true); setActiveTab('reader'); }} className="text-blue-500 hover:underline">LER TESE</button>
            </div>
          </div>
        ))}
      </div>

      {/* CONFIRM DELETE MODAL */}
      {confirmDeleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md p-8 animate-scale-in text-center">
            <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-red-500/10 text-red-500">
               <AlertTriangle size={44} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Confirmar Exclusão</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">Tem certeza que deseja excluir esta tese jurídica? Esta ação removerá permanentemente o conteúdo da sua biblioteca.</p>
            <div className="flex flex-col gap-3">
              <button onClick={executeDelete} className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-900/40 transition-all">SIM, EXCLUIR TESE</button>
              <button onClick={() => setConfirmDeleteModal({ isOpen: false, thesisId: null })} className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all">CANCELAR (ESC)</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITOR/READER */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col border border-slate-800 animate-scale-in">
             <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-2xl">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-500 flex items-center justify-center"><BookOpen size={20}/></div>
                   <div><h2 className="text-xl font-bold text-white">{editingTese.id ? 'Tese Jurídica' : 'Nova Tese'}</h2><p className="text-xs text-slate-500">{editingTese.area}</p></div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
             </div>
             
             <div className="flex border-b border-slate-800 bg-slate-950 px-6">
                <button onClick={() => setActiveTab('reader')} className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'reader' ? 'border-blue-600 text-blue-400' : 'border-transparent text-slate-500'}`}>Leitura</button>
                <button onClick={() => setActiveTab('editor')} className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'editor' ? 'border-indigo-600 text-indigo-400' : 'border-transparent text-slate-500'}`}>Editor</button>
                <button onClick={() => setActiveTab('notebook')} className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'notebook' ? 'border-purple-600 text-purple-400' : 'border-transparent text-slate-500'}`}>Notebook IA</button>
             </div>

             <div className="flex-1 overflow-hidden flex bg-slate-950">
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                   {activeTab === 'reader' && (
                     <div className="prose prose-invert max-w-none animate-fade-in">
                        <h1 className="text-3xl font-bold text-white mb-6 border-b border-slate-800 pb-4">{editingTese.titulo || "Sem título"}</h1>
                        <div className="text-slate-300 leading-relaxed whitespace-pre-wrap font-serif text-lg">
                           {editingTese.conteudo || "Nenhum conteúdo definido ainda."}
                        </div>
                     </div>
                   )}
                   {activeTab === 'editor' && (
                     <div className="space-y-6 animate-fade-in">
                        <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Título da Tese</label><input className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-600 outline-none" value={editingTese.titulo} onChange={e => setEditingTese({...editingTese, titulo: e.target.value})} placeholder="Ex: Prescrição Intercorrente..." /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Resumo/Descrição</label><textarea className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-600 outline-none h-24 resize-none" value={editingTese.descricao} onChange={e => setEditingTese({...editingTese, descricao: e.target.value})} placeholder="Breve descrição da tese..." /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Conteúdo Estruturado</label><textarea className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-600 outline-none h-96 resize-none font-serif text-lg custom-scrollbar" value={editingTese.conteudo} onChange={e => setEditingTese({...editingTese, conteudo: e.target.value})} placeholder="Escreva a fundamentação completa aqui..." /></div>
                     </div>
                   )}
                   {activeTab === 'notebook' && (
                     <div className="flex flex-col h-full animate-fade-in">
                        <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 p-6 overflow-y-auto mb-4 space-y-4 custom-scrollbar">
                           <div className="flex gap-4 items-start">
                              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0"><Bot size={18}/></div>
                              <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none text-slate-200 text-sm max-w-[80%]">Olá! Eu analisei sua tese. Como posso te ajudar a melhorá-la ou tirar dúvidas hoje?</div>
                           </div>
                           {/* Chat messages would render here */}
                        </div>
                        <div className="flex gap-2"><input className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-purple-600" placeholder="Pergunte algo sobre a tese..." /><button className="bg-purple-600 p-3 rounded-xl text-white hover:bg-purple-700 transition-colors shadow-lg shadow-purple-900/40"><Send size={20}/></button></div>
                     </div>
                   )}
                </div>
             </div>

             <div className="p-6 border-t border-slate-800 bg-slate-950 flex justify-end gap-3 rounded-b-2xl">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-slate-400 hover:text-white font-medium">Fechar (ESC)</button>
                {activeTab === 'editor' && <button onClick={handleSaveTese} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-900/30">Salvar Tese</button>}
             </div>
           </div>
        </div>
      )}
    </div>
  );
};
