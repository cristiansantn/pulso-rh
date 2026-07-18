import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import {
  IndicadorForm,
  type PessoaOpcao,
} from "@/components/performance/indicador-form";
import { PageHeader } from "@/components/ui/page-header";
import { listarColaboradores } from "@/lib/data/colaboradores";
import { INDICADORES, type TipoIndicador } from "@/lib/data/tipos";
import { hojeIso } from "@/lib/datas";

const MENSAGENS_ERRO: Record<string, string> = {
  obrigatorios: "Preencha associado, competência, indicador e um valor válido.",
  setor: "O indicador escolhido não pertence ao setor do associado.",
};

const SETORES_COM_INDICADOR = new Set(
  (Object.keys(INDICADORES) as TipoIndicador[]).map((t) => INDICADORES[t].setor),
);

export default async function LancarIndicadorPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const colaboradores = await listarColaboradores();

  // So setores que coletam indicador; os demais nao tem o que lancar.
  const pessoas: PessoaOpcao[] = colaboradores
    .filter(
      (c) =>
        c.status !== "desligado" &&
        c.setor?.nome &&
        SETORES_COM_INDICADOR.has(c.setor.nome),
    )
    .map((c) => ({
      id: c.id,
      nome: c.nome,
      matricula: c.matricula,
      setorNome: c.setor?.nome as string,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <>
      <Link
        href="/performance"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} />
        Performance
      </Link>

      <PageHeader
        titulo="Lançar indicador"
        descricao="Valor mensal de um indicador do setor do associado. Relançar a mesma competência e indicador substitui o valor anterior."
      />

      {erro && MENSAGENS_ERRO[erro] && (
        <p className="mb-4 rounded-md bg-negative-soft px-4 py-2.5 text-sm text-negative">
          {MENSAGENS_ERRO[erro]}
        </p>
      )}

      <IndicadorForm pessoas={pessoas} competenciaInicial={hojeIso().slice(0, 7)} />
    </>
  );
}
