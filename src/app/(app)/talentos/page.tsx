import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { GraficoDonut } from "@/components/charts/grafico-donut";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import {
  bancoPorCargo,
  distribuicaoProntidao,
  planoPorPessoa,
} from "@/lib/analytics/talentos";
import { listarColaboradores } from "@/lib/data/colaboradores";
import { listarPlanosSucessao } from "@/lib/data/talentos";
import {
  COMPETENCIAS,
  PRONTIDAO,
  type Colaborador,
  type Prontidao,
} from "@/lib/data/tipos";

/** Cargos considerados criticos para a continuidade da operacao. */
const CARGOS_CHAVE_IDS = ["c-gerente", "c-coordenador", "c-supervisor", "c-lider"];

/** Cor de cada faixa no donut; pronto agora ganha o tom positivo. */
const CORES_PRONTIDAO: Record<Prontidao, { cor: string; opacidade?: number }> = {
  pronto: { cor: "var(--color-positive)" },
  "6_meses": { cor: "var(--color-brand)", opacidade: 0.7 },
  "12_meses": { cor: "var(--color-brand)", opacidade: 0.3 },
};

function EtiquetaProntidao({ prontidao }: { prontidao: Prontidao }) {
  const estilo =
    prontidao === "pronto"
      ? "bg-positive-soft text-positive"
      : prontidao === "6_meses"
        ? "bg-brand-soft text-brand"
        : "bg-neutral-soft text-ink-soft";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estilo}`}>
      {PRONTIDAO[prontidao]}
    </span>
  );
}

function formatarData(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

/**
 * Talentos e sucessao (Fase 8). Leitura de cobertura, nao ranking de pessoas:
 * a pagina mostra onde ha banco de sucessores e onde falta. Nesta fase os
 * planos chegam por carga externa e o modulo e somente leitura.
 */
export default async function TalentosPage() {
  const [colaboradores, planos] = await Promise.all([
    listarColaboradores(),
    listarPlanosSucessao(),
  ]);

  const pessoaPorId = new Map(colaboradores.map((c) => [c.id, c]));
  const ativos = colaboradores.filter((c) => c.status !== "desligado");

  // Plano vigente por pessoa, restrito a quem esta no quadro ativo.
  const planoPorId = planoPorPessoa(
    planos.filter((p) => {
      const pessoa = pessoaPorId.get(p.colaborador_id);
      return pessoa != null && pessoa.status !== "desligado";
    }),
  );
  const planosAtivos = [...planoPorId.values()];

  const prontos = planosAtivos.filter((p) => p.prontidao === "pronto").length;
  const distribuicao = distribuicaoProntidao(planosAtivos);
  const banco = bancoPorCargo(planosAtivos, pessoaPorId);

  // Cobertura dos cargos-chave: quantos postos ocupados tem sucessor mapeado.
  const cargosChaveOcupados = new Set(
    ativos
      .filter((c) => c.cargo_id && CARGOS_CHAVE_IDS.includes(c.cargo_id))
      .map((c) => c.cargo?.nome)
      .filter((nome): nome is string => Boolean(nome)),
  );
  const cargosComBanco = new Set(banco.map((b) => b.cargoNome));
  const cargosChaveSemBanco = [...cargosChaveOcupados].filter(
    (nome) => !cargosComBanco.has(nome),
  );

  const linhasPessoas = planosAtivos
    .map((plano) => ({ plano, pessoa: pessoaPorId.get(plano.colaborador_id) }))
    .filter(
      (linha): linha is { plano: (typeof planosAtivos)[number]; pessoa: Colaborador } =>
        linha.pessoa != null,
    )
    .sort(
      (a, b) =>
        distribuicao.findIndex((d) => d.prontidao === a.plano.prontidao) -
          distribuicao.findIndex((d) => d.prontidao === b.plano.prontidao) ||
        a.pessoa.nome.localeCompare(b.pessoa.nome),
    );

  const totalMapeados = planosAtivos.length;

  return (
    <>
      <PageHeader
        titulo="Talentos e Sucessão"
        descricao="Banco de sucessores por cargo, prontidão e gaps de competência (PDI). Leitura de cobertura, não ranking de pessoas."
      >
        <Link
          href="/talentos/plano"
          className="flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-neutral-soft/60"
        >
          <Plus size={15} />
          Novo plano
        </Link>
      </PageHeader>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          rotulo="Sucessores mapeados"
          valor={String(totalMapeados)}
          detalhe={`De ${ativos.length} pessoas no quadro ativo`}
        />
        <KpiCard
          rotulo="Prontos agora"
          valor={String(prontos)}
          detalhe="Podem assumir o cargo-alvo de imediato"
        />
        <KpiCard
          rotulo="Cargos com banco"
          valor={String(banco.length)}
          detalhe="Cargos-alvo com ao menos um sucessor"
        />
        <KpiCard
          rotulo="Cargos-chave sem banco"
          valor={String(cargosChaveSemBanco.length)}
          detalhe={
            cargosChaveSemBanco.length > 0
              ? cargosChaveSemBanco.join(", ")
              : "Todos os cargos-chave têm sucessor"
          }
        />
      </section>

      <section className="mt-6 rounded-lg border border-line bg-panel p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">Prontidão do banco</h2>
          <span className="text-xs text-ink-muted">
            {totalMapeados} {totalMapeados === 1 ? "sucessor" : "sucessores"} mapeados
          </span>
        </div>
        <div className="mt-5">
          <GraficoDonut
            fatias={distribuicao.map((faixa) => ({
              rotulo: PRONTIDAO[faixa.prontidao],
              valor: faixa.pessoas,
              ...CORES_PRONTIDAO[faixa.prontidao],
            }))}
            valorCentral={totalMapeados}
            rotuloCentral={totalMapeados === 1 ? "sucessor" : "sucessores"}
          />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold">Banco de sucessores por cargo</h2>
        {banco.length === 0 ? (
          <p className="rounded-lg border border-line bg-panel px-6 py-8 text-center text-sm text-ink-muted">
            Nenhum plano de sucessão mapeado.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {banco.map((grupo) => (
              <div
                key={grupo.cargoNome}
                className="overflow-hidden rounded-lg border border-line bg-panel"
              >
                <div className="flex items-center justify-between gap-2 border-b border-line px-6 py-4">
                  <h3 className="text-sm font-semibold">{grupo.cargoNome}</h3>
                  <span className="text-xs text-ink-muted">
                    {grupo.sucessores.length}{" "}
                    {grupo.sucessores.length === 1 ? "candidato" : "candidatos"}
                    {!grupo.temProntos && " · sem pronto agora"}
                  </span>
                </div>
                <ul className="divide-y divide-line">
                  {grupo.sucessores.map(({ plano, colaborador }) => (
                    <li key={plano.id} className="px-6 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <Link
                          href={`/pessoas/${colaborador.id}`}
                          className="text-sm font-medium"
                        >
                          {colaborador.nome}
                        </Link>
                        <EtiquetaProntidao prontidao={plano.prontidao} />
                      </div>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {colaborador.cargo?.nome ?? "—"}
                        {colaborador.setor?.nome ? ` · ${colaborador.setor.nome}` : ""}
                      </p>
                      {plano.gaps.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {plano.gaps.map((gap) => (
                            <span
                              key={gap}
                              className="rounded border border-line bg-surface px-1.5 py-0.5 text-xs text-ink-soft"
                            >
                              {COMPETENCIAS[gap]}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-line bg-panel">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-sm font-semibold">Sucessores e PDI</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Cada gap de competência é um foco do plano de desenvolvimento individual.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-muted">
              <th className="px-6 py-2.5 font-medium">Associado</th>
              <th className="px-6 py-2.5 font-medium">Cargo atual</th>
              <th className="px-6 py-2.5 font-medium">Cargo-alvo</th>
              <th className="px-6 py-2.5 font-medium">Prontidão</th>
              <th className="px-6 py-2.5 font-medium">Gaps de competência (PDI)</th>
              <th className="px-6 py-2.5 font-medium">Revisado em</th>
            </tr>
          </thead>
          <tbody>
            {linhasPessoas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-ink-muted">
                  Nenhum sucessor mapeado.
                </td>
              </tr>
            )}
            {linhasPessoas.map(({ plano, pessoa }) => (
              <tr
                key={plano.id}
                className="border-b border-line transition-colors last:border-0 hover:bg-surface"
              >
                <td className="px-6 py-3">
                  <Link href={`/pessoas/${pessoa.id}`} className="font-medium">
                    {pessoa.nome}
                  </Link>
                </td>
                <td className="px-6 py-3 text-ink-soft">{pessoa.cargo?.nome ?? "—"}</td>
                <td className="px-6 py-3 text-ink-soft">{plano.cargo_alvo?.nome ?? "—"}</td>
                <td className="px-6 py-3">
                  <EtiquetaProntidao prontidao={plano.prontidao} />
                </td>
                <td className="px-6 py-3 text-ink-soft">
                  {plano.gaps.length === 0
                    ? "Sem gaps registrados"
                    : plano.gaps.map((gap) => COMPETENCIAS[gap]).join(" · ")}
                </td>
                <td className="px-6 py-3 text-ink-soft">
                  {formatarData(plano.data_atualizacao)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="mt-6 text-xs text-ink-muted">
        O banco de sucessão aponta risco de cobertura, não classifica pessoas.
        Prontidão e gaps são a leitura do comitê no ciclo, não uma promessa de
        promoção. Um cargo-chave sem sucessor pronto é um alerta de continuidade,
        não uma conclusão sobre quem o ocupa.
      </p>
    </>
  );
}
