
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
}

const DataContext = createContext<DataContextType>({} as DataContextType);

// Initial Mock Data to populate if empty
const MOCK_CLIENTS: Cliente[] = [
  { id: '1', nome: 'João da Silva', tipo: 'PF', documento: '123.456.789-00', email: 'joao@email.com', telefone: '(11) 99999-9999', cidade: 'São Paulo', status: 'Ativo' },
  { id: '2', nome: 'Indústria ABC Ltda', tipo: 'PJ', documento: '12.345.678/0001-90', email: 'contato@abc.com', telefone: '(11) 3333-4444', cidade: 'Campinas', status: 'Ativo' }
];

const MOCK_CASES: Processo[] = [
  {
    id: '1', numero: '0001234-56.2023.8.26.0100', titulo: 'Silva vs Construtora XYZ', clienteId: '1', parteAdversa: 'Construtora XYZ',
    area: AreaDireito.CIVEL, status: ProcessoStatus.ATIVO, valorCausa: 150000, dataDistribuicao: '2023-05-12', responsavel: 'Dr. Carlos',
    prazoFatal: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    proximaAudiencia: undefined,
    ultimoAndamento: { data: '2023-10-20', descricao: 'Publicação de despacho saneador.' },
    historicoAndamentos: [], 
    prazos: [],
    audiencias: [],
    financeiro: {
      config: { honorariosContratuais: 5000, percentualExito: 20, percentualSucumbencia: 10 },
      transacoes: []
    },
    customData: {}
  }
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [cases, setCases] = useState<Processo[]>([]);
  const [theses, setTheses] = useState<Tese[]>([]);

  // Load from LocalStorage on mount
  useEffect(() => {
    const loadedClients = localStorage.getItem('nexus_clients');
    const loadedCases = localStorage.getItem('nexus_cases');
    const loadedTheses = localStorage.getItem('nexus_theses');

    setClients(loadedClients ? JSON.parse(loadedClients) : MOCK_CLIENTS);
    setCases(loadedCases ? JSON.parse(loadedCases) : MOCK_CASES);
    setTheses(loadedTheses ? JSON.parse(loadedTheses) : []);
  }, []);

  // Save to LocalStorage on change
  useEffect(() => localStorage.setItem('nexus_clients', JSON.stringify(clients)), [clients]);
  useEffect(() => localStorage.setItem('nexus_cases', JSON.stringify(cases)), [cases]);
  useEffect(() => localStorage.setItem('nexus_theses', JSON.stringify(theses)), [theses]);

  // CRUD Operations - Using Functional Updates for Safety
  const addClient = (client: Cliente) => setClients(prev => [...prev, client]);
  const updateClient = (client: Cliente) => setClients(prev => prev.map(c => String(c.id) === String(client.id) ? client : c));
  // Force String comparison to avoid type mismatch issues (number vs string in LS)
  const deleteClient = (id: string) => setClients(prev => prev.filter(c => String(c.id) !== String(id)));

  const addCase = (processo: Processo) => setCases(prev => [...prev, processo]);
  const updateCase = (processo: Processo) => setCases(prev => prev.map(c => String(c.id) === String(processo.id) ? processo : c));
  const deleteCase = (id: string) => setCases(prev => prev.filter(c => String(c.id) !== String(id)));

  const addAndamento = (processoId: string, andamento: Andamento) => {
    setCases(prevCases => prevCases.map(c => {
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

  return (
    <DataContext.Provider value={{ 
      clients, addClient, updateClient, deleteClient,
      cases, addCase, updateCase, deleteCase, addAndamento,
      theses, addThesis, updateThesis, deleteThesis
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
