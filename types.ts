
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

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OFFICE_ADMIN = 'OFFICE_ADMIN',
  LAWYER = 'LAWYER',
  STAFF = 'STAFF'
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
  role: UserRole;
}

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

export interface Prazo {
  id: string;
  data: string;
  descricao: string;
  status: 'PENDENTE' | 'CONCLUIDO';
}

export interface Audiencia {
  id: string;
  data: string;
  tipo: string;
  local?: string;
  status: 'AGENDADA' | 'REALIZADA' | 'CANCELADA';
}

export interface Andamento {
  id: string;
  data: string;
  descricao: string;
  tipo: string;
}

export interface TransacaoProcesso {
  id: string;
  data: string;
  descricao: string;
  tipo: 'RECEITA' | 'DESPESA';
  valor: number;
  categoria: string;
}

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

export interface CustomFieldConfig {
  id: string;
  area: AreaDireito;
  label: string;
  type: 'text' | 'date' | 'number';
}
