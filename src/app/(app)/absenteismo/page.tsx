import Link from "next/link";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import {
  formatarTaxa,
  listarDiasPerdidos,
  taxaAbsenteismo,
  type Periodo,
} from "@/lib/analytics/absenteismo";
import { listarColaboradores } from "@/lib/data/colaboradores";
import { listarAfastamentos, listarOcorrencias } from "@/lib/data/frequencia";
import { listarSetores } from "@/lib/data/setores";
import { TURNOS, type Colaborador } from "@/lib/data/tipos";
import { diasAtrasIso, hojeIso } from "@/lib/datas";

const DIAS_SEMANA = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const PERIODOS: Record<string, string> = {
  "30": "Últimos 30 dias",
  "60": "Últimos 60 dias",
  "90": "Últimos 90 dias",
  "180": "Últimos 180 dias",
};

const SELECT_FILTRO =
  "rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink-soft " +
  "focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-line";

interface Corte {
  rotulo: string;
  quadro: number;
  diasPerdidos: number;
  taxa: number | null;
}

/** Monta um corte de absenteismo agrupando colaboradores por um atributo. */
function cortePorAtributo(
  quadro: Colaborador[],
  diasPorColaborador: Map<string, number>,
  periodo: Periodo,
  atributo: (c: Colaborador) => string,
): Corte[] {
  const grupos = new Map<string, { quadro: number; diasPerdidos: number }>();

  for (const pessoa of quadro) {
    const chave = atributo(pessoa);
    const grupo = grupos.get(chave) ?? { quadro: 0, diasPerdidos: 0 };
    grupo.quadro += 1;
    grupo.diasPerdidos += diasPorColaborador.get(pessoa.id) ?? 0;
    grupos.set(chave, grupo);
  }

  return [...grupos.entries()]
    .map(([rotulo, grupo]) => ({
      rotulo,
      ...grupo,
      taxa: taxaAbsenteismo(grupo.diasPerdidos, grupo.quadro, periodo),
    }))
    .sort((a, b) => (b.taxa ?? -1) - (a.taxa ?? -1));
}

function TabelaCorte({ titulo, cortes }: { titulo: string; cortes: Corte[] }) {
  const maiorTaxa = Math.max(...cortes.map((c) => c.taxa ?? 0), 0.001);

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-panel">
      <div className="border-b border-line px-6 py-4">
        <h2 className="text-sm font-semibold">{titulo}</h2>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-ink-muted">
            <th className="px-6 py-2.5 font-medium">Grupo</th>
            <th className="px-6 py-2.5 text-right font-medium">Quadro</th>
            <th className="px-6 py-2.5 text-right font-medium">Dias perdidos</th>
            <th className="w-2/5 px-6 py-2.5 font-medium">Taxa</th>
          </tr>
        </thead>
        <tbody>
          {cortes.map((corte) => (
            <tr key={corte.rotulo} className="border-b border-line last:border-0">
              <td className="px-6 py-2.5 font-medium">{corte.rotulo}</td>
              <td className="px-6 py-2.5 text-right text-ink-soft">{corte.quadro}</td>
              <td className="px-6 py-2.5 text-right text-ink-soft">{corte.diasPerdidos}</td>
              <td className="px-6 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-soft">
                    <div
                      className="h-full rounded-full bg-brand/80"
                      style={{ width: `${((corte.taxa ?? 0) / maiorTaxa) * 100}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-medium">
                    {formatarTaxa(corte.taxa)}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/**
 * Cortes analiticos de absenteismo no periodo filtrado. Os numeros apontam
 * onde investigar; a leitura de causa e sempre humana.
 */
export default async function AbsenteismoPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; setor?: string; turno?: string }>;
}) {
  const params = await searchParams;
  const periodoDias = PERIODOS[params.periodo ?? ""] ? Number(params.periodo) : 90;
  const setorId = params.setor;
  const turnoFiltro = params.turno;

  const periodo: Periodo = { inicio: diasAtrasIso(periodoDias), fim: hojeIso() };

  const [colaboradores, setores, ocorrenciasTodas, afastamentosTodos] =
    await Promise.all([
      listarColaboradores(),
      listarSetores(),
      listarOcorrencias({ desde: periodo.inicio }),
      listarAfastamentos({ desde: periodo.inicio }),
    ]);

  const quadroAtual = colaboradores.filter(
    (c) =>
      c.status !== "desligado" &&
      (!setorId || c.setor_id === setorId) &&
      (!turnoFiltro || c.turno === turnoFiltro),
  );
  const noQuadro = new Set(quadroAtual.map((c) => c.id));
  const ocorrencias = ocorrenciasTodas.filter((o) => noQuadro.has(o.colaborador_id));
  const afastamentos = afastamentosTodos.filter((a) => noQuadro.has(a.colaborador_id));
  const diasPerdidos = listarDiasPerdidos(ocorrencias, afastamentos, periodo);
  const filtroAtivo = Boolean(params.periodo || params.setor || params.turno);

  const diasPorColaborador = new Map<string, number>();
  for (const dia of diasPerdidos) {
    diasPorColaborador.set(
      dia.colaborador_id,
      (diasPorColaborador.get(dia.colaborador_id) ?? 0) + 1,
    );
  }

  const taxaGeral = taxaAbsenteismo(diasPerdidos.length, quadroAtual.length, periodo);
  const faltasInjustificadas = ocorrencias.filter(
    (o) => o.tipo === "falta_injustificada",
  ).length;

  const setorPorId = new Map(setores.map((s) => [s.id, s.nome]));
  const nomePorId = new Map(colaboradores.map((c) => [c.id, c.nome]));

  const porDiaDaSemana = DIAS_SEMANA.map((rotulo, indice) => ({
    rotulo,
    total: diasPerdidos.filter(
      (dia) => new Date(`${dia.data}T00:00:00`).getDay() === indice,
    ).length,
  }));
  const maiorDia = Math.max(...porDiaDaSemana.map((d) => d.total), 1);

  return (
    <>
      <PageHeader
        titulo="Absenteísmo"
        descricao="Dia perdido = falta, atestado ou afastamento; folgas e férias ficam de fora."
      />

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
        <select name="turno" defaultValue={turnoFiltro ?? ""} className={SELECT_FILTRO}>
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
            href="/absenteismo"
            className="px-2 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Limpar
          </Link>
        )}
      </form>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          rotulo="Taxa no período"
          valor={formatarTaxa(taxaGeral)}
          detalhe="Aproximação: dias corridos x quadro atual"
        />
        <KpiCard rotulo="Dias perdidos" valor={String(diasPerdidos.length)} />
        <KpiCard rotulo="Faltas injustificadas" valor={String(faltasInjustificadas)} />
        <KpiCard
          rotulo="Afastamentos e atestados"
          valor={String(afastamentos.length)}
        />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TabelaCorte
          titulo="Por setor"
          cortes={cortePorAtributo(quadroAtual, diasPorColaborador, periodo, (c) =>
            c.setor_id ? (setorPorId.get(c.setor_id) ?? "Sem setor") : "Sem setor",
          )}
        />

        <section className="overflow-hidden rounded-lg border border-line bg-panel">
          <div className="border-b border-line px-6 py-4">
            <h2 className="text-sm font-semibold">Por dia da semana</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Distribuição dos dias perdidos no período.
            </p>
          </div>
          <ul className="space-y-3 px-6 py-4">
            {porDiaDaSemana.map((dia) => (
              <li key={dia.rotulo} className="flex items-center gap-3 text-sm">
                <span className="w-20 text-ink-soft">{dia.rotulo}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-soft">
                  <div
                    className="h-full rounded-full bg-brand/80"
                    style={{ width: `${(dia.total / maiorDia) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right font-medium">{dia.total}</span>
              </li>
            ))}
          </ul>
        </section>

        <TabelaCorte
          titulo="Por turno"
          cortes={cortePorAtributo(quadroAtual, diasPorColaborador, periodo, (c) =>
            c.turno ? TURNOS[c.turno] : "Sem turno",
          )}
        />

        <TabelaCorte
          titulo="Por gestor"
          cortes={cortePorAtributo(quadroAtual, diasPorColaborador, periodo, (c) =>
            c.gestor_id ? (nomePorId.get(c.gestor_id) ?? "Sem gestor") : "Sem gestor",
          )}
        />
      </div>

      <p className="mt-6 text-xs text-ink-muted">
        Os cortes apontam correlações, não causas. Um grupo com taxa alta merece
        investigação — escala, gestão, deslocamento — antes de qualquer conclusão.
      </p>
    </>
  );
}
