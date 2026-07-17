import { diasAtrasIso } from "@/lib/datas";
import type {
  Afastamento,
  Cargo,
  Colaborador,
  Ocorrencia,
  Setor,
  Turno,
  Vaga,
  VagaEvento,
} from "./tipos";

/**
 * Dados do modo demonstracao. Vivem apenas em memoria: alteracoes feitas na
 * interface se perdem quando o servidor reinicia.
 *
 * O quadro reflete a estrutura real da loja com o primeiro nome de cada
 * associado. Os demais dados do perfil (contato, endereco, demografia,
 * frequencia e vagas) sao FICTICIOS, gerados de forma deterministica apenas
 * para a demonstracao ficar completa — nada aqui descreve as pessoas reais.
 *
 * O estado mutavel e ancorado em globalThis porque, em desenvolvimento, cada
 * rota pode compilar sua propria instancia deste modulo; sem o singleton, uma
 * server action escreveria numa copia diferente da que as paginas leem.
 */

const setoresIniciais: Setor[] = [
  { id: "s-caixa", nome: "Caixa", headcount_planejado: 5 },
  { id: "s-sfs", nome: "Ship From Store", headcount_planejado: 4 },
  { id: "s-pd", nome: "PD (Precificação Dinâmica)", headcount_planejado: 3 },
  { id: "s-reserva", nome: "Reserva", headcount_planejado: 5 },
  { id: "s-picking", nome: "Picking (Reposição)", headcount_planejado: 2 },
  { id: "s-vm", nome: "VM", headcount_planejado: 6 },
  { id: "s-vmo", nome: "VMO", headcount_planejado: 5 },
  { id: "s-oploja", nome: "Operador de Loja", headcount_planejado: 5 },
  { id: "s-provadores", nome: "Provadores", headcount_planejado: 3 },
];

const cargosIniciais: Cargo[] = [
  { id: "c-caixa", nome: "Operador de Caixa" },
  { id: "c-oploja", nome: "Operador de Loja" },
  { id: "c-vm", nome: "Visual Merchandiser" },
  { id: "c-evm", nome: "Especialista VM" },
  { id: "c-lider", nome: "Líder" },
  { id: "c-supervisor", nome: "Supervisor" },
  { id: "c-coordenador", nome: "Coordenador" },
  { id: "c-gerente", nome: "Gerente" },
];

/** Gerador pseudoaleatorio com semente fixa: o mesmo quadro em toda execucao. */
function mulberry32(semente: number) {
  let a = semente;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const aleatorio = mulberry32(20260716);

function inteiro(minimo: number, maximo: number): number {
  return minimo + Math.floor(aleatorio() * (maximo - minimo + 1));
}

function escolher<T>(opcoes: readonly T[]): T {
  return opcoes[Math.floor(aleatorio() * opcoes.length)];
}

function dataEntre(anoMinimo: number, anoMaximo: number): string {
  const ano = inteiro(anoMinimo, anoMaximo);
  const mes = String(inteiro(1, 12)).padStart(2, "0");
  const dia = String(inteiro(1, 28)).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function removerAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const BAIRROS_SP = [
  "Itaquera",
  "Tatuapé",
  "Penha",
  "Vila Prudente",
  "Santana",
  "Freguesia do Ó",
  "Capão Redondo",
  "Campo Limpo",
  "Sacomã",
  "Ipiranga",
  "Lapa",
  "Pirituba",
  "São Mateus",
  "Vila Formosa",
  "Jabaquara",
];

const REGIAO_POR_BAIRRO: Record<string, string> = {
  Itaquera: "Zona Leste",
  Tatuapé: "Zona Leste",
  Penha: "Zona Leste",
  "Vila Prudente": "Zona Leste",
  "São Mateus": "Zona Leste",
  "Vila Formosa": "Zona Leste",
  Santana: "Zona Norte",
  "Freguesia do Ó": "Zona Norte",
  Pirituba: "Zona Norte",
  "Capão Redondo": "Zona Sul",
  "Campo Limpo": "Zona Sul",
  Sacomã: "Zona Sul",
  Ipiranga: "Zona Sul",
  Jabaquara: "Zona Sul",
  Lapa: "Zona Oeste",
};

const CIDADES_VIZINHAS = ["Guarulhos", "Osasco", "Diadema", "Taboão da Serra"];

/** Faixas de admissao e nascimento por senioridade do cargo. */
const FAIXAS_POR_CARGO: Record<string, { admissao: [number, number]; nascimento: [number, number] }> = {
  "c-supervisor": { admissao: [2017, 2020], nascimento: [1982, 1993] },
  "c-lider": { admissao: [2019, 2022], nascimento: [1988, 1998] },
  "c-evm": { admissao: [2020, 2023], nascimento: [1990, 2000] },
};

const FAIXA_PADRAO: { admissao: [number, number]; nascimento: [number, number] } = {
  admissao: [2022, 2025],
  nascimento: [1996, 2006],
};

function pessoa(
  id: string,
  matricula: string,
  nome: string,
  setor_id: string,
  cargo_id: string,
  gestor_id: string | null = null,
  perfil: Partial<Colaborador> = {},
): Colaborador {
  const setor = setoresIniciais.find((s) => s.id === setor_id) ?? null;
  const cargo = cargosIniciais.find((c) => c.id === cargo_id) ?? null;

  const faixas = FAIXAS_POR_CARGO[cargo_id] ?? FAIXA_PADRAO;
  const moraEmSp = aleatorio() < 0.72;
  const bairro = moraEmSp ? escolher(BAIRROS_SP) : null;
  const slug = removerAcentos(nome).toLowerCase().replace(/\s+/g, ".");

  return {
    id,
    matricula,
    nome,
    setor_id,
    cargo_id,
    gestor_id,
    email: `${slug}.${matricula}@cea-demo.com.br`,
    telefone: `(11) 9${inteiro(6000, 9999)}-${String(inteiro(0, 9999)).padStart(4, "0")}`,
    data_nascimento: dataEntre(...faixas.nascimento),
    cidade: moraEmSp ? "São Paulo" : escolher(CIDADES_VIZINHAS),
    bairro: bairro ?? "Centro",
    cep: `0${inteiro(1000, 8999)}-${String(inteiro(0, 999)).padStart(3, "0")}`,
    regiao: bairro ? REGIAO_POR_BAIRRO[bairro] : "Grande São Paulo",
    tempo_deslocamento_min: inteiro(15, 80),
    genero: null,
    pcd: false,
    escolaridade:
      cargo_id === "c-supervisor"
        ? escolher(["Superior Completo", "Pós-graduação"])
        : cargo_id === "c-lider" || cargo_id === "c-evm"
          ? escolher(["Ensino Técnico", "Superior Incompleto", "Superior Completo"])
          : escolher([
              "Ensino Médio",
              "Ensino Médio",
              "Ensino Médio",
              "Ensino Técnico",
              "Superior Incompleto",
            ]),
    data_admissao: dataEntre(...faixas.admissao),
    tipo_contrato: "CLT",
    jornada: "220h",
    turno: "manha",
    status: "ativo",
    data_desligamento: null,
    tipo_desligamento: null,
    motivo_desligamento: null,
    setor: setor ? { nome: setor.nome } : null,
    cargo: cargo ? { nome: cargo.nome } : null,
    gestor: null,
    ...perfil,
  };
}

/**
 * Quadro enxuto de demonstracao (ajuste de 2026-07-17): cada area tem um
 * supervisor — Carolina (Operações: Reserva, PD, Ship From Store e Picking),
 * Pamela (Piso: Caixa, Operador de Loja e Provadores) e Daniela (Piso
 * Superior: VM e VMO) —, cada setor tem um lider (que pode acumular setores,
 * como Luana e Rute) e 2-3 associados.
 */
const colaboradoresIniciais: Colaborador[] = [
  // Operacoes (supervisora Carolina; Luana lidera Reserva, PD, SFS e Picking).
  pessoa("p-carolina", "3001", "Carolina", "s-reserva", "c-supervisor", null, {
    genero: "Feminino",
  }),
  pessoa("p-luana", "3006", "Luana", "s-reserva", "c-lider", "p-carolina", {
    genero: "Feminino",
  }),
  pessoa("p-matheus", "3020", "Matheus", "s-reserva", "c-oploja", "p-luana", {
    genero: "Masculino",
  }),
  pessoa("p-bruna", "3022", "Bruna", "s-reserva", "c-oploja", "p-luana", {
    genero: "Feminino",
  }),
  pessoa("p-andressa", "3017", "Andressa", "s-pd", "c-oploja", "p-luana", {
    genero: "Feminino",
  }),
  pessoa("p-joice", "3018", "Joice", "s-pd", "c-oploja", "p-luana", {
    genero: "Feminino",
  }),
  pessoa("p-maiara", "3012", "Maiara", "s-sfs", "c-oploja", "p-luana", {
    genero: "Feminino",
  }),
  pessoa("p-pedro", "3013", "Pedro", "s-sfs", "c-oploja", "p-luana", {
    genero: "Masculino",
    turno: "tarde",
    data_admissao: diasAtrasIso(70),
  }),
  pessoa("p-debora", "3015", "Debora", "s-sfs", "c-oploja", "p-luana", {
    genero: "Feminino",
    status: "ferias",
  }),
  pessoa("p-tiago", "3048", "Tiago", "s-picking", "c-oploja", "p-luana", {
    genero: "Masculino",
  }),

  // Piso (supervisora Pamela; Rute lidera Operador de Loja e Provadores).
  pessoa("p-pamela", "3002", "Pamela", "s-oploja", "c-supervisor", null, {
    genero: "Feminino",
  }),
  pessoa("p-kimbelly", "3007", "Kimbelly", "s-caixa", "c-lider", "p-pamela", {
    genero: "Feminino",
  }),
  pessoa("p-layane", "3009", "Layane", "s-caixa", "c-caixa", "p-kimbelly", {
    genero: "Feminino",
    jornada: "180h",
  }),
  pessoa("p-mercia", "3010", "Mercia", "s-caixa", "c-caixa", "p-kimbelly", {
    genero: "Feminino",
    status: "afastado",
  }),
  pessoa("p-diana", "3011", "Diana", "s-caixa", "c-caixa", "p-kimbelly", {
    genero: "Feminino",
    turno: "tarde",
    jornada: "180h",
  }),
  pessoa("p-rute", "3008", "Rute", "s-oploja", "c-lider", "p-pamela", {
    genero: "Feminino",
    turno: "tarde",
  }),
  pessoa("p-henrique", "3023", "Henrique", "s-oploja", "c-oploja", "p-rute", {
    genero: "Masculino",
    pcd: true,
  }),
  pessoa("p-antonio", "3024", "Antônio", "s-oploja", "c-oploja", "p-rute", {
    genero: "Masculino",
    tipo_contrato: "Temporário",
    jornada: "180h",
    turno: "tarde",
  }),
  pessoa("p-ester", "3019", "Ester", "s-provadores", "c-oploja", "p-rute", {
    genero: "Feminino",
    tipo_contrato: "Jovem Aprendiz",
    jornada: "120h",
  }),
  pessoa("p-sara", "3032", "Sara", "s-provadores", "c-oploja", "p-rute", {
    genero: "Feminino",
    turno: "tarde",
  }),

  // Piso superior (supervisora Daniela; VM e VMO).
  pessoa("p-daniela", "3003", "Daniela", "s-vm", "c-supervisor", null, {
    genero: "Feminino",
  }),
  pessoa("p-paola", "3025", "Paola", "s-vm", "c-lider", "p-daniela", {
    genero: "Feminino",
  }),
  pessoa("p-rafael", "3028", "Rafael", "s-vm", "c-vm", "p-paola", {
    genero: "Masculino",
  }),
  pessoa("p-ana", "3029", "Ana", "s-vm", "c-vm", "p-paola", {
    genero: "Feminino",
    turno: "tarde",
    data_admissao: diasAtrasIso(30),
  }),
  pessoa("p-alef", "3044", "Alef", "s-vm", "c-evm", "p-paola", {
    genero: "Masculino",
  }),
  pessoa("p-edy", "3037", "Edy", "s-vmo", "c-lider", "p-daniela", {
    genero: "Masculino",
    turno: "noite",
  }),
  pessoa("p-savana", "3040", "Savana", "s-vmo", "c-vm", "p-edy", {
    genero: "Feminino",
    turno: "noite",
  }),
  pessoa("p-welington", "3042", "Welington", "s-vmo", "c-vm", "p-edy", {
    genero: "Masculino",
    turno: "noite",
  }),
  pessoa("p-raquel", "3043", "Raquel", "s-vmo", "c-vm", "p-edy", {
    genero: "Feminino",
    turno: "noite",
  }),
];

// Resolve o nome do gestor depois que a lista inteira existe.
for (const colaborador of colaboradoresIniciais) {
  if (colaborador.gestor_id) {
    const gestor = colaboradoresIniciais.find((c) => c.id === colaborador.gestor_id);
    colaborador.gestor = gestor ? { nome: gestor.nome } : null;
  }
}

/**
 * Faltas ficticias dos ultimos 90 dias (apenas faltas: o registro de folgas,
 * atrasos e afins esta desabilitado por enquanto). Propensao maior em alguns
 * grupos para os cortes analiticos terem relevo. Datas relativas a hoje: a
 * demo nunca fica "velha".
 */
function gerarOcorrencias(): Ocorrencia[] {
  const ocorrencias: Ocorrencia[] = [];
  let sequencia = 0;

  for (const colaborador of colaboradoresIniciais) {
    if (colaborador.status === "afastado") continue;

    let propensao = 0.8;
    if (colaborador.setor_id === "s-caixa" || colaborador.setor_id === "s-oploja") {
      propensao += 0.7;
    }
    if (colaborador.turno === "noite") propensao += 0.6;
    if (colaborador.cargo_id === "c-supervisor" || colaborador.cargo_id === "c-lider") {
      propensao -= 0.6;
    }

    const quantidade = Math.max(0, Math.round(propensao + (aleatorio() - 0.5) * 2));

    for (let i = 0; i < quantidade; i += 1) {
      sequencia += 1;
      ocorrencias.push({
        id: `o-seed-${sequencia}`,
        colaborador_id: colaborador.id,
        tipo: aleatorio() < 0.6 ? "falta_injustificada" : "falta_justificada",
        data_inicio: diasAtrasIso(inteiro(1, 88)),
        data_fim: null,
        minutos: null,
      });
    }
  }

  return ocorrencias;
}

const ocorrenciasIniciais: Ocorrencia[] = gerarOcorrencias();

const afastamentosIniciais: Afastamento[] = [
  // Em curso, coerente com o status "afastado" da Mercia.
  {
    id: "a-seed-1",
    colaborador_id: "p-mercia",
    tipo: "afastamento",
    categoria: "inss",
    data_inicio: diasAtrasIso(25),
    data_fim: diasAtrasIso(-15),
  },
  {
    id: "a-seed-2",
    colaborador_id: "p-welington",
    tipo: "afastamento",
    categoria: "acidente_trabalho",
    data_inicio: diasAtrasIso(47),
    data_fim: diasAtrasIso(40),
  },
  {
    id: "a-seed-3",
    colaborador_id: "p-layane",
    tipo: "atestado",
    categoria: "doenca",
    data_inicio: diasAtrasIso(62),
    data_fim: diasAtrasIso(60),
  },
  {
    id: "a-seed-4",
    colaborador_id: "p-joice",
    tipo: "atestado",
    categoria: "acompanhamento_familiar",
    data_inicio: diasAtrasIso(9),
    data_fim: diasAtrasIso(9),
  },
  {
    id: "a-seed-5",
    colaborador_id: "p-sara",
    tipo: "atestado",
    categoria: "doenca",
    data_inicio: diasAtrasIso(33),
    data_fim: diasAtrasIso(31),
  },
];

/** Vagas ficticias: duas abertas (uma em atraso) e duas concluidas. */
function nomeDe(id: string): { nome: string } | null {
  const pessoaEncontrada = colaboradoresIniciais.find((c) => c.id === id);
  return pessoaEncontrada ? { nome: pessoaEncontrada.nome } : null;
}

function nomeSetor(id: string): { nome: string } | null {
  const setor = setoresIniciais.find((s) => s.id === id);
  return setor ? { nome: setor.nome } : null;
}

function nomeCargo(id: string): { nome: string } | null {
  const cargo = cargosIniciais.find((c) => c.id === id);
  return cargo ? { nome: cargo.nome } : null;
}

const vagasIniciais: Vaga[] = [
  {
    id: "v-seed-1",
    setor_id: "s-oploja",
    cargo_id: "c-oploja",
    turno: "tarde" as Turno,
    motivo: "expansao",
    colaborador_substituido_id: null,
    gestor_solicitante_id: "p-pamela",
    data_abertura: diasAtrasIso(22),
    data_limite: diasAtrasIso(-8),
    etapa: "entrevista",
    status: "aberta",
    data_fechamento: null,
    admitido_colaborador_id: null,
    setor: nomeSetor("s-oploja"),
    cargo: nomeCargo("c-oploja"),
    gestor_solicitante: nomeDe("p-pamela"),
  },
  {
    id: "v-seed-2",
    setor_id: "s-caixa",
    cargo_id: "c-caixa",
    turno: "manha" as Turno,
    motivo: "reposicao",
    colaborador_substituido_id: null,
    gestor_solicitante_id: "p-kimbelly",
    data_abertura: diasAtrasIso(38),
    data_limite: diasAtrasIso(6),
    etapa: "divulgacao",
    status: "aberta",
    data_fechamento: null,
    admitido_colaborador_id: null,
    setor: nomeSetor("s-caixa"),
    cargo: nomeCargo("c-caixa"),
    gestor_solicitante: nomeDe("p-kimbelly"),
  },
  {
    id: "v-seed-3",
    setor_id: "s-vm",
    cargo_id: "c-vm",
    turno: "tarde" as Turno,
    motivo: "expansao",
    colaborador_substituido_id: null,
    gestor_solicitante_id: "p-daniela",
    data_abertura: diasAtrasIso(62),
    data_limite: diasAtrasIso(25),
    etapa: "admissao",
    status: "concluida",
    data_fechamento: diasAtrasIso(30),
    admitido_colaborador_id: "p-ana",
    setor: nomeSetor("s-vm"),
    cargo: nomeCargo("c-vm"),
    gestor_solicitante: nomeDe("p-daniela"),
  },
  {
    id: "v-seed-4",
    setor_id: "s-sfs",
    cargo_id: "c-oploja",
    turno: "manha" as Turno,
    motivo: "reposicao",
    colaborador_substituido_id: null,
    gestor_solicitante_id: "p-luana",
    data_abertura: diasAtrasIso(88),
    data_limite: diasAtrasIso(58),
    etapa: "admissao",
    status: "concluida",
    data_fechamento: diasAtrasIso(70),
    admitido_colaborador_id: "p-pedro",
    setor: nomeSetor("s-sfs"),
    cargo: nomeCargo("c-oploja"),
    gestor_solicitante: nomeDe("p-luana"),
  },
];

function eventosDe(vagaId: string, diasPorEtapa: [string, number][]): VagaEvento[] {
  return diasPorEtapa.map(([etapa, dias], indice) => ({
    id: `ve-${vagaId}-${indice}`,
    vaga_id: vagaId,
    etapa: etapa as VagaEvento["etapa"],
    data: diasAtrasIso(dias),
  }));
}

const vagaEventosIniciais: VagaEvento[] = [
  ...eventosDe("v-seed-1", [
    ["solicitacao", 22],
    ["aprovacao", 19],
    ["divulgacao", 15],
    ["triagem", 9],
    ["entrevista", 4],
  ]),
  ...eventosDe("v-seed-2", [
    ["solicitacao", 38],
    ["aprovacao", 33],
    ["divulgacao", 28],
  ]),
  ...eventosDe("v-seed-3", [
    ["solicitacao", 62],
    ["aprovacao", 58],
    ["divulgacao", 52],
    ["triagem", 45],
    ["entrevista", 38],
    ["proposta", 33],
    ["admissao", 30],
  ]),
  ...eventosDe("v-seed-4", [
    ["solicitacao", 88],
    ["aprovacao", 85],
    ["divulgacao", 82],
    ["triagem", 78],
    ["entrevista", 74],
    ["proposta", 72],
    ["admissao", 70],
  ]),
];

interface EstadoDemo {
  setores: Setor[];
  cargos: Cargo[];
  colaboradores: Colaborador[];
  ocorrencias: Ocorrencia[];
  afastamentos: Afastamento[];
  vagas: Vaga[];
  vagaEventos: VagaEvento[];
}

// A chave versionada descarta estados de formatos antigos que sobrevivem no
// globalThis durante o desenvolvimento.
const escopoGlobal = globalThis as typeof globalThis & {
  __estadoDemoV3?: EstadoDemo;
};

const estado: EstadoDemo = (escopoGlobal.__estadoDemoV3 ??= {
  setores: setoresIniciais,
  cargos: cargosIniciais,
  colaboradores: colaboradoresIniciais,
  ocorrencias: ocorrenciasIniciais,
  afastamentos: afastamentosIniciais,
  vagas: vagasIniciais,
  vagaEventos: vagaEventosIniciais,
});

export const setoresDemo = estado.setores;
export const cargosDemo = estado.cargos;
export const colaboradoresDemo = estado.colaboradores;
export const ocorrenciasDemo = estado.ocorrencias;
export const afastamentosDemo = estado.afastamentos;
export const vagasDemo = estado.vagas;
export const vagaEventosDemo = estado.vagaEventos;
