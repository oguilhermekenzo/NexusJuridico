import React, { useState, useRef, useEffect } from 'react';
import { Bot, FileText, Search, Sparkles, AlertCircle, Loader2, ArrowRight, ChevronDown, Check, FolderOpen } from 'lucide-react';
import { summarizeIntimacao, generateDraft, researchJurisprudence } from '../services/geminiService';
import { AreaDireito } from '../types';

// --- SHARED UI: CUSTOM DROPDOWN ---
interface CustomDropdownProps {
  label?: string;
  value: string;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  onChange: (value: string) => void;
  className?: string;
}
const CustomDropdown: React.FC<CustomDropdownProps> = ({ label, value, options, onChange, className = '' }) => {
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
      {label && <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{label}</label>}
      <button type="button" onClick={() => setIsOpen(!isOpen)} className={`w-full flex items-center justify-between p-2.5 bg-slate-900 text-slate-200 border border-slate-800 rounded-lg transition-all ${isOpen ? 'ring-2 ring-blue-600' : 'hover:border-slate-700'}`}>
        <div className="flex items-center gap-2 overflow-hidden">
          {selectedOption?.icon}
          <span className="font-medium truncate text-sm">{selectedOption?.label}</span>
        </div>
        <ChevronDown size={16} className={`text-slate-500 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden animate-fade-in-down">
          {options.map(option => (
            <button key={option.value} type="button" onClick={() => { onChange(option.value); setIsOpen(false); }} className={`w-full flex items-center justify-between px-4 py-2 text-left text-sm ${option.value === value ? 'bg-blue-600/10 text-blue-400' : 'text-slate-300 hover:bg-slate-800'}`}>
              <div className="flex items-center gap-2">{option.icon} {option.label}</div>
              {option.value === value && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- HELPER: INPUT WITH ICON (For Draft) ---
interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ElementType;
}
const InputWithIcon: React.FC<InputWithIconProps> = ({ label, icon: Icon, className, ...props }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{label}</label>
    <div className="relative group">
      {Icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors pointer-events-none"><Icon size={16} /></div>}
      <input 
        {...props} 
        onWheel={(e) => e.currentTarget.type === 'number' && e.currentTarget.blur()}
        className={`w-full p-2.5 bg-slate-900 border border-slate-800 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition-all ${Icon ? 'pl-9' : ''} ${className || ''}`} 
      />
    </div>
  </div>
);

export const AITools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'summary' | 'draft' | 'research'>('summary');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Summary State
  const [summaryInput, setSummaryInput] = useState('');
  const [summaryResult, setSummaryResult] = useState<{summary: string, prazo: string | null, acao: string | null} | null>(null);

  // Draft State
  const [draftConfig, setDraftConfig] = useState({ area: AreaDireito.CIVEL, type: 'Petição Inicial', facts: '', args: '' });
  const [draftResult, setDraftResult] = useState('');

  // Research State
  const [researchQuery, setResearchQuery] = useState('');
  const [researchResult, setResearchResult] = useState<{ text: string, sources: { title: string, uri: string }[] } | null>(null);

  const handleSummarize = async () => {
    if (!summaryInput) return;
    setLoading(true);
    setError(null);
    try {
      const result = await summarizeIntimacao(summaryInput);
      setSummaryResult(result);
    } catch (e) {
      setError("Erro ao processar resumo. Verifique sua chave API.");
    } finally {
      setLoading(false);
    }
  };

  const handleDraft = async () => {
    if (!draftConfig.facts) return;
    setLoading(true);
    setDraftResult('');
    try {
      const text = await generateDraft(draftConfig.area, draftConfig.type, draftConfig.facts, draftConfig.args);
      setDraftResult(text);
    } catch (e) {
      setError("Erro ao gerar peça.");
    } finally {
      setLoading(false);
    }
  };

  const handleResearch = async () => {
    if (!researchQuery) return;
    setLoading(true);
    setResearchResult(null);
    try {
      const result = await researchJurisprudence(researchQuery);
      setResearchResult(result);
    } catch (e) {
      setError("Erro na pesquisa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in pb-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-2">
          <Sparkles className="text-purple-500" />
          Inteligência Jurídica
        </h1>
        <p className="text-slate-500">Utilize a IA do Gemini para acelerar sua rotina</p>
      </header>

      <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button 
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors
              ${activeTab === 'summary' ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <AlertCircle size={18} />
            Análise de Intimações
          </button>
          <button 
            onClick={() => setActiveTab('draft')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors
              ${activeTab === 'draft' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <FileText size={18} />
            Redação Automática
          </button>
          <button 
            onClick={() => setActiveTab('research')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors
              ${activeTab === 'research' ? 'border-green-500 text-green-400 bg-green-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <Search size={18} />
            Pesquisa Inteligente
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950 custom-scrollbar">
          
          {activeTab === 'summary' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400">Cole o texto da publicação do Diário Oficial</label>
                <textarea 
                  className="w-full h-40 p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none outline-none"
                  placeholder="Ex: INTIMAÇÃO. Fica a parte autora intimada para..."
                  value={summaryInput}
                  onChange={(e) => setSummaryInput(e.target.value)}
                />
                <button 
                  onClick={handleSummarize}
                  disabled={loading || !summaryInput}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 ml-auto shadow-lg shadow-purple-900/30"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                  Analisar Publicação
                </button>
              </div>

              {summaryResult && (
                <div className="bg-slate-900 rounded-xl border border-purple-500/30 shadow-lg p-6 space-y-4 animate-slide-up">
                  <div className="flex gap-4">
                    <div className="flex-1 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <h4 className="text-xs uppercase tracking-wide text-purple-400 font-bold mb-1">Resumo</h4>
                      <p className="text-slate-200 text-sm leading-relaxed">{summaryResult.summary}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                      <h4 className="text-xs uppercase tracking-wide text-red-400 font-bold mb-1">Prazo Identificado</h4>
                      <p className="text-slate-100 font-bold">{summaryResult.prazo || "Nenhum prazo explícito"}</p>
                    </div>
                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <h4 className="text-xs uppercase tracking-wide text-blue-400 font-bold mb-1">Ação Sugerida</h4>
                      <p className="text-slate-200 text-sm">{summaryResult.acao || "Apenas ciência"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'draft' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              <div className="space-y-4 flex flex-col h-full">
                 <div className="grid grid-cols-2 gap-4">
                    <CustomDropdown
                        label="Área"
                        value={draftConfig.area}
                        onChange={(val) => setDraftConfig({...draftConfig, area: val as AreaDireito})}
                        options={Object.values(AreaDireito).map(a => ({ value: a, label: a, icon: <FolderOpen size={16} /> }))}
                    />
                    <InputWithIcon
                       label="Tipo de Peça"
                       value={draftConfig.type}
                       onChange={e => setDraftConfig({...draftConfig, type: e.target.value})}
                    />
                 </div>
                 
                 <div className="flex-1 flex flex-col">
                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1">Fatos do Caso</label>
                    <textarea 
                      className="flex-1 p-3 border border-slate-800 bg-slate-900 text-slate-200 rounded-lg resize-none text-sm focus:ring-2 focus:ring-blue-600 outline-none custom-scrollbar"
                      placeholder="Descreva o que aconteceu..."
                      value={draftConfig.facts}
                      onChange={e => setDraftConfig({...draftConfig, facts: e.target.value})}
                    />
                 </div>

                 <div className="flex-1 flex flex-col">
                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1">Teses / Argumentos</label>
                    <textarea 
                      className="flex-1 p-3 border border-slate-800 bg-slate-900 text-slate-200 rounded-lg resize-none text-sm focus:ring-2 focus:ring-blue-600 outline-none custom-scrollbar"
                      placeholder="Pontos chave da defesa/acusação..."
                      value={draftConfig.args}
                      onChange={e => setDraftConfig({...draftConfig, args: e.target.value})}
                    />
                 </div>

                 <button 
                  onClick={handleDraft}
                  disabled={loading}
                  className="bg-blue-600 text-white w-full py-3 rounded-lg font-bold hover:bg-blue-700 flex justify-center items-center gap-2 shadow-lg shadow-blue-900/30"
                 >
                   {loading ? <Loader2 className="animate-spin" /> : <Bot />}
                   Gerar Minuta
                 </button>
              </div>

              <div className="h-full bg-slate-900 border border-slate-800 rounded-lg p-6 overflow-y-auto shadow-inner relative custom-scrollbar">
                {draftResult ? (
                  <div className="prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-wrap font-serif">
                    {draftResult}
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700">
                    <FileText size={48} className="mb-4 opacity-20" />
                    <p>A minuta gerada aparecerá aqui.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'research' && (
             <div className="max-w-4xl mx-auto space-y-6">
                <div className="relative">
                  <input 
                    type="text"
                    className="w-full pl-12 pr-14 py-4 rounded-full bg-slate-900 border border-slate-700 shadow-lg text-slate-200 focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg outline-none placeholder-slate-600"
                    placeholder="Ex: Prescrição intercorrente na execução fiscal após Lei 11.051"
                    value={researchQuery}
                    onChange={e => setResearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleResearch()}
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <button 
                    onClick={handleResearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 text-white p-2.5 rounded-full hover:bg-green-700 disabled:opacity-50 shadow-md"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                  </button>
                </div>

                {researchResult && (
                  <div className="space-y-6 animate-slide-up">
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                        <Bot className="text-green-500" /> Resposta da IA
                      </h3>
                      <div className="prose prose-invert max-w-none text-slate-300">
                        <div dangerouslySetInnerHTML={{ __html: researchResult.text.replace(/\n/g, '<br/>') }} />
                      </div>
                    </div>

                    {researchResult.sources.length > 0 && (
                      <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                         <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Fontes Encontradas (Grounding)</h4>
                         <ul className="space-y-2">
                           {researchResult.sources.map((source, idx) => (
                             <li key={idx} className="flex items-start gap-2">
                               <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></div>
                               <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm break-all">
                                 {source.title}
                               </a>
                             </li>
                           ))}
                         </ul>
                      </div>
                    )}
                  </div>
                )}
             </div>
          )}

        </div>
      </div>
    </div>
  );
};