
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { Cliente, Processo, Tese, TimesheetEntry, AreaDireito, ProcessoStatus, Prazo, Audiencia, Andamento, TransacaoProcesso } from '../types';
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
    if (!office) return;
    const newClient = { ...client, id: client.id || Date.now().toString(), office_id: office.id } as Cliente;
    if (!isSupabaseConfigured) {
      const current = JSON.parse(localStorage.getItem(LS_KEYS.CLIENTS) || '[]');
      saveLocal(LS_KEYS.CLIENTS, [...current, newClient]);
    } else {
      await supabase.from('clients').insert([newClient]);
    }
    await fetchData();
  };

  const updateClient = async (client: Cliente) => {
    if (!isSupabaseConfigured) {
      const current = JSON.parse(localStorage.getItem(LS_KEYS.CLIENTS) || '[]');
      saveLocal(LS_KEYS.CLIENTS, current.map((c: any) => c.id === client.id ? client : c));
    } else {
      await supabase.from('clients').update(client).eq('id', client.id);
    }
    await fetchData();
  };

  const deleteClient = async (id: string) => {
    if (!isSupabaseConfigured) {
      const current = JSON.parse(localStorage.getItem(LS_KEYS.CLIENTS) || '[]');
      saveLocal(LS_KEYS.CLIENTS, current.filter((c: any) => c.id !== id));
    } else {
      await supabase.from('clients').delete().eq('id', id);
    }
    await fetchData();
  };

  const addCase = async (processo: Partial<Processo>) => {
    if (!office) return;
    const newCase = { ...processo, id: processo.id || Date.now().toString(), office_id: office.id } as Processo;
    if (!isSupabaseConfigured) {
      const current = JSON.parse(localStorage.getItem(LS_KEYS.CASES) || '[]');
      saveLocal(LS_KEYS.CASES, [...current, newCase]);
    } else {
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
      await supabase.from('cases').insert([dbData]);
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
      await supabase.from('cases').update(dbData).eq('id', processo.id);
    }
    await fetchData();
  };

  const deleteCase = async (id: string) => {
    if (!isSupabaseConfigured) {
      const current = JSON.parse(localStorage.getItem(LS_KEYS.CASES) || '[]');
      saveLocal(LS_KEYS.CASES, current.filter((c: any) => c.id !== id));
    } else {
      await supabase.from('cases').delete().eq('id', id);
    }
    await fetchData();
  };

  const addThesis = async (tese: Partial<Tese>) => {
    if (!office) return;
    const newThesis = { ...tese, id: tese.id || Date.now().toString(), office_id: office.id } as Tese;
    if (!isSupabaseConfigured) {
      const current = JSON.parse(localStorage.getItem(LS_KEYS.THESES) || '[]');
      saveLocal(LS_KEYS.THESES, [...current, newThesis]);
    } else {
      await supabase.from('theses').insert([newThesis]);
    }
    await fetchData();
  };

  const updateThesis = async (tese: Tese) => {
    if (!isSupabaseConfigured) {
      const current = JSON.parse(localStorage.getItem(LS_KEYS.THESES) || '[]');
      saveLocal(LS_KEYS.THESES, current.map((t: any) => t.id === tese.id ? tese : t));
    } else {
      await supabase.from('theses').update(tese).eq('id', tese.id);
    }
    await fetchData();
  };

  const deleteThesis = async (id: string) => {
    if (!isSupabaseConfigured) {
      const current = JSON.parse(localStorage.getItem(LS_KEYS.THESES) || '[]');
      saveLocal(LS_KEYS.THESES, current.filter((t: any) => t.id !== id));
    } else {
      await supabase.from('theses').delete().eq('id', id);
    }
    await fetchData();
  };

  const addTimesheetEntry = async (entry: Partial<TimesheetEntry>) => {
    if (!office) return;
    const newEntry = { ...entry, id: entry.id || Date.now().toString(), office_id: office.id } as TimesheetEntry;
    if (!isSupabaseConfigured) {
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
      await supabase.from('timesheet').insert([dbData]);
    }
    await fetchData();
  };

  const deleteTimesheetEntry = async (id: string) => {
    if (!isSupabaseConfigured) {
      const current = JSON.parse(localStorage.getItem(LS_KEYS.TIMESHEET) || '[]');
      saveLocal(LS_KEYS.TIMESHEET, current.filter((ts: any) => ts.id !== id));
    } else {
      await supabase.from('timesheet').delete().eq('id', id);
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
      const now = new Date();
      const isoToday = now.toISOString().split('T')[0];

      // 1. CLIENTES (6 registros)
      const demoClients: Cliente[] = [
        { id: 'c1', office_id: office.id, nome: 'João Exemplo Silva', documento: '123.456.789-00', tipo: 'PF', email: 'joao@exemplo.com', telefone: '(11) 99999-1111', cidade: 'São Paulo - SP', status: 'Ativo' },
        { id: 'c2', office_id: office.id, nome: 'Tech Solutions Ltda', documento: '12.345.678/0001-99', tipo: 'PJ', email: 'contato@techsolutions.com', telefone: '(11) 3333-4444', cidade: 'Curitiba - PR', status: 'Ativo' },
        { id: 'c3', office_id: office.id, nome: 'Maria Oliveira Santos', documento: '222.333.444-55', tipo: 'PF', email: 'maria.oliveira@gmail.com', telefone: '(21) 98888-2222', cidade: 'Rio de Janeiro - RJ', status: 'Ativo' },
        { id: 'c4', office_id: office.id, nome: 'Banco Crédito S.A.', documento: '00.111.222/0001-33', tipo: 'PJ', email: 'juridico@bancocredito.com', telefone: '(11) 4004-0000', cidade: 'São Paulo - SP', status: 'Ativo' },
        { id: 'c5', office_id: office.id, nome: 'Construtora Forte', documento: '33.444.555/0001-66', tipo: 'PJ', email: 'obras@forte.com.br', telefone: '(31) 3222-1111', cidade: 'Belo Horizonte - MG', status: 'Inativo' },
        { id: 'c6', office_id: office.id, nome: 'Ricardo Pereira Lima', documento: '555.666.777-88', tipo: 'PF', email: 'ricardo.lima@outlook.com', telefone: '(41) 97777-3333', cidade: 'Florianópolis - SC', status: 'Ativo' }
      ];

      // 2. PROCESSOS (10 registros)
      const generateTransactions = (count: number) => {
        const trans: TransacaoProcesso[] = [];
        for (let i = 0; i < count; i++) {
          const date = new Date(now.getFullYear(), now.getMonth() - Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1);
          const isReceita = Math.random() > 0.4;
          trans.push({
            id: `t-${Math.random()}`,
            data: date.toISOString().split('T')[0],
            descricao: isReceita ? 'Honorários Mensais' : 'Custas Processuais',
            tipo: isReceita ? 'RECEITA' : 'DESPESA',
            valor: isReceita ? 1500 + Math.random() * 3000 : 200 + Math.random() * 800,
            categoria: isReceita ? 'Honorários' : 'Custas'
          });
        }
        return trans;
      };

      const demoCases: Processo[] = [
        {
          id: 'p1', office_id: office.id, clienteId: 'c1', titulo: 'Ação Indenizatória vs Banco Dinheiro', numero: '1000543-22.2023.8.26.0100', area: AreaDireito.CIVEL, status: ProcessoStatus.ATIVO, valorCausa: 50000, parteAdversa: 'Banco Dinheiro S.A.', responsavel: 'Dr. Juzk IA', dataDistribuicao: '2023-01-15',
          prazos: [{ id: 'pz1', descricao: 'Réplica à Contestação', data: isoToday, status: 'PENDENTE' }],
          audiencias: [{ id: 'au1', data: isoToday + 'T14:00', tipo: 'Conciliação', local: 'Tribunal Digital', status: 'AGENDADA' }],
          historicoAndamentos: [], financeiro: { config: { honorariosContratuais: 5000, percentualExito: 20, percentualSucumbencia: 10 }, transacoes: generateTransactions(4) }
        },
        {
          id: 'p2', office_id: office.id, clienteId: 'c2', titulo: 'Reclamação Trabalhista - Horas Extras', numero: '0010456-88.2023.5.02.0001', area: AreaDireito.TRABALHISTA, status: ProcessoStatus.EM_RECURSO, valorCausa: 120000, parteAdversa: 'Indústrias Metal S.A.', responsavel: 'Dr. Juzk IA', dataDistribuicao: '2023-03-20',
          prazos: [{ id: 'pz2', descricao: 'Contrarrazões ao Recurso', data: new Date(now.getTime() + 86400000 * 3).toISOString().split('T')[0], status: 'PENDENTE' }],
          audiencias: [], historicoAndamentos: [], financeiro: { config: { honorariosContratuais: 3000, percentualExito: 30, percentualSucumbencia: 0 }, transacoes: generateTransactions(3) }
        },
        {
          id: 'p3', office_id: office.id, clienteId: 'c3', titulo: 'Divórcio Consensual e Partilha', numero: '1012345-11.2024.8.19.0001', area: AreaDireito.FAMILIA, status: ProcessoStatus.JULGADO, valorCausa: 450000, parteAdversa: 'Espólio de J. Santos', responsavel: 'Dr. Juzk IA', dataDistribuicao: '2024-02-10',
          prazos: [], audiencias: [], historicoAndamentos: [], financeiro: { config: { honorariosContratuais: 15000, percentualExito: 0, percentualSucumbencia: 0 }, transacoes: generateTransactions(2) }
        },
        {
          id: 'p4', office_id: office.id, clienteId: 'c4', titulo: 'Execução Fiscal - ICMS 2022', numero: '5001234-99.2023.4.03.6100', area: AreaDireito.TRIBUTARIO, status: ProcessoStatus.ATIVO, valorCausa: 2500000, parteAdversa: 'Fazenda Nacional', responsavel: 'Dr. Juzk IA', dataDistribuicao: '2023-11-05',
          prazos: [{ id: 'pz4', descricao: 'Embargos à Execução', data: new Date(now.getTime() + 86400000 * 15).toISOString().split('T')[0], status: 'PENDENTE' }],
          audiencias: [], historicoAndamentos: [], financeiro: { config: { honorariosContratuais: 50000, percentualExito: 10, percentualSucumbencia: 5 }, transacoes: generateTransactions(5) }
        },
        {
          id: 'p5', office_id: office.id, clienteId: 'c6', titulo: 'Usucapião Extraordinária - Lote 42', numero: '0800777-55.2024.8.24.0023', area: AreaDireito.IMOBILIARIO, status: ProcessoStatus.ATIVO, valorCausa: 85000, parteAdversa: 'Loteadora Horizonte', responsavel: 'Dr. Juzk IA', dataDistribuicao: '2024-05-01',
          prazos: [], audiencias: [{ id: 'au5', data: new Date(now.getTime() + 86400000 * 7).toISOString().split('T')[0] + 'T09:30', tipo: 'Instrução', local: '2ª Vara Cível de Floripa', status: 'AGENDADA' }],
          historicoAndamentos: [], financeiro: { config: { honorariosContratuais: 8000, percentualExito: 5, percentualSucumbencia: 0 }, transacoes: generateTransactions(2) }
        },
        { id: 'p6', office_id: office.id, clienteId: 'c1', titulo: 'Cobrança Condominial Ed. Solar', numero: '1000999-00.2024.8.26.0100', area: AreaDireito.CIVEL, status: ProcessoStatus.SUSPENSO, valorCausa: 12000, parteAdversa: 'Condomínio Solar', responsavel: 'Dr. Juzk IA', dataDistribuicao: '2024-01-01', prazos: [], audiencias: [], historicoAndamentos: [], financeiro: { config: { honorariosContratuais: 1500, percentualExito: 10, percentualSucumbencia: 0 }, transacoes: [] } },
        { id: 'p7', office_id: office.id, clienteId: 'c2', titulo: 'Contestação Contrato de Software', numero: '2000555-44.2023.8.26.0000', area: AreaDireito.EMPRESARIAL, status: ProcessoStatus.ATIVO, valorCausa: 300000, parteAdversa: 'SaaS Corp', responsavel: 'Dr. Juzk IA', dataDistribuicao: '2023-08-15', prazos: [], audiencias: [], historicoAndamentos: [], financeiro: { config: { honorariosContratuais: 20000, percentualExito: 15, percentualSucumbencia: 10 }, transacoes: generateTransactions(4) } },
        { id: 'p8', office_id: office.id, clienteId: 'c4', titulo: 'Habeas Corpus - Caso X', numero: '7000111-22.2024.1.00.0000', area: AreaDireito.PENAL, status: ProcessoStatus.ATIVO, valorCausa: 0, parteAdversa: 'Ministério Público', responsavel: 'Dr. Juzk IA', dataDistribuicao: '2024-06-10', prazos: [], audiencias: [], historicoAndamentos: [], financeiro: { config: { honorariosContratuais: 25000, percentualExito: 0, percentualSucumbencia: 0 }, transacoes: generateTransactions(1) } },
        { id: 'p9', office_id: office.id, clienteId: 'c6', titulo: 'Revisional de Aluguel Comercial', numero: '3000888-77.2023.8.26.0100', area: AreaDireito.IMOBILIARIO, status: ProcessoStatus.JULGADO, valorCausa: 150000, parteAdversa: 'Shopping Center', responsavel: 'Dr. Juzk IA', dataDistribuicao: '2023-05-10', prazos: [], audiencias: [], historicoAndamentos: [], financeiro: { config: { honorariosContratuais: 10000, percentualExito: 20, percentualSucumbencia: 0 }, transacoes: generateTransactions(3) } },
        { id: 'p10', office_id: office.id, clienteId: 'c3', titulo: 'Aposentadoria por Tempo de Contribuição', numero: '5010000-12.2024.4.04.7000', area: AreaDireito.PREVIDENCIARIO, status: ProcessoStatus.ATIVO, valorCausa: 95000, parteAdversa: 'INSS', responsavel: 'Dr. Juzk IA', dataDistribuicao: '2024-03-01', prazos: [], audiencias: [], historicoAndamentos: [], financeiro: { config: { honorariosContratuais: 0, percentualExito: 30, percentualSucumbencia: 0 }, transacoes: [] } }
      ];

      // 3. TIMESHEET (12 registros)
      const demoTimesheet: TimesheetEntry[] = [];
      const descriptions = ['Análise de documentos', 'Reunião com cliente', 'Elaboração de petição inicial', 'Pesquisa de jurisprudência', 'Cálculos de liquidação', 'Protocolo de recurso'];
      for (let i = 0; i < 12; i++) {
        demoTimesheet.push({
          id: `ts-${i}`,
          office_id: office.id,
          advogado: 'Dr. Juzk IA',
          processoId: demoCases[Math.floor(Math.random() * 5)].id,
          descricao: descriptions[Math.floor(Math.random() * descriptions.length)],
          data: isoToday,
          horas: 1 + Math.random() * 4,
          faturavel: Math.random() > 0.2
        });
      }

      // 4. TESES (3 registros)
      const demoTheses: Tese[] = [
        { id: 't1', office_id: office.id, titulo: 'Prescrição Intercorrente no Processo Executivo', area: AreaDireito.CIVEL, descricao: 'Análise detalhada sobre os marcos interruptivos da prescrição.', conteudo: 'O conteúdo detalhado desta tese aborda o REsp 1.604.412/SC...', dataCriacao: new Date().toISOString() },
        { id: 't2', office_id: office.id, titulo: 'Inexigibilidade de ISS sobre Software as a Service', area: AreaDireito.TRIBUTARIO, descricao: 'Tese baseada no julgamento das ADIs 5659 e 1945 pelo STF.', conteudo: 'O STF definiu que sobre o licenciamento de software incide apenas o ISS...', dataCriacao: new Date().toISOString() },
        { id: 't3', office_id: office.id, titulo: 'Dano Moral in re ipsa no Atraso de Voo', area: AreaDireito.CIVEL, descricao: 'Evolução do entendimento do STJ sobre a necessidade de prova do dano.', conteudo: 'Atualmente o STJ exige prova de que o atraso causou real transtorno...', dataCriacao: new Date().toISOString() }
      ];

      // PERSISTÊNCIA
      if (!isSupabaseConfigured) {
        saveLocal(LS_KEYS.CLIENTS, [...JSON.parse(localStorage.getItem(LS_KEYS.CLIENTS) || '[]'), ...demoClients]);
        saveLocal(LS_KEYS.CASES, [...JSON.parse(localStorage.getItem(LS_KEYS.CASES) || '[]'), ...demoCases]);
        saveLocal(LS_KEYS.THESES, [...JSON.parse(localStorage.getItem(LS_KEYS.THESES) || '[]'), ...demoTheses]);
        saveLocal(LS_KEYS.TIMESHEET, [...JSON.parse(localStorage.getItem(LS_KEYS.TIMESHEET) || '[]'), ...demoTimesheet]);
      } else {
        await supabase.from('clients').insert(demoClients.map(c => ({...c, office_id: office.id})));
        await supabase.from('cases').insert(demoCases.map(c => ({
          office_id: office.id, numero: c.numero, titulo: c.titulo, cliente_id: c.clienteId, parte_adversa: c.parteAdversa,
          area: c.area, status: c.status, valor_causa: c.valorCausa, data_distribuicao: c.dataDistribuicao,
          responsavel: c.responsavel, financeiro: c.financeiro, prazos: c.prazos, audiencias: c.audiencias, historico_andamentos: c.historicoAndamentos
        })));
        await supabase.from('timesheet').insert(demoTimesheet.map(ts => ({
          office_id: office.id, advogado: ts.advogado, case_id: ts.processoId, descricao: ts.descricao, data: ts.data, horas: ts.horas, faturavel: ts.faturavel
        })));
        await supabase.from('theses').insert(demoTheses.map(t => ({...t, office_id: office.id, data_criacao: t.dataCriacao})));
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
