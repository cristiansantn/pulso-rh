/** Tipos de dominio. Os nomes de campo espelham as colunas do banco. */

export type StatusColaborador = "ativo" | "afastado" | "ferias" | "desligado";

export type TipoDesligamento = "voluntario" | "involuntario";

export interface Setor {
  id: string;
  nome: string;
  headcount_planejado: number;
}

export interface Cargo {
  id: string;
  nome: string;
}

export interface Colaborador {
  id: string;
  matricula: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  data_nascimento: string | null;
  cidade: string | null;
  bairro: string | null;
  cep: string | null;
  regiao: string | null;
  tempo_deslocamento_min: number | null;
  genero: string | null;
  pcd: boolean;
  escolaridade: string | null;
  setor_id: string | null;
  cargo_id: string | null;
  gestor_id: string | null;
  data_admissao: string | null;
  tipo_contrato: string | null;
  jornada: string | null;
  turno: Turno | null;
  status: StatusColaborador;
  data_desligamento: string | null;
  tipo_desligamento: TipoDesligamento | null;
  motivo_desligamento: string | null;
  setor: { nome: string } | null;
  cargo: { nome: string } | null;
  gestor: { nome: string } | null;
}

/** Dados aceitos no cadastro de um novo colaborador. */
export type NovoColaborador = Omit<Colaborador, "id" | "setor" | "cargo" | "gestor">;

/** Campos editaveis apos o cadastro (o desligamento tem fluxo proprio). */
export type ColaboradorEditavel = Partial<NovoColaborador>;

export const STATUS_LABELS: Record<StatusColaborador, string> = {
  ativo: "Ativo",
  afastado: "Afastado",
  ferias: "Férias",
  desligado: "Desligado",
};

export const TIPOS_CONTRATO = ["CLT", "Temporário", "Estágio", "Jovem Aprendiz", "PJ"];

export type Turno = "manha" | "tarde" | "noite";

export const TURNOS: Record<Turno, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

export const ESCOLARIDADES = [
  "Ensino Fundamental",
  "Ensino Médio",
  "Ensino Técnico",
  "Superior Incompleto",
  "Superior Completo",
  "Pós-graduação",
];

export const GENEROS = ["Feminino", "Masculino", "Não binário", "Prefiro não informar"];

export const TIPOS_DESLIGAMENTO: Record<TipoDesligamento, string> = {
  voluntario: "Voluntário",
  involuntario: "Involuntário",
};

/**
 * Lista controlada de motivos de saida. Nunca texto livre: motivos livres
 * viram porta de entrada para dados sensiveis e impedem a agregacao.
 */
export const MOTIVOS_DESLIGAMENTO: Record<string, string> = {
  salario: "Salário",
  escala: "Escala",
  gestao: "Gestão",
  distancia: "Distância",
  nova_oportunidade: "Nova oportunidade",
  desempenho: "Desempenho",
  adaptacao: "Adaptação",
  carreira: "Carreira",
  outro: "Outro",
};

/** Ocorrencias de frequencia sem carater de saude (Fase 3). */
export type TipoOcorrencia =
  | "falta_injustificada"
  | "falta_justificada"
  | "atraso"
  | "saida_antecipada"
  | "folga"
  | "ferias";

export interface Ocorrencia {
  id: string;
  colaborador_id: string;
  tipo: TipoOcorrencia;
  data_inicio: string;
  /** Nulo quando a ocorrencia dura um unico dia. */
  data_fim: string | null;
  /** Preenchido apenas em atraso e saida antecipada. */
  minutos: number | null;
}

export type NovaOcorrencia = Omit<Ocorrencia, "id">;

export const TIPOS_OCORRENCIA: Record<TipoOcorrencia, string> = {
  falta_injustificada: "Falta injustificada",
  falta_justificada: "Falta justificada",
  atraso: "Atraso",
  saida_antecipada: "Saída antecipada",
  folga: "Folga",
  ferias: "Férias",
};

/** Tipos de ocorrencia que contam como dia perdido no absenteismo. */
export const TIPOS_DIA_PERDIDO: TipoOcorrencia[] = [
  "falta_injustificada",
  "falta_justificada",
];

/**
 * Afastamentos e atestados: dados relacionados a saude, mantidos em tabela
 * separada (LGPD). Categoria e lista controlada, nunca texto livre — texto
 * livre vira porta de entrada para diagnosticos e outros dados sensiveis.
 */
export type TipoAfastamento = "atestado" | "afastamento";

export type CategoriaAfastamento =
  | "doenca"
  | "acidente_trabalho"
  | "licenca_maternidade"
  | "licenca_paternidade"
  | "inss"
  | "acompanhamento_familiar"
  | "outro";

export interface Afastamento {
  id: string;
  colaborador_id: string;
  tipo: TipoAfastamento;
  categoria: CategoriaAfastamento;
  data_inicio: string;
  /** Data de retorno prevista; nula quando indeterminada. */
  data_fim: string | null;
}

export type NovoAfastamento = Omit<Afastamento, "id">;

export const TIPOS_AFASTAMENTO: Record<TipoAfastamento, string> = {
  atestado: "Atestado",
  afastamento: "Afastamento",
};

export const CATEGORIAS_AFASTAMENTO: Record<CategoriaAfastamento, string> = {
  doenca: "Doença",
  acidente_trabalho: "Acidente de trabalho",
  licenca_maternidade: "Licença-maternidade",
  licenca_paternidade: "Licença-paternidade",
  inss: "Afastamento INSS",
  acompanhamento_familiar: "Acompanhamento familiar",
  outro: "Outro",
};

/** Vagas e recrutamento (Fase 4). */

export type MotivoVaga = "reposicao" | "expansao";

export type StatusVaga = "aberta" | "concluida" | "cancelada";

export type EtapaVaga =
  | "solicitacao"
  | "aprovacao"
  | "divulgacao"
  | "triagem"
  | "entrevista"
  | "proposta"
  | "admissao";

/** Ordem do fluxo. A admissao encerra a vaga e tem acoes proprias. */
export const FLUXO_VAGA: EtapaVaga[] = [
  "solicitacao",
  "aprovacao",
  "divulgacao",
  "triagem",
  "entrevista",
  "proposta",
  "admissao",
];

export const ETAPAS_VAGA: Record<EtapaVaga, string> = {
  solicitacao: "Solicitação",
  aprovacao: "Aprovação",
  divulgacao: "Divulgação",
  triagem: "Triagem",
  entrevista: "Entrevista",
  proposta: "Proposta",
  admissao: "Admissão",
};

export const MOTIVOS_VAGA: Record<MotivoVaga, string> = {
  reposicao: "Reposição",
  expansao: "Expansão",
};

export const STATUS_VAGA: Record<StatusVaga, string> = {
  aberta: "Aberta",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export interface Vaga {
  id: string;
  setor_id: string;
  cargo_id: string;
  turno: Turno | null;
  motivo: MotivoVaga;
  /** Desligado que a vaga repoe; so faz sentido quando o motivo e reposicao. */
  colaborador_substituido_id: string | null;
  gestor_solicitante_id: string | null;
  data_abertura: string;
  /** Meta de preenchimento; vaga aberta alem desta data conta como em atraso. */
  data_limite: string | null;
  etapa: EtapaVaga;
  status: StatusVaga;
  data_fechamento: string | null;
  admitido_colaborador_id: string | null;
  setor: { nome: string } | null;
  cargo: { nome: string } | null;
  gestor_solicitante: { nome: string } | null;
}

/** Dados aceitos na abertura de uma vaga; o fluxo comeca em solicitacao. */
export type NovaVaga = Omit<
  Vaga,
  | "id"
  | "etapa"
  | "status"
  | "data_fechamento"
  | "admitido_colaborador_id"
  | "setor"
  | "cargo"
  | "gestor_solicitante"
>;

/** Registro de quando a vaga entrou em cada etapa; base dos SLAs. */
export interface VagaEvento {
  id: string;
  vaga_id: string;
  etapa: EtapaVaga;
  data: string;
}
