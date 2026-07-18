import { diasAtrasIso, formatarIsoLocal } from "@/lib/datas";
import { FATORES_DISC, INDICADORES } from "./tipos";
import type {
  Afastamento,
  Avaliacao,
  Cargo,
  Colaborador,
  Competencia,
  FatorDisc,
  IndicadorMensal,
  Movimentacao,
  NotaAvaliacao,
  Ocorrencia,
  PerfilComportamental,
  PlanoSucessao,
  Prontidao,
  Setor,
  TipoIndicador,
  TipoMovimentacao,
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

/**
 * Ex-associados FICTICIOS (nomes inventados, sem relacao com o quadro real)
 * para o modulo de turnover ter historico. Datas relativas a hoje, espalhadas
 * pelos ultimos 12 meses, com mix de motivo, tipo e tempo de casa — inclui
 * saidas precoces (menos de 90 dias) para o indicador ter relevo.
 */
function desligado(
  id: string,
  matricula: string,
  nome: string,
  setor_id: string,
  cargo_id: string,
  gestor_id: string,
  genero: string,
  admissaoDiasAtras: number,
  desligamentoDiasAtras: number,
  tipo: "voluntario" | "involuntario",
  motivo: string,
  turno: Turno = "manha",
): Colaborador {
  return pessoa(id, matricula, nome, setor_id, cargo_id, gestor_id, {
    genero,
    turno,
    status: "desligado",
    data_admissao: diasAtrasIso(admissaoDiasAtras),
    data_desligamento: diasAtrasIso(desligamentoDiasAtras),
    tipo_desligamento: tipo,
    motivo_desligamento: motivo,
  });
}

/**
 * O SEGREDO DA DEMO: o Caixa do turno da tarde perde gente por causa da
 * escala. As quatro saidas do Caixa sao voluntarias, do turno da tarde e com
 * motivo "escala"; tres delas com menos de 90 dias de casa (todo o turnover
 * precoce vem dali). O mesmo padrao aparece no absenteismo (faltas do Caixa
 * concentradas em domingos e segundas, quando a escala aperta) e na vaga de
 * reposicao aberta para o proprio setor. Nenhuma tela anuncia isso: os cortes
 * revelam quando alguem investiga.
 */
const desligadosIniciais: Colaborador[] = [
  desligado("p-ex-vanessa", "2901", "Vanessa", "s-caixa", "c-caixa", "p-kimbelly", "Feminino", 400, 300, "voluntario", "escala", "tarde"),
  desligado("p-ex-priscila", "2904", "Priscila", "s-caixa", "c-caixa", "p-kimbelly", "Feminino", 320, 280, "voluntario", "escala", "tarde"),
  desligado("p-ex-larissa", "2912", "Larissa", "s-caixa", "c-caixa", "p-kimbelly", "Feminino", 210, 150, "voluntario", "escala", "tarde"),
  desligado("p-ex-felipe", "2909", "Felipe", "s-caixa", "c-caixa", "p-kimbelly", "Masculino", 150, 90, "voluntario", "escala", "tarde"),
  desligado("p-ex-juliana", "2902", "Juliana", "s-pd", "c-oploja", "p-luana", "Feminino", 600, 330, "voluntario", "salario"),
  desligado("p-ex-igor", "2903", "Igor", "s-oploja", "c-oploja", "p-rute", "Masculino", 700, 250, "voluntario", "salario"),
  desligado("p-ex-douglas", "2905", "Douglas", "s-vm", "c-vm", "p-paola", "Masculino", 900, 200, "involuntario", "desempenho", "tarde"),
  desligado("p-ex-taina", "2906", "Tainá", "s-sfs", "c-oploja", "p-luana", "Feminino", 400, 180, "voluntario", "nova_oportunidade"),
  desligado("p-ex-roberto", "2907", "Roberto", "s-vmo", "c-vm", "p-edy", "Masculino", 1100, 150, "voluntario", "distancia", "noite"),
  desligado("p-ex-camila", "2908", "Camila", "s-oploja", "c-oploja", "p-rute", "Feminino", 500, 120, "voluntario", "nova_oportunidade", "tarde"),
  desligado("p-ex-simone", "2910", "Simone", "s-provadores", "c-oploja", "p-rute", "Feminino", 800, 60, "voluntario", "carreira"),
  desligado("p-ex-leandro", "2911", "Leandro", "s-reserva", "c-oploja", "p-luana", "Masculino", 420, 30, "voluntario", "salario"),
];

colaboradoresIniciais.push(...desligadosIniciais);

// Resolve o nome do gestor depois que a lista inteira existe.
for (const colaborador of colaboradoresIniciais) {
  if (colaborador.gestor_id) {
    const gestor = colaboradoresIniciais.find((c) => c.id === colaborador.gestor_id);
    colaborador.gestor = gestor ? { nome: gestor.nome } : null;
  }
}

/**
 * Faltas ficticias dos ultimos 90 dias (apenas faltas: o registro de folgas,
 * atrasos e afins esta desabilitado por enquanto). Datas relativas a hoje: a
 * demo nunca fica "velha". As faltas do Caixa caem de proposito em domingos e
 * segundas — o aperto da escala de fim de semana, mesma causa das saidas do
 * setor; o corte "por dia da semana" do absenteismo conta essa historia.
 */
function gerarOcorrencias(): Ocorrencia[] {
  const ocorrencias: Ocorrencia[] = [];
  let sequencia = 0;

  const registrar = (
    colaboradorId: string,
    diasAtras: number,
    injustificada: boolean,
  ) => {
    sequencia += 1;
    ocorrencias.push({
      id: `o-seed-${sequencia}`,
      colaborador_id: colaboradorId,
      tipo: injustificada ? "falta_injustificada" : "falta_justificada",
      data_inicio: diasAtrasIso(diasAtras),
      data_fim: null,
      minutos: null,
    });
  };

  // Offsets (em dias atras) que caem em domingo ou segunda-feira.
  const diasDeAperto: number[] = [];
  for (let d = 1; d <= 88; d += 1) {
    const data = new Date();
    data.setDate(data.getDate() - d);
    if (data.getDay() === 0 || data.getDay() === 1) diasDeAperto.push(d);
  }

  for (const colaborador of colaboradoresIniciais) {
    // Afastada nao gera falta; ex-associados tem as faltas proprias abaixo.
    if (colaborador.status === "afastado" || colaborador.status === "desligado") {
      continue;
    }

    const noCaixa = colaborador.setor_id === "s-caixa";
    let propensao = 0.7;
    if (noCaixa) propensao += 1.1;
    if (colaborador.setor_id === "s-oploja") propensao += 0.4;
    if (colaborador.turno === "tarde") propensao += 0.3;
    if (colaborador.turno === "noite") propensao += 0.5;
    if (colaborador.cargo_id === "c-supervisor" || colaborador.cargo_id === "c-lider") {
      propensao -= 0.5;
    }

    const quantidade = Math.max(0, Math.round(propensao + (aleatorio() - 0.5) * 2));

    for (let i = 0; i < quantidade; i += 1) {
      const emDiaDeAperto = noCaixa && aleatorio() < 0.75;
      registrar(
        colaborador.id,
        emDiaDeAperto ? escolher(diasDeAperto) : inteiro(1, 88),
        aleatorio() < (noCaixa ? 0.7 : 0.5),
      );
    }
  }

  // Saida anunciada: quem pediu demissao vinha acumulando faltas nas semanas
  // anteriores — o rastro fica visivel em Escala & Frequencia.
  registrar("p-ex-leandro", 35, true);
  registrar("p-ex-leandro", 43, true);
  registrar("p-ex-leandro", 50, false);
  registrar("p-ex-simone", 68, true);

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
    turno: "tarde" as Turno,
    motivo: "reposicao",
    // Repoe o Felipe, que saiu por escala — a vaga aberta e mais um rastro
    // do desgaste do Caixa da tarde.
    colaborador_substituido_id: "p-ex-felipe",
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

/**
 * Fase 6: indicadores mensais e avaliacoes. Os geradores abaixo rodam DEPOIS
 * dos anteriores de proposito — todos consomem a mesma sequencia do PRNG, e
 * inserir chamadas antes deslocaria o quadro inteiro.
 *
 * O mapeamento espelha o catalogo por setor de INDICADORES (tipos.ts): so
 * Ship From Store, PD, Picking e Caixa coletam indicadores.
 */

const INDICADORES_POR_SETOR: Record<string, TipoIndicador[]> = {
  "s-sfs": ["produtividade_hora"],
  "s-pd": ["pecas_remarcadas_hora", "conclusao_dia"],
  "s-picking": ["pecas_hora", "execucao_setor_dia"],
  "s-caixa": ["pay_realizados", "pcj_realizados", "seguros_vendidos"],
};

/** Faixa [minimo, maximo] da base individual de cada indicador. */
const BASE_INDICADOR: Record<TipoIndicador, [number, number]> = {
  produtividade_hora: [55, 75],
  pecas_remarcadas_hora: [85, 130],
  conclusao_dia: [88, 100],
  pecas_hora: [55, 75],
  execucao_setor_dia: [85, 98],
  pay_realizados: [8, 20],
  pcj_realizados: [5, 15],
  seguros_vendidos: [3, 10],
};

/** Lideranca nao tem indicador individual; a leitura dela e agregada. */
const CARGOS_COM_INDICADOR = ["c-caixa", "c-oploja"];

function competenciaMesesAtras(meses: number): string {
  const hoje = new Date();
  return formatarIsoLocal(
    new Date(hoje.getFullYear(), hoje.getMonth() - meses, 1),
  ).slice(0, 7);
}

function somarDiasIso(iso: string, dias: number): string {
  const data = new Date(`${iso}T00:00:00`);
  data.setDate(data.getDate() + dias);
  return formatarIsoLocal(data);
}

/**
 * Seis competencias fechadas de indicadores por pessoa. A geracao respeita o
 * periodo de casa de cada um (admitidos recentes tem historico curto;
 * desligados, historico parcial) e repete o rastro da narrativa: o Caixa da
 * tarde rende menos.
 */
function gerarIndicadores(): IndicadorMensal[] {
  const indicadores: IndicadorMensal[] = [];
  let sequencia = 0;

  const competencias: string[] = [];
  for (let n = 6; n >= 1; n -= 1) competencias.push(competenciaMesesAtras(n));

  for (const colaborador of colaboradoresIniciais) {
    if (!colaborador.cargo_id || !CARGOS_COM_INDICADOR.includes(colaborador.cargo_id)) {
      continue;
    }
    const tipos = colaborador.setor_id
      ? INDICADORES_POR_SETOR[colaborador.setor_id]
      : undefined;
    if (!tipos || !colaborador.data_admissao) continue;

    const caixaTarde =
      colaborador.setor_id === "s-caixa" && colaborador.turno === "tarde";
    const veteranoEm = somarDiasIso(colaborador.data_admissao, 90);

    for (const tipo of tipos) {
      const [minimo, maximo] = BASE_INDICADOR[tipo];
      const base = minimo + aleatorio() * (maximo - minimo);
      const casas = INDICADORES[tipo].casas;
      const escala = 10 ** casas;

      for (const competencia of competencias) {
        // So gera para os meses em que a pessoa estava na casa.
        if (colaborador.data_admissao > `${competencia}-31`) continue;
        if (
          colaborador.data_desligamento &&
          colaborador.data_desligamento < `${competencia}-01`
        ) {
          continue;
        }

        let fator = 1;
        if (caixaTarde) fator *= 0.85;
        if (veteranoEm > `${competencia}-28`) fator *= 0.88;

        const bruto = base * fator * (1 + (aleatorio() - 0.5) * 0.12);
        const teto = INDICADORES[tipo].formato === "percentual" ? 100 : Infinity;
        sequencia += 1;
        indicadores.push({
          id: `im-seed-${sequencia}`,
          colaborador_id: colaborador.id,
          competencia,
          tipo,
          valor: Math.min(Math.round(bruto * escala) / escala, teto),
        });
      }
    }
  }

  return indicadores;
}

const indicadoresIniciais: IndicadorMensal[] = gerarIndicadores();

/**
 * Avaliacoes do ultimo ciclo semestral fechado. O mapa fixa as posicoes que
 * sustentam a narrativa (Luana estrela e sucessora natural; Diana, do Caixa
 * da tarde, em questionavel — a pagina nunca afirma a causa); o restante do
 * quadro gravita o centro da matriz. Admitidos ha menos de 90 dias ficam de
 * fora do ciclo.
 */
const AVALIACOES_NARRATIVA: Record<string, [NotaAvaliacao, NotaAvaliacao]> = {
  "p-luana": [3, 3],
  "p-alef": [3, 1],
  "p-rute": [3, 2],
  "p-savana": [2, 3],
  "p-ester": [2, 3],
  "p-diana": [1, 2],
  "p-kimbelly": [2, 2],
  "p-antonio": [2, 1],
};

// Sem [3, 3] aqui de proposito: a Estrela sai apenas do mapa narrativo.
const NOTAS_COMUNS: readonly [NotaAvaliacao, NotaAvaliacao][] = [
  [2, 2],
  [2, 2],
  [2, 2],
  [3, 2],
  [2, 1],
  [2, 3],
  [1, 1],
];

function cicloFechadoMaisRecente(): string {
  const hoje = new Date();
  return hoje.getMonth() < 6
    ? `${hoje.getFullYear() - 1}-S2`
    : `${hoje.getFullYear()}-S1`;
}

function gerarAvaliacoes(): Avaliacao[] {
  const avaliacoes: Avaliacao[] = [];
  const ciclo = cicloFechadoMaisRecente();
  const corteAdmissao = diasAtrasIso(90);
  let sequencia = 0;

  for (const colaborador of colaboradoresIniciais) {
    if (colaborador.status === "desligado") continue;
    if (!colaborador.data_admissao || colaborador.data_admissao > corteAdmissao) {
      continue;
    }

    const [performance, potencial] =
      AVALIACOES_NARRATIVA[colaborador.id] ?? escolher(NOTAS_COMUNS);
    sequencia += 1;
    avaliacoes.push({
      id: `av-seed-${sequencia}`,
      colaborador_id: colaborador.id,
      ciclo,
      performance,
      potencial,
    });
  }

  return avaliacoes;
}

const avaliacoesIniciais: Avaliacao[] = gerarAvaliacoes();

/**
 * Fase 7: perfis comportamentais (DISC). Como nos geradores anteriores, roda
 * DEPOIS de todos — a ordem das chamadas ao PRNG preserva o quadro.
 *
 * O perfil descreve estilo, nunca desempenho. O mapa narrativo fixa as
 * pecas-chave e o restante segue o vies plausivel de cada funcao (operacao
 * pende a S/C, visual a I/C). Camada discreta da historia: o Caixa e um time
 * de perfil S — pessoas que valorizam rotina e previsibilidade — convivendo
 * com a escala mais instavel da loja. Nenhuma tela afirma a relacao; o mapa
 * por equipe deixa o padrao a vista de quem investiga.
 */
const PERFIS_NARRATIVA: Record<string, [FatorDisc, FatorDisc | null]> = {
  "p-carolina": ["D", "C"],
  "p-pamela": ["I", "D"],
  "p-daniela": ["C", "S"],
  "p-luana": ["D", "I"],
  "p-kimbelly": ["S", "C"],
  "p-diana": ["S", "C"],
  "p-mercia": ["S", "I"],
  "p-layane": ["S", "C"],
  "p-rute": ["I", "S"],
  "p-paola": ["I", "C"],
  "p-edy": ["C", "D"],
  "p-alef": ["C", "S"],
};

/** Fatores mais provaveis por setor; a repeticao pondera o sorteio. */
const VIES_DISC_POR_SETOR: Record<string, readonly FatorDisc[]> = {
  "s-caixa": ["S", "S", "S", "C"],
  "s-reserva": ["S", "C", "C", "D"],
  "s-picking": ["S", "C", "D"],
  "s-sfs": ["C", "S", "D"],
  "s-pd": ["C", "C", "S"],
  "s-vm": ["I", "I", "C", "S"],
  "s-vmo": ["I", "C", "S"],
  "s-oploja": ["I", "S", "S", "D"],
  "s-provadores": ["I", "S"],
};

function gerarPerfis(): PerfilComportamental[] {
  const perfis: PerfilComportamental[] = [];
  const corteAdmissao = diasAtrasIso(90);
  let sequencia = 0;

  for (const colaborador of colaboradoresIniciais) {
    if (colaborador.status === "desligado") continue;
    // Assessment aplicado apos a integracao; temporarios ficam de fora.
    if (!colaborador.data_admissao || colaborador.data_admissao > corteAdmissao) {
      continue;
    }
    if (colaborador.tipo_contrato === "Temporário") continue;

    const fixo = PERFIS_NARRATIVA[colaborador.id];
    let primario: FatorDisc;
    let secundario: FatorDisc | null;
    if (fixo) {
      [primario, secundario] = fixo;
    } else {
      const vies = colaborador.setor_id
        ? (VIES_DISC_POR_SETOR[colaborador.setor_id] ?? FATORES_DISC)
        : FATORES_DISC;
      primario = escolher(vies);
      secundario =
        aleatorio() < 0.85
          ? escolher(FATORES_DISC.filter((fator) => fator !== primario))
          : null;
    }

    sequencia += 1;
    perfis.push({
      id: `pc-seed-${sequencia}`,
      colaborador_id: colaborador.id,
      metodologia: "disc",
      fator_primario: primario,
      fator_secundario: secundario,
      // Onda unica de mapeamento, encerrada ha ~45 dias; como todos os
      // avaliados tem 90+ dias de casa, a data nunca antecede a admissao.
      data_avaliacao: diasAtrasIso(inteiro(45, 85)),
    });
  }

  return perfis;
}

const perfisIniciais: PerfilComportamental[] = gerarPerfis();

/**
 * Fase 8: planos de sucessao. Diferente dos geradores anteriores, este e um
 * mapa fixo — sucessao e uma leitura curada, nao um sorteio: cada plano nasce
 * de uma posicao especifica na matriz 9-box e aponta um cargo-alvo plausivel.
 *
 * A narrativa se sustenta: Luana, unica Estrela, e a sucessora pronta para
 * Supervisor; os demais formam o banco com prontidao escalonada. O que a tela
 * NAO anuncia, mas o banco por cargo revela: a lideranca do Caixa nao tem
 * sucessor mapeado — o mesmo setor que sangra por escala tambem esta sem
 * banco. Alef, alta performance e baixo potencial (Especialista no 9-box),
 * fica de fora de proposito: nem todo bom tecnico e candidato a lideranca.
 */
const PLANOS_NARRATIVA: {
  colaborador_id: string;
  cargo_alvo_id: string;
  prontidao: Prontidao;
  gaps: Competencia[];
}[] = [
  {
    colaborador_id: "p-luana",
    cargo_alvo_id: "c-supervisor",
    prontidao: "pronto",
    gaps: ["visao_negocio"],
  },
  {
    colaborador_id: "p-rute",
    cargo_alvo_id: "c-supervisor",
    prontidao: "6_meses",
    gaps: ["planejamento", "visao_negocio"],
  },
  {
    colaborador_id: "p-paola",
    cargo_alvo_id: "c-supervisor",
    prontidao: "12_meses",
    gaps: ["gestao_pessoas", "orientacao_resultado", "visao_negocio"],
  },
  {
    colaborador_id: "p-savana",
    cargo_alvo_id: "c-lider",
    prontidao: "6_meses",
    gaps: ["lideranca", "planejamento"],
  },
  {
    colaborador_id: "p-ester",
    cargo_alvo_id: "c-lider",
    prontidao: "12_meses",
    gaps: ["lideranca", "gestao_pessoas", "conhecimento_tecnico"],
  },
  {
    colaborador_id: "p-matheus",
    cargo_alvo_id: "c-lider",
    prontidao: "12_meses",
    gaps: ["lideranca", "comunicacao", "planejamento"],
  },
];

function gerarPlanosSucessao(): PlanoSucessao[] {
  return PLANOS_NARRATIVA.map((plano, indice) => ({
    id: `ps-seed-${indice + 1}`,
    colaborador_id: plano.colaborador_id,
    cargo_alvo_id: plano.cargo_alvo_id,
    prontidao: plano.prontidao,
    gaps: plano.gaps,
    // Ultima revisao do comite, encerrada ha ~40 dias.
    data_atualizacao: diasAtrasIso(inteiro(35, 55)),
    cargo_alvo: nomeCargo(plano.cargo_alvo_id),
  }));
}

const planosSucessaoIniciais: PlanoSucessao[] = gerarPlanosSucessao();

/**
 * Fase 1: historico de carreira. Mapa fixo, coerente com o quadro atual — as
 * promocoes explicam como os lideres e supervisores chegaram ao cargo de hoje,
 * e as transferencias/mudancas de turno cruzam com a narrativa (Tiago abriu o
 * Picking; Diana foi para a tarde do Caixa, o turno que depois sangra). Datas
 * relativas, sempre depois da admissao e antes de hoje.
 */
const MOVIMENTACOES_NARRATIVA: {
  colaborador_id: string;
  tipo: TipoMovimentacao;
  diasAtras: number;
  de: string | null;
  para: string;
}[] = [
  { colaborador_id: "p-carolina", tipo: "promocao", diasAtras: 900, de: "Líder", para: "Supervisor" },
  { colaborador_id: "p-pamela", tipo: "promocao", diasAtras: 850, de: "Líder", para: "Supervisor" },
  { colaborador_id: "p-daniela", tipo: "promocao", diasAtras: 820, de: "Líder", para: "Supervisor" },
  { colaborador_id: "p-luana", tipo: "promocao", diasAtras: 760, de: "Operador de Loja", para: "Líder" },
  { colaborador_id: "p-kimbelly", tipo: "promocao", diasAtras: 690, de: "Operador de Caixa", para: "Líder" },
  { colaborador_id: "p-paola", tipo: "promocao", diasAtras: 610, de: "Visual Merchandiser", para: "Líder" },
  { colaborador_id: "p-edy", tipo: "promocao", diasAtras: 500, de: "Visual Merchandiser", para: "Líder" },
  { colaborador_id: "p-rute", tipo: "promocao", diasAtras: 540, de: "Operador de Loja", para: "Líder" },
  { colaborador_id: "p-tiago", tipo: "transferencia", diasAtras: 210, de: "Reserva", para: "Picking (Reposição)" },
  { colaborador_id: "p-diana", tipo: "mudanca_turno", diasAtras: 250, de: "Manhã", para: "Tarde" },
  { colaborador_id: "p-sara", tipo: "mudanca_turno", diasAtras: 180, de: "Manhã", para: "Tarde" },
];

const movimentacoesIniciais: Movimentacao[] = MOVIMENTACOES_NARRATIVA.map(
  (mov, indice) => ({
    id: `mov-seed-${indice + 1}`,
    colaborador_id: mov.colaborador_id,
    tipo: mov.tipo,
    data: diasAtrasIso(mov.diasAtras),
    de: mov.de,
    para: mov.para,
  }),
);

interface EstadoDemo {
  setores: Setor[];
  cargos: Cargo[];
  colaboradores: Colaborador[];
  ocorrencias: Ocorrencia[];
  afastamentos: Afastamento[];
  vagas: Vaga[];
  vagaEventos: VagaEvento[];
  indicadores: IndicadorMensal[];
  avaliacoes: Avaliacao[];
  perfis: PerfilComportamental[];
  planosSucessao: PlanoSucessao[];
  movimentacoes: Movimentacao[];
}

// A chave versionada descarta estados de formatos antigos que sobrevivem no
// globalThis durante o desenvolvimento.
const escopoGlobal = globalThis as typeof globalThis & {
  __estadoDemoV10?: EstadoDemo;
};

const estado: EstadoDemo = (escopoGlobal.__estadoDemoV10 ??= {
  setores: setoresIniciais,
  cargos: cargosIniciais,
  colaboradores: colaboradoresIniciais,
  ocorrencias: ocorrenciasIniciais,
  afastamentos: afastamentosIniciais,
  vagas: vagasIniciais,
  vagaEventos: vagaEventosIniciais,
  indicadores: indicadoresIniciais,
  avaliacoes: avaliacoesIniciais,
  perfis: perfisIniciais,
  planosSucessao: planosSucessaoIniciais,
  movimentacoes: movimentacoesIniciais,
});

export const setoresDemo = estado.setores;
export const cargosDemo = estado.cargos;
export const colaboradoresDemo = estado.colaboradores;
export const ocorrenciasDemo = estado.ocorrencias;
export const afastamentosDemo = estado.afastamentos;
export const vagasDemo = estado.vagas;
export const vagaEventosDemo = estado.vagaEventos;
export const indicadoresDemo = estado.indicadores;
export const avaliacoesDemo = estado.avaliacoes;
export const perfisDemo = estado.perfis;
export const planosSucessaoDemo = estado.planosSucessao;
export const movimentacoesDemo = estado.movimentacoes;
