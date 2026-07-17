import Link from "next/link";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import {
  formatarTaxa,
  listarDiasPerdidos,
  taxaAbsenteismo,
  type Periodo,
} from "@/lib/analytics/absenteismo";
import { vagaEmAtraso } from "@/lib/analytics/recrutamento";
import { listarColaboradores } from "@/lib/data/colaboradores";
import { listarAfastamentos, listarOcorrencias } from "@/lib/data/frequencia";
import { listarSetores } from "@/lib/data/setores";
import { listarVagas } from "@/lib/data/vagas";
import { diasAtrasIso, hojeIso } from "@/lib/datas";

/**
 * Visao Geral (cockpit da operacao).
 * Nesta fase exibe os indicadores derivados do cadastro e da frequencia.
 * Turnover e demais KPIs aparecem como pendentes ate seus modulos entrarem no ar.
 */
export default async function VisaoGeralPage() {
  // Mesmo periodo da pagina de Absenteismo, para os numeros baterem entre telas.
  const periodo: Periodo = { inicio: diasAtrasIso(90), fim: hojeIso() };

  const [colaboradores, setores, ocorrencias, afastamentos, vagas] =
    await Promise.all([
      listarColaboradores(),
      listarSetores(),
      listarOcorrencias({ desde: periodo.inicio }),
      listarAfastamentos({ desde: periodo.inicio }),
      listarVagas(),
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
        descricao="Fotografia atual da operação. Novos indicadores entram conforme os módulos do roadmap são concluídos."
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
        <KpiCard rotulo="Turnover" valor="—" detalhe="Disponível na Fase 5" pendente />
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
          rotulo="Cobertura de escala"
          valor="—"
          detalhe="Aguarda integração com o ponto"
          pendente
        />
      </section>

      <section className="mt-8 rounded-lg border border-line bg-panel">
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
