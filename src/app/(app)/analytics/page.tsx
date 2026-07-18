import Link from "next/link";
import {
  ArrowRight,
  Lightbulb,
  ListChecks,
  Question,
} from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/ui/page-header";
import {
  CATEGORIA_INSIGHT_LABEL,
  gerarInsights,
  type Insight,
} from "@/lib/analytics/insights";
import {
  CLASSIFICACAO_LABEL,
  saudeGeral,
  saudePorSetor,
  type ClassificacaoSaude,
  type DimensaoSaude,
} from "@/lib/analytics/saude";
import { listarColaboradores } from "@/lib/data/colaboradores";
import { listarAfastamentos, listarOcorrencias } from "@/lib/data/frequencia";
import { listarSetores } from "@/lib/data/setores";
import { listarPlanosSucessao } from "@/lib/data/talentos";
import { listarVagas } from "@/lib/data/vagas";
import { diasAtrasIso, hojeIso } from "@/lib/datas";

const COR_CLASSIFICACAO: Record<
  ClassificacaoSaude,
  { texto: string; ponto: string; barra: string }
> = {
  saudavel: { texto: "text-positive", ponto: "bg-positive", barra: "bg-positive" },
  atencao: { texto: "text-warning", ponto: "bg-warning", barra: "bg-warning" },
  critico: { texto: "text-negative", ponto: "bg-negative", barra: "bg-negative" },
};

function classificarScore(score: number): ClassificacaoSaude {
  if (score >= 80) return "saudavel";
  if (score >= 60) return "atencao";
  return "critico";
}

function BarraDimensao({ dimensao }: { dimensao: DimensaoSaude }) {
  const cor = COR_CLASSIFICACAO[classificarScore(dimensao.score)];
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-ink-soft">
          {dimensao.rotulo}
          <span className="text-ink-muted"> · {Math.round(dimensao.peso * 100)}%</span>
        </span>
        <span className="font-medium">{dimensao.score}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-soft">
        <div
          className={`h-full rounded-full ${cor.barra}/80`}
          style={{ width: `${dimensao.score}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-ink-muted">{dimensao.detalhe}</p>
    </div>
  );
}

function CartaoInsight({ insight }: { insight: Insight }) {
  const alta = insight.prioridade === "alta";
  return (
    <article
      className={`rounded-lg border border-line bg-panel p-6 ${
        alta ? "border-l-4 border-l-brand" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            alta ? "bg-brand-soft text-brand" : "bg-neutral-soft text-ink-soft"
          }`}
        >
          {alta ? "Prioridade alta" : "Acompanhar"}
        </span>
        <span className="text-xs text-ink-muted">
          {CATEGORIA_INSIGHT_LABEL[insight.categoria]}
        </span>
      </div>

      <h3 className="mt-3 flex items-start gap-2 text-base font-semibold">
        <Question size={18} weight="bold" className="mt-0.5 shrink-0 text-brand" />
        {insight.pergunta}
      </h3>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-medium tracking-wide text-ink-muted uppercase">
            Evidência
          </dt>
          <dd className="mt-0.5 text-ink-soft">{insight.evidencia}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-ink-muted uppercase">
            <Lightbulb size={13} weight="fill" className="text-warning" />
            Hipótese
          </dt>
          <dd className="mt-0.5 text-ink-soft">{insight.hipotese}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-ink-muted uppercase">
            <ListChecks size={13} weight="bold" className="text-positive" />
            Ação sugerida
          </dt>
          <dd className="mt-0.5 text-ink-soft">{insight.acao}</dd>
        </div>
      </dl>

      <Link
        href={insight.href}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand transition-colors hover:text-brand-strong"
      >
        Investigar
        <ArrowRight size={15} />
      </Link>
    </article>
  );
}

/**
 * People Analytics e Health Score (Fase 10). Reúne o índice de saúde
 * operacional — aberto em suas dimensões, nunca uma caixa-preta — e a central
 * de insights, onde cada leitura vem como pergunta, evidência, hipótese e ação.
 */
export default async function AnalyticsPage() {
  const periodo = { inicio: diasAtrasIso(90), fim: hojeIso() };

  const [colaboradores, setores, ocorrencias, afastamentos, vagas, planosSucessao] =
    await Promise.all([
      listarColaboradores(),
      listarSetores(),
      listarOcorrencias({ desde: periodo.inicio }),
      listarAfastamentos({ desde: periodo.inicio }),
      listarVagas(),
      listarPlanosSucessao(),
    ]);

  const dados = {
    colaboradores,
    setores,
    ocorrencias,
    afastamentos,
    vagas,
    planosSucessao,
    periodo,
  };

  const geral = saudeGeral(dados);
  const porSetor = saudePorSetor(dados);
  const insights = gerarInsights(dados);

  const corGeral = COR_CLASSIFICACAO[geral.classificacao];

  return (
    <>
      <PageHeader
        titulo="People Analytics"
        descricao="Índice de saúde operacional e central de insights. O score é aberto em suas dimensões e cada insight separa evidência de hipótese — o sistema aponta correlações, nunca afirma causa."
      />

      <section className="rounded-lg border border-line bg-panel p-6">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:items-center">
          <div className="flex flex-col items-center justify-center rounded-lg bg-surface p-6 text-center">
            <span className="text-xs font-medium tracking-wide text-ink-muted uppercase">
              People Health Score
            </span>
            <span className={`mt-2 text-6xl font-semibold ${corGeral.texto}`}>
              {geral.score}
            </span>
            <span className="mt-1 flex items-center gap-1.5 text-sm font-medium">
              <span className={`inline-block size-2.5 rounded-full ${corGeral.ponto}`} />
              {CLASSIFICACAO_LABEL[geral.classificacao]}
            </span>
            <span className="mt-1 text-xs text-ink-muted">
              {geral.pessoas} pessoas no quadro
            </span>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {geral.dimensoes.map((dimensao) => (
              <BarraDimensao key={dimensao.chave} dimensao={dimensao} />
            ))}
          </div>
        </div>
        <p className="mt-5 border-t border-line pt-4 text-xs text-ink-muted">
          Índice direcional (0–100) que combina presença, retenção e cobertura com
          pesos declarados. Não é diagnóstico nem nota de pessoas: serve para
          comparar setores e acompanhar tendência ao longo do tempo.
        </p>
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-line bg-panel">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-sm font-semibold">Health Score por setor</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Do menor para o maior. Passe pelas dimensões para ver o que sustenta cada
            nota.
          </p>
        </div>
        <div className="divide-y divide-line">
          {porSetor.map((setor) => {
            const cor = COR_CLASSIFICACAO[setor.classificacao];
            return (
              <div key={setor.setorId} className="px-6 py-4">
                <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-center">
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-semibold ${cor.texto}`}>
                      {setor.score}
                    </span>
                    <div>
                      <Link
                        href={`/estrutura/${setor.setorId}`}
                        className="text-sm font-medium transition-colors hover:text-ink-soft"
                      >
                        {setor.setorNome}
                      </Link>
                      <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                        <span className={`inline-block size-2 rounded-full ${cor.ponto}`} />
                        {CLASSIFICACAO_LABEL[setor.classificacao]} · {setor.pessoas} pessoas
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {setor.dimensoes.map((dimensao) => (
                      <BarraDimensao
                        key={dimensao.chave}
                        dimensao={dimensao}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-baseline justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Central de insights</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Pergunta, evidência, hipótese e ação — nesta ordem, de propósito.
            </p>
          </div>
          <span className="text-xs text-ink-muted">
            {insights.length} {insights.length === 1 ? "insight" : "insights"}
          </span>
        </div>
        {insights.length === 0 ? (
          <p className="rounded-lg border border-line bg-panel px-6 py-12 text-center text-sm text-ink-muted">
            Nenhum padrão relevante o suficiente para virar insight no momento.
          </p>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {insights.map((insight) => (
              <CartaoInsight key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </section>

      <p className="mt-6 text-xs text-ink-muted">
        Os insights nascem dos mesmos dados dos alertas, mas vão além: propõem uma
        leitura. A hipótese é sempre um convite à investigação — o rótulo separa o
        que os dados mostram do que ainda é suposição. Nenhuma ação aqui é
        automática; a decisão é de quem conhece o contexto.
      </p>
    </>
  );
}
