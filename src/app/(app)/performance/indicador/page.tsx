import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { BotaoEnviar } from "@/components/ui/botao-enviar";
import { Fieldset, Input, Label, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { listarColaboradores } from "@/lib/data/colaboradores";
import { INDICADORES, type TipoIndicador } from "@/lib/data/tipos";
import { hojeIso } from "@/lib/datas";
import { lancarIndicador } from "../actions";

const MENSAGENS_ERRO: Record<string, string> = {
  obrigatorios: "Preencha associado, competência, indicador e um valor válido.",
};

export default async function LancarIndicadorPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const colaboradores = await listarColaboradores();
  const quadroAtual = colaboradores
    .filter((c) => c.status !== "desligado")
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const tipos = Object.keys(INDICADORES) as TipoIndicador[];

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
        descricao="Valor mensal de um indicador operacional para uma pessoa. Relançar a mesma competência e indicador substitui o valor anterior."
      />

      {erro && MENSAGENS_ERRO[erro] && (
        <p className="mb-4 rounded-md bg-negative-soft px-4 py-2.5 text-sm text-negative">
          {MENSAGENS_ERRO[erro]}
        </p>
      )}

      <form action={lancarIndicador} className="max-w-3xl space-y-6">
        <Fieldset legenda="Indicador mensal">
          <div className="sm:col-span-2">
            <Label htmlFor="colaborador_id">Associado</Label>
            <Select id="colaborador_id" name="colaborador_id" required defaultValue="">
              <option value="" disabled>
                Selecione
              </option>
              {quadroAtual.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} — {c.matricula}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="competencia">Competência</Label>
            <Input
              id="competencia"
              name="competencia"
              type="month"
              required
              defaultValue={hojeIso().slice(0, 7)}
            />
          </div>
          <div>
            <Label htmlFor="tipo">Indicador</Label>
            <Select id="tipo" name="tipo" required defaultValue="">
              <option value="" disabled>
                Selecione
              </option>
              {tipos.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {INDICADORES[tipo].rotulo}
                  {INDICADORES[tipo].unidade ? ` (${INDICADORES[tipo].unidade})` : ""}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="valor">Valor</Label>
            <Input
              id="valor"
              name="valor"
              type="text"
              inputMode="decimal"
              placeholder="Ex.: 53,1"
              required
            />
            <p className="mt-1 text-xs text-ink-muted">
              Use o valor na unidade do indicador (percentuais como número, ex.: 24,5).
            </p>
          </div>
        </Fieldset>

        <div className="flex items-center gap-3">
          <BotaoEnviar className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-panel transition-opacity hover:opacity-90 disabled:opacity-70">
            Lançar
          </BotaoEnviar>
          <Link
            href="/performance"
            className="rounded-md border border-line px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-neutral-soft/60"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}
