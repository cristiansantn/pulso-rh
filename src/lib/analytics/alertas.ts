import {
  listarDiasPerdidos,
  taxaAbsenteismo,
  type Periodo,
} from "@/lib/analytics/absenteismo";
import { diasEntre, vagaEmAtraso } from "@/lib/analytics/recrutamento";
import { planoPorPessoa } from "@/lib/analytics/talentos";
import {
  desligadosDesde,
  tempoDeCasaDias,
} from "@/lib/analytics/turnover";
import { diasAtrasIso, hojeIso } from "@/lib/datas";
import type {
  Afastamento,
  Colaborador,
  Ocorrencia,
  PlanoSucessao,
  Setor,
  Vaga,
} from "@/lib/data/tipos";
import { CARGOS_CHAVE_NOMES, TURNOS } from "@/lib/data/tipos";

/**
 * Motor de alertas. Cada regra compara um recorte com uma referencia (a media
 * da loja, uma meta declarada ou um limiar operacional) e so dispara quando o
 * desvio e material. Todo alerta carrega a evidencia numerica que o justifica
 * e um link para investigar — o alerta aponta o desvio, nunca conclui a causa.
 */

export type SeveridadeAlerta = "alta" | "media" | "baixa";

export type CategoriaAlerta =
  | "absenteismo"
  | "vaga_atraso"
  | "turnover_precoce"
  | "cobertura"
  | "sucessao";

export interface Alerta {
  id: string;
  categoria: CategoriaAlerta;
  severidade: SeveridadeAlerta;
  titulo: string;
  /** Evidencia numerica que sustenta o alerta. */
  descricao: string;
  /** Rota para investigar o alerta, ja filtrada quando aplicavel. */
  href: string;
}

export const ORDEM_SEVERIDADE: Record<SeveridadeAlerta, number> = {
  alta: 0,
  media: 1,
  baixa: 2,
};

export const SEVERIDADE_LABEL: Record<SeveridadeAlerta, string> = {
  alta: "Prioridade alta",
  media: "Atenção",
  baixa: "Acompanhar",
};

export const CATEGORIA_LABEL: Record<CategoriaAlerta, string> = {
  absenteismo: "Absenteísmo",
  vaga_atraso: "Vaga em atraso",
  turnover_precoce: "Turnover precoce",
  cobertura: "Cobertura de quadro",
  sucessao: "Sucessão",
};

function umDecimal(valor: number): string {
  return valor.toFixed(1).replace(".", ",");
}

export interface DadosAlertas {
  colaboradores: Colaborador[];
  setores: Setor[];
  ocorrencias: Ocorrencia[];
  afastamentos: Afastamento[];
  vagas: Vaga[];
  planosSucessao: PlanoSucessao[];
  periodo: Periodo;
}

/** Absenteismo de setor acima da media da loja (ultimos 90 dias). */
function alertasAbsenteismo(dados: DadosAlertas): Alerta[] {
  const { colaboradores, setores, ocorrencias, afastamentos, periodo } = dados;
  const quadro = colaboradores.filter((c) => c.status !== "desligado");
  const diasPerdidos = listarDiasPerdidos(ocorrencias, afastamentos, periodo);
  const taxaGeral = taxaAbsenteismo(diasPerdidos.length, quadro.length, periodo);
  if (taxaGeral === null || taxaGeral === 0) return [];

  const alertas: Alerta[] = [];
  for (const setor of setores) {
    const equipe = quadro.filter((c) => c.setor_id === setor.id);
    if (equipe.length < 2) continue;

    const idsEquipe = new Set(equipe.map((c) => c.id));
    const perdidosSetor = diasPerdidos.filter((d) =>
      idsEquipe.has(d.colaborador_id),
    ).length;
    // Ignora ruido: exige carga minima de dias perdidos no setor.
    if (perdidosSetor < 3) continue;

    const taxaSetor = taxaAbsenteismo(perdidosSetor, equipe.length, periodo);
    if (taxaSetor === null || taxaSetor < taxaGeral * 1.5) continue;

    const razao = taxaSetor / taxaGeral;
    alertas.push({
      id: `abs-${setor.id}`,
      categoria: "absenteismo",
      severidade: razao >= 2.5 ? "alta" : "media",
      titulo: `Absenteísmo elevado em ${setor.nome}`,
      descricao: `${umDecimal(taxaSetor)}% nos últimos 90 dias, contra ${umDecimal(
        taxaGeral,
      )}% da loja (${razao.toFixed(1).replace(".", ",")}x a média).`,
      href: `/absenteismo?setor=${setor.id}`,
    });
  }
  return alertas;
}

/** Vagas abertas alem da meta de preenchimento. */
function alertasVagas(dados: DadosAlertas): Alerta[] {
  const hoje = hojeIso();
  return dados.vagas
    .filter(vagaEmAtraso)
    .map((vaga) => {
      const diasAtraso = diasEntre(vaga.data_limite as string, hoje);
      const turno = vaga.turno ? ` · ${TURNOS[vaga.turno]}` : "";
      return {
        id: `vaga-${vaga.id}`,
        categoria: "vaga_atraso" as const,
        severidade: (diasAtraso > 15 ? "alta" : "media") as SeveridadeAlerta,
        titulo: `Vaga em atraso: ${vaga.cargo?.nome ?? "cargo"} em ${
          vaga.setor?.nome ?? "setor"
        }`,
        descricao: `${diasAtraso} ${
          diasAtraso === 1 ? "dia" : "dias"
        } além da meta de preenchimento${turno}.`,
        href: `/vagas/${vaga.id}`,
      };
    })
    .sort((a, b) => ORDEM_SEVERIDADE[a.severidade] - ORDEM_SEVERIDADE[b.severidade]);
}

/** Setores com saidas precoces (ate 90 dias de casa) nos ultimos 12 meses. */
function alertasTurnoverPrecoce(dados: DadosAlertas): Alerta[] {
  const { colaboradores, setores } = dados;
  const desligados12m = desligadosDesde(colaboradores, diasAtrasIso(365));

  const alertas: Alerta[] = [];
  for (const setor of setores) {
    const precoces = desligados12m.filter((c) => {
      if (c.setor_id !== setor.id) return false;
      const dias = tempoDeCasaDias(c);
      return dias !== null && dias <= 90;
    }).length;
    if (precoces < 2) continue;

    alertas.push({
      id: `tprec-${setor.id}`,
      categoria: "turnover_precoce",
      severidade: precoces >= 3 ? "alta" : "media",
      titulo: `Saídas precoces em ${setor.nome}`,
      descricao: `${precoces} desligamentos com até 90 dias de casa nos últimos 12 meses.`,
      href: `/turnover?setor=${setor.id}`,
    });
  }
  return alertas;
}

/** Setores com quadro ativo abaixo de 70% do headcount planejado. */
function alertasCobertura(dados: DadosAlertas): Alerta[] {
  const { colaboradores, setores } = dados;
  const alertas: Alerta[] = [];

  for (const setor of setores) {
    if (setor.headcount_planejado < 3) continue;
    const ativos = colaboradores.filter(
      (c) => c.setor_id === setor.id && c.status === "ativo",
    ).length;
    const ocupacao = ativos / setor.headcount_planejado;
    if (ocupacao >= 0.7) continue;

    alertas.push({
      id: `cob-${setor.id}`,
      categoria: "cobertura",
      severidade: ocupacao < 0.5 ? "alta" : "media",
      titulo: `Quadro abaixo do planejado em ${setor.nome}`,
      descricao: `${ativos} de ${setor.headcount_planejado} posições ocupadas (${Math.round(
        ocupacao * 100,
      )}% do planejado).`,
      href: `/estrutura/${setor.id}`,
    });
  }
  return alertas;
}

/** Cargos-chave ocupados sem nenhum sucessor pronto agora. */
function alertasSucessao(dados: DadosAlertas): Alerta[] {
  const { colaboradores, planosSucessao } = dados;
  const quadro = colaboradores.filter((c) => c.status !== "desligado");

  // Cargos-chave que existem hoje no quadro.
  const cargosChaveOcupados = new Map<string, string>();
  for (const pessoa of quadro) {
    if (pessoa.cargo?.nome && CARGOS_CHAVE_NOMES.includes(pessoa.cargo.nome)) {
      cargosChaveOcupados.set(pessoa.cargo.nome, pessoa.cargo.nome);
    }
  }

  // Prontidao do banco por cargo-alvo.
  const planosAtivos = [...planoPorPessoa(
    planosSucessao.filter((p) => {
      const pessoa = quadro.find((c) => c.id === p.colaborador_id);
      return pessoa != null;
    }),
  ).values()];

  const candidatosPorCargo = new Map<string, { total: number; prontos: number }>();
  for (const plano of planosAtivos) {
    const nome = plano.cargo_alvo?.nome;
    if (!nome) continue;
    const registro = candidatosPorCargo.get(nome) ?? { total: 0, prontos: 0 };
    registro.total += 1;
    if (plano.prontidao === "pronto") registro.prontos += 1;
    candidatosPorCargo.set(nome, registro);
  }

  const alertas: Alerta[] = [];
  for (const cargoNome of cargosChaveOcupados.keys()) {
    const banco = candidatosPorCargo.get(cargoNome);
    const semBanco = !banco || banco.total === 0;
    const semPronto = !banco || banco.prontos === 0;
    if (!semPronto) continue;

    alertas.push({
      id: `suc-${cargoNome}`,
      categoria: "sucessao",
      severidade: semBanco ? "alta" : "media",
      titulo: `Sem sucessor pronto para ${cargoNome}`,
      descricao: semBanco
        ? `Cargo-chave sem nenhum sucessor mapeado no banco.`
        : `${banco.total} ${
            banco.total === 1 ? "candidato mapeado" : "candidatos mapeados"
          }, nenhum pronto para assumir agora.`,
      href: "/talentos",
    });
  }
  return alertas;
}

/** Todos os alertas, ordenados por severidade e depois por categoria. */
export function gerarAlertas(dados: DadosAlertas): Alerta[] {
  const alertas = [
    ...alertasCobertura(dados),
    ...alertasAbsenteismo(dados),
    ...alertasTurnoverPrecoce(dados),
    ...alertasVagas(dados),
    ...alertasSucessao(dados),
  ];

  return alertas.sort(
    (a, b) =>
      ORDEM_SEVERIDADE[a.severidade] - ORDEM_SEVERIDADE[b.severidade] ||
      a.categoria.localeCompare(b.categoria),
  );
}

/** Contagem por severidade, para o resumo do cockpit. */
export function resumoPorSeveridade(
  alertas: Alerta[],
): Record<SeveridadeAlerta, number> {
  const resumo: Record<SeveridadeAlerta, number> = { alta: 0, media: 0, baixa: 0 };
  for (const alerta of alertas) resumo[alerta.severidade] += 1;
  return resumo;
}
