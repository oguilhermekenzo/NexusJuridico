
import React, { useState, useEffect } from 'react';
import { Building2, Users, Plus, ShieldCheck, Mail, User, Trash2, X, Check, Briefcase, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Office, AppUser, UserRole } from '../types';

interface AdminProps {
  showNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const Admin: React.FC<AdminProps> = ({ showNotify }) => {
  const [offices, setOffices] = useState<Office[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfficeModalOpen, setIsOfficeModalOpen] = useState(false);
  
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
        const { data: profilesData } = await supabase.from('profiles').select('id, email, office_id, full_name, role');
        
        if (officesData) setOffices(officesData);
        if (profilesData) {
          setUsers(profilesData.map(u => ({
            id: u.id,
            email: u.email,
            officeId: u.office_id,
            name: u.full_name,
            role: (u.role as UserRole) || UserRole.LAWYER
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

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      if (isSupabaseConfigured) {
        await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        showNotify("Nível de acesso atualizado!");
        loadData();
      }
    } catch (e) {
      showNotify("Erro ao atualizar nível.", "error");
    }
  };

  const handleCreateOffice = async () => {
    if (!newOfficeName.trim()) return;
    setActionLoading(true);
    try {
      if (!isSupabaseConfigured) {
        const newOffice = { id: Date.now().toString(), name: newOfficeName };
        const current = JSON.parse(localStorage.getItem('juzk_admin_offices') || '[]');
        localStorage.setItem('juzk_admin_offices', JSON.stringify([...current, newOffice]));
        showNotify("Escritório criado!");
      } else {
        const { error } = await supabase.from('offices').insert([{ name: newOfficeName }]);
        if (error) throw error;
        showNotify("Escritório registrado!");
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

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Briefcase className="text-blue-500" /> Administrativo
          </h1>
          <p className="text-slate-500">Gestão de acessos e categorias de ADM</p>
        </div>
        <button onClick={() => setIsOfficeModalOpen(true)} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 font-bold">
          <Plus size={18} /> Novo Escritório
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2"><Users size={20} className="text-blue-500"/> Gestão de Equipe (Níveis de Acesso)</h3>
              <span className="text-xs font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded-lg">{users.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Membro</th>
                    <th className="p-4">Escritório</th>
                    <th className="p-4">Categoria de ADM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-800/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                            {u.name?.substring(0,2) || u.email.substring(0,2)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-200">{u.name || 'Sem Nome'}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                         <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-800 px-2 py-1 rounded">
                           {offices.find(o => o.id === u.officeId)?.name || 'S/ Escritório'}
                         </span>
                      </td>
                      <td className="p-4">
                        <select 
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u.id, e.target.value as UserRole)}
                          className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold py-1 px-2 rounded-lg outline-none focus:ring-1 focus:ring-blue-600"
                        >
                          <option value={UserRole.SUPER_ADMIN}>SUPER_ADMIN</option>
                          <option value={UserRole.OFFICE_ADMIN}>OFFICE_ADMIN</option>
                          <option value={UserRole.LAWYER}>ADVOGADO</option>
                          <option value={UserRole.STAFF}>STAFF / EQUIPE</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 bg-slate-950">
              <h3 className="font-bold text-white flex items-center gap-2"><Building2 size={20} className="text-blue-500"/> Escritórios</h3>
            </div>
            <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              {offices.map(o => (
                <div key={o.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-200">{o.name}</span>
                  <span className="text-[9px] text-slate-600 font-mono">ID: {o.id.substring(0,8)}...</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isOfficeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md animate-scale-in">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-white">Novo Escritório</h3>
              <button onClick={() => setIsOfficeModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
            </div>
            <div className="p-6">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 ml-1">Nome da Organização</label>
              <input 
                autoFocus 
                value={newOfficeName} 
                onChange={e => setNewOfficeName(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-600 outline-none" 
              />
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <button 
                onClick={handleCreateOffice} 
                className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2"
              >
                {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
