import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Input, Label, Select } from "@/components/ui/form";
import { buscarColaborador } from "@/lib/data/colaboradores";
import { MOTIVOS_DESLIGAMENTO, TIPOS_DESLIGAMENTO } from "@/lib/data/tipos";
import { desligarColaborador } from "../../actions";

export default async function DesligarColaboradorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const [{ id }, { erro }] = await Promise.all([params, searchParams]);
  const colaborador = await buscarColaborador(id);

  if (!colaborador) {
    notFound();
  }
  if (colaborador.status === "desligado") {
    redirect(`/pessoas/${id}`);
  }

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        titulo="Registrar desligamento"
        descricao={`${colaborador.nome} — matrícula ${colaborador.matricula}`}
      />

      {erro === "obrigatorios" && (
        <p className="mb-4 rounded-md bg-negative-soft px-4 py-2.5 text-sm text-negative">
          Data, tipo e motivo são obrigatórios.
        </p>
      )}

      <div className="max-w-xl rounded-lg border border-line bg-panel p-6">
        <p className="mb-5 rounded-md bg-warning-soft px-3 py-2 text-sm text-warning">
          O motivo declarado alimenta os indicadores de turnover. Registre o que
          foi informado pela pessoa, não uma interpretação.
        </p>

        <form action={desligarColaborador.bind(null, id)} className="space-y-4">
          <div>
            <Label htmlFor="data_desligamento">Data do desligamento *</Label>
            <Input
              id="data_desligamento"
              name="data_desligamento"
              type="date"
              required
              defaultValue={hoje}
            />
          </div>
          <div>
            <Label htmlFor="tipo_desligamento">Tipo *</Label>
            <Select id="tipo_desligamento" name="tipo_desligamento" required defaultValue="">
              <option value="" disabled>
                Selecione
              </option>
              {Object.entries(TIPOS_DESLIGAMENTO).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="motivo_desligamento">Motivo declarado *</Label>
            <Select
              id="motivo_desligamento"
              name="motivo_desligamento"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Selecione
              </option>
              {Object.entries(MOTIVOS_DESLIGAMENTO).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="rounded-md bg-negative px-5 py-2 text-sm font-medium text-panel transition-opacity hover:opacity-90"
            >
              Confirmar desligamento
            </button>
            <Link
              href={`/pessoas/${id}`}
              className="rounded-md border border-line px-5 py-2 text-sm text-ink-soft transition-colors hover:bg-neutral-soft/60"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
