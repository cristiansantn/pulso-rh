import Link from "next/link";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import {
  cicloMaisRecente,
  competenciasDisponiveis,
  formatarCompetencia,
  formatarValorIndicador,
  media,
  QUADRANTES_9BOX,
  serieMensal,
} from "@/lib/analytics/performance";
import { listarColaboradores } from "@/lib/data/colaboradores";
import { listarAvaliacoes, listarIndicadoresMensais } from "@/lib/data/performance";
import { listarSetores } from "@/lib/data/setores";
import {
  INDICADORES,
  NOTAS_PERFORMANCE,
  NOTAS_POTENCIAL,
  TURNOS,
  type Colaborador,
  type IndicadorMensal,
  type NotaAvaliacao,
  type TipoIndicador,
  type Turno,
} from "@/lib/data/tipos";

const SELECT_FILTRO =
  "rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink-soft " +
  "focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-line";

interface CorteMedia {
  rotulo: string;
  pessoas: number;
  media: number;
}

/** Agrupa lancamentos por um atributo da pessoa e ordena pela media. */
function cortePorAtributo(
  registros: IndicadorMensal[],
  pessoaPorId: Map<string, Colaborador>,
  atributo: (c: Colaborador) => string,
): CorteMedia[] {
  const grupos = new Map<string, { valores: number[]; ids: Set<string> }>();
  for (const registro of registros) {
    const pessoa = pessoaPorId.get(registro.colaborador_id);
    if (!pessoa) continue;
    const chave = atributo(pessoa);
    const grupo = grupos.get(chave) ?? { valores: [], ids: new Set<string>() };
    grupo.valores.push(registro.valor);
    grupo.ids.add(registro.colaborador_id);
    grupos.set(chave, grupo);
  }
  return [...grupos.entries()]
    .map(([rotulo, grupo]) => ({
      rotulo,
      pessoas: grupo.ids.size,
      media: media(grupo.valores) as number,
    }))
    .sort((a, b) => b.media - a.media);
}

function TabelaCorte({
  titulo,
  tipo,
  cortes,
}: {
  titulo: string;
  tipo: TipoIndicador;
  cortes: CorteMedia[];
}) {
  const maior = Math.max(...cortes.map((c) => c.media), 1);

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-panel">
      <div className="border-b border-line px-6 py-4">
        <h2 className="text-sm font-semibold">{titulo}</h2>
      </div>
      {cortes.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-ink-muted">
          Nenhum lançamento no recorte.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-muted">
              <th className="px-6 py-2.5 font-medium">Grupo</th>
              <th className="px-6 py-2.5 text-right font-medium">Pessoas</th>
              <th className="w-2/5 px-6 py-2.5 font-medium">Média</th>
            </tr>
          </thead>
          <tbody>
            {cortes.map((corte) => (
              <tr key={corte.rotulo} className="border-b border-line last:border-0">
                <td className="px-6 py-2.5 font-medium">{corte.rotulo}</td>
                <td className="px-6 py-2.5 text-right text-ink-soft">{corte.pessoas}</td>
                <td className="px-6 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-soft">
                      <div
                        className="h-full rounded-full bg-brand/80"
                        style={{ width: `${(corte.media / maior) * 100}%` }}
                      />
                    </div>
                    <span className="w-24 text-right font-medium">
                      {formatarValorIndicador(tipo, corte.media)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

/**
 * Performance e produtividade (Fase 6). Cada indicador e comparado apenas com
 * ele mesmo — nao existe nota unica de produtividade — e a matriz 9-box
 * reflete a avaliacao do gestor, nao os indicadores.
 */
export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{
    competencia?: string;
    indicador?: string;
    setor?: string;
    turno?: string;
  }>;
}) {
  const params = await searchParams;

  const [colaboradores, setores, indicadores, avaliacoes] = await Promise.all([
    listarColaboradores(),
    listarSetores(),
    listarIndicadoresMensais(),
    listarAvaliacoes(),
  ]);

  const setorId = setores.some((s) => s.id === params.setor) ? params.setor : undefined;
  const turno =
    params.turno && params.turno in TURNOS ? (params.turno as Turno) : undefined;

  const doRecorte = (c: Colaborador) =>
    (!setorId || c.setor_id === setorId) && (!turno || c.turno === turno);
  const pessoaPorId = new Map(colaboradores.map((c) => [c.id, c]));
  const idsRecorte = new Set(colaboradores.filter(doRecorte).map((c) => c.id));
  const ativosRecorte = colaboradores.filter(
    (c) => doRecorte(c) && c.status !== "desligado",
  );

  const indicadoresRecorte = indicadores.filter((i) =>
    idsRecorte.has(i.colaborador_id),
  );

  // Competencias e indicador selecionados, com fallback para o que tem dado.
  const competencias = competenciasDisponiveis(indicadores);
  const competencia = competencias.includes(params.competencia ?? "")
    ? (params.competencia as string)
    : competencias[0];
  const competenciaAnterior = competencias[competencias.indexOf(competencia) + 1];

  const tiposPresentes = (Object.keys(INDICADORES) as TipoIndicador[]).filter(
    (tipo) => indicadoresRecorte.some((i) => i.tipo === tipo),
  );
  const indicadorParam =
    params.indicador && params.indicador in INDICADORES
      ? (params.indicador as TipoIndicador)
      : undefined;
  const indicadorSelecionado =
    indicadorParam && tiposPresentes.includes(indicadorParam)
      ? indicadorParam
      : tiposPresentes[0];

  const daCompetencia = indicadoresRecorte.filter(
    (i) => i.competencia === competencia,
  );
  const pessoasMedidas = new Set(daCompetencia.map((i) => i.colaborador_id)).size;

  // Avaliacoes do ciclo mais recente dentro do recorte.
  const ciclo = cicloMaisRecente(avaliacoes);
  const avaliacoesCiclo = avaliacoes.filter(
    (a) => a.ciclo === ciclo && idsRecorte.has(a.colaborador_id),
  );
  const avaliadoPorId = new Map(avaliacoesCiclo.map((a) => [a.colaborador_id, a]));
  const naoAvaliados = ativosRecorte.filter((c) => !avaliadoPorId.has(c.id)).length;

  const competenciasAsc = [...competencias].reverse();
  const filtroAtivo = Boolean(
    params.competencia || params.indicador || params.setor || params.turno,
  );

  const registrosDoCorte = indicadorSelecionado
    ? daCompetencia.filter((i) => i.tipo === indicadorSelecionado)
    : [];
  const setorPorId = new Map(setores.map((s) => [s.id, s.nome]));

  // Linhas da tabela por pessoa: quem tem lancamento na competencia ou avaliacao.
  const linhasPessoas = colaboradores
    .filter(
      (c) =>
        idsRecorte.has(c.id) &&
        (daCompetencia.some((i) => i.colaborador_id === c.id) ||
          avaliadoPorId.has(c.id)),
    )
    .sort((a, b) => a.nome.localeCompare(b.nome));

  // Celulas da matriz: potencial 3 -> 1 (linhas), performance 1 -> 3 (colunas).
  const nomesPorQuadrante = new Map<string, string[]>();
  for (const avaliacao of avaliacoesCiclo) {
    const chave = `p${avaliacao.performance}-t${avaliacao.potencial}`;
    const nomes = nomesPorQuadrante.get(chave) ?? [];
    nomes.push(pessoaPorId.get(avaliacao.colaborador_id)?.nome ?? "—");
    nomesPorQuadrante.set(chave, nomes);
  }

  return (
    <>
      <PageHeader
        titulo="Performance"
        descricao="Indicadores operacionais por competência e matriz performance x potencial. Nesta fase o lançamento é externo: o módulo é somente leitura."
      />

      <form className="mb-4 flex flex-wrap items-center gap-2">
        <select
          name="competencia"
          defaultValue={competencia ?? ""}
          className={SELECT_FILTRO}
        >
          {competencias.map((c) => (
            <option key={c} value={c}>
              {formatarCompetencia(c)}
            </option>
          ))}
        </select>
        <select
          name="indicador"
          defaultValue={indicadorSelecionado ?? ""}
          className={SELECT_FILTRO}
        >
          {tiposPresentes.map((tipo) => (
            <option key={tipo} value={tipo}>
              {INDICADORES[tipo].rotulo}
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
        <select name="turno" defaultValue={turno ?? ""} className={SELECT_FILTRO}>
          <option value="">Todos os turnos</option>
          {Object.entries(TURNOS).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
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
            href="/performance"
            className="px-2 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Limpar
          </Link>
        )}
      </form>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          rotulo="Pessoas medidas"
          valor={String(pessoasMedidas)}
          detalhe="Com indicador lançado na competência"
        />
        <KpiCard
          rotulo="Indicadores acompanhados"
          valor={String(tiposPresentes.length)}
          detalhe="Tipos com lançamento no recorte"
        />
        <KpiCard
          rotulo="Avaliados no ciclo"
          valor={String(avaliacoesCiclo.length)}
          detalhe={
            ciclo
              ? `De ${ativosRecorte.length} no quadro · ciclo ${ciclo}`
              : "Nenhum ciclo de avaliação registrado"
          }
        />
        <KpiCard
          rotulo="Competência"
          valor={competencia ? formatarCompetencia(competencia) : "—"}
          detalhe={
            competencia === competencias[0]
              ? "Última competência fechada"
              : "Competência selecionada"
          }
        />
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiposPresentes.map((tipo) => {
          const serie = serieMensal(indicadoresRecorte, tipo, competenciasAsc);
          const maiorPonto = Math.max(...serie.map((p) => p.media ?? 0), 1);
          const atual = serie.find((p) => p.competencia === competencia);
          const anterior = competenciaAnterior
            ? serie.find((p) => p.competencia === competenciaAnterior)
            : undefined;
          const variacao =
            atual?.media != null && anterior?.media != null && anterior.media > 0
              ? ((atual.media - anterior.media) / anterior.media) * 100
              : null;

          return (
            <div key={tipo} className="rounded-lg border border-line bg-panel p-4">
              <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">
                {INDICADORES[tipo].rotulo}
              </p>
              <p className="mt-1.5 text-2xl font-semibold">
                {formatarValorIndicador(tipo, atual?.media ?? null)}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {variacao === null || !competenciaAnterior
                  ? "Sem base de comparação anterior"
                  : `${variacao >= 0 ? "+" : "−"}${Math.abs(variacao)
                      .toFixed(1)
                      .replace(".", ",")}% vs ${formatarCompetencia(competenciaAnterior)}`}
              </p>
              <div className="mt-3 flex h-12 items-end gap-1">
                {serie.map((ponto) => (
                  <div
                    key={ponto.competencia}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <div className="flex h-9 w-full flex-col justify-end">
                      <div
                        className={`w-full rounded-t ${
                          ponto.competencia === competencia
                            ? "bg-brand/80"
                            : "bg-brand/35"
                        }`}
                        style={{
                          height: `${((ponto.media ?? 0) / maiorPonto) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-ink-muted">
                      {formatarCompetencia(ponto.competencia).split("/")[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {tiposPresentes.length === 0 && (
          <p className="rounded-lg border border-line bg-panel px-6 py-8 text-center text-sm text-ink-muted sm:col-span-2 xl:col-span-3">
            Nenhum indicador lançado no recorte.
          </p>
        )}
      </section>

      {indicadorSelecionado && competencia && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <TabelaCorte
            titulo={`${INDICADORES[indicadorSelecionado].rotulo} por setor · ${formatarCompetencia(competencia)}`}
            tipo={indicadorSelecionado}
            cortes={cortePorAtributo(registrosDoCorte, pessoaPorId, (c) =>
              c.setor_id ? (setorPorId.get(c.setor_id) ?? "Sem setor") : "Sem setor",
            )}
          />
          <TabelaCorte
            titulo={`${INDICADORES[indicadorSelecionado].rotulo} por turno · ${formatarCompetencia(competencia)}`}
            tipo={indicadorSelecionado}
            cortes={cortePorAtributo(registrosDoCorte, pessoaPorId, (c) =>
              c.turno ? TURNOS[c.turno] : "Sem turno",
            )}
          />
          <TabelaCorte
            titulo={`${INDICADORES[indicadorSelecionado].rotulo} por gestor · ${formatarCompetencia(competencia)}`}
            tipo={indicadorSelecionado}
            cortes={cortePorAtributo(registrosDoCorte, pessoaPorId, (c) =>
              c.gestor_id
                ? (pessoaPorId.get(c.gestor_id)?.nome ?? "Sem gestor")
                : "Sem gestor",
            )}
          />
        </div>
      )}

      <section className="mt-6 rounded-lg border border-line bg-panel">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-sm font-semibold">Matriz Performance x Potencial</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            {ciclo
              ? `Ciclo ${ciclo} · avaliação do gestor, independente dos indicadores`
              : "Nenhum ciclo de avaliação registrado"}
          </p>
        </div>
        <div className="overflow-x-auto p-6">
          <div className="min-w-[560px]">
            {([3, 2, 1] as NotaAvaliacao[]).map((potencial) => (
              <div key={potencial} className="mb-2 flex items-stretch gap-2">
                <div className="flex w-20 shrink-0 items-center">
                  <span className="text-xs text-ink-muted">
                    {NOTAS_POTENCIAL[potencial]}
                  </span>
                </div>
                {([1, 2, 3] as NotaAvaliacao[]).map((performance) => {
                  const chave = `p${performance}-t${potencial}`;
                  const nomes = nomesPorQuadrante.get(chave) ?? [];
                  const estrela = chave === "p3-t3";
                  return (
                    <div
                      key={chave}
                      className={`min-h-24 flex-1 rounded-md border p-3 ${
                        estrela
                          ? "border-brand/40 bg-brand-soft"
                          : "border-line bg-surface"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-medium">
                          {QUADRANTES_9BOX[chave]}
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            estrela ? "text-brand" : "text-ink-soft"
                          }`}
                        >
                          {nomes.length}
                        </span>
                      </div>
                      {nomes.length > 0 && (
                        <p className="mt-1.5 text-xs leading-5 text-ink-soft">
                          {nomes.slice(0, 6).join(", ")}
                          {nomes.length > 6 ? ` +${nomes.length - 6}` : ""}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="flex gap-2">
              <div className="w-20 shrink-0" />
              {([1, 2, 3] as NotaAvaliacao[]).map((performance) => (
                <div key={performance} className="flex-1 text-center">
                  <span className="text-xs text-ink-muted">
                    {NOTAS_PERFORMANCE[performance]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {naoAvaliados > 0 && (
          <p className="border-t border-line px-6 py-3 text-xs text-ink-muted">
            Não avaliados no ciclo: {naoAvaliados} (admissão recente).
          </p>
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-line bg-panel">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-sm font-semibold">Por pessoa</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Indicadores da competência {competencia ? formatarCompetencia(competencia) : "—"} e
            posição na matriz.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-muted">
              <th className="px-6 py-2.5 font-medium">Associado</th>
              <th className="px-6 py-2.5 font-medium">Setor</th>
              <th className="px-6 py-2.5 font-medium">Turno</th>
              <th className="px-6 py-2.5 font-medium">Indicadores na competência</th>
              <th className="px-6 py-2.5 font-medium">Quadrante</th>
            </tr>
          </thead>
          <tbody>
            {linhasPessoas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-ink-muted">
                  Nenhuma pessoa com indicador ou avaliação no recorte.
                </td>
              </tr>
            )}
            {linhasPessoas.map((pessoa) => {
              const doColaborador = daCompetencia.filter(
                (i) => i.colaborador_id === pessoa.id,
              );
              const avaliacao = avaliadoPorId.get(pessoa.id);
              return (
                <tr
                  key={pessoa.id}
                  className="border-b border-line transition-colors last:border-0 hover:bg-surface"
                >
                  <td className="px-6 py-3">
                    <Link href={`/pessoas/${pessoa.id}`} className="font-medium">
                      {pessoa.nome}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-ink-soft">{pessoa.setor?.nome ?? "—"}</td>
                  <td className="px-6 py-3 text-ink-soft">
                    {pessoa.turno ? TURNOS[pessoa.turno] : "—"}
                  </td>
                  <td className="px-6 py-3 text-ink-soft">
                    {doColaborador.length === 0
                      ? "—"
                      : doColaborador
                          .map(
                            (i) =>
                              `${INDICADORES[i.tipo].rotulo} ${formatarValorIndicador(i.tipo, i.valor)}`,
                          )
                          .join(" · ")}
                  </td>
                  <td className="px-6 py-3 text-ink-soft">
                    {avaliacao ? QUADRANTES_9BOX[`p${avaliacao.performance}-t${avaliacao.potencial}`] : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <p className="mt-6 text-xs text-ink-muted">
        Não existe nota única de produtividade: cada indicador é comparável apenas
        dentro do próprio indicador. A matriz reflete a avaliação do gestor no
        ciclo, não os indicadores. Os cortes apontam correlações, não causas.
      </p>
    </>
  );
}
