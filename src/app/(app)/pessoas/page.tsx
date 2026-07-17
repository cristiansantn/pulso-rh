import Link from "next/link";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { listarColaboradores } from "@/lib/data/colaboradores";
import { listarCargos, listarSetores } from "@/lib/data/setores";
import {
  STATUS_LABELS,
  TURNOS,
  type StatusColaborador,
  type Turno,
} from "@/lib/data/tipos";
import { formatarDataBr } from "@/lib/datas";

interface FiltrosUrl {
  q?: string;
  setor?: string;
  cargo?: string;
  turno?: string;
  status?: string;
}

const SELECT_FILTRO =
  "rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink-soft " +
  "focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-line";

export default async function PessoasPage({
  searchParams,
}: {
  searchParams: Promise<FiltrosUrl>;
}) {
  const { q, setor, cargo, turno, status } = await searchParams;

  const [colaboradores, setores, cargos] = await Promise.all([
    listarColaboradores({
      busca: q,
      setorId: setor,
      cargoId: cargo,
      turno: turno as Turno | undefined,
      status: status as StatusColaborador | undefined,
    }),
    listarSetores(),
    listarCargos(),
  ]);

  const filtroAtivo = Boolean(q || setor || cargo || turno || status);

  return (
    <>
      <PageHeader
        titulo="Associados"
        descricao="Cadastro dos associados da operação."
      >
        <Link
          href="/pessoas/nova"
          className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-panel transition-opacity hover:opacity-90"
        >
          <Plus size={15} weight="bold" />
          Novo associado
        </Link>
      </PageHeader>

      <form className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <MagnifyingGlass
            size={16}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome ou matrícula"
            className="w-full rounded-md border border-line bg-panel py-2 pr-3 pl-9 text-sm placeholder:text-ink-muted focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-line"
          />
        </div>
        <select name="setor" defaultValue={setor ?? ""} className={SELECT_FILTRO}>
          <option value="">Todos os setores</option>
          {setores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
        <select name="cargo" defaultValue={cargo ?? ""} className={SELECT_FILTRO}>
          <option value="">Todos os cargos</option>
          {cargos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
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
        <select name="status" defaultValue={status ?? ""} className={SELECT_FILTRO}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([valor, rotulo]) => (
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
            href="/pessoas"
            className="px-2 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Limpar
          </Link>
        )}
      </form>

      <div className="overflow-hidden rounded-lg border border-line bg-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-muted">
              <th className="px-6 py-2.5 font-medium">Associado</th>
              <th className="px-6 py-2.5 font-medium">Setor</th>
              <th className="px-6 py-2.5 font-medium">Cargo</th>
              <th className="px-6 py-2.5 font-medium">Gestor</th>
              <th className="px-6 py-2.5 font-medium">Admissão</th>
              <th className="px-6 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {colaboradores.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-ink-muted">
                  Nenhum associado encontrado.
                </td>
              </tr>
            )}
            {colaboradores.map((c) => (
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
                <td className="px-6 py-3 text-ink-soft">{c.setor?.nome ?? "—"}</td>
                <td className="px-6 py-3 text-ink-soft">{c.cargo?.nome ?? "—"}</td>
                <td className="px-6 py-3 text-ink-soft">{c.gestor?.nome ?? "—"}</td>
                <td className="px-6 py-3 text-ink-soft">
                  {formatarDataBr(c.data_admissao)}
                </td>
                <td className="px-6 py-3">
                  <StatusBadge status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
