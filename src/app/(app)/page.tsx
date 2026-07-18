import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { GraficoColunas } from "@/components/charts/grafico-colunas";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import {
  formatarTaxa,
  listarDiasPerdidos,
  taxaAbsenteismo,
  type Periodo,
} from "@/lib/analytics/absenteismo";
import {
  CATEGORIA_LABEL,
  gerarAlertas,
  resumoPorSeveridade,
  SEVERIDADE_LABEL,
  type SeveridadeAlerta,
} from "@/lib/analytics/alertas";
import { vagaEmAtraso } from "@/lib/analytics/recrutamento";
import {
  desligadosDesde,
  faixaEtaria,
  FAIXAS_ETARIAS,
  indiceDeSaida,
  seriePorMes,
} from "@/lib/analytics/turnover";
import { listarColaboradores } from "@/lib/data/colaboradores";
import { listarAfastamentos, listarOcorrencias } from "@/lib/data/frequencia";
import { listarSetores } from "@/lib/data/setores";
import { listarPlanosSucessao } from "@/lib/data/talentos";
import { listarVagas } from "@/lib/data/vagas";
import { diasAtrasIso, hojeIso } from "@/lib/datas";

const PONTO_SEVERIDADE: Record<SeveridadeAlerta, string> = {
  alta: "bg-negative",
  media: "bg-warning",
  baixa: "bg-brand",
};

/**
 * Visao Geral (cockpit da operacao). Consolida o quadro, os indicadores dos
 * modulos analiticos, o motor de alertas e os graficos de acompanhamento.
 */
export default async function VisaoGeralPage() {
  // Mesmo periodo da pagina de Absenteismo, para os numeros baterem entre telas.
  const periodo: Periodo = { inicio: diasAtrasIso(90), fim: hojeIso() };

  const [colaboradores, setores, ocorrencias, afastamentos, vagas, planosSucessao] =
    await Promise.all([
      listarColaboradores(),
      listarSetores(),
      listarOcorrencias({ desde: periodo.inicio }),
      listarAfastamentos({ desde: periodo.inicio }),
      listarVagas(),
      listarPlanosSucessao(),
    ]);

  const porStatus = (status: string) =>
    colaboradores.filter((c) => c.status === status).length;

  const ativos = porStatus("ativo");
  const afastados = porStatus("afastado");
  const ferias = porStatus("ferias");
  const headcountPlanejado = setores.reduce(
    (total, s) => total + s.headcount_planejado,
    0,
  );

  const quadroAtual = colaboradores.filter((c) => c.status !== "desligado");
  const diasPerdidos = listarDiasPerdidos(ocorrencias, afastamentos, periodo);
  const taxaAbsenteismoGeral = taxaAbsenteismo(
    diasPerdidos.length,
    quadroAtual.length,
    periodo,
  );

  const vagasAbertas = vagas.filter((v) => v.status === "aberta");
  const vagasEmAtraso = vagasAbertas.filter(vagaEmAtraso).length;

  const desligados12m = desligadosDesde(colaboradores, diasAtrasIso(365));
  const indiceSaida12m = indiceDeSaida(desligados12m.length, quadroAtual.length);

  // Motor de alertas: resumo e os mais prioritarios para o cockpit.
  const alertas = gerarAlertas({
    colaboradores,
    setores,
    ocorrencias,
    afastamentos,
    vagas,
    planosSucessao,
    periodo,
  });
  const resumoAlertas = resumoPorSeveridade(alertas);
  const alertasDestaque = alertas.slice(0, 4);

  // Serie mensal de turnover (12 meses).
  const serieTurnover = seriePorMes(desligados12m, 12);
  const maiorMesTurnover = Math.max(
    ...serieTurnover.map((m) => m.voluntarios + m.involuntarios),
    1,
  );

  // Absenteismo por setor no periodo, do maior para o menor.
  const absenteismoPorSetor = setores
    .map((setor) => {
      const idsEquipe = new Set(
        quadroAtual.filter((c) => c.setor_id === setor.id).map((c) => c.id),
      );
      const perdidos = diasPerdidos.filter((d) =>
        idsEquipe.has(d.colaborador_id),
      ).length;
      return {
        setor,
        taxa: taxaAbsenteismo(perdidos, idsEquipe.size, periodo),
      };
    })
    .filter((linha): linha is { setor: (typeof setores)[number]; taxa: number } =>
      linha.taxa !== null && linha.taxa > 0,
    )
    .sort((a, b) => b.taxa - a.taxa)
    .slice(0, 6);
  const maiorTaxaSetor = Math.max(...absenteismoPorSetor.map((l) => l.taxa), 1);

  // Demografia por faixa etaria (quadro ativo).
  const hoje = hojeIso();
  const contagemFaixa = new Map<string, number>();
  for (const pessoa of quadroAtual) {
    if (!pessoa.data_nascimento) continue;
    const faixa = faixaEtaria(pessoa.data_nascimento, hoje);
    contagemFaixa.set(faixa, (contagemFaixa.get(faixa) ?? 0) + 1);
  }
  const totalComIdade = [...contagemFaixa.values()].reduce((s, n) => s + n, 0);
  const demografia = FAIXAS_ETARIAS.map((faixa) => ({
    faixa,
    pessoas: contagemFaixa.get(faixa) ?? 0,
  }));
  const maiorFaixa = Math.max(...demografia.map((d) => d.pessoas), 1);

  const ocupacaoPorSetor = setores.map((setor) => {
    const equipe = colaboradores.filter(
      (c) => c.setor_id === setor.id && c.status !== "desligado",
    );
    return {
      ...setor,
      ativos: equipe.filter((c) => c.status === "ativo").length,
      afastados: equipe.filter((c) => c.status === "afastado").length,
      ferias: equipe.filter((c) => c.status === "ferias").length,
    };
  });

  return (
    <>
      <PageHeader
        titulo="Visão Geral"
        descricao="Fotografia atual da operação: quadro, indicadores dos módulos analíticos, alertas e acompanhamento."
      />

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8">
        <KpiCard
          rotulo="Headcount ativo"
          valor={String(ativos)}
          detalhe={`Planejado: ${headcountPlanejado}`}
        />
        <KpiCard rotulo="Afastados" valor={String(afastados)} />
        <KpiCard rotulo="Em férias" valor={String(ferias)} />
        <KpiCard rotulo="Setores" valor={String(setores.length)} />
        <KpiCard
          rotulo="Índice de saída"
          valor={
            indiceSaida12m !== null
              ? `${indiceSaida12m.toFixed(1).replace(".", ",")}%`
              : "—"
          }
          detalhe="Últimos 12 meses, sobre o quadro atual"
        />
        <KpiCard
          rotulo="Absenteísmo"
          valor={formatarTaxa(taxaAbsenteismoGeral)}
          detalhe="Últimos 90 dias"
        />
        <KpiCard
          rotulo="Vagas abertas"
          valor={String(vagasAbertas.length)}
          detalhe={vagasEmAtraso > 0 ? `${vagasEmAtraso} em atraso` : "Nenhuma em atraso"}
        />
        <KpiCard
          rotulo="Alertas ativos"
          valor={String(alertas.length)}
          detalhe={
            resumoAlertas.alta > 0
              ? `${resumoAlertas.alta} de prioridade alta`
              : "Nenhum de prioridade alta"
          }
        />
      </section>

      <section className="mt-8 rounded-lg border border-line bg-panel">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold">Alertas da operação</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Desvios em relação à média, às metas e aos limiares.
            </p>
          </div>
          <Link
            href="/alertas"
            className="flex items-center gap-1.5 text-sm text-brand transition-colors hover:text-brand-strong"
          >
            Ver todos
            <ArrowRight size={15} />
          </Link>
        </div>
        {alertas.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-ink-muted">
            Nenhum desvio acima dos limiares no momento.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {alertasDestaque.map((alerta) => (
              <li key={alerta.id}>
                <Link
                  href={alerta.href}
                  className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-surface"
                >
                  <span
                    className={`inline-block size-2 shrink-0 rounded-full ${PONTO_SEVERIDADE[alerta.severidade]}`}
                    title={SEVERIDADE_LABEL[alerta.severidade]}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="text-sm font-medium">{alerta.titulo}</span>
                    <span className="ml-2 text-sm text-ink-soft">{alerta.descricao}</span>
                  </span>
                  <span className="hidden shrink-0 text-xs text-ink-muted sm:block">
                    {CATEGORIA_LABEL[alerta.categoria]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-panel p-6">
          <h2 className="text-sm font-semibold">Turnover mensal</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Desligamentos por mês (12 meses), voluntários e involuntários.
          </p>
          <div className="mt-4 flex h-40 items-end gap-1.5">
            {serieTurnover.map((mes) => {
              const total = mes.voluntarios + mes.involuntarios;
              return (
                <div key={mes.chave} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-32 w-full flex-col justify-end">
                    <div
                      className="w-full rounded-t-sm bg-negative/70"
                      style={{ height: `${(mes.involuntarios / maiorMesTurnover) * 100}%` }}
                      title={`${mes.involuntarios} involuntário(s)`}
                    />
                    <div
                      className="w-full bg-brand/70"
                      style={{ height: `${(mes.voluntarios / maiorMesTurnover) * 100}%` }}
                      title={`${mes.voluntarios} voluntário(s)`}
                    />
                  </div>
                  <span className="text-[10px] text-ink-muted">{mes.rotulo}</span>
                  <span className="text-[10px] font-medium text-ink-soft">
                    {total > 0 ? total : ""}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm bg-brand/70" />
              Voluntário
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm bg-negative/70" />
              Involuntário
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-panel p-6">
          <h2 className="text-sm font-semibold">Absenteísmo por setor</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Maiores taxas nos últimos 90 dias.
          </p>
          {absenteismoPorSetor.length === 0 ? (
            <p className="mt-6 text-sm text-ink-muted">Sem dias perdidos no período.</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {absenteismoPorSetor.map((linha) => (
                <li key={linha.setor.id} className="flex items-center gap-3 text-sm">
                  <span className="w-40 shrink-0 truncate" title={linha.setor.nome}>
                    {linha.setor.nome}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-soft">
                    <div
                      className="h-full rounded-full bg-brand/80"
                      style={{ width: `${(linha.taxa / maiorTaxaSetor) * 100}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right font-medium">
                    {formatarTaxa(linha.taxa)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-line bg-panel p-6">
        <h2 className="text-sm font-semibold">Demografia por faixa etária</h2>
        <p className="mt-0.5 text-xs text-ink-muted">
          Quadro ativo · {totalComIdade}{" "}
          {totalComIdade === 1 ? "pessoa com idade informada" : "pessoas com idade informada"}.
        </p>
        <div className="mt-5">
          <GraficoColunas
            dados={demografia.map((item) => ({
              rotulo: `${item.faixa} anos`,
              valor: item.pessoas,
              destaque: item.pessoas === maiorFaixa && maiorFaixa > 0,
            }))}
          />
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-line bg-panel">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-sm font-semibold">Ocupação por setor</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Planejado versus quadro atual. As vagas abertas de cada setor estão no
            mapa da operação.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-muted">
              <th className="px-6 py-2.5 font-medium">Setor</th>
              <th className="px-6 py-2.5 text-right font-medium">Planejado</th>
              <th className="px-6 py-2.5 text-right font-medium">Ativos</th>
              <th className="px-6 py-2.5 text-right font-medium">Afastados</th>
              <th className="px-6 py-2.5 text-right font-medium">Férias</th>
              <th className="px-6 py-2.5 text-right font-medium">Ocupação</th>
            </tr>
          </thead>
          <tbody>
            {ocupacaoPorSetor.map((setor) => {
              const ocupacao =
                setor.headcount_planejado > 0
                  ? Math.round((setor.ativos / setor.headcount_planejado) * 100)
                  : 0;
              return (
                <tr key={setor.id} className="border-b border-line last:border-0">
                  <td className="px-6 py-2.5 font-medium">
                    <Link
                      href={`/estrutura/${setor.id}`}
                      className="transition-colors hover:text-ink-soft"
                    >
                      {setor.nome}
                    </Link>
                  </td>
                  <td className="px-6 py-2.5 text-right text-ink-soft">
                    {setor.headcount_planejado}
                  </td>
                  <td className="px-6 py-2.5 text-right">{setor.ativos}</td>
                  <td className="px-6 py-2.5 text-right text-ink-soft">
                    {setor.afastados}
                  </td>
                  <td className="px-6 py-2.5 text-right text-ink-soft">{setor.ferias}</td>
                  <td
                    className={`px-6 py-2.5 text-right font-medium ${
                      ocupacao < 70 ? "text-negative" : ""
                    }`}
                  >
                    {ocupacao}%
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
