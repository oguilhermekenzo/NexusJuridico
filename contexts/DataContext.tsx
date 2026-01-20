
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

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [cases, setCases] = useState<Processo[]>([]);
  const [theses, setTheses] = useState<Tese[]>([]);

  // Load from LocalStorage on mount
  useEffect(() => {
    const loadedClients = localStorage.getItem('nexus_clients');
    const loadedCases = localStorage.getItem('nexus_cases');
    const loadedTheses = localStorage.getItem('nexus_theses');

    setClients(loadedClients ? JSON.parse(loadedClients) : []);
    setCases(loadedCases ? JSON.parse(loadedCases) : []);
    setTheses(loadedTheses ? JSON.parse(loadedTheses) : []);
  }, []);

  // Save to LocalStorage on change
  useEffect(() => localStorage.setItem('nexus_clients', JSON.stringify(clients)), [clients]);
  useEffect(() => localStorage.setItem('nexus_cases', JSON.stringify(cases)), [cases]);
  useEffect(() => localStorage.setItem('nexus_theses', JSON.stringify(theses)), [theses]);

  // CRUD Operations
  const addClient = (client: Cliente) => setClients(prev => [...prev, client]);
  const updateClient = (client: Cliente) => setClients(prev => prev.map(c => String(c.id) === String(client.id) ? client : c));
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

  const clearAllData = () => {
    setClients([]);
    setCases([]);
    setTheses([]);
    localStorage.removeItem('nexus_clients');
    localStorage.removeItem('nexus_cases');
    localStorage.removeItem('nexus_theses');
  };

  const seedMockData = () => {
    // 1. GENERATE 12 CLIENTS (Mix of PF/PJ)
    const mockClients: Cliente[] = [
      { id: 'c1', nome: 'João Silva Meira', tipo: 'PF', documento: '123.456.789-00', email: 'joao.silva@email.com', telefone: '(11) 98888-7777', cidade: 'São Paulo - SP', status: 'Ativo' },
      { id: 'c2', nome: 'Indústrias Metalúrgicas S.A.', tipo: 'PJ', documento: '12.345.678/0001-99', email: 'contato@metalurgica.com.br', telefone: '(11) 3333-4444', cidade: 'Sorocaba - SP', status: 'Ativo', contatos: [{ id: 'ct1', nome: 'Roberto Souza', cargo: 'Gerente Jurídico', email: 'roberto@metalurgica.com.br', telefone: '(11) 97777-6666' }] },
      { id: 'c3', nome: 'Maria Oliveira Santos', tipo: 'PF', documento: '987.654.321-11', email: 'maria.oliveira@email.com', telefone: '(21) 99999-8888', cidade: 'Rio de Janeiro - RJ', status: 'Ativo' },
      { id: 'c4', nome: 'Tech Solutions Ltda', tipo: 'PJ', documento: '44.555.666/0001-44', email: 'juridico@techsolutions.com', telefone: '(11) 4004-5555', cidade: 'São Bernardo - SP', status: 'Ativo' },
      { id: 'c5', nome: 'Carlos Alberto Ferreira', tipo: 'PF', documento: '456.123.789-44', email: 'carlos.ferreira@web.com', telefone: '(31) 98765-4321', cidade: 'Belo Horizonte - MG', status: 'Ativo' },
      { id: 'c6', nome: 'Banco Digital S.A.', tipo: 'PJ', documento: '00.111.222/0001-33', email: 'processos@bancodigital.com', telefone: '(11) 3003-0000', cidade: 'São Paulo - SP', status: 'Ativo' },
      { id: 'c7', nome: 'Fernanda Lima Souza', tipo: 'PF', documento: '111.222.333-44', email: 'fernanda.souza@gmail.com', telefone: '(41) 99123-4567', cidade: 'Curitiba - PR', status: 'Ativo' },
      { id: 'c8', nome: 'Construtora Horizonte Ltda', tipo: 'PJ', documento: '99.888.777/0001-66', email: 'contato@horizonte.eng.br', telefone: '(11) 2222-3333', cidade: 'Santos - SP', status: 'Ativo' },
      { id: 'c9', nome: 'Ricardo Mendes', tipo: 'PF', documento: '777.888.999-00', email: 'ricardo.mendes@uol.com.br', telefone: '(19) 98122-1100', cidade: 'Campinas - SP', status: 'Inativo' },
      { id: 'c10', nome: 'Supermercados Preço Baixo', tipo: 'PJ', documento: '55.444.333/0001-22', email: 'admin@precobaixo.com', telefone: '(11) 5555-1111', cidade: 'São Paulo - SP', status: 'Ativo' },
      { id: 'c11', nome: 'Patrícia Rocha', tipo: 'PF', documento: '000.111.222-33', email: 'patricia.rocha@adv.com', telefone: '(81) 98877-6655', cidade: 'Recife - PE', status: 'Ativo' },
      { id: 'c12', nome: 'Logística Express S.A.', tipo: 'PJ', documento: '10.200.300/0001-40', email: 'expedicao@logexpress.com', telefone: '(11) 9999-0000', cidade: 'Guarulhos - SP', status: 'Ativo' }
    ];

    // 2. GENERATE 15 CASES (Covering all AreaDireito)
    const areas = Object.values(AreaDireito);
    const mockCases: Processo[] = Array.from({ length: 15 }).map((_, i) => {
      const area = areas[i % areas.length];
      const client = mockClients[i % mockClients.length];
      const caseId = `p${i + 1}`;
      
      return {
        id: caseId,
        numero: `${1000000 + i}-55.2024.8.26.0${100 + i}`,
        titulo: `${area} - Caso de Demonstração #${i + 1}`,
        clienteId: client.id,
        parteAdversa: i % 2 === 0 ? 'Empresa Reclamada S.A.' : 'Estado de São Paulo',
        area: area,
        status: i % 5 === 0 ? ProcessoStatus.EM_RECURSO : ProcessoStatus.ATIVO,
        valorCausa: 15000 * (i + 1),
        dataDistribuicao: '2024-01-15',
        prazos: [
          { id: `pr${i}`, data: '2025-05-10', descricao: 'Petição de Manifestação', status: 'PENDENTE' }
        ],
        audiencias: i % 3 === 0 ? [
          { id: `au${i}`, data: '2025-06-20T14:00', tipo: 'Instrução', local: 'Sala Virtual Zoom', status: 'AGENDADA' }
        ] : [],
        historicoAndamentos: [
          { id: `h${i}1`, data: '2024-02-10', descricao: 'Processo devidamente citado.', tipo: 'MOVIMENTACAO' },
          { id: `h${i}2`, data: '2024-01-15', descricao: 'Protocolo da Inicial realizado com sucesso.', tipo: 'MOVIMENTACAO' }
        ],
        ultimoAndamento: { data: '2024-02-10', descricao: 'Processo devidamente citado.' },
        financeiro: {
          config: { honorariosContratuais: 2500, percentualExito: 20, percentualSucumbencia: 10 },
          transacoes: [
             { id: `t${i}`, data: '2024-01-20', descricao: 'Honorários de Pro-labore', tipo: 'RECEITA', valor: 2500, categoria: 'Honorários' }
          ]
        },
        customData: {},
        responsavel: 'Dr. Nexus IA'
      };
    });

    // 3. GENERATE 10 THESES
    const mockTheses: Tese[] = Array.from({ length: 10 }).map((_, i) => {
      const area = areas[i % areas.length];
      return {
        id: `t${i + 1}`,
        titulo: `Tese Jurídica sobre ${area} - Estudo #${i + 1}`,
        area: area,
        descricao: `Esta tese aborda os principais entendimentos do STF e STJ sobre as nuances do Direito ${area} no contexto atual.`,
        conteudo: `O presente estudo jurídico visa analisar a fundamentação legal aplicável... \n\n1. Da fundamentação...\n2. Da Jurisprudência consolidada...`,
        dataCriacao: new Date().toISOString()
      };
    });

    setClients(mockClients);
    setCases(mockCases);
    setTheses(mockTheses);
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
