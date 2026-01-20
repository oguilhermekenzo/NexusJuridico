
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Cliente, Processo, Tese, AreaDireito, ProcessoStatus, Andamento } from '../types';

interface DataContextType {
  clients: Cliente[];
  cases: Processo[];
  theses: Tese[];
  addClient: (client: Cliente) => void;
  updateClient: (client: Cliente) => void;
  deleteClient: (id: string) => void;
  addCase: (processo: Processo) => void;
  updateCase: (processo: Processo) => void;
  deleteCase: (id: string) => void;
  addAndamento: (processoId: string, andamento: Andamento) => void;
  addThesis: (tese: Tese) => void;
  updateThesis: (tese: Tese) => void;
  deleteThesis: (id: string) => void;
  seedMockData: () => void;
  clearAllData: () => void;
}

const DataContext = createContext<DataContextType>({} as DataContextType);

// Helper para persistência segura em frames
const safeStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("Nexus: Acesso ao Storage negado. Usando fallback em memória.");
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Falha silenciosa se bloqueado
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  },
  clear: () => {
    try {
      // Limpamos apenas as chaves do Nexus para ser mais seguro em ambientes compartilhados
      localStorage.removeItem('nexus_clients');
      localStorage.removeItem('nexus_cases');
      localStorage.removeItem('nexus_theses');
    } catch (e) {}
  }
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Cliente[]>(() => {
    const saved = safeStorage.getItem('nexus_clients');
    return saved ? JSON.parse(saved) : [];
  });

  const [cases, setCases] = useState<Processo[]>(() => {
    const saved = safeStorage.getItem('nexus_cases');
    return saved ? JSON.parse(saved) : [];
  });

  const [theses, setTheses] = useState<Tese[]>(() => {
    const saved = safeStorage.getItem('nexus_theses');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    safeStorage.setItem('nexus_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    safeStorage.setItem('nexus_cases', JSON.stringify(cases));
  }, [cases]);

  useEffect(() => {
    safeStorage.setItem('nexus_theses', JSON.stringify(theses));
  }, [theses]);

  const addClient = (client: Cliente) => setClients(prev => [...prev, client]);
  const updateClient = (client: Cliente) => setClients(prev => prev.map(c => String(c.id) === String(client.id) ? client : c));
  const deleteClient = (id: string) => setClients(prev => prev.filter(c => String(c.id) !== String(id)));

  const addCase = (processo: Processo) => setCases(prev => [...prev, processo]);
  const updateCase = (processo: Processo) => setCases(prev => prev.map(c => String(c.id) === String(processo.id) ? processo : c));
  const deleteCase = (id: string) => setCases(prev => prev.filter(c => String(c.id) !== String(id)));

  const addAndamento = (processoId: string, andamento: Andamento) => {
    setCases(prev => prev.map(c => {
      if (String(c.id) === String(processoId)) {
        return {
          ...c,
          ultimoAndamento: { data: andamento.data, descricao: andamento.descricao },
          historicoAndamentos: [andamento, ...c.historicoAndamentos]
        };
      }
      return c;
    }));
  };

  const addThesis = (tese: Tese) => setTheses(prev => [...prev, tese]);
  const updateThesis = (tese: Tese) => setTheses(prev => prev.map(t => String(t.id) === String(tese.id) ? tese : t));
  const deleteThesis = (id: string) => setTheses(prev => prev.filter(t => String(t.id) !== String(id)));

  const clearAllData = () => {
    console.log("Nexus: Limpando banco de dados...");
    setClients([]);
    setCases([]);
    setTheses([]);
    safeStorage.clear();
  };

  const seedMockData = () => {
    console.log("Nexus: Iniciando Seed de dados...");
    const areas = Object.values(AreaDireito);
    const statuses = Object.values(ProcessoStatus);
    const today = new Date();
    
    const mockClients: Cliente[] = Array.from({ length: 15 }).map((_, i) => ({
      id: `c${i + 1}`,
      nome: i % 2 === 0 ? `Pessoa Física Demo ${i + 1}` : `Empresa Multinacional ${i + 1} S/A`,
      tipo: i % 2 === 0 ? 'PF' : 'PJ',
      documento: i % 2 === 0 ? `123.456.789-${i}${i}` : `12.345.678/0001-${i}${i}`,
      email: `contato${i}@nexuslegal.com.br`,
      telefone: `(11) 98888-000${i}`,
      cidade: 'São Paulo - SP',
      status: 'Ativo'
    }));

    const mockCases: Processo[] = Array.from({ length: 20 }).map((_, i) => {
      const area = areas[i % areas.length];
      const client = mockClients[i % mockClients.length];
      const distributionDate = new Date(today.getFullYear(), today.getMonth() - (i % 6), today.getDate() - (i * 2));
      
      return {
        id: `p${i + 1}`,
        numero: `${2024000 + i}-55.2024.8.26.0${100 + i}`,
        titulo: `${area} - Caso Estratégico #${i + 1}`,
        clienteId: client.id,
        parteAdversa: 'Oponente de Mercado Ltda',
        area: area,
        status: statuses[i % statuses.length],
        valorCausa: 25000 * (i + 1),
        dataDistribuicao: distributionDate.toISOString().split('T')[0],
        prazos: [{ id: `pr${i}`, data: '2025-11-20', descricao: 'Manifestação sobre Contestação', status: 'PENDENTE' }],
        audiencias: i % 4 === 0 ? [{ id: `au${i}`, data: '2025-12-15T14:30', tipo: 'Instrução', local: 'Tribunal Online', status: 'AGENDADA' }] : [],
        historicoAndamentos: [{ id: `h${i}`, data: distributionDate.toISOString().split('T')[0], descricao: 'Ação protocolada e sistema atualizado.', tipo: 'MOVIMENTACAO' }],
        ultimoAndamento: { data: distributionDate.toISOString().split('T')[0], descricao: 'Ação protocolada e sistema atualizado.' },
        financeiro: {
          config: { honorariosContratuais: 4500, percentualExito: 20, percentualSucumbencia: 10 },
          transacoes: [
            { id: `t1-${i}`, data: distributionDate.toISOString(), descricao: 'Honorários Pró-labore', tipo: 'RECEITA', valor: 4500, categoria: 'Honorários' },
            { id: `t2-${i}`, data: today.toISOString(), descricao: 'Custas de Protocolo', tipo: 'DESPESA', valor: 350.50, categoria: 'Custas' }
          ]
        },
        customData: {},
        responsavel: 'Dr. Nexus IA'
      };
    });

    const mockTheses: Tese[] = Array.from({ length: 10 }).map((_, i) => ({
      id: `t${i + 1}`,
      titulo: `Tese de Defesa: Direito ${areas[i % areas.length]} #${i + 1}`,
      area: areas[i % areas.length],
      descricao: `Compêndio jurídico atualizado sobre Direito ${areas[i % areas.length]} focado em 2024/2025.`,
      conteudo: `Este é um conteúdo demonstrativo da biblioteca de teses da Nexus para ${areas[i % areas.length]}.`,
      dataCriacao: new Date().toISOString()
    }));

    // Sincronização forçada imediata
    safeStorage.setItem('nexus_clients', JSON.stringify(mockClients));
    safeStorage.setItem('nexus_cases', JSON.stringify(mockCases));
    safeStorage.setItem('nexus_theses', JSON.stringify(mockTheses));

    setClients(mockClients);
    setCases(mockCases);
    setTheses(mockTheses);
    
    console.log("Nexus: Banco de dados populado com sucesso.");
  };

  return (
    <DataContext.Provider value={{ 
      clients, addClient, updateClient, deleteClient,
      cases, addCase, updateCase, deleteCase, addAndamento,
      theses, addThesis, updateThesis, deleteThesis,
      seedMockData, clearAllData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
