import { PageHeader } from "@/components/ui/page-header";
import { AcoesRelatorio } from "@/components/relatorios/acoes-relatorio";
import {
  formatarTaxa,
  listarDiasPerdidos,
  taxaAbsenteismo,
} from "@/lib/analytics/absenteismo";
import { gerarInsights } from "@/lib/analytics/insights";
import { vagaEmAtraso } from "@/lib/analytics/recrutamento";
import {
  CLASSIFICACAO_LABEL,
  saudeGeral,
  saudePorSetor,
} from "@/lib/analytics/saude";
import {
  desligadosDesde,
  indiceDeSaida,
  turnoverPrecoce,
} from "@/lib/analytics/turnover";
import { listarColaboradores } from "@/lib/data/colaboradores";
import { listarAfastamentos, listarOcorrencias } from "@/lib/data/frequencia";
import { listarSetores } from "@/lib/data/setores";
import { listarPlanosSucessao } from "@/lib/data/talentos";
import { listarVagas } from "@/lib/data/vagas";
import { diasAtrasIso, formatarDataBr, hojeIso } from "@/lib/datas";

interface LinhaSetor {
  nome: string;
  planejado: number;
  ativos: number;
  afastados: number;
  ferias: number;
  ocupacao: number;
  absenteismo: number | null;
  score: number;
  classificacao: string;
}

function montarCsv(linhas: LinhaSetor[]): string {
  const cabecalho = [
    "Setor",
    "Planejado",
    "Ativos",
    "Afastados",
    "Ferias",
    "Ocupacao %",
    "Absenteismo %",
    "Health Score",
    "Classificacao",
  ].join(";");

  const corpo = linhas.map((l) =>
    [
      l.nome,
      l.planejado,
      l.ativos,
      l.afastados,
      l.ferias,
      l.ocupacao,
      l.absenteismo !== null ? l.absenteismo.toFixed(1).replace(".", ",") : "",
      l.score,
      l.classificacao,
    ].join(";"),
  );

  return [cabecalho, ...corpo].join("\r\n");
}

/**
 * Relatorios exportaveis (Fase 10). Consolida o quadro num documento pronto
 * para PDF (via impressao do navegador) ou planilha (CSV). O conteudo espelha
 * os numeros das telas — a mesma fonte, um formato transportavel.
 */
export default async function RelatoriosPage() {
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

  const quadroAtual = colaboradores.filter((c) => c.status !== "desligado");
  const ativos = colaboradores.filter((c) => c.status === "ativo").length;
  const planejado = setores.reduce((t, s) => t + s.headcount_planejado, 0);

  const diasPerdidos = listarDiasPerdidos(ocorrencias, afastamentos, periodo);
  const absenteismoGeral = taxaAbsenteismo(
    diasPerdidos.length,
    quadroAtual.length,
    periodo,
  );

  const desligados12m = desligadosDesde(colaboradores, diasAtrasIso(365));
  const indiceSaida = indiceDeSaida(desligados12m.length, quadroAtual.length);
  const precoce = turnoverPrecoce(desligados12m, 90);

  const vagasAbertas = vagas.filter((v) => v.status === "aberta");
  const vagasEmAtraso = vagasAbertas.filter(vagaEmAtraso).length;

  const geral = saudeGeral(dados);
  const saudeSetores = saudePorSetor(dados);
  const scorePorSetor = new Map(saudeSetores.map((s) => [s.setorId, s]));
  const insights = gerarInsights(dados).slice(0, 3);

  const linhasSetor: LinhaSetor[] = setores
    .map((setor) => {
      const equipe = colaboradores.filter(
        (c) => c.setor_id === setor.id && c.status !== "desligado",
      );
      const ativosSetor = equipe.filter((c) => c.status === "ativo").length;
      const idsEquipe = new Set(equipe.map((c) => c.id));
      const perdidos = diasPerdidos.filter((d) =>
        idsEquipe.has(d.colaborador_id),
      ).length;
      const saude = scorePorSetor.get(setor.id);
      return {
        nome: setor.nome,
        planejado: setor.headcount_planejado,
        ativos: ativosSetor,
        afastados: equipe.filter((c) => c.status === "afastado").length,
        ferias: equipe.filter((c) => c.status === "ferias").length,
        ocupacao:
          setor.headcount_planejado > 0
            ? Math.round((ativosSetor / setor.headcount_planejado) * 100)
            : 0,
        absenteismo: taxaAbsenteismo(perdidos, equipe.length, periodo),
        score: saude?.score ?? 0,
        classificacao: saude ? CLASSIFICACAO_LABEL[saude.classificacao] : "—",
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const csv = montarCsv(linhasSetor);
  const hoje = hojeIso();

  const indicadores = [
    { rotulo: "Headcount ativo", valor: String(ativos) },
    { rotulo: "Headcount planejado", valor: String(planejado) },
    {
      rotulo: "Índice de saída (12m)",
      valor:
        indiceSaida !== null ? `${indiceSaida.toFixed(1).replace(".", ",")}%` : "—",
    },
    {
      rotulo: "Turnover precoce",
      valor: precoce !== null ? `${precoce.toFixed(1).replace(".", ",")}%` : "—",
    },
    { rotulo: "Absenteísmo (90d)", valor: formatarTaxa(absenteismoGeral) },
    {
      rotulo: "Vagas abertas",
      valor:
        vagasEmAtraso > 0
          ? `${vagasAbertas.length} (${vagasEmAtraso} em atraso)`
          : String(vagasAbertas.length),
    },
  ];

  return (
    <>
      <div className="print:px-10 print:py-8">
        <PageHeader
          titulo="Relatórios"
          descricao="Relatório consolidado da operação, pronto para PDF ou planilha."
        >
          <AcoesRelatorio csv={csv} nomeArquivo={`relatorio-operacao-${hoje}.csv`} />
        </PageHeader>

        <div className="mb-6 hidden print:block">
          <h1 className="text-xl font-semibold">Relatório da operação</h1>
          <p className="text-sm text-ink-muted">
            Painel de Controle · People Analytics C&amp;A · gerado em{" "}
            {formatarDataBr(hoje)}
          </p>
        </div>

        <section className="rounded-lg border border-line bg-panel p-6 print:border-0 print:p-0">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Resumo executivo</h2>
            <span className="text-xs text-ink-muted">
              Health Score {geral.score} · {CLASSIFICACAO_LABEL[geral.classificacao]}
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {indicadores.map((item) => (
              <div key={item.rotulo} className="rounded-md border border-line bg-surface p-4 print:bg-transparent">
                <dt className="text-xs text-ink-muted">{item.rotulo}</dt>
                <dd className="mt-1 text-xl font-semibold">{item.valor}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-6 overflow-hidden rounded-lg border border-line bg-panel print:mt-8">
          <div className="border-b border-line px-6 py-4 print:px-0">
            <h2 className="text-sm font-semibold">Quadro por setor</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-muted">
                <th className="px-6 py-2.5 font-medium print:px-0">Setor</th>
                <th className="px-6 py-2.5 text-right font-medium">Planejado</th>
                <th className="px-6 py-2.5 text-right font-medium">Ativos</th>
                <th className="px-6 py-2.5 text-right font-medium">Afastados</th>
                <th className="px-6 py-2.5 text-right font-medium">Férias</th>
                <th className="px-6 py-2.5 text-right font-medium">Ocupação</th>
                <th className="px-6 py-2.5 text-right font-medium">Absenteísmo</th>
                <th className="px-6 py-2.5 text-right font-medium print:px-0">Score</th>
              </tr>
            </thead>
            <tbody>
              {linhasSetor.map((linha) => (
                <tr key={linha.nome} className="border-b border-line last:border-0">
                  <td className="px-6 py-2.5 font-medium print:px-0">{linha.nome}</td>
                  <td className="px-6 py-2.5 text-right text-ink-soft">{linha.planejado}</td>
                  <td className="px-6 py-2.5 text-right">{linha.ativos}</td>
                  <td className="px-6 py-2.5 text-right text-ink-soft">{linha.afastados}</td>
                  <td className="px-6 py-2.5 text-right text-ink-soft">{linha.ferias}</td>
                  <td
                    className={`px-6 py-2.5 text-right font-medium ${
                      linha.ocupacao < 70 ? "text-negative" : ""
                    }`}
                  >
                    {linha.ocupacao}%
                  </td>
                  <td className="px-6 py-2.5 text-right text-ink-soft">
                    {formatarTaxa(linha.absenteismo)}
                  </td>
                  <td className="px-6 py-2.5 text-right font-medium print:px-0">
                    {linha.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {insights.length > 0 && (
          <section className="mt-6 rounded-lg border border-line bg-panel p-6 print:mt-8 print:border-0 print:p-0">
            <h2 className="text-sm font-semibold">Principais insights</h2>
            <ol className="mt-4 space-y-4">
              {insights.map((insight, indice) => (
                <li key={insight.id} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand print:bg-transparent print:border print:border-line">
                    {indice + 1}
                  </span>
                  <div className="text-sm">
                    <p className="font-medium">{insight.pergunta}</p>
                    <p className="mt-0.5 text-ink-soft">
                      <span className="text-ink-muted">Evidência: </span>
                      {insight.evidencia}
                    </p>
                    <p className="mt-0.5 text-ink-soft">
                      <span className="text-ink-muted">Ação sugerida: </span>
                      {insight.acao}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <p className="mt-6 text-xs text-ink-muted">
          Documento gerado a partir dos dados atuais do sistema. O Health Score é um
          índice direcional (presença, retenção e cobertura) e os insights trazem
          hipóteses a investigar, não conclusões. Em modo demonstração, os dados são
          fictícios.
        </p>
      </div>
    </>
  );
}
