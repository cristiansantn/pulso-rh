import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { MovimentacaoForm } from "@/components/pessoas/movimentacao-form";
import { PageHeader } from "@/components/ui/page-header";
import { registrarMovimentacaoAction } from "@/app/(app)/pessoas/actions";
import { buscarColaborador } from "@/lib/data/colaboradores";
import { listarCargos, listarSetores } from "@/lib/data/setores";
import { TURNOS } from "@/lib/data/tipos";
import { hojeIso } from "@/lib/datas";

const MENSAGENS_ERRO: Record<string, string> = {
  obrigatorios: "Escolha o tipo, a data e o destino da movimentação.",
  data: "A data da movimentação não pode ser no futuro.",
};

export default async function MovimentacaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { id } = await params;
  const { erro } = await searchParams;

  const [colaborador, cargos, setores] = await Promise.all([
    buscarColaborador(id),
    listarCargos(),
    listarSetores(),
  ]);

  if (!colaborador) {
    notFound();
  }

  return (
    <>
      <Link
        href={`/pessoas/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} />
        {colaborador.nome}
      </Link>

      <PageHeader
        titulo="Registrar movimentação"
        descricao="Uma promoção, transferência de setor ou mudança de turno no histórico de carreira da pessoa."
      />

      {erro && MENSAGENS_ERRO[erro] && (
        <p className="mb-4 rounded-md bg-negative-soft px-4 py-2.5 text-sm text-negative">
          {MENSAGENS_ERRO[erro]}
        </p>
      )}

      <MovimentacaoForm
        acao={registrarMovimentacaoAction}
        colaboradorId={id}
        cargos={cargos.map((c) => c.nome).sort((a, b) => a.localeCompare(b))}
        setores={setores.map((s) => s.nome).sort((a, b) => a.localeCompare(b))}
        atual={{
          cargo: colaborador.cargo?.nome ?? null,
          setor: colaborador.setor?.nome ?? null,
          turno: colaborador.turno ? TURNOS[colaborador.turno] : null,
        }}
        hoje={hojeIso()}
      />
    </>
  );
}
