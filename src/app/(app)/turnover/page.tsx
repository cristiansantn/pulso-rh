import Link from "next/link";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import {
  desligadosDesde,
  faixaEtaria,
  faixaTempoDeCasa,
  FAIXAS_ETARIAS,
  FAIXAS_TEMPO_DE_CASA,
  indiceDeSaida,
  seriePorMes,
  tempoDeCasaDias,
  turnoverPrecoce,
} from "@/lib/analytics/turnover";
import { listarColaboradores } from "@/lib/data/colaboradores";
import { listarSetores } from "@/lib/data/setores";
import {
  MOTIVOS_DESLIGAMENTO,
  TURNOS,
  type Colaborador,
} from "@/lib/data/tipos";
import { diasAtrasIso, formatarDataBr, hojeIso } from "@/lib/datas";

const PERIODOS: Record<string, string> = {
  "6": "Últimos 6 meses",
  "12": "Últimos 12 meses",
  "24": "Últimos 24 meses",
};

const SELECT_FILTRO =
  "rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink-soft " +
  "focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-line";

function formatarPercentual(valor: number | null): string {
  if (valor === null) return "—";
  return `${valor.toFixed(1).replace(".", ",")}%`;
}

interface Corte {
  rotulo: string;
  total: number;
}

/** Agrupa desligados por um atributo e ordena do maior para o menor. */
function cortePorAtributo(
  desligados: Colaborador[],
  atributo: (c: Colaborador) => string,
  ordemFixa?: readonly string[],
): Corte[] {
  const grupos = new Map<string, number>();
  for (const pessoa of desligados) {
    const chave = atributo(pessoa);
    grupos.set(chave, (grupos.get(chave) ?? 0) + 1);
  }

  if (ordemFixa) {
    return ordemFixa
      .filter((rotulo) => grupos.has(rotulo))
      .map((rotulo) => ({ rotulo, total: grupos.get(rotulo) as number }));
  }
  return [...grupos.entries()]
    .map(([rotulo, total]) => ({ rotulo, total }))
    .sort((a, b) => b.total - a.total);
}

function TabelaCorte({
  titulo,
  cortes,
  totalGeral,
}: {
  titulo: string;
  cortes: Corte[];
  totalGeral: number;
}) {
  const maior = Math.max(...cortes.map((c) => c.total), 1);

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-panel">
      <div className="border-b border-line px-6 py-4">
        <h2 className="text-sm font-semibold">{titulo}</h2>
      </div>
      {cortes.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-ink-muted">
          Nenhum desligamento no período.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-muted">
              <th className="px-6 py-2.5 font-medium">Grupo</th>
              <th className="px-6 py-2.5 text-right font-medium">Saídas</th>
              <th className="w-2/5 px-6 py-2.5 font-medium">Participação</th>
            </tr>
          </thead>
          <tbody>
            {cortes.map((corte) => (
              <tr key={corte.rotulo} className="border-b border-line last:border-0">
                <td className="px-6 py-2.5 font-medium">{corte.rotulo}</td>
                <td className="px-6 py-2.5 text-right text-ink-soft">{corte.total}</td>
                <td className="px-6 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-soft">
                      <div
                        className="h-full rounded-full bg-brand/80"
                        style={{ width: `${(corte.total / maior) * 100}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-medium">
                      {totalGeral > 0
                        ? `${Math.round((corte.total / totalGeral) * 100)}%`
                        : "—"}
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
 * Turnover Intelligence (Fase 5): quem sai, quando, de onde e por que.
 * Os cortes apontam onde investigar; a leitura de causa e sempre humana.
 */
export default async function TurnoverPage({
  searchParams,
}: {
  searchParams: Promise<{ meses?: string; setor?: string }>;
}) {
  const params = await searchParams;
  const meses = PERIODOS[params.meses ?? ""] ? Number(params.meses) : 12;
  const setorId = params.setor;

  const [colaboradores, setores] = await Promise.all([
    listarColaboradores(),
    listarSetores(),
  ]);

  const doSetor = (c: Colaborador) => !setorId || c.setor_id === setorId;
  const quadroAtual = colaboradores.filter(
    (c) => c.status !== "desligado" && doSetor(c),
  );
  const desligados = desligadosDesde(colaboradores, diasAtrasIso(meses * 30)).filter(
    doSetor,
  );

  const voluntarios = desligados.filter((c) => c.tipo_desligamento === "voluntario");
  const percentualVoluntario =
    desligados.length > 0 ? (voluntarios.length / desligados.length) * 100 : null;

  const serie = seriePorMes(desligados, meses);
  const maiorMes = Math.max(...serie.map((m) => m.voluntarios + m.involuntarios), 1);

  const setorPorId = new Map(setores.map((s) => [s.id, s.nome]));
  const nomePorId = new Map(colaboradores.map((c) => [c.id, c.nome]));
  const filtroAtivo = Boolean(params.meses || params.setor);

  const recentes = [...desligados]
    .sort((a, b) => (b.data_desligamento ?? "").localeCompare(a.data_desligamento ?? ""))
    .slice(0, 8);

  return (
    <>
      <PageHeader
        titulo="Turnover"
        descricao="Quem sai, quando, de onde e por quê. Motivos vêm da lista controlada do desligamento."
      />

      <form className="mb-4 flex flex-wrap items-center gap-2">
        <select name="meses" defaultValue={String(meses)} className={SELECT_FILTRO}>
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
            href="/turnover"
            className="px-2 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Limpar
          </Link>
        )}
      </form>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard rotulo="Desligamentos" valor={String(desligados.length)} />
        <KpiCard
          rotulo="Índice de saída"
          valor={formatarPercentual(indiceDeSaida(desligados.length, quadroAtual.length))}
          detalhe="Aproximação: saídas sobre o quadro atual"
        />
        <KpiCard
          rotulo="Voluntários"
          valor={formatarPercentual(percentualVoluntario)}
          detalhe="Participação no total de saídas"
        />
        <KpiCard
          rotulo="Turnover precoce"
          valor={formatarPercentual(turnoverPrecoce(desligados, 90))}
          detalhe={`Até 90 dias de casa · 30 dias: ${formatarPercentual(
            turnoverPrecoce(desligados, 30),
          )} · 180: ${formatarPercentual(turnoverPrecoce(desligados, 180))}`}
        />
      </section>

      <section className="mt-6 rounded-lg border border-line bg-panel">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-sm font-semibold">Desligamentos por mês</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Azul: voluntários. Vermelho: involuntários.
          </p>
        </div>
        <div className="flex items-end gap-1.5 overflow-x-auto px-6 pt-6 pb-2">
          {serie.map((mes) => {
            const total = mes.voluntarios + mes.involuntarios;
            return (
              <div key={mes.chave} className="flex min-w-8 flex-1 flex-col items-center gap-1.5">
                <span className="text-xs font-medium text-ink-soft">
                  {total > 0 ? total : ""}
                </span>
                <div className="flex h-28 w-full max-w-10 flex-col justify-end overflow-hidden rounded-t">
                  <div
                    className="w-full bg-negative/80"
                    style={{ height: `${(mes.involuntarios / maiorMes) * 100}%` }}
                  />
                  <div
                    className="w-full bg-brand/80"
                    style={{ height: `${(mes.voluntarios / maiorMes) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] text-ink-muted">{mes.rotulo}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TabelaCorte
          titulo="Por motivo declarado"
          cortes={cortePorAtributo(desligados, (c) =>
            c.motivo_desligamento
              ? (MOTIVOS_DESLIGAMENTO[c.motivo_desligamento] ?? c.motivo_desligamento)
              : "Sem motivo",
          )}
          totalGeral={desligados.length}
        />
        <TabelaCorte
          titulo="Por setor"
          cortes={cortePorAtributo(desligados, (c) =>
            c.setor_id ? (setorPorId.get(c.setor_id) ?? "Sem setor") : "Sem setor",
          )}
          totalGeral={desligados.length}
        />
        <TabelaCorte
          titulo="Por tempo de casa na saída"
          cortes={cortePorAtributo(
            desligados,
            (c) => {
              const dias = tempoDeCasaDias(c);
              return dias === null ? "Sem admissão registrada" : faixaTempoDeCasa(dias);
            },
            FAIXAS_TEMPO_DE_CASA,
          )}
          totalGeral={desligados.length}
        />
        <TabelaCorte
          titulo="Por gestor direto"
          cortes={cortePorAtributo(desligados, (c) =>
            c.gestor_id ? (nomePorId.get(c.gestor_id) ?? "Sem gestor") : "Sem gestor",
          )}
          totalGeral={desligados.length}
        />
        <TabelaCorte
          titulo="Por turno"
          cortes={cortePorAtributo(desligados, (c) =>
            c.turno ? TURNOS[c.turno] : "Sem turno",
          )}
          totalGeral={desligados.length}
        />
        <TabelaCorte
          titulo="Por faixa etária"
          cortes={cortePorAtributo(
            desligados,
            (c) =>
              c.data_nascimento
                ? faixaEtaria(c.data_nascimento, c.data_desligamento ?? hojeIso())
                : "Sem data de nascimento",
            FAIXAS_ETARIAS,
          )}
          totalGeral={desligados.length}
        />
      </div>

      <section className="mt-6 overflow-hidden rounded-lg border border-line bg-panel">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-sm font-semibold">Saídas recentes</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-muted">
              <th className="px-6 py-2.5 font-medium">Associado</th>
              <th className="px-6 py-2.5 font-medium">Setor</th>
              <th className="px-6 py-2.5 font-medium">Tipo</th>
              <th className="px-6 py-2.5 font-medium">Motivo</th>
              <th className="px-6 py-2.5 font-medium">Desligamento</th>
              <th className="px-6 py-2.5 text-right font-medium">Tempo de casa</th>
            </tr>
          </thead>
          <tbody>
            {recentes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-ink-muted">
                  Nenhum desligamento no período.
                </td>
              </tr>
            )}
            {recentes.map((c) => {
              const dias = tempoDeCasaDias(c);
              return (
                <tr
                  key={c.id}
                  className="border-b border-line transition-colors last:border-0 hover:bg-surface"
                >
                  <td className="px-6 py-3">
                    <Link href={`/pessoas/${c.id}`} className="font-medium">
                      {c.nome}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-ink-soft">{c.setor?.nome ?? "—"}</td>
                  <td className="px-6 py-3 text-ink-soft">
                    {c.tipo_desligamento === "involuntario" ? "Involuntário" : "Voluntário"}
                  </td>
                  <td className="px-6 py-3 text-ink-soft">
                    {c.motivo_desligamento
                      ? (MOTIVOS_DESLIGAMENTO[c.motivo_desligamento] ?? c.motivo_desligamento)
                      : "—"}
                  </td>
                  <td className="px-6 py-3 text-ink-soft">
                    {formatarDataBr(c.data_desligamento)}
                  </td>
                  <td className="px-6 py-3 text-right text-ink-soft">
                    {dias === null
                      ? "—"
                      : dias < 90
                        ? `${dias} dias`
                        : faixaTempoDeCasa(dias)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <p className="mt-6 text-xs text-ink-muted">
        O índice de saída usa o quadro atual como denominador — é uma aproximação,
        não turnover anualizado por headcount médio. Os cortes apontam correlações,
        não causas.
      </p>
    </>
  );
}
