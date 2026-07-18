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
  turnoverPrecoce,
} from "@/lib/analytics/turnover";
import { diasAtrasIso, hojeIso } from "@/lib/datas";
import {
  MOTIVOS_DESLIGAMENTO,
  TURNOS,
  type Afastamento,
  type Colaborador,
  type Ocorrencia,
  type PlanoSucessao,
  type Setor,
  type Vaga,
} from "@/lib/data/tipos";

/**
 * Central de insights. Um insight vai alem do alerta: parte de uma PERGUNTA,
 * apresenta a EVIDENCIA nos dados, arrisca uma HIPOTESE explicitamente rotulada
 * como tal e sugere uma ACAO. A disciplina do modulo e nunca deixar a hipotese
 * passar por conclusao — correlacao nao e causa, e cada texto diz isso.
 */

export type CategoriaInsight =
  | "escala"
  | "turnover"
  | "cobertura"
  | "sucessao";

export type PrioridadeInsight = "alta" | "media";

export interface Insight {
  id: string;
  categoria: CategoriaInsight;
  prioridade: PrioridadeInsight;
  pergunta: string;
  evidencia: string;
  hipotese: string;
  acao: string;
  href: string;
}

export const CATEGORIA_INSIGHT_LABEL: Record<CategoriaInsight, string> = {
  escala: "Escala e frequência",
  turnover: "Retenção",
  cobertura: "Cobertura",
  sucessao: "Sucessão",
};

const CARGOS_CHAVE_IDS = ["c-gerente", "c-coordenador", "c-supervisor", "c-lider"];

function umDecimal(valor: number): string {
  return valor.toFixed(1).replace(".", ",");
}

export interface DadosInsights {
  colaboradores: Colaborador[];
  setores: Setor[];
  ocorrencias: Ocorrencia[];
  afastamentos: Afastamento[];
  vagas: Vaga[];
  planosSucessao: PlanoSucessao[];
  periodo: Periodo;
}

/**
 * Insight de escala: um setor cujas saidas voluntarias compartilham motivo e
 * turno, com o absenteismo do setor concentrado no inicio da semana. E o
 * padrao mais forte da operacao quando os tres sinais apontam junto.
 */
function insightsEscala(dados: DadosInsights): Insight[] {
  const { colaboradores, setores, ocorrencias, afastamentos, periodo } = dados;
  const quadro = colaboradores.filter((c) => c.status !== "desligado");
  const diasPerdidosLoja = listarDiasPerdidos(ocorrencias, afastamentos, periodo);
  const taxaLoja = taxaAbsenteismo(diasPerdidosLoja.length, quadro.length, periodo);
  const desligados12m = desligadosDesde(colaboradores, diasAtrasIso(365));

  const insights: Insight[] = [];
  for (const setor of setores) {
    const voluntarias = desligados12m.filter(
      (c) => c.setor_id === setor.id && c.tipo_desligamento === "voluntario",
    );
    if (voluntarias.length < 2) continue;

    // Motivo predominante entre as saidas voluntarias do setor.
    const porMotivo = new Map<string, Colaborador[]>();
    for (const pessoa of voluntarias) {
      const motivo = pessoa.motivo_desligamento ?? "outro";
      porMotivo.set(motivo, [...(porMotivo.get(motivo) ?? []), pessoa]);
    }
    const [motivoTop, lista] = [...porMotivo.entries()].sort(
      (a, b) => b[1].length - a[1].length,
    )[0];
    if (lista.length < 2) continue;

    // Turno unico compartilhado por essas saidas, se houver.
    const turnos = new Set(lista.map((c) => c.turno));
    const turnoUnico = turnos.size === 1 ? [...turnos][0] : null;

    // Absenteismo do setor e concentracao em domingos/segundas.
    const idsEquipe = new Set(
      quadro.filter((c) => c.setor_id === setor.id).map((c) => c.id),
    );
    const perdidosSetor = diasPerdidosLoja.filter((d) =>
      idsEquipe.has(d.colaborador_id),
    );
    const taxaSetor = taxaAbsenteismo(
      perdidosSetor.length,
      idsEquipe.size,
      periodo,
    );
    const domSeg = perdidosSetor.filter((d) => {
      const dia = new Date(`${d.data}T00:00:00`).getDay();
      return dia === 0 || dia === 1;
    }).length;
    const pctDomSeg =
      perdidosSetor.length > 0
        ? Math.round((domSeg / perdidosSetor.length) * 100)
        : 0;

    const turnoTexto = turnoUnico
      ? ` do turno da ${TURNOS[turnoUnico].toLowerCase()}`
      : "";
    const razaoTexto =
      taxaSetor !== null && taxaLoja !== null && taxaLoja > 0
        ? ` (${(taxaSetor / taxaLoja).toFixed(1).replace(".", ",")}x a média da loja)`
        : "";

    insights.push({
      id: `insight-escala-${setor.id}`,
      categoria: "escala",
      prioridade: lista.length >= 3 ? "alta" : "media",
      pergunta: `Por que ${setor.nome} perde gente${turnoTexto}?`,
      evidencia: `${lista.length} saídas voluntárias em 12 meses, todas com motivo declarado "${
        MOTIVOS_DESLIGAMENTO[motivoTop] ?? motivoTop
      }"${turnoUnico ? `, todas${turnoTexto}` : ""}. Absenteísmo do setor em ${
        taxaSetor !== null ? umDecimal(taxaSetor) : "—"
      }%${razaoTexto}, com ${pctDomSeg}% das ausências caindo em domingos e segundas.`,
      hipotese: `A escala pode estar no centro: quando o motivo declarado das saídas e o padrão de faltas apontam para os mesmos dias, a previsibilidade de folga costuma ser o fator comum. É uma correlação, não uma causa confirmada.`,
      acao: `Revisar a escala de ${setor.nome}${turnoTexto}, priorizando previsibilidade de folgas de fim de semana, e ouvir o time antes de concluir.`,
      href: `/absenteismo?setor=${setor.id}`,
    });
  }
  return insights;
}

/** Insight de turnover precoce: parcela alta das saidas nos primeiros 90 dias. */
function insightsTurnover(dados: DadosInsights): Insight[] {
  const { colaboradores } = dados;
  const desligados12m = desligadosDesde(colaboradores, diasAtrasIso(365));
  if (desligados12m.length < 4) return [];

  const precoce = turnoverPrecoce(desligados12m, 90);
  if (precoce === null || precoce < 25) return [];

  const qtdPrecoce = desligados12m.filter((c) => {
    const dias = tempoDeCasaDias(c);
    return dias !== null && dias <= 90;
  }).length;

  return [
    {
      id: "insight-turnover-precoce",
      categoria: "turnover",
      prioridade: precoce >= 40 ? "alta" : "media",
      pergunta: "As saídas estão acontecendo cedo demais?",
      evidencia: `${umDecimal(precoce)}% dos desligamentos dos últimos 12 meses (${qtdPrecoce} de ${desligados12m.length}) ocorreram com até 90 dias de casa.`,
      hipotese: `Saídas concentradas no início costumam apontar para o encaixe entre a expectativa criada na seleção e a realidade das primeiras semanas — integração, escala ou clareza da função. Hipótese a investigar, não veredito.`,
      acao: `Revisar a jornada dos primeiros 90 dias: combinação de expectativas na seleção, integração e acompanhamento próximo do gestor no período de experiência.`,
      href: "/turnover",
    },
  ];
}

/** Insight de cobertura: setor sub-dimensionado com reposicao travada. */
function insightsCobertura(dados: DadosInsights): Insight[] {
  const { colaboradores, setores, vagas } = dados;
  const insights: Insight[] = [];

  for (const setor of setores) {
    if (setor.headcount_planejado < 3) continue;
    const ativos = colaboradores.filter(
      (c) => c.setor_id === setor.id && c.status === "ativo",
    ).length;
    const ocupacao = ativos / setor.headcount_planejado;
    if (ocupacao >= 0.7) continue;

    const vagaAtrasada = vagas.find(
      (v) => v.setor_id === setor.id && vagaEmAtraso(v),
    );
    if (!vagaAtrasada) continue;

    const diasAtraso = diasEntre(vagaAtrasada.data_limite as string, hojeIso());
    insights.push({
      id: `insight-cobertura-${setor.id}`,
      categoria: "cobertura",
      prioridade: ocupacao < 0.5 ? "alta" : "media",
      pergunta: `A sobrecarga em ${setor.nome} está se retroalimentando?`,
      evidencia: `Quadro em ${Math.round(ocupacao * 100)}% do planejado (${ativos} de ${
        setor.headcount_planejado
      }) e a vaga de reposição está ${diasAtraso} dias além da meta.`,
      hipotese: `Quadro reduzido com reposição atrasada tende a sobrecarregar quem fica, o que pode alimentar mais ausências e saídas — um ciclo que se realimenta. Correlação plausível, a confirmar no acompanhamento.`,
      acao: `Priorizar o preenchimento da vaga em atraso e, no curto prazo, redistribuir a carga do setor para conter o efeito cascata.`,
      href: `/vagas/${vagaAtrasada.id}`,
    });
  }
  return insights;
}

/** Insight de sucessao: cargo-chave ocupado sem sucessor pronto. */
function insightsSucessao(dados: DadosInsights): Insight[] {
  const { colaboradores, planosSucessao } = dados;
  const quadro = colaboradores.filter((c) => c.status !== "desligado");

  const cargosChave = new Set(
    quadro
      .filter((c) => c.cargo_id && CARGOS_CHAVE_IDS.includes(c.cargo_id))
      .map((c) => c.cargo?.nome)
      .filter((nome): nome is string => Boolean(nome)),
  );

  const planosAtivos = [
    ...planoPorPessoa(
      planosSucessao.filter((p) =>
        quadro.some((c) => c.id === p.colaborador_id),
      ),
    ).values(),
  ];

  const insights: Insight[] = [];
  for (const cargoNome of cargosChave) {
    const candidatos = planosAtivos.filter((p) => p.cargo_alvo?.nome === cargoNome);
    const prontos = candidatos.filter((p) => p.prontidao === "pronto").length;
    if (prontos > 0) continue;

    insights.push({
      id: `insight-sucessao-${cargoNome}`,
      categoria: "sucessao",
      prioridade: candidatos.length === 0 ? "alta" : "media",
      pergunta: `Quem assume ${cargoNome} se a posição vagar amanhã?`,
      evidencia:
        candidatos.length === 0
          ? `Nenhum sucessor mapeado no banco para ${cargoNome}.`
          : `${candidatos.length} candidato(s) mapeado(s) para ${cargoNome}, nenhum classificado como pronto para assumir agora.`,
      hipotese: `Cargos-chave sem sucessor pronto concentram risco de continuidade: uma saída inesperada deixaria a operação descoberta enquanto um substituto é preparado ou buscado no mercado.`,
      acao:
        candidatos.length === 0
          ? `Mapear candidatos internos para ${cargoNome} e abrir um plano de desenvolvimento com marcos de prontidão.`
          : `Acelerar o PDI dos candidatos a ${cargoNome}, priorizando os gaps que os separam da prontidão imediata.`,
      href: "/talentos",
    });
  }
  return insights;
}

const ORDEM_PRIORIDADE: Record<PrioridadeInsight, number> = { alta: 0, media: 1 };

/** Todos os insights, dos mais prioritarios para os demais. */
export function gerarInsights(dados: DadosInsights): Insight[] {
  return [
    ...insightsEscala(dados),
    ...insightsTurnover(dados),
    ...insightsCobertura(dados),
    ...insightsSucessao(dados),
  ].sort(
    (a, b) =>
      ORDEM_PRIORIDADE[a.prioridade] - ORDEM_PRIORIDADE[b.prioridade] ||
      a.categoria.localeCompare(b.categoria),
  );
}
