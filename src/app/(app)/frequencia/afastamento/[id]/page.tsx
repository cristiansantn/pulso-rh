import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/ui/page-header";
import { buscarColaborador } from "@/lib/data/colaboradores";
import { buscarAfastamento } from "@/lib/data/frequencia";
import { CATEGORIAS_AFASTAMENTO, TIPOS_AFASTAMENTO } from "@/lib/data/tipos";
import { formatarDataBr, hojeIso } from "@/lib/datas";

function Campo({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{rotulo}</dt>
      <dd className="mt-0.5 text-sm text-ink">{valor ?? "—"}</dd>
    </div>
  );
}

/** Ficha do afastamento ou atestado, com os detalhes que a lista nao mostra. */
export default async function FichaAfastamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const afastamento = await buscarAfastamento(id);
  if (!afastamento) notFound();

  const colaborador = await buscarColaborador(afastamento.colaborador_id);

  const hoje = hojeIso();
  const emCurso =
    afastamento.data_inicio <= hoje &&
    (afastamento.data_fim === null || afastamento.data_fim >= hoje);

  return (
    <>
      <Link
        href="/frequencia"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} />
        Escala & Frequência
      </Link>

      <PageHeader
        titulo={`${TIPOS_AFASTAMENTO[afastamento.tipo]} — ${colaborador?.nome ?? "Associado"}`}
        descricao="Detalhes do registro. Quando houver papéis de acesso, esta ficha passa a ser restrita (LGPD)."
      >
        {emCurso && (
          <span className="inline-flex rounded-full bg-warning-soft px-3 py-1 text-xs font-medium text-warning">
            Em curso
          </span>
        )}
      </PageHeader>

      <section className="max-w-3xl rounded-lg border border-line bg-panel p-6">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
          <Campo
            rotulo="Associado"
            valor={
              colaborador ? `${colaborador.nome} — ${colaborador.matricula}` : null
            }
          />
          <Campo rotulo="Tipo" valor={TIPOS_AFASTAMENTO[afastamento.tipo]} />
          <Campo
            rotulo="Categoria"
            valor={CATEGORIAS_AFASTAMENTO[afastamento.categoria]}
          />
          <Campo rotulo="Início" valor={formatarDataBr(afastamento.data_inicio)} />
          <Campo
            rotulo="Retorno previsto"
            valor={
              afastamento.data_fim
                ? formatarDataBr(afastamento.data_fim)
                : "Indeterminado"
            }
          />
          <Campo rotulo="CID" valor={afastamento.cid} />
          <Campo rotulo="Médico" valor={afastamento.medico} />
        </dl>
        {colaborador && (
          <p className="mt-6 border-t border-line pt-4 text-xs text-ink-muted">
            O histórico completo da pessoa fica na{" "}
            <Link
              href={`/pessoas/${colaborador.id}`}
              className="font-medium text-ink-soft underline-offset-2 hover:underline"
            >
              ficha individual
            </Link>
            .
          </p>
        )}
      </section>
    </>
  );
}
