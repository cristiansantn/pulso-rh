import Link from "next/link";
import { FirstAidKit, Plus } from "@phosphor-icons/react/dist/ssr";
import {
  TabelaAfastamentos,
  TabelaFaltasAtestados,
  type DadosFicha,
} from "@/components/frequencia/tabelas-frequencia";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import {
  formatarTaxa,
  listarDiasPerdidos,
  taxaAbsenteismo,
} from "@/lib/analytics/absenteismo";
import { listarColaboradores } from "@/lib/data/colaboradores";
import { listarAfastamentos, listarOcorrencias } from "@/lib/data/frequencia";
import { listarSetores } from "@/lib/data/setores";
import {
  CATEGORIAS_AFASTAMENTO,
  TIPOS_AFASTAMENTO,
  TIPOS_OCORRENCIA,
} from "@/lib/data/tipos";
import { diasAtrasIso, formatarDataBr, hojeIso } from "@/lib/datas";

const PERIODOS: Record<string, string> = {
  "7": "Últimos 7 dias",
  "15": "Últimos 15 dias",
  "30": "Últimos 30 dias",
  "60": "Últimos 60 dias",
  "90": "Últimos 90 dias",
};

const SELECT_FILTRO =
  "rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink-soft " +
  "focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-line";

function formatarPeriodo(inicio: string, fim: string | null): string {
  if (!fim || fim === inicio) return formatarDataBr(inicio);
  return `${formatarDataBr(inicio)} a ${formatarDataBr(fim)}`;
}

/** Painel operacional de frequencia: ocorrencias e afastamentos do periodo. */
export default async function FrequenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; setor?: string }>;
}) {
  const params = await searchParams;
  const periodoDias = PERIODOS[params.periodo ?? ""] ? Number(params.periodo) : 30;
  const setorId = params.setor;

  const hoje = hojeIso();
  const inicio = diasAtrasIso(periodoDias);
  const periodo = { inicio, fim: hoje };

  const [colaboradores, setores, ocorrenciasTodas, afastamentosTodos] =
    await Promise.all([
      listarColaboradores(),
      listarSetores(),
      listarOcorrencias({ desde: inicio }),
      listarAfastamentos({ desde: inicio }),
    ]);

  const colabPorId = new Map(colaboradores.map((c) => [c.id, c]));
  const noSetor = new Set(
    colaboradores.filter((c) => !setorId || c.setor_id === setorId).map((c) => c.id),
  );

  const ocorrencias = ocorrenciasTodas.filter((o) => noSetor.has(o.colaborador_id));
  const afastamentos = afastamentosTodos.filter((a) => noSetor.has(a.colaborador_id));
  const quadroAtual = colaboradores.filter(
    (c) => c.status !== "desligado" && noSetor.has(c.id),
  );

  const faltas = ocorrencias.filter(
    (o) => o.tipo === "falta_injustificada" || o.tipo === "falta_justificada",
  );
  const faltasInjustificadas = faltas.filter(
    (o) => o.tipo === "falta_injustificada",
  );

  const diasPerdidos = listarDiasPerdidos(ocorrencias, afastamentos, periodo);
  const taxa = taxaAbsenteismo(diasPerdidos.length, quadroAtual.length, periodo);

  const afastamentosEmCurso = afastamentos.filter(
    (a) => a.data_inicio <= hoje && (a.data_fim === null || a.data_fim >= hoje),
  );

  const atestados = afastamentos.filter((a) => a.tipo === "atestado");
  const afastamentosEspeciais = afastamentos.filter((a) => a.tipo === "afastamento");

  function montarFicha(a: (typeof afastamentos)[0]): DadosFicha {
    const colab = colabPorId.get(a.colaborador_id);
    return {
      afastamento: a,
      nomeColaborador: colab?.nome ?? "—",
      matricula: colab?.matricula ?? "—",
      colaboradorId: a.colaborador_id,
      dataFormatadaInicio: formatarDataBr(a.data_inicio),
      dataFormatadaFim: a.data_fim ? formatarDataBr(a.data_fim) : null,
      emCurso: a.data_inicio <= hoje && (a.data_fim === null || a.data_fim >= hoje),
    };
  }

  const linhasFrequencia = [
    ...faltas.map((o) => ({
      id: o.id,
      colaboradorId: o.colaborador_id,
      nomeColaborador: colabPorId.get(o.colaborador_id)?.nome ?? "—",
      rotulo: TIPOS_OCORRENCIA[o.tipo],
      periodoFormatado: formatarPeriodo(o.data_inicio, o.data_fim),
      ficha: null as DadosFicha | null,
      _sort: o.data_inicio,
    })),
    ...atestados.map((a) => ({
      id: a.id,
      colaboradorId: a.colaborador_id,
      nomeColaborador: colabPorId.get(a.colaborador_id)?.nome ?? "—",
      rotulo: TIPOS_AFASTAMENTO[a.tipo],
      periodoFormatado: formatarPeriodo(a.data_inicio, a.data_fim),
      ficha: montarFicha(a) as DadosFicha | null,
      _sort: a.data_inicio,
    })),
  ]
    .sort((a, b) => b._sort.localeCompare(a._sort))
    .map(({ _sort, ...rest }) => rest);

  const linhasAfastamentos = afastamentosEspeciais.map((a) => ({
    id: a.id,
    colaboradorId: a.colaborador_id,
    nomeColaborador: colabPorId.get(a.colaborador_id)?.nome ?? "—",
    tipo: a.tipo,
    categoria: a.categoria,
    dataInicioFormatada: formatarDataBr(a.data_inicio),
    dataFimFormatada: a.data_fim ? formatarDataBr(a.data_fim) : null,
    emCurso: a.data_inicio <= hoje && (a.data_fim === null || a.data_fim >= hoje),
    ficha: montarFicha(a),
  }));

  const tituloSecao = PERIODOS[String(periodoDias)].toLowerCase();
  const filtroAtivo = Boolean(params.periodo || params.setor);

  return (
    <>
      <PageHeader
        titulo="Escala & Frequência"
        descricao="Faltas e afastamentos da operação. Folgas, atrasos, escala planejada x realizada e banco de horas entram nos próximos incrementos."
      >
        <Link
          href="/frequencia/afastamento"
          className="flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-neutral-soft/60"
        >
          <FirstAidKit size={15} />
          Registrar afastamento
        </Link>
        <Link
          href="/frequencia/nova"
          className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-panel transition-opacity hover:opacity-90"
        >
          <Plus size={15} />
          Registrar ocorrência
        </Link>
      </PageHeader>

      <form className="mb-4 flex flex-wrap items-center gap-2">
        <select name="periodo" defaultValue={String(periodoDias)} className={SELECT_FILTRO}>
          {Object.entries(PERIODOS).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
        <select name="setor" defaultValue={setorId ?? ""} className={SELECT_FILTRO}>
          <option value="">Todos os setores</option>
          {setores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-neutral-soft/60"
        >
          Filtrar
        </button>
        {filtroAtivo && (
          <Link
            href="/frequencia"
            className="px-2 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Limpar
          </Link>
        )}
      </form>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard rotulo="Faltas no período" valor={String(faltas.length)} />
        <KpiCard
          rotulo="Injustificadas"
          valor={String(faltasInjustificadas.length)}
          detalhe="Faltas sem justificativa no período"
        />
        <KpiCard
          rotulo="Afastamentos em curso"
          valor={String(afastamentosEmCurso.length)}
        />
        <KpiCard
          rotulo="Em férias hoje"
          valor={String(quadroAtual.filter((c) => c.status === "ferias").length)}
        />
        <KpiCard
          rotulo="Absenteísmo no período"
          valor={formatarTaxa(taxa)}
          detalhe="Aproximação: dias corridos x quadro atual"
        />
      </section>

      <TabelaFaltasAtestados linhas={linhasFrequencia} tituloSecao={tituloSecao} />

      <TabelaAfastamentos linhas={linhasAfastamentos} tituloSecao={tituloSecao} />
    </>
  );
}
