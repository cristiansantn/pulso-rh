import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import {
  distribuicaoDisc,
  fatorPredominante,
  formatarPerfil,
  perfilAtualPorPessoa,
} from "@/lib/analytics/comportamento";
import { listarColaboradores } from "@/lib/data/colaboradores";
import { listarPerfis } from "@/lib/data/comportamento";
import { listarSetores } from "@/lib/data/setores";
import {
  DISC,
  TURNOS,
  type Colaborador,
  type FatorDisc,
  type PerfilComportamental,
  type Turno,
} from "@/lib/data/tipos";

const SELECT_FILTRO =
  "rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink-soft " +
  "focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-line";

/** Tons da mesma familia para os quatro fatores; a legenda nomeia cada um. */
const COR_FATOR: Record<FatorDisc, string> = {
  D: "bg-brand",
  I: "bg-brand/70",
  S: "bg-brand/45",
  C: "bg-brand/20",
};

function BarraComposicao({ perfis }: { perfis: PerfilComportamental[] }) {
  const partes = distribuicaoDisc(perfis).filter((p) => p.pessoas > 0);
  if (partes.length === 0) {
    return <div className="h-2 flex-1 rounded-full bg-neutral-soft" />;
  }
  return (
    <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-neutral-soft">
      {partes.map((parte) => (
        <div
          key={parte.fator}
          className={COR_FATOR[parte.fator]}
          style={{ width: `${parte.percentual}%` }}
          title={`${DISC[parte.fator].nome}: ${parte.pessoas}`}
        />
      ))}
    </div>
  );
}

interface GrupoPerfis {
  rotulo: string;
  perfis: PerfilComportamental[];
}

/** Agrupa os perfis por um atributo da pessoa e ordena do maior grupo ao menor. */
function agruparPorAtributo(
  perfis: PerfilComportamental[],
  pessoaPorId: Map<string, Colaborador>,
  atributo: (c: Colaborador) => string,
): GrupoPerfis[] {
  const grupos = new Map<string, PerfilComportamental[]>();
  for (const perfil of perfis) {
    const pessoa = pessoaPorId.get(perfil.colaborador_id);
    if (!pessoa) continue;
    const chave = atributo(pessoa);
    const lista = grupos.get(chave) ?? [];
    lista.push(perfil);
    grupos.set(chave, lista);
  }
  return [...grupos.entries()]
    .map(([rotulo, lista]) => ({ rotulo, perfis: lista }))
    .sort((a, b) => b.perfis.length - a.perfis.length);
}

function TabelaMapa({ titulo, grupos }: { titulo: string; grupos: GrupoPerfis[] }) {
  return (
    <section className="overflow-hidden rounded-lg border border-line bg-panel">
      <div className="border-b border-line px-6 py-4">
        <h2 className="text-sm font-semibold">{titulo}</h2>
      </div>
      {grupos.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-ink-muted">
          Nenhum perfil mapeado no recorte.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-muted">
              <th className="px-6 py-2.5 font-medium">Grupo</th>
              <th className="px-6 py-2.5 text-right font-medium">Mapeados</th>
              <th className="w-2/5 px-6 py-2.5 font-medium">Composição</th>
              <th className="px-6 py-2.5 font-medium">Predominante</th>
            </tr>
          </thead>
          <tbody>
            {grupos.map((grupo) => {
              const predominante = fatorPredominante(grupo.perfis);
              return (
                <tr key={grupo.rotulo} className="border-b border-line last:border-0">
                  <td className="px-6 py-2.5 font-medium">{grupo.rotulo}</td>
                  <td className="px-6 py-2.5 text-right text-ink-soft">
                    {grupo.perfis.length}
                  </td>
                  <td className="px-6 py-2.5">
                    <BarraComposicao perfis={grupo.perfis} />
                  </td>
                  <td className="px-6 py-2.5 text-ink-soft">
                    {predominante ? `${predominante} · ${DISC[predominante].nome}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}

function formatarData(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

/**
 * Perfil comportamental (Fase 7). Mantido separado de performance por
 * principio: perfil descreve estilo de trabalho, nao desempenho. Nesta fase
 * o registro e externo: o modulo e somente leitura.
 */
export default async function PerfisPage({
  searchParams,
}: {
  searchParams: Promise<{ setor?: string; turno?: string }>;
}) {
  const params = await searchParams;

  const [colaboradores, setores, perfis] = await Promise.all([
    listarColaboradores(),
    listarSetores(),
    listarPerfis(),
  ]);

  const setorId = setores.some((s) => s.id === params.setor) ? params.setor : undefined;
  const turno =
    params.turno && params.turno in TURNOS ? (params.turno as Turno) : undefined;
  const filtroAtivo = Boolean(params.setor || params.turno);

  const doRecorte = (c: Colaborador) =>
    (!setorId || c.setor_id === setorId) && (!turno || c.turno === turno);
  const pessoaPorId = new Map(colaboradores.map((c) => [c.id, c]));
  const quadroRecorte = colaboradores.filter(
    (c) => doRecorte(c) && c.status !== "desligado",
  );
  const idsQuadro = new Set(quadroRecorte.map((c) => c.id));

  // Perfil vigente de cada pessoa do recorte (reavaliacoes usam o mais recente).
  const perfilPorPessoa = perfilAtualPorPessoa(
    perfis.filter((p) => idsQuadro.has(p.colaborador_id)),
  );
  const perfisRecorte = [...perfilPorPessoa.values()];
  const semMapeamento = quadroRecorte.length - perfisRecorte.length;
  const cobertura =
    quadroRecorte.length > 0
      ? (perfisRecorte.length / quadroRecorte.length) * 100
      : 0;

  const distribuicao = distribuicaoDisc(perfisRecorte);
  const predominante = fatorPredominante(perfisRecorte);

  const linhasPessoas = quadroRecorte
    .filter((c) => perfilPorPessoa.has(c.id))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const setorPorId = new Map(setores.map((s) => [s.id, s.nome]));

  return (
    <>
      <PageHeader
        titulo="Perfil Comportamental"
        descricao="Perfis DISC do quadro e mapa comportamental por equipe. Registro separado de performance: perfil descreve estilo de trabalho, não desempenho."
      >
        <Link
          href="/perfis/registrar"
          className="flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-neutral-soft/60"
        >
          <Plus size={15} />
          Registrar perfil
        </Link>
      </PageHeader>

      <form className="mb-4 flex flex-wrap items-center gap-2">
        <select name="setor" defaultValue={setorId ?? ""} className={SELECT_FILTRO}>
          <option value="">Todos os setores</option>
          {setores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
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
        <button
          type="submit"
          className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-neutral-soft/60"
        >
          Filtrar
        </button>
        {filtroAtivo && (
          <Link
            href="/perfis"
            className="px-2 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Limpar
          </Link>
        )}
      </form>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          rotulo="Perfis mapeados"
          valor={String(perfisRecorte.length)}
          detalhe={`De ${quadroRecorte.length} pessoas no quadro do recorte`}
        />
        <KpiCard
          rotulo="Cobertura"
          valor={`${cobertura.toFixed(0)}%`}
          detalhe="Pessoas com perfil vigente"
        />
        <KpiCard
          rotulo="Fator predominante"
          valor={predominante ? `${predominante} · ${DISC[predominante].nome}` : "—"}
          detalhe={predominante ? DISC[predominante].enfase : "Sem perfis no recorte"}
        />
        <KpiCard
          rotulo="Sem mapeamento"
          valor={String(semMapeamento)}
          detalhe="Admissão recente ou contrato temporário"
        />
      </section>

      <section className="mt-6 rounded-lg border border-line bg-panel p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">Composição do recorte</h2>
          <span className="text-xs text-ink-muted">
            Fator primário de {perfisRecorte.length}{" "}
            {perfisRecorte.length === 1 ? "perfil" : "perfis"}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <BarraComposicao perfis={perfisRecorte} />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {distribuicao.map((item) => (
            <div key={item.fator} className="rounded-md border border-line bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span
                    className={`inline-block size-2.5 rounded-full ${COR_FATOR[item.fator]}`}
                  />
                  {item.fator} · {DISC[item.fator].nome}
                </span>
                <span className="text-sm font-semibold text-ink-soft">
                  {item.pessoas}
                  <span className="ml-1 text-xs font-normal text-ink-muted">
                    ({item.percentual.toFixed(0)}%)
                  </span>
                </span>
              </div>
              <p className="mt-2 text-xs text-ink-muted">{DISC[item.fator].enfase}</p>
              <dl className="mt-3 space-y-1.5 text-xs">
                <div className="flex gap-1.5">
                  <dt className="shrink-0 text-ink-muted">Comunicação:</dt>
                  <dd className="text-ink-soft">{DISC[item.fator].comunicacao}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="shrink-0 text-ink-muted">Decisão:</dt>
                  <dd className="text-ink-soft">{DISC[item.fator].decisao}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <TabelaMapa
          titulo="Mapa por setor"
          grupos={agruparPorAtributo(perfisRecorte, pessoaPorId, (c) =>
            c.setor_id ? (setorPorId.get(c.setor_id) ?? "Sem setor") : "Sem setor",
          )}
        />
        <TabelaMapa
          titulo="Mapa por equipe (gestor direto)"
          grupos={agruparPorAtributo(perfisRecorte, pessoaPorId, (c) =>
            c.gestor_id
              ? (pessoaPorId.get(c.gestor_id)?.nome ?? "Sem gestor")
              : "Sem gestor",
          )}
        />
      </div>

      <section className="mt-6 overflow-hidden rounded-lg border border-line bg-panel">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-sm font-semibold">Por pessoa</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Perfil vigente, com os estilos característicos do fator primário.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-muted">
              <th className="px-6 py-2.5 font-medium">Associado</th>
              <th className="px-6 py-2.5 font-medium">Setor</th>
              <th className="px-6 py-2.5 font-medium">Turno</th>
              <th className="px-6 py-2.5 font-medium">Perfil</th>
              <th className="px-6 py-2.5 font-medium">Comunicação</th>
              <th className="px-6 py-2.5 font-medium">Decisão</th>
              <th className="px-6 py-2.5 font-medium">Avaliado em</th>
            </tr>
          </thead>
          <tbody>
            {linhasPessoas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-ink-muted">
                  Nenhuma pessoa com perfil mapeado no recorte.
                </td>
              </tr>
            )}
            {linhasPessoas.map((pessoa) => {
              const perfil = perfilPorPessoa.get(pessoa.id) as PerfilComportamental;
              return (
                <tr
                  key={pessoa.id}
                  className="border-b border-line transition-colors last:border-0 hover:bg-surface"
                >
                  <td className="px-6 py-3">
                    <Link href={`/pessoas/${pessoa.id}`} className="font-medium">
                      {pessoa.nome}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-ink-soft">{pessoa.setor?.nome ?? "—"}</td>
                  <td className="px-6 py-3 text-ink-soft">
                    {pessoa.turno ? TURNOS[pessoa.turno] : "—"}
                  </td>
                  <td className="px-6 py-3">
                    <span className="font-medium">{formatarPerfil(perfil)}</span>
                    <span className="text-ink-muted">
                      {" "}
                      · {DISC[perfil.fator_primario].nome}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-ink-soft">
                    {DISC[perfil.fator_primario].comunicacao}
                  </td>
                  <td className="px-6 py-3 text-ink-soft">
                    {DISC[perfil.fator_primario].decisao}
                  </td>
                  <td className="px-6 py-3 text-ink-soft">
                    {formatarData(perfil.data_avaliacao)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <p className="mt-6 text-xs text-ink-muted">
        Perfil comportamental descreve estilo de trabalho, não desempenho: não
        existe fator melhor ou pior, e o perfil nunca deve ser usado sozinho em
        decisão de contratação, promoção ou desligamento. O mapa aponta a
        composição das equipes; a leitura é sempre contextual.
      </p>
    </>
  );
}
