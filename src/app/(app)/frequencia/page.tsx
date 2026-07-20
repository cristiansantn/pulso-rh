import Link from "next/link";
import { FirstAidKit, Plus } from "@phosphor-icons/react/dist/ssr";
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

  const nomePorId = new Map(colaboradores.map((c) => [c.id, c.nome]));
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

  // Atestados sao ocorrencias do dia a dia e ficam na lista de cima; a secao
  // de baixo guarda so os casos especiais (INSS, licencas e afins).
  const atestados = afastamentos.filter((a) => a.tipo === "atestado");
  const afastamentosEspeciais = afastamentos.filter((a) => a.tipo === "afastamento");

  const linhasFrequencia = [
    ...faltas.map((o) => ({
      id: o.id,
      colaborador_id: o.colaborador_id,
      rotulo: TIPOS_OCORRENCIA[o.tipo],
      inicio: o.data_inicio,
      fim: o.data_fim,
      ficha: null as string | null,
    })),
    ...atestados.map((a) => ({
      id: a.id,
      colaborador_id: a.colaborador_id,
      rotulo: TIPOS_AFASTAMENTO[a.tipo],
      inicio: a.data_inicio,
      fim: a.data_fim,
      ficha: `/frequencia/afastamento/${a.id}`,
    })),
  ].sort((a, b) => b.inicio.localeCompare(a.inicio));

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

      <section className="mt-6 overflow-hidden rounded-lg border border-line bg-panel">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-sm font-semibold">
            Faltas e atestados — {PERIODOS[String(periodoDias)].toLowerCase()}
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            O dia a dia da frequência. O histórico completo de cada pessoa fica
            na ficha individual; atestados abrem a ficha do registro.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-muted">
              <th className="px-6 py-2.5 font-medium">Associado</th>
              <th className="px-6 py-2.5 font-medium">Tipo</th>
              <th className="px-6 py-2.5 font-medium">Período</th>
              <th className="px-6 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody>
            {linhasFrequencia.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-ink-muted">
                  Nenhuma falta ou atestado registrado no período.
                </td>
              </tr>
            )}
            {linhasFrequencia.map((linha) => (
              <tr
                key={linha.id}
                className="border-b border-line transition-colors last:border-0 hover:bg-surface"
              >
                <td className="px-6 py-3">
                  <Link href={`/pessoas/${linha.colaborador_id}`} className="font-medium">
                    {nomePorId.get(linha.colaborador_id) ?? "—"}
                  </Link>
                </td>
                <td className="px-6 py-3 text-ink-soft">{linha.rotulo}</td>
                <td className="px-6 py-3 text-ink-soft">
                  {formatarPeriodo(linha.inicio, linha.fim)}
                </td>
                <td className="px-6 py-3 text-right">
                  {linha.ficha && (
                    <Link
                      href={linha.ficha}
                      className="text-xs font-medium text-ink-soft underline-offset-2 hover:underline"
                    >
                      Abrir ficha
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-line bg-panel">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-sm font-semibold">
            Afastamentos — {PERIODOS[String(periodoDias)].toLowerCase()}
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Somente casos especiais: INSS, licenças e afins. Os detalhes ficam na
            ficha do afastamento; quando houver papéis de acesso, esta seção passa
            a ser restrita (LGPD).
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-muted">
              <th className="px-6 py-2.5 font-medium">Associado</th>
              <th className="px-6 py-2.5 font-medium">Tipo</th>
              <th className="px-6 py-2.5 font-medium">Categoria</th>
              <th className="px-6 py-2.5 font-medium">Início</th>
              <th className="px-6 py-2.5 font-medium">Retorno previsto</th>
              <th className="px-6 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody>
            {afastamentosEspeciais.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-ink-muted">
                  Nenhum afastamento registrado no período.
                </td>
              </tr>
            )}
            {afastamentosEspeciais.map((a) => {
              const emCurso =
                a.data_inicio <= hoje && (a.data_fim === null || a.data_fim >= hoje);
              return (
                <tr
                  key={a.id}
                  className="border-b border-line transition-colors last:border-0 hover:bg-surface"
                >
                  <td className="px-6 py-3">
                    <Link href={`/pessoas/${a.colaborador_id}`} className="font-medium">
                      {nomePorId.get(a.colaborador_id) ?? "—"}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-ink-soft">{TIPOS_AFASTAMENTO[a.tipo]}</td>
                  <td className="px-6 py-3 text-ink-soft">
                    {CATEGORIAS_AFASTAMENTO[a.categoria]}
                  </td>
                  <td className="px-6 py-3 text-ink-soft">{formatarDataBr(a.data_inicio)}</td>
                  <td className="px-6 py-3 text-ink-soft">
                    {a.data_fim ? formatarDataBr(a.data_fim) : "Indeterminado"}
                    {emCurso && (
                      <span className="ml-2 inline-flex rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">
                        Em curso
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Link
                      href={`/frequencia/afastamento/${a.id}`}
                      className="text-xs font-medium text-ink-soft underline-offset-2 hover:underline"
                    >
                      Abrir ficha
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
