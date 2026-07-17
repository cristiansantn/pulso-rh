import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input, Label } from "@/components/ui/form";
import { listarColaboradores } from "@/lib/data/colaboradores";
import { buscarSetor } from "@/lib/data/setores";
import { listarVagas } from "@/lib/data/vagas";
import type { Colaborador } from "@/lib/data/tipos";
import { removerSetor, salvarSetor } from "../actions";

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

/** Tempo medio de casa do quadro atual (desligados fora), em texto legivel. */
function tempoMedioDeCasa(equipe: Colaborador[]): string {
  const admissoes = equipe
    .filter((c) => c.status !== "desligado" && c.data_admissao)
    .map((c) => new Date(`${c.data_admissao}T00:00:00`).getTime());

  if (admissoes.length === 0) return "—";

  const mediaMs =
    admissoes.reduce((total, t) => total + (Date.now() - t), 0) / admissoes.length;
  const meses = mediaMs / (1000 * 60 * 60 * 24 * 30.44);

  if (meses < 12) return `${Math.round(meses)} meses`;
  return `${(meses / 12).toFixed(1).replace(".", ",")} anos`;
}

/** Fotografia completa de um setor: quadro, perfil do time e equipe nominal. */
export default async function SetorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const [{ id }, { erro }] = await Promise.all([params, searchParams]);
  const [setor, colaboradores, vagas] = await Promise.all([
    buscarSetor(id),
    listarColaboradores(),
    listarVagas(),
  ]);

  if (!setor) {
    notFound();
  }

  const equipe = colaboradores.filter((c) => c.setor_id === setor.id);
  const vagasAbertas = vagas.filter(
    (v) => v.setor_id === setor.id && v.status === "aberta",
  ).length;
  const quadroAtual = equipe.filter((c) => c.status !== "desligado");
  const ativos = equipe.filter((c) => c.status === "ativo").length;
  const ocupacao =
    setor.headcount_planejado > 0
      ? Math.round((ativos / setor.headcount_planejado) * 100)
      : 0;

  const porCargo = new Map<string, number>();
  for (const pessoa of quadroAtual) {
    const cargo = pessoa.cargo?.nome ?? "Sem cargo";
    porCargo.set(cargo, (porCargo.get(cargo) ?? 0) + 1);
  }

  return (
    <>
      <Link
        href="/estrutura"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} />
        Estrutura da Operação
      </Link>

      <PageHeader
        titulo={setor.nome}
        descricao="Turnover do setor entra na Fase 5."
      />

      {erro === "invalido" && (
        <p className="mb-4 rounded-md bg-negative-soft px-4 py-2.5 text-sm text-negative">
          Dados inválidos. Informe um nome e um headcount inteiro, zero ou mais.
        </p>
      )}
      {erro === "vagas-abertas" && (
        <p className="mb-4 rounded-md bg-negative-soft px-4 py-2.5 text-sm text-negative">
          Este setor tem vagas abertas. Conclua ou cancele as vagas antes de excluí-lo.
        </p>
      )}

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard rotulo="Planejado" valor={String(setor.headcount_planejado)} />
        <KpiCard rotulo="Vagas abertas" valor={String(vagasAbertas)} />
        <KpiCard rotulo="Ativos" valor={String(ativos)} />
        <KpiCard
          rotulo="Afastados"
          valor={String(equipe.filter((c) => c.status === "afastado").length)}
        />
        <KpiCard
          rotulo="Em férias"
          valor={String(equipe.filter((c) => c.status === "ferias").length)}
        />
        <KpiCard
          rotulo="Ocupação"
          valor={`${ocupacao}%`}
          detalhe={`Tempo médio de casa: ${tempoMedioDeCasa(equipe)}`}
        />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-line bg-panel p-6">
          <h2 className="text-sm font-semibold">Editar setor</h2>
          <p className="mt-1 text-xs text-ink-muted">
            A renomeação vale para todos os colaboradores e vagas vinculados.
          </p>
          <form action={salvarSetor.bind(null, setor.id)} className="mt-4 space-y-3">
            <div>
              <Label htmlFor="nome">Nome do setor</Label>
              <Input id="nome" name="nome" required defaultValue={setor.nome} />
            </div>
            <div>
              <Label htmlFor="headcount_planejado">Headcount planejado</Label>
              <Input
                id="headcount_planejado"
                name="headcount_planejado"
                type="number"
                min={0}
                required
                defaultValue={setor.headcount_planejado}
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-panel transition-opacity hover:opacity-90"
            >
              Salvar
            </button>
          </form>

          <details className="mt-6 border-t border-line pt-4">
            <summary className="cursor-pointer text-sm font-medium text-negative">
              Excluir setor
            </summary>
            <p className="mt-2 text-xs text-ink-muted">
              {quadroAtual.length > 0
                ? `${quadroAtual.length} pessoa(s) ficam sem setor definido e precisam ser realocadas depois.`
                : "Nenhuma pessoa está lotada neste setor."}{" "}
              A exclusão não pode ser desfeita.
            </p>
            <form action={removerSetor.bind(null, setor.id)} className="mt-3">
              <button
                type="submit"
                className="rounded-md border border-negative/40 px-4 py-2 text-sm font-medium text-negative transition-colors hover:bg-negative-soft"
              >
                Excluir definitivamente
              </button>
            </form>
          </details>
        </section>

        <section className="rounded-lg border border-line bg-panel lg:col-span-2">
          <div className="border-b border-line px-6 py-4">
            <h2 className="text-sm font-semibold">Composição por cargo</h2>
            <p className="mt-0.5 text-xs text-ink-muted">Quadro atual, sem desligados.</p>
          </div>
          {porCargo.size === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-ink-muted">
              Nenhuma pessoa lotada neste setor.
            </p>
          ) : (
            <ul className="divide-y divide-line px-6">
              {[...porCargo.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([cargo, quantidade]) => (
                  <li key={cargo} className="flex items-center justify-between py-2.5 text-sm">
                    <span>{cargo}</span>
                    <span className="font-medium">{quantidade}</span>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-lg border border-line bg-panel">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-sm font-semibold">Equipe</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-muted">
              <th className="px-6 py-2.5 font-medium">Colaborador</th>
              <th className="px-6 py-2.5 font-medium">Cargo</th>
              <th className="px-6 py-2.5 font-medium">Gestor</th>
              <th className="px-6 py-2.5 font-medium">Admissão</th>
              <th className="px-6 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {equipe.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-ink-muted">
                  Nenhuma pessoa lotada neste setor.
                </td>
              </tr>
            )}
            {equipe.map((c) => (
              <tr
                key={c.id}
                className="border-b border-line transition-colors last:border-0 hover:bg-surface"
              >
                <td className="px-6 py-3">
                  <Link href={`/pessoas/${c.id}`} className="block">
                    <span className="font-medium">{c.nome}</span>
                    <span className="block text-xs text-ink-muted">
                      Matrícula {c.matricula}
                    </span>
                  </Link>
                </td>
                <td className="px-6 py-3 text-ink-soft">{c.cargo?.nome ?? "—"}</td>
                <td className="px-6 py-3 text-ink-soft">{c.gestor?.nome ?? "—"}</td>
                <td className="px-6 py-3 text-ink-soft">{formatarData(c.data_admissao)}</td>
                <td className="px-6 py-3">
                  <StatusBadge status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
