
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { Cliente, Processo, Tese, TimesheetEntry, AreaDireito, ProcessoStatus } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface DataContextType {
  clients: Cliente[];
  cases: Processo[];
  theses: Tese[];
  timesheet: TimesheetEntry[];
  loading: boolean;
  addClient: (client: Partial<Cliente>) => Promise<void>;
  updateClient: (client: Cliente) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addCase: (processo: Partial<Processo>) => Promise<void>;
  updateCase: (processo: Processo) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  addThesis: (tese: Partial<Tese>) => Promise<void>;
  updateThesis: (tese: Tese) => Promise<void>;
  deleteThesis: (id: string) => Promise<void>;
  addTimesheetEntry: (entry: Partial<TimesheetEntry>) => Promise<void>;
  deleteTimesheetEntry: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  seedDemoData: () => Promise<void>;
}

const DataContext = createContext<DataContextType>({} as DataContextType);

const LS_KEYS = {
  CLIENTS: 'juzk_fallback_clients',
  CASES: 'juzk_fallback_cases',
  THESES: 'juzk_fallback_theses',
  TIMESHEET: 'juzk_fallback_timesheet'
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { office } = useAuth();
  const [clients, setClients] = useState<Cliente[]>([]);
  const [cases, setCases] = useState<Processo[]>([]);
  const [theses, setTheses] = useState<Tese[]>([]);
  const [timesheet, setTimesheet] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!office) return;
    setLoading(true);

    if (!isSupabaseConfigured) {
      const storedClients = JSON.parse(localStorage.getItem(LS_KEYS.CLIENTS) || '[]');
      const storedCases = JSON.parse(localStorage.getItem(LS_KEYS.CASES) || '[]');
      const storedTheses = JSON.parse(localStorage.getItem(LS_KEYS.THESES) || '[]');
      const storedTimesheet = JSON.parse(localStorage.getItem(LS_KEYS.TIMESHEET) || '[]');

      setClients(storedClients.filter((c: any) => c.office_id === office.id));
      setCases(storedCases.filter((c: any) => c.office_id === office.id));
      setTheses(storedTheses.filter((c: any) => c.office_id === office.id));
      setTimesheet(storedTimesheet.filter((c: any) => c.office_id === office.id));
      setLoading(false);
      return;
    }

    try {
      const [clientsRes, casesRes, thesesRes, timesheetRes] = await Promise.all([
        supabase.from('clients').select('*').eq('office_id', office.id).order('nome'),
        supabase.from('cases').select('*').eq('office_id', office.id).order('created_at', { ascending: false }),
        supabase.from('theses').select('*').eq('office_id', office.id).order('data_criacao', { ascending: false }),
        supabase.from('timesheet').select('*').eq('office_id', office.id).order('data', { ascending: false })
      ]);

      if (clientsRes.data) setClients(clientsRes.data as Cliente[]);
      if (casesRes.data) {
        const mappedCases = casesRes.data.map((c: any) => ({
          ...c,
          clienteId: c.cliente_id,
          parteAdversa: c.parte_adversa,
          valorCausa: Number(c.valor_causa),
          dataDistribuicao: c.data_distribuicao,
          historicoAndamentos: c.historico_andamentos || [],
          prazos: c.prazos || [],
          audiencias: c.audiencias || [],
          financeiro: c.financeiro || { config: { honorariosContratuais: 0, percentualExito: 0, percentualSucumbencia: 0 }, transacoes: [] }
        })) as Processo[];
        setCases(mappedCases);
      }
      if (thesesRes.data) setTheses(thesesRes.data.map((t: any) => ({ ...t, dataCriacao: t.data_criacao })) as Tese[]);
      if (timesheetRes.data) setTimesheet(timesheetRes.data.map((ts: any) => ({ ...ts, processoId: ts.case_id, horas: Number(ts.horas) })) as TimesheetEntry[]);
    } catch (error) {
      console.error("Erro ao buscar dados do Supabase:", error);
    } finally {
      setLoading(false);
    }
  }, [office]);

  useEffect(() => {
    if (office) fetchData();
  }, [office, fetchData]);

  const saveLocal = (key: string, data: any[]) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const addClient = async (client: Partial<Cliente>) => {
    if (!office) {
      throw new Error("Escritório não identificado. Tente refazer o login.");
    }
    
    if (!isSupabaseConfigured) {
      const newClient = { ...client, id: client.id || Date.now().toString(), office_id: office.id } as Cliente;
      const current = JSON.parse(localStorage.getItem(LS_KEYS.CLIENTS) || '[]');
      saveLocal(LS_KEYS.CLIENTS, [...current, newClient]);
    } else {
      // Remover campos ID e contatos para que o Supabase gere o UUID e não falhe no schema
      const { id, contatos, ...rest } = client as any;
      const dbData = {
        ...rest,
        office_id: office.id
      };
      
      const { data, error } = await supabase.from('clients').insert([dbData]).select();
      if (error) {
        console.error("Erro detalhado do Supabase:", error);
        throw new Error(`${error.message} (Código: ${error.code})`);
      }
      console.log("Cliente salvo com sucesso:", data);
    }
    await fetchData();
  };

  const updateClient = async (client: Cliente) => {
    if (!isSupabaseConfigured) {
      const current = JSON.parse(localStorage.getItem(LS_KEYS.CLIENTS) || '[]');
      saveLocal(LS_KEYS.CLIENTS, current.map((c: any) => c.id === client.id ? client : c));
    } else {
      const { contatos, ...dbData } = client as any;
      const { error } = await supabase.from('clients').update(dbData).eq('id', client.id);
      if (error) throw new Error(error.message);
    }
    await fetchData();
  };

  const deleteClient = async (id: string) => {
    if (!isSupabaseConfigured) {
      const current = JSON.parse(localStorage.getItem(LS_KEYS.CLIENTS) || '[]');
      saveLocal(LS_KEYS.CLIENTS, current.filter((c: any) => c.id !== id));
    } else {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw new Error(error.message);
    }
    await fetchData();
  };

  const addCase = async (processo: Partial<Processo>) => {
    if (!office) return;
    if (!isSupabaseConfigured) {
      const newCase = { ...processo, id: processo.id || Date.now().toString(), office_id: office.id } as Processo;
      const current = JSON.parse(localStorage.getItem(LS_KEYS.CASES) || '[]');
      saveLocal(LS_KEYS.CASES, [...current, newCase]);
    } else {
      const { id, ...rest } = processo as any;
      const dbData = {
        office_id: office.id,
        numero: processo.numero,
        titulo: processo.titulo,
        cliente_id: processo.clienteId,
        parte_adversa: processo.parteAdversa,
        area: processo.area,
        status: processo.status,
        valor_causa: processo.valorCausa,
        data_distribuicao: processo.dataDistribuicao,
        responsavel: processo.responsavel,
        financeiro: processo.financeiro,
        prazos: processo.prazos,
        audiencias: processo.audiencias,
        historico_andamentos: processo.historicoAndamentos
      };
      const { error } = await supabase.from('cases').insert([dbData]);
      if (error) throw new Error(error.message);
    }
    await fetchData();
  };

  const updateCase = async (processo: Processo) => {
    if (!isSupabaseConfigured) {
      const current = JSON.parse(localStorage.getItem(LS_KEYS.CASES) || '[]');
      saveLocal(LS_KEYS.CASES, current.map((c: any) => c.id === processo.id ? processo : c));
    } else {
      const dbData = {
        numero: processo.numero,
        titulo: processo.titulo,
        cliente_id: processo.clienteId,
        parte_adversa: processo.parteAdversa,
        area: processo.area,
        status: processo.status,
        valor_causa: processo.valorCausa,
        data_distribuicao: processo.dataDistribuicao,
        responsavel: processo.responsavel,
        financeiro: processo.financeiro,
        prazos: processo.prazos,
        audiencias: processo.audiencias,
        historico_andamentos: processo.historicoAndamentos
      };
      const { error } = await supabase.from('cases').update(dbData).eq('id', processo.id);
      if (error) throw new Error(error.message);
    }
    await fetchData();
  };

  const deleteCase = async (id: string) => {
    if (!isSupabaseConfigured) {
      const current = JSON.parse(localStorage.getItem(LS_KEYS.CASES) || '[]');
      saveLocal(LS_KEYS.CASES, current.filter((c: any) => c.id !== id));
    } else {
      const { error } = await supabase.from('cases').delete().eq('id', id);
      if (error) throw new Error(error.message);
    }
    await fetchData();
  };

  const addThesis = async (tese: Partial<Tese>) => {
    if (!office) return;
    if (!isSupabaseConfigured) {
      const newThesis = { ...tese, id: tese.id || Date.now().toString(), office_id: office.id } as Tese;
      const current = JSON.parse(localStorage.getItem(LS_KEYS.THESES) || '[]');
      saveLocal(LS_KEYS.THESES, [...current, newThesis]);
    } else {
      const { id, ...rest } = tese as any;
      const { error } = await supabase.from('theses').insert([{ ...rest, office_id: office.id }]);
      if (error) throw new Error(error.message);
    }
    await fetchData();
  };

  const updateThesis = async (tese: Tese) => {
    if (!isSupabaseConfigured) {
      const current = JSON.parse(localStorage.getItem(LS_KEYS.THESES) || '[]');
      saveLocal(LS_KEYS.THESES, current.map((t: any) => t.id === tese.id ? tese : t));
    } else {
      const { error } = await supabase.from('theses').update(tese).eq('id', tese.id);
      if (error) throw new Error(error.message);
    }
    await fetchData();
  };

  const deleteThesis = async (id: string) => {
    if (!isSupabaseConfigured) {
      const current = JSON.parse(localStorage.getItem(LS_KEYS.THESES) || '[]');
      saveLocal(LS_KEYS.THESES, current.filter((t: any) => t.id !== id));
    } else {
      const { error } = await supabase.from('theses').delete().eq('id', id);
      if (error) throw new Error(error.message);
    }
    await fetchData();
  };

  const addTimesheetEntry = async (entry: Partial<TimesheetEntry>) => {
    if (!office) return;
    if (!isSupabaseConfigured) {
      const newEntry = { ...entry, id: entry.id || Date.now().toString(), office_id: office.id } as TimesheetEntry;
      const current = JSON.parse(localStorage.getItem(LS_KEYS.TIMESHEET) || '[]');
      saveLocal(LS_KEYS.TIMESHEET, [...current, newEntry]);
    } else {
      const dbData = {
        office_id: office.id,
        advogado: entry.advogado,
        case_id: entry.processoId,
        descricao: entry.descricao,
        data: entry.data,
        horas: entry.horas,
        faturavel: entry.faturavel
      };
      const { error } = await supabase.from('timesheet').insert([dbData]);
      if (error) throw new Error(error.message);
    }
    await fetchData();
  };

  const deleteTimesheetEntry = async (id: string) => {
    if (!isSupabaseConfigured) {
      const current = JSON.parse(localStorage.getItem(LS_KEYS.TIMESHEET) || '[]');
      saveLocal(LS_KEYS.TIMESHEET, current.filter((ts: any) => ts.id !== id));
    } else {
      const { error } = await supabase.from('timesheet').delete().eq('id', id);
      if (error) throw new Error(error.message);
    }
    await fetchData();
  };

  const clearAllData = async () => {
    if (!office) return;
    setLoading(true);
    if (!isSupabaseConfigured) {
      const filterOffice = (data: any[]) => data.filter(d => d.office_id !== office.id);
      saveLocal(LS_KEYS.CLIENTS, filterOffice(JSON.parse(localStorage.getItem(LS_KEYS.CLIENTS) || '[]')));
      saveLocal(LS_KEYS.CASES, filterOffice(JSON.parse(localStorage.getItem(LS_KEYS.CASES) || '[]')));
      saveLocal(LS_KEYS.THESES, filterOffice(JSON.parse(localStorage.getItem(LS_KEYS.THESES) || '[]')));
      saveLocal(LS_KEYS.TIMESHEET, filterOffice(JSON.parse(localStorage.getItem(LS_KEYS.TIMESHEET) || '[]')));
    } else {
      await Promise.all([
        supabase.from('timesheet').delete().eq('office_id', office.id),
        supabase.from('cases').delete().eq('office_id', office.id),
        supabase.from('clients').delete().eq('office_id', office.id),
        supabase.from('theses').delete().eq('office_id', office.id)
      ]);
    }
    await fetchData();
  };

  const seedDemoData = async () => {
    if (!office) return;
    setLoading(true);
    try {
      const demoClients: any[] = [
        { nome: 'João Exemplo Silva', documento: '123.456.789-00', tipo: 'PF', email: 'joao@exemplo.com', telefone: '(11) 99999-1111', cidade: 'São Paulo - SP', status: 'Ativo', office_id: office.id },
        { nome: 'Tech Solutions Ltda', documento: '12.345.678/0001-99', tipo: 'PJ', email: 'contato@techsolutions.com', telefone: '(11) 3333-4444', cidade: 'Curitiba - PR', status: 'Ativo', office_id: office.id }
      ];

      if (!isSupabaseConfigured) {
        const current = JSON.parse(localStorage.getItem(LS_KEYS.CLIENTS) || '[]');
        saveLocal(LS_KEYS.CLIENTS, [...current, ...demoClients.map(c => ({ ...c, id: Math.random().toString(36).substr(2, 9) }))]);
      } else {
        await supabase.from('clients').insert(demoClients);
      }
    } catch (err) {
      console.error("Erro ao popular dados:", err);
    } finally {
      await fetchData();
    }
  };

  return (
    <DataContext.Provider value={{ 
      clients, addClient, updateClient, deleteClient,
      cases, addCase, updateCase, deleteCase,
      theses, addThesis, updateThesis, deleteThesis,
      timesheet, addTimesheetEntry, deleteTimesheetEntry,
      loading, refreshData: fetchData, clearAllData, seedDemoData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
