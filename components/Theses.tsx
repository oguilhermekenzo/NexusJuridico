
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, BookOpen, Edit2, Trash2, X, Sparkles, Send, Bot, MessageSquare, Loader2, ChevronDown, Check, FolderOpen, AlignLeft, Filter, FileText, Calendar, AlertTriangle } from 'lucide-react';
import { Tese, AreaDireito } from '../types';
import { askThesisAI, generateThesisContent } from '../services/geminiService';
import { useData } from '../contexts/DataContext';

// Components ommited for brevity but should match original

export const Theses: React.FC = () => {
  const { theses, addThesis, updateThesis, deleteThesis } = useData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'reader' | 'editor' | 'notebook'>('reader');
  
  const [editingTese, setEditingTese] = useState<Partial<Tese>>({ area: AreaDireito.CIVEL });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Confirmation Modal State
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{ isOpen: boolean; thesisId: string | null }>({ isOpen: false, thesisId: null });

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

  const executeDelete = () => {
    if (confirmDeleteModal.thesisId) {
      deleteThesis(confirmDeleteModal.thesisId);
      setConfirmDeleteModal({ isOpen: false, thesisId: null });
    }
  };

  // ... (rest of the component's original logic)

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* ... (Header and filters) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Minhas Teses</h1>
          <p className="text-slate-500 text-sm">Biblioteca de conhecimento jurídico</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-blue-900/30">
          <Plus size={18} /> Nova Tese
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTheses.map(tese => (
          <div key={tese.id} className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-sm hover:border-slate-700 transition-all flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold px-2 py-1 rounded bg-blue-600 text-white">{tese.area}</span>
              <div className="flex gap-2">
                <button onClick={() => { setEditingTese(tese); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors"><Edit2 size={16} /></button>
                <button onClick={() => handleInitiateDelete(tese.id)} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
            <h3 className="font-bold text-slate-200 text-lg mb-2">{tese.titulo}</h3>
            <p className="text-sm text-slate-400 line-clamp-3 mb-4 flex-1">{tese.descricao}</p>
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
            <p className="text-slate-400 mb-8 leading-relaxed">Tem certeza que deseja excluir esta tese jurídica? Esta ação é irreversível.</p>
            <div className="flex flex-col gap-3">
              <button onClick={executeDelete} className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-900/40 transition-all">SIM, EXCLUIR TESE</button>
              <button onClick={() => setConfirmDeleteModal({ isOpen: false, thesisId: null })} className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all">CANCELAR</button>
            </div>
          </div>
        </div>
      )}
      {/* ... (Original editing modal logic) */}
    </div>
  );
};
