
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

export interface CustomFieldConfig {
  id: string;
  area: AreaDireito;
  label: string;
  type: 'text' | 'date' | 'number' | 'currency';
}

export interface ContatoAssociado {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  telefone: string;
}

export interface Cliente {
  id: string;
  nome: string;
  tipo: 'PF' | 'PJ';
  documento: string; // CPF or CNPJ
  email: string;
  telefone: string;
  cidade: string;
  status: 'Ativo' | 'Inativo';
  contatos?: ContatoAssociado[];
}

export interface Tese {
  id: string;
  titulo: string;
  area: AreaDireito;
  descricao: string;
  conteudo: string;
  dataCriacao: string;
}

export interface Andamento {
  id: string;
  data: string;
  descricao: string;
  tipo: 'PUBLICACAO' | 'MOVIMENTACAO' | 'INTERNO';
}

export interface Prazo {
  id: string;
  data: string; // ISO Date
  descricao: string;
  status: 'PENDENTE' | 'CONCLUIDO';
}

export interface Audiencia {
  id: string;
  data: string; // ISO Date with Time
  tipo: string; // ex: Una, Instrução, Conciliação
  local?: string; // Link ou Endereço
  status: 'AGENDADA' | 'REALIZADA' | 'CANCELADA';
  observacao?: string;
}

// --- NOVO: Módulo Financeiro do Processo ---
export interface ConfigHonorarios {
  honorariosContratuais: number; // Valor Fixo
  percentualExito: number; // %
  percentualSucumbencia: number; // %
}

export interface TransacaoProcesso {
  id: string;
  data: string;
  descricao: string;
  tipo: 'RECEITA' | 'DESPESA'; // Receita (Alvará), Despesa (Custas)
  valor: number;
  categoria: string; // ex: Alvará, Custas Judiciais, Perito, Acordo
}

export interface Processo {
  id: string;
  numero: string;
  titulo: string;
  clienteId: string; // Link to Cliente ID
  parteAdversa: string;
  area: AreaDireito;
  status: ProcessoStatus;
  valorCausa: number;
  dataDistribuicao: string;
  
  // Resumo calculado automaticamente (para dashboards/cards)
  proximaAudiencia?: string; 
  prazoFatal?: string; 
  ultimoAndamento?: {
    data: string;
    descricao: string;
  };

  // Listas detalhadas
  prazos: Prazo[];
  audiencias: Audiencia[];
  historicoAndamentos: Andamento[];
  
  // Módulo Financeiro Interno
  financeiro?: {
    config: ConfigHonorarios;
    transacoes: TransacaoProcesso[];
  };
  
  customData: Record<string, string | number>;
  responsavel: string;
}

export interface FinanceiroRegistro {
  id: string;
  descricao: string;
  tipo: 'RECEITA' | 'DESPESA';
  valor: number;
  dataVencimento: string;
  status: 'PAGO' | 'PENDENTE' | 'ATRASADO';
  categoria: string;
}

export interface TimesheetEntry {
  id: string;
  advogado: string;
  processoId: string;
  descricao: string;
  data: string;
  horas: number;
  faturavel: boolean;
}
