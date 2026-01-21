
export enum AreaDireito {
  CIVEL = 'Cível',
  TRABALHISTA = 'Trabalhista',
  TRIBUTARIO = 'Tributário',
  PENAL = 'Penal',
  FAMILIA = 'Família',
  EMPRESARIAL = 'Empresarial',
  BANCARIO = 'Bancário',
  PREVIDENCIARIO = 'Previdenciário',
  IMOBILIARIO = 'Imobiliário'
}

export enum ProcessoStatus {
  ATIVO = 'Ativo',
  SUSPENSO = 'Suspenso',
  ARQUIVADO = 'Arquivado',
  EM_RECURSO = 'Em Recurso',
  JULGADO = 'Julgado'
}

export interface Office {
  id: string;
  name: string;
}

export interface AppUser {
  id: string;
  email: string;
  officeId: string;
  name?: string;
}

// Added ContatoAssociado interface for Client management
export interface ContatoAssociado {
  id: string;
  nome: string;
  cargo?: string;
  email?: string;
  telefone?: string;
}

export interface Cliente {
  id: string;
  office_id: string;
  nome: string;
  tipo: 'PF' | 'PJ';
  documento: string;
  email: string;
  telefone: string;
  cidade: string;
  status: 'Ativo' | 'Inativo';
  contatos?: ContatoAssociado[];
}

export interface Tese {
  id: string;
  office_id: string;
  titulo: string;
  area: AreaDireito;
  descricao: string;
  conteudo: string;
  dataCriacao: string;
}

// Added Prazo interface for Process management
export interface Prazo {
  id: string;
  data: string;
  descricao: string;
  status: 'PENDENTE' | 'CONCLUIDO';
}

// Added Audiencia interface for Process management
export interface Audiencia {
  id: string;
  data: string;
  tipo: string;
  local?: string;
  status: 'AGENDADA' | 'REALIZADA' | 'CANCELADA';
}

// Added Andamento interface for Process management
export interface Andamento {
  id: string;
  data: string;
  descricao: string;
  tipo: string;
}

// Added TransacaoProcesso interface for Process finance management
export interface TransacaoProcesso {
  id: string;
  data: string;
  descricao: string;
  tipo: 'RECEITA' | 'DESPESA';
  valor: number;
  categoria: string;
}

// Updated Processo interface with specific types instead of any
export interface Processo {
  id: string;
  office_id: string;
  numero: string;
  titulo: string;
  clienteId: string;
  parteAdversa: string;
  area: AreaDireito;
  status: ProcessoStatus;
  valorCausa: number;
  dataDistribuicao: string;
  prazos: Prazo[];
  audiencias: Audiencia[];
  historicoAndamentos: Andamento[];
  financeiro: {
    config: {
      honorariosContratuais: number;
      percentualExito: number;
      percentualSucumbencia: number;
    };
    transacoes: TransacaoProcesso[];
  };
  responsavel: string;
  prazoFatal?: boolean;
  ultimoAndamento?: { data: string; descricao: string };
  customData?: Record<string, any>;
}

export interface TimesheetEntry {
  id: string;
  office_id: string;
  advogado: string;
  processoId: string;
  descricao: string;
  data: string;
  horas: number;
  faturavel: boolean;
}

// Added CustomFieldConfig interface for dynamic field management
export interface CustomFieldConfig {
  id: string;
  area: AreaDireito;
  label: string;
  type: 'text' | 'date' | 'number';
}
