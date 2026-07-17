import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/ui/page-header";
import { listarColaboradores } from "@/lib/data/colaboradores";
import { listarSetores } from "@/lib/data/setores";
import { listarVagas } from "@/lib/data/vagas";

/** Mapa da operacao: fotografia do quadro e das vagas abertas de cada setor. */
export default async function EstruturaPage() {
  const [setores, colaboradores, vagas] = await Promise.all([
    listarSetores(),
    listarColaboradores(),
    listarVagas(),
  ]);

  const cartoes = setores.map((setor) => {
    const equipe = colaboradores.filter((c) => c.setor_id === setor.id);
    const ativos = equipe.filter((c) => c.status === "ativo").length;
    const afastados = equipe.filter((c) => c.status === "afastado").length;
    const ferias = equipe.filter((c) => c.status === "ferias").length;
    const abertas = vagas.filter(
      (v) => v.setor_id === setor.id && v.status === "aberta",
    ).length;
    const ocupacao =
      setor.headcount_planejado > 0
        ? Math.round((ativos / setor.headcount_planejado) * 100)
        : 0;

    return { ...setor, ativos, afastados, ferias, abertas, ocupacao };
  });

  return (
    <>
      <PageHeader
        titulo="Estrutura da Operação"
        descricao="Quadro planejado versus real de cada setor. Clique em um setor para ver a fotografia completa."
      >
        <Link
          href="/estrutura/novo"
          className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-panel transition-opacity hover:opacity-90"
        >
          <Plus size={15} weight="bold" />
          Novo setor
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cartoes.map((setor) => (
          <Link
            key={setor.id}
            href={`/estrutura/${setor.id}`}
            className="rounded-lg border border-line bg-panel p-5 transition-colors hover:border-line-strong"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">{setor.nome}</h2>
              <span
                className={`text-xs font-medium ${
                  setor.ocupacao < 70 ? "text-negative" : "text-ink-muted"
                }`}
              >
                {setor.ocupacao}% do planejado
              </span>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-soft">
              <div
                className={`h-full rounded-full ${
                  setor.ocupacao < 70 ? "bg-negative" : "bg-brand"
                }`}
                style={{ width: `${Math.min(setor.ocupacao, 100)}%` }}
              />
            </div>

            <dl className="mt-4 grid grid-cols-5 gap-2 text-center">
              <div>
                <dt className="text-[11px] text-ink-muted">Planejado</dt>
                <dd className="text-sm font-semibold">{setor.headcount_planejado}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-ink-muted">Ativos</dt>
                <dd className="text-sm font-semibold">{setor.ativos}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-ink-muted">Afastados</dt>
                <dd className="text-sm font-semibold">{setor.afastados}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-ink-muted">Férias</dt>
                <dd className="text-sm font-semibold">{setor.ferias}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-ink-muted">Vagas</dt>
                <dd className="text-sm font-semibold">{setor.abertas}</dd>
              </div>
            </dl>
          </Link>
        ))}
      </div>
    </>
  );
}
