
import React, { useState, useEffect } from 'react';
import { Building2, Users, Plus, ShieldCheck, Mail, User, Trash2, X, Check, Briefcase, Loader2, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Office, AppUser } from '../types';

interface AdminProps {
  showNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const Admin: React.FC<AdminProps> = ({ showNotify }) => {
  const [offices, setOffices] = useState<Office[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfficeModalOpen, setIsOfficeModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  
  const [newOfficeName, setNewOfficeName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        const storedOffices = JSON.parse(localStorage.getItem('juzk_admin_offices') || '[]');
        const storedUsers = JSON.parse(localStorage.getItem('juzk_admin_users') || '[]');
        setOffices(storedOffices);
        setUsers(storedUsers);
      } else {
        const { data: officesData } = await supabase.from('offices').select('*').order('name');
        const { data: profilesData } = await supabase.from('profiles').select('id, email, office_id, full_name');
        
        if (officesData) setOffices(officesData);
        if (profilesData) {
          setUsers(profilesData.map(u => ({
            id: u.id,
            email: u.email,
            officeId: u.office_id,
            name: u.full_name
          })));
        }
      }
    } catch (e) {
      console.error("Erro ao carregar dados admin:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOffice = async () => {
    if (!newOfficeName.trim()) return;
    setActionLoading(true);
    
    try {
      if (!isSupabaseConfigured) {
        const newOffice = { id: Date.now().toString(), name: newOfficeName };
        const current = JSON.parse(localStorage.getItem('juzk_admin_offices') || '[]');
        localStorage.setItem('juzk_admin_offices', JSON.stringify([...current, newOffice]));
        showNotify("Escritório criado localmente!", "success");
      } else {
        const { error } = await supabase.from('offices').insert([{ name: newOfficeName }]);
        if (error) throw error;
        showNotify("Escritório registrado no Supabase!", "success");
      }
      setNewOfficeName('');
      setIsOfficeModalOpen(false);
      loadData();
    } catch (e: any) {
      showNotify(e.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteOffice = async (id: string) => {
    if (!window.confirm("Isso apagará o escritório e todos os registros vinculados. Prosseguir?")) return;
    try {
      if (!isSupabaseConfigured) {
        const current = JSON.parse(localStorage.getItem('juzk_admin_offices') || '[]');
        localStorage.setItem('juzk_admin_offices', JSON.stringify(current.filter((o: any) => o.id !== id)));
      } else {
        await supabase.from('offices').delete().eq('id', id);
      }
      showNotify("Escritório removido.");
      loadData();
    } catch (e: any) {
      showNotify("Erro ao remover escritório.", "error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Briefcase className="text-blue-500" /> Administrativo
          </h1>
          <p className="text-slate-500">Gestão global de escritórios e acessos</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsOfficeModalOpen(true)} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-900/40">
            <Plus size={18} /> Novo Escritório
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="text-blue-500 animate-spin mb-4" size={48} />
          <p className="text-slate-500 font-medium">Sincronizando com a nuvem...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coluna de Escritórios */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2"><Building2 size={20} className="text-blue-500"/> Escritórios Ativos</h3>
                <span className="text-xs font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded-lg">{offices.length}</span>
              </div>
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                {offices.map(o => (
                  <div key={o.id} className="p-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors flex justify-between items-center group">
                    <div>
                      <p className="font-bold text-slate-200">{o.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {o.id}</p>
                    </div>
                    <button onClick={() => deleteOffice(o.id)} className="p-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {offices.length === 0 && <div className="p-10 text-center text-slate-600 italic text-sm">Nenhum escritório cadastrado.</div>}
              </div>
            </div>
          </div>

          {/* Coluna de Usuários */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2"><Users size={20} className="text-blue-500"/> Usuários do Sistema</h3>
                <span className="text-xs font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded-lg">{users.length}</span>
              </div>
              <div className="p-4 bg-blue-600/5 border-b border-blue-500/20 flex items-start gap-3">
                 <AlertCircle className="text-blue-400 shrink-0 mt-0.5" size={16} />
                 <p className="text-[10px] text-blue-300 leading-relaxed font-medium">
                    Usuários devem ser criados no painel <strong>Authentication</strong> do Supabase. 
                    Certifique-se de incluir o <code className="bg-blue-900/40 px-1 rounded">office_id</code> no 
                    Metadata do usuário para que o vínculo funcione.
                 </p>
              </div>
              <div className="max-h-[385px] overflow-y-auto custom-scrollbar">
                {users.map(u => (
                  <div key={u.id} className="p-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                        {u.name?.substring(0,2) || u.email.substring(0,2)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-200 text-sm">{u.name || 'Sem Nome'}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-[9px] font-bold text-blue-500 uppercase bg-blue-500/10 px-2 py-1 rounded">
                         {offices.find(o => o.id === u.officeId)?.name || 'S/ Escritório'}
                       </span>
                    </div>
                  </div>
                ))}
                {users.length === 0 && <div className="p-10 text-center text-slate-600 italic text-sm">Nenhum usuário encontrado no banco.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Escritório */}
      {isOfficeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md animate-scale-in">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-white">Criar Organização</h3>
              <button onClick={() => setIsOfficeModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
            </div>
            <div className="p-6">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 ml-1">Nome do Escritório</label>
              <input 
                autoFocus 
                value={newOfficeName} 
                onChange={e => setNewOfficeName(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-600 outline-none" 
                placeholder="Ex: Silva & Advogados Associados" 
              />
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <button onClick={() => setIsOfficeModalOpen(false)} className="text-slate-400 font-medium px-4">Cancelar</button>
              <button 
                onClick={handleCreateOffice} 
                disabled={actionLoading || !newOfficeName.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                Confirmar Criação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
