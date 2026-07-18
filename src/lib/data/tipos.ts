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

/**
 * Tipos habilitados no registro manual. Por decisao de produto (2026-07-17),
 * apenas faltas por enquanto; folgas, atrasos e afins entram quando a escala
 * planejada existir. Os demais tipos seguem validos para leitura.
 */
export const TIPOS_OCORRENCIA_ATIVOS: Partial<Record<TipoOcorrencia, string>> = {
  falta_injustificada: "Falta injustificada",
  falta_justificada: "Falta justificada",
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

/** Performance e produtividade (Fase 6). */

export type TipoIndicador =
  | "pecas_hora"
  | "conversao"
  | "ticket_medio"
  | "nps"
  | "sla_no_prazo"
  | "execucao_planograma";

export interface DefinicaoIndicador {
  rotulo: string;
  /** Sufixo de exibicao; vazio quando o formato ja carrega a unidade (R$, %). */
  unidade: string;
  /** Sentido de leitura; hoje todos sao maior_melhor, o campo antecipa futuros. */
  direcao: "maior_melhor" | "menor_melhor";
  /** Casas decimais na exibicao. */
  casas: number;
  formato: "numero" | "percentual" | "moeda";
}

/**
 * Catalogo fechado de indicadores operacionais. Quais indicadores se aplicam
 * a cada grupo nao esta fixado aqui: emerge dos proprios lancamentos.
 */
export const INDICADORES: Record<TipoIndicador, DefinicaoIndicador> = {
  pecas_hora: {
    rotulo: "Peças por hora",
    unidade: "peças/h",
    direcao: "maior_melhor",
    casas: 1,
    formato: "numero",
  },
  conversao: {
    rotulo: "Conversão",
    unidade: "",
    direcao: "maior_melhor",
    casas: 1,
    formato: "percentual",
  },
  ticket_medio: {
    rotulo: "Ticket médio",
    unidade: "",
    direcao: "maior_melhor",
    casas: 2,
    formato: "moeda",
  },
  nps: {
    rotulo: "NPS",
    unidade: "pontos",
    direcao: "maior_melhor",
    casas: 0,
    formato: "numero",
  },
  sla_no_prazo: {
    rotulo: "SLA no prazo",
    unidade: "",
    direcao: "maior_melhor",
    casas: 1,
    formato: "percentual",
  },
  execucao_planograma: {
    rotulo: "Execução de planograma",
    unidade: "",
    direcao: "maior_melhor",
    casas: 1,
    formato: "percentual",
  },
};

/** Valor mensal de um indicador operacional lancado para uma pessoa. */
export interface IndicadorMensal {
  id: string;
  colaborador_id: string;
  /** Competencia fechada no formato YYYY-MM. */
  competencia: string;
  tipo: TipoIndicador;
  valor: number;
}

export type NovoIndicadorMensal = Omit<IndicadorMensal, "id">;

/** Escala 1-3: o 9-box e 3x3; escala maior fingiria precisao que nao existe. */
export type NotaAvaliacao = 1 | 2 | 3;

/** Avaliacao de performance x potencial por ciclo; base da matriz 9-box. */
export interface Avaliacao {
  id: string;
  colaborador_id: string;
  /** Ciclo semestral no formato YYYY-SN (ex.: 2026-S1). */
  ciclo: string;
  performance: NotaAvaliacao;
  potencial: NotaAvaliacao;
}

export type NovaAvaliacao = Omit<Avaliacao, "id">;

export const NOTAS_PERFORMANCE: Record<NotaAvaliacao, string> = {
  1: "Abaixo do esperado",
  2: "Dentro do esperado",
  3: "Acima do esperado",
};

export const NOTAS_POTENCIAL: Record<NotaAvaliacao, string> = {
  1: "Baixo",
  2: "Médio",
  3: "Alto",
};

/** Perfil comportamental (Fase 7). */

export type FatorDisc = "D" | "I" | "S" | "C";

/** Ordem canonica de exibicao dos fatores. */
export const FATORES_DISC: FatorDisc[] = ["D", "I", "S", "C"];

export interface DefinicaoFatorDisc {
  nome: string;
  /** O que o fator descreve, em uma linha. */
  enfase: string;
  comunicacao: string;
  decisao: string;
}

/**
 * Catalogo da metodologia DISC. Os estilos de comunicacao e decisao sao os
 * do fator predominante — descrevem estilo de trabalho, nunca desempenho.
 */
export const DISC: Record<FatorDisc, DefinicaoFatorDisc> = {
  D: {
    nome: "Dominância",
    enfase: "Foco em resultados e ação",
    comunicacao: "Direta e objetiva",
    decisao: "Rápida, orientada a resultado",
  },
  I: {
    nome: "Influência",
    enfase: "Foco em pessoas e entusiasmo",
    comunicacao: "Expressiva e envolvente",
    decisao: "Intuitiva, orientada a pessoas",
  },
  S: {
    nome: "Estabilidade",
    enfase: "Foco em ritmo e cooperação",
    comunicacao: "Calma e paciente",
    decisao: "Ponderada, busca consenso",
  },
  C: {
    nome: "Conformidade",
    enfase: "Foco em precisão e processo",
    comunicacao: "Precisa e formal",
    decisao: "Analítica, baseada em dados",
  },
};

/**
 * Perfil registrado para uma pessoa. Mantido separado de performance por
 * principio: perfil nao e nota e nao entra em avaliacao. Reavaliacoes geram
 * novos registros; as leituras usam o mais recente.
 */
export interface PerfilComportamental {
  id: string;
  colaborador_id: string;
  metodologia: string;
  fator_primario: FatorDisc;
  /** Nulo em perfis puros, sem segundo fator relevante. */
  fator_secundario: FatorDisc | null;
  data_avaliacao: string;
}

export type NovoPerfilComportamental = Omit<PerfilComportamental, "id">;

/** Talentos e sucessao (Fase 8). */

/** Prontidao para assumir o cargo-alvo. "Nao mapeado" e a ausencia de plano. */
export type Prontidao = "pronto" | "6_meses" | "12_meses";

export const PRONTIDAO: Record<Prontidao, string> = {
  pronto: "Pronto agora",
  "6_meses": "Pronto em 6 meses",
  "12_meses": "Pronto em 12 meses",
};

/**
 * Catalogo fechado de competencias. Um gap e uma competencia a desenvolver;
 * o conjunto de gaps de uma pessoa forma o foco do PDI. Lista controlada,
 * nunca texto livre — texto livre impede a leitura agregada dos gaps.
 */
export type Competencia =
  | "lideranca"
  | "gestao_pessoas"
  | "comunicacao"
  | "planejamento"
  | "visao_negocio"
  | "conhecimento_tecnico"
  | "orientacao_resultado"
  | "adaptabilidade";

export const COMPETENCIAS: Record<Competencia, string> = {
  lideranca: "Liderança",
  gestao_pessoas: "Gestão de pessoas",
  comunicacao: "Comunicação",
  planejamento: "Planejamento",
  visao_negocio: "Visão de negócio",
  conhecimento_tecnico: "Conhecimento técnico",
  orientacao_resultado: "Orientação a resultado",
  adaptabilidade: "Adaptabilidade",
};

/**
 * Plano de sucessao de uma pessoa: o cargo para o qual ela e preparada, sua
 * prontidao e os gaps de competencia que o PDI precisa fechar. Um plano por
 * pessoa; quem nao tem plano conta como "nao mapeado".
 */
export interface PlanoSucessao {
  id: string;
  colaborador_id: string;
  /** Cargo para o qual a pessoa esta sendo preparada. */
  cargo_alvo_id: string;
  prontidao: Prontidao;
  /** Competencias a desenvolver; base do PDI. */
  gaps: Competencia[];
  data_atualizacao: string;
  cargo_alvo: { nome: string } | null;
}

export type NovoPlanoSucessao = Omit<PlanoSucessao, "id" | "cargo_alvo">;

/** Historico de carreira: promocoes e transferencias (Fase 1). */

export type TipoMovimentacao = "promocao" | "transferencia" | "mudanca_turno";

export const TIPOS_MOVIMENTACAO: Record<TipoMovimentacao, string> = {
  promocao: "Promoção",
  transferencia: "Transferência de setor",
  mudanca_turno: "Mudança de turno",
};

/**
 * Um evento na trajetoria da pessoa. Registra a transicao "de -> para" com os
 * rotulos legiveis do momento (cargo, setor ou turno, conforme o tipo): a
 * ficha e um historico, entao guardar o texto do estado anterior preserva a
 * leitura mesmo que o cargo ou setor seja renomeado depois.
 */
export interface Movimentacao {
  id: string;
  colaborador_id: string;
  tipo: TipoMovimentacao;
  data: string;
  /** Rotulo de origem; nulo quando nao se aplica. */
  de: string | null;
  /** Rotulo de destino. */
  para: string;
}

export type NovaMovimentacao = Omit<Movimentacao, "id">;
