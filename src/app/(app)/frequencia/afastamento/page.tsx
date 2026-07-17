import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/ui/page-header";
import { Fieldset, Input, Label, Select } from "@/components/ui/form";
import { listarColaboradores } from "@/lib/data/colaboradores";
import { CATEGORIAS_AFASTAMENTO, TIPOS_AFASTAMENTO } from "@/lib/data/tipos";
import { hojeIso } from "@/lib/datas";
import { registrarAfastamento } from "../actions";

const MENSAGENS_ERRO: Record<string, string> = {
  obrigatorios: "Preencha associado, tipo, categoria e data de início.",
  periodo: "O retorno previsto não pode ser anterior à data de início.",
};

export default async function NovoAfastamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const colaboradores = await listarColaboradores();
  const quadroAtual = colaboradores.filter((c) => c.status !== "desligado");

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
        titulo="Registrar afastamento ou atestado"
        descricao="A categoria é uma lista controlada. Não registre diagnóstico, CID ou qualquer detalhe de saúde — LGPD."
      />

      {erro && MENSAGENS_ERRO[erro] && (
        <p className="mb-4 rounded-md bg-negative-soft px-4 py-2.5 text-sm text-negative">
          {MENSAGENS_ERRO[erro]}
        </p>
      )}

      <form action={registrarAfastamento} className="max-w-3xl space-y-6">
        <Fieldset legenda="Afastamento">
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
            <Label htmlFor="tipo">Tipo</Label>
            <Select id="tipo" name="tipo" required defaultValue="">
              <option value="" disabled>
                Selecione
              </option>
              {Object.entries(TIPOS_AFASTAMENTO).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="categoria">Categoria</Label>
            <Select id="categoria" name="categoria" required defaultValue="">
              <option value="" disabled>
                Selecione
              </option>
              {Object.entries(CATEGORIAS_AFASTAMENTO).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="data_inicio">Data de início</Label>
            <Input
              id="data_inicio"
              name="data_inicio"
              type="date"
              required
              defaultValue={hojeIso()}
            />
          </div>
          <div>
            <Label htmlFor="data_fim">Retorno previsto</Label>
            <Input id="data_fim" name="data_fim" type="date" />
            <p className="mt-1 text-xs text-ink-muted">
              Deixe em branco quando indeterminado.
            </p>
          </div>
        </Fieldset>

        <p className="text-xs text-ink-muted">
          Afastamentos em curso mudam o status do associado para Afastado; o
          retorno é registrado na ficha individual.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-panel transition-opacity hover:opacity-90"
          >
            Registrar
          </button>
          <Link
            href="/frequencia"
            className="rounded-md border border-line px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-neutral-soft/60"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}
